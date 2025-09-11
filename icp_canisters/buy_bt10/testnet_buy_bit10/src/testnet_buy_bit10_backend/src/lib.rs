mod ecdsa;
mod state;
mod utils;
mod wallets;

use crate::state::{
    init_state, read_state,
    CustomRpcConfig, EcdsaKeyName, EthereumNetwork, InitArg, SWAP_HISTORY,
};
use crate::utils::{
    call_rpc_with_retry, decode_eth_transaction_data, decode_erc20_recipient_address,
    extract_actual_amount_from_transaction, get_bit10_token_price, get_dynamic_fees,
    get_rpc_url, get_token_price_from_feed, make_http_request, u256_to_decimal_string,
    addresses_match, get_supported_bit10_tokens, get_supported_tokens,
};
use crate::wallets::{BscWallet, EthereumWallet};
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};
use ic_cdk::{init, post_upgrade, pre_upgrade, query, update};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use num_bigint::BigUint;
use num_traits::{cast::ToPrimitive, FromPrimitive};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use serde_json::Value;
use std::str::FromStr;
use alloy_primitives::{hex, Address, U256};

const TATUM_API_KEY: &str = "t-dhbfhdbfvjnfkbnkm;l";

const BIT10_BTC_LEDGER_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x3b\x0d\x01\x01");
const TEST_BIT10_DEFI_LEDGER_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x3b\x1a\x01\x01");
const TEST_BIT10_BRC20_LEDGER_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7d\x2e\x01\x01");
const TEST_BIT10_TOP_LEDGER_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7d\x32\x01\x01");
const TEST_BIT10_MEME_LEDGER_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7d\x73\x01\x01");

