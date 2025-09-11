use crate::lib::{
    PriceFeed, SwapArgs, Token, TATUM_API_KEY,
};
use crate::state::{read_state, EthereumNetwork, PRICE_FEED_CANISTER};
use alloy_primitives::{hex, Address, U256};
use candid::{Nat, Principal};
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext, http_request
};
use num_traits::{cast::ToPrimitive, FromPrimitive};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde_json::Value;
use std::str::FromStr;

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
            }
            Err((_, msg)) if msg.contains("No consensus") || msg.contains("SysTransient") => {
                retries += 1;
                ic_cdk::println!("Retry {} for request: {}", retries, request.url);
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

pub async fn call_rpc_with_retry(json_payload: String, api_key: &str) -> Result<String, String> {
    let request_headers = vec![
        HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        },
        HttpHeader {
            name: "X-API-Key".to_string(),
            value: api_key.to_string(),
        },
    ];

    let transform_context = TransformContext::from_name("transform".to_string(), vec![]);
    let network = read_state(|s| s.ethereum_network());
    let url = get_rpc_url(network).to_string();

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
            let body_str = String::from_utf8(body).map_err(|e| format!("Failed to decode response: {}", e))?;
            Ok(body_str)
        }
        Err(e) => Err(e),
    }
}

pub fn get_rpc_url(network: EthereumNetwork) -> &'static str {
    match network {
        EthereumNetwork::Mainnet => "https://eth.llamarpc.com",
        EthereumNetwork::Sepolia => "https://ethereum-sepolia.gateway.tatum.io/",
    }
}

pub fn get_supported_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: Some("1839".to_string()),
            token_name: "tBNB".to_string(),
            token_symbol: "tBNB".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000b".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("yasgdvghsdfgyub".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("3408_1839".to_string()),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_address: Some("0x64544969ed7EBf5f083679233325356EbE738930".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("zsggdvchbdjfksdjf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("4023_1839".to_string()),
            token_name: "BTCB".to_string(),
            token_symbol: "BTCB".to_string(),
            token_address: Some("0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("djfyuhbsdgndkfbfdf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("1027".to_string()),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000e".to_string()),
            token_chain: "Ethereum".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("zdgfhjbfjdkxfmk".to_string()),
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
            price_feed_id: Some("dhvbghbxfhvjnfk".to_string()),
            price_feed_link: None,
        },
    ]
}

pub fn get_supported_bit10_tokens() -> Vec<Token> {
    vec![Token {
        token_id: None,
        token_name: "Test BIT10.TOP".to_string(),
        token_symbol: "tBIT10".to_string(),
        token_address: Some("0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D".to_string()),
        token_chain: "Ethereum".to_string(),
        token_decimals: 18,
        is_native: false,
        is_active: true,
        price_feed_id: None,
        price_feed_link: Some("https://backend-91c09684-367d-4578-8623-5085be8c9158.bit10.app/bit10-top-current-price".to_string()),
    }]
}

pub fn normalize_address_for_comparison(address: &str) -> String {
    let normalized = address.to_lowercase();
    match normalized.as_str() {
        "0x0000000000000000000000000000000000000000" => normalized,
        _ => normalized,
    }
}

pub fn addresses_match(addr1: &str, addr2: &str) -> bool {
    let norm1 = normalize_address_for_comparison(addr1);
    let norm2 = normalize_address_for_comparison(addr2);

    if norm1 == norm2 {
        return true;
    }

    let native_variations = [
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000b",
        "0x0000000000000000000000000000000000000000e",
    ];

    if native_variations.contains(&norm1.as_str()) && native_variations.contains(&norm2.as_str())
    {
        return norm1 == norm2;
    }

    false
}

