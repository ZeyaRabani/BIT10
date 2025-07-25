use candid::{CandidType, Deserialize};
use icrc_ledger_types::icrc1::account::Account;
use candid::Nat;

#[derive(CandidType, Deserialize)]
pub struct PriceFeed {
    pub id: FeedId,
    pub value: Vec<u8>,
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize)]
pub struct FeedId {
    pub id: String,
}

#[derive(CandidType, Deserialize)]
pub struct Output {
    pub vout: u32,
    pub satoshi: u64,
    pub address: String,
}

#[derive(CandidType, Deserialize)]
pub struct VerificationResponse {
    pub outputs: Vec<Output>,
    pub verified: bool,
    pub message: String,
}
