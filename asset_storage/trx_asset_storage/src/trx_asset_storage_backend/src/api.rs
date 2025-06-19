use crate::{
    service::tron::{get_tron_balance_impl, send_trx_impl, tron_address_impl},
    state::init_state,
    types::{InitArg, Nat},
    utils::controller::assert_controller,
};
use candid::Principal;

#[ic_cdk::init]
fn init(maybe_init: Option<InitArg>) {
    assert_controller();
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[ic_cdk::update]
async fn tron_address(owner: Option<Principal>) -> String {
    assert_controller();
    tron_address_impl(owner).await
}

#[ic_cdk::update]
async fn get_tron_balance(address: Option<String>) -> Result<Nat, String> {
    assert_controller();
    get_tron_balance_impl(address).await
}

#[ic_cdk::update]
async fn send_trx(to: String, amount: Nat) -> Result<String, String> {
    assert_controller();
    send_trx_impl(to, amount).await
}