use crate::state::read_state;
use crate::utils::http::{call_rpc_with_retry, call_rpc_with_retry_on_chain};
use crate::utils::types::{
    ChainType, EthereumNetwork, JsonRpcResponse, RpcTransaction, RpcTransactionReceipt,
};
use num::ToPrimitive;
use alloy_primitives::U256;
use std::str::FromStr;

pub async fn get_dynamic_fees() -> Result<(u128, u128), String> {
    let json_payload =
        r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#.to_string();

    let result_str = call_rpc_with_retry(json_payload).await?;
    let response: JsonRpcResponse<String> = serde_json::from_str(&result_str)
        .map_err(|e| format!("Failed to parse gas price response: {}", e))?;

    if let Some(error) = response.error {
        return Err(format!("RPC error fetching gas price: {}", error));
    }

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

pub fn get_rpc_url(network: EthereumNetwork) -> &'static str {
    match network {
        EthereumNetwork::Mainnet => "https://eth.llamarpc.com",
        EthereumNetwork::Sepolia => "https://ethereum-sepolia.gateway.tatum.io/",
    }
}

pub async fn get_transaction_count_for_address_on_chain(address: String, chain: ChainType) -> Result<u64, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "pending"], "id": 1}}"#,
        address
    );

    let body_str = call_rpc_with_retry_on_chain(json_payload, chain).await?;
    let response: JsonRpcResponse<String> = serde_json::from_str(&body_str)
        .map_err(|e| format!("Failed to parse nonce response: {}", e))?;

    if let Some(error) = response.error {
        return Err(format!("RPC error fetching nonce: {}", error));
    }

    if let Some(result) = response.result {
        let count_hex = result.strip_prefix("0x").unwrap_or(&result);
        u64::from_str_radix(count_hex, 16)
            .map_err(|e| format!("Failed to parse nonce hex: {}", e))
    } else {
        Err("Failed to get transaction count from response".to_string())
    }
}

pub async fn fetch_nonce_eth(address: &str) -> Result<u64, String> {
    get_transaction_count_for_address_on_chain(address.to_string(), ChainType::Ethereum).await
}

pub async fn fetch_nonce_bsc_robust(address: &str) -> Result<u64, String> {
    get_transaction_count_for_address_on_chain(address.to_string(), ChainType::BSC).await
}

pub async fn fetch_nonce_bsc(address: &str) -> u64 {
    match fetch_nonce_bsc_robust(address).await {
        Ok(nonce) => nonce,
        Err(e) => {
            ic_cdk::println!("Failed to fetch BSC nonce: {}, using default 0", e);
            0
        }
    }
}

pub async fn get_transaction_by_hash_on_chain(tx_hash: &str, chain: ChainType) -> Result<RpcTransaction, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    let result_str = call_rpc_with_retry_on_chain(json_payload, chain).await?;
    let response: JsonRpcResponse<RpcTransaction> = serde_json::from_str(&result_str)
        .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

    if let Some(error) = response.error {
        return Err(format!("RPC error: {}", error));
    }

    response.result.ok_or_else(|| "Transaction not found (null result)".to_string())
}

pub async fn get_transaction_receipt_on_chain(tx_hash: &str, chain: ChainType) -> Result<RpcTransactionReceipt, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    let result_str = call_rpc_with_retry_on_chain(json_payload, chain).await?;
    let response: JsonRpcResponse<RpcTransactionReceipt> = serde_json::from_str(&result_str)
        .map_err(|e| format!("Failed to parse receipt response: {}", e))?;

    if let Some(error) = response.error {
        return Err(format!("RPC error: {}", error));
    }

    response.result.ok_or_else(|| "Transaction receipt not found (null result)".to_string())
}

pub fn estimate_transaction_fees_bsc() -> (u128, u128, u128) {
    const GAS_LIMIT: u128 = 100_000;
    const MAX_FEE_PER_GAS: u128 = 10_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;
    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}