use crate::constants::*;
use crate::types::swap::*;
use crate::types::storage::{StableString, StableNat};
use ic_cdk::api::call::CallResult;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use candid::Nat;
use num_bigint::BigUint;

pub async fn balance_and_fee(tick_in_name: String, caller: Principal) -> Result<BalanceAndFeeResponse, String> {
    let tick_in_ledger_canister_id = match tick_in_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        "ckBTC" => CKBTC_LEDGER_CANISTER_ID,
        "ckETH" => CKETH_LEDGER_CANISTER_ID,
        "ICP" => ICP_LEDGER_CANISTER_ID,
        "BIT10.DEFI" => BIT10_DEFI_LEDGER_CANISTER_ID,
        _ => return Err(format!("Unsupported token: {}", tick_in_name)),
    };

    let fee_result = ic_cdk::call::<(), (Nat,)>(tick_in_ledger_canister_id, "icrc1_fee", ()).await;
    let fee = match fee_result {
        Ok((fee,)) => fee,
        Err(err) => return Err(format!("Failed to get fee: {:?}", err)),
    };

    let balance_result = ic_cdk::call::<(Account,), (Nat,)>(tick_in_ledger_canister_id, "icrc1_balance_of", (caller.into(),)).await;
    let balance = match balance_result {
        Ok((balance,)) => balance,
        Err(err) => return Err(format!("Failed to get balance: {:?}", err)),
    };

    let total = balance.clone() + fee.clone();

    Ok(BalanceAndFeeResponse { balance, fee, total })
}

pub fn update_circulating_supply(token_name: String, amount: Nat) {
    CIRCULATING_SUPPLY.with(|supply| {
        let mut supply = supply.borrow_mut();
        let key = StableString(token_name);
        let value = StableNat(amount);
        
        let current = supply.get(&key).unwrap_or(StableNat(Nat::from(0u64)));
        
        supply.insert(key, StableNat(current.0 + value.0));
    });
}

pub fn update_reverse_swap_supply(token_name: String, amount: Nat) {
    REVERSE_SWAP_SUPPLY.with(|supply| {
        let mut supply = supply.borrow_mut();
        let key = StableString(token_name);
        let value = StableNat(amount);
        
        let current = supply.get(&key).unwrap_or(StableNat(Nat::from(0u64)));
        
        supply.insert(key, StableNat(current.0 + value.0));
    });
}