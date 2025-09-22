mod ecdsa;
mod base_wallet;
mod state;
mod utils;

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use ic_cdk::api::management_canister::http_request::{
    HttpHeader, HttpResponse, TransformArgs, CanisterHttpRequestArgument, HttpMethod, 
    TransformContext, http_request
};
use ic_cdk::{init, post_upgrade, query, update, pre_upgrade};
use ic_stable_structures::memory_manager::{MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use ic_cdk::api::management_canister::main::raw_rand;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_eips::eip2718::Encodable2718;
use alloy_primitives::{hex, Address, Signature, U256};
use alloy_sol_types::{sol, SolCall};
use ciborium::from_reader;
use num::ToPrimitive;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use num_traits::FromPrimitive;
use serde::Deserialize as SerdeDeserialize;
use std::str::FromStr;
use std::cell::RefCell;
use std::collections::HashMap;
use serde_json::Value;

use crate::base_wallet::BaseWallet;
use crate::state::{init_state, read_state, mutate_state, InitArg, BaseNetwork, EcdsaKeyName};
use crate::utils::{
    http::{make_http_request, call_rpc_with_retry},
    tokens::{get_token_price_from_feed, get_bit10_token_price},
    transactions::{
        get_transaction_by_hash_base, get_transaction_receipt_base,
        decode_base_transaction_data, send_bit10_token_to_user_base, revert_transaction_base,
        extract_erc20_amount_from_transaction_input, decode_erc20_recipient_address,
        u256_to_decimal_string,
        sign_and_send_base_transaction, get_transaction_count_base, get_dynamic_fees_base,
        send_erc20_token_from_canister_base, send_native_eth_from_canister_base, call_rpc_with_retry_base,
    },
    constants::{PLATFORM_WALLET_PRINCIPAL_ID, PRICE_FEED_CANISTER_ID, TATUM_API_KEY},
};


thread_local! {
    static BUY_HISTORY: RefCell<Vec<SwapResponseData>> = RefCell::new(Vec::new());
    static SELL_HISTORY: RefCell<Vec<SwapResponseData>> = RefCell::new(Vec::new());
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    static CACHED_BASE_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static TOKEN_DATA: RefCell<HashMap<String, (String, Vec<(String, String, String, String)>)>> = RefCell::new({
        let mut token_data = HashMap::new();
        
        token_data.insert(
            "BIT10.DEFI".to_string(),
            (
                "41.77825388".to_string(),
                vec![
                    (
                        "ICP".to_string(),
                        "bin4j-cyaaa-aaaap-qh7tq-cai".to_string(),
                        "34".to_string(),
                        "14.01375000".to_string(),
                    ),
                ],
            ),
        );
        
        token_data.insert(
            "BIT10.TOP".to_string(),
            (
                "90.21844660".to_string(),
                vec![
                    (
                        "ICP".to_string(),
                        "g37b3-lqaaa-aaaap-qp4hq-cai".to_string(),
                        "15".to_string(),
                        "7.57500000".to_string(),
                    ),
                    (
                        "Base".to_string(),
                        "0xc909eb26f417e24033497b1eca64a0f301d0a76f".to_string(),
                        "0".to_string(),
                        "0".to_string(),
                    ),
                ],
            ),
        );
        
        token_data
    });
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Token {
    pub token_id: Option<String>,
    pub token_name: String,
    pub token_symbol: String,
    pub token_address: Option<String>,
    pub token_chain: String,
    pub token_decimals: u8,
    pub is_native: bool,
    pub is_active: bool,
    pub price_feed_id: Option<String>,
    pub price_feed_link: Option<String>,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TokenAllocation {
    pub chain: String,
    pub token_address: String,
    pub total_chain_supply: String,
    pub total_tokens_bought: String,
    pub total_tokens_sold: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TokenDetails {
    pub name: String,
    pub symbol: String,
    pub total_supply: String,
    pub allocations: Vec<TokenAllocation>,
}

#[derive(CandidType, Deserialize)]
pub struct BIT10TokenResponse {
    pub tokens: HashMap<String, TokenDetails>,
}

#[derive(CandidType, Deserialize)]
pub struct ICPBuyArgs {
    pub token_in_address: String,
    pub token_out_address: String,
    pub token_out_amount: String,
}

#[derive(candid::CandidType, serde::Serialize)]
pub enum SwapResponse {
    Ok(SwapResponseData),
    Err(String),
}

#[derive(candid::CandidType, serde::Deserialize, serde::Serialize, Clone)]
pub struct SwapResponseData {
    pub swap_id: String,
    pub user_wallet_address: String,
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_in_usd_amount: String,
    pub token_in_tx_hash: String,
    pub token_out_address: String,
    pub token_out_amount: String,
    pub token_out_tx_hash: String,
    pub transaction_type: String,
    pub transaction_timestamp: String,
    pub network: String,
}

#[derive(CandidType, Deserialize)]
pub struct ICPSellArgs {
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_out_address: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct SwapArgs {
    pub user_wallet_address: String,
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_out_address: String,
    pub token_out_amount: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionResponse {
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let buy_history = BUY_HISTORY.with(|h| h.borrow().clone());
    let sell_history = SELL_HISTORY.with(|h| h.borrow().clone());
    let base_addr = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    let token_data = TOKEN_DATA.with(|data| data.borrow().clone());

    ic_cdk::storage::stable_save((base_addr, buy_history, sell_history, token_data))
        .expect("Failed to save data to stable storage");
}

#[post_upgrade]
fn post_upgrade_hook(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }

    if let Ok((base_addr, buy_history, sell_history, token_data)) =
        ic_cdk::storage::stable_restore::<(
            Option<String>,
            Vec<SwapResponseData>,
            Vec<SwapResponseData>,
            HashMap<String, (String, Vec<(String, String, String, String)>)>,
        )>()
    {
        CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = base_addr);
        BUY_HISTORY.with(|h| *h.borrow_mut() = buy_history);
        SELL_HISTORY.with(|h| *h.borrow_mut() = sell_history);
        TOKEN_DATA.with(|data| *data.borrow_mut() = token_data);
    }
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }
}

fn get_supported_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: Some("8916".to_string()),
            token_name: "ICP".to_string(),
            token_symbol: "ICP".to_string(),
            token_address: Some("ryjl3-tyaaa-aaaaa-aaaba-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: true,
            is_active: true,
            price_feed_id: Some("shzdvhfbjdjfk".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("28909".to_string()),
            token_name: "ckBTC".to_string(),
            token_symbol: "ckBTC".to_string(),
            token_address: Some("mxzaz-hqaaa-aaaar-qaada-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("sjhbdhjbgf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("28910".to_string()),
            token_name: "ckETH".to_string(),
            token_symbol: "ckETH".to_string(),
            token_address: Some("ss2fx-dyaaa-aaaar-qacoq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: Some("khsdbhfbdf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: Some("1027".to_string()),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000e".to_string()), // Placeholder for native ETH on Base
            token_chain: "Base".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: Some("shdvhdbfhjbdlfjgf".to_string()),
            price_feed_link: None,
        },
    ]
}

fn get_supported_bit10_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: None,
            token_name: "BIT10.DEFI".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("bin4j-cyaaa-aaaap-qh7tq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: Some("shdvhdbfhjbdlfjgf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("g37b3-lqaaa-aaaap-qp4hq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: false,
            is_active: true,
            price_feed_id: Some("shdvhdbfhjbdlfjgf".to_string()),
            price_feed_link: None,
        },
        Token {
            token_id: None,
            token_name: "BIT10.TOP".to_string(),
            token_symbol: "B10".to_string(),
            token_address: Some("0xc909eb26f417e24033497b1eca64a0f301d0a76f".to_string()),
            token_chain: "Base".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: Some("shdvhdbfhjbdlfjgf".to_string()),
            price_feed_link: None,
        },
    ]
}

fn get_token_data() -> HashMap<String, (String, Vec<(String, String, String, String)>)> {
    TOKEN_DATA.with(|data| data.borrow().clone())
}

fn update_bit10_token_bought(token_name: &str, token_address: &str, amount_to_add: &str) {
    TOKEN_DATA.with(|data| {
        let mut token_data = data.borrow_mut();

        if let Some((_total_supply, allocations)) = token_data.get_mut(token_name) {
            for (_chain, address, total_bought, _total_sold) in allocations.iter_mut() {
                if address.eq_ignore_ascii_case(token_address) {
                    let current_bought: Result<Decimal, _> = total_bought.parse();
                    let amount_decimal: Result<Decimal, _> = amount_to_add.parse();

                    if let (Ok(current), Ok(addition)) = (current_bought, amount_decimal) {
                        let new_total = current + addition;
                        *total_bought = format!("{:.8}", new_total);
                    } else {
                        ic_cdk::println!(
                            "Failed to parse amounts for {}: current={}, addition={}",
                            token_name,
                            total_bought,
                            amount_to_add
                        );
                    }
                    break;
                }
            }
        }
    });
}

fn update_bit10_token_sold(token_name: &str, token_address: &str, amount_to_add: &str) {
    TOKEN_DATA.with(|data| {
        let mut token_data = data.borrow_mut();

        if let Some((_total_supply, allocations)) = token_data.get_mut(token_name) {
            for (_chain, address, _total_bought, total_sold) in allocations.iter_mut() {
                if address.eq_ignore_ascii_case(token_address) {
                    let current_sold: Result<Decimal, _> = total_sold.parse();
                    let amount_decimal: Result<Decimal, _> = amount_to_add.parse();

                    if let (Ok(current), Ok(addition)) = (current_sold, amount_decimal) {
                        let new_total = current + addition;
                        *total_sold = format!("{:.8}", new_total);
                    } else {
                        ic_cdk::println!(
                            "Failed to parse amounts for {}: current={}, addition={}",
                            token_name,
                            total_sold,
                            amount_to_add
                        );
                    }
                    break;
                }
            }
        }
    });
}

fn calculate_chain_allocation(total_supply: &str, allocation_percentage: f64) -> String {
    if let Ok(supply) = total_supply.parse::<f64>() {
        let chain_supply = supply * allocation_percentage / 100.0;
        format!("{:.8}", chain_supply)
    } else {
        "0".to_string()
    }
}

fn validate_token_address(token_address: &str, expected_network: &str) -> bool {
    let supported_tokens = get_supported_bit10_tokens();
    for token in supported_tokens {
        if let Some(address) = &token.token_address {
            if address.eq_ignore_ascii_case(token_address) &&
               token.token_chain.eq_ignore_ascii_case(expected_network) {
                return true;
            }
        }
    }
    false
}

#[query]
pub fn bit10_token() -> BIT10TokenResponse {
    let supported_tokens = get_supported_bit10_tokens();
    let token_data = get_token_data();
    let mut tokens = HashMap::new();

    let mut unique_tokens = HashMap::new();
    for token in supported_tokens {
        unique_tokens.insert(
            token.token_name.clone(),
            (token.token_symbol.clone(), token.token_name.clone()),
        );
    }

    for (token_name, (symbol, name)) in unique_tokens {
        if let Some((total_supply, chain_data)) = token_data.get(&token_name) {
            let mut allocations = Vec::new();
            let chain_count = chain_data.len() as f64;
            let allocation_per_chain = if chain_count > 0.0 {
                100.0 / chain_count
            } else {
                0.0
            };

            for (chain, token_address, total_bought, total_sold) in chain_data {
                let total_chain_supply =
                    calculate_chain_allocation(total_supply, allocation_per_chain);

                allocations.push(TokenAllocation {
                    chain: chain.clone(),
                    token_address: token_address.clone(),
                    total_chain_supply,
                    total_tokens_bought: total_bought.clone(),
                    total_tokens_sold: total_sold.clone(),
                });
            }

            tokens.insert(
                token_name.clone(),
                TokenDetails {
                    name: name.clone(),
                    symbol: symbol.clone(),
                    total_supply: total_supply.clone(),
                    allocations,
                },
            );
        }
    }

    BIT10TokenResponse { tokens }
}

#[update]
pub async fn base_address() -> String {
    let cached = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let canister_id = ic_cdk::id();
    let wallet = BaseWallet::new_canister_wallet().await;
    let address = wallet.base_address().to_string();

    CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

#[query]
fn get_buy_history() -> Vec<SwapResponseData> {
    BUY_HISTORY.with(|h| h.borrow().clone())
}

#[query]
fn get_sell_history() -> Vec<SwapResponseData> {
    SELL_HISTORY.with(|h| h.borrow().clone())
}

async fn generate_uuid_without_hyphens() -> String {
    let (bytes,): (Vec<u8>,) = raw_rand().await.expect("raw_rand failed");
    let mut id = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        id.push_str(&format!("{:02x}", b));
    }
    id
}

trait ParseDecimal {
    fn parse_decimal(&self) -> Result<Decimal, String>;
}

impl ParseDecimal for &str {
    fn parse_decimal(&self) -> Result<Decimal, String> {
        Decimal::from_str(self).map_err(|_| format!("Failed to parse decimal: {}", self))
    }
}

#[update]
pub async fn icp_buy(args: ICPBuyArgs) -> SwapResponse {
    let caller: Principal = ic_cdk::caller();

    let user_wallet_address = caller.to_text().to_lowercase();

    let token_out_amount_decimal = match args.token_out_amount.parse_decimal() {
        Ok(d) => d,
        Err(e) => return SwapResponse::Err(e),
    };

    if token_out_amount_decimal <= Decimal::ZERO {
        return SwapResponse::Err("token_out_amount must be greater than 0".to_string());
    }

    let supported_tokens = get_supported_tokens();
    let supported_bit10_tokens = get_supported_bit10_tokens();

    let token_in = supported_tokens.iter().chain(supported_bit10_tokens.iter()).find(|token| {
        token.token_address
            .as_ref()
            .map(|addr| addr.eq_ignore_ascii_case(&args.token_in_address))
            .unwrap_or(false)
    });

    let token_in = match token_in {
        Some(t) => t,
        None => return SwapResponse::Err(format!(
            "Token in address {} is not a supported token address",
            args.token_in_address
        )),
    };

    let token_out = supported_bit10_tokens.iter().find(|token| {
        token.token_address
            .as_ref()
            .map(|addr| addr.eq_ignore_ascii_case(&args.token_out_address))
            .unwrap_or(false) &&
        token.token_chain.eq_ignore_ascii_case("icp")
    });

    let token_out = match token_out {
        Some(t) => t,
        None => return SwapResponse::Err(format!(
            "Token out address {} is not a valid ICP BIT10 token address",
            args.token_out_address
        )),
    };

    if token_in.token_chain.eq_ignore_ascii_case("icp") != token_out.token_chain.eq_ignore_ascii_case("icp") {
        return SwapResponse::Err(format!(
            "Token in ({}) and token out ({}) must be on the same chain (ICP for this function)",
            token_in.token_chain, token_out.token_chain
        ));
    }

    let bit10_tokens_info = bit10_token();
    let token_name = &token_out.token_name;

    let mut token_in_price = 0.0;
    let mut token_out_price = 0.0;
    let mut token_in_amount_for_swap = Decimal::ZERO;
    let mut token_in_tx_hash = "0".to_string();

    let token_details = match bit10_tokens_info.tokens.get(token_name) {
        Some(td) => td,
        None => return SwapResponse::Err(format!(
            "Token {} not found in BIT10 token information",
            token_name
        )),
    };

    let matching_allocation = token_details.allocations.iter().find(|allocation| {
        allocation.chain.eq_ignore_ascii_case(&token_out.token_chain) &&
        allocation.token_address.eq_ignore_ascii_case(&args.token_out_address)
    });

    let allocation = match matching_allocation {
        Some(alloc) => alloc,
        None => return SwapResponse::Err(format!(
            "No matching allocation found for token {} on chain {}",
            token_name, token_out.token_chain
        )),
    };

    let total_chain_supply = match allocation.total_chain_supply.parse_decimal() {
        Ok(d) => d,
        Err(e) => return SwapResponse::Err(format!("Failed to parse total_chain_supply: {}", e)),
    };

    let total_tokens_bought = match allocation.total_tokens_bought.parse_decimal() {
        Ok(d) => d,
        Err(e) => return SwapResponse::Err(format!("Failed to parse total_tokens_bought: {}", e)),
    };

    let total_tokens_sold = match allocation.total_tokens_sold.parse_decimal() {
        Ok(d) => d,
        Err(e) => return SwapResponse::Err(format!("Failed to parse total_tokens_sold: {}", e)),
    };

    let available_tokens = total_chain_supply - total_tokens_bought + total_tokens_sold;

    if token_out_amount_decimal > available_tokens {
        return SwapResponse::Err(format!(
            "Requested amount {} exceeds available supply. Available: {}",
            args.token_out_amount, available_tokens
        ));
    }

    token_in_price = match get_token_price_from_feed(token_in).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_in price: {}", e)),
    };

    token_out_price = match get_bit10_token_price(token_out).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_out price: {}", e)),
    };

    if token_in_price <= 0.0 {
        return SwapResponse::Err(format!("Invalid or unavailable price for token_in: {}", token_in.token_symbol));
    }

    if token_out_price <= 0.0 {
        return SwapResponse::Err(format!("Invalid or unavailable price for token_out: {}", token_out.token_symbol));
    }

    let token_ratio = Decimal::from_f64(token_out_price / token_in_price)
        .ok_or_else(|| "Failed to convert token ratio to decimal".to_string())
        .unwrap(); // Should not fail if prices are valid f64
    let token_in_amount_for_one_token_out = token_ratio * dec!(1.01); // 1% fee

    token_in_amount_for_swap = token_in_amount_for_one_token_out * token_out_amount_decimal;

    if token_in_amount_for_swap <= Decimal::ZERO {
        return SwapResponse::Err("Calculated token_in_amount must be greater than 0".to_string());
    }

    let decimals = token_in.token_decimals;
    let multiplier = Decimal::from(10u128.pow(decimals as u32));
    let token_in_amount_scaled = (token_in_amount_for_swap * multiplier).floor();
    let token_in_amount_nat = Nat::from(token_in_amount_scaled.to_string());

    let to_account = Account {
        owner: Principal::from_slice(PLATFORM_WALLET_PRINCIPAL_ID),
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to: to_account,
        spender_subaccount: None,
        amount: token_in_amount_nat.clone(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let token_in_ledger_id = match token_in.token_address.as_ref() {
        Some(address) => address.clone(),
        None => return SwapResponse::Err("Token in ledger ID not available".to_string()),
    };

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<Nat, TransferFromError>,)>(
        Principal::from_text(token_in_ledger_id).expect("Could not decode the ledger principal."),
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => {
            token_in_tx_hash = block_index.0.to_string();
        },
        Ok((Err(e),)) => {
            return SwapResponse::Err(format!("Transfer of token_in failed: {:?}", e));
        },
        Err(e) => {
            return SwapResponse::Err(format!("Call to token_in ledger failed: {:?}", e));
        },
    }

    let token_out_decimals = token_out.token_decimals;
    let multiplier = Decimal::from(10u128.pow(token_out_decimals as u32));
    let token_out_amount_scaled = (token_out_amount_decimal * multiplier).floor();
    let token_out_amount_nat = Nat::from(token_out_amount_scaled.to_string());

    let token_out_ledger_principal = match &token_out.token_address {
        Some(addr) => Principal::from_text(addr.clone()).expect("Invalid ledger principal"),
        None => return SwapResponse::Err("Token out ledger address not found".to_string()),
    };

    let token_out_transfer_args = TransferArg {
        memo: None,
        amount: token_out_amount_nat,
        from_subaccount: None,
        fee: None,
        to: Account {
            owner: caller,
            subaccount: None,
        },
        created_at_time: None,
    };

    let token_out_transfer_result = ic_cdk::call::<(TransferArg,), (Result<Nat, TransferError>,)>(
        token_out_ledger_principal,
        "icrc1_transfer",
        (token_out_transfer_args,),
    )
    .await;

    let token_out_tx_hash = match token_out_transfer_result {
        Ok((Ok(block_index),)) => block_index.0.to_string(),
        Ok((Err(e),)) => {
            return SwapResponse::Err(format!("Transfer of token_out failed: {:?}", e));
        },
        Err(e) => {
            return SwapResponse::Err(format!("Call to token_out ledger failed: {:?}", e));
        },
    };

    update_bit10_token_bought(
        &token_out.token_name,
        &args.token_out_address,
        &args.token_out_amount,
    );

    let swap_id = generate_uuid_without_hyphens().await;

    let token_in_usd_amount = if token_out_price > 0.0 {
        let usd_value = token_out_price * token_out_amount_decimal.to_f64().unwrap_or(0.0) * 1.01;
        if usd_value <= 0.0 {
            return SwapResponse::Err("Calculated token_in_usd_amount must be greater than 0".to_string());
        }
        format!("{:.18}", usd_value)
    } else {
        return SwapResponse::Err("Invalid token_out_price for USD amount calculation".to_string());
    };

    let final_token_in_amount = format!("{:.18}", token_in_amount_for_swap);
    
    if final_token_in_amount.parse_decimal().unwrap_or(Decimal::ZERO) <= Decimal::ZERO ||
       token_in_usd_amount.parse_decimal().unwrap_or(Decimal::ZERO) <= Decimal::ZERO ||
       token_out_amount_decimal <= Decimal::ZERO {
        return SwapResponse::Err("Final amounts validation failed (values are zero or less)".to_string());
    }

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: user_wallet_address.to_lowercase(),
        token_in_address: args.token_in_address.to_lowercase(),
        token_in_amount: final_token_in_amount,
        token_in_usd_amount: token_in_usd_amount,
        token_in_tx_hash: token_in_tx_hash.to_string(),
        token_out_address: args.token_out_address.to_lowercase(),
        token_out_amount: args.token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_string(),
        transaction_type: "Buy".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "icp".to_string(),
    };

    BUY_HISTORY.with(|h| h.borrow_mut().push(response_data.clone()));

    SwapResponse::Ok(response_data)
}

#[update]
pub async fn icp_sell(args: ICPSellArgs) -> SwapResponse {
    let caller: Principal = ic_cdk::caller();

    let user_wallet_address = caller.to_text().to_lowercase();

    let token_in_amount_decimal = match args.token_in_amount.parse_decimal() {
        Ok(d) => d,
        Err(e) => return SwapResponse::Err(e),
    };

    if token_in_amount_decimal <= Decimal::ZERO {
        return SwapResponse::Err("token_in_amount must be greater than 0".to_string());
    }

    let supported_bit10_tokens = get_supported_bit10_tokens();
    let token_in = supported_bit10_tokens.iter().find(|token| {
        token.token_address
            .as_ref()
            .map(|addr| addr.eq_ignore_ascii_case(&args.token_in_address))
            .unwrap_or(false) &&
        token.token_chain.eq_ignore_ascii_case("icp")
    });

    let token_in = match token_in {
        Some(t) => t,
        None => return SwapResponse::Err(format!(
            "Token in address {} is not a supported ICP BIT10 token address",
            args.token_in_address
        )),
    };

    let icp_token_address = "ryjl3-tyaaa-aaaaa-aaaba-cai";
    if !args.token_out_address.eq_ignore_ascii_case(icp_token_address) {
        return SwapResponse::Err(format!(
            "Token out address must be ICP ({})",
            icp_token_address
        ));
    }

    let supported_tokens = get_supported_tokens();
    let token_out = supported_tokens.iter().find(|token| {
        token.token_address
            .as_ref()
            .map(|addr| addr.eq_ignore_ascii_case(&args.token_out_address))
            .unwrap_or(false) &&
        token.token_chain.eq_ignore_ascii_case("icp")
    });

    let token_out = match token_out {
        Some(t) => t,
        None => return SwapResponse::Err("ICP token not found in supported tokens".to_string()),
    };

    let token_in_price = match get_bit10_token_price(token_in).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_in price: {}", e)),
    };

    let token_out_price = match get_token_price_from_feed(token_out).await {
        Ok(price) => price,
        Err(e) => return SwapResponse::Err(format!("Failed to get token_out price: {}", e)),
    };

    if token_in_price <= 0.0 {
        return SwapResponse::Err(format!("Invalid or unavailable price for token_in: {}", token_in.token_symbol));
    }

    if token_out_price <= 0.0 {
        return SwapResponse::Err(format!("Invalid or unavailable price for token_out: {}", token_out.token_symbol));
    }

    let token_in_amount_f64 = token_in_amount_decimal.to_f64()
        .ok_or_else(|| "Failed to convert token_in_amount to f64".to_string())
        .unwrap();

    let token_in_usd_value = token_in_amount_f64 * token_in_price;
    let platform_fee = token_in_usd_value * 0.01; // 1% fee
    let token_out_usd_value = token_in_usd_value - platform_fee;
    let token_out_amount_f64 = token_out_usd_value / token_out_price;

    if token_in_usd_value <= 0.0 {
        return SwapResponse::Err("Calculated token_in_usd_value must be greater than 0".to_string());
    }

    if platform_fee < 0.0 {
        return SwapResponse::Err("Calculated platform fee must not be negative".to_string());
    }

    if token_out_usd_value <= 0.0 {
        return SwapResponse::Err("Calculated token_out_usd_value must be greater than 0".to_string());
    }

    if token_out_amount_f64 <= 0.0 {
        return SwapResponse::Err("Calculated token_out_amount must be greater than 0".to_string());
    }

    let decimals = token_in.token_decimals;
    let multiplier = Decimal::from(10u128.pow(decimals as u32));
    let token_in_amount_scaled = (token_in_amount_decimal * multiplier).floor();
    let token_in_amount_nat = Nat::from(token_in_amount_scaled.to_string());

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to: Account {
            owner: ic_cdk::id(),
            subaccount: None,
        },
        spender_subaccount: None,
        amount: token_in_amount_nat.clone(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let token_in_ledger_id = match token_in.token_address.as_ref() {
        Some(address) => address.clone(),
        None => return SwapResponse::Err("Token in ledger ID not available".to_string()),
    };

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<Nat, TransferFromError>,)>(
        Principal::from_text(token_in_ledger_id).expect("Could not decode the ledger principal."),
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    let token_in_tx_hash = match transfer_result {
        Ok((Ok(block_index),)) => {
            block_index.0.to_string()
        },
        Ok((Err(e),)) => {
            return SwapResponse::Err(format!("Transfer of token_in failed: {:?}", e));
        },
        Err(e) => {
            return SwapResponse::Err(format!("Call to token_in ledger failed: {:?}", e));
        },
    };

    let token_out_decimals = token_out.token_decimals;
    let multiplier = Decimal::from(10u128.pow(token_out_decimals as u32));
    let token_out_amount_decimal = Decimal::from_f64(token_out_amount_f64)
        .ok_or_else(|| "Failed to convert token_out_amount_f64 to Decimal".to_string())
        .unwrap();
    let token_out_amount_scaled = (token_out_amount_decimal * multiplier).floor();
    let token_out_amount_nat = Nat::from(token_out_amount_scaled.to_string());

    let token_out_ledger_principal = match &token_out.token_address {
        Some(addr) => Principal::from_text(addr.clone()).expect("Invalid ledger principal"),
        None => return SwapResponse::Err("Token out ledger address not found".to_string()),
    };

    let token_out_transfer_args = TransferArg {
        memo: None,
        amount: token_out_amount_nat,
        from_subaccount: None,
        fee: None,
        to: Account {
            owner: caller,
            subaccount: None,
        },
        created_at_time: None,
    };

    let token_out_transfer_result = ic_cdk::call::<(TransferArg,), (Result<Nat, TransferError>,)>(
        token_out_ledger_principal,
        "icrc1_transfer",
        (token_out_transfer_args,),
    )
    .await;

    let token_out_tx_hash = match token_out_transfer_result {
        Ok((Ok(block_index),)) => block_index.0.to_string(),
        Ok((Err(e),)) => {
            return SwapResponse::Err(format!("Transfer of token_out failed: {:?}", e));
        },
        Err(e) => {
            return SwapResponse::Err(format!("Call to token_out ledger failed: {:?}", e));
        },
    };

    update_bit10_token_sold(
        &token_in.token_name,
        &args.token_in_address,
        &args.token_in_amount,
    );

    let swap_id = generate_uuid_without_hyphens().await;

    let final_token_in_usd_amount = format!("{:.18}", Decimal::from_f64(token_in_usd_value).unwrap_or(Decimal::ZERO));
    let final_token_out_amount = format!("{:.18}", token_out_amount_decimal);

    if args.token_in_amount.parse_decimal().unwrap_or(Decimal::ZERO) <= Decimal::ZERO ||
       final_token_in_usd_amount.parse_decimal().unwrap_or(Decimal::ZERO) <= Decimal::ZERO ||
       final_token_out_amount.parse_decimal().unwrap_or(Decimal::ZERO) <= Decimal::ZERO {
        return SwapResponse::Err("Final amounts validation failed (values are zero or less)".to_string());
    }

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: user_wallet_address.to_lowercase(),
        token_in_address: args.token_in_address.to_lowercase(),
        token_in_amount: args.token_in_amount.clone(),
        token_in_usd_amount: final_token_in_usd_amount,
        token_in_tx_hash: token_in_tx_hash.to_string(),
        token_out_address: args.token_out_address.to_lowercase(),
        token_out_amount: final_token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_string(),
        transaction_type: "Sell".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "icp".to_string(),
    };

    SELL_HISTORY.with(|h| h.borrow_mut().push(response_data.clone()));

    SwapResponse::Ok(response_data)
}


