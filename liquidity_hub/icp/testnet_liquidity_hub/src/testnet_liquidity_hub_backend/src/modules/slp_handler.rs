use candid::{Principal, Nat};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use crate::constants::*;
use crate::modules::{SLPArgs, SLPResponse, SLPResponseData, SLPWithdrawArgs, SLPWithdrawResponse};
use crate::state::storage::{SLP_RESPONSES, SLP_WITHDRAW_RESPONSES};

pub async fn handle_slp(args: SLPArgs) -> SLPResponse {
    let caller: Principal = ic_cdk::caller();

    let tick_in_ledger_canister_id = match args.tick_in_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return SLPResponse::Err(format!("Unsupported token: {:?}", args.tick_in_name)),
    };

    match transfer_from_user(caller, args.tick_in_amount.clone(), tick_in_ledger_canister_id).await {
        Ok(block_index) => {
            let response_data = SLPResponseData {
                tick_in_name: args.tick_in_name,
                tick_in_amount: args.tick_in_amount,
                duration: args.duration,
                tick_in_block: block_index,
                tick_in_address: caller,
                tick_in_timestamp: ic_cdk::api::time().to_string(),
            };

            unsafe {
                let index = SLP_RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
                SLP_RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
            }

            SLPResponse::Ok(response_data)
        }
        Err(e) => SLPResponse::Err(e),
    }
}

pub async fn handle_slp_withdraw(args: SLPWithdrawArgs) -> SLPWithdrawResponse {
    let caller: Principal = ic_cdk::caller();

    let (total_available, total_withdrawn) = calculate_available_amounts(caller, &args.tick_out_name);
    let remaining_withdrawable = if total_available > total_withdrawn {
        total_available.clone() - total_withdrawn.clone()
    } else {
        Nat::from(0u64)
    };

    if args.tick_out_amount > remaining_withdrawable {
        return SLPWithdrawResponse::Err(format!(
            "Insufficient withdrawable balance. Available: {}, Requested: {}, Already withdrawn: {}",
            remaining_withdrawable, args.tick_out_amount, total_withdrawn
        ));
    }

    let tick_out_ledger_canister_id = match args.tick_out_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return SLPWithdrawResponse::Err(format!("Unsupported token: {:?}", args.tick_out_name)),
    };

    match transfer_to_user(caller, args.tick_out_amount.clone(), tick_out_ledger_canister_id).await {
        Ok(block_index) => {
            let response_data = SLPWithdrawResponseData {
                tick_out_name: args.tick_out_name,
                tick_out_amount: args.tick_out_amount,
                tick_out_block: Nat::from(block_index),
                tick_out_address: caller,
                tick_out_time: ic_cdk::api::time().to_string(),
            };

            unsafe {
                let index = SLP_WITHDRAW_RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
                SLP_WITHDRAW_RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
            }

            SLPWithdrawResponse::Ok(response_data)
        }
        Err(e) => SLPWithdrawResponse::Err(e),
    }
}

// Helper functions
async fn transfer_from_user(
    caller: Principal,
    amount: Nat,
    canister_id: Principal,
) -> Result<BlockIndex, String> {
    let to_account = Account {
        owner: ic_cdk::id(),
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to: to_account,
        spender_subaccount: None,
        amount: amount.into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<BlockIndex, TransferFromError>,)>(
        canister_id,
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index),
        Ok((Err(e),)) => Err(format!("Transfer failed: {:?}", e)),
        Err(e) => Err(format!("Call failed: {:?}", e)),
    }
}

async fn transfer_to_user(
    caller: Principal,
    amount: Nat,
    canister_id: Principal,
) -> Result<BlockIndex, String> {
    let transfer_args = TransferArg {
        memo: None,
        amount: NumTokens::from(amount),
        from_subaccount: None,
        fee: None,
        to: caller.into(),
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
        canister_id,
        "icrc1_transfer",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index),
        Ok((Err(e),)) => Err(format!("Transfer failed: {:?}", e)),
        Err(e) => Err(format!("Call failed: {:?}", e)),
    }
}

fn calculate_available_amounts(caller: Principal, token_name: &str) -> (Nat, Nat) {
    let slp_responses = get_slp_responses();
    let previous_withdrawals = get_slp_withdraw_responses();
    
    let filtered_responses: Vec<&SLPResponseData> = slp_responses.iter()
        .filter(|response| 
            response.tick_in_address == caller &&
            response.tick_in_name == token_name
        )
        .collect();

    let current_time = ic_cdk::api::time();
    let mut total_available = Nat::from(0u64);
    
    for response in &filtered_responses {
        let start_time = match response.tick_in_timestamp.parse::<u64>() {
            Ok(time) => time,
            Err(_) => continue,
        };
        
        let duration_ns = response.duration.0.to_u64().unwrap_or(0) * 24 * 60 * 60 * 1_000_000_000;
        let unlock_time = start_time + duration_ns;
        
        if current_time >= unlock_time {
            total_available += response.tick_in_amount.clone();
        }
    }

    let total_withdrawn: Nat = previous_withdrawals.iter()
        .filter(|w| w.tick_out_address == caller && w.tick_out_name == token_name)
        .fold(Nat::from(0u64), |acc, w| acc + w.tick_out_amount.clone());

    (total_available, total_withdrawn)
}
