use candid::{CandidType, Deserialize, Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferError};
use icrc_ledger_types::icrc2::approve::ApproveError;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};

#[derive(CandidType, Deserialize, Clone)]
pub struct LendArgs {
    pub lender_address: String,
    pub token_chain: String,
    pub token_address: String,
    pub token_amount: u64,
}

#[derive(CandidType, Clone, SerdeSerialize, Deserialize)]
pub struct LendResponseData {
    pub lender_address: String,
    pub token_chain: String,
    pub token_address: String,
    pub token_amount: u64,
    pub token_sent_trx_hash: String,
    pub interest_rate: String,
    pub status: String, // Active or Closed
    pub opened_at: String,
}

#[derive(CandidType, SerdeSerialize, Deserialize)]
pub enum LendResponse {
    Ok(LendResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Clone)]
pub struct BorrowArgs {
    pub borrower_address: String,
    pub borrow_token_chain: String,
    pub borrow_token_address: String,
    pub borrow_token_amount: u64,
    pub collateral_address: String,
    pub collateral_chain: String,
    pub collateral_amount: u64,
    pub borrow_wallet_address: String,
}

#[derive(CandidType, Clone, SerdeSerialize, Deserialize)]
pub struct BorrowResponseData {
    pub borrower_address: String,
    pub borrow_token_chain: String,
    pub borrow_token_address: String,
    pub borrow_token_amount: String,
    pub borrow_trx_hash: String,
    pub collateral_address: String,
    pub collateral_chain: String,
    pub collateral_amount: String,
    pub collateral_trx_hash: String,
    pub borrow_wallet_address: String,
    pub interest_rate: String,
    pub status: String, // Active or Closed or Liquidated
    pub opened_at: String,
}

#[derive(CandidType, SerdeSerialize, Deserialize)]
pub enum BorrowResponse {
    Ok(BorrowResponseData),
    Err(String),
}
