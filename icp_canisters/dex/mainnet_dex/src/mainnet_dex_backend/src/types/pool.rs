use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, CandidType, Default)]
pub struct PoolData {
    pub pool_id: String,
    pub token_a: String,
    pub token_b: String,
    pub token_a_address: String,
    pub token_b_address: String,
    pub token_a_chain: String,
    pub token_b_chain: String,
    pub token_a_balance: String,
    pub token_b_balance: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PoolInfo {
    pub pool_id: String,
    pub token_a: String,
    pub token_a_address: String,
    pub token_a_chain: String,
    pub token_a_balance: String,
    pub token_b: String,
    pub token_b_address: String,
    pub token_b_chain: String,
    pub token_b_balance: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PoolsResponse {
    pub pools: Vec<PoolInfo>,
}