type Tokens = candid::Nat;

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct SwapArgs {
    pub user_wallet_address: String,
    pub token_in_address: String,
    pub token_in_amount: String,
    pub token_out_address: String,
    pub token_out_amount: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionData {
    pub tx_type: String,
    pub blockchain: String,
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
    pub gas_limit: String,
    pub max_priority_fee_per_gas: String,
    pub max_fee_per_gas: String,
    pub nonce: String,
    pub chain_id: u64,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionResponse {
    pub transaction_data: TransactionData,
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

#[derive(CandidType)]
struct BalanceAndFeeResponse {
    balance: Nat,
    fee: Nat,
    total: Nat,
}

#[derive(CandidType, Deserialize)]
pub struct ICPSwapArgs {
    tick_in_name: String,
    tick_out_name: String,
    tick_out_amount: Tokens,
}

#[derive(candid::CandidType, serde::Serialize, Clone)]
struct ICPSwapResponseData {
    user_wallet_address: String,
    token_in_address: String,
    token_in_amount: String,
    token_in_usd_amount: String,
    token_in_tx_hash: String,
    token_out_address: String,
    token_out_amount: String,
    token_out_tx_hash: String,
    transaction_type: String,
    transaction_timestamp: String,
    network: String,
}

#[derive(candid::CandidType, serde::Serialize, Clone)]
enum ICPSwapResponse {
    Ok(ICPSwapResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct SwapResponseData {
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

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum SwapResponse {
    Ok(SwapResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize)]
pub struct PriceFeed {
    pub id: FeedId,
    pub value: Vec<u8>,
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize)]
pub struct FeedId {
    pub id: String,
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let history = SWAP_HISTORY.with(|h| h.borrow().clone());
    ic_cdk::storage::stable_save((history,))
        .expect("Failed to save swap history to stable storage");
}

#[post_upgrade]
fn post_upgrade_hook(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg);
    }
    if let Ok((history,)) = ic_cdk::storage::stable_restore::<(Vec<SwapResponse>,)>() {
        SWAP_HISTORY.with(|h| *h.borrow_mut() = history);
    }
}

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

#[query]
fn supported_tokens_query() -> String {
    let tokens = get_supported_tokens();
    serde_json::json!({ "token": tokens }).to_string()
}

#[query]
fn supported_bit10_tokens_query() -> String {
    let tokens = get_supported_bit10_tokens();
    serde_json::json!({ "token": tokens }).to_string()
}

#[update]
pub async fn bsc_address() -> String {
    let canister_id = ic_cdk::id();
    let wallet = BscWallet::new(canister_id).await;
    wallet.bsc_address().to_string()
}

#[update]
pub async fn ethereum_address() -> String {
    let wallet = EthereumWallet::new_canister_wallet().await;
    wallet.ethereum_address().to_string()
}

async fn balance_and_fee(
    tick_in_name: String,
    caller: Principal,
) -> Result<BalanceAndFeeResponse, String> {
    let tick_in_ledger_canister_id = match tick_in_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return Err(format!("Unsupported token: {}", tick_in_name)),
    };

    let fee_result = ic_cdk::call::<(), (Tokens,)>(
        tick_in_ledger_canister_id,
        "icrc1_fee",
        (),
    )
    .await;

    let fee = match fee_result {
        Ok((fee,)) => fee,
        Err(err) => return Err(format!("Failed to get fee: {:?}", err)),
    };

    let balance_result = ic_cdk::call::<(Account,), (Tokens,)>(
        tick_in_ledger_canister_id,
        "icrc1_balance_of",
        (caller.into(),),
    )
    .await;

    let balance = match balance_result {
        Ok((balance,)) => balance,
        Err(err) => return Err(format!("Failed to get balance: {:?}", err)),
    };

    let total = balance.clone() + fee.clone();

    Ok(BalanceAndFeeResponse { balance, fee, total })
}

#[ic_cdk::update]
async fn icp_swap(args: ICPSwapArgs) -> ICPSwapResponse {
    let caller: Principal = ic_cdk::caller();

    let price_feed_canister = Principal::from_slice(b"\x00\x00\x00\x00\x01\xc0\xdd\x96\x01\x01");

    let tick_in_ledger_canister_id = match args.tick_in_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return ICPSwapResponse::Err(format!("Unsupported token: {:?}", args.tick_in_name)),
    };

    let data_id = match args.tick_in_name.as_str() {
        "BIT10.BTC" => "1234567890ABCDEF",
        _ => return ICPSwapResponse::Err(format!("Unsupported token: {}", args.tick_in_name)),
    };

    let price_result: Result<(Option<PriceFeed>,), _> =
        ic_cdk::call(price_feed_canister, "get_value", (data_id.to_string(),)).await;

    let price_feed = match price_result {
        Ok((Some(feed),)) => feed,
        Err(e) => return ICPSwapResponse::Err(format!("Failed to get price feed: {:?}", e)),
        Ok((None,)) => return ICPSwapResponse::Err("Price feed not found".to_string()),
    };

    let tick_in_value = match ciborium::from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value as f64,
        Err(_) => {
            match ciborium::from_reader::<u64, _>(&price_feed.value[..]) {
                Ok(int_value) => int_value as f64,
                Err(e) => return ICPSwapResponse::Err(format!("Failed to decode CBOR price: {}", e)),
            }
        }
    };

    let (tick_out_ledger_canister_id, tick_out_api_url) = match args.tick_out_name.as_str() {
        "Test BIT10.TOP" => (TEST_BIT10_TOP_LEDGER_CANISTER_ID, "https://dufhdfjgnkfmbklcf.bit10.app/bit10-top-current-price"),
        "Test BIT10.MEME" => (TEST_BIT10_MEME_LEDGER_CANISTER_ID, "https://dufhdfjgnkfmbklcf.bit10.app/test-bit10-meme-current-price"),
        _ => return ICPSwapResponse::Err(format!("Unsupported token: {:?}", args.tick_out_name)),
    };

    let tick_out_request = CanisterHttpRequestArgument {
        url: tick_out_api_url.to_string(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: None,
        headers: vec![],
    };

    let tick_out_body = match make_http_request(tick_out_request.clone()).await {
        Ok(body) => match String::from_utf8(body) {
            Ok(b) => b,
            Err(e) => return ICPSwapResponse::Err(format!("Failed to parse response body: {}", e)),
        },
        Err(e) => return ICPSwapResponse::Err(format!("2nd API tick_out_request failed: {}", e)),
    };

    let tick_out_json: Value = match serde_json::from_str(&tick_out_body) {
        Ok(j) => j,
        Err(e) => return ICPSwapResponse::Err(format!("Failed to parse JSON: {}", e)),
    };

    let tick_out = match tick_out_json["tokenPrice"].as_f64() {
        Some(a) => a,
        None => {
            return ICPSwapResponse::Err(
                "Failed to extract tick_out amount from JSON".to_string(),
            )
        }
    };

    ic_cdk::println!(
        "tick_in_value is {:?} and tick_out is {:?}",
        tick_in_value,
        tick_out
    );

    let tick_out_amount_value = match args.tick_out_amount.0.to_f64() {
        Some(v) => v,
        None => {
            return ICPSwapResponse::Err(
                "Failed to convert tick_out_amount to f64".to_string(),
            )
        }
    };

    let selected_amount = ((tick_out_amount_value * tick_out) / tick_in_value) * 1.01;
    let selected_amount_usd = (tick_out_amount_value * tick_out) * 1.01;

    ic_cdk::println!(
        "tick_out_amount_value is {:?}, tick_out is {:?} and tick_in_value is {:?}",
        tick_out_amount_value,
        tick_out,
        tick_in_value
    );

    let selected_amount_fixed = (selected_amount * 100_000_000.0) as u128;
    let selected_amount_nat = Nat::from(BigUint::from(selected_amount_fixed));

    ic_cdk::println!(
        "selected_amount is {:?} and selected_amount_nat is {:?}",
        selected_amount,
        selected_amount_nat
    );

    let balance_and_fee_result = balance_and_fee(args.tick_in_name.clone(), caller).await;

    let balance_info = match balance_and_fee_result {
        Ok(balance_info) => balance_info,
        Err(e) => return ICPSwapResponse::Err(format!("Failed to check balance: {}", e)),
    };

    let caller_balance = balance_info.balance;
    let fee = balance_info.fee;

    ic_cdk::println!(
        "caller_balance is {:?} and fee is {:?}",
        caller_balance,
        fee
    );

    if (selected_amount_nat.clone() + fee.clone()) > caller_balance {
        return ICPSwapResponse::Err(format!(
            "Insufficient balance: Current balance {:?} is less than required amount {:?} + fee {:?}",
            caller_balance.clone(), selected_amount_nat, fee
        ));
    }

    ic_cdk::println!(
        "selected_amount_nat is {:?} and caller_balance is {:?}",
        selected_amount_nat,
        caller_balance
    );

    let to_account = Account {
        owner: Principal::from_slice(b"\xb0\x55\x42\xb8\xb5\xdb\x86\x66\x38\x25\xfa\x36\xb5\xa6\x4d\x9c\x22\xaf\x88\x50\x47\x1c\xb5\x16\x3a\x20\x42\x65\x02").unwrap(),
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to: to_account.clone(),
        spender_subaccount: None,
        amount: selected_amount_nat.clone().into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<BlockIndex, TransferFromError>,)>(
        tick_in_ledger_canister_id,
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    let tick_in_transfer_result = match transfer_result {
        Ok((Ok(block_index),)) => block_index,
        Ok((Err(e),)) => {
            ic_cdk::println!("tick_in_transfer_result failed: {:?}", e);
            return ICPSwapResponse::Err(format!(
                "Transfer failed for tick_in_transfer_result: {:?} and selected_amount_nat is {:?} and fee {:?}",
                e, selected_amount_nat, fee
            ));
        }
        Err(e) => {
            ic_cdk::println!("tick_in_transfer_result failed: {:?}", e);
            return ICPSwapResponse::Err(format!("Call failed: {:?}", e));
        }
    };

    let tick_out_transfer_result = if tick_in_transfer_result.0 > 0u64.into() {
        let tick_out_amount_fixed = match (args.tick_out_amount.0.clone() * BigUint::from(100_000_000u64)).to_u128() {
            Some(value) => value,
            None => return ICPSwapResponse::Err("Failed to convert tick_out_amount to u128".to_string()),
        };

        ic_cdk::println!(
            "Transferring {} amount of {} to account {}",
            tick_out_amount_fixed,
            tick_out_ledger_canister_id,
            caller,
        );

        let transfer_args: TransferArg = TransferArg {
            memo: None,
            amount: NumTokens::from(tick_out_amount_fixed.clone()),
            from_subaccount: None,
            fee: None,
            to: caller.into(),
            created_at_time: None,
        };

        let transfer_result = ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
            tick_out_ledger_canister_id,
            "icrc1_transfer",
            (transfer_args,),
        )
        .await;

        match transfer_result {
            Ok((Ok(block_index),)) => block_index,
            Ok((Err(e),)) => {
                ic_cdk::println!("tick_out_transfer_result failed: {:?}", e);
                return ICPSwapResponse::Err(format!(
                    "Transfer failed for tick_in_transfer failed: {:?}",
                    e
                ));
            }
            Err(e) => {
                ic_cdk::println!("tick_out_transfer_result failed: {:?}", e);
                return ICPSwapResponse::Err(format!("Call failed: {:?}", e));
            }
        }
    } else {
        ic_cdk::println!("tick_in_transfer failed: block index is 0");
        return ICPSwapResponse::Err("tick_in_transfer failed: block index is 0".to_string());
    };

    let response = ICPSwapResponse::Ok(ICPSwapResponseData {
        user_wallet_address: caller.to_string(),
        token_in_address: args.tick_in_name,
        token_in_amount: selected_amount_nat.to_string(),
        token_in_usd_amount: selected_amount_usd.to_string(),
        token_in_tx_hash: tick_in_transfer_result.to_string(),
        token_out_address: args.tick_out_name.clone(),
        token_out_amount: args.tick_out_amount.clone().to_string(),
        token_out_tx_hash: tick_out_transfer_result.to_string(),
        transaction_type: "Swap".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "ICP".to_string(),
    });

    if let ICPSwapResponse::Ok(icp_data) = &response {
        let swap_response_data = SwapResponseData {
            user_wallet_address: icp_data.user_wallet_address.clone(),
            token_in_address: icp_data.token_in_address.clone(),
            token_in_amount: icp_data.token_in_amount.clone(),
            token_in_usd_amount: icp_data.token_in_usd_amount.clone(),
            token_in_tx_hash: icp_data.token_in_tx_hash.clone(),
            token_out_address: icp_data.token_out_address.clone(),
            token_out_amount: icp_data.token_out_amount.clone(),
            token_out_tx_hash: icp_data.token_out_tx_hash.clone(),
            transaction_type: icp_data.transaction_type.clone(),
            transaction_timestamp: icp_data.transaction_timestamp.clone(),
            network: icp_data.network.clone(),
        };
        SWAP_HISTORY.with(|h| h.borrow_mut().push(SwapResponse::Ok(swap_response_data)));
    }

    response
}

#[update]
pub async fn eth_create_transaction(args: SwapArgs) -> TransactionResponse {
    let supported_tokens = get_supported_tokens();
    let supported_bit10_tokens = get_supported_bit10_tokens();

    let token_in = supported_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addresses_match(addr, &args.token_in_address))
        })
        .unwrap_or_else(|| {
            ic_cdk::trap(&format!(
                "Token in address '{}' not found in supported tokens",
                args.token_in_address
            ))
        });

    let token_out = supported_bit10_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addresses_match(addr, &args.token_out_address))
        })
        .unwrap_or_else(|| {
            ic_cdk::trap(&format!(
                "Token out address '{}' not found in supported BIT10 tokens",
                args.token_out_address
            ))
        });

    if !token_in.token_chain.eq_ignore_ascii_case("Ethereum") {
        ic_cdk::trap(&format!(
            "Token in must be on Ethereum chain, found: {}",
            token_in.token_chain
        ));
    }

    if !token_out.token_chain.eq_ignore_ascii_case("Ethereum") {
        ic_cdk::trap(&format!(
            "Token out must be on Ethereum chain, found: {}",
            token_out.token_chain
        ));
    }

    let amount_decimal = Decimal::from_str(&args.token_in_amount)
        .unwrap_or_else(|_| ic_cdk::trap("Failed to parse token_in_amount"));

    let amount_with_fee = amount_decimal * dec!(1.01);

    let scale_factor = Decimal::from(10u64.pow(token_in.token_decimals as u32));
    let amount_in_smallest_unit_decimal = amount_with_fee * scale_factor;
    let amount_in_smallest_unit = amount_in_smallest_unit_decimal.trunc();
    let final_amount_u256 = U256::from_str(&amount_in_smallest_unit.to_string())
        .unwrap_or_else(|_| ic_cdk::trap("Failed to convert amount to U256"));

    let swap_args_data = SwapArgs {
        user_wallet_address: args.user_wallet_address.clone(),
        token_in_address: args.token_in_address.clone(),
        token_in_amount: args.token_in_amount.clone(),
        token_out_address: args.token_out_address.clone(),
        token_out_amount: args.token_out_amount.clone(),
    };

    let json_data_string = serde_json::to_string(&swap_args_data)
        .unwrap_or_else(|_| ic_cdk::trap("Failed to serialize swap args"));
    let json_data_bytes = json_data_string.as_bytes();

    let swap_target_address = "0x7F7307d895f1242E969a58893ac8594EfC8Ce6E2".to_string();

    let (to_address_str, value, data_bytes, gas_limit) = if token_in.is_native {
        let data_bytes = json_data_bytes.to_vec();

        let data_gas: u128 = data_bytes.iter().map(|&b| if b == 0 { 4 } else { 16 }).sum();
        let base_gas = 21_000;
        let total_gas = base_gas + data_gas as u64;

        (
            swap_target_address,
            final_amount_u256,
            data_bytes,
            format!("0x{:x}", total_gas),
        )
    } else {
        let method_id = &hex::decode("a9059cbb").unwrap();
        let mut encoded = method_id.clone();

        let target_address = Address::from_str(&swap_target_address)
            .unwrap_or_else(|_| ic_cdk::trap("Invalid target address"));
        let mut to_bytes = [0u8; 32];
        to_bytes[12..].copy_from_slice(target_address.as_ref());
        encoded.extend_from_slice(&to_bytes);

        let mut amount_bytes = [0u8; 32];
        amount_bytes.copy_from_slice(&final_amount_u256.to_be_bytes::<32>());
        encoded.extend_from_slice(&amount_bytes);

        encoded.extend_from_slice(json_data_bytes);

        let data_gas: u128 = encoded.iter().map(|&b| if b == 0 { 4 } else { 16 }).sum();
        let base_gas = 65_000;
        let total_gas = base_gas + data_gas as u64;

        (
            token_in.token_address.clone().unwrap(),
            U256::ZERO,
            encoded,
            format!("0x{:x}", total_gas),
        )
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await
        .unwrap_or_else(|_| ic_cdk::trap("Failed to fetch dynamic gas fees"));

    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction_data = TransactionData {
        tx_type: "eip1559".to_string(),
        blockchain: "Ethereum".to_string(),
        from: args.user_wallet_address,
        to: to_address_str,
        value: format!("0x{:x}", value),
        data: format!("0x{}", hex::encode(data_bytes)),
        gas_limit,
        max_priority_fee_per_gas: format!("0x{:x}", max_priority_fee_per_gas),
        max_fee_per_gas: format!("0x{:x}", max_fee_per_gas),
        nonce: "0x0".to_string(),
        chain_id,
    };

    TransactionResponse { transaction_data }
}