pub async fn get_bit10_token_price(token: &Token) -> Result<f64, String> {
    let price_feed_link = token
        .price_feed_link
        .as_ref()
        .ok_or("Token does not have a price_feed_link")?;

    let request = CanisterHttpRequestArgument {
        url: price_feed_link.clone(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(4096),
        transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
        headers: vec![],
    };

    let response_body = make_http_request(request).await?;
    let body_str =
        String::from_utf8(response_body).map_err(|e| format!("Failed to decode response: {}", e))?;

    let json_response: serde_json::Value = serde_json::from_str(&body_str)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    let token_price = json_response
        .get("tokenPrice")
        .and_then(|v| v.as_f64())
        .ok_or("Failed to extract tokenPrice from response")?;

    Ok(token_price)
}

pub async fn get_token_price_from_feed(token: &Token) -> Result<f64, String> {
    let price_feed_id = token
        .price_feed_id
        .as_ref()
        .ok_or("Token does not have a price_feed_id")?;

    let price_result: Result<(Option<PriceFeed>,), _> =
        ic_cdk::call(PRICE_FEED_CANISTER, "get_value", (price_feed_id.clone(),)).await;

    let price_feed = match price_result {
        Ok((Some(feed),)) => feed,
        Ok((None,)) => return Err("Price feed not found".to_string()),
        Err(e) => return Err(format!("Failed to get price feed: {:?}", e)),
    };

    let price = match ciborium::from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value,
        Err(_) => {
            match ciborium::from_reader::<u64, _>(&price_feed.value[..]) {
                Ok(int_value) => int_value as f64,
                Err(e) => return Err(format!("Failed to decode CBOR price: {}", e)),
            }
        }
    };

    Ok(price)
}

