use ic_cdk::api::{caller, is_controller};

pub fn assert_controller() {
    let caller = caller();
    if !is_controller(&caller) {
        ic_cdk::trap("Only the canister controller can call this method.");
    }
}