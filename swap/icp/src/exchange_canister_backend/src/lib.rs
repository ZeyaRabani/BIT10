mod types;
mod constants;
mod services;
mod utils;

use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::memory_manager::{MemoryManager, MemoryId, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;
use types::*;
use constants::*;
use services::*;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static CIRCULATING_SUPPLY: RefCell<StableBTreeMap<StableString, StableNat, VirtualMemory<DefaultMemoryImpl>>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static REVERSE_SWAP_SUPPLY: RefCell<StableBTreeMap<StableString, StableNat, VirtualMemory<DefaultMemoryImpl>>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
}

#[query]
fn bit10_circulating_supply() -> Vec<TokenSupply> {
    CIRCULATING_SUPPLY.with(|supply| {
        supply.borrow()
            .iter()
            .map(|(k, v)| TokenSupply { token: k.0.clone(), supply: v.0.clone() })
            .collect()
    })
}

#[query]
fn bit10_reverse_swap_supply() -> Vec<TokenSupply> {
    REVERSE_SWAP_SUPPLY.with(|supply| {
        supply.borrow()
            .iter()
            .map(|(k, v)| TokenSupply { token: k.0.clone(), supply: v.0.clone() })
            .collect()
    })
}

// Export the Candid interface
ic_cdk::export_candid!();