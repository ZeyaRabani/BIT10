mod ecdsa;
mod bsc_wallet;
mod ethereum_wallet;
mod state;
mod utils;

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::management_canister::ecdsa::{EcdsaKeyId, EcdsaCurve};
use ic_cdk::api::management_canister::http_request::{HttpResponse, TransformArgs};
use ic_cdk::{init, post_upgrade, query, update, pre_upgrade};
use ic_stable_structures::memory_manager::{MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use ic_cdk::api::management_canister::main::raw_rand;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use rust_decimal::Decimal;
use std::cell::RefCell;
use std::collections::HashMap;
use std::str::FromStr;
use alloy_primitives::{hex, Address, U256};
use k256::{
    ecdsa::{RecoveryId, Signature as K256Sig, VerifyingKey},
    PublicKey,
};
use sha3::{Digest, Keccak256};
use k256::elliptic_curve::sec1::ToEncodedPoint;
use num_traits::ToPrimitive;
use ciborium::from_reader;
use crate::bsc_wallet::BscWallet;
use crate::ethereum_wallet::EthereumWallet;
use crate::state::{init_state, read_state, InitArg, BscNetwork, EthereumNetwork, EcdsaKeyName};
use crate::utils::{
    http::{make_http_request, call_rpc_with_retry_eth, get_rpc_url_eth},
    tokens::{
        get_supported_lending_tokens, get_supported_pairs, get_token_price_from_price_feed_canister,
        get_token_price_from_http_link
    },
    transactions::{
        get_transaction_by_hash_ethereum, get_transaction_receipt_ethereum,
        send_erc20_token_from_canister, send_native_eth_from_canister,
        get_transaction_count_ethereum,
    },
    constants::{
        PLATFORM_ICP_WALLET_PRINCIPAL, PRICE_FEED_CANISTER_ID, TATUM_API_KEY_ETHEREUM,
        PLATFORM_ETHEREUM_WALLET_ADDRESS,
    },
    validation::{
        validate_principal_address, validate_ethereum_address, parse_decimal_amount,
        validate_token_on_chain, validate_timestamp_elapsed,
    },
    conversions::{decimal_to_scaled_nat, decimal_to_scaled_u256, u256_to_decimal_string},
};

thread_local! {
    static LEND_HISTORY: RefCell<Vec<LendResponseData>> = RefCell::new(Vec::new());
    static BORROW_HISTORY: RefCell<Vec<BorrowResponseData>> = RefCell::new(Vec::new());
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );
    static CACHED_BSC_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_ETH_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
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
pub struct Pair {
    pub borrow_token_chain: String,
    pub borrow_token_address: String,
    pub borrow_token_id: String,
    pub collateral_token_chain: String,
    pub collateral_token_address: String,
    pub collateral_token_id: String,
    pub collateral_price_feed_link: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct PriceFeedResult {
    pub value: Vec<u8>,
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize, Clone, serde::Serialize)]
struct LiquidityData {
    token_address: String,
    token_symbol: String,
    token_chain: String,
    total_volume: String,
    total_volume_available_for_lending: String,
    total_volume_borrowed: String,
}

#[derive(CandidType, Deserialize, Clone)]
struct LendArgs {
    pub lender_address: String,
    pub token_chain: String,
    pub token_address: String,
    pub token_amount: String,
}

#[derive(CandidType, Deserialize, Clone, serde::Serialize)]
struct LendResponseData {
    pub lend_id: String,
    pub lender_address: String,
    pub token_chain: String,
    pub token_address: String,
    pub token_amount: String,
    pub token_sent_trx_hash: String,
    pub interest_rate: String,
    pub status: String,
    pub opened_at: String,
    pub return_amount: Option<String>,
    pub return_trx_hash: Option<String>,
    pub return_timestamp: Option<String>,
    pub closed_at: Option<String>,
}

#[derive(CandidType, serde::Serialize)]
enum LendResponse {
    Ok(LendResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Clone)]
struct BorrowArgs {
    pub borrower_address: String,
    pub borrow_token_chain: String,
    pub borrow_token_address: String,
    pub borrow_token_amount: String,
    pub collateral_token_chain: String,
    pub collateral_token_address: String,
    pub collateral_token_amount: String,
    pub borrow_wallet_address: String,
}

#[derive(CandidType, Deserialize, Clone, serde::Serialize)]
struct BorrowResponseData {
    pub borrow_id: String,
    pub borrower_address: String,
    pub borrow_token_chain: String,
    pub borrow_token_address: String,
    pub borrow_token_amount: String,
    pub borrow_trx_hash: String,
    pub collateral_token_chain: String,
    pub collateral_token_address: String,
    pub collateral_token_amount: String,
    pub collateral_trx_hash: String,
    pub borrow_wallet_address: String,
    pub interest_rate: String,
    pub status: String,
    pub opened_at: String,
    pub repayment_amount: Option<String>,
    pub repayment_trx_hash: Option<String>,
    pub repayment_timestamp: Option<String>,
    pub closed_at: Option<String>,
}

#[derive(CandidType, serde::Serialize)]
enum BorrowResponse {
    Ok(BorrowResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TransactionData {
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct TransactionResponse {
    pub transaction_data: TransactionData,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct SignatureVerificationRequest {
    pub lend_id: String,
    pub signature: String,
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let lend_history = LEND_HISTORY.with(|h| h.borrow().clone());
    let borrow_history = BORROW_HISTORY.with(|h| h.borrow().clone());
    let bsc_addr = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    let eth_addr = CACHED_ETH_ADDRESS.with(|addr| addr.borrow().clone());

    ic_cdk::storage::stable_save((lend_history, borrow_history, bsc_addr, eth_addr))
        .expect("Failed to save data to stable storage");
}

#[post_upgrade]
fn post_upgrade_hook(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }

    if let Ok((lend_history, borrow_history, bsc_addr, eth_addr)) =
        ic_cdk::storage::stable_restore::<(
            Vec<LendResponseData>,
            Vec<BorrowResponseData>,
            Option<String>,
            Option<String>,
        )>()
    {
        LEND_HISTORY.with(|h| *h.borrow_mut() = lend_history);
        BORROW_HISTORY.with(|h| *h.borrow_mut() = borrow_history);
        CACHED_BSC_ADDRESS.with(|addr| *addr.borrow_mut() = bsc_addr);
        CACHED_ETH_ADDRESS.with(|addr| *addr.borrow_mut() = eth_addr);
    }
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[query]
fn supported_lending_tokens() -> String {
    let tokens = get_supported_lending_tokens();
    serde_json::json!({ "token": tokens }).to_string()
}

#[update]
pub async fn bsc_address() -> String {
    let cached = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let wallet = BscWallet::new_canister_wallet().await;
    let address = wallet.bsc_address().to_string();

    CACHED_BSC_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

#[update]
pub async fn ethereum_address() -> String {
    let cached = CACHED_ETH_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let wallet = EthereumWallet::new_canister_wallet().await;
    let address = wallet.ethereum_address().to_string();

    CACHED_ETH_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

#[query]
fn get_lend_history() -> Vec<LendResponseData> {
    LEND_HISTORY.with(|h| h.borrow().clone())
}

#[query]
fn get_lend_history_by_address(address: String) -> Vec<LendResponseData> {
    let search_address = address.to_lowercase();
    LEND_HISTORY.with(|h| {
        h.borrow()
            .iter()
            .filter(|lend| lend.lender_address.eq_ignore_ascii_case(&search_address))
            .cloned()
            .collect()
    })
}

#[query]
fn get_borrow_history() -> Vec<BorrowResponseData> {
    BORROW_HISTORY.with(|h| h.borrow().clone())
}

#[query]
fn get_borrow_history_by_address(address: String) -> Vec<BorrowResponseData> {
    let search_address = address.to_lowercase();
    BORROW_HISTORY.with(|h| {
        h.borrow()
            .iter()
            .filter(|borrow| borrow.borrow_wallet_address.eq_ignore_ascii_case(&search_address))
            .cloned()
            .collect()
    })
}

#[query]
fn total_liquidity() -> Vec<LiquidityData> {
    let supported_tokens = get_supported_lending_tokens();
    let mut liquidity_data = Vec::new();

    for token in supported_tokens {
        let token_address_lower = token.token_address.clone().unwrap_or_default().to_lowercase();
        let token_symbol = token.token_symbol.clone();
        let token_chain_lower = token.token_chain.clone().to_lowercase();

        let total_volume: Decimal = LEND_HISTORY.with(|h| {
            h.borrow()
                .iter()
                .filter(|lend| {
                    lend.status == "Active" &&
                    lend.token_chain.eq_ignore_ascii_case(&token_chain_lower) &&
                    lend.token_address.eq_ignore_ascii_case(&token_address_lower)
                })
                .filter_map(|lend| parse_decimal_amount(&lend.token_amount).ok())
                .sum()
        });

        let total_volume_borrowed: Decimal = BORROW_HISTORY.with(|h| {
            h.borrow()
                .iter()
                .filter(|borrow| {
                    borrow.status == "Active" &&
                    borrow.borrow_token_chain.eq_ignore_ascii_case(&token_chain_lower) &&
                    borrow.borrow_token_address.eq_ignore_ascii_case(&token_address_lower)
                })
                .filter_map(|borrow| parse_decimal_amount(&borrow.borrow_token_amount).ok())
                .sum()
        });

        let total_volume_available_for_lending = total_volume - total_volume_borrowed;

        liquidity_data.push(LiquidityData {
            token_address: token_address_lower.clone(),
            token_symbol: token_symbol.clone(),
            token_chain: token.token_chain.clone(),
            total_volume: total_volume.to_string(),
            total_volume_available_for_lending: total_volume_available_for_lending.to_string(),
            total_volume_borrowed: total_volume_borrowed.to_string(),
        });
    }

    liquidity_data
}

#[update]
async fn icp_lend(args: LendArgs) -> LendResponse {
    let caller = ic_cdk::caller();

    if !args.token_chain.eq_ignore_ascii_case("icp") {
        return LendResponse::Err(format!(
            "Invalid token chain. Expected 'ICP', got '{}'",
            args.token_chain
        ));
    }

    let lender_principal = match validate_principal_address(&args.lender_address) {
        Ok(p) => p,
        Err(e) => return LendResponse::Err(format!("Invalid lender address: {}", e)),
    };

    if caller != lender_principal {
        return LendResponse::Err(
            "Unauthorized: Caller must be the same as lender_address for ICP lending".to_string(),
        );
    }

    let token_amount_decimal = match parse_decimal_amount(&args.token_amount) {
        Ok(d) => d,
        Err(e) => return LendResponse::Err(format!("Invalid token amount: {}", e)),
    };

    if token_amount_decimal <= Decimal::ZERO {
        return LendResponse::Err("Token amount must be greater than 0".to_string());
    }

    let token = match validate_token_on_chain(
        &args.token_address,
        "ICP",
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => return LendResponse::Err(e),
    };

    if !token.is_active {
        return LendResponse::Err(format!(
            "Token '{}' is currently inactive for lending",
            token.token_symbol
        ));
    }

    let lend_id = generate_uuid_without_hyphens().await;

    let amount_nat = decimal_to_scaled_nat(token_amount_decimal, token.token_decimals)
        .map_err(|e| LendResponse::Err(format!("Failed to scale token amount: {}", e)))
        .unwrap();

    let to_account = Account {
        owner: ic_cdk::id(),
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: lender_principal,
            subaccount: None,
        },
        to: to_account,
        spender_subaccount: None,
        amount: amount_nat,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let ledger_principal = match validate_principal_address(&args.token_address) {
        Ok(p) => p,
        Err(e) => return LendResponse::Err(format!("Invalid token ledger principal: {}", e)),
    };

    let transfer_result: Result<(Result<BlockIndex, TransferFromError>,), _> =
        ic_cdk::call(ledger_principal, "icrc2_transfer_from", (transfer_args,)).await;

    let block_index = match transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => return LendResponse::Err(format!("ICP transfer failed: {:?}", e)),
        Err(e) => return LendResponse::Err(format!("ICP inter-canister call failed: {:?}", e)),
    };

    let lend_data = LendResponseData {
        lend_id: lend_id.to_lowercase(),
        lender_address: args.lender_address.to_lowercase(),
        token_chain: args.token_chain.to_lowercase(),
        token_address: args.token_address.to_lowercase(),
        token_amount: args.token_amount,
        token_sent_trx_hash: block_index.to_string(),
        interest_rate: "4.5".to_string(),
        status: "Active".to_string(),
        opened_at: ic_cdk::api::time().to_string(),
        return_amount: None,
        return_trx_hash: None,
        return_timestamp: None,
        closed_at: None,
    };

    LEND_HISTORY.with(|h| h.borrow_mut().push(lend_data.clone()));

    LendResponse::Ok(lend_data)
}

#[update]
async fn icp_lend_withdraw(lend_id: String) -> LendResponse {
    let caller = ic_cdk::caller();
    let mut lend_history = LEND_HISTORY.with(|h| h.borrow().clone());

    let lend_index = match lend_history.iter().position(|lend| lend.lend_id == lend_id) {
        Some(index) => index,
        None => return LendResponse::Err(format!("Lend ID '{}' not found in history", lend_id)),
    };

    let mut lend_data = lend_history[lend_index].clone();

    if lend_data.status != "Active" {
        return LendResponse::Err(format!(
            "Lend ID '{}' is not active. Current status: {}",
            lend_id, lend_data.status
        ));
    }

    let caller_principal_str = caller.to_text();
    if !lend_data.lender_address.eq_ignore_ascii_case(&caller_principal_str) {
        return LendResponse::Err(format!(
            "Unauthorized: Caller '{}' does not match lender address '{}'",
            caller_principal_str, lend_data.lender_address
        ));
    }

    if !lend_data.token_chain.eq_ignore_ascii_case("icp") {
        return LendResponse::Err(format!(
            "Invalid token chain for withdrawal. Expected 'ICP', got '{}'",
            lend_data.token_chain
        ));
    }

    let current_time = ic_cdk::api::time();
    if let Err(e) = validate_timestamp_elapsed(&lend_data.opened_at, current_time, 8 * 24 * 60 * 60 + 60) {
        return LendResponse::Err(e);
    }

    let token = match validate_token_on_chain(
        &lend_data.token_address,
        "ICP",
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => return LendResponse::Err(e),
    };

    let original_amount_decimal = match parse_decimal_amount(&lend_data.token_amount) {
        Ok(d) => d,
        Err(e) => return LendResponse::Err(format!("Invalid original token amount: {}", e)),
    };

    let return_amount_decimal = original_amount_decimal * Decimal::from_str("0.9995").unwrap();
    let return_amount_str = return_amount_decimal.to_string();

    let return_amount_nat = decimal_to_scaled_nat(return_amount_decimal, token.token_decimals)
        .map_err(|e| LendResponse::Err(format!("Failed to scale return amount: {}", e)))
        .unwrap();

    let to_account = Account {
        owner: caller,
        subaccount: None,
    };

    let transfer_args = TransferArg {
        from_subaccount: None,
        to: to_account,
        amount: return_amount_nat,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let ledger_principal = match validate_principal_address(&lend_data.token_address) {
        Ok(p) => p,
        Err(e) => return LendResponse::Err(format!("Invalid token ledger principal: {}", e)),
    };

    let transfer_result: Result<(Result<BlockIndex, TransferError>,), _> =
        ic_cdk::call(ledger_principal, "icrc1_transfer", (transfer_args,)).await;

    let block_index = match transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => return LendResponse::Err(format!("ICP transfer failed: {:?}", e)),
        Err(e) => return LendResponse::Err(format!("ICP inter-canister call failed: {:?}", e)),
    };

    let current_time_str = current_time.to_string();
    lend_data.status = "Closed".to_string();
    lend_data.return_amount = Some(return_amount_str);
    lend_data.return_trx_hash = Some(block_index.to_string());
    lend_data.return_timestamp = Some(current_time_str.clone());
    lend_data.closed_at = Some(current_time_str);

    lend_history[lend_index] = lend_data.clone();
    LEND_HISTORY.with(|h| *h.borrow_mut() = lend_history);

    LendResponse::Ok(lend_data)
}

#[update]
async fn icp_borrow(args: BorrowArgs) -> BorrowResponse {
    let caller = ic_cdk::caller();

    let borrower_principal = match validate_principal_address(&args.borrower_address) {
        Ok(p) => p,
        Err(e) => return BorrowResponse::Err(format!("Invalid borrower address: {}", e)),
    };

    if caller != borrower_principal {
        return BorrowResponse::Err(
            "Unauthorized: Caller must be the same as borrower_address for ICP collateral".to_string(),
        );
    }

    let borrow_token_chain = args.borrow_token_chain.to_lowercase();
    let borrow_token_address = args.borrow_token_address.to_lowercase();
    let collateral_token_chain = args.collateral_token_chain.to_lowercase();
    let collateral_token_address = args.collateral_token_address.to_lowercase();

    let pair = match get_supported_pairs().iter().find(|p| {
        p.borrow_token_chain.eq_ignore_ascii_case(&borrow_token_chain) &&
        p.borrow_token_address.eq_ignore_ascii_case(&borrow_token_address) &&
        p.collateral_token_chain.eq_ignore_ascii_case(&collateral_token_chain) &&
        p.collateral_token_address.eq_ignore_ascii_case(&collateral_token_address)
    }) {
        Some(p) => p,
        None => {
            return BorrowResponse::Err(format!(
                "Invalid borrowing pair. Borrow token '{}' on chain '{}' and collateral token '{}' on chain '{}' is not supported",
                borrow_token_address, borrow_token_chain, collateral_token_address, collateral_token_chain
            ));
        }
    };

    let borrow_token_amount_decimal = match parse_decimal_amount(&args.borrow_token_amount) {
        Ok(d) => d,
        Err(e) => return BorrowResponse::Err(format!("Invalid borrow token amount: {}", e)),
    };
    if borrow_token_amount_decimal <= Decimal::ZERO {
        return BorrowResponse::Err("Borrow token amount must be greater than 0".to_string());
    }

    let collateral_token_amount_decimal = match parse_decimal_amount(&args.collateral_token_amount) {
        Ok(d) => d,
        Err(e) => return BorrowResponse::Err(format!("Invalid collateral token amount: {}", e)),
    };
    if collateral_token_amount_decimal <= Decimal::ZERO {
        return BorrowResponse::Err("Collateral token amount must be greater than 0".to_string());
    }

    let liquidity_data = total_liquidity();
    let available_liquidity = liquidity_data
        .iter()
        .find(|data| {
            data.token_address.eq_ignore_ascii_case(&borrow_token_address) &&
            data.token_chain.eq_ignore_ascii_case(&borrow_token_chain)
        })
        .and_then(|data| parse_decimal_amount(&data.total_volume_available_for_lending).ok())
        .unwrap_or_else(Decimal::ZERO);

    if borrow_token_amount_decimal > available_liquidity {
        return BorrowResponse::Err(format!(
            "Insufficient liquidity. Requested: {}, Available: {}",
            borrow_token_amount_decimal,
            available_liquidity
        ));
    }

    let borrow_token = match validate_token_on_chain(
        &borrow_token_address,
        &borrow_token_chain,
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => return BorrowResponse::Err(e),
    };

    let collateral_token = match validate_token_on_chain(
        &collateral_token_address,
        &collateral_token_chain,
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => {
            if pair.collateral_token_id.eq_ignore_ascii_case("top") {
                Token {
                    token_id: Some("top".to_string()),
                    token_name: "BIT10.TOP".to_string(),
                    token_symbol: "B10".to_string(),
                    token_address: Some(collateral_token_address.clone()),
                    token_chain: collateral_token_chain.clone(),
                    token_decimals: 8,
                    is_native: false,
                    is_active: true,
                    price_feed_id: None,
                    price_feed_link: Some(pair.collateral_price_feed_link.clone()),
                }
            } else {
                return BorrowResponse::Err(e);
            }
        },
    };

    let borrow_token_price = match get_token_price_from_price_feed_canister(borrow_token).await {
        Ok(price) => price,
        Err(e) => {
            return BorrowResponse::Err(format!("Failed to get borrow token price: {}", e));
        }
    };
    if borrow_token_price <= 0.0 {
        return BorrowResponse::Err(format!("Invalid borrow token price: {}", borrow_token_price));
    }

    let collateral_token_price = match get_token_price_from_http_link(&collateral_token).await {
        Ok(price) => price,
        Err(e) => {
            return BorrowResponse::Err(format!("Failed to get collateral token price: {}", e));
        }
    };
    if collateral_token_price <= 0.0 {
        return BorrowResponse::Err(format!("Invalid collateral token price: {}", collateral_token_price));
    }

    let borrow_value = borrow_token_price * borrow_token_amount_decimal;
    let collateral_value = collateral_token_price * collateral_token_amount_decimal;

    let max_borrow_value_allowed = collateral_value * Decimal::from_str("0.8").unwrap(); // 80% LTV
    if borrow_value > max_borrow_value_allowed {
        return BorrowResponse::Err(format!(
            "Insufficient collateral. Maximum borrow value allowed: ${:.8}, but requested: ${:.8}",
            max_borrow_value_allowed, borrow_value
        ));
    }

    let collateral_token_for_transfer = match validate_token_on_chain(
        &collateral_token_address,
        "ICP",
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => {
            if pair.collateral_token_id.eq_ignore_ascii_case("top") && collateral_token_chain.eq_ignore_ascii_case("icp") {
                Token {
                    token_id: Some("top".to_string()),
                    token_name: "BIT10.TOP".to_string(),
                    token_symbol: "B10".to_string(),
                    token_address: Some(collateral_token_address.clone()),
                    token_chain: "ICP".to_string(),
                    token_decimals: 8,
                    is_native: false,
                    is_active: true,
                    price_feed_id: None,
                    price_feed_link: Some(pair.collateral_price_feed_link.clone()),
                }
            } else {
                 return BorrowResponse::Err(e);
            }
        },
    };

    let collateral_amount_nat = decimal_to_scaled_nat(
        collateral_token_amount_decimal,
        collateral_token_for_transfer.token_decimals,
    )
    .map_err(|e| BorrowResponse::Err(format!("Failed to scale collateral amount: {}", e)))
    .unwrap();

    let collateral_ledger_principal = match validate_principal_address(&collateral_token_address) {
        Ok(p) => p,
        Err(e) => return BorrowResponse::Err(format!("Invalid collateral ledger principal: {}", e)),
    };

    let collateral_transfer_args = TransferFromArgs {
        from: Account {
            owner: borrower_principal,
            subaccount: None,
        },
        to: Account {
            owner: ic_cdk::id(),
            subaccount: None,
        },
        spender_subaccount: None,
        amount: collateral_amount_nat,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let collateral_transfer_result: Result<(Result<BlockIndex, TransferFromError>,), _> =
        ic_cdk::call(collateral_ledger_principal, "icrc2_transfer_from", (collateral_transfer_args,)).await;

    let collateral_block_index = match collateral_transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => return BorrowResponse::Err(format!("Collateral transfer failed: {:?}", e)),
        Err(e) => return BorrowResponse::Err(format!("Collateral inter-canister call failed: {:?}", e)),
    };

    let borrow_wallet_principal = match validate_principal_address(&args.borrow_wallet_address) {
        Ok(p) => p,
        Err(e) => return BorrowResponse::Err(format!("Invalid borrow wallet address: {}", e)),
    };

    let borrow_token_for_transfer = match validate_token_on_chain(
        &borrow_token_address,
        &borrow_token_chain,
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => return BorrowResponse::Err(e),
    };

    let borrow_amount_nat = decimal_to_scaled_nat(
        borrow_token_amount_decimal,
        borrow_token_for_transfer.token_decimals,
    )
    .map_err(|e| BorrowResponse::Err(format!("Failed to scale borrow amount: {}", e)))
    .unwrap();

    let borrow_ledger_principal = match validate_principal_address(&borrow_token_address) {
        Ok(p) => p,
        Err(e) => return BorrowResponse::Err(format!("Invalid borrow token ledger principal: {}", e)),
    };

    let borrow_transfer_args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: borrow_wallet_principal,
            subaccount: None,
        },
        amount: borrow_amount_nat,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let borrow_transfer_result: Result<(Result<BlockIndex, TransferError>,), _> =
        ic_cdk::call(borrow_ledger_principal, "icrc1_transfer", (borrow_transfer_args,)).await;

    let borrow_block_index = match borrow_transfer_result {
        Ok((Ok(index),)) => index,
        Ok((Err(e),)) => return BorrowResponse::Err(format!("Borrow token transfer failed: {:?}", e)),
        Err(e) => return BorrowResponse::Err(format!("Borrow inter-canister call failed: {:?}", e)),
    };

    let borrow_id = generate_uuid_without_hyphens().await;

    let borrow_data = BorrowResponseData {
        borrow_id: borrow_id.to_lowercase(),
        borrower_address: args.borrower_address.to_lowercase(),
        borrow_token_chain: args.borrow_token_chain.to_lowercase(),
        borrow_token_address: args.borrow_token_address.to_lowercase(),
        borrow_token_amount: args.borrow_token_amount.clone(),
        borrow_trx_hash: borrow_block_index.to_string(),
        collateral_token_chain: args.collateral_token_chain.to_lowercase(),
        collateral_token_address: args.collateral_token_address.to_lowercase(),
        collateral_token_amount: args.collateral_token_amount.clone(),
        collateral_trx_hash: collateral_block_index.to_string(),
        borrow_wallet_address: args.borrow_wallet_address.to_lowercase(),
        interest_rate: "4.5".to_string(),
        status: "Active".to_string(),
        opened_at: ic_cdk::api::time().to_string(),
        repayment_amount: None,
        repayment_trx_hash: None,
        repayment_timestamp: None,
        closed_at: None,
    };

    BORROW_HISTORY.with(|h| h.borrow_mut().push(borrow_data.clone()));

    BorrowResponse::Ok(borrow_data)
}

#[update]
pub async fn eth_lend_create_transaction(args: LendArgs) -> TransactionResponse {
    if !args.token_chain.eq_ignore_ascii_case("ethereum") {
        ic_cdk::trap(&format!(
            "Invalid token chain. Expected 'Ethereum', got '{}'",
            args.token_chain
        ));
    }

    let lender_eth_address = match validate_ethereum_address(&args.lender_address) {
        Ok(addr) => addr,
        Err(e) => ic_cdk::trap(&format!("Invalid lender Ethereum address: {}", e)),
    };

    let token_address = args.token_address.to_lowercase();
    let token = match validate_token_on_chain(
        &token_address,
        "Ethereum",
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => ic_cdk::trap(&e),
    };

    if !token.is_active {
        ic_cdk::trap(&format!(
            "Token '{}' is currently inactive for lending",
            token.token_symbol
        ));
    }

    let lend_id = generate_uuid_without_hyphens().await;

    let token_amount_decimal = match parse_decimal_amount(&args.token_amount) {
        Ok(d) => d,
        Err(e) => ic_cdk::trap(&format!("Failed to parse token amount: {}", e)),
    };
    if token_amount_decimal <= Decimal::ZERO {
        ic_cdk::trap("Token amount must be greater than 0");
    }

    let final_amount_u256 = decimal_to_scaled_u256(token_amount_decimal, token.token_decimals)
        .map_err(|e| ic_cdk::trap(&format!("Failed to scale token amount: {}", e)))
        .unwrap();

    let canister_eth_address_str = ethereum_address().await;
    let canister_eth_address = Address::from_str(&canister_eth_address_str)
        .unwrap_or_else(|_| ic_cdk::trap("Invalid canister Ethereum address"));

    let (to_address_str, value_hex, data_hex) = if token.is_native {
        let lend_id_bytes = lend_id.as_bytes();
        let encoded_data = format!("0x{}", hex::encode(lend_id_bytes));
        (canister_eth_address_str, format!("0x{:x}", final_amount_u256), encoded_data)
    } else {
        let transfer_call_data = alloy_sol_types::sol! { function transfer(address to, uint256 amount) external returns (bool); }
            .transferCall {
                to: canister_eth_address,
                amount: final_amount_u256,
            }
            .abi_encode();

        let data_with_lend_id = format!("0x{}{}", hex::encode(&transfer_call_data), lend_id);
        (token_address, "0x0".to_string(), data_with_lend_id)
    };

    let transaction_data = TransactionData {
        from: lender_eth_address.to_string(),
        to: to_address_str,
        value: value_hex,
        data: data_hex,
    };

    TransactionResponse { transaction_data }
}

#[update]
async fn eth_lend(trx_hash: String) -> LendResponse {
    let trx_hash_lower = trx_hash.to_lowercase();

    let already_exists = LEND_HISTORY.with(|h| {
        h.borrow().iter().any(|lend| {
            lend.token_sent_trx_hash.eq_ignore_ascii_case(&trx_hash_lower)
        })
    });

    if already_exists {
        return LendResponse::Err("Transaction already processed".to_string());
    }

    let tx = match get_transaction_by_hash_ethereum(&trx_hash_lower).await {
        Ok(transaction) => transaction,
        Err(e) => return LendResponse::Err(format!("Failed to get transaction details: {}", e)),
    };

    let tx_receipt = match get_transaction_receipt_ethereum(&trx_hash_lower).await {
        Ok(receipt) => receipt,
        Err(e) => return LendResponse::Err(format!("Failed to get transaction receipt: {}", e)),
    };

    let tx_status = tx_receipt.get("status").and_then(|v| v.as_str()).unwrap_or("0x0");
    if tx_status != "0x1" {
        return LendResponse::Err("Transaction was not successful".to_string());
    }

    let supported_tokens = get_supported_lending_tokens();
    let canister_eth_address_str = ethereum_address().await.to_lowercase();

    let tx_from = tx.get("from").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
    let tx_to = tx.get("to").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
    let tx_value_hex = tx.get("value").and_then(|v| v.as_str()).unwrap_or("0x0");
    let tx_input_hex = tx.get("input").and_then(|v| v.as_str()).unwrap_or("0x");

    let (token_address, token_amount_decimal, lend_id_str) =
        if tx_to.eq_ignore_ascii_case(&canister_eth_address_str) && tx_value_hex != "0x0" {
            let token = supported_tokens
                .iter()
                .find(|t| t.is_native && t.token_chain.eq_ignore_ascii_case("ethereum"))
                .ok_or_else(|| LendResponse::Err("Native ETH token not configured".to_string()))?;

            let value_u256 = U256::from_str_radix(tx_value_hex.strip_prefix("0x").unwrap_or("0"), 16)
                .map_err(|e| LendResponse::Err(format!("Invalid transaction value hex: {}", e)))?;

            let amount_decimal = u256_to_decimal_string(value_u256, token.token_decimals)
                .map_err(LendResponse::Err)
                .unwrap()
                .parse::<Decimal>()
                .map_err(|e| LendResponse::Err(format!("Failed to parse decimal: {}", e)))?;

            let decoded_lend_id = if tx_input_hex.len() > 2 {
                String::from_utf8(hex::decode(&tx_input_hex[2..]).unwrap_or_default())
                    .unwrap_or_else(|_| format!("lend_{}", &trx_hash_lower[..8]))
            } else {
                format!("lend_{}", &trx_hash_lower[..8])
            };

            (token.token_address.clone().unwrap_or_default(), amount_decimal, decoded_lend_id)
        } else if tx_input_hex.starts_with("0xa9059cbb") {
            if tx_input_hex.len() < 138 {
                return LendResponse::Err("Invalid ERC20 transfer input data length".to_string());
            }

            let recipient_padded_hex = &tx_input_hex[10..74];
            let transfer_recipient_address = format!("0x{}", &recipient_padded_hex[24..64]).to_lowercase();

            if !transfer_recipient_address.eq_ignore_ascii_case(&canister_eth_address_str) {
                return LendResponse::Err(format!(
                    "ERC20 transfer was not sent to canister address. Expected: {}, Got: {}",
                    canister_eth_address_str, transfer_recipient_address
                ));
            }

            let token = supported_tokens
                .iter()
                .find(|t| t.token_address.as_deref().map_or(false, |addr| addr.eq_ignore_ascii_case(&tx_to))
                        && t.token_chain.eq_ignore_ascii_case("ethereum"))
                .ok_or_else(|| LendResponse::Err(format!("ERC20 token contract {} not configured", tx_to)))?;

            let amount_hex = &tx_input_hex[74..138];
            let amount_u256 = U256::from_str_radix(amount_hex, 16)
                .map_err(|e| LendResponse::Err(format!("Invalid amount in ERC20 input data: {}", e)))?;

            let amount_decimal = u256_to_decimal_string(amount_u256, token.token_decimals)
                .map_err(LendResponse::Err)
                .unwrap()
                .parse::<Decimal>()
                .map_err(|e| LendResponse::Err(format!("Failed to parse decimal: {}", e)))?;

            let decoded_lend_id = if tx_input_hex.len() > 138 {
                let lend_id_hex = &tx_input_hex[138..];
                String::from_utf8(hex::decode(lend_id_hex).unwrap_or_default())
                    .unwrap_or_else(|_| format!("lend_{}", &trx_hash_lower[..8]))
            } else {
                format!("lend_{}", &trx_hash_lower[..8])
            };

            (token.token_address.clone().unwrap_or_default(), amount_decimal, decoded_lend_id)
        } else {
            return LendResponse::Err("Transaction is neither native ETH to canister nor an ERC20 transfer".to_string());
        };

    let new_lend_id = generate_uuid_without_hyphens().await;

    let lend_data = LendResponseData {
        lend_id: new_lend_id.to_lowercase(),
        lender_address: tx_from,
        token_chain: "ethereum".to_string(),
        token_address: token_address.to_lowercase(),
        token_amount: token_amount_decimal.to_string(),
        token_sent_trx_hash: trx_hash_lower,
        interest_rate: "4.5".to_string(),
        status: "Active".to_string(),
        opened_at: ic_cdk::api::time().to_string(),
        return_amount: None,
        return_trx_hash: None,
        return_timestamp: None,
        closed_at: None,
    };

    LEND_HISTORY.with(|h| h.borrow_mut().push(lend_data.clone()));

    LendResponse::Ok(lend_data)
}

#[update]
async fn eth_lend_withdraw(req: SignatureVerificationRequest) -> LendResponse {
    let mut lend_history = LEND_HISTORY.with(|h| h.borrow().clone());

    let lend_index = match lend_history.iter().position(|lend| lend.lend_id == req.lend_id) {
        Some(index) => index,
        None => return LendResponse::Err(format!("Lend ID '{}' not found in history", req.lend_id)),
    };

    let mut lend_data = lend_history[lend_index].clone();

    if lend_data.status != "Active" {
        return LendResponse::Err(format!(
            "Lend ID '{}' is not active. Current status: {}",
            req.lend_id, lend_data.status
        ));
    }

    if !lend_data.token_chain.eq_ignore_ascii_case("ethereum") {
        return LendResponse::Err(format!(
            "Invalid token chain for withdrawal. Expected 'Ethereum', got '{}'",
            lend_data.token_chain
        ));
    }

    let message = format!(
        "I am the owner of Ethereum address {} and I approve the withdrawal for Lend ID {} on chain {}.",
        lend_data.lender_address,
        req.lend_id,
        lend_data.token_chain
    );

    let recovered_address = match recover_ethereum_address_from_signature(&message, &req.signature) {
        Ok(address) => address,
        Err(e) => return LendResponse::Err(format!("Signature verification failed: {}", e)),
    };

    let expected_address = lend_data.lender_address.to_lowercase();
    if !recovered_address.eq_ignore_ascii_case(&expected_address) {
        return LendResponse::Err(format!(
            "ACCESS DENIED! Signature verification failed. Expected address: {}, but signature was signed by: {}",
            expected_address, recovered_address
        ));
    }

    let current_time = ic_cdk::api::time();
    if let Err(e) = validate_timestamp_elapsed(&lend_data.opened_at, current_time, 8 * 24 * 60 * 60 + 60) {
        return LendResponse::Err(e);
    }

    let token = match validate_token_on_chain(
        &lend_data.token_address,
        "Ethereum",
        &get_supported_lending_tokens(),
    ) {
        Ok(t) => t,
        Err(e) => return LendResponse::Err(e),
    };

    let original_amount_decimal = match parse_decimal_amount(&lend_data.token_amount) {
        Ok(d) => d,
        Err(e) => return LendResponse::Err(format!("Invalid original token amount: {}", e)),
    };

    let return_amount_decimal = original_amount_decimal * Decimal::from_str("0.9995").unwrap(); // 0.05% platform fee
    let return_amount_str = return_amount_decimal.to_string();

    let final_amount_u256 = decimal_to_scaled_u256(return_amount_decimal, token.token_decimals)
        .map_err(|e| LendResponse::Err(format!("Failed to scale return amount: {}", e)))
        .unwrap();

    let lender_ethereum_address = match validate_ethereum_address(&lend_data.lender_address) {
        Ok(addr) => addr,
        Err(e) => return LendResponse::Err(format!("Invalid lender Ethereum address: {}", e)),
    };

    let transaction_hash = if token.is_native {
        match send_native_eth_from_canister(lender_ethereum_address, final_amount_u256).await {
            Ok(tx_hash) => tx_hash,
            Err(e) => return LendResponse::Err(format!("Failed to send native ETH: {}", e)),
        }
    } else {
        let token_contract = match validate_ethereum_address(&lend_data.token_address) {
            Ok(addr) => addr,
            Err(e) => return LendResponse::Err(format!("Invalid token contract address: {}", e)),
        };

        match send_erc20_token_from_canister(token_contract, lender_ethereum_address, final_amount_u256).await {
            Ok(tx_hash) => tx_hash,
            Err(e) => return LendResponse::Err(format!("Failed to send ERC20 token: {}", e)),
        }
    };

    let current_time_str = current_time.to_string();
    lend_data.status = "Closed".to_string();
    lend_data.return_amount = Some(return_amount_str);
    lend_data.return_trx_hash = Some(transaction_hash);
    lend_data.return_timestamp = Some(current_time_str.clone());
    lend_data.closed_at = Some(current_time_str);

    lend_history[lend_index] = lend_data.clone();
    LEND_HISTORY.with(|h| *h.borrow_mut() = lend_history);

    LendResponse::Ok(lend_data)
}

pub fn recover_ethereum_address_from_signature(
    message: &str,
    signature_hex: &str,
) -> Result<String, String> {
    let sig_bytes = hex::decode(&signature_hex[2..])
        .map_err(|e| format!("Invalid hex in signature: {}", e))?;

    if sig_bytes.len() != 65 {
        return Err("Signature must be 65 bytes long (64 bytes R, S + 1 byte V).".to_string());
    }

    let recovery_id_byte = sig_bytes[64];
    
    let recovery_id = RecoveryId::from_byte(recovery_id_byte % 2)
        .ok_or_else(|| "Invalid recovery ID byte (should be 0 or 1 after modulo).".to_string())?;

    let sig = K256Sig::try_from(&sig_bytes[..64])
        .map_err(|e| format!("Signature parsing error: {}", e))?;

    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let full_message = [prefix.as_bytes(), message.as_bytes()].concat();
    let msg_hash = Keccak256::digest(&full_message);
    
    let verifying_key =
        VerifyingKey::recover_from_prehash(&msg_hash, &sig, recovery_id)
            .map_err(|e| format!("Signature recovery failed: {}", e))?;

    let public_key = PublicKey::from(&verifying_key);
    let uncompressed_pubkey = public_key.to_encoded_point(false);
    let pubkey_bytes = uncompressed_pubkey.as_bytes();

    let hash = Keccak256::digest(&pubkey_bytes[1..]);
    let address = &hash[12..];

    Ok(format!("0x{}", hex::encode(address)))
}

async fn generate_uuid_without_hyphens() -> String {
    let (bytes,): (Vec<u8>,) = raw_rand().await.expect("raw_rand failed");
    let mut id = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        id.push_str(&format!("{:02x}", b));
    }
    id
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