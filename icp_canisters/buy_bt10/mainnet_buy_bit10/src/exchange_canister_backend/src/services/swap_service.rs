use crate::services::{rpc_service, token_service, transaction_service};
use crate::state::storage;
use crate::types::swap::{SwapResponse, SwapResponseData};
use crate::utils::constants::{PLATFORM_WALLET, TARGET_ADDRESS};
use crate::utils::converters::{generate_uuid_without_hyphens, u256_to_decimal_string};
use crate::utils::validators;
use crate::{ICPBuyArgs, ICPSellArgs};
use alloy_primitives::U256;
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use num_traits::ToPrimitive;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::str::FromStr;

pub async fn process_icp_buy(args: ICPBuyArgs) -> SwapResponse {
    let caller = ic_cdk::caller();
    let user_wallet_address = caller.to_text().to_lowercase();

    let token_out_amount = match validators::validate_amount(&args.token_out_amount) {
        Ok(amount) => amount,
        Err(e) => return SwapResponse::Err(e),
    };

    let token_in = match token_service::find_token_by_address(&args.token_in_address, "ICP") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token in address {} is not a supported ICP token",
                args.token_in_address
            ))
        }
    };

    let token_out =
        match token_service::find_bit10_token_by_address(&args.token_out_address, "ICP") {
            Some(token) => token,
            None => {
                return SwapResponse::Err(format!(
                    "Token out address {} is not a valid ICP BIT10 token",
                    args.token_out_address
                ))
            }
        };

    if let Err(e) = token_service::validate_bit10_token_availability(
        &token_out.token_name,
        &args.token_out_address,
        token_out_amount,
    ) {
        return SwapResponse::Err(e);
    }

    let token_in_price = match token_service::get_token_price_from_feed(&token_in).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_in price: {}", e)),
    };

    let token_out_price = match token_service::get_bit10_token_price(&token_out).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_out price: {}", e)),
    };

    if token_in_price <= 0.0 || token_out_price <= 0.0 {
        return SwapResponse::Err("Invalid token prices".to_string());
    }

    let token_ratio = token_out_price / token_in_price;
    let token_in_amount_for_one_token_out = token_ratio * 1.01;
    let token_in_amount_f64 =
        token_in_amount_for_one_token_out * token_out_amount.to_f64().unwrap_or(0.0);

    if token_in_amount_f64 <= 0.0 {
        return SwapResponse::Err("Calculated token_in_amount must be greater than 0".to_string());
    }

    let token_in_tx_hash = match transfer_from_user_icp(&token_in, caller, token_in_amount_f64)
        .await
    {
        Ok(tx_hash) => tx_hash,
        Err(e) => return SwapResponse::Err(e),
    };

    let token_out_tx_hash = match transfer_to_user_icp(
        &token_out,
        caller,
        token_out_amount.to_f64().unwrap_or(0.0),
    )
    .await
    {
        Ok(tx_hash) => tx_hash,
        Err(e) => return SwapResponse::Err(e),
    };

    storage::update_token_bought(
        &token_out.token_name,
        &args.token_out_address,
        &args.token_out_amount,
    );

    let swap_id = generate_uuid_without_hyphens().await;
    let token_in_usd_amount =
        token_out_price * token_out_amount.to_f64().unwrap_or(0.0) * 1.01;

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: user_wallet_address.to_lowercase(),
        token_in_address: args.token_in_address.to_lowercase(),
        token_in_amount: format!("{:.18}", token_in_amount_f64),
        token_in_usd_amount: format!("{:.18}", token_in_usd_amount),
        token_in_tx_hash: token_in_tx_hash.to_string(),
        token_out_address: args.token_out_address.to_lowercase(),
        token_out_amount: args.token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_string(),
        transaction_type: "Buy".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "ICP".to_string(),
    };

    storage::add_to_buy_history(response_data.clone());

    SwapResponse::Ok(response_data)
}

