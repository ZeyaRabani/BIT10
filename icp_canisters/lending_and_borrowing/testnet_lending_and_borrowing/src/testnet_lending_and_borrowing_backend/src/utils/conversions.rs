use candid::Nat;
use rust_decimal::Decimal;
use std::str::FromStr;
use alloy_primitives::U256;

pub fn decimal_to_scaled_nat(amount: Decimal, decimals: u8) -> Result<Nat, String> {
    if amount < Decimal::ZERO {
        return Err("Amount cannot be negative".to_string());
    }

    let scale_factor = Decimal::from(10u128.pow(decimals as u32));
    let scaled_amount = (amount * scale_factor).trunc();

    Nat::from_str(&scaled_amount.to_string())
        .map_err(|_| format!("Failed to convert scaled amount '{}' to Nat", scaled_amount))
}

pub fn decimal_to_scaled_u256(amount: Decimal, decimals: u8) -> Result<U256, String> {
    if amount < Decimal::ZERO {
        return Err("Amount cannot be negative".to_string());
    }

    let scale_factor = Decimal::from(10u128.pow(decimals as u32));
    let scaled_amount = (amount * scale_factor).trunc();

    U256::from_str(&scaled_amount.to_string())
        .map_err(|_| format!("Failed to convert scaled amount '{}' to U256", scaled_amount))
}

pub fn u256_to_decimal_string(value: U256, decimals: u8) -> Result<String, String> {
    let value_str = value.to_string();
    let value_decimal = Decimal::from_str(&value_str)
        .map_err(|_| format!("Failed to convert U256 '{}' to Decimal", value_str))?;

    let scale_factor = Decimal::from(10u128.pow(decimals as u32));
    if scale_factor == Decimal::ZERO {
        return Err("Invalid decimal scale factor (zero)".to_string());
    }
    let result = value_decimal / scale_factor;
    Ok(result.to_string())
}