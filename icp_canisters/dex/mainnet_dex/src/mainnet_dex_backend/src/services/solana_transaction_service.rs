use crate::services::solana_rpc_service;
use crate::wallet::solana_wallet::SolanaWallet;
use base64::{engine::general_purpose, Engine as _};
use solana_hash::Hash;
use solana_instruction::{AccountMeta, Instruction};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_system_interface::instruction as system_instruction;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::{
    address::get_associated_token_address_with_program_id,
    instruction::create_associated_token_account_idempotent,
};
use std::str::FromStr;

pub async fn create_associated_token_account_for_canister(mint_address: &str) -> Result<String, String> {
    verify_is_controller().await?;

    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;

    let instruction = create_associated_token_account_idempotent(
        payer.as_ref(),
        payer.as_ref(),
        &mint,
        &token_program_id,
    );

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(&[instruction], Some(payer.as_ref()), &blockhash);

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

pub async fn get_associated_token_account_address(mint_address: &str) -> Result<String, String> {
    let wallet = SolanaWallet::new_canister_wallet().await;
    let owner = wallet.solana_account();

    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;

    let ata =
        get_associated_token_address_with_program_id(owner.as_ref(), &mint, &token_program_id);

    Ok(ata.to_string())
}

pub async fn create_nonce_account_for_canister() -> Result<String, String> {
    verify_is_controller().await?;

    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();
    let nonce_account = wallet.derived_nonce_account();

    if solana_rpc_service::get_account_info(&nonce_account.ed25519_public_key.to_string())
        .await?
        .is_some()
    {
        return Ok(nonce_account.ed25519_public_key.to_string());
    }

    let rent = 1_500_000u64;

    let instructions = system_instruction::create_nonce_account(
        payer.as_ref(),
        nonce_account.as_ref(),
        payer.as_ref(),
        rent,
    );

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(&instructions, Some(payer.as_ref()), &blockhash);

    let payer_signature = payer.sign_message(&message).await;
    let nonce_signature = nonce_account.sign_message(&message).await;

    let transaction = Transaction {
        signatures: vec![payer_signature, nonce_signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await?;

    Ok(nonce_account.ed25519_public_key.to_string())
}

async fn get_token_program_id(mint: &Pubkey) -> Result<Pubkey, String> {
    let account_info = solana_rpc_service::get_account_info(&mint.to_string())
        .await?
        .ok_or_else(|| format!("Mint account not found: {}", mint))?;

    let owner = account_info
        .get("owner")
        .and_then(|o| o.as_str())
        .ok_or("Failed to get mint owner")?;

    Pubkey::from_str(owner).map_err(|e| format!("Invalid owner pubkey: {}", e))
}

async fn verify_is_controller() -> Result<(), String> {
    let caller = ic_cdk::caller();

    let status = ic_cdk::api::management_canister::main::canister_status(
        ic_cdk::api::management_canister::main::CanisterIdRecord {
            canister_id: ic_cdk::id(),
        },
    )
    .await
    .map_err(|e| format!("Failed to get canister status: {:?}", e))?
    .0;

    if !status.settings.controllers.contains(&caller) {
        return Err("Only controllers can call this function".to_string());
    }

    Ok(())
}

fn bincode_serialize<T: serde::Serialize>(value: &T) -> Vec<u8> {
    use bincode::Options;

    let config = bincode::DefaultOptions::new()
        .with_little_endian()
        .with_fixint_encoding();

    config.serialize(value).expect("Serialization failed")
}

pub async fn send_spl_token(to_address: &str, mint_address: &str, amount: u64) -> Result<String, String> {
    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let recipient =
        Pubkey::from_str(to_address).map_err(|e| format!("Invalid recipient address: {}", e))?;
    let mint =
        Pubkey::from_str(mint_address).map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;

    let from_ata =
        get_associated_token_address_with_program_id(payer.as_ref(), &mint, &token_program_id);

    let to_ata =
        get_associated_token_address_with_program_id(&recipient, &mint, &token_program_id);

    match solana_rpc_service::get_account_info(&to_ata.to_string()).await {
        Ok(None) => {
            ic_cdk::println!("Recipient ATA doesn't exist, creating it...");

            let create_ata_instruction = create_associated_token_account_idempotent(
                payer.as_ref(),
                &recipient,
                &mint,
                &token_program_id,
            );

            let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
            let blockhash = Hash::from_str(&recent_blockhash)
                .map_err(|e| format!("Invalid blockhash: {}", e))?;

            let message = Message::new_with_blockhash(
                &[create_ata_instruction],
                Some(payer.as_ref()),
                &blockhash,
            );

            let signature = payer.sign_message(&message).await;
            let transaction = Transaction {
                signatures: vec![signature],
                message,
            };

            let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
            solana_rpc_service::send_solana_transaction(&serialized).await?;

            ic_cdk::println!("Recipient ATA created successfully");

            let delay_nanos = 2_000_000_000;
            let start = ic_cdk::api::time();
            while ic_cdk::api::time() - start < delay_nanos {}
        }
        Ok(Some(_)) => {
            ic_cdk::println!("Recipient ATA already exists");
        }
        Err(e) => {
            ic_cdk::println!("Warning: Failed to check recipient ATA: {}", e);
        }
    }

    let transfer_instruction = if token_program_id.to_string()
        == "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    {
        create_transfer_checked_with_fee_instruction(
            &from_ata,
            &mint,
            &to_ata,
            payer.as_ref(),
            amount,
            9,
            1,
            &token_program_id,
        )
    } else {
        create_transfer_instruction(&from_ata, &to_ata, payer.as_ref(), amount, &token_program_id)
    };

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash =
        Hash::from_str(&recent_blockhash).map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message =
        Message::new_with_blockhash(&[transfer_instruction], Some(payer.as_ref()), &blockhash);

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

pub async fn send_solana_native_sol(to_address: &str, amount: u64) -> Result<String, String> {
    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let recipient =
        Pubkey::from_str(to_address).map_err(|e| format!("Invalid recipient address: {}", e))?;

    let instruction = system_instruction::transfer(payer.as_ref(), &recipient, amount);

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash =
        Hash::from_str(&recent_blockhash).map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(&[instruction], Some(payer.as_ref()), &blockhash);

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

fn create_transfer_checked_with_fee_instruction(source_address: &Pubkey, mint_address: &Pubkey, destination_address: &Pubkey, authority_address: &Pubkey, amount: u64, decimals: u8, _fee_basis_points: u16, token_program_id: &Pubkey) -> Instruction {
    let fee_amount = ((amount as u128 + 9999) / 10000) as u64;

    let mut data = vec![37];
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&[decimals]);
    data.extend_from_slice(&fee_amount.to_le_bytes());

    Instruction {
        program_id: *token_program_id,
        accounts: vec![
            AccountMeta::new(*source_address, false),
            AccountMeta::new_readonly(*mint_address, false),
            AccountMeta::new(*destination_address, false),
            AccountMeta::new_readonly(*authority_address, true),
        ],
        data,
    }
}

fn create_transfer_instruction(source_address: &Pubkey, destination_address: &Pubkey, authority_address: &Pubkey, amount: u64, token_program_id: &Pubkey) -> Instruction {
    Instruction {
        program_id: *token_program_id,
        accounts: vec![
            AccountMeta::new(*source_address, false),
            AccountMeta::new(*destination_address, false),
            AccountMeta::new_readonly(*authority_address, true),
        ],
        data: [vec![3], amount.to_le_bytes().to_vec()].concat(),
    }
}