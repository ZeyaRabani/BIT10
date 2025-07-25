use crate::state::{read_state, InitArg, EthereumNetwork, EcdsaKeyName};
use crate::utils::parsing::nat_to_u64;
use crate::wallet::eth_wallet::EthereumWallet;
use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address, Signature, U256};
use alloy_sol_types::{sol, SolCall};
use candid::{CandidType, Deserialize, Nat, Principal};
use ciborium::from_reader;
use evm_rpc_canister_types::{EvmRpcCanister, RequestResult, RpcError};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use ic_cdk::api::management_canister::http_request::{HttpHeader, HttpResponse, TransformArgs};
use num::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde::Deserialize as SerdeDeserialize;
use std::str::FromStr;
use std::time::Duration;

sol! {
    interface IERC20 {
        function transfer(address to, uint256 amount) external returns (bool);
    }
}

const TRANSFER_EVENT_SIGNATURE: &str =
    "0xhjgwehdbfjekl2y387shbdhgfbjs";

#[derive(CandidType, SerdeDeserialize, serde::Serialize, Debug, Clone)]
pub struct CreateTransactionArgs {
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub expected_amount_out: String,
    pub slippage: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionData {
    pub tx_type: String,
    pub blockchain: String,
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
    pub gas_limit: String,
    pub max_priority_fee_per_gas: String,
    pub max_fee_per_gas: String,
    pub nonce: String,
    pub chain_id: u64,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionResponse {
    pub transaction_data: TransactionData,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Token {
    pub token_id: String,
    pub token_name: String,
    pub token_symbol: String,
    pub token_address: Option<String>,
    pub token_chain: String,
    pub token_decimals: u8,
    pub is_native: bool,
    pub is_active: bool,
    pub price_feed_id: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Pair {
    pub pool_id: String,
    pub token_a_symbol: String,
    pub token_a_chain: String,
    pub token_a_token_id: String,
    pub token_b_symbol: String,
    pub token_b_chain: String,
    pub token_b_token_id: String,
    pub pair_type: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PriceFeed {
    pub id: PriceFeedId,
    pub value: Vec<u8>,
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PriceFeedId {
    pub id: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct SwapResponse {
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub amount_out: String,
    pub slippage: String,
    pub tx_hash_in: String,
    pub tx_hash_out: String,
    pub status: String, // "swap" or "reverted"
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum SwapResult {
    Success(SwapResponse),
    Error(String),
}

fn get_supported_tokens(network: EthereumNetwork) -> Vec<Token> {
    match network {
        EthereumNetwork::Mainnet => vec![
            Token {
                token_id: "1027".to_string(),
                token_name: "Ethereum".to_string(),
                token_symbol: "ETH".to_string(),
                token_address: Some(
                    "0x0000000000000000000000000000000000000000".to_string(),
                ),
                token_chain: "Ethereum".to_string(),
                token_decimals: 18,
                is_native: true,
                is_active: true,
                price_feed_id: "26346734".to_string(),
            },
            Token {
                token_id: "3408_1027".to_string(),
                token_name: "USD Coin".to_string(),
                token_symbol: "USDC".to_string(),
                token_address: Some(
                    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".to_string(),
                ),
                token_chain: "Ethereum".to_string(),
                token_decimals: 6,
                is_native: false,
                is_active: true,
                price_feed_id: "2365732848".to_string(),
            },
        ],
        EthereumNetwork::Sepolia => vec![
            Token {
                token_id: "1027".to_string(),
                token_name: "Ethereum".to_string(),
                token_symbol: "ETH".to_string(),
                token_address: Some(
                    "0x0000000000000000000000000000000000000000".to_string(),
                ),
                token_chain: "Ethereum".to_string(),
                token_decimals: 18,
                is_native: true,
                is_active: true,
                price_feed_id: "3541625346".to_string(),
            },
            Token {
                token_id: "3408_1027".to_string(),
                token_name: "USD Coin".to_string(),
                token_symbol: "USDC".to_string(),
                token_address: Some(
                    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238".to_string(),
                ),
                token_chain: "Ethereum".to_string(),
                token_decimals: 6,
                is_native: false,
                is_active: true,
                price_feed_id: "2354273467".to_string(),
            },
        ],
    }
}

fn get_supported_pairs() -> Vec<Pair> {
    vec![Pair {
        pool_id: "y0a4pk".to_string(),
        token_a_symbol: "ETH".to_string(),
        token_a_chain: "Ethereum".to_string(),
        token_a_token_id: "1027".to_string(),
        token_b_symbol: "USDC".to_string(),
        token_b_chain: "Ethereum".to_string(),
        token_b_token_id: "3408_1027".to_string(),
        pair_type: "Same-Chain".to_string(),
    }]
}

pub const EVM_RPC_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01");
pub const EVM_RPC: EvmRpcCanister = EvmRpcCanister(EVM_RPC_CANISTER_ID);

fn get_rpc_url(network: EthereumNetwork) -> &'static str {
    match network {
        EthereumNetwork::Mainnet => "https://eth.llamarpc.com",
        EthereumNetwork::Sepolia => "https://ethereum-sepolia.gateway.tatum.io/",
    }
}

const TATUM_API_KEY: &str =
    "shjgdhjslkdsfkljdfjkdlkfgjlek";

pub async fn ethereum_address() -> String {
    let wallet = EthereumWallet::new_canister_wallet().await;
    wallet.ethereum_address().to_string()
}

pub async fn get_transaction_count_for_address(address: String) -> Nat {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "latest"], "id": 1}}"#,
        address
    );
    let response = call_tatum_rpc(json_payload).await;
    match response {
        RequestResult::Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str).unwrap();
            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                let count = u64::from_str_radix(count_hex, 16).unwrap();
                Nat::from(count)
            } else {
                ic_cdk::trap("Failed to parse transaction count response")
            }
        }
        RequestResult::Err(e) => {
            ic_cdk::trap(&format!("Failed to get transaction count: {:?}", e))
        }
    }
}

