use crate::state::read_state;
use crate::utils::constants::{EVM_RPC, TRANSFER_EVENT_SIGNATURE};
use crate::utils::encoding::decode_create_transaction_args_from_input;
use crate::utils::rpc::{
    estimate_transaction_fees_bsc, fetch_gas_price_safe, fetch_nonce_safe,
    get_transaction_by_hash_rpc, get_transaction_receipt_rpc,
};
use crate::utils::token::{
    calculate_base_amount_from_sent, check_slippage_tolerance_usd, get_supported_pairs,
    get_supported_tokens, get_token_price,
};
use crate::utils::types::{
    CreateTransactionArgs, RpcLog, RpcTransaction, RpcTransactionReceipt, SwapResponse, SwapResult,
    Token, TransactionData, TransactionResponse, InitArg, string_to_alloy_address,
};
use crate::wallet::BscWallet;
use alloy_consensus::{SignableTransaction, TxEip1559, TxLegacy, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address as AlloyAddress, Signature, U256};
use candid::Principal;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use evm_rpc_canister_types::{RpcApi, RpcService, RequestResult};
use std::cell::RefCell;
use std::str::FromStr;

thread_local! {
    pub static SWAP_HISTORY: RefCell<Vec<SwapResponse>> = RefCell::new(Vec::new());
}

pub async fn create_transaction(
    args: CreateTransactionArgs,
) -> Result<TransactionResponse, String> {
    if args.token_in_address.eq_ignore_ascii_case(&args.token_out_address) {
        return Err("Token In and Token Out addresses cannot be the same.".to_string());
    }

    let supported_tokens = get_supported_tokens();
    let supported_pairs = get_supported_pairs();

    let pair = supported_pairs
        .iter()
        .find(|p| p.pool_id == args.pool_id)
        .ok_or_else(|| format!("Pool ID '{}' not found in supported pairs", args.pool_id))?;

    let token_in = supported_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&args.token_in_address)
            }) && t.token_chain == args.source_chain
        })
        .ok_or_else(|| {
            format!(
                "Token in address '{}' on chain '{}' not found",
                args.token_in_address, args.source_chain
            )
        })?;

    let token_out = supported_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&args.token_out_address)
            }) && t.token_chain == args.destination_chain
        })
        .ok_or_else(|| {
            format!(
                "Token out address '{}' on chain '{}' not found",
                args.token_out_address, args.destination_chain
            )
        })?;

    let is_valid_pair = (token_in.token_id == pair.token_a_token_id
        && token_out.token_id == pair.token_b_token_id)
        || (token_in.token_id == pair.token_b_token_id
            && token_out.token_id == pair.token_a_token_id);

    if !is_valid_pair {
        return Err("Token pair mismatch".to_string());
    }

    if args.swap_type != pair.pair_type {
        return Err("Swap type mismatch".to_string());
    }

    let canister_address_str = BscWallet::new_canister_wallet().await.bsc_address().to_string();
    let canister_address_ic_address = ic_ethereum_types::Address::from_str(&canister_address_str)
        .map_err(|e| format!("Invalid canister address: {}", e))?;

    let amount_in_decimal =
        Decimal::from_str(&args.amount_in).map_err(|_| "Failed to parse amount_in")?;
    let adjusted_amount_decimal = amount_in_decimal * dec!(1.01);
    let scale_factor = Decimal::from(10u64.pow(token_in.token_decimals as u32));
    let amount_in_smallest_unit_decimal = adjusted_amount_decimal * scale_factor;
    let final_amount_u256 =
        U256::from_str(&amount_in_smallest_unit_decimal.trunc().to_string())
            .map_err(|_| "Failed to convert amount to U256")?;

    let json_data_string =
        serde_json::to_string(&args).map_err(|_| "Failed to serialize args")?;
    let json_data_bytes = json_data_string.as_bytes();
    let mut encoded_metadata = Vec::new();
    let len_bytes = (json_data_bytes.len() as u32).to_be_bytes();
    encoded_metadata.extend_from_slice(&len_bytes);
    encoded_metadata.extend_from_slice(json_data_bytes);

    let from_address = args.tick_in_wallet_address.clone();
    let to_address_str: String;
    let value: U256;
    let data_bytes: Vec<u8>;

    if token_in.is_native {
        to_address_str = canister_address_str.clone();
        value = final_amount_u256;
        data_bytes = encoded_metadata;
    } else {
        to_address_str = token_in
            .token_address
            .clone()
            .ok_or("Token address missing for non-native token")?;
        value = U256::ZERO;

        let method_id = hex::decode("a9059cbb").map_err(|_| "Failed to decode method ID")?;
        let mut encoded_erc20_call = method_id;

        let mut to_bytes = [0u8; 32];
        to_bytes[12..].copy_from_slice(canister_address_ic_address.as_ref());
        encoded_erc20_call.extend_from_slice(&to_bytes);

        let mut amount_bytes = [0u8; 32];
        amount_bytes.copy_from_slice(&final_amount_u256.to_be_bytes::<32>());
        encoded_erc20_call.extend_from_slice(&amount_bytes);

        encoded_erc20_call.extend_from_slice(&encoded_metadata);
        data_bytes = encoded_erc20_call;
    }

    let transaction_data = TransactionData {
        from: from_address,
        to: to_address_str,
        value: format!("0x{:x}", value),
        data: format!("0x{}", hex::encode(data_bytes)),
    };

    Ok(TransactionResponse { transaction_data })
}

