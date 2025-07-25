use candid::{CandidType, Principal};
use ic_ledger_types::{AccountIdentifier, BlockIndex, Memo, Subaccount, Tokens, DEFAULT_SUBACCOUNT, MAINNET_LEDGER_CANISTER_ID};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    pub amount: Tokens,
    pub to_principal: Principal,
    pub to_subaccount: Option<Subaccount>,
}

pub async fn transfer_tokens(args: TransferArgs) -> Result<BlockIndex, String> {
    if args.amount.e8s() == 0 {
        return Err("Amount must be greater than 0".to_string());
    }
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