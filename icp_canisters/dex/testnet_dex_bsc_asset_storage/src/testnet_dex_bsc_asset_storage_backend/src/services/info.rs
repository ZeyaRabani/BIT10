use crate::utils::token::{get_supported_pairs, get_supported_tokens};
use crate::wallet::BscWallet;
use crate::utils::rpc::{get_block_number_rpc, fetch_nonce_safe};
use candid::Nat;

pub fn supported_tokens() -> String {
    let tokens = get_supported_tokens();
    serde_json::json!({ "token": tokens }).to_string()
}

pub fn supported_pairs() -> String {
    let pairs = get_supported_pairs();
    serde_json::json!({ "pairs": pairs }).to_string()
}

pub async fn bsc_address() -> String {
    let canister_id = ic_cdk::id();
    let wallet = BscWallet::new(canister_id).await;
    wallet.bsc_address().to_string()
}

pub async fn get_block_number() -> Nat {
    get_block_number_rpc()
        .await
        .unwrap_or_else(|e| ic_cdk::trap(&format!("Failed to get block number: {}", e)))
}

pub async fn get_transaction_count_public(address: String) -> Nat {
    fetch_nonce_safe(&address)
        .await
        .unwrap_or_else(|e| ic_cdk::trap(&format!("Failed to get transaction count: {}", e)))
        .into()
}