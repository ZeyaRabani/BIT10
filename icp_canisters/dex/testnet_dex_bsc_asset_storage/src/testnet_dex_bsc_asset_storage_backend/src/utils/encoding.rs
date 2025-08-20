use crate::utils::types::CreateTransactionArgs;
use serde_json;
use alloy_primitives::hex;

pub fn decode_create_transaction_args_from_input(
    tx_input: &str,
    is_erc20_transfer: bool,
) -> Result<CreateTransactionArgs, String> {
    let input_bytes = hex::decode(tx_input.strip_prefix("0x").unwrap_or(""))
        .map_err(|_| "Failed to decode transaction input hex".to_string())?;

    let metadata_start = if is_erc20_transfer {
        68
    } else {
        0
    };

    if metadata_start + 4 > input_bytes.len() {
        return Err("Transaction input too short for metadata length prefix".to_string());
    }

    let len_bytes = &input_bytes[metadata_start..metadata_start + 4];
    let json_len = u32::from_be_bytes([len_bytes[0], len_bytes[1], len_bytes[2], len_bytes[3]]) as usize;
    let json_start = metadata_start + 4;
    let json_end = json_start + json_len;

    if json_end > input_bytes.len() {
        return Err(format!("Invalid metadata length. Expected {} bytes, but input only has {} bytes after metadata start.", json_len, input_bytes.len() - json_start));
    }

    let json_bytes = &input_bytes[json_start..json_end];
    serde_json::from_slice(json_bytes)
        .map_err(|e| format!("Failed to decode swap args from metadata: {}", e))
}

pub fn decode_erc20_recipient_from_log(log_topic: &str) -> Result<String, String> {
    let hex_topic = log_topic.strip_prefix("0x").unwrap_or(log_topic);
    if hex_topic.len() != 64 {
        return Err("Invalid log topic length for address".to_string());
    }
    let address_hex = &hex_topic[24..];
    Ok(format!("0x{}", address_hex))
}