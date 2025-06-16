use crate::constants::PRICE_FEED_CANISTER_ID;
use crate::types::swap::{PriceFeed, FeedId};
use ic_cdk::api::management_canister::http_request::{HttpMethod, http_request, CanisterHttpRequestArgument};
use serde_json::Value;

pub async fn get_price_feed(data_id: &str) -> Result<PriceFeed, String> {
    let price_result: Result<(Option<PriceFeed>,), _> = ic_cdk::call(
        PRICE_FEED_CANISTER_ID,
        "get_value",
        (data_id,)
    ).await;

    match price_result {
        Ok((Some(feed),)) => Ok(feed),
        Ok((None,)) => Err("Price feed not found".to_string()),
        Err(e) => Err(format!("Failed to get price feed: {:?}", e)),
    }
}

pub async fn get_token_price(api_url: &str) -> Result<f64, String> {
    let request = CanisterHttpRequestArgument {
        url: api_url.to_string(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: None,
        headers: vec![],
    };

    let body = make_http_request(request).await?;
    let body_str = String::from_utf8(body)
        .map_err(|e| format!("Failed to parse response body: {}", e))?;

    let json: Value = serde_json::from_str(&body_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    json["tokenPrice"]
        .as_f64()
        .ok_or_else(|| "Failed to extract token price from JSON".to_string())
}

async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
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