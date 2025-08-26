use candid::Principal;
use ic_cdk::{caller, trap};
use std::collections::HashSet;

use crate::storage::CONTROLLERS;

pub fn assert_is_controller() {
    if !is_canister_controller() {
        trap("Caller is not a registered controller.");
    }
}

pub fn is_canister_controller() -> bool {
    let caller = caller();
    if caller == Principal::anonymous() {
        return false;
    }
    CONTROLLERS.with(|c| c.borrow().contains_key(&caller))
}

#[ic_cdk::update]
pub fn add_controller(principal: Principal) {
    assert_is_controller();
    CONTROLLERS.with(|c| {
        c.borrow_mut().insert(principal, ());
    });
    ic_cdk::println!("Controller added: {}", principal);
}

#[ic_cdk::update]
pub fn remove_controller(principal: Principal) {
    assert_is_controller();
    CONTROLLERS.with(|c| {
        c.borrow_mut().remove(&principal);
    });
    ic_cdk::println!("Controller removed: {}", principal);
}

#[ic_cdk::query]
pub fn get_controllers() -> Vec<Principal> {
    CONTROLLERS.with(|c| c.borrow().iter().map(|(p, _)| p).collect())
}

pub fn init_controllers() {
    CONTROLLERS.with(|c| {
        let mut controllers = c.borrow_mut();
        let owner = ic_cdk::caller();
        if owner != Principal::anonymous() && !controllers.contains_key(&owner) {
            controllers.insert(owner, ());
            ic_cdk::println!("Initial controller set: {}", owner);
        }
    });
}