pub async fn create_transaction_internal(
    args: CreateTransactionArgs,
) -> TransactionResponse {
    if args.token_in_address.eq_ignore_ascii_case(&args.token_out_address) {
        ic_cdk::trap("Token In and Token Out addresses cannot be the same.");
    }

    let network = read_state(|s| s.ethereum_network());
    let supported_tokens = get_supported_tokens(network);
    let token_in = supported_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&args.token_in_address)
            }) && t.token_chain == args.source_chain
        })
        .unwrap_or_else(|| {
            ic_cdk::trap(&format!(
                "Token in address '{}' on chain '{}' not found for network {:?}",
                args.token_in_address, args.source_chain, network
            ))
        });

    let canister_address_str = ethereum_address().await;
    let canister_address = Address::from_str(&canister_address_str).unwrap();

    let amount_in_decimal = Decimal::from_str(&args.amount_in)
        .unwrap_or_else(|_| {
            ic_cdk::trap("Failed to parse amount_in as a decimal number")
        });
    let final_amount_decimal = amount_in_decimal * dec!(1.01);
    let mut multiplier = Decimal::ONE;
    for _ in 0..token_in.token_decimals {
        multiplier *= Decimal::TEN;
    }
    let amount_in_smallest_unit = (final_amount_decimal * multiplier).trunc();
    let final_amount_u256 = U256::from_str(&amount_in_smallest_unit.to_string())
        .unwrap_or_else(|_| {
            ic_cdk::trap("Failed to convert final amount to U256")
        });

    let (to_address, value, data_bytes, gas_limit);
    let json_data_string = serde_json::json!(&args).to_string();
    let json_data_bytes = json_data_string.as_bytes();

    if token_in.is_native {
        to_address = canister_address_str;
        value = final_amount_u256;
        data_bytes = json_data_bytes.to_vec();
    } else {
        to_address = args.token_in_address.clone();
        value = U256::ZERO;
        let transfer_call = IERC20::transferCall {
            to: canister_address,
            amount: final_amount_u256,
        };
        let mut transfer_data = transfer_call.abi_encode();
        transfer_data.extend_from_slice(json_data_bytes);
        data_bytes = transfer_data;
    }

    let data_gas: u128 = data_bytes
        .iter()
        .map(|&byte| if byte == 0 { 4 } else { 16 })
        .sum();
    let base_gas = if token_in.is_native { 21_000 } else { 65_000 };
    gas_limit = base_gas + data_gas;

    let (_dummy_gas, max_fee_per_gas, max_priority_fee_per_gas) =
        estimate_transaction_fees();
    let nonce = nat_to_u64(
        get_transaction_count_for_address(args.tick_in_wallet_address.clone()).await,
    );
    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction_data = TransactionData {
        tx_type: "EIP-1559".to_string(),
        blockchain: "Ethereum".to_string(),
        from: args.tick_in_wallet_address.clone(),
        to: to_address,
        value: format!("0x{:x}", value),
        data: format!("0x{}", hex::encode(data_bytes)),
        gas_limit: format!("0x{:x}", gas_limit),
        max_priority_fee_per_gas: format!("0x{:x}", max_priority_fee_per_gas),
        max_fee_per_gas: format!("0x{:x}", max_fee_per_gas),
        nonce: format!("0x{:x}", nonce),
        chain_id,
    };

    TransactionResponse { transaction_data }
}

