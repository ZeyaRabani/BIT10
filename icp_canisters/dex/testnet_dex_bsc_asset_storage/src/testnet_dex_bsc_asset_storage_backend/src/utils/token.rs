use crate::utils::types::{Token, Pair, PriceFeed, PriceFeedId};
use crate::utils::constants::PRICE_FEED_CANISTER_ID;
use candid::Principal;
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
            price_feed_id: "78234y37492374178234y3749".to_string(),
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
            price_feed_id: "78234y37492374178234y3749".to_string(),
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
            price_feed_id: "78234y37492374178234y3749".to_string(),
        }
    ]
}

pub fn get_supported_pairs() -> Vec<Pair> {
    vec![
        Pair {
            pool_id: "39ef62".to_string(),
            token_a_symbol: "tBNB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "1839".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "3408_1839".to_string(),
            pair_type: "Same-Chain".to_string(),
        },
        Pair {
            pool_id: "cg15vp".to_string(),
            token_a_symbol: "tBNB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "1839".to_string(),
            token_b_symbol: "BTCB".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "4023_1839".to_string(),
            pair_type: "Same-Chain".to_string(),
        },
        Pair {
            pool_id: "dat49f".to_string(),
            token_a_symbol: "BTCB".to_string(),
            token_a_chain: "Binance Smart Chain".to_string(),
            token_a_token_id: "4023_1839".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "3408_1839".to_string(),
            pair_type: "Same-Chain".to_string(),
        }
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

pub fn calculate_base_amount_from_sent(amount_sent: &Decimal) -> Decimal {
    amount_sent / dec!(1.01)
}

pub fn check_slippage_tolerance_usd(
    usd_sent: f64,
    calculated_tick_out: &Decimal,
    token_out_price: f64,
    slippage_percent: &Decimal,
) -> (bool, Decimal) {
    let calculated_tick_out_f64 = calculated_tick_out.to_f64().unwrap_or(0.0);
    let usd_received = calculated_tick_out_f64 * token_out_price;

    if usd_sent == 0.0 {
        return (false, Decimal::ZERO);
    }

    let slippage_amount_absolute = (usd_sent - usd_received).abs();
    let percent_difference =
        Decimal::from_f64((slippage_amount_absolute / usd_sent) * 100.0)
            .unwrap_or(Decimal::ZERO);

    let can_swap = percent_difference <= *slippage_percent;

    (can_swap, percent_difference)
}