#[update]
pub async fn eth_swap(trx_hash: String) -> SwapResponse {
    if !trx_hash.starts_with("0x") || trx_hash.len() != 66 {
        return SwapResponse::Err("Invalid transaction hash format".to_string());
    }

    let transaction_hash = trx_hash.to_lowercase();
    let target_address = "0x7F7307d895f1242E969a58893ac8594EfC8Ce6E2".to_lowercase();

    let already_exists = SWAP_HISTORY.with(|h| {
        h.borrow().iter().any(|swap| match swap {
            SwapResponse::Ok(data) => {
                data.token_in_tx_hash == transaction_hash
                    || data.token_out_tx_hash == transaction_hash
            }
            SwapResponse::Err(_) => false,
        })
    });

    if already_exists {
        return SwapResponse::Err("Transaction already processed".to_string());
    }

    let tx_result = get_transaction_by_hash_ethereum(&transaction_hash).await;
    let tx_data = match tx_result {
        Ok(tx) => tx,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get transaction data: {}", e));
        }
    };

    let tx_to_address = tx_data
        .get("to")
        .and_then(|v| v.as_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_else(String::new);

    let from_address = tx_data
        .get("from")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let is_valid_transaction = if tx_to_address == target_address {
        true
    } else {
        let input_data = tx_data.get("input").unwrap_or(&serde_json::Value::Null);
        if let Some(input_str) = input_data.as_str() {
            if input_str.len() > 10 && input_str.starts_with("0xa9059cbb") {
                if let Some(recipient_from_input) = decode_erc20_recipient_address(input_str) {
                    recipient_from_input.to_lowercase() == target_address
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        }
    };

    if !is_valid_transaction {
        return SwapResponse::Err(format!(
            "Transaction was not sent to the target address {}",
            target_address
        ));
    }

    let swap_args = match decode_eth_transaction_data(&tx_data, &from_address).await {
        Some(args) => args,
        None => {
            return SwapResponse::Err(
                "Failed to decode swap arguments from transaction data".to_string(),
            );
        }
    };

    let supported_bit10_tokens = get_supported_bit10_tokens();
    let token_out = supported_bit10_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addresses_match(addr, &swap_args.token_out_address))
        });

    let token_out = match token_out {
        Some(t) => t,
        None => {
            return SwapResponse::Err(format!(
                "Token out address '{}' not found in supported BIT10 tokens",
                swap_args.token_out_address
            ));
        }
    };

    let supported_tokens = get_supported_tokens();
    let token_in = supported_tokens
        .iter()
        .find(|t| {
            t.token_address
                .as_deref()
                .map_or(false, |addr| addresses_match(addr, &swap_args.token_in_address))
                && t.token_chain == "Ethereum"
        });

    let token_in = match token_in {
        Some(t) => t,
        None => {
            return SwapResponse::Err(format!(
                "Token in address '{}' not found in supported Ethereum tokens",
                swap_args.token_in_address
            ));
        }
    };

    let actual_amount_received =
        match extract_actual_amount_from_transaction(&tx_data, token_in, &target_address) {
            Ok(amount) => amount,
            Err(e) => {
                return SwapResponse::Err(format!("Failed to extract transaction amount: {}", e));
            }
        };

    let token_in_amount = match u256_to_decimal_string(actual_amount_received, token_in.token_decimals) {
        Ok(amount_str) => amount_str,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to convert amount to decimal: {}", e));
        }
    };

    let token_in_amount_decimal = match Decimal::from_str(&token_in_amount) {
        Ok(amount) => amount,
        Err(_) => {
            return SwapResponse::Err("Failed to parse token_in_amount as decimal".to_string());
        }
    };
    let token_in_amount_without_fee = token_in_amount_decimal / dec!(1.01);

    let token_out_usd_price = match get_bit10_token_price(token_out).await {
        Ok(price) => price,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get token_out USD price: {}", e));
        }
    };

    let token_in_usd_price = match get_token_price_from_feed(token_in).await {
        Ok(price) => price,
        Err(e) => {
            return SwapResponse::Err(format!("Failed to get token_in USD price: {}", e));
        }
    };

    let token_in_usd_amount_value = token_in_amount_without_fee
        * Decimal::from_f64(token_in_usd_price).unwrap_or(Decimal::ZERO);

    let token_out_amount_decimal = match Decimal::from_str(&swap_args.token_out_amount) {
        Ok(amount) => amount,
        Err(_) => {
            return SwapResponse::Err("Failed to parse token_out_amount".to_string());
        }
    };

    let token_out_usd_value = token_out_amount_decimal
        * Decimal::from_f64(token_out_usd_price).unwrap_or(Decimal::ZERO);

    let difference_ratio = if token_in_usd_amount_value > Decimal::ZERO {
        ((token_out_usd_value - token_in_usd_amount_value).abs() / token_in_usd_amount_value)
            * dec!(100)
    } else {
        dec!(100)
    };

    let should_proceed = token_out_usd_value <= token_in_usd_amount_value || difference_ratio <= dec!(3);

    ic_cdk::println!(
        "{} {} {}",
        token_out_usd_value.to_string(),
        token_in_usd_amount_value.to_string(),
        difference_ratio.to_string()
    );

    let (transaction_type, token_out_tx_hash) = if should_proceed {
        match send_bit10_token_to_user(token_out, &from_address, &swap_args.token_out_amount).await
        {
            Ok(tx_hash) => ("Swap".to_string(), tx_hash),
            Err(e) => {
                return SwapResponse::Err(format!("Failed to send BIT10 token: {}", e));
            }
        }
    } else {
        match revert_transaction(token_in, &from_address, actual_amount_received).await {
            Ok(tx_hash) => ("Revert".to_string(), tx_hash),
            Err(e) => {
                return SwapResponse::Err(format!("Failed to revert transaction: {}", e));
            }
        }
    };

    let response_data = SwapResponseData {
        user_wallet_address: from_address.to_lowercase(),
        token_in_address: swap_args.token_in_address.to_lowercase(),
        token_in_amount: token_in_amount,
        token_in_usd_amount: token_in_usd_amount_value.to_string(),
        token_in_tx_hash: trx_hash.to_lowercase(),
        token_out_address: swap_args.token_out_address.to_lowercase(),
        token_out_amount: swap_args.token_out_amount,
        token_out_tx_hash: token_out_tx_hash.to_lowercase(),
        transaction_type: transaction_type,
        transaction_timestamp: ic_cdk::api::time().to_string(),
        network: "Ethereum".to_string(),
    };

    SWAP_HISTORY.with(|h| h.borrow_mut().push(SwapResponse::Ok(response_data.clone())));

    SwapResponse::Ok(response_data)
}

