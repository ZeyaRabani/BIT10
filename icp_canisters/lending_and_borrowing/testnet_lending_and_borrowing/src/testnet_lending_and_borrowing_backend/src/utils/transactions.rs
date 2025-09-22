use alloy_consensus::TxEip1559;
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{Address, Signature, U256, hex, TxKind};
use serde_json::Value;
use std::str::FromStr;
use crate::ethereum_wallet::EthereumWallet;
use crate::state::{read_state};
use crate::utils::http::{call_rpc_with_retry_eth};

pub async fn get_transaction_by_hash_ethereum(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    match call_rpc_with_retry_eth(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction not found (null result from RPC)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error in get_transaction_by_hash_ethereum: {}", error))
            } else {
                Err("No 'result' or 'error' field in transaction response".to_string())
            }
        }
        Err(e) => {
            Err(format!("RPC call for transaction data failed: {}", e))
        }
    }
}

pub async fn get_transaction_receipt_ethereum(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    match call_rpc_with_retry_eth(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse receipt response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction receipt not found (null result from RPC)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error in get_transaction_receipt_ethereum: {}", error))
            } else {
                Err("No 'result' or 'error' field in receipt response".to_string())
            }
        }
        Err(e) => {
            Err(format!("RPC call for transaction receipt failed: {}", e))
        }
    }
}

pub async fn get_transaction_count_ethereum(address: &str) -> Result<u64, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "pending"], "id": 1}}"#,
        address
    );

    match call_rpc_with_retry_eth(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse nonce response: {}", e))?;

            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                u64::from_str_radix(count_hex, 16)
                    .map_err(|e| format!("Failed to parse nonce hex: {}", e))
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error getting transaction count: {}", error))
            } else {
                Err("Failed to get transaction count from response: 'result' field missing or not a string".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get transaction count: {}", e)),
    }
}

pub async fn get_dynamic_fees() -> Result<(u128, u128), String> {
    let json_payload = r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#.to_string();

    match call_rpc_with_retry_eth(json_payload).await {
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

pub async fn sign_and_send_ethereum_transaction(
    transaction: TxEip1559,
    wallet: &EthereumWallet,
) -> Result<String, String> {
    use alloy_consensus::SignableTransaction;
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

    match call_rpc_with_retry_eth(json_payload).await {
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

pub async fn send_erc20_token_from_canister(
    token_contract: Address,
    to: Address,
    amount: U256,
) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let canister_address = wallet.ethereum_address().to_string();

    let nonce = get_transaction_count_ethereum(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;

    let method_id = hex::decode("a9059cbb").unwrap();
    let mut encoded = method_id;

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 100_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: encoded.into(),
    };

    sign_and_send_ethereum_transaction(transaction, &wallet).await
}

pub async fn send_native_eth_from_canister(to: Address, amount: U256) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let canister_address = wallet.ethereum_address().to_string();

    let nonce = get_transaction_count_ethereum(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await?;

    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 21_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    sign_and_send_ethereum_transaction(transaction, &wallet).await
}