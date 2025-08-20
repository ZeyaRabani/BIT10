use crate::utils::http::make_rpc_request;
use crate::utils::types::{JsonRpcResponse, RpcTransaction, RpcTransactionReceipt};
use candid::Nat;
use num::BigUint;
use num::Num;
use num::ToPrimitive;

pub async fn get_block_number_rpc() -> Result<Nat, String> {
    let body = r#"{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}"#;
    let response_str = make_rpc_request(body.to_string()).await?;
    let json: JsonRpcResponse<String> = serde_json::from_str(&response_str)
        .map_err(|e| format!("Invalid JSON from BSC RPC for block number: {}", e))?;

    if let Some(error) = json.error {
        return Err(format!("RPC error fetching block number: {}", error));
    }

    let hex_block = json
        .result
        .ok_or("eth_blockNumber returned no result".to_string())?;

    let block_number = BigUint::from_str_radix(hex_block.strip_prefix("0x").unwrap_or(&hex_block), 16)
        .map_err(|e| format!("Failed to parse hex block number: {}", e))?;

    Ok(Nat(block_number))
}

pub async fn fetch_nonce_safe(address: &str) -> Result<u64, String> {
    let body = format!(
        r#"{{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["{}", "pending"],"id":1}}"#,
        address
    );

    let response_str = make_rpc_request(body).await?;
    let json: JsonRpcResponse<String> = serde_json::from_str(&response_str)
        .map_err(|e| format!("Invalid JSON from BSC RPC for nonce: {}", e))?;

    if let Some(error) = json.error {
        return Err(format!("RPC error fetching nonce: {}", error));
    }

    let hex_nonce = json.result.ok_or("eth_getTransactionCount returned no result".to_string())?;
    u64::from_str_radix(hex_nonce.strip_prefix("0x").unwrap_or(&hex_nonce), 16)
        .map_err(|e| format!("Failed to parse hex nonce: {}", e))
}

pub async fn fetch_gas_price_safe() -> Result<u128, String> {
    let body = r#"{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}"#;

    let response_str = make_rpc_request(body.to_string()).await?;
    let json: JsonRpcResponse<String> = serde_json::from_str(&response_str)
        .map_err(|e| format!("Invalid JSON from BSC RPC for gas price: {}", e))?;

    if let Some(error) = json.error {
        return Err(format!("RPC error fetching gas price: {}", error));
    }

    let hex_price = json.result.ok_or("eth_gasPrice returned no result".to_string())?;
    u128::from_str_radix(hex_price.strip_prefix("0x").unwrap_or(&hex_price), 16)
        .map_err(|e| format!("Failed to parse hex gas price: {}", e))
}

pub fn estimate_transaction_fees_bsc() -> (u128, u128, u128) {
    const GAS_LIMIT: u128 = 100_000;
    const MAX_FEE_PER_GAS: u128 = 10_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;
    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}

pub async fn get_transaction_receipt_rpc(transaction_hash: &str) -> Result<RpcTransactionReceipt, String> {
    let receipt_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
        transaction_hash
    );

    let response_str = make_rpc_request(receipt_payload).await?;
    let json: JsonRpcResponse<RpcTransactionReceipt> = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse RPC response for receipt: {}", e))?;

    if let Some(error) = json.error {
        return Err(format!("RPC error fetching transaction receipt: {}", error));
    }

    json.result.ok_or_else(|| "Transaction receipt not found (null result). Transaction may still be pending or does not exist.".to_string())
}

pub async fn get_transaction_by_hash_rpc(transaction_hash: &str) -> Result<RpcTransaction, String> {
    let tx_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        transaction_hash
    );

    let response_str = make_rpc_request(tx_payload).await?;
    let json: JsonRpcResponse<RpcTransaction> = serde_json::from_str(&response_str)
        .map_err(|e| format!("Failed to parse RPC response for transaction: {}", e))?;

    if let Some(error) = json.error {
        return Err(format!("RPC error fetching transaction details: {}", error));
    }

    json.result.ok_or_else(|| "Transaction not found by hash (null result).".to_string())
}