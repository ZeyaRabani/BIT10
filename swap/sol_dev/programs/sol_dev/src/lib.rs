#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use std::str::FromStr;

use anchor_spl::token::{self, TransferChecked, Token, TokenAccount, Mint};
use anchor_spl::associated_token::get_associated_token_address;
use switchboard_v2::AggregatorAccountData;

declare_id!("DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s");

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(init, payer = user, space = 8 + std::mem::size_of::<SwapResult>())]
    pub swap_result: Account<'info, SwapResult>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        constraint = recipient.key() == Pubkey::from_str("Cq6JPmEspG6oNcUC47WHuEJWU1K4knsLzHYHSfvpnDHk").unwrap()
    )]
    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub smart_contract_pda: AccountInfo<'info>,

    #[account(mut)]
    pub smart_contract_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,

    #[account(address = Pubkey::from_str("5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K").unwrap())]
    pub mint: Account<'info, Mint>,

    #[account(
        constraint = sol_price_feed.key() == Pubkey::from_str("5mXfTYitRFsWPhdJfp2fc8N6hK8cw6NB5jAYpronQasj").unwrap()
    )]
    pub sol_price_feed: AccountInfo<'info>,

    #[account(
        constraint = bit10_price_feed.key() == Pubkey::from_str("6C3drEiqfj27pSXREsXLHgg294gn9EeJT6XwiNqxsxEi").unwrap()
    )]
    pub bit10_price_feed: AccountInfo<'info>,
}

#[account]
pub struct SwapArgs {
    tick_in_name: String,
    tick_out_name: String,
    tick_out_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum SwapResponse {
    Ok(SwapResult),
    Err(String),
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input parameters")]
    InvalidInput,
    #[msg("Output amount must be greater than 0")]
    InvalidAmount,
    #[msg("Incorrect input token")]
    InvalidInputToken,
    #[msg("Incorrect output token")]
    InvalidOutputToken,
    #[msg("Invalid PDA seeds")]
    InvalidSeeds,
}

#[account]
pub struct SwapResult {
    user_address: String,
    tick_in_name: String,
    tick_in_amount: f64,
    tick_in_usd_amount: f64,
    tick_out_name: String,
    tick_out_amount: u64,
    transaction_type: String,
    transaction_timestamp: String,
    network: String,
}

#[program]
pub mod sol_dev {
    use super::*;

    pub fn swap(ctx: Context<Swap>, args: SwapArgs) -> Result<()> {
        msg!("Starting swap operation");

        let valid_tick_in_tokens = ["SOL"];
        if !valid_tick_in_tokens.contains(&args.tick_in_name.as_str()) {
            msg!("Error: Invalid input token: {}", args.tick_in_name);
            return Err(ErrorCode::InvalidInputToken.into());
        }
    
        let valid_tick_out_tokens = ["Test BIT10.DEFI"];
        if !valid_tick_out_tokens.contains(&args.tick_out_name.as_str()) {
            msg!("Error: Invalid output token: {}", args.tick_out_name);
            return Err(ErrorCode::InvalidOutputToken.into());
        }
    
        if args.tick_in_name.is_empty() || args.tick_out_name.is_empty() {
            msg!("Error: Missing input or output token name");
            return Err(ErrorCode::InvalidInput.into());
        }
    
        if args.tick_out_amount == 0 {
            msg!("Error: Output amount cannot be zero");
            return Err(ErrorCode::InvalidAmount.into());
        }

        let sol_price_feed = AggregatorAccountData::new(ctx.accounts.sol_price_feed)
            .map_err(|_| error!(ErrorCode::InvalidInput))?;
        let sol_value = sol_price_feed
            .get_result()
            .map_err(|_| error!(ErrorCode::InvalidInput))?
            .value as f64;

        let bit10_price_feed = AggregatorAccountData::new(ctx.accounts.bit10_price_feed)
            .map_err(|_| error!(ErrorCode::InvalidInput))?;
        let bit10_value = bit10_price_feed
            .get_result()
            .map_err(|_| error!(ErrorCode::InvalidInput))?
            .value as f64;

        msg!("SOL price: {}", sol_value);
        msg!("BIT10 price: {}", bit10_value);

        let selected_amount: f64 = (bit10_value * args.tick_out_amount as f64) / sol_value * 1.03;
        let selected_amount_fixed: u64 = (selected_amount * 100_000_000.0).round() as u64;
        let selected_amount_usd: f64 = (bit10_value * args.tick_out_amount as f64) * 1.03;
        
        msg!("Selected amount: {}", selected_amount_fixed);
        
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                },
            ),
            selected_amount_fixed,
        )?;
    
        let seeds: &[&[u8]] = &[b"smart_contract_seed"];
        let (pda, bump) = Pubkey::find_program_address(seeds, ctx.program_id);
    
        require_keys_eq!(
            ctx.accounts.smart_contract_pda.key(),
            pda,
            ErrorCode::InvalidSeeds
        );

        msg!("Smart Contract PDA: {}", ctx.accounts.smart_contract_pda.key());
    
        let signer_seeds: [&[u8]; 2] = [b"smart_contract_seed", &[bump]];
        let signer_seeds_arr: &[&[&[u8]]] = &[&signer_seeds];
    
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.smart_contract_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.smart_contract_pda.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
        };
    
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds_arr,
        );
    
        let tick_out_amount_fixed = args.tick_out_amount.checked_mul(1_000_000_000)
            .ok_or(ErrorCode::InvalidAmount)?;
        token::transfer_checked(cpi_context, tick_out_amount_fixed, 9)?;
    
        let clock = Clock::get()?;
        let swap_result = &mut ctx.accounts.swap_result;
        swap_result.user_address = ctx.accounts.user.key().to_string();
        swap_result.tick_in_name = args.tick_in_name;
        swap_result.tick_in_amount = selected_amount;
        swap_result.tick_in_usd_amount = selected_amount_usd;
        swap_result.tick_out_name = args.tick_out_name;
        swap_result.tick_out_amount = args.tick_out_amount;
        swap_result.network = "Solana Devnet".to_string();
        swap_result.transaction_type = "Swap".to_string();
        swap_result.transaction_timestamp = clock.unix_timestamp.to_string();
    
        msg!("Swap operation completed successfully");
        Ok(())
    }
}