#[derive(SerdeDeserialize, Debug)]
struct JsonRpcResponse<T> {
    result: Option<T>,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RpcLog {
    address: String,
    topics: Vec<String>,
    data: String,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RpcTransactionReceipt {
    from: String,
    status: String,
    logs: Vec<RpcLog>,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RpcTransaction {
    to: Option<String>,
    value: String,
    input: String,
}

pub async fn verify_and_swap_internal(transaction_hash: String) -> SwapResult {
    let canister_address_str = ethereum_address().await;
    let canister_address_bytes =
        hex::decode(canister_address_str.strip_prefix("0x").unwrap()).unwrap();

    let mut receipt = None;
    const MAX_RETRIES: u32 = 1;

    for i in 0..MAX_RETRIES {
        let receipt_payload = format!(
            r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
            transaction_hash
        );
        let receipt_response: JsonRpcResponse<RpcTransactionReceipt> =
            match call_tatum_rpc(receipt_payload).await {
                RequestResult::Ok(result_str) => {
                    match serde_json::from_str(&result_str) {
                        Ok(res) => res,
                        Err(e) => {
                            ic_cdk::println!(
                                "Verification failed: Failed to parse RPC receipt: {}",
                                e
                            );
                            return SwapResult::Error(format!("Failed to parse RPC receipt: {}", e));
                        }
                    }
                }
                RequestResult::Err(e) => {
                    ic_cdk::println!(
                        "Verification failed: RPC call for receipt failed: {:?}",
                        e
                    );
                    return SwapResult::Error(format!("RPC call for receipt failed: {:?}", e));
                }
            };

        if let Some(r) = receipt_response.result {
            receipt = Some(r);
            break;
        }

        if i < MAX_RETRIES - 1 {
            ic_cdk::println!(
                "Transaction receipt not found or pending. Will try once more... (Attempt {}/{})",
                i + 1,
                MAX_RETRIES
            );
        }
    }

    let receipt = match receipt {
        Some(r) => r,
        None => {
            ic_cdk::println!(
                "Verification failed: Transaction receipt not found after {} retries. Transaction may still be pending.",
                MAX_RETRIES
            );
            return SwapResult::Error("Transaction receipt not found after retries. Transaction may still be pending.".to_string());
        }
    };

    if receipt.status != "0x1" {
        ic_cdk::println!(
            "Verification failed: Transaction was reverted (status is not 0x1)."
        );
        return SwapResult::Error("Transaction was reverted (status is not 0x1).".to_string());
    }

    let tx_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        transaction_hash
    );
    let tx_response: JsonRpcResponse<RpcTransaction> =
        match call_tatum_rpc(tx_payload).await {
            RequestResult::Ok(result_str) => match serde_json::from_str(&result_str) {
                Ok(res) => res,
                Err(e) => {
                    ic_cdk::println!(
                    "Verification failed: Could not fetch original transaction details: {}",
                    e
                );
                    return SwapResult::Error(format!("Could not fetch original transaction details: {}", e));
                }
            },
            RequestResult::Err(e) => {
                ic_cdk::println!(
                    "Verification failed: RPC call for transaction failed: {:?}",
                    e
                );
                return SwapResult::Error(format!("RPC call for transaction failed: {:?}", e));
            }
        };

    let tx = match tx_response.result {
        Some(tx) => tx,
        None => {
            ic_cdk::println!(
                "Verification failed: Could not find transaction details by hash."
            );
            return SwapResult::Error("Could not find transaction details by hash.".to_string());
        }
    };

    // Process ERC20 transfers
    for log in receipt.logs.iter() {
        if log.topics.len() == 3
            && log.topics[0].eq_ignore_ascii_case(TRANSFER_EVENT_SIGNATURE)
        {
            let recipient_topic = &log.topics[2];
            let recipient_bytes =
                hex::decode(recipient_topic.strip_prefix("0x").unwrap()).unwrap();
            if recipient_bytes.ends_with(&canister_address_bytes) {
                let token_address = &log.address;
                let amount_hex = log.data.strip_prefix("0x").unwrap_or(&log.data);
                let amount_smallest_unit =
                    U256::from_str_radix(amount_hex, 16).unwrap_or_default();

                match execute_swap_or_refund_with_response(
                    &tx.input,
                    token_address,
                    amount_smallest_unit,
                    &transaction_hash,
                    &receipt.from,
                )
                .await
                {
                    Ok(swap_response) => return SwapResult::Success(swap_response),
                    Err(e) => {
                        ic_cdk::println!("Error during swap/refund execution: {}", e);
                        return SwapResult::Error(format!("Error during swap/refund execution: {}", e));
                    }
                }
            }
        }
    }

    // Process native ETH transfers
    let value = U256::from_str_radix(tx.value.strip_prefix("0x").unwrap_or("0"), 16)
        .unwrap_or_default();
    if tx.to.as_deref().map_or(false, |to| {
        to.eq_ignore_ascii_case(&canister_address_str)
    }) && value > U256::ZERO
    {
        let eth_address = "0x0000000000000000000000000000000000000000";
        match execute_swap_or_refund_with_response(
            &tx.input,
            eth_address,
            value,
            &transaction_hash,
            &receipt.from,
        )
        .await
        {
            Ok(swap_response) => return SwapResult::Success(swap_response),
            Err(e) => {
                ic_cdk::println!("Error during swap/refund execution: {}", e);
                return SwapResult::Error(format!("Error during swap/refund execution: {}", e));
            }
        }
    }

    ic_cdk::println!(
        "Verification failed: No valid ETH or ERC20 transfer to the canister was found."
    );
    SwapResult::Error("No valid ETH or ERC20 transfer to the canister was found.".to_string())
}

async fn execute_swap_or_refund_with_response(
    tx_input: &str,
    token_in_address: &str,
    amount_smallest_unit: U256,
    tx_hash_in: &str,
    from_address: &str,
) -> Result<SwapResponse, String> {
    let input_bytes = hex::decode(tx_input.strip_prefix("0x").unwrap_or(""))
        .map_err(|_| "Failed to decode tx input".to_string())?;
    let json_start_pos = input_bytes
        .windows(1)
        .rposition(|w| w == b"{")
        .ok_or("Could not find JSON in tx input".to_string())?;
    let decoded_args: CreateTransactionArgs =
        serde_json::from_slice(&input_bytes[json_start_pos..])
            .map_err(|_| "Failed to decode swap args".to_string())?;

    let network = read_state(|s| s.ethereum_network());
    let all_tokens = get_supported_tokens(network);
    let token_in = all_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addr.eq_ignore_ascii_case(token_in_address))
        })
        .ok_or("Token In not supported".to_string())?;
    let token_out = all_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&decoded_args.token_out_address)
            })
        })
        .ok_or("Token Out not supported".to_string())?;

    let amount_decimal = Decimal::from_str(&amount_smallest_unit.to_string()).unwrap();
    let mut divisor = Decimal::ONE;
    for _ in 0..token_in.token_decimals {
        divisor *= Decimal::TEN;
    }
    let human_readable_amount = amount_decimal / divisor;
    let base_amount = calculate_base_amount_from_sent(&human_readable_amount);

    let price_in = get_token_price(&token_in.price_feed_id).await?;
    let price_out = get_token_price(&token_out.price_feed_id).await?;

    let usd_sent = base_amount.to_f64().unwrap_or(0.0) * price_in;
    let calculated_tick_out =
        Decimal::from_str(&(usd_sent / price_out).to_string())
            .map_err(|_| "Failed to calculate tick_out amount")?
            .round_dp(6);

    let expected_amount_out_decimal =
        Decimal::from_str(&decoded_args.expected_amount_out).unwrap_or_default();
    let slippage_percent =
        Decimal::from_str(&decoded_args.slippage).unwrap_or(Decimal::ONE);

    let (_can_swap, percent_difference) = check_slippage_tolerance_usd(
        usd_sent,
        &calculated_tick_out,
        &expected_amount_out_decimal,
        price_out,
        &slippage_percent,
    );

    let current_timestamp = ic_cdk::api::time();

    // Check if transaction should be reverted due to slippage
    if percent_difference > slippage_percent {
        ic_cdk::println!("❌ TRANSACTION REVERTED: Slippage tolerance exceeded!");
        ic_cdk::println!("   - Slippage Tolerance: {}%", slippage_percent);
        ic_cdk::println!("   - Actual Difference: {:.6}%", percent_difference);
        ic_cdk::println!("   - Initiating refund...");

        // Refund the original amount to the sender
        let refund_amount_u256 = amount_smallest_unit;
        let recipient =
            Address::from_str(&decoded_args.tick_in_wallet_address).unwrap();

        let tx_hash_out = if token_in.is_native {
            send_native_eth(recipient, refund_amount_u256).await?
        } else {
            let token_contract =
                Address::from_str(token_in.token_address.as_deref().unwrap())
                    .unwrap();
            send_erc20_token(token_contract, recipient, refund_amount_u256)
                .await?
        };
        ic_cdk::println!("   ↩️ Refund transaction sent! Hash: {}", tx_hash_out);

        return Ok(SwapResponse {
            pool_id: decoded_args.pool_id,
            tick_in_wallet_address: from_address.to_string(),
            tick_out_wallet_address: decoded_args.tick_out_wallet_address,
            swap_type: decoded_args.swap_type,
            source_chain: decoded_args.source_chain,
            destination_chain: decoded_args.destination_chain,
            token_in_address: decoded_args.token_in_address,
            token_out_address: decoded_args.token_out_address,
            amount_in: base_amount.to_string(),
            amount_out: human_readable_amount.to_string(),
            slippage: decoded_args.slippage,
            tx_hash_in: tx_hash_in.to_string(),
            tx_hash_out,
            status: "reverted".to_string(),
            timestamp: current_timestamp,
        });
    }

    let expected_amount_out = expected_amount_out_decimal.to_f64().unwrap_or(0.0);
    let usd_value_expected = expected_amount_out * price_out;
    let calculated_tick_out_f64 = calculated_tick_out.to_f64().unwrap_or(0.0);
    let usd_value_calculated = calculated_tick_out_f64 * price_out;

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
    ic_cdk::println!(
        "   - Fee (1%): {}",
        human_readable_amount - base_amount
    );
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
    ic_cdk::println!("   - Expected USD Value Out: ~${:.6}", usd_value_expected);
    ic_cdk::println!(
        "   - Calculated Tick Out Amount: {} (rounded to 6 decimals)",
        calculated_tick_out
    );
    ic_cdk::println!(
        "   - Calculated USD Value Out: ~${:.6}",
        usd_value_calculated
    );
    ic_cdk::println!("   - Token Out Price: ${}", price_out);
    ic_cdk::println!("   ---------------------------------");
    ic_cdk::println!("   - Slippage Tolerance: {}%", slippage_percent);
    ic_cdk::println!("   - Actual Difference: {:.6}%", percent_difference);

    ic_cdk::println!(
        "   ✅ SWAP APPROVED - Difference is within slippage tolerance. Initiating swap..."
    );

    let mut out_multiplier = Decimal::ONE;
    for _ in 0..token_out.token_decimals {
        out_multiplier *= Decimal::TEN;
    }
    let out_amount_smallest_unit = (calculated_tick_out * out_multiplier).trunc();
    let out_amount_u256 = U256::from_str(&out_amount_smallest_unit.to_string()).unwrap();
    let recipient = Address::from_str(&decoded_args.tick_out_wallet_address).unwrap();

    let tx_hash_out = if token_out.is_native {
        send_native_eth(recipient, out_amount_u256).await?
    } else {
        let token_contract =
            Address::from_str(token_out.token_address.as_deref().unwrap())
                .unwrap();
        send_erc20_token(token_contract, recipient, out_amount_u256).await?
    };
    ic_cdk::println!("   🚀 Swap transaction sent! Hash: {}", tx_hash_out);

    Ok(SwapResponse {
        pool_id: decoded_args.pool_id,
        tick_in_wallet_address: from_address.to_string(),
        tick_out_wallet_address: decoded_args.tick_out_wallet_address,
        swap_type: decoded_args.swap_type,
        source_chain: decoded_args.source_chain,
        destination_chain: decoded_args.destination_chain,
        token_in_address: decoded_args.token_in_address,
        token_out_address: decoded_args.token_out_address,
        amount_in: base_amount.to_string(),
        amount_out: calculated_tick_out.to_string(),
        slippage: decoded_args.slippage,
        tx_hash_in: tx_hash_in.to_string(),
        tx_hash_out,
        status: "swap".to_string(),
        timestamp: current_timestamp,
    })
}

