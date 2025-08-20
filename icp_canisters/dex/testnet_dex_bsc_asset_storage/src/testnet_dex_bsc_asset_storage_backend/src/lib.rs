mod state;
mod wallet;
mod utils;
mod services;

use state::{init_state, read_state};
use utils::types::{InitArg, CreateTransactionArgs, TransactionResponse, SwapResult, SwapResponse};
use services::{info, swap};
use ic_cdk::{init, post_upgrade, query, update, pre_upgrade};
use ic_cdk::api::management_canister::http_request::TransformArgs;
use candid::Principal;
use std::cell::RefCell;

thread_local! {
    static SWAP_HISTORY_TEMP: RefCell<Vec<SwapResponse>> = RefCell::new(Vec::new());
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let history = swap::SWAP_HISTORY.with(|h| h.borrow().clone());
    ic_cdk::storage::stable_save((history,))
        .expect("Failed to save swap history to stable storage");
}

#[post_upgrade]
async fn post_upgrade_hook(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }
    if let Ok((history,)) = ic_cdk::storage::stable_restore::<(Vec<SwapResponse>,)>() {
        swap::SWAP_HISTORY.with(|h| *h.borrow_mut() = history);
    }
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[query]
fn supported_tokens() -> String {
    info::supported_tokens()
}

#[query]
fn supported_pairs() -> String {
    info::supported_pairs()
}

#[update]
pub async fn bsc_address() -> String {
    info::bsc_address().await
}

#[update]
pub async fn get_block_number() -> candid::Nat {
    info::get_block_number().await
}

#[update]
pub async fn get_transaction_count_for_address(address: String) -> candid::Nat {
    info::get_transaction_count_public(address).await
}

#[update]
pub async fn create_transaction(args: CreateTransactionArgs) -> TransactionResponse {
    validate_caller_not_anonymous();
    match swap::create_transaction(args).await {
        Ok(res) => res,
        Err(e) => ic_cdk::trap(&e),
    }
}

#[update]
pub async fn verify_and_swap(transaction_hash: String) -> SwapResult {
    validate_caller_not_anonymous();
    swap::verify_and_swap(transaction_hash).await
}

#[query]
fn get_swap_history() -> Vec<SwapResponse> {
    swap::get_swap_history()
}

#[query]
fn get_swap_history_by_address(tick_in_wallet_address: String) -> Vec<SwapResponse> {
    swap::get_swap_history_by_address(tick_in_wallet_address)
}

#[query]
fn transform(raw: TransformArgs) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    utils::http::transform(raw)
}

fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        ic_cdk::trap("Anonymous principal is not allowed to call this method.");
    }
    principal
}