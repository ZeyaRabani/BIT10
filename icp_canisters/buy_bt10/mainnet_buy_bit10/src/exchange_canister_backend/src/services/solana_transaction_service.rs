use crate::services::solana_rpc_service;
use crate::wallet::solana_wallet::SolanaWallet;
use crate::services::token_service;
use crate::types::token::Token;
use crate::utils::constants::SOLANA_TARGET_ADDRESS;
use crate::utils::converters::decimal_to_u256;
use crate::utils::validators;
use crate::SwapArgs;
use crate::TransactionResponse;
use solana_instruction::{AccountMeta, Instruction};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_transaction::Transaction;
use solana_system_interface::instruction as system_instruction;
use solana_hash::Hash;
use std::str::FromStr;
use rust_decimal_macros::dec;
use spl_associated_token_account_interface::{address::get_associated_token_address_with_program_id, instruction::create_associated_token_account_idempotent};
use base64::{Engine as _, engine::general_purpose};

pub async fn create_associated_token_account_for_canister(mint_address: &str) -> Result<String, String> {
    // Verify caller is controller
    verify_is_controller().await?;

    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();
    
    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    // Get token program ID from mint account
    let token_program_id = get_token_program_id(&mint).await?;

    // Create ATA instruction
    let instruction = create_associated_token_account_idempotent(
        payer.as_ref(),
        payer.as_ref(),
        &mint,
        &token_program_id,
    );

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &blockhash,
    );

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    // let serialized = base64::encode(&bincode_serialize(&transaction));

	let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

pub async fn get_associated_token_account_address(mint_address: &str) -> Result<String, String> {
    let wallet = SolanaWallet::new_canister_wallet().await;
    let owner = wallet.solana_account();
    
    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;

    let ata = get_associated_token_address_with_program_id(
        owner.as_ref(),
        &mint,
        &token_program_id,
    );

    Ok(ata.to_string())
}

pub async fn create_nonce_account_for_canister() -> Result<String, String> {
    // Verify caller is controller
    verify_is_controller().await?;

    let wallet = SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();
    let nonce_account = wallet.derived_nonce_account();

    // Check if nonce account already exists
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

    let message = Message::new_with_blockhash(
        &instructions,
        Some(payer.as_ref()),
        &blockhash,
    );

    let payer_signature = payer.sign_message(&message).await;
    let nonce_signature = nonce_account.sign_message(&message).await;

    let transaction = Transaction {
        signatures: vec![payer_signature, nonce_signature],
        message,
    };

    // let serialized = base64::encode(&bincode_serialize(&transaction));

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
    
    // Get canister controllers
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

pub async fn send_spl_token(to_address: &str, mint_address: &str, amount: u64) -> Result<String, String> {
    use solana_pubkey::Pubkey;
    use solana_hash::Hash;
    use solana_message::Message;
    use solana_transaction::Transaction;

    let wallet = crate::wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let recipient = Pubkey::from_str(to_address)
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;

    let from_ata = get_associated_token_address_with_program_id(
        payer.as_ref(),
        &mint,
        &token_program_id,
    );

    let to_ata = get_associated_token_address_with_program_id(
        &recipient,
        &mint,
        &token_program_id,
    );

    // ToDo: Check this: We are creating ATA for the user
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
        }
        Ok(Some(_)) => {
            ic_cdk::println!("Recipient ATA already exists");
        }
        Err(e) => {
            ic_cdk::println!("Warning: Failed to check recipient ATA: {}", e);
        }
    }

    let _mint_info = solana_rpc_service::get_account_info(&mint.to_string())
        .await?
        .ok_or("Failed to get mint account info")?;

    let transfer_instruction = if token_program_id.to_string() == "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" {
        create_transfer_checked_with_fee_instruction(
            &from_ata,
            &mint,
            &to_ata,
            payer.as_ref(),
            amount,
            9, // decimals - adjust based on your token
            1, // fee in basis points (0.01%)
            &token_program_id,
        )
    } else {
        create_transfer_instruction(
            &from_ata,
            &to_ata,
            payer.as_ref(),
            amount,
            &token_program_id,
        )
    };

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(
        &[transfer_instruction],
        Some(payer.as_ref()),
        &blockhash,
    );

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