#[update]
pub async fn base_create_transaction(args: SwapArgs) -> TransactionResponse {
    let supported_tokens = get_supported_tokens();
    let supported_bit10_tokens = get_supported_bit10_tokens();

    let token_in = supported_tokens
        .iter()
        .find(|token| {
            token.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&args.token_in_address)
            }) && token.token_chain.eq_ignore_ascii_case("base")
        })
        .ok_or_else(|| {
            ic_cdk::trap(&format!(
                "Token in address '{}' not found in supported Base tokens",
                args.token_in_address
            ))
        })
        .unwrap();

    let token_out = supported_bit10_tokens
        .iter()
        .find(|token| {
            token.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&args.token_out_address)
            }) && token.token_chain.eq_ignore_ascii_case("base")
        })
        .ok_or_else(|| {
            ic_cdk::trap(&format!(
                "Token out address '{}' not found in supported Base BIT10 tokens",
                args.token_out_address
            ))
        })
        .unwrap();

    if !token_in.token_chain.eq_ignore_ascii_case("base") || !token_out.token_chain.eq_ignore_ascii_case("base") {
        ic_cdk::trap("Both tokens must be on Base chain for base_create_transaction");
    }

    let amount_decimal = match args.token_in_amount.parse_decimal() {
        Ok(amount) => amount,
        Err(e) => ic_cdk::trap(&format!("Failed to parse token_in_amount: {}", e)),
    };

    if amount_decimal <= Decimal::ZERO {
        ic_cdk::trap("token_in_amount must be greater than 0");
    }

    let amount_with_fee = amount_decimal * dec!(1.01);

    let scale_factor = Decimal::from(10u64.pow(token_in.token_decimals as u32));
    let amount_in_smallest_unit_decimal = amount_with_fee * scale_factor;
    let final_amount_u256 = match U256::from_str(&amount_in_smallest_unit_decimal.to_string()) {
        Ok(amount) => amount,
        Err(_) => ic_cdk::trap("Failed to convert amount to U256"),
    };

    let target_address = "0xc642a4dD078267674857A739D0E5E8F6f6Bf8Fb1";

    let mut data_bytes = Vec::new();

    data_bytes.extend_from_slice(args.token_out_address.as_bytes());
    data_bytes.push(0x00);
    data_bytes.extend_from_slice(args.token_out_amount.as_bytes());

    let data_hex = format!("0x{}", hex::encode(&data_bytes));

    let is_native_eth = args.token_in_address.eq_ignore_ascii_case(
        "0x0000000000000000000000000000000000000000e",
    );

    let (to_address, value, data) = if is_native_eth {
        (
            target_address.to_string(),
            format!("0x{:x}", final_amount_u256),
            data_hex,
        )
    } else {
        let IERC20::transferCall { to, amount } = IERC20::transferCall {
            to: Address::from_str(target_address).expect("Invalid target address"),
            amount: final_amount_u256,
        };

        let mut encoded = Vec::new();
        to.abi_encode(&mut encoded);
        amount.abi_encode(&mut encoded);

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
        value: value,
        data: data,
    }
}


