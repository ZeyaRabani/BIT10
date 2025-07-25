mod wallet;
mod services;
mod state;
mod utils;

use candid::Principal;
use utils::controller::assert_controller;
use wallet::bsc_wallet::get_bsc_address;
use services::bsc_service::{get_balance, send_bnb_transaction};
use state::{init_state, read_state};
use candid::{CandidType, Deserialize, Nat};

#[ic_cdk::init]
fn init(maybe_init: Option<state::InitArg>) {
    assert_controller();
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[ic_cdk::update]
async fn bsc_address(owner: Option<Principal>) -> String {
    assert_controller();
    get_bsc_address(owner).await
}

#[ic_cdk::update]
async fn bnb_balance() -> Nat {
    assert_controller();
    get_balance().await
}

#[ic_cdk::update]
async fn send_bnb(tx_input: services::bsc_service::BscTransactionInput) -> String {
    assert_controller();
    send_bnb_transaction(tx_input).await
}