fn check_slippage_tolerance_usd(
    usd_sent: f64,
    calculated_tick_out: &Decimal,
    _expected_amount_out: &Decimal,
    token_out_price: f64,
    slippage_percent: &Decimal,
) -> (bool, Decimal) {
    // Calculate USD values
    let calculated_tick_out_f64 = calculated_tick_out.to_f64().unwrap_or(0.0);
    let usd_received = calculated_tick_out_f64 * token_out_price;

    if usd_sent == 0.0 {
        return (false, Decimal::ZERO);
    }

    let slippage_amount = usd_sent - usd_received;
    let percent_difference =
        Decimal::from_str(&((slippage_amount / usd_sent) * 100.0).to_string())
            .unwrap_or(Decimal::ZERO);

    let can_swap =
        percent_difference <= *slippage_percent && percent_difference >= Decimal::ZERO;

    (can_swap, percent_difference)
}

async fn get_token_price(data_id: &str) -> Result<f64, String> {
    let price_feed_canister = Principal::from_text("qj77p-wiaaa-aaaao-a3wla-cai")
        .expect("Invalid price feed canister principal");

    let price_result: Result<(Option<PriceFeed>,), _> =
        ic_cdk::call(price_feed_canister, "get_value", (data_id,)).await;

    let price_feed = match price_result {
        Ok((Some(feed),)) => feed,
        Ok((None,)) => {
            return Err(format!("Price feed not found for data_id: {}", data_id))
        }
        Err(e) => return Err(format!("Failed to get price feed: {:?}", e)),
    };

    let price = match from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value,
        Err(_) => match from_reader::<u64, _>(&price_feed.value[..]) {
            Ok(int_value) => int_value as f64,
            Err(e) => return Err(format!("Failed to decode CBOR price: {}", e)),
        },
    };

    Ok(price)
}

