use crate::types::network::{BaseNetwork, BscNetwork, EcdsaKeyName, Ed25519KeyName, InitArg, SolanaNetwork};
use crate::wallet::ecdsa::EcdsaPublicKey;
use crate::wallet::ed25519::{get_ed25519_public_key, Ed25519ExtendedPublicKey};
use ic_cdk::api::management_canister::ecdsa::{ecdsa_public_key, EcdsaKeyId, EcdsaPublicKeyArgument};
use std::{cell::RefCell, ops::{Deref, DerefMut}};

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
    base_network: BaseNetwork,
    bsc_network: BscNetwork,
    solana_network: SolanaNetwork,
    ecdsa_key_name: EcdsaKeyName,
    ed25519_key_name: Ed25519KeyName,
    ecdsa_public_key: Option<EcdsaPublicKey>,
    ed25519_public_key: Option<Ed25519ExtendedPublicKey>,
}

impl State {
    pub fn base_network(&self) -> BaseNetwork {
        self.base_network
    }

    pub fn bsc_network(&self) -> BscNetwork {
        self.bsc_network
    }

    pub fn solana_network(&self) -> SolanaNetwork {
        self.solana_network
    }

    pub fn ecdsa_key_id(&self) -> EcdsaKeyId {
        (&self.ecdsa_key_name).into()
    }

    pub fn ed25519_key_name(&self) -> Ed25519KeyName {
        self.ed25519_key_name
    }
}

impl From<InitArg> for State {
    fn from(init_arg: InitArg) -> Self {
        State {
            base_network: init_arg.base_network.unwrap_or_default(),
            bsc_network: init_arg.bsc_network.unwrap_or_default(),
            solana_network: init_arg.solana_network.unwrap_or_default(),
            ecdsa_key_name: init_arg.ecdsa_key_name.unwrap_or_default(),
            ed25519_key_name: init_arg.ed25519_key_name.unwrap_or_default(),
            ecdsa_public_key: None,
            ed25519_public_key: None,
        }
    }
}

pub async fn lazy_call_ecdsa_public_key() -> EcdsaPublicKey {
    if let Some(public_key) = read_state(|s| s.ecdsa_public_key.clone()) {
        return public_key;
    }

    let key_id = read_state(|s| s.ecdsa_key_id());

    let (key,) = ecdsa_public_key(EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: vec![],
        key_id,
    })
    .await
    .expect("Failed to retrieve ECDSA public key");

    let public_key = EcdsaPublicKey::from(key);
    mutate_state(|s| s.ecdsa_public_key = Some(public_key.clone()));
    public_key
}

pub async fn lazy_call_ed25519_public_key() -> Ed25519ExtendedPublicKey {
    if let Some(public_key) = read_state(|s| s.ed25519_public_key.clone()) {
        return public_key;
    }
    let public_key =
        get_ed25519_public_key(read_state(|s| s.ed25519_key_name()), &Default::default()).await;
    mutate_state(|s| s.ed25519_public_key = Some(public_key.clone()));
    public_key
}