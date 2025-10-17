use candid::{CandidType, Deserialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Token {
    pub token_id: Option<String>,
    pub token_name: String,
    pub token_symbol: String,
    pub token_address: Option<String>,
    pub token_chain: String,
    pub token_decimals: u8,
    pub is_native: bool,
    pub is_active: bool,
    pub price_feed_id: Option<String>,
    pub price_feed_link: Option<String>,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TokenAllocation {
    pub chain: String,
    pub token_address: String,
    pub total_chain_supply: String,
    pub total_tokens_bought: String,
    pub total_tokens_sold: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TokenDetails {
    pub name: String,
    pub symbol: String,
    pub total_supply: String,
    pub allocations: Vec<TokenAllocation>,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct BIT10TokenResponse {
    pub tokens: HashMap<String, TokenDetails>,
}