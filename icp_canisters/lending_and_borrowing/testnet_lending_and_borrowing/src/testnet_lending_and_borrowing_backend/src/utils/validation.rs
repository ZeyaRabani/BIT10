use candid::Principal;
use rust_decimal::Decimal;
use std::str::FromStr;
use crate::lib::Token;

pub fn parse_decimal_amount(amount_str: &str) -> Result<Decimal, String> {
    Decimal::from_str(amount_str).map_err(|e| format!("Invalid amount format: {}", e))
}

pub fn validate_principal_address(address_str: &str) -> Result<Principal, String> {
    Principal::from_text(address_str)
        .map_err(|e| format!("Invalid ICP Principal address format: {}", e))
}

pub fn validate_ethereum_address(address_str: &str) -> Result<alloy_primitives::Address, String> {
    alloy_primitives::Address::from_str(address_str)
        .map_err(|e| format!("Invalid Ethereum address format: {}", e))
}

pub fn validate_token_on_chain(
    token_address: &str,
    token_chain: &str,
    supported_tokens: &[Token],
) -> Result<&Token, String> {
    let token = supported_tokens
        .iter()
        .find(|t| {
            t.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(token_address)
            }) && t.token_chain.eq_ignore_ascii_case(token_chain)
        })
        .ok_or_else(|| {
            format!(
                "Token address '{}' not supported on chain '{}'",
                token_address, token_chain
            )
        })?;

    if !token.is_active {
        return Err(format!("Token '{}' is currently inactive", token.token_symbol));
    }
    Ok(token)
}

pub fn validate_timestamp_elapsed(
    opened_at_str: &str,
    current_time_nanos: u64,
    duration_seconds: u64,
) -> Result<(), String> {
    let opened_time_nanos = opened_at_str
        .parse::<u64>()
        .map_err(|_| format!("Invalid opened_at timestamp format: {}", opened_at_str))?;

    let required_elapsed_nanos = duration_seconds * 1_000_000_000u64;

    if current_time_nanos < opened_time_nanos {
        return Err("Current time is earlier than opened time.".to_string());
    }

    let elapsed_nanos = current_time_nanos - opened_time_nanos;

    if elapsed_nanos < required_elapsed_nanos {
        let remaining_nanos = required_elapsed_nanos - elapsed_nanos;
        let remaining_seconds = remaining_nanos / 1_000_000_000;
        let remaining_hours = remaining_seconds / 3600;
        let remaining_days = remaining_hours / 24;

        Err(format!(
            "Operation not allowed yet. Remaining time: {} days, {} hours, {} minutes",
            remaining_days,
            remaining_hours % 24,
            (remaining_seconds % 3600) / 60
        ))
    } else {
        Ok(())
    }
}