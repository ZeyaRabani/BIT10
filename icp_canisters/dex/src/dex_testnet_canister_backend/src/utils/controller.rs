use crate::services::swap_service::{
    CreateTransactionArgs, SwapResult, TransactionResponse,
};
use crate::state::{init_state, read_state};
use ic_cdk::api::management_canister::http_request::{HttpResponse, TransformArgs};
use ic_cdk::{init, post_upgrade, query, update};

pub use crate::services::swap_service::{
    CreateTransactionArgs, Pair, SwapResponse, SwapResult, Token, TransactionData,
    TransactionResponse,
};

#[derive(candid::CandidType, candid::Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub ethereum_network: Option<EthereumNetwork>,
    pub ecdsa_key_name: Option<EcdsaKeyName>,
}

#[derive(candid::CandidType, candid::Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum EthereumNetwork {
    Mainnet,
    #[default]
    Sepolia,
}

impl EthereumNetwork {
    pub fn chain_id(&self) -> u64 {
        match self {
            EthereumNetwork::Mainnet => 1,
            EthereumNetwork::Sepolia => 11155111,
        }
    }
}

#[derive(candid::CandidType, candid::Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum EcdsaKeyName {
    #[default]
    TestKeyLocalDevelopment,
    TestKey1,
    ProductionKey1,
}

impl From<&EcdsaKeyName> for ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
    fn from(value: &EcdsaKeyName) -> Self {
        ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
            curve: ic_cdk::api::management_canister::ecdsa::EcdsaCurve::Secp256k1,
            name: match value {
                EcdsaKeyName::TestKeyLocalDevelopment => "dfx_test_key",
                EcdsaKeyName::TestKey1 => "test_key_1",
                EcdsaKeyName::ProductionKey1 => "key_1",
            }
            .to_string(),
        }
    }
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[post_upgrade]
fn post_upgrade(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }
}

#[update]
pub async fn ethereum_address() -> String {
    crate::services::swap_service::ethereum_address().await
}

#[update]
pub async fn get_transaction_count_for_address(address: String) -> candid::Nat {
    crate::services::swap_service::get_transaction_count_for_address(address).await
}

#[update]
pub async fn create_transaction(args: CreateTransactionArgs) -> TransactionResponse {
    crate::services::swap_service::create_transaction_internal(args).await
}

#[update]
pub async fn verify_and_swap(transaction_hash: String) -> SwapResult {
    crate::services::swap_service::verify_and_swap_internal(transaction_hash).await
}

#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    crate::services::swap_service::transform(raw)
}

#[query]
pub fn supported_tokens() -> String {
    crate::services::swap_service::supported_tokens_internal()
}

#[query]
pub fn supported_pairs() -> String {
    crate::services::swap_service::supported_pairs_internal()
}