fn create_transfer_checked_with_fee_instruction(source_address: &Pubkey, mint_address: &Pubkey, destination_address: &Pubkey, authority_address: &Pubkey, amount: u64, decimals: u8, _fee_basis_points: u16, token_program_id: &Pubkey) -> Instruction {
    // Calculate the absolute fee amount = amount / 3,000,000 rounded up
    // let fee_amount = ((amount as u128 + 2999999) / 3000000) as u64;
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

fn bincode_serialize<T: serde::Serialize>(value: &T) -> Vec<u8> {
    use bincode::Options;
    
    let config = bincode::DefaultOptions::new()
        .with_little_endian()
        .with_fixint_encoding();
    
    config.serialize(value).expect("Serialization failed")
}

pub async fn create_solana_transaction(args: SwapArgs) -> TransactionResponse {
    let token_in = token_service::find_token_by_address(
        &args.token_in_address,
        "Solana"
    )
    .unwrap_or_else(|| {
        ic_cdk::trap(&format!(
            "Token in address '{}' not found in supported Solana tokens",
            args.token_in_address
        ))
    });

    let _token_out = token_service::find_bit10_token_by_address(
        &args.token_out_address,
        "Solana"
    )
    .unwrap_or_else(|| {
        ic_cdk::trap(&format!(
            "Token out address '{}' not found in supported Solana BIT10 tokens",
            args.token_out_address
        ))
    });

    let amount_decimal = validators::validate_amount(&args.token_in_amount)
        .unwrap_or_else(|e| ic_cdk::trap(&e));

    let amount_with_fee = amount_decimal * dec!(1.01);

    let final_amount_u256 = decimal_to_u256(
        amount_with_fee,
        token_in.token_decimals
    )
    .unwrap_or_else(|e| ic_cdk::trap(&e));

    let final_amount = final_amount_u256
        .to::<u64>();

    let mut data_bytes = Vec::new();
    data_bytes.extend_from_slice(args.token_out_address.as_bytes());
    data_bytes.push(0x00);
    data_bytes.extend_from_slice(args.token_out_amount.as_bytes());

    let data_hex = format!("0x{}", alloy_primitives::hex::encode(&data_bytes));

    let is_native_sol = args.token_in_address.to_lowercase()
        == "so11111111111111111111111111111111111111111";

    let (to_address, value, data) = if is_native_sol {
        (
            SOLANA_TARGET_ADDRESS.to_string(),
            final_amount.to_string(),
            data_hex,
        )
    } else {
        (
            args.token_in_address.clone(),
            final_amount.to_string(),
            data_hex,
        )
    };

    TransactionResponse {
        from: args.user_wallet_address,
        to: to_address,
        value,
        data,
    }
}

pub async fn send_solana_native_sol(to_address: &str, amount: u64) -> Result<String, String> {
    use solana_pubkey::Pubkey;
    use solana_hash::Hash;
    use solana_message::Message;
    use solana_transaction::Transaction;
    use solana_system_interface::instruction as system_instruction;

    let wallet = crate::wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let recipient = Pubkey::from_str(to_address)
        .map_err(|e| format!("Invalid recipient address: {}", e))?;

    let instruction = system_instruction::transfer(
        payer.as_ref(),
        &recipient,
        amount,
    );

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &blockhash,
    );

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

pub async fn send_solana_bit10_token_to_user(token: &Token,to_address: &str, amount_str: &str) -> Result<String, String> {
    use rust_decimal::Decimal;

    let amount_decimal = Decimal::from_str(amount_str)
        .map_err(|_| "Failed to parse token amount")?;

    let amount_u256 = decimal_to_u256(amount_decimal, token.token_decimals)?;
    let amount = amount_u256.to::<u64>();

    let mint_address = token
        .token_address
        .as_deref()
        .ok_or("Token address is required")?;

    send_spl_token_with_decimals(
        to_address,
        mint_address,
        amount,
        token.token_decimals,
    )
    .await
}

pub async fn send_spl_token_with_decimals(to_address: &str, mint_address: &str, amount: u64, decimals: u8) -> Result<String, String> {
    use solana_pubkey::Pubkey;
    use solana_hash::Hash;
    use solana_message::Message;
    use solana_transaction::Transaction;

    let wallet = crate::wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    let payer = wallet.solana_account();

    let recipient = Pubkey::from_str(to_address)
        .map_err(|e| format!("Invalid recipient address: {}", e))?;
    let mint = Pubkey::from_str(mint_address)
        .map_err(|e| format!("Invalid mint address: {}", e))?;

    let token_program_id = get_token_program_id(&mint).await?;
    

    let from_ata = get_associated_token_address_with_program_id(
        payer.as_ref(),
        &mint,
        &token_program_id,
    );

    let to_ata = get_associated_token_address_with_program_id(
        &recipient,
        &mint,
        &token_program_id,
    );

    // ToDo: Check this we are creating user ATA of this does not exist
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
            
            let delay_nanos = 2_000_000_000; // 2 seconds
            let start = ic_cdk::api::time();
            while ic_cdk::api::time() - start < delay_nanos {
                // Wait
            }
        }
        Ok(Some(_)) => {
            ic_cdk::println!("Recipient ATA already exists");
        }
        Err(e) => {
            ic_cdk::println!("Warning: Failed to check recipient ATA: {}", e);
        }
    }

    let transfer_instruction = if token_program_id.to_string() == "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" {
        create_transfer_checked_instruction(
            &from_ata,
            &mint,
            &to_ata,
            payer.as_ref(),
            amount,
            decimals,
            &token_program_id,
        )
    } else {
        create_transfer_instruction(
            &from_ata,
            &to_ata,
            payer.as_ref(),
            amount,
            &token_program_id,
        )
    };

    let recent_blockhash = solana_rpc_service::get_recent_blockhash().await?;
    let blockhash = Hash::from_str(&recent_blockhash)
        .map_err(|e| format!("Invalid blockhash: {}", e))?;

    let message = Message::new_with_blockhash(
        &[transfer_instruction],
        Some(payer.as_ref()),
        &blockhash,
    );

    let signature = payer.sign_message(&message).await;
    let transaction = Transaction {
        signatures: vec![signature],
        message,
    };

    let serialized = general_purpose::STANDARD.encode(&bincode_serialize(&transaction));
    solana_rpc_service::send_solana_transaction(&serialized).await
}