pub async fn verify_and_swap(transaction_hash: String) -> SwapResult {
    let transaction_hash = transaction_hash.to_lowercase();

    let already_exists = SWAP_HISTORY.with(|h| {
        h.borrow().iter().any(|swap| {
            swap.tx_hash_in == transaction_hash || swap.tx_hash_out == transaction_hash
        })
    });
    if already_exists {
        return SwapResult::Error("Transaction already processed".to_string());
    }

    let canister_address_str = BscWallet::new_canister_wallet().await.bsc_address().to_string();
    let canister_address_bytes =
        hex::decode(canister_address_str.strip_prefix("0x").unwrap_or_default())
            .map_err(|_| "Invalid canister address hex".to_string())
            .unwrap_or_default();
            
    let receipt: RpcTransactionReceipt = match get_transaction_receipt_rpc(&transaction_hash).await {
        Ok(r) => r,
        Err(e) => return SwapResult::Error(format!("Failed to fetch transaction receipt: {}", e)),
    };

    if receipt.status != "0x1" {
        ic_cdk::println!("❌ TRANSACTION REVERTED BY BSC NETWORK. Status: {}", receipt.status);
        let tx_data_opt = get_transaction_by_hash_rpc(&transaction_hash).await.ok();
        let tx_input_str = tx_data_opt.as_ref().map_or("0x", |tx| tx.input.as_str());

        let is_erc20 = tx_data_opt.as_ref()
            .and_then(|tx| tx.to.as_ref())
            .map_or(false, |to_addr| to_addr.to_lowercase() != canister_address_str.to_lowercase())
            && tx_input_str.starts_with("0xa9059cbb");

        let decoded_args_res = decode_create_transaction_args_from_input(tx_input_str, is_erc20);

        let swap_response_for_revert = if let Ok(args) = decoded_args_res {
            let all_tokens = get_supported_tokens();
            let token_in_opt = all_tokens
                .iter()
                .find(|t| {
                    t.token_address.as_deref().map_or(false, |addr| {
                        addr.eq_ignore_ascii_case(&args.token_in_address)
                    })
                });

            let amount_in_display = if let Some(t_in) = token_in_opt {
                let tx_value_u256 = tx_data_opt.as_ref().and_then(|tx| U256::from_str_radix(tx.value.strip_prefix("0x").unwrap_or("0"), 16).ok()).unwrap_or_default();
                let actual_amount_smallest_unit = if t_in.is_native {
                    tx_value_u256
                } else {
                    receipt.logs.iter()
                        .filter(|log| log.topics.len() == 3 && log.topics[0].eq_ignore_ascii_case(TRANSFER_EVENT_SIGNATURE))
                        .filter_map(|log| {
                            log.data.strip_prefix("0x").and_then(|data_hex| U256::from_str_radix(data_hex, 16).ok())
                        })
                        .next().unwrap_or_default()
                };

                u256_to_decimal(actual_amount_smallest_unit, t_in.token_decimals).unwrap_or_default().to_string()
            } else {
                "Unknown".to_string()
            };

            SwapResponse::new(
                args.pool_id,
                receipt.from.to_string(),
                args.tick_out_wallet_address,
                args.swap_type,
                args.source_chain,
                args.destination_chain,
                args.token_in_address,
                args.token_out_address,
                amount_in_display,
                "0".to_string(),
                args.slippage,
                transaction_hash.clone(),
                "0x".to_string(),
                "reverted_on_chain".to_string(),
                ic_cdk::api::time(),
            )
        } else {
            SwapResponse::new(
                "unknown_pool".to_string(),
                receipt.from.to_string(),
                "unknown_recipient".to_string(),
                "unknown_swap".to_string(),
                "BSC".to_string(),
                "BSC".to_string(),
                "unknown_token".to_string(),
                "unknown_token".to_string(),
                "0".to_string(),
                "0".to_string(),
                "0".to_string(),
                transaction_hash.clone(),
                "0x".to_string(),
                "reverted_on_chain".to_string(),
                ic_cdk::api::time(),
            )
        };
        SWAP_HISTORY.with(|h| h.borrow_mut().push(swap_response_for_revert.clone()));
        return SwapResult::Success(swap_response_for_revert);
    }

    let tx: RpcTransaction = match get_transaction_by_hash_rpc(&transaction_hash).await {
        Ok(t) => t,
        Err(e) => return SwapResult::Error(format!("Failed to fetch transaction details: {}", e)),
    };

    let mut is_valid_transfer_to_canister = false;
    let mut token_in_address: String = String::new();
    let mut amount_smallest_unit: U256 = U256::ZERO;
    let mut is_erc20_transfer = false;

    for log in receipt.logs.iter() {
        if log.topics.len() == 3
            && log.topics[0].eq_ignore_ascii_case(TRANSFER_EVENT_SIGNATURE)
        {
            let recipient_from_log = match utils::encoding::decode_erc20_recipient_from_log(&log.topics[2]) {
                Ok(addr) => addr,
                Err(e) => {
                    ic_cdk::println!("Warning: Could not decode recipient from log topic: {}", e);
                    continue;
                }
            };

            if recipient_from_log.eq_ignore_ascii_case(&canister_address_str) {
                token_in_address = log.address.clone();
                amount_smallest_unit =
                    U256::from_str_radix(log.data.strip_prefix("0x").unwrap_or("0"), 16)
                        .unwrap_or_default();
                is_valid_transfer_to_canister = true;
                is_erc20_transfer = true;
                break;
            }
        }
    }

    if !is_valid_transfer_to_canister {
        if tx.to.as_deref().map_or(false, |to| {
            to.eq_ignore_ascii_case(&canister_address_str)
        }) && U256::from_str_radix(tx.value.strip_prefix("0x").unwrap_or("0"), 16)
            .unwrap_or_default()
            > U256::ZERO
        {
            token_in_address = "0x0000000000000000000000000000000000000000b".to_string();
            amount_smallest_unit =
                U256::from_str_radix(tx.value.strip_prefix("0x").unwrap_or("0"), 16)
                    .unwrap_or_default();
            is_valid_transfer_to_canister = true;
            is_erc20_transfer = false;
        }
    }

    if !is_valid_transfer_to_canister {
        return SwapResult::Error(
            "No valid BNB or BEP20 transfer to the canister was found in the transaction."
                .to_string(),
        );
    }

    match execute_swap_or_refund_with_response(
        &tx.input,
        &token_in_address,
        amount_smallest_unit,
        &transaction_hash,
        &receipt.from,
        is_erc20_transfer,
    )
    .await
    {
        Ok(swap_response) => {
            SWAP_HISTORY.with(|h| h.borrow_mut().push(swap_response.clone()));
            SwapResult::Success(swap_response)
        }
        Err(e) => SwapResult::Error(e),
    }
}

