use candid::{CandidType, Principal};
use ic_cdk_macros::*;
use ic_ledger_types::{BlockIndex, Tokens};
mod controller;
mod transfer;
mod account;

#[update]
async fn transfer(args: transfer::TransferArgs) -> Result<BlockIndex, String> {
    controller::assert_controller().await?;
    transfer::transfer_tokens(args).await
}

#[query]
async fn canister_account() -> Result<Vec<u8>, String> {
    controller::assert_controller().await?;
    account::canister_account().await
}

#[query]
fn get_special_principal() -> String {
    account::get_special_principal().to_text()
}

ic_cdk::export_candid!();