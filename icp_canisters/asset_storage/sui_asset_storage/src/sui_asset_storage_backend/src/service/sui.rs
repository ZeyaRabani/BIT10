use crate::wallet::sui_wallet::SuiWallet;
use crate::state::read_state;
use crate::rpc::sui_rpc::*;
use candid::{Principal, Nat};
use ic_cdk::api::management_canister::http_request::{TransformArgs, HttpResponse};

pub async fn sui_address_impl(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or(ic_cdk::caller());
    let wallet = SuiWallet::new(owner).await;
    wallet.sui_address()
}

pub async fn get_sui_balance_impl(address: Option<String>) -> Nat {
    let address = match address {
        Some(addr) => addr,
        None => sui_address_impl(None).await,
    };
    get_sui_balance_rpc(&address).await
}

pub async fn send_sui_impl(to: String, amount: Option<Nat>) -> String {
    let caller = ic_cdk::caller();
    let wallet = SuiWallet::new(caller).await;
    send_sui_rpc(wallet, to, amount).await
}

pub fn transform_sui_response_impl(args: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: args.response.status.clone(),
        body: args.response.body.clone(),
        headers: vec![],
    }
}