pub async fn get_dynamic_fees() -> Result<(u128, u128), String> {
    let json_payload =
        r#"{"jsonrpc": "2.0", "method": "eth_gasPrice", "params": [], "id": 1}"#.to_string();

    match call_rpc_with_retry(json_payload, TATUM_API_KEY).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse gas price response: {}", e))?;

            if let Some(gas_price_hex) = response.get("result").and_then(|v| v.as_str()) {
                let gas_price = u128::from_str_radix(
                    gas_price_hex.strip_prefix("0x").unwrap_or(""),
                    16,
                )
                .map_err(|e| format!("Failed to parse gas price hex: {}", e))?;

                let max_priority_fee_per_gas = 2_000_000_000u128;
                let max_fee_per_gas = gas_price + max_priority_fee_per_gas;

                Ok((max_fee_per_gas, max_priority_fee_per_gas))
            } else {
                Err("eth_gasPrice returned no result".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for gas price failed: {}", e)),
    }
}

pub fn extract_erc20_amount_from_transaction_input(
    input_data: &str,
    expected_recipient: &str,
) -> Result<U256, String> {
    if !input_data.starts_with("0x") {
        return Err("Invalid input data format: missing 0x prefix".to_string());
    }

    let hex_data = &input_data[2..];

    if hex_data.len() < 136 {
        return Err(format!(
            "Input data too short for ERC20 transfer: {} chars, need at least 136",
            hex_data.len()
        ));
    }

    if !hex_data.starts_with("a9059cbb") {
        return Err("Not an ERC20 transfer function call".to_string());
    }

    if hex_data.len() < 72 {
        return Err("Input data too short to extract recipient address".to_string());
    }

    let recipient_hex = &hex_data[8..72];
    if recipient_hex.len() != 64 {
        return Err(format!(
            "Recipient hex data has wrong length: {} chars, expected 64",
            recipient_hex.len()
        ));
    }

    let recipient_address = format!("0x{}", &recipient_hex[24..64]);

    if !recipient_address.eq_ignore_ascii_case(expected_recipient) {
        return Err(format!(
            "Transfer not to expected recipient. Expected: {}, Found: {}",
            expected_recipient, recipient_address
        ));
    }

    if hex_data.len() < 136 {
        return Err("Input data too short to extract amount".to_string());
    }

    let amount_hex = &hex_data[72..136];
    U256::from_str_radix(amount_hex, 16).map_err(|e| format!("Failed to parse transfer amount: {}", e))
}

pub fn decode_erc20_recipient_address(input_data: &str) -> Option<String> {
    if !input_data.starts_with("0x") || input_data.len() < 138 {
        return None;
    }

    let hex_data = &input_data[2..];

    if !hex_data.starts_with("a9059cbb") {
        return None;
    }

    if hex_data.len() < 72 {
        return None;
    }

    let recipient_hex = &hex_data[8..72];
    if recipient_hex.len() != 64 {
        return None;
    }

    Some(format!("0x{}", &recipient_hex[24..64]))
}

pub async fn decode_eth_transaction_data(
    tx_data: &serde_json::Value,
    _from_address: &str,
) -> Option<SwapArgs> {
    let input_data = tx_data.get("input").unwrap_or(&serde_json::Value::Null);
    let input_str = input_data.as_str().unwrap_or("0x");

    if input_str == "0x" || input_str.len() <= 2 {
        return None;
    }

    let hex_data = if input_str.starts_with("0x") {
        &input_str[2..]
    } else {
        input_str
    };

    let bytes = match hex::decode(hex_data) {
        Ok(bytes) => bytes,
        Err(e) => {
            ic_cdk::println!("Failed to decode hex data: {}", e);
            return None;
        }
    };

    let json_start_pos = bytes.windows(1).rposition(|w| w == b"{")?;
    let json_bytes = &bytes[json_start_pos..];
    let json_str = String::from_utf8_lossy(json_bytes);

    ic_cdk::println!("Extracted JSON string: {}", json_str);

    match serde_json::from_str::<SwapArgs>(&json_str) {
        Ok(args) => Some(args),
        Err(e) => {
            ic_cdk::println!("Failed to parse as SwapArgs: {}", e);

            match serde_json::from_str::<serde_json::Value>(&json_str) {
                Ok(json_value) => {
                    ic_cdk::println!("Parsed as generic JSON: {}", json_value);

                    let user_wallet_address = json_value
                        .get("user_wallet_address")
                        .or_else(|| json_value.get("tick_in_wallet_address"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    let token_in_address = json_value
                        .get("token_in_address")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    let token_in_amount = json_value
                        .get("token_in_amount")
                        .or_else(|| json_value.get("tick_in_amount"))
                        .or_else(|| json_value.get("amount_in"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("0")
                        .to_string();

                    let token_out_address = json_value
                        .get("token_out_address")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    let token_out_amount = json_value
                        .get("token_out_amount")
                        .or_else(|| json_value.get("tick_out_amount"))
                        .or_else(|| json_value.get("expected_amount_out"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("0")
                        .to_string();

                    if !user_wallet_address.is_empty()
                        && !token_in_address.is_empty()
                        && !token_out_address.is_empty()
                    {
                        Some(SwapArgs {
                            user_wallet_address,
                            token_in_address,
                            token_in_amount,
                            token_out_address,
                            token_out_amount,
                        })
                    } else {
                        ic_cdk::println!("Missing required fields in JSON");
                        None
                    }
                }
                Err(e2) => {
                    ic_cdk::println!("Failed to parse as generic JSON: {}", e2);
                    None
                }
            }
        }
    }
}

pub fn extract_actual_amount_from_transaction(
    tx_data: &serde_json::Value,
    token: &Token,
    canister_address: &str,
) -> Result<U256, String> {
    if token.is_native {
        let value_hex = tx_data
            .get("value")
            .and_then(|v| v.as_str())
            .ok_or("Missing value field in transaction")?;

        let clean_hex = value_hex.strip_prefix("0x").unwrap_or(value_hex);
        if clean_hex.is_empty() || clean_hex == "0" {
            return Ok(U256::ZERO);
        }

        U256::from_str_radix(clean_hex, 16)
            .map_err(|e| format!("Failed to parse transaction value '{}': {}", value_hex, e))
    } else {
        let input_data = tx_data
            .get("input")
            .and_then(|v| v.as_str())
            .ok_or("Missing input field in transaction")?;

        if input_data == "0x" {
            return Err("Transaction input is empty - not an ERC20 transfer".to_string());
        }

        extract_erc20_amount_from_transaction_input(input_data, canister_address)
    }
}

pub fn u256_to_decimal_string(value: U256, decimals: u8) -> Result<String, String> {
    let value_str = value.to_string();
    let value_decimal =
        Decimal::from_str(&value_str).map_err(|_| "Failed to convert U256 to Decimal")?;
    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    let result = value_decimal / scale_factor;
    Ok(result.to_string())
}