async fn execute_swap_or_refund_with_response(
    tx_input: &str,
    token_in_address: &str,
    amount_smallest_unit: U256,
    tx_hash_in: &str,
    from_address: &str,
    is_erc20_transfer: bool,
) -> Result<SwapResponse, String> {
    let decoded_args = decode_create_transaction_args_from_input(tx_input, is_erc20_transfer)?;

    let all_tokens = get_supported_tokens();
    let token_in = all_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addr.eq_ignore_ascii_case(token_in_address))
        })
        .ok_or_else(|| format!("Token In '{}' not supported", token_in_address))?;
    let token_out = all_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&decoded_args.token_out_address)
            })
        })
        .ok_or_else(|| {
            format!(
                "Token Out '{}' not supported",
                decoded_args.token_out_address
            )
        })?;

    let human_readable_amount =
        u256_to_decimal(amount_smallest_unit, token_in.token_decimals)?;
    let base_amount = calculate_base_amount_from_sent(&human_readable_amount);

    let current_timestamp = ic_cdk::api::time();

    let price_in = get_token_price(&token_in.price_feed_id).await?;
    let price_out = get_token_price(&token_out.price_feed_id).await?;

    let usd_sent = base_amount.to_f64().unwrap_or(0.0) * price_in;
    let calculated_tick_out_decimal = Decimal::from_f64(usd_sent / price_out)
        .ok_or("Failed to convert USD value to Decimal for calculated_tick_out")?
        .round_dp(6);

    let expected_amount_out_decimal =
        Decimal::from_str(&decoded_args.expected_amount_out).unwrap_or_default();
    let slippage_percent = Decimal::from_str(&decoded_args.slippage).unwrap_or(Decimal::ZERO);

    let (can_swap, percent_difference) = check_slippage_tolerance_usd(
        usd_sent,
        &calculated_tick_out_decimal,
        price_out,
        &slippage_percent,
    );

    let mut final_tx_hash_out = "0x0".to_string();
    let mut final_status = "reverted".to_string();
    let mut final_amount_out = human_readable_amount.to_string();

    if !can_swap {
        ic_cdk::println!("❌ SWAP REVERTED: Slippage tolerance exceeded!");
        ic_cdk::println!("   - Slippage Tolerance: {}%", slippage_percent);
        ic_cdk::println!("   - Actual Difference: {:.6}%", percent_difference);
        ic_cdk::println!("   - Initiating refund...");

        let refund_amount_u256 = amount_smallest_unit;
        let recipient_address_alloy = string_to_alloy_address(from_address)?;

        final_tx_hash_out = if token_in.is_native {
            send_native_bnb_safe(recipient_address_alloy, refund_amount_u256).await?
        } else {
            let token_contract = string_to_alloy_address(token_in.token_address.as_deref().unwrap_or_default())?;
            send_bep20_token_safe(token_contract, recipient_address_alloy, refund_amount_u256).await?
        };
        ic_cdk::println!("   ↩️ Refund transaction sent! Hash: {}", final_tx_hash_out);
    } else {
        ic_cdk::println!("✅ Transaction Verified!");
        ic_cdk::println!(
            "   - Token Sent: {} ({})",
            token_in.token_symbol,
            token_in_address
        );
        ic_cdk::println!(
            "   - Amount Sent (with 1% fee): {} (Smallest Unit: {})",
            human_readable_amount,
            amount_smallest_unit
        );
        ic_cdk::println!("   - Base Amount (original): {}", base_amount);
        ic_cdk::println!("   - Fee (1%): {}", human_readable_amount - base_amount);
        ic_cdk::println!("   - Token In Price: ${}", price_in);
        ic_cdk::println!("   - USD Value Sent: ~${:.6}", usd_sent);
        ic_cdk::println!("   ---------------------------------");
        ic_cdk::println!(
            "   - Expected Token Out: {} ({})",
            token_out.token_symbol,
            token_out.token_address.as_deref().unwrap_or("N/A")
        );
        ic_cdk::println!(
            "   - Expected Amount Out: {}",
            expected_amount_out_decimal
        );
        ic_cdk::println!("   - Calculated Tick Out Amount: {}", calculated_tick_out_decimal);
        ic_cdk::println!("   - Token Out Price: ${}", price_out);
        ic_cdk::println!("   ---------------------------------");
        ic_cdk::println!("   - Slippage Tolerance: {}%", slippage_percent);
        ic_cdk::println!("   - Actual Difference: {:.6}%", percent_difference);
        ic_cdk::println!("   ✅ SWAP APPROVED - Difference is within slippage tolerance. Initiating swap...");

        let out_amount_u256 = decimal_to_u256(calculated_tick_out_decimal, token_out.token_decimals)?;
        let recipient_address_alloy = string_to_alloy_address(&decoded_args.tick_out_wallet_address)?;

        final_tx_hash_out = if token_out.is_native {
            send_native_bnb_safe(recipient_address_alloy, out_amount_u256).await?
        } else {
            let token_contract = string_to_alloy_address(token_out.token_address.as_deref().unwrap_or_default())?;
            send_bep20_token_safe(token_contract, recipient_address_alloy, out_amount_u256).await?
        };
        ic_cdk::println!("   🚀 Swap transaction sent! Hash: {}", final_tx_hash_out);

        final_status = "swap".to_string();
        final_amount_out = calculated_tick_out_decimal.to_string();
    }

    Ok(SwapResponse::new(
        decoded_args.pool_id,
        from_address.to_string(),
        decoded_args.tick_out_wallet_address,
        decoded_args.swap_type,
        decoded_args.source_chain,
        decoded_args.destination_chain,
        decoded_args.token_in_address,
        decoded_args.token_out_address,
        base_amount.to_string(),
        final_amount_out,
        decoded_args.slippage,
        tx_hash_in.to_string(),
        final_tx_hash_out,
        final_status,
        current_timestamp,
    ))
}

