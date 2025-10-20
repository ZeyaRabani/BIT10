use candid::CandidType;
use serde::{Deserialize};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Token {
    pub token_id: String,
    pub token_name: String,
    pub token_symbol: String,
    pub token_address: Option<String>,
    pub token_chain: String,
    pub token_decimals: u8,
    pub is_native: bool,
    pub is_active: bool,
    pub price_feed_id: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Pair {
    pub pool_id: String,
    pub token_a_symbol: String,
    pub token_a_chain: String,
    pub token_a_token_id: String,
    pub token_b_symbol: String,
    pub token_b_chain: String,
    pub token_b_token_id: String,
    pub pair_type: String,
}