pub async fn process_icp_sell(args: ICPSellArgs) -> SwapResponse {
    let caller = ic_cdk::caller();
    let user_wallet_address = caller.to_text().to_lowercase();

    let token_in_amount = match validators::validate_amount(&args.token_in_amount) {
        Ok(amount) => amount,
        Err(e) => return SwapResponse::Err(e),
    };

    let token_in =
        match token_service::find_bit10_token_by_address(&args.token_in_address, "ICP") {
            Some(token) => token,
            None => {
                return SwapResponse::Err(format!(
                    "Token in address {} is not a supported BIT10 token",
                    args.token_in_address
                ))
            }
        };

    let icp_token_address = "ryjl3-tyaaa-aaaaa-aaaba-cai";
    if args.token_out_address.to_lowercase() != icp_token_address {
        return SwapResponse::Err(format!(
            "Token out address must be ICP ({})",
            icp_token_address
        ));
    }

    let token_out = match token_service::find_token_by_address(&args.token_out_address, "ICP") {
        Some(token) => token,
        None => return SwapResponse::Err("ICP token not found".to_string()),
    };

    let token_in_price = match token_service::get_bit10_token_price(&token_in).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_in price: {}", e)),
    };

    let token_out_price = match token_service::get_token_price_from_feed(&token_out).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_out price: {}", e)),
    };

    if token_in_price <= 0.0 || token_out_price <= 0.0 {
        return SwapResponse::Err("Invalid token prices".to_string());
    }

    let token_in_amount_f64 = token_in_amount.to_f64().unwrap_or(0.0);
    let token_in_usd_value = token_in_amount_f64 * token_in_price;
    let platform_fee = token_in_usd_value * 0.01;
    let token_out_usd_value = token_in_usd_value - platform_fee;
    let token_out_amount_f64 = token_out_usd_value / token_out_price;

    if token_out_amount_f64 <= 0.0 {
        return SwapResponse::Err(
            "Calculated token_out_amount must be greater than 0".to_string(),
        );
    }

    let token_in_tx_hash = match transfer_from_user_icp(&token_in, caller, token_in_amount_f64)
        .await
    {
        Ok(tx_hash) => tx_hash,
        Err(e) => return SwapResponse::Err(e),
    };

    let token_out_tx_hash = match transfer_to_user_icp(&token_out, caller, token_out_amount_f64)
        .await
    {
        Ok(tx_hash) => tx_hash,
        Err(e) => return SwapResponse::Err(e),
    };

    storage::update_token_sold(
        &token_in.token_name,
        &args.token_in_address,
        &args.token_in_amount,
    );

    let swap_id = generate_uuid_without_hyphens().await;

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: user_wallet_address.to_lowercase(),
        token_in_address: args.token_in_address.to_lowercase(),
        token_in_amount: args.token_in_amount.clone(),
        token_in_usd_amount: format!("{:.18}", token_in_usd_value),
        token_in_tx_hash: token_in_tx_hash.to_string(),
        token_out_address: args.token_out_address.to_lowercase(),
        token_out_amount: format!("{:.18}", token_out_amount_f64),
        token_out_tx_hash: token_out_tx_hash.to_string(),
        transaction_type: "Sell".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "ICP".to_string(),
    };

    storage::add_to_sell_history(response_data.clone());

    SwapResponse::Ok(response_data)
}