pub fn transform(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        ..Default::default()
    };
    if res.status == Nat::from(200u64) {
        res.body = raw.response.body;
    } else {
        ic_cdk::api::print(format!(
            "Received an error from the remote service:\n{:#?}",
            raw
        ));
    }
    res
}

async fn call_tatum_rpc(json_payload: String) -> RequestResult {
    use ic_cdk::api::management_canister::http_request::{
        http_request, CanisterHttpRequestArgument, HttpMethod, TransformContext,
    };
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "X-API-Key".to_string(),
            value: TATUM_API_KEY.to_string(),
        },
    ];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);
    let network = read_state(|s| s.ethereum_network());
    let url = get_rpc_url(network).to_string();

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(json_payload.into_bytes()),
        max_response_bytes: Some(8192),
        transform: Some(transform_context),
        headers: request_headers,
    };

    match http_request(request, 25_000_000_000).await {
        Ok((response,)) => {
            if response.status == Nat::from(200u64) {
                let body = String::from_utf8(response.body).unwrap();
                RequestResult::Ok(body)
            } else {
                let error_body = String::from_utf8(response.body).unwrap_or_default();
                let json_error = evm_rpc_canister_types::JsonRpcError {
                    code: response.status.0.to_i64().unwrap_or(-1),
                    message: format!("HTTP {}: {}", response.status, error_body),
                };
                RequestResult::Err(RpcError::JsonRpcError(json_error))
            }
        }
        Err((r, m)) => {
            let json_error = evm_rpc_canister_types::JsonRpcError {
                code: -1,
                message: format!("Request failed: {:?} - {}", r, m),
            };
            RequestResult::Err(RpcError::JsonRpcError(json_error))
        }
    }
}

