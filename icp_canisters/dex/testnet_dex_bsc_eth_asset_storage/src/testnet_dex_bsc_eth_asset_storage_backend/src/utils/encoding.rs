use crate::utils::types::CreateTransactionArgs;
use serde_json;
use alloy_primitives::hex;

pub async fn decode_transaction_data(
    input_data: &serde_json::Value,
) -> Option<CreateTransactionArgs> {
    let input_str = input_data.as_str().unwrap_or("0x");

    if input_str == "0x" || input_str.len() <= 2 {
        return None;
    }

    let hex_data = if input_str.starts_with("0x") {
        &input_str[2..]
    } else {
        input_str
    };

    let bytes = match hex::decode(hex_data) {
        Ok(bytes) => bytes,
        Err(e) => {
            ic_cdk::println!("Failed to decode hex data: {}", e);
            return None;
        }
    };

    let json_start_pos = bytes.windows(1).rposition(|w| w == b"{")?;
    let json_bytes = &bytes[json_start_pos..];
    let json_str = String::from_utf8_lossy(json_bytes);

    match serde_json::from_str::<CreateTransactionArgs>(&json_str) {
        Ok(args) => Some(args),
        Err(e) => {
            ic_cdk::println!("Failed to parse JSON data: {}", e);
            None
        }
    }
}

pub fn decode_erc20_recipient(input_data: &str) -> Option<String> {
    if !input_data.starts_with("0x") || input_data.len() < 138 {
        return None;
    }

    let hex_data = &input_data[2..];

    if hex_data.len() >= 68 {
        let to_address_hex = &hex_data[32..72];
        Some(format!("0x{}", to_address_hex))
    } else {
        None
    }
}