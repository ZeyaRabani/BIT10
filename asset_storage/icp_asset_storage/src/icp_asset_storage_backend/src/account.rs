use ic_cdk::api::management_canister::main::{canister_status, CanisterIdRecord};
use ic_cdk::{caller, id};
use hex;

pub fn get_special_principal() -> candid::Principal {
    candid::Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01")
}

pub async fn canister_account() -> Result<Vec<u8>, String> {
    let caller = caller();
    let canister_id = id();
    let (status,) = canister_status(CanisterIdRecord { canister_id })
        .await
        .map_err(|_| "Failed to get canister status".to_string())?;
    if !status.settings.controllers.contains(&caller) {
        return Err("Only canister controllers can call this method".to_string());
    }
    hex::decode("60a182a30efd8324fea20cdc0e97527c07894d68967423b7d1caaf547cc70480")
        .map_err(|_| "Invalid hex encoding".to_string())
}