use candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SwapArgs {
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub expected_amount_out: String,
    pub slippage: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SwapResponse {
    pub swap_id: String,
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub amount_out: String,
    pub slippage: String,
    pub tx_hash_in: String,
    pub tx_hash_out: String,
    pub status: String,
    pub timestamp: u64,
}

pub type SwapResult = Result<SwapResponse, String>;
