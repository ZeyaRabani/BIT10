use crate::ecdsa::EcdsaPublicKey;
use crate::{EcdsaKeyName, BscNetwork, InitArg};
use evm_rpc_canister_types::{RpcServices, RpcApi, HttpHeader};
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

#[derive(Debug, Default, PartialEq, Eq)]
pub struct State {
    bsc_network: BscNetwork,
    ecdsa_key_name: EcdsaKeyName,
    ecdsa_public_key: Option<EcdsaPublicKey>,
}

impl State {
    pub fn ecdsa_key_id(&self) -> EcdsaKeyId {
        EcdsaKeyId::from(&self.ecdsa_key_name)
    }

    pub fn bsc_network(&self) -> BscNetwork {
        self.bsc_network
    }

    pub fn evm_rpc_services(&self) -> RpcServices {
        match self.bsc_network {
            BscNetwork::Mainnet => RpcServices::Custom {
                chainId: 56,
                services: vec![RpcApi {
                    url: "https://bsc-mainnet.gateway.tatum.io/".to_string(),
                    headers: Some(vec![
                        HttpHeader {
                            name: "x-api-key".to_string(),
                            value: "<API_KEY>".to_string(),
                        }
                    ]),
                }],
            },
            BscNetwork::Testnet => RpcServices::Custom {
                chainId: 97,
                services: vec![RpcApi {
                    url: "https://bsc-testnet.gateway.tatum.io/".to_string(),
                    headers: Some(vec![
                        HttpHeader {
                            name: "x-api-key".to_string(),
                            value: "<API_KEY>".to_string(),
                        }
                    ]),
                }],
            },
        }
    }
}

impl From<InitArg> for State {
    fn from(init_arg: InitArg) -> Self {
        State {
            bsc_network: init_arg.bsc_network.unwrap_or_default(),
            ecdsa_key_name: init_arg.ecdsa_key_name.unwrap_or_default(),
            ..Default::default()
        }
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