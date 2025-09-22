use candid::Principal;
use ciborium::from_reader;
use serde_json::Value;

use crate::lib::Token;
use crate::lib::PriceFeedResult;
use crate::utils::http::{make_http_request};
use crate::utils::constants::PRICE_FEED_CANISTER_ID;
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext,
};

pub fn get_supported_lending_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: Some("3408_8916".to_string()),
            token_name: "ckUSDC".to_string(),
            token_symbol: "ckUSDC".to_string(),
            token_address: Some("eegan-kqaaa-aaaap-qhmgq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: Some("ldjnjndlkfm".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("3408_1027".to_string()),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_address: Some("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238".to_string()),
            token_chain: "Ethereum".to_string(),
            token_decimals: 6,
            is_native: false,
            is_active: true,
            price_feed_id: Some("jkdnjkndfgfgb".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("ETH".to_string()),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000".to_string()),
            token_chain: "Ethereum".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("sdfbhdfjnjkdf".to_string()),
            price_feed_link: None,
        }
    ]
}

pub fn get_supported_pairs() -> Vec<crate::lib::Pair> {
    vec![
        crate::lib::Pair {
            borrow_token_chain: "ICP".to_string(),
            borrow_token_address: "eegan-kqaaa-aaaap-qhmgq-cai".to_string(),
            borrow_token_id: "3408_8916".to_string(),
            collateral_token_chain: "ICP".to_string(),
            collateral_token_address: "wbckh-zqaaa-aaaap-qpuza-cai".to_string(),
            collateral_token_id: "top".to_string(),
            collateral_price_feed_link: "https://bsdhbdjfkgfdgfdg.bit10.app/bit10-top-current-price".to_string(),
        },
        crate::lib::Pair {
            borrow_token_chain: "Ethereum".to_string(),
            borrow_token_address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238".to_string(),
            borrow_token_id: "3408_1027".to_string(),
            collateral_token_chain: "ICP".to_string(),
            collateral_token_address: "wbckh-zqaaa-aaaap-qpuza-cai".to_string(),
            collateral_token_id: "top".to_string(),
            collateral_price_feed_link: "https://sdbhfjdffkmgfg.bit10.app/bit10-top-current-price".to_string(),
        },
        crate::lib::Pair {
            borrow_token_chain: "Ethereum".to_string(),
            borrow_token_address: "0x0000000000000000000000000000000000000000".to_string(),
            borrow_token_id: "ETH".to_string(),
            collateral_token_chain: "ICP".to_string(),
            collateral_token_address: "wbckh-zqaaa-aaaap-qpuza-cai".to_string(),
            collateral_token_id: "top".to_string(),
            collateral_price_feed_link: "https://hsdbhfjnkdflgg.bit10.app/bit10-top-current-price".to_string(),
        },
    ]
}

pub async fn get_token_price_from_price_feed_canister(token: &Token) -> Result<f64, String> {
    let price_feed_id = token.price_feed_id.as_ref()
        .ok_or_else(|| format!("Token {} does not have a price_feed_id", token.token_symbol))?;

    let price_feed_canister = Principal::from_text(PRICE_FEED_CANISTER_ID)
        .map_err(|e| format!("Invalid price feed canister ID: {}", e))?;

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

pub async fn get_token_price_from_http_link(token: &Token) -> Result<f64, String> {
    let price_feed_link = token.price_feed_link.as_ref()
        .ok_or_else(|| format!("Token {} does not have a price_feed_link", token.token_symbol))?;

    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }
    ];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);

    let request = CanisterHttpRequestArgument {
        url: price_feed_link.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(8192),
        transform: Some(transform_context),
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