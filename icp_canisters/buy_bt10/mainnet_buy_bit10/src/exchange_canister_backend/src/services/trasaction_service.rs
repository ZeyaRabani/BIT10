use crate::services::rpc_service;
use crate::state::state::read_state;
use crate::types::token::Token;
use crate::utils::constants::TARGET_ADDRESS;
use crate::utils::converters::decimal_to_u256;
use crate::utils::validators;
use crate::wallet::base_wallet::BaseWallet;
use crate::SwapArgs;
use crate::TransactionResponse;
use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address, Signature, U256};
use candid::Nat;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::str::FromStr;

pub async fn create_base_transaction(args: SwapArgs) -> TransactionResponse {
    use crate::services::token_service::{
        find_bit10_token_by_address, find_token_by_address,
    };

    let token_in = find_token_by_address(&args.token_in_address, "Base")
        .unwrap_or_else(|| {
            ic_cdk::trap(&format!(
                "Token in address '{}' not found in supported Base tokens",
                args.token_in_address
            ))
        });

    let _token_out = find_bit10_token_by_address(&args.token_out_address, "Base")
        .unwrap_or_else(|| {
            ic_cdk::trap(&format!(
                "Token out address '{}' not found in supported Base BIT10 tokens",
                args.token_out_address
            ))
        });

    let amount_decimal = validators::validate_amount(&args.token_in_amount)
        .unwrap_or_else(|e| ic_cdk::trap(&e));

    let amount_with_fee = amount_decimal * dec!(1.01);

    let final_amount_u256 = decimal_to_u256(amount_with_fee, token_in.token_decimals)
        .unwrap_or_else(|e| ic_cdk::trap(&e));

    let mut data_bytes = Vec::new();
    data_bytes.extend_from_slice(args.token_out_address.as_bytes());
    data_bytes.push(0x00);
    data_bytes.extend_from_slice(args.token_out_amount.as_bytes());

    let data_hex = format!("0x{}", hex::encode(&data_bytes));

    let is_native_eth =
        args.token_in_address.to_lowercase() == "0x0000000000000000000000000000000000000000b";

    let (to_address, value, data) = if is_native_eth {
        (
            TARGET_ADDRESS.to_string(),
            format!("0x{:x}", final_amount_u256),
            data_hex,
        )
    } else {
        let method_id = &hex::decode("a9059cbb").unwrap();
        let mut encoded = method_id.clone();

        let target_addr = Address::from_str(TARGET_ADDRESS)
            .unwrap_or_else(|_| ic_cdk::trap("Invalid target address"));
        let mut to_bytes = [0u8; 32];
        to_bytes[12..].copy_from_slice(target_addr.as_ref());
        encoded.extend_from_slice(&to_bytes);

        let mut amount_bytes = [0u8; 32];
        amount_bytes.copy_from_slice(&final_amount_u256.to_be_bytes::<32>());
        encoded.extend_from_slice(&amount_bytes);

        encoded.extend_from_slice(&data_bytes);

        (
            args.token_in_address.clone(),
            "0x0".to_string(),
            format!("0x{}", hex::encode(&encoded)),
        )
    };

    TransactionResponse {
        from: args.user_wallet_address,
        to: to_address,
        value,
        data,
    }
}

pub async fn get_transaction_count(address: &str) -> Nat {
    match rpc_service::get_transaction_count(address).await {
        Ok(count) => Nat::from(count),
        Err(e) => ic_cdk::trap(&format!("Failed to get transaction count: {}", e)),
    }
}

pub async fn send_erc20_token(token_contract: Address, to: Address, amount: U256) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = rpc_service::get_transaction_count(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) = rpc_service::get_gas_price().await?;

    let method_id = &hex::decode("a9059cbb").unwrap();
    let mut encoded = method_id.clone();

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let chain_id = read_state(|s| s.base_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 100_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(token_contract),
        value: U256::ZERO,
        access_list: Default::default(),
        input: encoded.into(),
    };

    sign_and_send_transaction(transaction, &wallet).await
}

pub async fn send_native_eth(to: Address, amount: U256) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = rpc_service::get_transaction_count(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) = rpc_service::get_gas_price().await?;

    let chain_id = read_state(|s| s.base_network().chain_id());

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit: 21_000,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to),
        value: amount,
        access_list: Default::default(),
        input: Default::default(),
    };

    sign_and_send_transaction(transaction, &wallet).await
}

async fn sign_and_send_transaction(transaction: TxEip1559, wallet: &BaseWallet) -> Result<String, String> {
    let tx_hash = transaction.signature_hash().0;

    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;

    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("Failed to create signature");

    let signed_tx = transaction.into_signed(signature);
    let raw_transaction_hash = *signed_tx.hash();

    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    match rpc_service::send_raw_transaction(&raw_transaction_hex).await {
        Ok(tx_hash) => Ok(tx_hash),
        Err(e) if e.contains("already known") => Ok(format!("0x{:x}", raw_transaction_hash)),
        Err(e) => Err(e),
    }
}

pub async fn decode_base_transaction_data(tx_data: &serde_json::Value) -> Option<(String, String)> {
    let input_data = tx_data.get("input").and_then(|v| v.as_str()).unwrap_or("0x");

    if input_data == "0x" || input_data.len() <= 2 {
        return None;
    }

    let hex_data = if input_data.starts_with("0x") {
        &input_data[2..]
    } else {
        input_data
    };

    let bytes = match hex::decode(hex_data) {
        Ok(bytes) => bytes,
        Err(e) => {
            ic_cdk::println!("Failed to decode hex data: {}", e);
            return None;
        }
    };

    let separator_pos = bytes.iter().position(|&b| b == 0x00)?;

    let token_out_address_bytes = &bytes[..separator_pos];
    let token_out_amount_bytes = &bytes[separator_pos + 1..];

    let token_out_address = String::from_utf8(token_out_address_bytes.to_vec()).ok()?;
    let token_out_amount = String::from_utf8(token_out_amount_bytes.to_vec()).ok()?;

    Some((token_out_address, token_out_amount))
}

pub async fn revert_transaction(token: &Token, to_address: &str, amount: U256) -> Result<String, String> {
    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address: {}", to_address))?;

    if token.is_native {
        send_native_eth(recipient, amount).await
    } else {
        let token_contract = Address::from_str(token.token_address.as_deref().unwrap())
            .map_err(|_| "Invalid token contract address")?;
        send_erc20_token(token_contract, recipient, amount).await
    }
}

pub async fn send_bit10_token_to_user(token: &Token, to_address: &str, amount_str: &str) -> Result<String, String> {
    let amount_decimal = Decimal::from_str(amount_str)
        .map_err(|_| "Failed to parse token amount")?;

    let amount_u256 = decimal_to_u256(amount_decimal, token.token_decimals)?;

    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address: {}", to_address))?;

    let token_contract = Address::from_str(token.token_address.as_deref().unwrap())
        .map_err(|_| "Invalid token contract address")?;

    send_erc20_token(token_contract, recipient, amount_u256).await
}