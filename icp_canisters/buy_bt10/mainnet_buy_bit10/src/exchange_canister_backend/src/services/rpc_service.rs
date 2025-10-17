use ic_cdk::api::management_canister::http_request::{CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext};
use num_traits::ToPrimitive;
use crate::state::state::read_state;
use crate::utils::constants::get_rpc_url;

pub async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    const MAX_RETRIES: u8 = 5;
    
    let mut retries = 0;
    
    while retries < MAX_RETRIES {
        let cycles: u128 = 25_000_000_000;
        match ic_cdk::api::management_canister::http_request::http_request(
            request.clone(),
            cycles,
        )
        .await
        {
            Ok((response,)) => {
                if response.status.0.to_u64().unwrap_or(0) == 200 {
                    return Ok(response.body);
                } else {
                    return Err(format!("HTTP error: status {}", response.status));
                }
            }
            Err((_, msg)) if msg.contains("No consensus") || msg.contains("SysTransient") => {
                retries += 1;
                continue;
            }
            Err((_, msg)) => return Err(msg),
        }
    }
    
    Err(format!(
        "Failed after {} retries. Last error: No consensus could be reached",
        MAX_RETRIES
    ))
}

pub async fn call_rpc_with_retry(json_payload: String) -> Result<String, String> {
    let request_headers = vec![HttpHeader {
        name: "Content-Type".to_string(),
        value: "application/json".to_string(),
    }];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);
    let network = read_state(|s| s.base_network());
    let url = get_rpc_url(network);

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(json_payload.into_bytes()),
        max_response_bytes: Some(8192),
        transform: Some(transform_context),
        headers: request_headers,
    };

    match make_http_request(request).await {
        Ok(body) => {
            let body_str = String::from_utf8(body)
                .map_err(|e| format!("Failed to decode response: {}", e))?;
            Ok(body_str)
        }
        Err(e) => Err(e),
    }
}

pub async fn get_transaction_by_hash(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );
    
    match call_rpc_with_retry(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction not found (null result)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error: {}", error))
            } else {
                Err("No result or error in transaction response".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for transaction data failed: {}", e)),
    }
}

pub async fn get_transaction_receipt(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionReceipt", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );
    
    match call_rpc_with_retry(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse receipt response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction receipt not found (null result)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error: {}", error))
            } else {
                Err("No result or error in receipt response".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for transaction receipt failed: {}", e)),
    }
}

pub async fn get_transaction_count(address: &str) -> Result<u64, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "pending"], "id": 1}}"#,
        address
    );
    
    match call_rpc_with_retry(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse nonce response: {}", e))?;
                
            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                let count = u64::from_str_radix(count_hex, 16)
                    .map_err(|e| format!("Failed to parse nonce hex: {}", e))?;
                Ok(count)
            } else {
                Err("Failed to get transaction count from response".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get transaction count: {}", e)),
    }
}

pub async fn get_gas_price() -> Result<(u128, u128), String> {
    let json_payload = r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#
        .to_string();

    match call_rpc_with_retry(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse gas price response: {}", e))?;

            if let Some(gas_price_hex) = response.get("result").and_then(|v| v.as_str()) {
                let gas_price =
                    u128::from_str_radix(gas_price_hex.strip_prefix("0x").unwrap_or(""), 16)
                        .map_err(|e| format!("Failed to parse gas price hex: {}", e))?;

                let max_priority_fee_per_gas = 2_000_000_000u128; // 2 gwei
                let max_fee_per_gas = gas_price + max_priority_fee_per_gas;

                Ok((max_fee_per_gas, max_priority_fee_per_gas))
            } else {
                Err("eth_gasPrice returned no result".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for gas price failed: {}", e)),
    }
}

pub async fn send_raw_transaction(raw_tx_hex: &str) -> Result<String, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_tx_hex
    );

    match call_rpc_with_retry(json_payload).await {
        Ok(response_body) => {
            match serde_json::from_str::<serde_json::Value>(&response_body) {
                Ok(response) => {
                    if let Some(error) = response.get("error") {
                        if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                            if message.contains("already known")
                                || message.contains("ALREADY_EXISTS")
                                || message.contains("replacement transaction underpriced")
                            {
                                return Err("Transaction already known".to_string());
                            }
                        }
                        return Err(format!("RPC error: {}", error));
                    }

                    if let Some(result) = response.get("result") {
                        if let Some(tx_hash_str) = result.as_str() {
                            return Ok(tx_hash_str.to_string());
                        }
                    }

                    Err("No transaction hash in response".to_string())
                }
                Err(e) => Err(format!("Failed to parse RPC response: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to send raw transaction: {}", e)),
    }
}