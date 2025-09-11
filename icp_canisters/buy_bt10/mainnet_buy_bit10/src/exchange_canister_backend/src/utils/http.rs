use ic_cdk::api::management_canister::http_request::{HttpMethod, http_request, CanisterHttpRequestArgument};

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