fn create_transfer_checked_instruction(source_address: &Pubkey, mint_address: &Pubkey, destination_address: &Pubkey, authority_address: &Pubkey, amount: u64, decimals: u8, token_program_id: &Pubkey) -> Instruction {
    let mut data = vec![12];
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&[decimals]);

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

pub async fn decode_solana_transaction_data(memo_data: &str) -> Option<(String, String)> {
    if memo_data.is_empty() {
        return None;
    }

    let bytes = memo_data.as_bytes();
    let separator_pos = bytes.iter().position(|&b| b == 0x00)?;

    let token_out_address_bytes = &bytes[..separator_pos];
    let token_out_amount_bytes = &bytes[separator_pos + 1..];

    let token_out_address = String::from_utf8(token_out_address_bytes.to_vec())
        .ok()?;
    let token_out_amount = String::from_utf8(token_out_amount_bytes.to_vec())
        .ok()?;

    Some((token_out_address, token_out_amount))
}

pub async fn revert_solana_transaction(token: &Token, to_address: &str, amount: u64) -> Result<String, String> {
    if token.is_native {
        send_solana_native_sol(to_address, amount).await
    } else {
        let mint_address = token
            .token_address
            .as_deref()
            .ok_or("Token address is required")?;
        send_spl_token(to_address, mint_address, amount).await
    }
}

pub async fn extract_token_in_info(tx_data: &serde_json::Value) -> (String, u64) {
    let pre_balances = tx_data
        .get("meta")
        .and_then(|m| m.get("preBalances"))
        .and_then(|b| b.as_array());

    let post_balances = tx_data
        .get("meta")
        .and_then(|m| m.get("postBalances"))
        .and_then(|b| b.as_array());

    if let (Some(pre), Some(post)) = (pre_balances, post_balances) {
        if let (Some(pre_bal), Some(post_bal)) = (
            pre.get(0).and_then(|v| v.as_u64()),
            post.get(0).and_then(|v| v.as_u64()),
        ) {
            if pre_bal > post_bal {
                let amount = pre_bal - post_bal;
                return (
                    "So11111111111111111111111111111111111111111".to_string(),
                    amount,
                );
            }
        }
    }

    if let Some(pre_token_balances) = tx_data
        .get("meta")
        .and_then(|m| m.get("preTokenBalances"))
        .and_then(|b| b.as_array())
    {
        if let Some(post_token_balances) = tx_data
            .get("meta")
            .and_then(|m| m.get("postTokenBalances"))
            .and_then(|b| b.as_array())
        {
            for (pre_balance, post_balance) in
                pre_token_balances.iter().zip(post_token_balances.iter())
            {
                let pre_amount = pre_balance
                    .get("uiTokenAmount")
                    .and_then(|a| a.get("amount"))
                    .and_then(|a| a.as_str())
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(0);

                let post_amount = post_balance
                    .get("uiTokenAmount")
                    .and_then(|a| a.get("amount"))
                    .and_then(|a| a.as_str())
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(0);

                if pre_amount > post_amount {
                    let mint = pre_balance
                        .get("mint")
                        .and_then(|m| m.as_str())
                        .unwrap_or("")
                        .to_string();

                    return (mint, pre_amount - post_amount);
                }
            }
        }
    }

    ("So11111111111111111111111111111111111111111".to_string(), 0)
}

pub fn extract_memo_from_transaction(tx_data: &serde_json::Value) -> Option<String> {
    let instructions = tx_data
        .get("transaction")
        .and_then(|t| t.get("message"))
        .and_then(|m| m.get("instructions"))
        .and_then(|i| i.as_array())?;

    for instruction in instructions {
        let program_id_index = instruction.get("programIdIndex")?.as_u64()?;
        let account_keys = tx_data
            .get("transaction")
            .and_then(|t| t.get("message"))
            .and_then(|m| m.get("accountKeys"))
            .and_then(|k| k.as_array())?;

        if let Some(program_id) = account_keys.get(program_id_index as usize) {
            if let Some(program_id_str) = program_id.as_str() {
                if program_id_str == "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
                    || program_id_str == "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
                {
                    if let Some(data) = instruction.get("data").and_then(|d| d.as_str()) {
                        if let Ok(decoded) = bs58::decode(data).into_vec() {
                            if let Ok(memo_str) = String::from_utf8(decoded) {
                                return Some(memo_str);
                            }
                        }
                    }
                }
            }
        }
    }

    None
}
