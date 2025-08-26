mod types;
mod storage;
mod controllers;
mod lend_borrow;
mod http_client;
mod canister_config;

use ic_cdk::{init, post_upgrade, export_candid};
use ic_cdk::query;
use ic_cdk::update;

use crate::types::{LendArgs, LendResponse, BorrowArgs, BorrowResponse};
use crate::controllers::{add_controller, remove_controller, get_controllers, init_controllers};
use crate::lend_borrow::{lend, borrow};
use crate::http_client::transform_http_response;

#[init]
fn init() {
    storage::MEMORY_MANAGER.with(|m| m.borrow_mut().get(storage::CONTROLLERS_MEMORY_ID));
    init_controllers();
}

#[post_upgrade]
fn post_upgrade() {
    init_controllers();
}

pub use crate::controllers::{add_controller, remove_controller, get_controllers};

pub use crate::lend_borrow::{lend, borrow};

#[query]
fn transform_response(args: ic_cdk::api::management_canister::http_request::TransformArgs) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    transform_http_response(args)
}

#[query(name = "__get_candid_interface_spec")]
fn export_our_candid() -> String {
    export_candid!();
    __export_candid()
}