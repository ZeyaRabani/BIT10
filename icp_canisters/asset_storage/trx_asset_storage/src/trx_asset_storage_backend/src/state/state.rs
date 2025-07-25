use crate::types::{InitArg, TronNetwork, EcdsaKeyName};

static mut STATE: Option<State> = None;

#[derive(Default)]
pub struct State {
    pub tron_network: TronNetwork,
    pub ecdsa_key_name: EcdsaKeyName,
}

pub fn init_state(arg: InitArg) {
    let state = State {
        tron_network: arg.tron_network.unwrap_or_default(),
        ecdsa_key_name: arg.ecdsa_key_name.unwrap_or_default(),
    };
    unsafe { STATE = Some(state); }
}

pub fn read_state<F, R>(f: F) -> R
where
    F: FnOnce(&State) -> R,
{
    unsafe {
        f(STATE.as_ref().expect("State not initialized"))
    }
}