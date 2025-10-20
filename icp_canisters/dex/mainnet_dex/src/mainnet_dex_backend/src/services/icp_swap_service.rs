use crate::services::{
    token_service, base_transaction_service, solana_transaction_service, 
    icp_transaction_service, bsc_transaction_service,
};
use crate::types::swap::{SwapArgs, SwapResponse, SwapResult};
use crate::utils::{converters, validators};
use crate::state::storage;
use rust_decimal::Decimal;
use std::str::FromStr;
use candid::Principal;
use alloy_primitives::Address;
use rust_decimal_macros::dec;
use num_traits::ToPrimitive;

const NATIVE_ETH_BASE: &str = "0x0000000000000000000000000000000000000000base";
const NATIVE_SOL_SOLANA: &str = "So11111111111111111111111111111111111111111";
const NATIVE_BNB_BSC: &str = "0x0000000000000000000000000000000000000000bnb";

pub async fn process_icp_swap(args: SwapArgs) -> SwapResult {
    let caller = ic_cdk::caller();

    ic_cdk::println!("[DEBUG] Processing ICP Swap for caller: {:?}", caller);
    ic_cdk::println!("[DEBUG] Swap Args: {:?}", args);

    let pair = token_service::get_pair_by_pool_id(&args.pool_id)
        .ok_or_else(|| format!("Pool with ID {} does not exist", args.pool_id))?;

    let token_in = token_service::find_token_by_address(&args.token_in_address, &args.source_chain)
        .ok_or_else(|| format!(
            "Token with address {} on chain {} not found in supported tokens",
            args.token_in_address, args.source_chain
        ))?;

    let token_out = token_service::find_token_by_address(&args.token_out_address, &args.destination_chain)
        .ok_or_else(|| format!(
            "Token with address {} on chain {} not found in supported tokens",
            args.token_out_address, args.destination_chain
        ))?;

    let verified_source_chain = token_in.token_chain.clone();
    let verified_destination_chain = token_out.token_chain.clone();
    let verified_token_in_address = token_in.token_address.clone().unwrap_or_else(|| args.token_in_address.clone());
    let verified_token_out_address = token_out.token_address.clone().unwrap_or_else(|| args.token_out_address.clone());

    let token_in_matches = (token_in.token_id == pair.token_a_token_id && 
                            token_in.token_chain == pair.token_a_chain) ||
                           (token_in.token_id == pair.token_b_token_id && 
                            token_in.token_chain == pair.token_b_chain);

    let token_out_matches = (token_out.token_id == pair.token_a_token_id && 
                             token_out.token_chain == pair.token_a_chain) ||
                            (token_out.token_id == pair.token_b_token_id && 
                             token_out.token_chain == pair.token_b_chain);

    if !token_in_matches {
        return Err(format!(
            "Token in (address: {}, chain: {}) does not belong to pool {}",
            args.token_in_address, args.source_chain, args.pool_id
        ));
    }

    if !token_out_matches {
        return Err(format!(
            "Token out (address: {}, chain: {}) does not belong to pool {}",
            args.token_out_address, args.destination_chain, args.pool_id
        ));
    }

    let amount_in = validators::validate_amount(&args.amount_in)?;

    if args.expected_amount_out.is_empty() {
        return Err("expected_amount_out is required".to_string());
    }
    
    let expected_amount_out = validators::validate_amount(&args.expected_amount_out)?;

    let slippage = Decimal::from_str(&args.slippage)
        .map_err(|_| format!("Invalid slippage: {}", args.slippage))?;

    if slippage < Decimal::ZERO || slippage > Decimal::from(12) {
        return Err("Slippage must be between 0 and 12".to_string());
    }

    ic_cdk::println!("[DEBUG] Slippage set to: {}%", slippage);
    ic_cdk::println!("[DEBUG] Expected amount out from user: {}", expected_amount_out);

    ic_cdk::println!("[DEBUG] Checking pool liquidity before initiating transfer...");
    
    let pool_info_response = token_service::get_pool_info();
    let pool_info = pool_info_response
        .pools
        .iter()
        .find(|p| p.pool_id == args.pool_id)
        .ok_or_else(|| format!("Pool {} not found in pool info", args.pool_id))?;

    // Determine which token is token_in and which is token_out in the pool
    let is_token_in_a = token_in.token_address.as_ref() == Some(&pool_info.token_a_address) &&
                        token_in.token_chain == pool_info.token_a_chain;
    let is_token_out_a = token_out.token_address.as_ref() == Some(&pool_info.token_a_address) &&
                         token_out.token_chain == pool_info.token_a_chain;

    let available_balance = if is_token_out_a {
        &pool_info.token_a_balance
    } else if token_out.token_address.as_ref() == Some(&pool_info.token_b_address) &&
              token_out.token_chain == pool_info.token_b_chain {
        &pool_info.token_b_balance
    } else {
        return Err(format!(
            "Token out does not match pool structure for pool {}",
            args.pool_id
        ));
    };

    let available = Decimal::from_str(available_balance)
        .map_err(|_| format!("Invalid pool balance: {}", available_balance))?;

    if expected_amount_out > available {
        ic_cdk::println!(
            "[ERROR] Insufficient liquidity: expected {} but only {} available. Aborting before transfer.",
            expected_amount_out,
            available
        );
        return Err(format!(
            "Insufficient liquidity in pool. Available: {}, Required: {}",
            available,
            expected_amount_out
        ));
    }

    ic_cdk::println!(
        "[DEBUG] Liquidity check passed: {} available, {} expected",
        available,
        expected_amount_out
    );

    let platform_fee_multiplier = dec!(1.01);
    let amount_in_with_fee = amount_in * platform_fee_multiplier;

    ic_cdk::println!("[DEBUG] Attempting to receive payment of {} from user...", amount_in_with_fee);

    let tx_hash_in = match transfer_token_in_to_canister(
        &token_in,
        &verified_source_chain,
        caller,
        amount_in_with_fee,
    )
    .await
    {
        Ok(hash) => {
            ic_cdk::println!("[DEBUG] Received payment successfully with tx hash: {}", hash);
            hash
        },
        Err(e) => {
            ic_cdk::println!("[ERROR] Failed to receive payment: {}", e);
            return Err(format!("Failed to receive payment: {}", e));
        }
    };

    let token_in_usd_price = match token_service::get_token_price_from_feed(&token_in).await {
        Ok(price) => price,
        Err(e) => {
            ic_cdk::println!("[ERROR] Failed to get token_in price: {}. Attempting revert...", e);
            let _ = revert_swap(
                &token_in,
                &verified_source_chain,
                &verified_token_in_address,
                &args.tick_in_wallet_address,
                amount_in_with_fee,
            )
            .await;
            return Err(format!("Failed to get token_in price: {}", e));
        }
    };

    let token_out_usd_price = match token_service::get_token_price_from_feed(&token_out).await {
        Ok(price) => price,
        Err(e) => {
            ic_cdk::println!("[ERROR] Failed to get token_out price: {}. Attempting revert...", e);
            let _ = revert_swap(
                &token_in,
                &verified_source_chain,
                &verified_token_in_address,
                &args.tick_in_wallet_address,
                amount_in_with_fee,
            )
            .await;
            return Err(format!("Failed to get token_out price: {}", e));
        }
    };

    let amount_in_usd = amount_in.to_f64().unwrap_or(0.0) * token_in_usd_price;
    let calculated_amount_out = if token_out_usd_price > 0.0 {
        amount_in_usd / token_out_usd_price
    } else {
        let _ = revert_swap(
            &token_in,
            &verified_source_chain,
            &verified_token_in_address,
            &args.tick_in_wallet_address,
            amount_in_with_fee,
        )
        .await;
        return Err("Token out price is zero".to_string());
    };

    let calculated_amount_out_decimal = Decimal::from_str(&calculated_amount_out.to_string())
        .map_err(|_| {
            let _ = async {
                revert_swap(
                    &token_in,
                    &verified_source_chain,
                    &verified_token_in_address,
                    &args.tick_in_wallet_address,
                    amount_in_with_fee,
                )
                .await
            };
            "Failed to convert calculated amount to decimal".to_string()
        })?;

    ic_cdk::println!("[DEBUG] Token In Price USD: {}, Amount In (USD): {}", 
             token_in_usd_price, 
             amount_in_usd);
    ic_cdk::println!("[DEBUG] Token Out Price USD: {}, Calculated Amount Out: {}", 
             token_out_usd_price, 
             calculated_amount_out);

    let slippage_multiplier = Decimal::ONE - (slippage / Decimal::from(100));
    let min_acceptable_output = expected_amount_out * slippage_multiplier;

    ic_cdk::println!("[DEBUG] User expected amount out: {}", expected_amount_out);
    ic_cdk::println!("[DEBUG] Calculated amount out: {}", calculated_amount_out_decimal);
    ic_cdk::println!("[DEBUG] Slippage: {}%", slippage);
    ic_cdk::println!("[DEBUG] Minimum acceptable output (expected * (1 - slippage)): {}", min_acceptable_output);

    if calculated_amount_out_decimal > available {
        ic_cdk::println!(
            "[ERROR] Insufficient liquidity: need {} but only {} available. Reverting...",
            calculated_amount_out_decimal,
            available
        );
        let revert_hash = revert_swap(
            &token_in,
            &verified_source_chain,
            &verified_token_in_address,
            &args.tick_in_wallet_address,
            amount_in_with_fee,
        )
        .await
        .map_err(|e| {
            ic_cdk::println!("[CRITICAL ERROR] Revert failed: {}", e);
            format!("Insufficient liquidity and revert failed: {}", e)
        })?;

        let swap_id = converters::generate_uuid_without_hyphens().await;
        let timestamp = ic_cdk::api::time();
        let swap_type = if verified_source_chain == verified_destination_chain {
            "Same Chain".to_string()
        } else {
            "Cross Chain".to_string()
        };

        ic_cdk::println!("[SUCCESS] Reverted due to insufficient liquidity. Returned {} to user.", amount_in_with_fee);
        
        let swap_response = SwapResponse {
        swap_id: swap_id.to_lowercase(),
        pool_id: args.pool_id,
        tick_in_wallet_address: format_address(&args.tick_in_wallet_address, &verified_source_chain),
        tick_out_wallet_address: format_address(&args.tick_out_wallet_address, &verified_destination_chain),
        swap_type,
        source_chain: verified_source_chain.clone(),
        destination_chain: verified_destination_chain.clone(),
        token_in_address: format_address(&verified_token_in_address, &token_in.token_chain),
        token_out_address: format_address(&verified_token_out_address, &token_out.token_chain),
        amount_in: args.amount_in,
        amount_out: amount_in_with_fee.to_string(),
        slippage: args.slippage,
        tx_hash_in: format_address(&tx_hash_in, &verified_source_chain),
        tx_hash_out: format_address(&revert_hash, &verified_source_chain),
        status: "Reverted".to_string(),
        timestamp,
    };

    storage::add_swap_to_history(swap_response.clone());

    return Ok(swap_response);
    }

    let (status, actual_amount_out, tx_hash_out) = if calculated_amount_out_decimal >= min_acceptable_output {
        ic_cdk::println!(
            "[INFO] Calculated amount {} meets minimum {} (expected {} with {}% slippage). Proceeding with swap...",
            calculated_amount_out_decimal,
            min_acceptable_output,
            expected_amount_out,
            slippage
        );
        
        match send_token_out_to_user(
            &token_out,
            &verified_destination_chain,
            &verified_token_out_address,
            &args.tick_out_wallet_address,
            calculated_amount_out_decimal,
        )
        .await
        {
            Ok(hash) => {
                ic_cdk::println!("[SUCCESS] Swap completed. Sent {} tokens. Tx Hash: {}", 
                         calculated_amount_out_decimal, hash);
                
                // Update pool balances after successful swap
                // Include the platform fee (1%) in the pool balance update
                let update_result = update_pool_balances_after_swap(
                    &args.pool_id,
                    &pool_info.token_a_balance,
                    &pool_info.token_b_balance,
                    is_token_in_a,
                    amount_in_with_fee,
                    calculated_amount_out_decimal,
                );

                match update_result {
                    Ok(_) => {
                        ic_cdk::println!("[DEBUG] Pool balances updated successfully");
                    },
                    Err(e) => {
                        ic_cdk::println!("[WARNING] Failed to update pool balances: {}", e);
                    }
                }
                
                (
                    "Swap".to_string(),
                    calculated_amount_out_decimal.to_string(),
                    hash,
                )
            },
            Err(e) => {
                ic_cdk::println!("[ERROR] Failed to send tokens: {}. Reverting...", e);
                let _revert_hash = revert_swap(
                    &token_in,
                    &verified_source_chain,
                    &verified_token_in_address,
                    &args.tick_in_wallet_address,
                    amount_in_with_fee,
                )
                .await
                .unwrap_or_else(|revert_err| {
                    ic_cdk::println!("[CRITICAL ERROR] Revert also failed: {}", revert_err);
                    "revert_failed".to_string()
                });
                
                return Err(format!("Swap failed and reverted: {}", e));
            }
        }
    } else {
        ic_cdk::println!(
            "[INFO] Calculated amount {} is below minimum {} (expected {} with {}% slippage). Reverting...",
            calculated_amount_out_decimal,
            min_acceptable_output,
            expected_amount_out,
            slippage
        );
        
        let revert_hash = revert_swap(
            &token_in,
            &verified_source_chain,
            &verified_token_in_address,
            &args.tick_in_wallet_address,
            amount_in_with_fee,
        )
        .await
        .map_err(|e| {
            ic_cdk::println!("[CRITICAL ERROR] Revert failed: {}", e);
            format!("Slippage exceeded and revert failed: {}", e)
        })?;

        ic_cdk::println!("[SUCCESS] Reverted due to excessive slippage. Returned {} to user. Tx Hash: {}", 
                 amount_in_with_fee, revert_hash);
        (
            "Reverted".to_string(),
            amount_in_with_fee.to_string(),
            revert_hash,
        )
    };

    let swap_id = converters::generate_uuid_without_hyphens().await;
    let timestamp = ic_cdk::api::time();

    let swap_type = if verified_source_chain == verified_destination_chain {
        "Same Chain".to_string()
    } else {
        "Cross Chain".to_string()
    };

    ic_cdk::println!("[FINAL] Returning swap response with status '{}'", status);

    let swap_response = SwapResponse {
        swap_id: swap_id.to_lowercase(),
        pool_id: args.pool_id,
        tick_in_wallet_address: format_address(&args.tick_in_wallet_address, &verified_source_chain),
        tick_out_wallet_address: format_address(&args.tick_out_wallet_address, &verified_destination_chain),
        swap_type,
        source_chain: verified_source_chain.clone(),
        destination_chain: verified_destination_chain.clone(),
        token_in_address: format_address(&verified_token_in_address, &token_in.token_chain),
        token_out_address: format_address(&verified_token_out_address, &token_out.token_chain),
        amount_in: args.amount_in,
        amount_out: actual_amount_out,
        slippage: args.slippage,
        tx_hash_in: format_address(&tx_hash_in, &verified_source_chain),
        tx_hash_out: format_address(&tx_hash_out, if status.starts_with("Reverted") { &verified_source_chain } else { &verified_destination_chain }),
        status,
        timestamp,
    };

    storage::add_swap_to_history(swap_response.clone());

    Ok(swap_response)
}

