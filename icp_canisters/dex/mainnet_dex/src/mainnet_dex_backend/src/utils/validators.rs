use rust_decimal::Decimal;
use std::str::FromStr;

pub fn validate_transaction_hash(trx_hash: &str) -> Result<(), String> {
    if !trx_hash.starts_with("0x") || trx_hash.len() != 66 {
        return Err("Invalid transaction hash format".to_string());
    }
    Ok(())
}

pub fn validate_solana_transaction_hash(trx_hash: &str) -> Result<(), String> {
    if trx_hash.len() < 80 || trx_hash.len() > 90 {
        return Err("Invalid Solana transaction hash format".to_string());
    }
    
    bs58::decode(trx_hash)
        .into_vec()
        .map_err(|_| "Invalid base58 encoding in transaction hash")?;
    
    Ok(())
}

pub fn validate_amount(amount_str: &str) -> Result<Decimal, String> {
    let amount = Decimal::from_str(amount_str)
        .map_err(|_| format!("Failed to parse amount: {}", amount_str))?;
    
    if amount <= Decimal::ZERO {
        return Err("Amount must be greater than 0".to_string());
    }
    
    Ok(amount)
}

pub fn decode_erc20_recipient_address(input_data: &str) -> Option<String> {
    if !input_data.starts_with("0x") || input_data.len() < 138 {
        return None;
    }

    let hex_data = &input_data[2..];
    
    if !hex_data.starts_with("a9059cbb") {
        return None;
    }
    
    if hex_data.len() < 72 {
        return None;
    }
    
    let recipient_hex = &hex_data[8..72];
    if recipient_hex.len() != 64 {
        return None;
    }
    
    Some(format!("0x{}", &recipient_hex[24..64]))
}

pub fn extract_erc20_amount_from_input( input_data: &str, expected_recipient: &str ) -> Result<alloy_primitives::U256, String> {
    use alloy_primitives::U256;
    
    if !input_data.starts_with("0x") {
        return Err("Invalid input data format: missing 0x prefix".to_string());
    }

    let hex_data = &input_data[2..];
    
    if hex_data.len() < 136 {
        return Err(format!(
            "Input data too short for ERC20 transfer: {} chars, need at least 136",
            hex_data.len()
        ));
    }
    
    if !hex_data.starts_with("a9059cbb") {
        return Err("Not a transfer function call".to_string());
    }
    
    let recipient_hex = &hex_data[8..72];
    let recipient_address = format!("0x{}", &recipient_hex[24..64]);
    
    if !recipient_address.eq_ignore_ascii_case(expected_recipient) {
        return Err(format!(
            "Transfer not to expected recipient. Expected: {}, Found: {}",
            expected_recipient, recipient_address
        ));
    }
    
    let amount_hex = &hex_data[72..136];
    U256::from_str_radix(amount_hex, 16)
        .map_err(|e| format!("Failed to parse transfer amount: {}", e))
}
