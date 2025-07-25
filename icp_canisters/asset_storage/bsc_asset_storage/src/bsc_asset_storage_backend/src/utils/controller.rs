use ic_cdk::api::{caller, id};

pub fn assert_controller() {
    if caller() != id() {
        ic_cdk::trap("Only the canister controller can call this method.");
    }
}