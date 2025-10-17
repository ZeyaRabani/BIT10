use ic_cdk::api::management_canister::http_request::{CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext};
use num_traits::ToPrimitive;
use crate::state::state::read_state;

pub async fn make_solana_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
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

pub async fn call_solana_rpc(json_payload: String) -> Result<String, String> {
    let network = read_state(|s| s.solana_network());
    let url = network.rpc_url();

    let mut request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
    ];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(json_payload.into_bytes()),
        max_response_bytes: Some(8192),
        transform: Some(transform_context),
        headers: request_headers,
    };

    match make_solana_http_request(request).await {
        Ok(body) => {
            let body_str = String::from_utf8(body)
                .map_err(|e| format!("Failed to decode response: {}", e))?;
            Ok(body_str)
        }
        Err(e) => Err(e),
    }
}

pub async fn get_recent_blockhash() -> Result<String, String> {
    let json_payload = r#"{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash"}"#.to_string();

    match call_solana_rpc(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse blockhash response: {}", e))?;

            if let Some(blockhash) = response
                .get("result")
                .and_then(|r| r.get("value"))
                .and_then(|v| v.get("blockhash"))
                .and_then(|b| b.as_str())
            {
                Ok(blockhash.to_string())
            } else {
                Err("Failed to get blockhash from response".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get recent blockhash: {}", e)),
    }
}

pub async fn send_solana_transaction(serialized_transaction: &str) -> Result<String, String> {
    let json_payload = format!(
        r#"{{"jsonrpc":"2.0","id":1,"method":"sendTransaction","params":["{}",{{"encoding":"base64"}}]}}"#,
        serialized_transaction
    );

    match call_solana_rpc(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse send transaction response: {}", e))?;

            if let Some(error) = response.get("error") {
                return Err(format!("Transaction error: {}", error));
            }

            if let Some(result) = response.get("result").and_then(|r| r.as_str()) {
                Ok(result.to_string())
            } else {
                Err("Failed to get transaction signature from response".to_string())
            }
        }
        Err(e) => Err(format!("Failed to send transaction: {}", e)),
    }
}

pub async fn get_account_info(address: &str) -> Result<Option<serde_json::Value>, String> {
    let json_payload = format!(
        r#"{{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["{}",{{"encoding":"base64"}}]}}"#,
        address
    );

    match call_solana_rpc(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse account info response: {}", e))?;

            if let Some(result) = response.get("result").and_then(|r| r.get("value")) {
                if result.is_null() {
                    Ok(None)
                } else {
                    Ok(Some(result.clone()))
                }
            } else {
                Err("Failed to get account info from response".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get account info: {}", e)),
    }
}

pub async fn get_transaction_by_hash(tx_hash: &str) -> Result<serde_json::Value, String> {
    const MAX_RETRIES: u8 = 10;
    const RETRY_DELAY_MS: u64 = 2000; // 2 seconds
    
    for attempt in 0..MAX_RETRIES {
        let json_payload = format!(
            r#"{{"jsonrpc":"2.0","id":1,"method":"getTransaction","params":["{}",{{"encoding":"json","maxSupportedTransactionVersion":0,"commitment":"confirmed"}}]}}"#,
            tx_hash
        );

        match call_solana_rpc(json_payload).await {
            Ok(result_str) => {
                let response: serde_json::Value = serde_json::from_str(&result_str)
                    .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

                if let Some(result) = response.get("result") {
                    if result.is_null() {
                        if attempt < MAX_RETRIES - 1 {
                            ic_cdk::println!(
                                "Transaction not found, retrying in {}ms... (attempt {}/{})",
                                RETRY_DELAY_MS,
                                attempt + 1,
                                MAX_RETRIES
                            );
                            
                            let delay_nanos = RETRY_DELAY_MS * 1_000_000;
                            let start = ic_cdk::api::time();
                            while ic_cdk::api::time() - start < delay_nanos {

                            }
                            continue;
                        } else {
                            return Err(
                                "Transaction not found after multiple retries. The transaction may not be confirmed yet or may not exist.".to_string()
                            );
                        }
                    }
                    return Ok(result.clone());
                } else if let Some(error) = response.get("error") {
                    return Err(format!("RPC error: {}", error));
                } else {
                    return Err("No result or error in transaction response".to_string());
                }
            }
            Err(e) => {
                if attempt < MAX_RETRIES - 1 {
                    ic_cdk::println!(
                        "RPC call failed: {}, retrying... (attempt {}/{})",
                        e,
                        attempt + 1,
                        MAX_RETRIES
                    );
                    
                    let delay_nanos = RETRY_DELAY_MS * 1_000_000;
                    let start = ic_cdk::api::time();
                    while ic_cdk::api::time() - start < delay_nanos {
                    }
                    continue;
                } else {
                    return Err(format!("RPC call for transaction data failed after {} retries: {}", MAX_RETRIES, e));
                }
            }
        }
    }
    
    Err("Failed to get transaction after all retries".to_string())
}

pub async fn get_transaction_status(tx_hash: &str) -> Result<String, String> {
    let json_payload = format!(
        r#"{{"jsonrpc":"2.0","id":1,"method":"getSignatureStatuses","params":[["{}"],{{"searchTransactionHistory":true}}]}}"#,
        tx_hash
    );

    match call_solana_rpc(json_payload).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse status response: {}", e))?;

            if let Some(result) = response
                .get("result")
                .and_then(|r| r.get("value"))
                .and_then(|v| v.get(0))
            {
                if result.is_null() {
                    return Ok("not_found".to_string());
                }
                
                if let Some(confirmation_status) = result.get("confirmationStatus").and_then(|s| s.as_str()) {
                    return Ok(confirmation_status.to_string());
                }
                
                return Ok("unknown".to_string());
            }
            
            Err("Failed to get transaction status from response".to_string())
        }
        Err(e) => Err(format!("Failed to get transaction status: {}", e)),
    }
}