fn update_pool_balances_after_swap(
    pool_id: &str,
    current_token_a_balance: &str,
    current_token_b_balance: &str,
    is_token_in_a: bool,
    amount_in_with_fee: Decimal,
    amount_out: Decimal,
) -> Result<(), String> {
    let token_a_balance = Decimal::from_str(current_token_a_balance)
        .map_err(|_| format!("Invalid token A balance: {}", current_token_a_balance))?;
    let token_b_balance = Decimal::from_str(current_token_b_balance)
        .map_err(|_| format!("Invalid token B balance: {}", current_token_b_balance))?;

    let (new_token_a_balance, new_token_b_balance) = if is_token_in_a {
        (token_a_balance + amount_in_with_fee, token_b_balance - amount_out)
    } else {
        (token_a_balance - amount_out, token_b_balance + amount_in_with_fee)
    };

    ic_cdk::println!(
        "[DEBUG] Updating pool {} balances (with 1% platform fee): Token A: {} -> {}, Token B: {} -> {}",
        pool_id,
        token_a_balance,
        new_token_a_balance,
        token_b_balance,
        new_token_b_balance
    );

    storage::update_pool_balances(
        pool_id,
        new_token_a_balance.to_string(),
        new_token_b_balance.to_string(),
    ).map(|_| ())
}