pub async fn process_base_buy(trx_hash: String) -> SwapResponse {
    if let Err(e) = validators::validate_transaction_hash(&trx_hash) {
        return SwapResponse::Err(e);
    }

    let transaction_hash = trx_hash.to_lowercase();

    if storage::transaction_exists(&transaction_hash) {
        return SwapResponse::Err("Transaction already processed".to_string());
    }

    let tx_data = match rpc_service::get_transaction_by_hash(&transaction_hash).await {
        Ok(tx) => tx,
        Err(e) => return SwapResponse::Err(format!("Failed to get transaction: {}", e)),
    };

    let tx_receipt = match rpc_service::get_transaction_receipt(&transaction_hash).await {
        Ok(receipt) => receipt,
        Err(e) => return SwapResponse::Err(format!("Failed to get receipt: {}", e)),
    };

    let tx_status = tx_receipt
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("0x0");
    if tx_status != "0x1" {
        return SwapResponse::Err("Transaction was not successful".to_string());
    }

    let tx_to_address = tx_data
        .get("to")
        .and_then(|v| v.as_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_else(|| String::new());

    let from_address = tx_data
        .get("from")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let target_address_lower = TARGET_ADDRESS.to_lowercase();

    let is_valid_transaction = if tx_to_address == target_address_lower {
        true
    } else {
        let input_data = tx_data.get("input").unwrap_or(&serde_json::Value::Null);
        if let Some(input_str) = input_data.as_str() {
            if input_str.len() > 10 && input_str.starts_with("0xa9059cbb") {
                if let Some(recipient) = validators::decode_erc20_recipient_address(input_str) {
                    recipient.to_lowercase() == target_address_lower
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        }
    };

    if !is_valid_transaction {
        return SwapResponse::Err(format!(
            "Transaction was not sent to the target address {}",
            TARGET_ADDRESS
        ));
    }

    let (token_out_address, token_out_amount) =
        match transaction_service::decode_base_transaction_data(&tx_data).await {
            Some((out_addr, out_amount)) => (out_addr, out_amount),
            None => {
                return SwapResponse::Err(
                    "Failed to decode token_out_address and token_out_amount".to_string(),
                )
            }
        };

    let token_out = match token_service::find_bit10_token_by_address(&token_out_address, "Base") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token out address '{}' not found in supported Base BIT10 tokens",
                token_out_address
            ))
        }
    };

    let (token_in_address, actual_amount_received) = if tx_to_address == target_address_lower {
        let value_hex = tx_data
            .get("value")
            .and_then(|v| v.as_str())
            .unwrap_or("0x0");
        let amount = match U256::from_str_radix(value_hex.strip_prefix("0x").unwrap_or("0"), 16) {
            Ok(amount) => amount,
            Err(_) => return SwapResponse::Err("Failed to parse ETH amount".to_string()),
        };
        (
            "0x0000000000000000000000000000000000000000b".to_string(),
            amount,
        )
    } else {
        let input_data = tx_data
            .get("input")
            .and_then(|v| v.as_str())
            .unwrap_or("0x");
        let amount = match validators::extract_erc20_amount_from_input(input_data, TARGET_ADDRESS)
        {
            Ok(amount) => amount,
            Err(e) => return SwapResponse::Err(format!("Failed to extract amount: {}", e)),
        };
        (tx_to_address.clone(), amount)
    };

    let token_in = match token_service::find_token_by_address(&token_in_address, "Base") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token in address '{}' not found in supported Base tokens",
                token_in_address
            ))
        }
    };

    let token_in_amount =
        match u256_to_decimal_string(actual_amount_received, token_in.token_decimals) {
            Ok(amount_str) => amount_str,
            Err(e) => return SwapResponse::Err(format!("Failed to convert amount: {}", e)),
        };

    let token_in_amount_decimal = match Decimal::from_str(&token_in_amount) {
        Ok(amount) => amount,
        Err(_) => return SwapResponse::Err("Failed to parse token_in_amount".to_string()),
    };

    let token_in_amount_without_fee = token_in_amount_decimal / dec!(1.01);

    let token_in_usd_price = match token_service::get_token_price_from_feed(&token_in).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_in price: {}", e)),
    };

    let token_out_usd_price = match token_service::get_bit10_token_price(&token_out).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_out price: {}", e)),
    };

    let token_in_usd_amount = token_in_amount_without_fee
        * Decimal::from_f64(token_in_usd_price).unwrap_or(Decimal::ZERO);

    let token_out_amount_decimal = match Decimal::from_str(&token_out_amount) {
        Ok(amount) => amount,
        Err(_) => return SwapResponse::Err("Failed to parse token_out_amount".to_string()),
    };

    let token_out_usd_value = token_out_amount_decimal
        * Decimal::from_f64(token_out_usd_price).unwrap_or(Decimal::ZERO);

    let difference_ratio = if token_in_usd_amount > Decimal::ZERO {
        ((token_out_usd_value - token_in_usd_amount).abs() / token_in_usd_amount) * dec!(100)
    } else {
        dec!(100)
    };

    let availability_check = token_service::validate_bit10_token_availability(
        &token_out.token_name,
        &token_out_address,
        token_out_amount_decimal,
    );

    let should_proceed = (token_out_usd_value <= token_in_usd_amount || difference_ratio <= dec!(3))
        && availability_check.is_ok();

    let (transaction_type, token_out_tx_hash) = if should_proceed {
        match transaction_service::send_bit10_token_to_user(
            &token_out,
            &from_address,
            &token_out_amount,
        )
        .await
        {
            Ok(tx_hash) => {
                storage::update_token_bought(
                    &token_out.token_name,
                    &token_out_address,
                    &token_out_amount,
                );
                ("Buy".to_string(), tx_hash)
            }
            Err(e) => return SwapResponse::Err(format!("Failed to send BIT10 token: {}", e)),
        }
    } else {
        match transaction_service::revert_transaction(
            &token_in,
            &from_address,
            actual_amount_received,
        )
        .await
        {
            Ok(tx_hash) => ("Revert".to_string(), tx_hash),
            Err(e) => return SwapResponse::Err(format!("Failed to revert transaction: {}", e)),
        }
    };

    let swap_id = generate_uuid_without_hyphens().await;

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: from_address.to_lowercase(),
        token_in_address: token_in_address.to_lowercase(),
        token_in_amount: token_in_amount.to_string(),
        token_in_usd_amount: token_in_usd_amount.to_string(),
        token_in_tx_hash: transaction_hash.to_lowercase(),
        token_out_address: token_out_address.to_lowercase(),
        token_out_amount: token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_lowercase(),
        transaction_type: transaction_type,
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "Base".to_string(),
    };

    storage::add_to_buy_history(response_data.clone());

    SwapResponse::Ok(response_data)
}

