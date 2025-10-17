use crate::services::{solana_rpc_service, solana_transaction_service, token_service};
use crate::state::storage;
use crate::types::swap::{SwapResponse, SwapResponseData};
use crate::utils::constants::SOLANA_TARGET_ADDRESS;
use crate::utils::converters::{generate_uuid_without_hyphens, u256_to_decimal_string};
use crate::utils::validators;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::str::FromStr;

pub async fn process_solana_buy(trx_hash: String) -> SwapResponse {
    if let Err(e) = validators::validate_solana_transaction_hash(&trx_hash) {
        return SwapResponse::Err(e);
    }

    let transaction_hash = trx_hash.clone();

    if storage::transaction_exists(&transaction_hash) {
        return SwapResponse::Err("Transaction already processed".to_string());
    }

    match solana_rpc_service::get_transaction_status(&transaction_hash).await {
        Ok(status) => {
            if status == "not_found" {
                return SwapResponse::Err(
                    "Transaction not found. Please ensure the transaction is confirmed on Solana blockchain.".to_string()
                );
            }
        }
        Err(e) => {
            ic_cdk::println!("Warning: Failed to get transaction status: {}", e);
        }
    }

    let tx_data = match solana_rpc_service::get_transaction_by_hash(&transaction_hash).await {
        Ok(tx) => {
            tx
        },
        Err(e) => {
            ic_cdk::println!("Failed to get transaction: {}", e);
            return SwapResponse::Err(format!("Failed to get transaction: {}", e));
        }
    };

    let meta = tx_data
        .get("meta")
        .ok_or_else(|| SwapResponse::Err("Transaction metadata not found".to_string()));
    
    let meta = match meta {
        Ok(m) => m,
        Err(e) => return e,
    };

    let tx_status = match meta.get("err") {
        Some(err_value) => {
            if err_value.is_null() {
                true
            } else {
                ic_cdk::println!("Transaction failed with error: {:?}", err_value);
                false
            }
        }
        None => {
            true
        }
    };

    if !tx_status {
        let error_detail = meta.get("err")
            .and_then(|e| e.as_object())
            .map(|obj| format!("{:?}", obj))
            .unwrap_or_else(|| "Unknown error".to_string());
        
        return SwapResponse::Err(format!(
            "Transaction was not successful. Error: {}",
            error_detail
        ));
    }

    let from_address = tx_data
        .get("transaction")
        .and_then(|t| t.get("message"))
        .and_then(|m| m.get("accountKeys"))
        .and_then(|keys| keys.get(0))
        .and_then(|key| key.as_str())
        .unwrap_or("")
        .to_string();

    if from_address.is_empty() {
        return SwapResponse::Err("Failed to extract sender address".to_string());
    }

    let target_address_lower = SOLANA_TARGET_ADDRESS.to_lowercase();
    let account_keys = tx_data
        .get("transaction")
        .and_then(|t| t.get("message"))
        .and_then(|m| m.get("accountKeys"))
        .and_then(|keys| keys.as_array())
        .ok_or_else(|| SwapResponse::Err("Failed to get account keys".to_string()));

    let account_keys = match account_keys {
        Ok(keys) => keys,
        Err(e) => return e,
    };
    
    let is_valid_transaction = account_keys
        .iter()
        .any(|key| {
            key.as_str()
                .map(|s| {
                    let matches = s.to_lowercase() == target_address_lower;
                    if matches {
                        ic_cdk::println!("Found target address in transaction");
                    }
                    matches
                })
                .unwrap_or(false)
        });

    if !is_valid_transaction {
        return SwapResponse::Err(format!(
            "Transaction was not sent to the target address {}",
            SOLANA_TARGET_ADDRESS
        ));
    }

    let memo_data = solana_transaction_service::extract_memo_from_transaction(&tx_data);
    
    let (token_out_address, token_out_amount) = match memo_data {
        Some(memo) => {
            match solana_transaction_service::decode_solana_transaction_data(&memo).await {
                Some((out_addr, out_amount)) => {
                    (out_addr, out_amount)
                },
                None => {
                    return SwapResponse::Err(
                        "Failed to decode token_out_address and token_out_amount".to_string(),
                    )
                }
            }
        }
        None => {
            return SwapResponse::Err("Failed to extract memo data from transaction".to_string())
        }
    };

    let token_out = match token_service::find_bit10_token_by_address(&token_out_address, "Solana")
    {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token out address '{}' not found in supported Solana BIT10 tokens",
                token_out_address
            ))
        }
    };

    let (token_in_address, actual_amount_received) =
    solana_transaction_service::extract_token_in_info(&tx_data).await;

    let token_in = match token_service::find_token_by_address(&token_in_address, "Solana") {
        Some(token) => token,
        None => {
            return SwapResponse::Err(format!(
                "Token in address '{}' not found in supported Solana tokens",
                token_in_address
            ))
        }
    };

    let token_in_amount = match u256_to_decimal_string(
        alloy_primitives::U256::from(actual_amount_received),
        token_in.token_decimals,
    ) {
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
            match solana_transaction_service::send_solana_bit10_token_to_user(
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
        match solana_transaction_service::revert_solana_transaction(
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
        user_wallet_address: from_address,
        token_in_address: token_in_address,
        token_in_amount: token_in_amount.to_string(),
        token_in_usd_amount: token_in_usd_amount.to_string(),
        token_in_tx_hash: transaction_hash,
        token_out_address: token_out_address,
        token_out_amount: token_out_amount,
        token_out_tx_hash: token_out_tx_hash,
        transaction_type: transaction_type,
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "Solana".to_string(),
    };

    storage::add_to_buy_history(response_data.clone());

    SwapResponse::Ok(response_data)
}