async fn get_dynamic_fees() -> Result<(u128, u128), String> {
    let json_payload =
        r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#
            .to_string();

    match call_tatum_rpc(json_payload).await {
        RequestResult::Ok(result_str) => {
            let response: JsonRpcResponse<String> = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse gas price response: {}", e))?;

            if let Some(gas_price_hex) = response.result {
                let gas_price = u128::from_str_radix(
                    gas_price_hex.strip_prefix("0x").unwrap_or(""),
                    16,
                )
                .map_err(|e| format!("Failed to parse gas price hex: {}", e))?;

                let max_priority_fee_per_gas = 2_000_000_000u128;
                let max_fee_per_gas = gas_price + max_priority_fee_per_gas;

                Ok((max_fee_per_gas, max_priority_fee_per_gas))
            } else {
                Err("eth_gasPrice returned no result".to_string())
            }
        }
        RequestResult::Err(e) => {
            Err(format!("RPC call for gas price failed: {:?}", e))
        }
    }
}

fn estimate_transaction_fees() -> (u128, u128, u128) {
    const GAS_LIMIT: u128 = 21_000;
    const MAX_FEE_PER_GAS: u128 = 50_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;
    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}

pub fn supported_tokens_internal() -> String {
    let network = read_state(|s| s.ethereum_network());
    let tokens = get_supported_tokens(network);
    serde_json::json!({ "token": tokens }).to_string()
}

