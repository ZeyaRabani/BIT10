use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, http_request,
};
use candid::Nat;
use num::ToPrimitive;
use crate::utils::constants::TATUM_API_KEY;
use crate::state::read_state;

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
                ic_cdk::println!("Transient HTTP error (attempt {}/{}): {}", attempt + 1, MAX_RETRIES, msg);
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

pub async fn make_rpc_request(json_payload: String) -> Result<String, String> {
    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);
    let rpc_url = read_state(|s| s.bsc_rpc_url());

    let request = CanisterHttpRequestArgument {
        method: HttpMethod::POST,
        url: rpc_url.to_string(),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "x-api-key".to_string(), value: TATUM_API_KEY.to_string() },
        ],
        body: Some(json_payload.as_bytes().to_vec()),
        max_response_bytes: Some(4_000),
        transform: Some(transform_context),
    };

    let response_body = make_robust_http_request(request).await?;
    String::from_utf8(response_body).map_err(|e| format!("Failed to decode response: {}", e))
}


#[query]
pub fn transform(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers: vec![],
    };

    if res.status == Nat::from(200u64) {
        res.body = raw.response.body;
    } else {
        ic_cdk::api::print(format!(
            "Received an error from the remote service: status {}, body: {}",
            raw.response.status,
            String::from_utf8_lossy(&raw.response.body)
        ));
        res.body = vec![];
    }
    res
}