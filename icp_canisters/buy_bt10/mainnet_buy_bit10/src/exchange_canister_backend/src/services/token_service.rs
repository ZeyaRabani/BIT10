use crate::state::storage;
use crate::types::token::{BIT10TokenResponse, Token, TokenAllocation, TokenDetails};
use crate::utils::constants::PRICE_FEED_CANISTER;
use candid::Principal;
use ciborium::from_reader;
use ic_cdk::api::management_canister::http_request::{CanisterHttpRequestArgument, HttpHeader, HttpMethod};
use rust_decimal::Decimal;
use std::collections::HashMap;
use std::str::FromStr;

pub fn get_supported_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: Some("8916".to_string()),
            token_name: "ICP".to_string(),
            token_symbol: "ICP".to_string(),
            token_address: Some("ryjl3-tyaaa-aaaaa-aaaba-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: true,
            is_active: true,
            price_feed_id: Some("jcfjnfjkngfkhmh".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("28909".to_string()),
            token_name: "ckBTC".to_string(),
            token_symbol: "ckBTC".to_string(),
            token_address: Some("mxzaz-hqaaa-aaaar-qaada-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("fhcbvhjngjknghn".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("28910".to_string()),
            token_name: "ckETH".to_string(),
            token_symbol: "ckETH".to_string(),
            token_address: Some("ss2fx-dyaaa-aaaar-qacoq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: Some("xcnvjcnvbjk".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("1027".to_string()),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000b".to_string()),
            token_chain: "Base".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("jcxvnjkbncvkb".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("1839".to_string()),
            token_name: "BNB".to_string(),
            token_symbol: "BNB".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000bnb".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("xcvjncvbncvkb".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("3408_1839".to_string()),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_address: Some("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("xncvjncvbcv".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("6".to_string()),
            token_name: "Solana".to_string(),
            token_symbol: "SOL".to_string(),
            token_address: Some("So11111111111111111111111111111111111111111".to_string()), // Case sensetive
            token_chain: "Solana".to_string(),
            token_decimals: 9,
            is_native: true,
            is_active: true,
            price_feed_id: Some("xhvchxbcvjvb".to_string()),
            price_feed_link: None,
        },
    ]
}

pub fn get_supported_bit10_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: None,
            token_name: "BIT10.DEFI".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("bin4j-cyaaa-aaaap-qh7tq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: None,
            price_feed_link: Some(
                "szhgvghxbcvhjbcjvknxcv"
                    .to_string(),
            ),
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("g37b3-lqaaa-aaaap-qp4hq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: None,
            price_feed_link: Some(
                "sdjhxvbgcxhvjcnvbkcvbcvb"
                    .to_string(),
            ),
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("0x2d309c7c5fbbf74372edfc25b10842a7237b92de".to_string()),
            token_chain: "Base".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: None,
            price_feed_link: Some(
                "jchxbhjxcnvjcvkbv"
                    .to_string(),
            ),
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: None,
            price_feed_link: Some(
                "asdjbxjkcnvcv"
                    .to_string(),
            ),
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1".to_string()),
            token_chain: "Solana".to_string(),
            token_decimals: 9,
            is_native: false,
            is_active: true,
            price_feed_id: None,
            price_feed_link: Some(
                "hzbddjxvncmvkcmv"
                    .to_string(),
            ),
        },
    ]
}

pub fn get_bit10_token_info() -> BIT10TokenResponse {
    let supported_tokens = get_supported_bit10_tokens();
    let token_data = storage::get_token_data();
    let mut tokens = HashMap::new();

    let mut unique_tokens = HashMap::new();
    for token in supported_tokens {
        unique_tokens.insert(
            token.token_name.clone(),
            (token.token_symbol.clone(), token.token_name.clone()),
        );
    }

    for (token_name, (_symbol, name)) in unique_tokens {
        if let Some((total_supply, chain_data)) = token_data.get(&token_name) {
            let mut allocations = Vec::new();
            let chain_count = chain_data.len() as f64;
            let allocation_per_chain = 100.0 / chain_count;

            for (chain, token_address, total_bought, total_sold) in chain_data {
                let total_chain_supply =
                    calculate_chain_allocation(total_supply, allocation_per_chain);

                allocations.push(TokenAllocation {
                    chain: chain.clone(),
                    token_address: token_address.clone(),
                    total_chain_supply,
                    total_tokens_bought: total_bought.clone(),
                    total_tokens_sold: total_sold.clone(),
                });
            }

            tokens.insert(
                token_name.clone(),
                TokenDetails {
                    name: name.clone(),
                    symbol: _symbol.clone(),
                    total_supply: total_supply.clone(),
                    allocations,
                },
            );
        }
    }

    BIT10TokenResponse { tokens }
}

fn calculate_chain_allocation(total_supply: &str, allocation_percentage: f64) -> String {
    if let Ok(supply) = total_supply.parse::<f64>() {
        let chain_supply = supply * allocation_percentage / 100.0;
        format!("{:.8}", chain_supply)
    } else {
        "0".to_string()
    }
}

pub async fn get_token_price_from_feed(token: &Token) -> Result<f64, String> {
    let price_feed_id = token
        .price_feed_id
        .as_ref()
        .ok_or("Token does not have a price_feed_id")?;

    #[derive(candid::CandidType, serde::Deserialize)]
    struct PriceFeedResult {
        value: Vec<u8>,
        timestamp: u64,
    }

    let price_feed_canister =
        Principal::from_text(PRICE_FEED_CANISTER).expect("Invalid price feed canister ID");

    let price_result: Result<(Option<PriceFeedResult>,), _> = ic_cdk::call(
        price_feed_canister,
        "get_value",
        (price_feed_id.clone(),),
    )
    .await;

    match price_result {
        Ok((Some(feed),)) => match from_reader::<f64, _>(&feed.value[..]) {
            Ok(value) => Ok(value),
            Err(_) => match from_reader::<u64, _>(&feed.value[..]) {
                Ok(int_value) => Ok(int_value as f64),
                Err(e) => Err(format!("Failed to decode CBOR price: {}", e)),
            },
        },
        Ok((None,)) => Err("Price feed not found".to_string()),
        Err(e) => Err(format!("Failed to get price feed: {:?}", e)),
    }
}

pub async fn get_bit10_token_price(token: &Token) -> Result<f64, String> {
    let price_feed_link = token
        .price_feed_link
        .as_ref()
        .ok_or("Token does not have a price_feed_link")?;

    let request_headers = vec![HttpHeader {
        name: "Content-Type".to_string(),
        value: "application/json".to_string(),
    }];

    let request = CanisterHttpRequestArgument {
        url: price_feed_link.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(8192),
        transform: None,
        headers: request_headers,
    };

    match crate::services::rpc_service::make_http_request(request).await {
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(response_str) => match serde_json::from_str::<serde_json::Value>(&response_str) {
                Ok(json) => {
                    if let Some(price) = json.get("tokenPrice").and_then(|v| v.as_f64()) {
                        Ok(price)
                    } else {
                        Err("Failed to extract tokenPrice from response".to_string())
                    }
                }
                Err(e) => Err(format!("Failed to parse JSON response: {}", e)),
            },
            Err(e) => Err(format!("Failed to decode response: {}", e)),
        },
        Err(e) => Err(format!("Failed to make HTTP request: {}", e)),
    }
}

