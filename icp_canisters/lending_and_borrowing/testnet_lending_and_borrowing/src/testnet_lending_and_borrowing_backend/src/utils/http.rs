use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext, http_request,
};
use ic_cdk::api::time;
use num_traits::ToPrimitive;
use std::time::Duration;

use crate::state::{BscNetwork, EthereumNetwork, read_state};
use crate::utils::constants::TATUM_API_KEY_ETHEREUM;

const MAX_RETRIES: u8 = 5;
const BASE_RETRY_DELAY_MS: u64 = 500;

pub fn get_rpc_url_eth(network: EthereumNetwork) -> &'static str {
    match network {
        EthereumNetwork::Mainnet => "https://eth.llamarpc.com",
        EthereumNetwork::Sepolia => "https://ethereum-sepolia.gateway.tatum.io/",
    }
}

pub fn get_rpc_url_bsc(network: BscNetwork) -> &'static str {
    match network {
        BscNetwork::Testnet => "https://bsc-testnet.gateway.tatum.io/",
    }
}


pub async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    let mut retries = 0;

    while retries < MAX_RETRIES {
        let cycles: u128 = 25_000_000_000;
        match http_request(request.clone(), cycles).await {
            Ok((response,)) => {
                let status_code = response.status.0.to_u64().unwrap_or(0);
                if status_code == 200 {
                    return Ok(response.body);
                } else {
                    return Err(format!("HTTP error: status {}", status_code));
                }
            }
            Err((_, msg)) if msg.contains("No consensus") || msg.contains("SysTransient") => {
                retries += 1;
                let delay = BASE_RETRY_DELAY_MS * (1 << (retries - 1));
                ic_cdk::println!(
                    "Retry {} for request: {}. Transient error: {}. Retrying in {}ms...",
                    retries,
                    request.url,
                    msg,
                    delay
                );
                ic_cdk::api::call::perform_heartbeat().await;
                continue;
            }
            Err((_, msg)) => return Err(msg),
        }
    }

    Err(format!(
        "Failed after {} retries. Last error: No consensus could be reached or similar transient issue.",
        MAX_RETRIES
    ))
}

pub async fn call_rpc_with_retry_eth(json_payload: String) -> Result<String, String> {
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "X-API-Key".to_string(),
            value: TATUM_API_KEY_ETHEREUM.to_string(),
        },
    ];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);
    let network = read_state(|s| s.ethereum_network());
    let url = get_rpc_url_eth(network).to_string();

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
            let body_str =
                String::from_utf8(body).map_err(|e| format!("Failed to decode response: {}", e))?;
            Ok(body_str)
        }
        Err(e) => Err(e),
    }
}