async fn get_transaction_count_ethereum(address: &str) -> Result<u64, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "pending"], "id": 1}}"#,
        address
    );

    match call_rpc_with_retry(json_payload, TATUM_API_KEY).await {
        Ok(body_str) => {
            let response: serde_json::Value = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse nonce response: {}", e))?;

            if let Some(result) = response.get("result").and_then(|v| v.as_str()) {
                let count_hex = result.strip_prefix("0x").unwrap_or(result);
                let count = u64::from_str_radix(count_hex, 16)
                    .map_err(|e| format!("Failed to parse nonce hex: {}", e))?;
                Ok(count)
            } else {
                Err("Failed to get transaction count from response".to_string())
            }
        }
        Err(e) => Err(format!("Failed to get transaction count: {}", e)),
    }
}

async fn sign_and_send_ethereum_transaction(
    transaction: alloy_consensus::TxEip1559,
    wallet: &EthereumWallet,
) -> Result<String, String> {
    use alloy_consensus::SignableTransaction;
    use alloy_eips::eip2718::Encodable2718;
    use alloy_consensus::TxEnvelope;
    use alloy_primitives::Signature;

    let tx_hash_digest = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash_digest).await;

    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("Failed to create signature");
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1}}"#,
        raw_transaction_hex
    );

    match call_rpc_with_retry(json_payload, TATUM_API_KEY).await {
        Ok(response_body) => match serde_json::from_str::<serde_json::Value>(&response_body) {
            Ok(response) => {
                if let Some(error) = response.get("error") {
                    if let Some(message) = error.get("message").and_then(|m| m.as_str()) {
                        if message.contains("already known")
                            || message.contains("ALREADY_EXISTS")
                            || message.contains("replacement transaction underpriced")
                        {
                            return Ok(format!("0x{:x}", raw_transaction_hash));
                        }
                    }
                    return Err(format!("RPC error: {}", error));
                }

                if let Some(result) = response.get("result") {
                    if let Some(tx_hash_str) = result.as_str() {
                        return Ok(tx_hash_str.to_string());
                    }
                }

                Ok(format!("0x{:x}", raw_transaction_hash))
            }
            Err(e) => Err(format!("Failed to parse RPC response: {}", e)),
        },
        Err(e) => Err(format!("Failed to send raw transaction: {}", e)),
    }
}

