use alloy_consensus::TxEip1559;
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{Address, Signature, U256, hex};
use serde_json::Value;
use std::str::FromStr;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;

use crate::base_wallet::BaseWallet;
use crate::lib::Token;
use crate::state::{read_state};
use crate::utils::http::{make_http_request, get_rpc_url, call_rpc_with_retry};
use crate::utils::constants::BASE_PLATFORM_WALLET_ADDRESS;

pub async fn call_rpc_with_retry_base(json_payload: String) -> Result<String, String> {
    let network = read_state(|s| s.base_network());
    let rpc_url = get_rpc_url(network).to_string();
    call_rpc_with_retry(json_payload, rpc_url).await
}

pub async fn get_transaction_by_hash_base(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    match call_rpc_with_retry_base(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction not found (null result from RPC)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error in get_transaction_by_hash_base: {}", error))
            } else {
                Err("No 'result' or 'error' field in transaction response".to_string())
            }
        }
        Err(e) => {
            Err(format!("RPC call for transaction data failed: {}", e))
        }
    }
}

pub async fn get_transaction_receipt_base(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    match call_rpc_with_retry_base(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse receipt response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction receipt not found (null result from RPC)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error in get_transaction_receipt_base: {}", error))
            } else {
                Err("No 'result' or 'error' field in receipt response".to_string())
            }
        }
        Err(e) => {
            Err(format!("RPC call for transaction receipt failed: {}", e))
        }
    }
}

pub async fn decode_base_transaction_data(tx_data: &serde_json::Value) -> Option<(String, String)> {
    let input_data = tx_data.get("input").and_then(|v| v.as_str()).unwrap_or("0x");

    let hex_data = if input_data.starts_with("0x") {
        &input_data[2..]
    } else {
        input_data
    };

    let bytes = hex::decode(hex_data).ok()?;

    let separator_pos_rev = bytes.iter().rev().position(|&b| b == 0x00)?;
    let separator_pos = bytes.len() - 1 - separator_pos_rev;

    if separator_pos == 0 || separator_pos + 1 >= bytes.len() {
        ic_cdk::println!("Invalid custom data format: separator at beginning or end.");
        return None;
    }

    let custom_data_start = if hex_data.starts_with("a9059cbb") && bytes.len() >= 136 {
        136
    } else {
        0
    };

    let relevant_bytes = &bytes[custom_data_start..];
    let separator_pos_in_relevant = relevant_bytes.iter().position(|&b| b == 0x00)?;

    let token_out_address_bytes = &relevant_bytes[..separator_pos_in_relevant];
    let token_out_amount_bytes = &relevant_bytes[separator_pos_in_relevant + 1..];

    let token_out_address = String::from_utf8(token_out_address_bytes.to_vec()).ok()?;
    let token_out_amount = String::from_utf8(token_out_amount_bytes.to_vec()).ok()?;

    Some((token_out_address, token_out_amount))
}

pub async fn send_bit10_token_to_user_base(
    token: &Token,
    to_address: &str,
    amount_str: &str,
) -> Result<String, String> {
    let amount_decimal = Decimal::from_str(amount_str)
        .map_err(|_| format!("Failed to parse BIT10 token amount string: {}", amount_str))?;

    let scale_factor = Decimal::from(10u64.pow(token.token_decimals as u32));
    let amount_in_smallest_unit = (amount_decimal * scale_factor).trunc();
    let amount_u256 = U256::from_str(&amount_in_smallest_unit.to_string())
        .map_err(|_| "Failed to convert BIT10 token amount to U256 (smallest unit)")?;

    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address for BIT10 token transfer: {}", to_address))?;

    let token_contract = Address::from_str(token.token_address.as_deref().unwrap_or_default())
        .map_err(|_| "Invalid BIT10 token contract address")?;

    send_erc20_token_from_canister_base(token_contract, recipient, amount_u256).await
}

pub async fn revert_transaction_base(
    token: &Token,
    to_address: &str,
    amount: U256,
) -> Result<String, String> {
    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address for refund: {}", to_address))?;

    if token.is_native {
        send_native_eth_from_canister_base(recipient, amount).await
    } else {
        let token_contract = Address::from_str(token.token_address.as_deref().unwrap_or_default())
            .map_err(|_| "Invalid token contract address for refund")?;
        send_erc20_token_from_canister_base(token_contract, recipient, amount).await
    }
}

pub async fn send_erc20_token_from_canister_base(
    token_contract: Address,
    to: Address,
    amount: U256,
) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = match get_transaction_count_base(&canister_address).await {
        Ok(n) => n,
        Err(e) => return Err(format!("Failed to fetch nonce for ERC20 transfer: {}", e)),
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees_base().await
        .map_err(|e| format!("Failed to get gas fees for ERC20 transfer: {}", e))?;

    let method_id = hex::decode("a9059cbb").unwrap();
    let mut encoded = method_id;

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let chain_id = read_state(|s| s.base_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 100_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: encoded.into(),
    };

    sign_and_send_base_transaction(transaction, &wallet).await
}

