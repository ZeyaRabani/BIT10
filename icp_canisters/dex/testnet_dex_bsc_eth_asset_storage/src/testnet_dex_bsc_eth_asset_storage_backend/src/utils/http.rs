use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, http_request,
};
use candid::Nat;
use num::ToPrimitive;

pub async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    const MAX_RETRIES: u8 = 5;

    let mut retries = 0;

    while retries < MAX_RETRIES {
        let cycles: u128 = 25_000_000_000;
        match http_request(request.clone(), cycles).await {
            Ok((response,)) => {
                if response.status.0.to_u64().unwrap_or(0) == 200 {
                    return Ok(response.body);
                } else {
                    return Err(format!("HTTP error: status {}", response.status));
                }
            },
            Err((_, msg)) if msg.contains("No consensus") || msg.contains("SysTransient") => {
                retries += 1;
                ic_cdk::println!("Retry {} for request: {}", retries, request.url);
                continue;
            },
            Err((_, msg)) => return Err(msg),
        }
    }

    Err(format!("Failed after {} retries. Last error: No consensus could be reached", MAX_RETRIES))
}

pub async fn make_robust_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    const MAX_RETRIES: u8 = 3;
    let cycles: u128 = 50_000_000_000;

    for attempt in 0..MAX_RETRIES {
        match http_request(request.clone(), cycles).await {
            Ok((response,)) => {
                let status_code = response.status.0.to_u64().unwrap_or(0);
                if status_code == 200 {
                    return Ok(response.body);
                } else {
                    return Err(format!("HTTP error: status {}", status_code));
                }
            },
            Err((_, msg)) if msg.contains("No consensus") || msg.contains("SysTransient") => {
                if attempt < MAX_RETRIES - 1 {
                    continue;
                } else {
                    return Err(format!("Failed after {} retries: {}", MAX_RETRIES, msg));
                }
            },
            Err((_, msg)) => {
                return Err(format!("HTTP request failed: {}", msg));
            }
        }
    }

    Err("Unexpected error in HTTP request loop".to_string())
}

pub async fn call_rpc_with_retry(json_payload: String) -> Result<String, String> {
    use crate::state::read_state;
    use super::constants::TATUM_API_KEY;

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
    let url = network.rpc_url().to_string();

    let request = CanisterHttpRequestArgument {
        url,
        method: HttpMethod::POST,
        body: Some(json_payload.into_bytes()),
        max_response_bytes: Some(8192),
        transform: Some(transform_context),
        headers: request_headers,
    };

    make_http_request(request).await.and_then(|body| {
        String::from_utf8(body).map_err(|e| format!("Failed to decode response: {}", e))
    })
}

pub async fn call_rpc_with_retry_on_chain(json_payload: String, chain: crate::utils::types::ChainType) -> Result<String, String> {
    use crate::state::read_state;
    use super::constants::TATUM_API_KEY;

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);

    let (url, api_key) = match chain {
        crate::utils::types::ChainType::BSC => (read_state(|s| s.bsc_rpc_url()), TATUM_API_KEY),
        crate::utils::types::ChainType::Ethereum => (read_state(|s| s.ethereum_rpc_url()), TATUM_API_KEY),
    };

    let request = CanisterHttpRequestArgument {
        method: HttpMethod::POST,
        url: url.to_string(),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "x-api-key".to_string(), value: api_key.to_string() },
        ],
        body: Some(json_payload.as_bytes().to_vec()),
        max_response_bytes: Some(4_000),
        transform: Some(transform_context),
    };

    make_robust_http_request(request).await.and_then(|body| {
        String::from_utf8(body).map_err(|e| format!("Failed to decode response: {}", e))
    })
}

#[query]
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