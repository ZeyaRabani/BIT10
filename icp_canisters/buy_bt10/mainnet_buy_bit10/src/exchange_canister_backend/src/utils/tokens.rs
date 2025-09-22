use candid::Principal;
use ciborium::from_reader;
use serde_json::Value;
use crate::lib::{Token};
use crate::utils::http::{make_http_request, call_rpc_with_retry};
use crate::utils::constants::PRICE_FEED_CANISTER_ID;
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};

pub async fn get_token_price_from_feed(token: &Token) -> Result<f64, String> {
    let price_feed_id = token.price_feed_id.as_ref()
        .ok_or_else(|| format!("Token {} does not have a price_feed_id", token.token_symbol))?;

    #[derive(candid::CandidType, serde::Deserialize)]
    struct PriceFeedResult {
        value: Vec<u8>,
        timestamp: u64,
    }

    let price_feed_canister = Principal::from_text(PRICE_FEED_CANISTER_ID)
        .expect("Invalid price feed canister ID configured");

    let price_result: Result<(Option<PriceFeedResult>,), _> = ic_cdk::call(
        price_feed_canister,
        "get_value",
        (price_feed_id.clone(),),
    ).await;

    match price_result {
        Ok((Some(feed),)) => {
            match from_reader::<f64, _>(&feed.value[..]) {
                Ok(value) => Ok(value),
                Err(_) => {
                    match from_reader::<u64, _>(&feed.value[..]) {
                        Ok(int_value) => Ok(int_value as f64),
                        Err(e) => Err(format!(
                            "Failed to decode CBOR price for {}: {}",
                            token.token_symbol, e
                        )),
                    }
                }
            }
        },
        Ok((None,)) => Err(format!("Price feed not found for {}", token.token_symbol)),
        Err(e) => Err(format!("Failed to get price feed for {}: {:?}", token.token_symbol, e)),
    }
}

pub async fn get_bit10_token_price(token: &Token) -> Result<f64, String> {
    let price_feed_link = token.price_feed_link.as_ref()
        .ok_or_else(|| format!("BIT10 token {} does not have a price_feed_link", token.token_symbol))?;

    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }
    ];

    let request = CanisterHttpRequestArgument {
        url: price_feed_link.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(8192),
        transform: None,
        headers: request_headers,
    };

    match make_http_request(request).await {
        Ok(bytes) => {
            match String::from_utf8(bytes) {
                Ok(response_str) => {
                    match serde_json::from_str::<serde_json::Value>(&response_str) {
                        Ok(json) => {
                            if let Some(price) = json.get("tokenPrice").and_then(|v| v.as_f64()) {
                                Ok(price)
                            } else {
                                Err(format!(
                                    "Failed to extract 'tokenPrice' from JSON response for {}. Response: {}",
                                    token.token_symbol, response_str
                                ))
                            }
                        },
                        Err(e) => Err(format!(
                            "Failed to parse JSON response for {}: {}. Response: {}",
                            token.token_symbol, e, response_str
                        )),
                    }
                },
                Err(e) => Err(format!(
                    "Failed to decode HTTP response body for {}: {}",
                    token.token_symbol, e
                )),
            }
        },
        Err(e) => Err(format!(
            "Failed to make HTTP request for {} price feed: {}",
            token.token_symbol, e
        )),
    }
}