pub async fn send_native_eth_from_canister_base(to: Address, amount: U256) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = match get_transaction_count_base(&canister_address).await {
        Ok(n) => n,
        Err(e) => return Err(format!("Failed to fetch nonce for native ETH transfer: {}", e)),
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees_base().await
        .map_err(|e| format!("Failed to get gas fees for native ETH transfer: {}", e))?;

    let chain_id = read_state(|s| s.base_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 21_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    sign_and_send_base_transaction(transaction, &wallet).await
}

pub async fn get_transaction_count_base(address: &str) -> Result<u64, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "pending"], "id": 1}}"#,
        address
    );

    match call_rpc_with_retry_base(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse nonce response: {}", e))?;

            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                let count = u64::from_str_radix(count_hex, 16)
                    .map_err(|e| format!("Failed to parse nonce hex: {}", e))?;
                Ok(count)
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error getting transaction count: {}", error))
            } else {
                Err("Failed to get transaction count from response: 'result' field missing or not a string".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get transaction count: {}", e)),
    }
}

pub async fn get_dynamic_fees_base() -> Result<(u128, u128), String> {
    let json_payload = r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#.to_string();

    match call_rpc_with_retry_base(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse gas price response: {}", e))?;

            if let Some(gas_price_hex) = response.get("result").and_then(|v| v.as_str()) {
                let gas_price = u128::from_str_radix(
                    gas_price_hex.strip_prefix("0x").unwrap_or("0"),
                    16,
                )
                .map_err(|e| format!("Failed to parse gas price hex: {}", e))?;

                let max_priority_fee_per_gas = 2_000_000_000u128;
                let max_fee_per_gas = gas_price + max_priority_fee_per_gas;

                Ok((max_fee_per_gas, max_priority_fee_per_gas))
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error getting gas price: {}", error))
            } else {
                Err("eth_gasPrice returned no 'result' field or it's not a string".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for gas price failed: {}", e)),
    }
}

pub async fn sign_and_send_base_transaction(
    transaction: TxEip1559,
    wallet: &BaseWallet,
) -> Result<String, String> {
    use alloy_consensus::TxEnvelope;

    let tx_hash = transaction.signature_hash().0;

    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;

    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .map_err(|e| format!("Failed to create signature: {:?}", e))?;

    let signed_tx = transaction.into_signed(signature);
    let raw_transaction_hash = *signed_tx.hash();

    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    match call_rpc_with_retry_base(json_payload).await {
        Ok(response_body) => {
            match serde_json::from_str::<serde_json::Value>(&response_body) {
                Ok(response) => {
                    if let Some(error) = response.get("error") {
                        if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                            if message.contains("already known") ||
                               message.contains("ALREADY_EXISTS") ||
                               message.contains("replacement transaction underpriced") {
                                ic_cdk::println!("Transaction already known/exists. Hash: 0x{:x}", raw_transaction_hash);
                                return Ok(format!("0x{:x}", raw_transaction_hash));
                            }
                        }
                        return Err(format!("RPC error sending raw transaction: {}", error));
                    }

                    if let Some(result) = response.get("result") {
                        if let Some(tx_hash_str) = result.as_str() {
                            return Ok(tx_hash_str.to_string());
                        }
                    }

                    ic_cdk::println!("eth_sendRawTransaction response lacks 'result' or 'error' but call succeeded: {}", response_body);
                    Ok(format!("0x{:x}", raw_transaction_hash))
                }
                Err(e) => {
                    Err(format!("Failed to parse RPC response for eth_sendRawTransaction: {}", e))
                }
            }
        }
        Err(e) => {
            Err(format!("Failed to send raw transaction via RPC: {}", e))
        }
    }
}

pub fn decode_erc20_recipient_address(input_data: &str) -> Option<String> {
    if !input_data.starts_with("0x") || input_data.len() < 10 {
        return None;
    }

    let hex_data = &input_data[2..];

    if !hex_data.starts_with("a9059cbb") {
        return None;
    }

    if hex_data.len() < 72 {
        return None;
    }

    let recipient_padded_hex = &hex_data[8..72];
    if recipient_padded_hex.len() != 64 {
        return None;
    }

    Some(format!("0x{}", &recipient_padded_hex[24..64]))
}

pub fn extract_erc20_amount_from_transaction_input(
    input_data: &str,
    expected_recipient: &str,
) -> Result<U256, String> {
    if !input_data.starts_with("0x") {
        return Err("Invalid input data format: missing 0x prefix".to_string());
    }

    let hex_data = &input_data[2..];

    if hex_data.len() < 136 {
        return Err(format!("Input data too short for ERC20 transfer ({} chars, need at least 136)", hex_data.len()));
    }

    if !hex_data.starts_with("a9059cbb") {
        return Err("Input data does not start with ERC20 'transfer' function selector (0xa9059cbb)".to_string());
    }

    let recipient_padded_hex = &hex_data[8..72];
    let actual_recipient_address = format!("0x{}", &recipient_padded_hex[24..64]);

    if !actual_recipient_address.eq_ignore_ascii_case(expected_recipient) {
        return Err(format!(
            "ERC20 transfer recipient mismatch. Expected: {}, Found: {}",
            expected_recipient, actual_recipient_address
        ));
    }

    let amount_hex = &hex_data[72..136];
    U256::from_str_radix(amount_hex, 16)
        .map_err(|e| format!("Failed to parse ERC20 transfer amount from hex '{}': {}", amount_hex, e))
}

pub fn u256_to_decimal_string(value: U256, decimals: u8) -> Result<String, String> {
    let value_str = value.to_string();
    let value_decimal = Decimal::from_str(&value_str)
        .map_err(|_| format!("Failed to convert U256 '{}' to Decimal", value_str))?;

    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    if scale_factor == Decimal::ZERO {
        return Err("Invalid decimal scale factor (zero)".to_string());
    }
    let result = value_decimal / scale_factor;
    Ok(result.to_string())
}