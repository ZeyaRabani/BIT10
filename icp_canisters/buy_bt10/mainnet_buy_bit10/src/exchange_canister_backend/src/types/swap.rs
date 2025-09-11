use candid::{CandidType, Deserialize, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens};
use icrc_ledger_types::icrc2::approve::ApproveError;
use candid::Nat;

#[derive(CandidType, Deserialize)]
pub struct TokenSupply {
    pub token: String,
    pub supply: Nat,
}

#[derive(CandidType)]
pub struct BalanceAndFeeResponse {
    pub balance: Nat,
    pub fee: Nat,
    pub total: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub amount: NumTokens,
    pub ledger_canister_id: String,
    pub to_account: Account,
}

#[derive(CandidType, Deserialize)]
pub struct SwapArgs {
    pub tick_in_name: String,
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
}

#[derive(candid::CandidType, serde::Serialize)]
pub enum MbSwapResponse {
    Ok(MbSwapResponseData),
    Err(String),
}

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

#[derive(candid::CandidType, serde::Serialize)]
pub struct MbSwapResponseData {
    pub user_principal_id: Principal,
    pub tick_in_name: String,
    pub tick_in_amount: Nat,
    pub tick_in_usd_amount: String,
    pub tick_in_tx_block: Nat,
    pub tick_out_name: String,
    pub tick_out_amount: Nat,
    pub tick_out_tx_block: Nat,
    pub transaction_type: String,
    pub transaction_timestamp: String,
    pub network: String,
}

#[derive(CandidType, Deserialize)]
pub struct ReverseSwapArgs {
    pub tick_in_name: String,
    pub tick_in_amount: Nat,
    pub tick_out_name: String,
}

pub type ApproveResult = Result<Nat, ApproveError>;