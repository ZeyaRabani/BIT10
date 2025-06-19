use candid::Principal;

pub fn controller_principal() -> Principal {
    Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01")
}

pub fn assert_controller() {
    if ic_cdk::caller() != controller_principal() {
        ic_cdk::trap("Only the controller can call this method");
    }
}