use crate::utils::types::{Token, Pair, PriceFeed, PriceFeedId};
use crate::utils::constants::PRICE_FEED_CANISTER_ID;
use ic_cdk::Principal;
use rust_decimal::Decimal;
use alloy_primitives::U256;
use std::str::FromStr;
use ciborium::from_reader;

pub fn get_supported_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: "1839".to_string(),
            token_name: "tBNB".to_string(),
            token_symbol: "tBNB".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000b".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: "2374178234y3749".to_string(),
        },
        Token {
            token_id: "3408_1839".to_string(),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_address: Some("0x64544969ed7EBf5f083679233325356EbE738930".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: "2374178234y3749".to_string(),
        },
        Token {
            token_id: "4023_1839".to_string(),
            token_name: "BTCB".to_string(),
            token_symbol: "BTCB".to_string(),
            token_address: Some("0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: "2374178234y3749".to_string(),
        },
        Token {
            token_id: "1027".to_string(),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000e".to_string()),
            token_chain: "Ethereum".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: "2374178234y3749".to_string(),
        },
        Token {
            token_id: "3408_1027".to_string(),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            token_address: Some("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238".to_string()),
            token_chain: "Ethereum".to_string(),
            token_decimals: 6,
            is_native: false,
            is_active: true,
            price_feed_id: "2374178234y3749".to_string(),
        }
    ]
}

pub fn get_supported_pairs() -> Vec<Pair> {
    vec![
        Pair {
            pool_id: "a9f2k3".to_string(),
            token_a_symbol: "tBNB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "1839".to_string(),
            token_b_symbol: "ETH".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "m3n8x1".to_string(),
            token_a_symbol: "tBNB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "1839".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "3408_1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "z6y4b8".to_string(),
            token_a_symbol: "USDC".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "3408_1839".to_string(),
            token_b_symbol: "ETH".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "q7p5d2".to_string(),
            token_a_symbol: "USDC".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "3408_1839".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "3408_1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "h4c9v7".to_string(),
            token_a_symbol: "BTCB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "4023_1839".to_string(),
            token_b_symbol: "ETH".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "t8k1w5".to_string(),
            token_a_symbol: "BTCB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "4023_1839".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Ethereum".to_string(),
            token_b_token_id: "3408_1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
    ]
}

pub async fn get_token_price(data_id: &str) -> Result<f64, String> {
    let price_feed_canister = PRICE_FEED_CANISTER_ID;

    let price_result: Result<(Option<PriceFeed>,), _> =
        ic_cdk::call(price_feed_canister, "get_value", (data_id,)).await;

    let price_feed = match price_result {
        Ok((Some(feed),)) => feed,
        Ok((None,)) => {
            return Err(format!("Price feed not found for data_id: {}", data_id))
        }
        Err(e) => return Err(format!("Failed to get price feed: {:?}", e)),
    };

    let price = match from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value,
        Err(_) => match from_reader::<u64, _>(&price_feed.value[..]) {
            Ok(int_value) => int_value as f64,
            Err(e) => return Err(format!("Failed to decode CBOR price: {}", e)),
        },
    };

    Ok(price)
}

pub fn extract_actual_amount_from_tx(
    tx_data: &serde_json::Value,
    token: &Token,
    canister_address: &str,
) -> Result<U256, String> {
    if token.is_native {
        let value_hex = tx_data.get("value")
            .and_then(|v| v.as_str())
            .ok_or("Missing value field in transaction")?;

        let clean_hex = value_hex.strip_prefix("0x").unwrap_or(value_hex);
        if clean_hex.is_empty() || clean_hex == "0" {
            return Ok(U256::ZERO);
        }

        U256::from_str_radix(clean_hex, 16)
            .map_err(|e| format!("Failed to parse transaction value '{}': {}", value_hex, e))
    } else {
        let input_data = tx_data.get("input")
            .and_then(|v| v.as_str())
            .ok_or("Missing input field in transaction")?;

        if input_data == "0x" {
            return Err("Transaction input is empty - not an ERC20 transfer".to_string());
        }

        extract_erc20_amount_from_input(input_data, canister_address)
    }
}

pub fn extract_erc20_amount_from_input(input_data: &str, expected_recipient: &str) -> Result<U256, String> {
    if !input_data.starts_with("0x") {
        return Err("Invalid input data format: missing 0x prefix".to_string());
    }

    let hex_data = &input_data[2..];

    if hex_data.len() < 136 {
        return Err(format!("Input data too short for ERC20 transfer: {} chars, need at least 136", hex_data.len()));
    }

    if !hex_data.starts_with("a9059cbb") {
        return Err("Not a transfer function call".to_string());
    }

    if hex_data.len() < 72 {
        return Err("Input data too short to extract recipient address".to_string());
    }

    let recipient_hex_padded = &hex_data[24..64];
    let recipient_address = format!("0x{}", recipient_hex_padded);

    if !recipient_address.eq_ignore_ascii_case(expected_recipient) {
        return Err(format!("Transfer not to expected recipient. Expected: {}, Found: {}", expected_recipient, recipient_address));
    }

    if hex_data.len() < 136 {
        return Err("Input data too short to extract amount".to_string());
    }

    let amount_hex = &hex_data[72..136];
    U256::from_str_radix(amount_hex, 16)
        .map_err(|e| format!("Failed to parse transfer amount: {}", e))
}