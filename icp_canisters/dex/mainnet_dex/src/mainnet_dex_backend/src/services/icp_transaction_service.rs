use candid::Principal;
use alloy_primitives::hex;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};

pub async fn get_icp_address_from_principal(principal: Principal) -> String {
    principal.to_text()
}

pub async fn get_canister_icp_address() -> String {
    let canister_id = ic_cdk::id();
    get_icp_address_from_principal(canister_id).await
}

pub async fn transfer_from_user_icp(
    token: &crate::types::token::Token,
    from: Principal,
    amount: f64,
) -> Result<String, String> {
    let decimals = token.token_decimals;
    let multiplier = 10u64.pow(decimals as u32);
    let amount_scaled = (amount * (multiplier as f64)) as u128;

    let canister_id = ic_cdk::id();
    let to_account = Account {
        owner: canister_id,
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: from,
            subaccount: None,
        },
        to: to_account,
        spender_subaccount: None,
        amount: candid::Nat::from(amount_scaled),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let token_ledger_id = token
        .token_address
        .as_ref()
        .ok_or("Token ledger ID not available")?;

    let token_ledger_principal = Principal::from_text(token_ledger_id)
        .map_err(|e| format!("Invalid ledger principal: {}", e))?;

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<candid::Nat, TransferFromError>,)>(
        token_ledger_principal,
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index.0.to_string()),
        Ok((Err(TransferFromError::InsufficientFunds { balance }),)) => {
            Err(format!("Insufficient funds. Available: {}", balance))
        }
        Ok((Err(TransferFromError::InsufficientAllowance { allowance }),)) => {
            Err(format!("Insufficient allowance. Please approve the canister. Current allowance: {}", allowance))
        }
        Ok((Err(e),)) => Err(format!("Transfer from user failed: {:?}", e)),
        Err(e) => Err(format!("Call to icrc2_transfer_from failed: {:?}", e)),
    }    
}

pub async fn transfer_to_user_icp(
    token: &crate::types::token::Token,
    to: Principal,
    amount: f64,
) -> Result<String, String> {
    let decimals = token.token_decimals;
    let multiplier = 10u64.pow(decimals as u32);
    let amount_scaled = (amount * (multiplier as f64)) as u128;

    let token_ledger_principal = match &token.token_address {
        Some(addr) => Principal::from_text(addr.clone())
            .map_err(|e| format!("Invalid ledger principal: {}", e))?,
        None => return Err("Token ledger address not found".to_string()),
    };

    let transfer_args = TransferArg {
        memo: None,
        amount: candid::Nat::from(amount_scaled),
        from_subaccount: None,
        fee: None,
        to: Account {
            owner: to,
            subaccount: None,
        },
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferArg,), (Result<candid::Nat, TransferError>,)>(
        token_ledger_principal,
        "icrc1_transfer",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index.0.to_string()),
        Ok((Err(TransferError::InsufficientFunds { balance }),)) => {
            Err(format!("Canister has insufficient funds. Available: {}", balance))
        }
        Ok((Err(e),)) => Err(format!("Transfer to user failed: {:?}", e)),
        Err(e) => Err(format!("Call to icrc1_transfer failed: {:?}", e)),
    }    
}