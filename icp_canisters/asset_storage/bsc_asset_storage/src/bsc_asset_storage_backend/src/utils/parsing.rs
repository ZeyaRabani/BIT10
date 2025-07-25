use alloy_primitives::{U256, Bytes};
use num::BigUint;

pub fn parse_hex_to_u256(hex_str: &str) -> Result<U256, String> {
    let cleaned = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    if cleaned.is_empty() {
        return Ok(U256::ZERO);
    }
    U256::from_str_radix(cleaned, 16)
        .map_err(|e| format!("Invalid hex string: {}", e))
}

pub fn parse_hex_to_u128(hex_str: &str) -> Result<u128, String> {
    let cleaned = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    if cleaned.is_empty() {
        return Ok(0);
    }
    u128::from_str_radix(cleaned, 16)
        .map_err(|e| format!("Invalid hex string: {}", e))
}

pub fn parse_hex_to_bytes(hex_str: &str) -> Result<Bytes, String> {
    let cleaned = hex_str.strip_prefix("0x").unwrap_or(hex_str);
    if cleaned.is_empty() {
        return Ok(Bytes::new());
    }
    hex::decode(cleaned)
        .map(Bytes::from)
        .map_err(|e| format!("Invalid hex string: {}", e))
}

pub fn parse_decimal_to_u128(decimal_str: &str) -> Result<u128, String> {
    decimal_str.parse::<u128>()
        .map_err(|e| format!("Invalid decimal string: {}", e))
}

pub fn validate_hex_address(addr: &str) -> Result<(), String> {
    if addr.len() != 42 || !addr.starts_with("0x") {
        return Err("Invalid address format".to_string());
    }
    Ok(())
}