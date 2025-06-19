mod ecdsa;
mod services;
mod state;
mod wallet;

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::{init, update};

#[init]
fn init(maybe_init: Option<state::InitArg>) {
    if let Some(init_arg) = maybe_init {
        state::init_state(init_arg)
    }
}

fn assert_controller() {
    let caller = ic_cdk::caller();
    let controller = ic_cdk::api::canister::controller();
    if caller != controller {
        ic_cdk::trap("Only the canister controller can call this method.");
    }
}

#[update]
async fn ethereum_address(owner: Option<Principal>) -> Result<String, String> {
    assert_controller();
    services::eth_service::get_ethereum_address(owner).await
}

#[update]
async fn get_balance(address: Option<String>) -> Result<Nat, String> {
    assert_controller();
    services::eth_service::get_balance(address).await
}

#[update]
async fn transaction_count(owner: Option<Principal>, block: Option<services::eth_service::BlockTag>) -> Result<Nat, String> {
    assert_controller();
    services::eth_service::transaction_count(owner, block).await
}

#[update]
async fn send_eth(to: String, amount: Nat) -> Result<String, String> {
    assert_controller();
    services::eth_service::send_eth(to, amount).await
}

#[update]
async fn send_erc20(to: String, amount: Nat, token_address: String) -> Result<String, String> {
    assert_controller();
    services::eth_service::send_erc20(to, amount, token_address).await
}