async fn sign_and_send_raw_transaction_bsc(transaction: TxEip1559) -> Result<String, String> {
    let wallet = BscWallet::new_canister_wallet().await;
    let tx_hash_pre_sign = transaction.signature_hash().0;

    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash_pre_sign).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .map_err(|e| format!("BUG: failed to create a signature: {}", e))?;
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    ic_cdk::println!(
        "Attempting to send raw transaction with calculated hash: {}",
        raw_transaction_hash
    );

    let bnb_rpc_service = RpcService::Custom(RpcApi {
        url: read_state(|s| s.bsc_rpc_url()).to_string(),
        headers: Some(vec![
            ic_cdk::api::management_canister::http_request::HttpHeader {
                name: "x-api-key".to_string(),
                value: crate::utils::constants::TATUM_API_KEY.to_string(),
            },
        ]),
    });

    let json_request = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    let max_response_size_bytes = 2000_u64;
    let num_cycles = 5_000_000_000u128;

    let (response_result,) = EVM_RPC
        .request(bnb_rpc_service, json_request, max_response_size_bytes, num_cycles)
        .await
        .map_err(|e| format!("EVM_RPC canister call failed: {:?}", e))?;

    match response_result {
        RequestResult::Ok(tx_result_json_str) => {
            let rpc_response: serde_json::Value = serde_json::from_str(&tx_result_json_str)
                .map_err(|e| format!("Failed to parse EVM_RPC response: {}", e))?;

            if let Some(error) = rpc_response.get("error") {
                if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                    if message.contains("already known") ||
                       message.contains("ALREADY_EXISTS") ||
                       message.contains("replacement transaction underpriced") {
                        ic_cdk::println!("Transaction already known/exists: {}. Returning its hash.", message);
                        return Ok(format!("0x{:x}", raw_transaction_hash));
                    }
                }
                return Err(format!("RPC error sending BSC transaction: {}", error));
            }

            rpc_response.get("result")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| format!("No transaction hash in BSC RPC response. Raw response: {}", tx_result_json_str))
        }
        RequestResult::Err(e) => {
            Err(format!("EVM_RPC returned an error result: {:?}", e))
        }
    }
}

async fn send_native_bnb_safe(to: AlloyAddress, amount: U256) -> Result<String, String> {
    let canister_address = BscWallet::new_canister_wallet().await.bsc_address().to_string();

    let nonce = fetch_nonce_safe(&canister_address).await?;
    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees_bsc();
    let chain_id = read_state(|s| s.bsc_network().bsc_chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    sign_and_send_raw_transaction_bsc(transaction).await
}

async fn send_bep20_token_safe(
    token_contract: AlloyAddress,
    to: AlloyAddress,
    amount: U256,
) -> Result<String, String> {
    let canister_address = BscWallet::new_canister_wallet().await.bsc_address().to_string();

    let nonce = fetch_nonce_safe(&canister_address).await?;
    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees_bsc();
    let chain_id = read_state(|s| s.bsc_network().bsc_chain_id());

    let method_id = hex::decode("a9059cbb").map_err(|_| "Failed to decode method ID for BEP20")?;
    let mut encoded = method_id;

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: encoded.into(),
    };

    sign_and_send_raw_transaction_bsc(transaction).await
}