async fn transfer_from_user_icp( token: &crate::types::token::Token, from: Principal, amount: f64 ) -> Result<String, String> {
    let decimals = token.token_decimals;
    let multiplier = 10u64.pow(decimals as u32);
    let amount_scaled = (amount * (multiplier as f64)) as u128;

    let to_account = Account {
        owner: Principal::from_text(PLATFORM_WALLET).expect("Invalid platform wallet address"),
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

    let transfer_result =
        ic_cdk::call::<(TransferFromArgs,), (Result<candid::Nat, TransferFromError>,)>(
            Principal::from_text(token_ledger_id).expect("Invalid ledger principal"),
            "icrc2_transfer_from",
            (transfer_args,),
        )
        .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index.0.to_string()),
        Ok((Err(e),)) => Err(format!("Transfer failed: {:?}", e)),
        Err(e) => Err(format!("Call failed: {:?}", e)),
    }
}

async fn transfer_to_user_icp( token: &crate::types::token::Token, to: Principal, amount: f64 ) -> Result<String, String> {
    let decimals = token.token_decimals;
    let multiplier = 10u64.pow(decimals as u32);
    let amount_scaled = (amount * (multiplier as f64)) as u128;

    let token_ledger_principal = match &token.token_address {
        Some(addr) => Principal::from_text(addr.clone()).expect("Invalid ledger principal"),
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
        Ok((Err(e),)) => Err(format!("Transfer failed: {:?}", e)),
        Err(e) => Err(format!("Call failed: {:?}", e)),
    }
}