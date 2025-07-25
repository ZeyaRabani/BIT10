mod service;
mod state;
mod wallet;
mod rpc;
mod utils;

use service::sui::*;
use state::{init_state, InitArg};
use candid::Principal;
use ic_cdk::{init, query, update};

#[init]
fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[update]
async fn sui_address(owner: Option<Principal>) -> String {
    utils::address::assert_controller();
    sui_address_impl(owner).await
}

#[update]
async fn get_sui_balance(address: Option<String>) -> candid::Nat {
    utils::address::assert_controller();
    get_sui_balance_impl(address).await
}

#[update]
async fn send_sui(to: String, amount: Option<candid::Nat>) -> String {
    utils::address::assert_controller();
    send_sui_impl(to, amount).await
}

#[query]
fn transform_sui_response(args: ic_cdk::api::management_canister::http_request::TransformArgs) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    service::sui::transform_sui_response_impl(args)
}