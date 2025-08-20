use crate::state::read_state;
use crate::utils::token::{
    decimal_to_u256, extract_actual_amount_from_tx, get_supported_pairs, get_supported_tokens,
    get_token_price, u256_to_decimal,
};
use crate::utils::types::{
    ChainType, CreateTransactionArgs, SwapResponse, SwapResult, Token, TransactionData,
    TransactionResponse, VerifyAndSwapArgs,
};
use crate::wallet::{BscWallet, EthereumWallet};
use crate::utils::rpc::{
    estimate_transaction_fees_bsc, fetch_nonce_bsc_robust, fetch_nonce_eth, get_dynamic_fees,
    get_transaction_by_hash_on_chain, get_transaction_receipt_on_chain,
};
use crate::utils::encoding::{decode_erc20_recipient, decode_transaction_data};
use crate::utils::http::call_rpc_with_retry;

use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address, Signature, U256};
use alloy_sol_types::{sol, SolCall};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::str::FromStr;
use std::cell::RefCell;

sol! {
    interface IERC20 {
        function transfer(address to, uint256 amount) external returns (bool);
    }
}

thread_local! {
    pub static SWAP_HISTORY: RefCell<Vec<SwapResponse>> = RefCell::new(Vec::new());
}

pub async fn create_transaction(args: CreateTransactionArgs) -> Result<TransactionResponse, String> {
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

    let is_valid_pair =
        (token_in.token_id == pair.token_a_token_id && token_out.token_id == pair.token_b_token_id) ||
        (token_in.token_id == pair.token_b_token_id && token_out.token_id == pair.token_a_token_id);

    if !is_valid_pair {
        return Err("Token pair mismatch".to_string());
    }

    if args.swap_type != pair.pair_type {
        return Err("Swap type mismatch".to_string());
    }

    let (canister_address_str, chain_id, tx_type, blockchain) = match args.source_chain.as_str() {
        "Binance Smart Chain" => {
            let addr = BscWallet::new_canister_wallet().await.bsc_address().to_string();
            (addr, 97u64, "legacy".to_string(), "BSC".to_string())
        }
        "Ethereum" => {
            let addr = EthereumWallet::new_canister_wallet().await.ethereum_address().to_string();
            let chain_id = read_state(|s| s.ethereum_network().chain_id());
            (addr, chain_id, "eip1559".to_string(), "Ethereum".to_string())
        }
        _ => return Err(format!("Unsupported source chain: {}", args.source_chain)),
    };

    let canister_address_ic_address = ic_ethereum_types::Address::from_str(&canister_address_str)
        .map_err(|e| format!("Invalid canister address: {}", e))?;

    let amount_in_decimal = Decimal::from_str(&args.amount_in)
        .map_err(|_| "Failed to parse amount_in")?;
    let adjusted_amount_decimal = amount_in_decimal * dec!(1.01);
    let scale_factor = Decimal::from(10u64.pow(token_in.token_decimals as u32));
    let amount_in_smallest_unit_decimal = adjusted_amount_decimal * scale_factor;
    let amount_in_smallest_unit = amount_in_smallest_unit_decimal.trunc();
    let final_amount_u256 = U256::from_str(&amount_in_smallest_unit.to_string())
        .map_err(|_| "Failed to convert amount to U256")?;

    let json_data_string = serde_json::to_string(&args)
        .map_err(|_| "Failed to serialize args")?;
    let json_data_bytes = json_data_string.as_bytes();

    let (to_address_str, value, data_bytes, gas_limit) = if token_in.is_native {
        let data_bytes = json_data_bytes.to_vec();

        let data_gas: u128 = data_bytes.iter().map(|&b| if b == 0 { 4 } else { 16 }).sum();
        let base_gas = 21_000;
        let total_gas = base_gas + data_gas as u64;

        (
            canister_address_str.clone(),
            final_amount_u256,
            data_bytes,
            format!("0x{:x}", total_gas)
        )
    } else {
        let method_id = hex::decode("a9059cbb")
            .map_err(|_| "Failed to decode method ID")?;
        let mut encoded = method_id;

        let mut to_bytes = [0u8; 32];
        to_bytes[12..].copy_from_slice(canister_address_ic_address.as_ref());
        encoded.extend_from_slice(&to_bytes);

        let mut amount_bytes = [0u8; 32];
        amount_bytes.copy_from_slice(&final_amount_u256.to_be_bytes::<32>());
        encoded.extend_from_slice(&amount_bytes);

        encoded.extend_from_slice(json_data_bytes);
        
        let data_gas: u128 = encoded.iter().map(|&b| if b == 0 { 4 } else { 16 }).sum();
        let base_gas = 65_000;
        let total_gas = base_gas + data_gas as u64;

        (
            token_in.token_address.clone().ok_or("Token address not found for non-native token")?,
            U256::ZERO,
            encoded,
            format!("0x{:x}", total_gas)
        )
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;

    let nonce_val = if blockchain == "Ethereum" {
        fetch_nonce_eth(&args.tick_in_wallet_address).await.unwrap_or(0)
    } else {
        fetch_nonce_bsc_robust(&args.tick_in_wallet_address).await.unwrap_or(0)
    };

    let transaction_data = TransactionData {
        tx_type,
        blockchain,
        from: args.tick_in_wallet_address.clone(),
        to: to_address_str,
        value: format!("0x{:x}", value),
        data: format!("0x{}", hex::encode(data_bytes)),
        gas_limit,
        max_priority_fee_per_gas: format!("0x{:x}", max_priority_fee_per_gas),
        max_fee_per_gas: format!("0x{:x}", max_fee_per_gas),
        nonce: format!("0x{:x}", nonce_val),
        chain_id,
    };

    Ok(TransactionResponse { transaction_data })
}

pub async fn verify_and_swap(args: VerifyAndSwapArgs) -> SwapResult {
    let transaction_hash = args.transaction_hash.to_lowercase();

    if !transaction_hash.starts_with("0x") || transaction_hash.len() != 66 {
        return SwapResult::Error("Invalid transaction hash format".to_string());
    }

    let already_exists = SWAP_HISTORY.with(|h| {
        h.borrow().iter().any(|swap| {
            swap.tx_hash_in == transaction_hash || swap.tx_hash_out == transaction_hash
        })
    });
    if already_exists {
        return SwapResult::Error("Transaction already processed".to_string());
    }

    let chain = match args.source_chain.to_lowercase().as_str() {
        "ethereum" => ChainType::Ethereum,
        "binance smart chain" | "bsc" => ChainType::BSC,
        _ => {
            return SwapResult::Error("Unsupported source chain".to_string());
        }
    };

    let canister_address_str = match chain {
        ChainType::Ethereum => EthereumWallet::new_canister_wallet().await.ethereum_address().to_string().to_lowercase(),
        ChainType::BSC => BscWallet::new_canister_wallet().await.bsc_address().to_string().to_lowercase(),
    };

    let tx_data = match get_transaction_by_hash_on_chain(&args.transaction_hash, chain.clone()).await {
        Ok(tx) => tx,
        Err(e) => {
            return SwapResult::Error(format!("Failed to get transaction data: {}", e));
        }
    };

    let tx_receipt = match get_transaction_receipt_on_chain(&args.transaction_hash, chain.clone()).await {
        Ok(receipt) => receipt,
        Err(e) => return SwapResult::Error(format!("Failed to get transaction receipt: {}", e)),
    };

    if tx_receipt.status != "0x1" {
        return SwapResult::Error(format!("Source chain transaction failed with status: {}", tx_receipt.status));
    }

    let tx_to_address = tx_data.to
        .map(|s| s.to_lowercase())
        .unwrap_or_else(|| String::new());

    let from_address = tx_data.from.to_lowercase();

    let (is_valid_transaction, swap_args_option) = if tx_to_address == canister_address_str {
        let swap_args = decode_transaction_data(&serde_json::to_value(&tx_data.input).unwrap_or_default()).await;
        (true, swap_args)
    } else {
        let input_data = &serde_json::to_value(&tx_data.input).unwrap_or_default();
        if let Some(input_str) = input_data.as_str() {
            if input_str.len() > 10 && input_str.starts_with("0xa9059cbb") {
                if let Some(recipient_from_input) = decode_erc20_recipient(input_str) {
                    if recipient_from_input.to_lowercase() == canister_address_str {
                        let swap_args = decode_transaction_data(input_data).await;
                        (true, swap_args)
                    } else {
                        (false, None)
                    }
                } else {
                    (false, None)
                }
            } else {
                (false, None)
            }
        } else {
            (false, None)
        }
    };


    if !is_valid_transaction {
        return SwapResult::Error("Transaction not directed to canister address or invalid format".to_string());
    }

    if let Some(swap_args) = swap_args_option {
        let supported_tokens = get_supported_tokens();

        let token_in = supported_tokens
            .iter()
            .find(|t| {
                t.token_address.as_deref().map_or(false, |addr| {
                    addr.eq_ignore_ascii_case(&swap_args.token_in_address)
                }) && t.token_chain.to_lowercase() == swap_args.source_chain.to_lowercase()
            })
            .cloned();

        let token_out = supported_tokens
            .iter()
            .find(|t| {
                t.token_address.as_deref().map_or(false, |addr| {
                    addr.eq_ignore_ascii_case(&swap_args.token_out_address)
                }) && t.token_chain.to_lowercase() == swap_args.destination_chain.to_lowercase()
            })
            .cloned();

        let (token_in_checked, token_out_checked) = match (token_in, token_out) {
            (Some(tin), Some(tout)) => (tin, tout),
            (None, _) => return SwapResult::Error(format!("Token in not found: {}", swap_args.token_in_address)),
            (_, None) => return SwapResult::Error(format!("Token out not found: {}", swap_args.token_out_address)),
        };

        let actual_amount_received = match extract_actual_amount_from_tx(&serde_json::to_value(&tx_data).unwrap_or_default(), &token_in_checked, &canister_address_str) {
            Ok(amount) => amount,
            Err(e) => {
                return SwapResult::Error(format!("Failed to extract transaction amount: {}", e));
            }
        };

        let (tx_hash_out, status, actual_amount_out) = match swap_args.destination_chain.to_lowercase().as_str() {
            "ethereum" => {
                match handle_eth_transaction(
                    &swap_args.tick_out_wallet_address,
                    actual_amount_received,
                    &swap_args,
                    &token_in_checked,
                    &token_out_checked,
                ).await {
                    Ok((hash, status, amount)) => (hash, status, amount),
                    Err(e) => return SwapResult::Error(e),
                }
            }
            "binance smart chain" | "bsc" => {
                match handle_bsc_transaction(
                    &swap_args.tick_out_wallet_address,
                    actual_amount_received,
                    &swap_args,
                    &token_in_checked,
                    &token_out_checked,
                ).await {
                    Ok((hash, status, amount)) => (hash, status, amount),
                    Err(e) => return SwapResult::Error(e),
                }
            }
            _ => {
                return SwapResult::Error(format!("Unsupported destination chain: {}", swap_args.destination_chain));
            }
        };

        let swap_response = SwapResponse {
            pool_id: swap_args.pool_id,
            tick_in_wallet_address: from_address,
            tick_out_wallet_address: swap_args.tick_out_wallet_address,
            swap_type: swap_args.swap_type,
            source_chain: chain.name().to_string(),
            destination_chain: swap_args.destination_chain,
            token_in_address: swap_args.token_in_address,
            token_out_address: swap_args.token_out_address,
            amount_in: u256_to_decimal(actual_amount_received, token_in_checked.token_decimals)
                .unwrap_or(Decimal::ZERO)
                .to_string(),
            amount_out: actual_amount_out,
            slippage: swap_args.slippage,
            tx_hash_in: args.transaction_hash.to_lowercase(),
            tx_hash_out: tx_hash_out,
            status: status,
            timestamp: ic_cdk::api::time(),
        };

        SWAP_HISTORY.with(|h| h.borrow_mut().push(swap_response.clone()));

        SwapResult::Success(swap_response)
    } else {
        SwapResult::Error("Failed to parse swap arguments from metadata".to_string())
    }
}

async fn handle_eth_transaction(
    recipient_address: &str,
    actual_amount_received: U256,
    swap_args: &CreateTransactionArgs,
    token_in: &Token,
    token_out: &Token,
) -> Result<(String, String, String), String> {
    let base_amount_decimal = u256_to_decimal(actual_amount_received, token_in.token_decimals)?;
    let platform_fee_excluded = base_amount_decimal / dec!(1.01);

    let token_in_usd_value = get_token_price(&token_in.price_feed_id).await?;
    let token_out_usd_value = get_token_price(&token_out.price_feed_id).await?;

    let expected_usd_value = platform_fee_excluded * Decimal::from_f64(token_in_usd_value)
        .ok_or("Failed to convert token_in USD value to Decimal")?;

    let required_token_out_amount = expected_usd_value / Decimal::from_f64(token_out_usd_value)
        .ok_or("Failed to convert token_out USD value to Decimal")?;

    let slippage_percent = Decimal::from_str(&swap_args.slippage)
        .map_err(|_| "Invalid slippage format")?;
    let expected_amount_out_decimal = Decimal::from_str(&swap_args.expected_amount_out)
        .map_err(|_| "Invalid expected_amount_out format")?;

    let slippage_tolerance = expected_amount_out_decimal * (slippage_percent / dec!(100));
    let min_acceptable_amount_out = expected_amount_out_decimal - slippage_tolerance;
    let max_acceptable_amount_out = expected_amount_out_decimal + slippage_tolerance;

    let (tx_hash_out, status, actual_amount_out_str) = if required_token_out_amount < min_acceptable_amount_out || required_token_out_amount > max_acceptable_amount_out {
        let revert_amount_u256 = decimal_to_u256(base_amount_decimal, token_in.token_decimals)?;

        let recipient_eth_address = Address::from_str(recipient_address)
            .map_err(|_| format!("Invalid recipient address: {}", recipient_address))?;

        let tx_hash = if token_in.is_native {
            send_native_eth(recipient_eth_address, revert_amount_u256).await?
        } else {
            let token_contract = Address::from_str(token_in.token_address.as_deref().unwrap())
                .map_err(|_| format!("Invalid token contract address for refund"))?;
            send_erc20_token(token_contract, recipient_eth_address, revert_amount_u256).await?
        };

        (tx_hash, "reverted".to_string(), base_amount_decimal.to_string())
    } else {
        let swap_amount_u256 = decimal_to_u256(required_token_out_amount, token_out.token_decimals)?;

        let recipient_eth_address = Address::from_str(recipient_address)
            .map_err(|_| format!("Invalid recipient address: {}", recipient_address))?;

        let tx_hash = if token_out.is_native {
            send_native_eth(recipient_eth_address, swap_amount_u256).await?
        } else {
            let token_contract = Address::from_str(token_out.token_address.as_deref().unwrap())
                .map_err(|_| format!("Invalid token contract address for swap"))?;
            send_erc20_token(token_contract, recipient_eth_address, swap_amount_u256).await?
        };

        (tx_hash, "completed".to_string(), required_token_out_amount.to_string())
    };

    Ok((tx_hash_out, status, actual_amount_out_str))
}

async fn handle_bsc_transaction(
    recipient_address: &str,
    actual_amount_received: U256,
    swap_args: &CreateTransactionArgs,
    token_in: &Token,
    token_out: &Token,
) -> Result<(String, String, String), String> {
    let base_amount_decimal = u256_to_decimal(actual_amount_received, token_in.token_decimals)?;
    let platform_fee_excluded = base_amount_decimal / dec!(1.01);

    let token_in_usd_value = get_token_price(&token_in.price_feed_id).await?;
    let token_out_usd_value = get_token_price(&token_out.price_feed_id).await?;

    let expected_usd_value = platform_fee_excluded * Decimal::from_f64(token_in_usd_value)
        .ok_or("Failed to convert token_in USD value to Decimal")?;

    let required_token_out_amount = expected_usd_value / Decimal::from_f64(token_out_usd_value)
        .ok_or("Failed to convert token_out USD value to Decimal")?;

    let slippage_percent = Decimal::from_str(&swap_args.slippage)
        .map_err(|_| "Invalid slippage format")?;
    let expected_amount_out_decimal = Decimal::from_str(&swap_args.expected_amount_out)
        .map_err(|_| "Invalid expected_amount_out format")?;

    let slippage_tolerance = expected_amount_out_decimal * (slippage_percent / dec!(100));
    let min_acceptable_amount_out = expected_amount_out_decimal - slippage_tolerance;
    let max_acceptable_amount_out = expected_amount_out_decimal + slippage_tolerance;


    let (tx_hash_out, status, actual_amount_out_str) = if required_token_out_amount < min_acceptable_amount_out || required_token_out_amount > max_acceptable_amount_out {
        let revert_amount_u256 = decimal_to_u256(base_amount_decimal, token_in.token_decimals)?;

        let recipient_bsc_address = Address::from_str(recipient_address)
            .map_err(|_| format!("Invalid recipient address: {}", recipient_address))?;

        let tx_hash = if token_in.is_native {
            send_native_bnb(recipient_bsc_address, revert_amount_u256).await?
        } else {
            let token_contract = Address::from_str(token_in.token_address.as_deref().unwrap())
                .map_err(|_| format!("Invalid token contract address for refund"))?;
            send_bep20_token(token_contract, recipient_bsc_address, revert_amount_u256).await?
        };

        (tx_hash, "reverted".to_string(), base_amount_decimal.to_string())
    } else {
        let swap_amount_u256 = decimal_to_u256(required_token_out_amount, token_out.token_decimals)?;

        let recipient_bsc_address = Address::from_str(recipient_address)
            .map_err(|_| format!("Invalid recipient address: {}", recipient_address))?;

        let tx_hash = if token_out.is_native {
            send_native_bnb(recipient_bsc_address, swap_amount_u256).await?
        } else {
            let token_contract = Address::from_str(token_out.token_address.as_deref().unwrap())
                .map_err(|_| format!("Invalid token contract address for swap"))?;
            send_bep20_token(token_contract, recipient_bsc_address, swap_amount_u256).await?
        };

        (tx_hash, "completed".to_string(), required_token_out_amount.to_string())
    };

    Ok((tx_hash_out, status, actual_amount_out_str))
}

async fn sign_and_send_raw_transaction_eth(transaction: TxEip1559) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let tx_hash_pre_sign = transaction.signature_hash().0;

    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash_pre_sign).await;

    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .map_err(|e| format!("BUG: failed to create a signature: {}", e))?;
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    match call_rpc_with_retry(json_payload).await {
        Ok(response_body) => {
            let response: serde_json::Value = serde_json::from_str(&response_body)
                .map_err(|e| format!("Failed to parse RPC response: {}", e))?;

            if let Some(error) = response.get("error") {
                if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                    if message.contains("already known") ||
                       message.contains("ALREADY_EXISTS") ||
                       message.contains("replacement transaction underpriced") {
                        ic_cdk::println!("Transaction already known/exists: {}. Returning its hash.", message);
                        return Ok(format!("0x{:x}", raw_transaction_hash));
                    }
                }
                return Err(format!("RPC error sending ETH transaction: {}", error));
            }

            response.get("result")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| format!("No transaction hash in ETH RPC response. Raw response: {}", response_body))
        }
        Err(e) => {
            Err(format!("Failed to send raw ETH transaction: {}", e))
        }
    }
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

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    match call_rpc_with_retry(json_payload).await {
        Ok(response_body) => {
            let response: serde_json::Value = serde_json::from_str(&response_body)
                .map_err(|e| format!("Failed to parse RPC response for BSC: {}", e))?;

            if let Some(error) = response.get("error") {
                if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                    if message.contains("already known") ||
                       message.contains("ALREADY_EXISTS") ||
                       message.contains("replacement transaction underpriced") {
                        ic_cdk::println!("BSC Transaction already known/exists: {}. Returning its hash.", message);
                        return Ok(format!("0x{:x}", raw_transaction_hash));
                    }
                }
                return Err(format!("RPC error sending BSC transaction: {}", error));
            }

            response.get("result")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| format!("No transaction hash in BSC RPC response. Raw response: {}", response_body))
        }
        Err(e) => {
            Err(format!("Failed to send raw BSC transaction: {}", e))
        }
    }
}

