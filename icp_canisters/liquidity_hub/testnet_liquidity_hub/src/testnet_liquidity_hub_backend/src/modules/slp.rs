use candid::{CandidType, Deserialize, Serialize};
use candid::Nat;
use ic_cdk::Principal;

#[derive(CandidType, Deserialize, Clone)]
pub struct SLPArgs {
    pub tick_in_name: String,
    pub tick_in_amount: Nat,
    pub duration: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct SLPResponseData {
    pub tick_in_name: String,
    pub tick_in_amount: Nat,
    pub duration: Nat,
    pub tick_in_block: Nat,
    pub tick_in_address: Principal,
    pub tick_in_timestamp: String,
}

#[derive(CandidType, Serialize)]
pub enum SLPResponse {
    Ok(SLPResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Clone)]
pub struct SLPWithdrawArgs {
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct SLPWithdrawResponseData {
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
    pub tick_out_block: Nat,
    pub tick_out_address: Principal,
    pub tick_out_time: String,
}

#[derive(CandidType, Serialize)]
pub enum SLPWithdrawResponse {
    Ok(SLPWithdrawResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Clone)]
pub struct TransferFromCanisterArgs {
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
    pub tick_out_duration: Nat,
    pub tick_out_address: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct TransferFromCanisterResponseData {
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
    pub tick_out_address: Principal,
    pub tick_out_caller: Principal,
    pub tick_out_block: Nat,
    pub tick_out_time: String,
}

#[derive(CandidType, Serialize)]
pub enum TransferFromCanisterResponse {
    Ok(TransferFromCanisterResponseData),
    Err(String),
}
