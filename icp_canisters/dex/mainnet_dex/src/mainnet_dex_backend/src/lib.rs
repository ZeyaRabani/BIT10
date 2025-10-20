mod services;
mod state;
mod types;
mod utils;
mod wallet;

use candid::Nat;
use ic_cdk::{init, post_upgrade, pre_upgrade, query, update};
use services::base_transaction_service;
use services::solana_transaction_service;
use services::bsc_transaction_service;
use services::token_service;
use state::storage;
use types::network::InitArg;
use types::pool::PoolsResponse;
use types::swap::{SwapArgs, SwapResult, SwapResponse};
use ic_cdk::caller;

#[pre_upgrade]
fn pre_upgrade_hook() {
    storage::save_to_stable_storage();
}

#[post_upgrade]
fn post_upgrade_hook(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        state::state::init_state(init_arg);
    }
    storage::restore_from_stable_storage();
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        state::state::init_state(init_arg);
    }
}

#[query]
pub fn get_pool_info() -> PoolsResponse {
    token_service::get_pool_info()
}

#[query]
pub fn get_swap_history() -> Vec<SwapResponse> {
    storage::get_swap_history()
}

#[query]
pub fn get_swap_by_id(swap_id: String) -> Option<SwapResponse> {
    storage::get_swap_by_id(&swap_id)
}

#[query]
pub fn get_swap_history_paginated(offset: usize, limit: usize) -> Vec<SwapResponse> {
    storage::get_swap_history_paginated(offset, limit)
}

#[query]
pub fn get_swap_history_count() -> usize {
    storage::get_swap_history_count()
}

#[update]
pub async fn icp_address() -> String {
    storage::get_cached_icp_address().await
}

#[update]
pub async fn icp_swap(args: SwapArgs) -> SwapResult {
    services::icp_swap_service::process_icp_swap(args).await
}

#[update]
pub async fn base_address() -> String {
    storage::get_cached_base_address().await
}

#[update]
pub async fn get_base_transaction_count_for_address(address: String) -> Nat {
    base_transaction_service::get_base_transaction_count(&address).await
}

#[update]
pub async fn solana_address() -> String {
    storage::get_cached_solana_address().await
}

#[update]
pub async fn nonce_account() -> String {
    let wallet = wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    wallet
        .derived_nonce_account()
        .ed25519_public_key
        .to_string()
}

#[update]
pub async fn create_associated_token_account(
    mint_address: String
) -> Result<String, String> {
    solana_transaction_service::create_associated_token_account_for_canister(
        &mint_address
    )
    .await
}

#[update]
pub async fn associated_token_account(
    mint_address: String
) -> Result<String, String> {
    solana_transaction_service::get_associated_token_account_address(
        &mint_address
    )
    .await
}

#[update]
pub async fn create_nonce_account() -> Result<String, String> {
    solana_transaction_service::create_nonce_account_for_canister().await
}

#[update]
pub async fn bsc_address() -> String {
    storage::get_cached_bsc_address().await
}

#[update]
pub async fn get_bsc_transaction_count_for_address(address: String) -> Nat {
    bsc_transaction_service::get_bsc_transaction_count(&address).await
}

#[query]
fn transform(
    raw: ic_cdk::api::management_canister::http_request::TransformArgs
) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    use ic_cdk::api::management_canister::http_request::HttpResponse;
    
    let res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers: Vec::new(),
    };
    
    if res.status != candid::Nat::from(200u64) {
        ic_cdk::api::print(format!(
            "Received error response: status={}, body={:?}",
            res.status,
            String::from_utf8_lossy(&res.body)
        ));
    }
    res
}

// ToDo: Temp code
#[update]
pub fn initialize_pool_data() -> Result<String, String> {
    if !ic_cdk::api::is_controller(&caller()) {
        return Err("Only controllers can initialize pool data".to_string());
    }

    token_service::initialize_pools_from_pairs();
    let pool_count = storage::get_all_pools().len();
    
    Ok(format!("Pool data initialized successfully with {} pools", pool_count))
}

#[update]
pub fn update_pool_balances(pool_id: String, token_a_balance: String, token_b_balance: String) -> Result<String, String> {
    if !ic_cdk::api::is_controller(&caller()) {
        return Err("Only controllers can update pool balances".to_string());
    }

    storage::update_pool_balances(&pool_id, token_a_balance, token_b_balance)
}

ic_cdk::export_candid!();
