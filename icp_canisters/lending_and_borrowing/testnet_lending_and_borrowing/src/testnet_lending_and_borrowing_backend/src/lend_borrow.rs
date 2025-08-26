use candid::{Nat, Principal};
use ic_cdk::api::call::call;
use ic_cdk::api::time;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};

use crate::types::{BorrowArgs, BorrowResponse, BorrowResponseData, LendArgs, LendResponse, LendResponseData};
use crate::http_client::fetch_interest_rate;
use crate::controllers::assert_is_controller;

#[ic_cdk::update]
pub async fn lend(args: LendArgs) -> LendResponse {
    // assert_is_controller();

    let lender_principal = match Principal::from_text(&args.lender_address) {
        Ok(principal) => principal,
        Err(e) => {
            return LendResponse::Err(format!("Invalid lender principal: {}", e));
        }
    };

    let to_account = Account {
        owner: ic_cdk::id(),
        subaccount: None,
    };

    let amount_nat = Nat::from(args.token_amount);

    let transfer_from_args = TransferFromArgs {
        from: Account {
            owner: lender_principal,
            subaccount: None,
        },
        to: to_account,
        spender_subaccount: None,
        amount: amount_nat.clone(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let ledger_principal = match Principal::from_text(&args.token_address) {
        Ok(p) => p,
        Err(e) => {
            return LendResponse::Err(format!("Invalid token ledger principal: {}", e));
        }
    };

    let transfer_result: Result<(Result<BlockIndex, TransferFromError>,), _> =
        call(ledger_principal, "icrc2_transfer_from", (transfer_from_args,)).await;

    let block_index = match transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => {
            ic_cdk::println!("ICRC-2 transfer_from failed for lend: {:?}", e);
            return LendResponse::Err(format!("Token transfer failed: {:?}", e));
        }
        Err(e) => {
            ic_cdk::println!("Inter-canister call to ICRC-2 transfer_from failed: {:?}", e);
            return LendResponse::Err(format!("Inter-canister call failed: {:?}", e));
        }
    };

    let interest_rate = match fetch_interest_rate().await {
        Ok(rate) => rate,
        Err(e) => {
            ic_cdk::println!("Failed to fetch interest rate: {}", e);
            "N/A".to_string()
        }
    };

    let response_data = LendResponseData {
        lender_address: args.lender_address,
        token_chain: args.token_chain,
        token_address: args.token_address,
        token_amount: args.token_amount,
        token_sent_trx_hash: format!("{}", block_index),
        interest_rate,
        status: "Active".to_string(),
        opened_at: time().to_string(),
    };

    LendResponse::Ok(response_data)
}

#[ic_cdk::update]
pub async fn borrow(args: BorrowArgs) -> BorrowResponse {
    // assert_is_controller();

    let borrower_principal = match Principal::from_text(&args.borrower_address) {
        Ok(principal) => principal,
        Err(e) => {
            return BorrowResponse::Err(format!("Invalid borrower principal: {}", e));
        }
    };

    let borrow_ledger_principal = match Principal::from_text(&args.borrow_token_address) {
        Ok(p) => p,
        Err(e) => {
            return BorrowResponse::Err(format!("Invalid borrow token ledger principal: {}", e));
        }
    };

    let collateral_ledger_principal = match Principal::from_text(&args.collateral_address) {
        Ok(p) => p,
        Err(e) => {
            return BorrowResponse::Err(format!("Invalid collateral token ledger principal: {}", e));
        }
    };

    let collateral_transfer_from_args = TransferFromArgs {
        from: Account {
            owner: borrower_principal,
            subaccount: None,
        },
        to: Account {
            owner: ic_cdk::id(),
            subaccount: None,
        },
        spender_subaccount: None,
        amount: Nat::from(args.collateral_amount),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let collateral_transfer_result: Result<(Result<BlockIndex, TransferFromError>,), _> =
        call(collateral_ledger_principal, "icrc2_transfer_from", (collateral_transfer_from_args,)).await;

    let collateral_block_index = match collateral_transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => {
            ic_cdk::println!("ICRC-2 collateral transfer_from failed: {:?}", e);
            return BorrowResponse::Err(format!("Collateral transfer failed: {:?}", e));
        }
        Err(e) => {
            ic_cdk::println!("Inter-canister call to ICRC-2 collateral transfer_from failed: {:?}", e);
            return BorrowResponse::Err(format!("Collateral inter-canister call failed: {:?}", e));
        }
    };

    let borrow_target_principal = match Principal::from_text(&args.borrow_wallet_address) {
        Ok(p) => p,
        Err(_) => {
            ic_cdk::println!(
                "Invalid borrow_wallet_address provided: {}. Defaulting to borrower_address.",
                args.borrow_wallet_address
            );
            borrower_principal
        }
    };

    let borrow_transfer_args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: borrow_target_principal,
            subaccount: None,
        },
        amount: Nat::from(args.borrow_token_amount),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let borrow_transfer_result: Result<(Result<BlockIndex, TransferError>,), _> =
        call(borrow_ledger_principal, "icrc1_transfer", (borrow_transfer_args,)).await;

    let borrow_block_index = match borrow_transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => {
            ic_cdk::println!("ICRC-1 borrow token transfer failed: {:?}", e);
            return BorrowResponse::Err(format!("Borrow token transfer failed: {:?}", e));
        }
        Err(e) => {
            ic_cdk::println!("Inter-canister call to ICRC-1 borrow token transfer failed: {:?}", e);
            return BorrowResponse::Err(format!("Borrow token inter-canister call failed: {:?}", e));
        }
    };

    let interest_rate = match fetch_interest_rate().await {
        Ok(rate) => rate,
        Err(e) => {
            ic_cdk::println!("Failed to fetch interest rate: {}", e);
            "N/A".to_string()
        }
    };

    let response_data = BorrowResponseData {
        borrower_address: args.borrower_address,
        borrow_token_chain: args.borrow_token_chain,
        borrow_token_address: args.borrow_token_address,
        borrow_token_amount: args.borrow_token_amount.to_string(),
        borrow_trx_hash: format!("{}", borrow_block_index),
        collateral_address: args.collateral_address,
        collateral_chain: args.collateral_chain,
        collateral_amount: args.collateral_amount.to_string(),
        collateral_trx_hash: format!("{}", collateral_block_index),
        borrow_wallet_address: args.borrow_wallet_address,
        interest_rate,
        status: "Active".to_string(),
        opened_at: time().to_string(),
    };

    BorrowResponse::Ok(response_data)
}