use candid::CandidType;

#[derive(CandidType, serde::Serialize)]
pub enum SwapResponse {
    Ok(SwapResponseData),
    Err(String),
}

#[derive(CandidType, serde::Deserialize, serde::Serialize, Clone)]
pub struct SwapResponseData {
    pub swap_id: String,
    pub user_wallet_address: String,
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_in_usd_amount: String,
    pub token_in_tx_hash: String,
    pub token_out_address: String,
    pub token_out_amount: String,
    pub token_out_tx_hash: String,
    pub transaction_type: String,
    pub transaction_timestamp: String,
    pub network: String,
}