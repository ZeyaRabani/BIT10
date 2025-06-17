use candid::{CandidType, Principal};

use ic_cdk_macros::*;
use ic_ledger_types::{
    AccountIdentifier, BlockIndex, Memo, Subaccount, Tokens, DEFAULT_SUBACCOUNT,
    MAINNET_LEDGER_CANISTER_ID,
};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    amount: Tokens,
    to_principal: Principal,
    to_subaccount: Option<Subaccount>,
}

async fn is_caller_controller() -> Result<(), String> {
    let caller = ic_cdk::caller();
    let canister_id = ic_cdk::id();
    
    let (status,) = ic_cdk::api::management_canister::main::canister_status(
        ic_cdk::api::management_canister::main::CanisterIdRecord { canister_id }
    ).await.map_err(|e| format!("Failed to get canister status: {:?}", e))?;
    
    if !status.settings.controllers.contains(&caller) {
        return Err("Only canister controllers can call this method".to_string());
    }
    Ok(())
}

#[update]
async fn transfer(args: TransferArgs) -> Result<BlockIndex, String> {
    is_caller_controller().await?;
    
    if args.amount.e8s() == 0 {
        return Err("Amount must be greater than 0".to_string());
    }
    
    ic_cdk::println!(
        "Transferring {} tokens to principal {} subaccount {:?}",
        &args.amount,
        &args.to_principal,
        &args.to_subaccount
    );
    
    let to_subaccount = args.to_subaccount.unwrap_or(DEFAULT_SUBACCOUNT);
    let transfer_args = ic_ledger_types::TransferArgs {
        memo: Memo(0),
        amount: args.amount,
        fee: Tokens::from_e8s(10_000),
        from_subaccount: None,
        to: AccountIdentifier::new(&args.to_principal, &to_subaccount),
        created_at_time: None,
    };
    
    ic_ledger_types::transfer(MAINNET_LEDGER_CANISTER_ID, transfer_args)
        .await
        .map_err(|e| format!("failed to call ledger: {:?}", e))?
        .map_err(|e| format!("ledger transfer error {:?}", e))
}

#[query]
fn canister_account() -> Vec<u8> {
    let caller = ic_cdk::caller();
    let canister_id = ic_cdk::id();

    let controllers = ic_cdk::api::management_canister::main::canister_status(
        ic_cdk::api::management_canister::main::CanisterIdRecord { canister_id }
    ).map_err(|_| "Failed to get canister status").unwrap_or_default();
    
    if !controllers.settings.controllers.contains(&caller) {
        ic_cdk::trap("Only canister controllers can call this method");
    }
    
    hex::decode("60a182a30efd8324fea20cdc0e97527c07894d68967423b7d1caaf547cc70480")
        .unwrap_or_else(|_| ic_cdk::trap("Invalid hex encoding"))
}

ic_cdk::export_candid!();
