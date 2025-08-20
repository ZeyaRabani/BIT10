use crate::wallet::ecdsa::EcdsaPublicKey;
use crate::{EcdsaKeyName, EthereumNetwork, InitArg};
use evm_rpc_canister_types::{EthMainnetService, EthSepoliaService, RpcServices};
use ic_cdk::api::management_canister::ecdsa::EcdsaKeyId;
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
    ethereum_network: EthereumNetwork,
    ecdsa_key_name: EcdsaKeyName,
    ecdsa_public_key: Option<EcdsaPublicKey>,
    custom_rpc: Option<CustomRpcConfig>,
}

impl Default for State {
    fn default() -> Self {
        Self {
            ethereum_network: EthereumNetwork::default(),
            ecdsa_key_name: EcdsaKeyName::default(),
            ecdsa_public_key: None,
            custom_rpc: Some(CustomRpcConfig {
                url: "https://ethereum-sepolia.gateway.tatum.io/".to_string(),
                api_key: Some("dfhghjdbfhdkjfghkjfdghkdfgj".to_string()),
            }),
        }
    }
}

impl State {
    pub fn ecdsa_key_id(&self) -> EcdsaKeyId {
        EcdsaKeyId::from(&self.ecdsa_key_name)
    }

    pub fn ethereum_network(&self) -> EthereumNetwork {
        self.ethereum_network
    }

    pub fn custom_rpc(&self) -> Option<&CustomRpcConfig> {
        self.custom_rpc.as_ref()
    }

    pub fn evm_rpc_services(&self) -> RpcServices {
        match self.ethereum_network {
            EthereumNetwork::Mainnet => RpcServices::EthMainnet(None),
            EthereumNetwork::Sepolia => RpcServices::EthSepolia(None),
        }
    }

    pub fn single_evm_rpc_service(&self) -> RpcServices {
        match self.ethereum_network {
            EthereumNetwork::Mainnet => {
                RpcServices::EthMainnet(Some(vec![EthMainnetService::PublicNode]))
            }
            EthereumNetwork::Sepolia => {
                RpcServices::EthSepolia(Some(vec![EthSepoliaService::PublicNode]))
            }
        }
    }

    pub fn set_custom_rpc(&mut self, config: CustomRpcConfig) {
        self.custom_rpc = Some(config);
    }

    pub fn clear_custom_rpc(&mut self) {
        self.custom_rpc = None;
    }
}

impl From<InitArg> for State {
    fn from(init_arg: InitArg) -> Self {
        let mut state = State::default();
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