pub fn find_token_by_address(address: &str, chain: &str) -> Option<Token> {
    get_supported_tokens()
        .into_iter()
        .chain(get_supported_bit10_tokens())
        .find(|token| {
            token
                .token_address
                .as_ref()
                .map(|addr| {
                    addr.to_lowercase() == address.to_lowercase()
                        && token.token_chain.to_lowercase() == chain.to_lowercase()
                })
                .unwrap_or(false)
        })
}

pub fn find_bit10_token_by_address(address: &str, chain: &str) -> Option<Token> {
    get_supported_bit10_tokens().into_iter().find(|token| {
        token
            .token_address
            .as_ref()
            .map(|addr| {
                addr.to_lowercase() == address.to_lowercase()
                    && token.token_chain.to_lowercase() == chain.to_lowercase()
            })
            .unwrap_or(false)
    })
}

pub fn validate_bit10_token_availability(token_name: &str, token_address: &str, requested_amount: Decimal ) -> Result<(), String> {
    let bit10_info = get_bit10_token_info();

    let token_details = bit10_info
        .tokens
        .get(token_name)
        .ok_or_else(|| format!("Token {} not found in BIT10 token information", token_name))?;

    let allocation = token_details
        .allocations
        .iter()
        .find(|alloc| alloc.token_address.to_lowercase() == token_address.to_lowercase())
        .ok_or_else(|| {
            format!(
                "No matching allocation found for token {} at address {}",
                token_name, token_address
            )
        })?;

    let total_chain_supply = Decimal::from_str(&allocation.total_chain_supply)
        .map_err(|_| "Failed to parse total_chain_supply")?;
    let total_tokens_bought = Decimal::from_str(&allocation.total_tokens_bought)
        .map_err(|_| "Failed to parse total_tokens_bought")?;
    let total_tokens_sold = Decimal::from_str(&allocation.total_tokens_sold)
        .map_err(|_| "Failed to parse total_tokens_sold")?;

    let available_tokens = total_chain_supply - total_tokens_bought + total_tokens_sold;

    if requested_amount >= available_tokens {
        return Err(format!(
            "Requested amount {} must be less than available supply. Available: {}",
            requested_amount, available_tokens
        ));
    }

    Ok(())
}