mod state;
mod wallet;
mod utils;
mod services;

use state::{init_state, read_state, STATE};
use utils::types::{InitArg, SwapResponse, CreateTransactionArgs, TransactionResponse, SwapResult, VerifyAndSwapArgs};
use services::{info, swap};
use ic_cdk::{init, post_upgrade, query, update, pre_upgrade};
use ic_cdk::api::management_canister::http_request::TransformArgs;
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
async fn bsc_address() -> String {
    info::bsc_address().await
}

#[update]
async fn ethereum_address() -> String {
    info::ethereum_address().await
}

#[update]
async fn create_transaction(args: CreateTransactionArgs) -> TransactionResponse {
    match swap::create_transaction(args).await {
        Ok(res) => res,
        Err(e) => ic_cdk::trap(&e),
    }
}

#[update]
async fn get_transaction_count_for_address(address: String) -> candid::Nat {
    match info::get_transaction_count_public(address).await {
        Ok(count) => count,
        Err(e) => ic_cdk::trap(&e),
    }
}

#[update]
async fn verify_and_swap(args: VerifyAndSwapArgs) -> SwapResult {
    swap::verify_and_swap(args).await
}

#[query]
fn get_swap_history() -> Vec<SwapResponse> {
    swap::get_swap_history()
}

#[query]
fn get_swap_history_by_address(address: String) -> Vec<SwapResponse> {
    swap::get_swap_history_by_address(address)
}

#[query]
fn transform(raw: TransformArgs) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    utils::http::transform(raw)
}