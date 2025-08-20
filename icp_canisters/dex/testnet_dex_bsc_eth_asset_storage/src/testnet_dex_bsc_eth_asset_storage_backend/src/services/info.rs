use crate::utils::token::{get_supported_pairs, get_supported_tokens};
use crate::wallet::{BscWallet, EthereumWallet};
use crate::utils::rpc::get_transaction_count_for_address_on_chain;
use crate::utils::types::ChainType;
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

pub async fn ethereum_address() -> String {
    let wallet = EthereumWallet::new_canister_wallet().await;
    wallet.ethereum_address().to_string()
}

pub async fn get_transaction_count_public(address: String) -> Result<Nat, String> {
    let chain = ChainType::Ethereum;
    let count = get_transaction_count_for_address_on_chain(address, chain).await?;
    Ok(Nat::from(count))
}