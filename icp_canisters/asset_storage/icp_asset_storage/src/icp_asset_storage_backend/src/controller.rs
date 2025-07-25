use ic_cdk::api::management_canister::main::{canister_status, CanisterIdRecord};
use ic_cdk::caller;
use ic_cdk::id;

pub async fn assert_controller() -> Result<(), String> {
    let caller = caller();
    let canister_id = id();
    let (status,) = canister_status(CanisterIdRecord { canister_id })
        .await
        .map_err(|e| format!("Failed to get canister status: {:?}", e))?;
    if !status.settings.controllers.contains(&caller) {
        return Err("Only canister controllers can call this method".to_string());
    }
    Ok(())
}