fn format_address(address: &str, chain: &str) -> String {
    if chain == "Solana" {
        address.to_string()
    } else {
        address.to_lowercase()
    }
}

async fn transfer_token_in_to_canister(token: &crate::types::token::Token, chain: &str, from: Principal, amount: Decimal) -> Result<String, String> {
    ic_cdk::println!(
        "[DEBUG] Inside transfer_token_in_to_canister for chain '{}' with amount '{}'",
        chain, amount
    );

    match chain {
        "ICP" => {
            let amount_f64 = amount.to_f64().ok_or("Failed to convert amount")?;
            ic_cdk::println!("Handling ICP transfer");
            icp_transaction_service::transfer_from_user_icp(token, from, amount_f64).await
        }
        "Base" => {
            ic_cdk::println!("Base transactions should be initiated by user first");
            Err("Base transactions should be initiated by user first".to_string())
        }
        "Solana" => {
            ic_cdk::println!("Solana transactions should be initiated by user first");
            Err("Solana transactions should be initiated by user first".to_string())
        }
        "Binance Smart Chain" => {
            ic_cdk::println!("BSC transactions should be initiated by user first");
            Err("BSC transactions should be initiated by user first".to_string())
        }
        _ => {
            ic_cdk::println!("Unsupported source chain: {}", chain);
            Err(format!("Unsupported source chain: {}", chain))
        }
    }
}

