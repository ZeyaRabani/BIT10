mod services;
mod state;
mod types;
mod utils;
mod wallet;

use candid::{CandidType, Deserialize, Nat};
use ic_cdk::{init, post_upgrade, pre_upgrade, query, update};
use services::swap_service;
use services::token_service;
use services::transaction_service;
use services::bsc_swap_service; 
use services::bsc_transaction_service;
use services::solana_transaction_service;
use services::solana_swap_service;
use state::storage;
use types::network::InitArg;
use types::swap::{SwapResponse, SwapResponseData};
use types::token::BIT10TokenResponse;

#[derive(CandidType, Deserialize)]
pub struct ICPBuyArgs {
    pub token_in_address: String,
    pub token_out_address: String,
    pub token_out_amount: String,
}

#[derive(CandidType, Deserialize)]
pub struct ICPSellArgs {
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_out_address: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct SwapArgs {
    pub user_wallet_address: String,
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_out_address: String,
    pub token_out_amount: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionResponse {
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
}

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
pub fn bit10_token() -> BIT10TokenResponse {
    token_service::get_bit10_token_info()
}

#[query]
fn get_buy_history() -> Vec<SwapResponseData> {
    storage::get_buy_history()
}

#[query]
fn get_sell_history() -> Vec<SwapResponseData> {
    storage::get_sell_history()
}

#[update]
pub async fn icp_buy(args: ICPBuyArgs) -> SwapResponse {
    swap_service::process_icp_buy(args).await
}

#[update]
pub async fn icp_sell(args: ICPSellArgs) -> SwapResponse {
    swap_service::process_icp_sell(args).await
}

#[update]
pub async fn get_transaction_count_for_address(address: String) -> Nat {
    transaction_service::get_transaction_count(&address).await
}

#[update]
pub async fn base_address() -> String {
    storage::get_cached_base_address().await
}

#[update]
pub async fn base_create_transaction(args: SwapArgs) -> TransactionResponse {
    transaction_service::create_base_transaction(args).await
}

#[update]
pub async fn base_buy(trx_hash: String) -> SwapResponse {
    swap_service::process_base_buy(trx_hash).await
}

#[update]
pub async fn bsc_address() -> String {
    storage::get_cached_bsc_address().await
}

#[update]
pub async fn get_bsc_transaction_count_for_address(address: String) -> Nat {
    bsc_transaction_service::get_bsc_transaction_count(&address).await
}

#[update]
pub async fn bsc_create_transaction(args: SwapArgs) -> TransactionResponse {
    bsc_transaction_service::create_bsc_transaction(args).await
}

#[update]
pub async fn bsc_buy(trx_hash: String) -> SwapResponse {
    bsc_swap_service::process_bsc_buy(trx_hash).await
}

#[update]
pub async fn solana_address() -> String {
    storage::get_cached_solana_address().await
}

#[update]
pub async fn nonce_account() -> String {
    let wallet = wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    wallet.derived_nonce_account().ed25519_public_key.to_string()
}

#[update]
pub async fn create_associated_token_account(mint_address: String) -> Result<String, String> {
    solana_transaction_service::create_associated_token_account_for_canister(&mint_address).await
}

#[update]
pub async fn associated_token_account(mint_address: String) -> Result<String, String> {
    solana_transaction_service::get_associated_token_account_address(&mint_address).await
}

#[update]
pub async fn create_nonce_account() -> Result<String, String> {
    solana_transaction_service::create_nonce_account_for_canister().await
}

#[update]
pub async fn solana_create_transaction(args: SwapArgs) -> TransactionResponse {
    solana_transaction_service::create_solana_transaction(args).await
}

#[update]
pub async fn solana_buy(trx_hash: String) -> SwapResponse {
    solana_swap_service::process_solana_buy(trx_hash).await
}

#[query]
fn transform(raw: ic_cdk::api::management_canister::http_request::TransformArgs) -> ic_cdk::api::management_canister::http_request::HttpResponse {
    use ic_cdk::api::management_canister::http_request::HttpResponse;

    let mut res = HttpResponse {
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

ic_cdk::export_candid!();
