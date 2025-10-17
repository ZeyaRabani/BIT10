use crate::services::{bsc_rpc_service, bsc_transaction_service, token_service};
use crate::state::storage;
use crate::types::swap::{SwapResponse, SwapResponseData};
use crate::utils::constants::BSC_TARGET_ADDRESS;
use crate::utils::converters::{generate_uuid_without_hyphens, u256_to_decimal_string};
use crate::utils::validators;
use alloy_primitives::U256;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::str::FromStr;

pub async fn process_bsc_buy(trx_hash: String) -> SwapResponse {
    if let Err(e) = validators::validate_transaction_hash(&trx_hash) {
        return SwapResponse::Err(e);
    }

    let transaction_hash = trx_hash.to_lowercase();

    if storage::transaction_exists(&transaction_hash) {
        return SwapResponse::Err("Transaction already processed".to_string());
    }

    let tx_data = match bsc_rpc_service::get_bsc_transaction_by_hash(&transaction_hash).await {
        Ok(tx) => {
            if let Some(input) = tx.get("input").and_then(|v| v.as_str()) {
                ic_cdk::println!("Transaction input data length: {} bytes", input.len());
            }
            tx
        },
        Err(e) => return SwapResponse::Err(format!("Failed to get transaction: {}", e)),
    };

    let tx_receipt = match bsc_rpc_service::get_bsc_transaction_receipt(&transaction_hash).await {
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

    let target_address_lower = BSC_TARGET_ADDRESS.to_lowercase();

    let is_valid_transaction = if tx_to_address == target_address_lower {
        true
    } else {
        let input_data = tx_data.get("input").unwrap_or(&serde_json::Value::Null);
        if let Some(input_str) = input_data.as_str() {
            if input_str.len() > 10 && input_str.starts_with("0xa9059cbb") {
                if let Some(recipient) = validators::decode_erc20_recipient_address(input_str) {
                    let is_valid = recipient.to_lowercase() == target_address_lower;
                    is_valid
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
            BSC_TARGET_ADDRESS
        ));
    }

    let (token_out_address, token_out_amount) =
        match bsc_transaction_service::decode_bsc_transaction_data(&tx_data).await {
            Some((out_addr, out_amount)) => {
                (out_addr, out_amount)
            }
            None => {
                return SwapResponse::Err(
                    "Failed to decode token_out_address and token_out_amount".to_string(),
                )
            }
        };

    let token_out = match token_service::find_bit10_token_by_address(&token_out_address, "Binance Smart Chain") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token out address '{}' not found in supported BSC BIT10 tokens",
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
            Err(_) => return SwapResponse::Err("Failed to parse BNB amount".to_string()),
        };
        (
            "0x0000000000000000000000000000000000000000bnb".to_string(),
            amount,
        )
    } else {
        let input_data = tx_data
            .get("input")
            .and_then(|v| v.as_str())
            .unwrap_or("0x");
        let amount = match validators::extract_erc20_amount_from_input(input_data, BSC_TARGET_ADDRESS)
        {
            Ok(amount) => amount,
            Err(e) => return SwapResponse::Err(format!("Failed to extract amount: {}", e)),
        };
        (tx_to_address.clone(), amount)
    };

    let token_in = match token_service::find_token_by_address(&token_in_address, "Binance Smart Chain") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token in address '{}' not found in supported BSC tokens",
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
        match bsc_transaction_service::send_bsc_bit10_token_to_user(
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
        match bsc_transaction_service::revert_bsc_transaction(
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
        token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_lowercase(),
        transaction_type,
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "Binance Smart Chain".to_string(),
    };

    storage::add_to_buy_history(response_data.clone());

    SwapResponse::Ok(response_data)
}