use candid::{CandidType, Deserialize, Serialize};
use candid::Nat;
use ic_cdk::Principal;

#[derive(CandidType, Deserialize, Clone)]
pub struct ILPArgs {
    pub tick_in_name: String,
    pub tick_in_network: String,
    pub tick_in_tx_block: String,
    pub tick_out_name: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct IlpResponseData {
    pub tick_in_address: String,
    pub tick_in_name: String,
    pub tick_in_amount: Nat,
    pub tick_in_usd_amount: f64,
    pub tick_in_network: String,
    pub tick_in_tx_block: String,
    pub tick_out_address: Principal,
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
    pub tick_out_usd_amount: f64,
    pub tick_out_network: String,
    pub tick_out_tx_block: String,
    pub liquidation_type: String,
    pub transaction_timestamp: String,
}

#[derive(CandidType, Serialize)]
pub enum IlpResponse {
    Ok(IlpResponseData),
    Err(String),
}