async fn get_transaction_by_hash_ethereum(tx_hash: &str) -> Result<serde_json::Value, String> {
    let json_payload = format!(
        r#"{{"jsonrpc": "2.0", "method": "eth_getTransactionByHash", "params": ["{}"], "id": 1}}"#,
        tx_hash
    );

    match call_rpc_with_retry(json_payload, TATUM_API_KEY).await {
        Ok(result_str) => {
            let response: serde_json::Value = serde_json::from_str(&result_str)
                .map_err(|e| format!("Failed to parse transaction response: {}", e))?;

            if let Some(result) = response.get("result") {
                if result.is_null() {
                    return Err("Transaction not found (null result)".to_string());
                }
                Ok(result.clone())
            } else if let Some(error) = response.get("error") {
                Err(format!("RPC error: {}", error))
            } else {
                Err("No result or error in transaction response".to_string())
            }
        }
        Err(e) => Err(format!("RPC call for transaction data failed: {}", e)),
    }
}

async fn send_erc20_token_from_canister(
    token_contract: Address,
    to: Address,
    amount: U256,
) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let canister_address = wallet.ethereum_address().to_string();

    let nonce = match get_transaction_count_ethereum(&canister_address).await {
        Ok(n) => n,
        Err(e) => return Err(format!("Failed to fetch nonce: {}", e)),
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await
        .map_err(|e| format!("Failed to get gas fees: {}", e))?;

    let method_id = &hex::decode("a9059cbb").unwrap();
    let mut encoded = method_id.clone();

    let mut to_bytes = [0u8; 32];
    to_bytes[12..].copy_from_slice(to.as_ref());
    encoded.extend_from_slice(&to_bytes);

    let mut amount_bytes = [0u8; 32];
    amount_bytes.copy_from_slice(&amount.to_be_bytes::<32>());
    encoded.extend_from_slice(&amount_bytes);

    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction = alloy_consensus::TxEip1559 {
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

    sign_and_send_ethereum_transaction(transaction, &wallet).await
}

async fn send_native_eth_from_canister(to: Address, amount: U256) -> Result<String, String> {
    let wallet = EthereumWallet::new_canister_wallet().await;
    let canister_address = wallet.ethereum_address().to_string();

    let nonce = match get_transaction_count_ethereum(&canister_address).await {
        Ok(n) => n,
        Err(e) => return Err(format!("Failed to fetch nonce: {}", e)),
    };

    let (max_fee_per_gas, max_priority_fee_per_gas) = get_dynamic_fees().await
        .map_err(|e| format!("Failed to get gas fees: {}", e))?;

    let chain_id = read_state(|s| s.ethereum_network().chain_id());

    let transaction = alloy_consensus::TxEip1559 {
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

    sign_and_send_ethereum_transaction(transaction, &wallet).await
}

async fn send_bit10_token_to_user(
    token: &Token,
    to_address: &str,
    amount_str: &str,
) -> Result<String, String> {
    let amount_decimal = Decimal::from_str(amount_str).map_err(|_| "Failed to parse token amount")?;

    let scale_factor = Decimal::from(10u64.pow(token.token_decimals as u32));
    let amount_in_smallest_unit = (amount_decimal * scale_factor).trunc();
    let amount_u256 = U256::from_str(&amount_in_smallest_unit.to_string())
        .map_err(|_| "Failed to convert amount to U256")?;

    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address: {}", to_address))?;

    let token_contract = Address::from_str(token.token_address.as_deref().unwrap())
        .map_err(|_| "Invalid token contract address")?;

    send_erc20_token_from_canister(token_contract, recipient, amount_u256).await
}

async fn revert_transaction(token: &Token, to_address: &str, amount: U256) -> Result<String, String> {
    let recipient = Address::from_str(to_address)
        .map_err(|_| format!("Invalid recipient address: {}", to_address))?;

    if token.is_native {
        send_native_eth_from_canister(recipient, amount).await
    } else {
        let token_contract = Address::from_str(token.token_address.as_deref().unwrap())
            .map_err(|_| "Invalid token contract address")?;
        send_erc20_token_from_canister(token_contract, recipient, amount).await
    }
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

#[query]
fn get_swap_history() -> Vec<SwapResponse> {
    SWAP_HISTORY.with(|h| h.borrow().clone())
}

#[query]
fn get_swap_history_by_address(address: String) -> Vec<SwapResponse> {
    let search_address = address.to_lowercase();
    SWAP_HISTORY.with(|h| {
        h.borrow()
            .iter()
            .filter(|swap| match swap {
                SwapResponse::Ok(data) => data.user_wallet_address == search_address,
                SwapResponse::Err(_) => false,
            })
            .cloned()
            .collect()
    })
}