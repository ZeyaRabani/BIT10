use crate::wallet::ecdsa::EcdsaPublicKey;
use crate::utils::types::{BscNetwork, EcdsaKeyName, EthereumNetwork, InitArg};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use std::cell::RefCell;
use std::ops::{Deref, DerefMut};

thread_local! {
    pub static STATE: RefCell<State> = RefCell::default();
}

pub fn init_state(init_arg: InitArg) {
    STATE.with(|s| *s.borrow_mut() = State::from(init_arg));
}

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with(|s| f(s.borrow().deref()))
}

pub fn mutate_state<F, R>(f: F) -> R
where
    F: FnOnce(&mut State) -> R,
{
    STATE.with(|s| f(s.borrow_mut().deref_mut()))
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub struct CustomRpcConfig {
    pub url: String,
    pub api_key: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct State {
    bsc_network: BscNetwork,
    ethereum_network: EthereumNetwork,
    ecdsa_key_name: EcdsaKeyName,
    ecdsa_public_key: Option<EcdsaPublicKey>,
    custom_rpc: Option<CustomRpcConfig>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            bsc_network: BscNetwork::default(),
            ethereum_network: EthereumNetwork::default(),
            ecdsa_key_name: EcdsaKeyName::default(),
            ecdsa_public_key: None,
            custom_rpc: Some(CustomRpcConfig {
                url: "https://ethereum-sepolia.gateway.tatum.io/".to_string(),
                api_key: Some("<YOUR-API-KEY>".to_string()),
            }),
        }
    }
}

impl State {
    pub fn ecdsa_key_id(&self) -> EcdsaKeyId {
        EcdsaKeyId::from(&self.ecdsa_key_name)
    }

    pub fn bsc_network(&self) -> BscNetwork {
        self.bsc_network
    }

    pub fn ethereum_network(&self) -> EthereumNetwork {
        self.ethereum_network
    }

    pub fn custom_rpc(&self) -> Option<&CustomRpcConfig> {
        self.custom_rpc.as_ref()
    }

    pub fn set_custom_rpc(&mut self, config: CustomRpcConfig) {
        self.custom_rpc = Some(config);
    }

    pub fn clear_custom_rpc(&mut self) {
        self.custom_rpc = None;
    }

    pub fn bsc_rpc_url(&self) -> &'static str {
        match self.bsc_network {
            BscNetwork::Testnet => "https://bsc-testnet.gateway.tatum.io/",
        }
    }

    pub fn bsc_chain_id(&self) -> u64 {
        match self.bsc_network {
            BscNetwork::Testnet => 97,
        }
    }

    pub fn ethereum_rpc_url(&self) -> &'static str {
        match self.ethereum_network {
            EthereumNetwork::Mainnet => "https://eth.llamarpc.com",
            EthereumNetwork::Sepolia => "https://ethereum-sepolia.gateway.tatum.io/",
        }
    }
}

impl From<InitArg> for State {
    fn from(init_arg: InitArg) -> Self {
        let mut state = State::default();
        state.bsc_network = init_arg.bsc_network.unwrap_or_default();
        state.ethereum_network = init_arg.ethereum_network.unwrap_or_default();
        state.ecdsa_key_name = init_arg.ecdsa_key_name.unwrap_or_default();
        state
    }
}

pub async fn lazy_call_ecdsa_public_key() -> EcdsaPublicKey {
    use ic_cdk::api::management_canister::ecdsa::{ecdsa_public_key, EcdsaPublicKeyArgument};

    if let Some(ecdsa_pk) = read_state(|s| s.ecdsa_public_key.clone()) {
        return ecdsa_pk;
    }
    let key_id = read_state(|s| s.ecdsa_key_id());
    let (response,) = ecdsa_public_key(EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: vec![],
        key_id,
    })
    .await
    .unwrap_or_else(|(error_code, message)| {
        ic_cdk::trap(&format!(
            "failed to get canister's public key: {} (error code = {:?})",
            message, error_code,
        ))
    });
    let pk = EcdsaPublicKey::from(response);
    mutate_state(|s| s.ecdsa_public_key = Some(pk.clone()));
    pk
}

impl From<&EcdsaKeyName> for EcdsaKeyId {
    fn from(value: &EcdsaKeyName) -> Self {
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: match value {
                EcdsaKeyName::TestKeyLocalDevelopment => "dfx_test_key",
                EcdsaKeyName::TestKey1 => "test_key_1",
                EcdsaKeyName::ProductionKey1 => "key_1",
            }
            .to_string(),
        }
    }
}