async fn send_token_out_to_user(token: &crate::types::token::Token, chain: &str, token_address: &str, to_address: &str, amount: Decimal) -> Result<String, String> {
    ic_cdk::println!(
        "[DEBUG] Sending token to user on chain '{}' to address '{}' with amount '{}'",
        chain, to_address, amount
    );

    match chain {
        "ICP" => {
            let to_principal = Principal::from_text(to_address)
                .map_err(|e| format!("Invalid ICP address: {}", e))?;
            let amount_f64 = amount.to_f64().ok_or("Failed to convert amount")?;
            ic_cdk::println!("Sending ICP token");
            icp_transaction_service::transfer_to_user_icp(token, to_principal, amount_f64).await
        }
        "Base" => {
            let to_addr = Address::from_str(to_address)
                .map_err(|e| format!("Invalid Base address: {}", e))?;
            let amount_u256 = converters::decimal_to_u256(amount, token.token_decimals)?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_ETH_BASE) {
                ic_cdk::println!("Sending native ETH on Base");
                base_transaction_service::send_base_native_eth(to_addr, amount_u256).await
            } else {
                let token_contract = Address::from_str(token_address)
                    .map_err(|e| format!("Invalid token contract address: {}", e))?;
                ic_cdk::println!("Sending ERC20 token on Base");
                base_transaction_service::send_base_erc20_token(token_contract, to_addr, amount_u256).await
            }
        }
        "Solana" => {
            let amount_u64 = (amount * Decimal::from(10u64.pow(token.token_decimals as u32)))
                .to_u64()
                .ok_or("Amount too large for Solana")?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_SOL_SOLANA) {
                ic_cdk::println!("Sending native SOL on Solana");
                solana_transaction_service::send_solana_native_sol(to_address, amount_u64).await
            } else {
                ic_cdk::println!("Sending SPL token on Solana with mint address: {}", token_address);
                solana_transaction_service::send_spl_token(to_address, token_address, amount_u64).await
            }
        }
        "Binance Smart Chain" => {
            let to_addr = Address::from_str(to_address)
                .map_err(|e| format!("Invalid BSC address: {}", e))?;
            let amount_u256 = converters::decimal_to_u256(amount, token.token_decimals)?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_BNB_BSC) {
                ic_cdk::println!("Sending native BNB on BSC");
                bsc_transaction_service::send_bsc_native_bnb(to_addr, amount_u256).await
            } else {
                let token_contract = Address::from_str(token_address)
                    .map_err(|e| format!("Invalid BEP20 token contract address: {}", e))?;
                ic_cdk::println!("Sending BEP20 token on BSC with contract: {}", token_address);
                bsc_transaction_service::send_bsc_erc20_token(token_contract, to_addr, amount_u256).await
            }
        }
        _ => {
            ic_cdk::println!("Unsupported destination chain for sending tokens: {}", chain);
            Err(format!("Unsupported destination chain: {}", chain))
        }
    }
}