#[update]
pub async fn base_buy(trx_hash: String) -> SwapResponse {
    if !trx_hash.starts_with("0x") || trx_hash.len() != 66 {
        return SwapResponse::Err("Invalid transaction hash format. Must be 0x-prefixed and 66 characters long.".to_string());
    }

    let transaction_hash = trx_hash.to_lowercase();
    let target_address = "0xc642a4dD078267674857A739D0E5E8F6f6Bf8Fb1".to_lowercase();

    let already_exists = BUY_HISTORY.with(|h| {
        h.borrow().iter().any(|swap| {
            swap.token_in_tx_hash.eq_ignore_ascii_case(&transaction_hash) ||
            swap.token_out_tx_hash.eq_ignore_ascii_case(&transaction_hash)
        })
    });

    if already_exists {
        return SwapResponse::Err("Transaction already processed".to_string());
    }

    let tx_data = match get_transaction_by_hash_base(&transaction_hash).await {
        Ok(tx) => tx,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get transaction data for {}: {}", transaction_hash, e));
        }
    };

    let tx_receipt = match get_transaction_receipt_base(&transaction_hash).await {
        Ok(receipt) => receipt,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get transaction receipt for {}: {}", transaction_hash, e));
        }
    };

    let tx_status = tx_receipt.get("status").and_then(|v| v.as_str()).unwrap_or("0x0");
    if tx_status != "0x1" {
        return SwapResponse::Err("Transaction was not successful (status is not 0x1)".to_string());
    }

    let tx_to_address = tx_data.get("to")
        .and_then(|v| v.as_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_else(|| String::new());

    let from_address = tx_data.get("from")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let input_data = tx_data.get("input").and_then(|v| v.as_str()).unwrap_or("0x");

    let is_valid_transaction = if tx_to_address.eq_ignore_ascii_case(&target_address) {
        true
    } else if input_data.len() >= 10 && input_data.starts_with("0xa9059cbb") {
        if let Some(recipient_from_input) = decode_erc20_recipient_address(input_data) {
            recipient_from_input.eq_ignore_ascii_case(&target_address)
        } else {
            false
        }
    } else {
        false
    };

    if !is_valid_transaction {
        return SwapResponse::Err(format!(
            "Transaction was not sent to the expected platform address ({}). Tx `to` address: {}, Input data check failed.",
            target_address, tx_to_address
        ));
    }

    let (mut token_out_address, mut token_out_amount) = match decode_base_transaction_data(&tx_data).await {
        Some((out_addr, out_amount)) => (out_addr, out_amount),
        None => {
            return SwapResponse::Err("Failed to decode token_out_address and token_out_amount from transaction input data".to_string());
        }
    };

    let supported_tokens = get_supported_tokens();
    let supported_bit10_tokens = get_supported_bit10_tokens();

    if !validate_token_address(&token_out_address, "Base") {
        return SwapResponse::Err(format!(
            "Token out address '{}' is not a supported Base BIT10 token address",
            token_out_address
        ));
    }

    let token_out = supported_bit10_tokens
        .iter()
        .find(|token| {
            token.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&token_out_address)
            }) && token.token_chain.eq_ignore_ascii_case("base")
        })
        .unwrap();

    let (token_in_address, actual_amount_received_u256) = if tx_to_address.eq_ignore_ascii_case(&target_address) {
        let value_hex = tx_data.get("value").and_then(|v| v.as_str()).unwrap_or("0x0");
        let amount = match U256::from_str_radix(value_hex.strip_prefix("0x").unwrap_or("0"), 16) {
            Ok(amount) => amount,
            Err(_) => return SwapResponse::Err("Failed to parse native ETH amount from transaction value".to_string()),
        };
        ("0x0000000000000000000000000000000000000000e".to_string(), amount)
    } else {
        let amount = match extract_erc20_amount_from_transaction_input(input_data, &target_address) {
            Ok(amount) => amount,
            Err(e) => return SwapResponse::Err(format!("Failed to extract ERC20 amount from input data: {}", e)),
        };
        (tx_to_address.clone(), amount)
    };

    let token_in = supported_tokens
        .iter()
        .find(|token| {
            token.token_address.as_deref().map_or(false, |addr| {
                addr.eq_ignore_ascii_case(&token_in_address)
            }) && token.token_chain.eq_ignore_ascii_case("base")
        })
        .ok_or_else(|| {
            return SwapResponse::Err(format!(
                "Token in address '{}' not found in supported Base tokens",
                token_in_address
            ));
        })
        .unwrap();

    let token_in_amount_actual_decimal = match u256_to_decimal_string(actual_amount_received_u256, token_in.token_decimals) {
        Ok(amount_str) => match amount_str.parse_decimal() {
            Ok(d) => d,
            Err(e) => return SwapResponse::Err(format!("Failed to parse actual token_in amount to decimal: {}", e)),
        },
        Err(e) => {
            return SwapResponse::Err(format!("Failed to convert actual token_in amount to decimal string: {}", e));
        }
    };

    if token_in_amount_actual_decimal <= Decimal::ZERO {
        return SwapResponse::Err("Actual token_in amount received must be greater than 0".to_string());
    }

    let token_in_amount_without_fee = token_in_amount_actual_decimal / dec!(1.01);

    let token_in_usd_price = match get_token_price_from_feed(token_in).await {
        Ok(price) => price,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get token_in USD price: {}", e));
        }
    };

    let token_out_usd_price = match get_bit10_token_price(token_out).await {
        Ok(price) => price,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get token_out USD price: {}", e));
        }
    };

    if token_in_usd_price <= 0.0 || token_out_usd_price <= 0.0 {
        return SwapResponse::Err("Invalid or unavailable price for one or both tokens".to_string());
    }

    let token_in_usd_amount_value = token_in_amount_without_fee * Decimal::from_f64(token_in_usd_price)
        .unwrap_or(Decimal::ZERO);

    let token_out_amount_decimal = match token_out_amount.parse_decimal() {
        Ok(amount) => amount,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to parse token_out_amount: {}", e));
        }
    };

    let token_out_usd_value = token_out_amount_decimal * Decimal::from_f64(token_out_usd_price)
        .unwrap_or(Decimal::ZERO);

    let difference_ratio = if token_in_usd_amount_value > Decimal::ZERO {
        ((token_out_usd_value - token_in_usd_amount_value).abs() / token_in_usd_amount_value) * dec!(100)
    } else {
        dec!(100)
    };

    const PRICE_DIFFERENCE_TOLERANCE_PERCENT: Decimal = dec!(3.0);
    let should_proceed = token_out_usd_value >= token_in_usd_amount_value || difference_ratio <= PRICE_DIFFERENCE_TOLERANCE_PERCENT;

    let (transaction_type, mut token_out_tx_hash) = if should_proceed {
        match send_bit10_token_to_user_base(token_out, &from_address, &token_out_amount).await {
            Ok(tx_hash) => {
                update_bit10_token_bought(&token_out.token_name, &token_out_address, &token_out_amount);
                ("Buy".to_string(), tx_hash)
            },
            Err(e) => {
                ic_cdk::println!("Failed to send BIT10 token to user after successful payment. Attempting refund. Error: {}", e);
                match revert_transaction_base(token_in, &from_address, actual_amount_received_u256).await {
                    Ok(refund_tx_hash) => ("Refund".to_string(), refund_tx_hash),
                    Err(refund_e) => {
                        return SwapResponse::Err(format!(
                            "Failed to send BIT10 token: {}. Also failed to refund: {}", e, refund_e
                        ));
                    }
                }
            }
        }
    } else {
        match revert_transaction_base(token_in, &from_address, actual_amount_received_u256).await {
            Ok(tx_hash) => ("Revert".to_string(), tx_hash),
            Err(e) => {
                return SwapResponse::Err(format!("Price mismatch too high. Failed to revert transaction: {}", e));
            }
        }
    };

    let swap_id = generate_uuid_without_hyphens().await;

    if token_in_amount_actual_decimal <= Decimal::ZERO ||
       token_in_usd_amount_value <= Decimal::ZERO ||
       token_out_amount_decimal <= Decimal::ZERO {
        return SwapResponse::Err("Final amounts validation failed (values are zero or less)".to_string());
    }

    let response_data = SwapResponseData {
        swap_id: swap_id.to_lowercase(),
        user_wallet_address: from_address.to_lowercase(),
        token_in_address: token_in_address.to_lowercase(),
        token_in_amount: token_in_amount_actual_decimal.to_string(),
        token_in_usd_amount: token_in_usd_amount_value.to_string(),
        token_in_tx_hash: transaction_hash.to_lowercase(),
        token_out_address: token_out_address.to_lowercase(),
        token_out_amount: token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_lowercase(),
        transaction_type: transaction_type,
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "Base".to_string(),
    };

    BUY_HISTORY.with(|h| h.borrow_mut().push(response_data.clone()));

    SwapResponse::Ok(response_data)
}