pub fn supported_pairs_internal() -> String {
    let pairs = get_supported_pairs();
    serde_json::json!({ "pairs": pairs }).to_string()
}

fn calculate_base_amount_from_sent(amount_sent: &Decimal) -> Decimal {
    amount_sent / dec!(1.01)
}

async fn send_native_eth(to: Address, amount: U256) -> Result<String, String> {
    let canister_address = ethereum_address().await;
    let nonce = nat_to_u64(get_transaction_count_for_address(canister_address).await);
    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;

    let tx = TxEip1559 {
        chain_id: read_state(|s| s.ethereum_network().chain_id()),
        nonce,
        gas_limit: 21000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    _sign_and_send_raw_transaction(tx).await
}

async fn send_erc20_token(
    token_contract: Address,
    to: Address,
    amount: U256,
) -> Result<String, String> {
    let canister_address = ethereum_address().await;
    let nonce = nat_to_u64(get_transaction_count_for_address(canister_address).await);
    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;

    let transfer_call = IERC20::transferCall { to, amount };
    let input_data = transfer_call.abi_encode();

    let tx = TxEip1559 {
        chain_id: read_state(|s| s.ethereum_network().chain_id()),
        nonce,
        gas_limit: 100_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: input_data.into(),
    };

    _sign_and_send_raw_transaction(tx).await
}

async fn _sign_and_send_raw_transaction(
    transaction: TxEip1559,
) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature =
        Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
            .expect("BUG: failed to create a signature");
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    match call_tatum_rpc(json_payload).await {
        RequestResult::Ok(_) => Ok(raw_transaction_hash.to_string()),
        RequestResult::Err(e) => {
            Err(format!("Failed to send raw transaction: {:?}", e))
        }
    }
}