async fn send_native_eth(to: Address, amount: U256) -> Result<String, String> {
    let canister_address = EthereumWallet::new_canister_wallet().await.ethereum_address().to_string();

    let nonce = fetch_nonce_eth(&canister_address).await?;
    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;
    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let tx = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 21000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    sign_and_send_raw_transaction_eth(tx).await
}

async fn send_erc20_token(token_contract: Address, to: Address, amount: U256) -> Result<String, String> {
    let canister_address = EthereumWallet::new_canister_wallet().await.ethereum_address().to_string();

    let nonce = fetch_nonce_eth(&canister_address).await?;
    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;
    let transfer_call = IERC20::transferCall { to, amount };
    let input_data = transfer_call.abi_encode();
    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let tx = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 100_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: input_data.into(),
    };

    sign_and_send_raw_transaction_eth(tx).await
}

async fn send_native_bnb(to: Address, amount: U256) -> Result<String, String> {
    let canister_address = BscWallet::new_canister_wallet().await.bsc_address().to_string();

    let nonce = fetch_nonce_bsc_robust(&canister_address).await?;
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

async fn send_bep20_token(token_contract: Address, to: Address, amount: U256) -> Result<String, String> {
    let canister_address = BscWallet::new_canister_wallet().await.bsc_address().to_string();

    let nonce = fetch_nonce_bsc_robust(&canister_address).await?;
    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees_bsc();

    let method_id = hex::decode("a9059cbb")
        .map_err(|_| "Failed to decode method ID for BEP20")?;
    let mut encoded = method_id;

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let chain_id = read_state(|s| s.bsc_network().bsc_chain_id());

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

pub fn get_swap_history() -> Vec<SwapResponse> {
    SWAP_HISTORY.with(|h| h.borrow().clone())
}

pub fn get_swap_history_by_address(address: String) -> Vec<SwapResponse> {
    let search_address = address.to_lowercase();
    SWAP_HISTORY.with(|h| {
        h.borrow()
            .iter()
            .filter(|swap| {
                swap.tick_in_wallet_address == search_address ||
                swap.tick_out_wallet_address == search_address
            })
            .cloned()
            .collect()
    })
}