#[update]
pub async fn get_transaction_count_for_address(address: String) -> Nat {
    let network = read_state(|s| s.base_network());
    let rpc_url = utils::http::get_rpc_url(network);

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "latest"], "id": 1}}"#,
        address
    );

    match call_rpc_with_retry_base(json_payload).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| ic_cdk::trap(&format!("Failed to parse transaction count RPC response: {}", e)))
                .unwrap();
            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                let count = u64::from_str_radix(count_hex, 16)
                    .map_err(|e| ic_cdk::trap(&format!("Failed to parse transaction count hex: {}", e)))
                    .unwrap();
                Nat::from(count)
            } else if let Some(error) = response.get("error") {
                ic_cdk::trap(&format!("RPC error getting transaction count: {}", error));
            }
            else {
                ic_cdk::trap("Failed to get transaction count from response");
            }
        }
        Err(e) => {
            ic_cdk::trap(&format!("Failed to get transaction count: {}", e))
        }
    }
}

fn estimate_transaction_fees() -> (u128, u128, u128) {
    const GAS_LIMIT: u128 = 21_000;
    const MAX_FEE_PER_GAS: u128 = 50_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;

    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}

#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: raw.response.status.clone(),
        ..Default::default()
    };
    if res.status == Nat::from(200u64) {
        res.body = raw.response.body;
    } else {
        ic_cdk::api::print(format!(
            "Received an error from the remote service:\n{:#?}",
            raw
        ));
    }
    res
}

ic_cdk::export_candid!();
