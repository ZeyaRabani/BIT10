use candid::Principal;
use crate::state::lazy_call_ecdsa_public_key;
use ic_cdk::api::management_canister::ecdsa::EcdsaKeyId;
use alloy_primitives::Address as AlloyAddress;
use std::str::FromStr;

pub struct BscWallet {
    owner: Principal,
}

impl BscWallet {
    pub async fn new(owner: Principal) -> Self {
        BscWallet { owner }
    }

    pub async fn bsc_address(&self) -> AlloyAddress {
        let pk = lazy_call_ecdsa_public_key().await;
        AlloyAddress::from_str(&format!("{:?}", pk)).unwrap()
    }
}

pub async fn get_bsc_address(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(ic_cdk::api::caller);
    let wallet = BscWallet::new(owner).await;
    wallet.bsc_address().await.to_string()
}