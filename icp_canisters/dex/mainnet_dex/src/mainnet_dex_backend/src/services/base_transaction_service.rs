use crate::services::base_rpc_service;
use crate::state::state::read_state;
use crate::wallet::base_wallet::BaseWallet;
use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address, Signature, U256};
use candid::Nat;

pub async fn get_base_transaction_count(address: &str) -> Nat {
    match base_rpc_service::get_base_transaction_count(address).await {
        Ok(count) => Nat::from(count),
        Err(e) => ic_cdk::trap(&format!("Failed to get Base transaction count: {}", e)),
    }
}

pub async fn send_base_erc20_token(
    token_contract: Address,
    to: Address,
    amount: U256,
) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = base_rpc_service::get_base_transaction_count(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) =
        base_rpc_service::get_base_gas_price().await?;

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

    sign_and_send_base_transaction(transaction, &wallet).await
}

pub async fn send_base_native_eth(to: Address, amount: U256) -> Result<String, String> {
    let wallet = BaseWallet::new_canister_wallet().await;
    let canister_address = wallet.base_address().to_string();

    let nonce = base_rpc_service::get_base_transaction_count(&canister_address).await?;

    let (max_fee_per_gas, max_priority_fee_per_gas) =
        base_rpc_service::get_base_gas_price().await?;

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

    sign_and_send_base_transaction(transaction, &wallet).await
}

async fn sign_and_send_base_transaction(
    transaction: TxEip1559,
    wallet: &BaseWallet,
) -> Result<String, String> {
    let tx_hash = transaction.signature_hash().0;

    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;

    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("Failed to create signature");

    let signed_tx = transaction.into_signed(signature);
    let raw_transaction_hash = *signed_tx.hash();

    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    let computed_hash = format!("0x{:x}", raw_transaction_hash);
    
    ic_cdk::println!("Computed transaction hash: {}", computed_hash);

    match base_rpc_service::send_base_raw_transaction(&raw_transaction_hex).await {
        Ok(tx_hash) => {
            ic_cdk::println!("Transaction sent successfully: {}", tx_hash);
            Ok(tx_hash)
        }
        Err(e) if e.contains("already known") || e.contains("replacement transaction underpriced") => {
            ic_cdk::println!("Transaction already known, using computed hash: {}", computed_hash);
            Ok(computed_hash)
        }
        Err(e) if e.contains("No consensus could be reached") => {
            ic_cdk::println!("Consensus failed, using computed hash: {}. Error: {}", computed_hash, e);
            Ok(computed_hash)
        }
        Err(e) => {
            ic_cdk::println!("Transaction failed: {}", e);
            Err(e)
        }
    }
}