async fn revert_swap(token: &crate::types::token::Token, chain: &str, token_address: &str, to_address: &str, amount: Decimal) -> Result<String, String> {
    ic_cdk::println!(
        "[DEBUG] Starting revert swap on chain '{}' to address '{}' with amount '{}'",
        chain, to_address, amount
    );

    match chain {
        "ICP" => {
            let to_principal = Principal::from_text(to_address)
                .map_err(|e| format!("Invalid ICP address for revert: {}", e))?;
            let amount_f64 = amount.to_f64().ok_or("Failed to convert amount for revert")?;
            ic_cdk::println!("Reverting ICP transfer");
            icp_transaction_service::transfer_to_user_icp(token, to_principal, amount_f64).await
        }
        "Base" => {
            let to_addr = Address::from_str(to_address)
                .map_err(|e| format!("Invalid Base address for revert: {}", e))?;
            let amount_u256 = converters::decimal_to_u256(amount, token.token_decimals)?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_ETH_BASE) {
                ic_cdk::println!("Reverting native ETH on Base");
                base_transaction_service::send_base_native_eth(to_addr, amount_u256).await
            } else {
                let token_contract = Address::from_str(token_address)
                    .map_err(|e| format!("Invalid token contract address: {}", e))?;
                ic_cdk::println!("Reverting ERC20 token on Base");
                base_transaction_service::send_base_erc20_token(token_contract, to_addr, amount_u256).await
            }
        }
        "Solana" => {
            let amount_u64 = (amount * Decimal::from(10u64.pow(token.token_decimals as u32)))
                .to_u64()
                .ok_or("Amount too large for Solana")?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_SOL_SOLANA) {
                ic_cdk::println!("Reverting native SOL on Solana");
                solana_transaction_service::send_solana_native_sol(to_address, amount_u64).await
            } else {
                ic_cdk::println!("Reverting SPL token on Solana with mint: {}", token_address);
                solana_transaction_service::send_spl_token(to_address, token_address, amount_u64).await
            }
        }
        "Binance Smart Chain" => {
            let to_addr = Address::from_str(to_address)
                .map_err(|e| format!("Invalid BSC address for revert: {}", e))?;
            let amount_u256 = converters::decimal_to_u256(amount, token.token_decimals)?;
            
            if token_address.eq_ignore_ascii_case(NATIVE_BNB_BSC) {
                ic_cdk::println!("Reverting native BNB on BSC");
                bsc_transaction_service::send_bsc_native_bnb(to_addr, amount_u256).await
            } else {
                let token_contract = Address::from_str(token_address)
                    .map_err(|e| format!("Invalid BEP20 token contract address for revert: {}", e))?;
                ic_cdk::println!("Reverting BEP20 token on BSC with contract: {}", token_address);
                bsc_transaction_service::send_bsc_erc20_token(token_contract, to_addr, amount_u256).await
            }
        }
        _ => {
            ic_cdk::println!("Unsupported chain for revert swap: {}", chain);
            Err(format!("Unsupported chain for revert: {}", chain))
        }
    }
}