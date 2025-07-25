mod constants;
mod modules;
mod services;
mod state;

use candid::{CandidType, Deserialize, Principal};
use candid::Nat;
use serde;
use num_traits::cast::ToPrimitive;
use ic_cdk::api::management_canister::http_request::{HttpMethod, http_request, CanisterHttpRequestArgument};
use ic_cdk_timers;
use std::cell::RefCell;
use std::time::Duration;
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use ic_cdk::storage;
use std::collections::BTreeMap;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};

use crate::constants::*;
use crate::modules::*;
use crate::services::http::*;
use crate::services::verification::*;
use crate::state::storage::*;

pub use modules::*;

thread_local! {
    static RETRY_COUNT: RefCell<u8> = RefCell::new(0);
    static RETRY_RESULT: RefCell<Option<Result<Vec<u8>, String>>> = RefCell::new(None);
    static VERIFICATION_RETRY_COUNT: RefCell<u8> = RefCell::new(0);
    static TIMER_ID: RefCell<Option<ic_cdk_timers::TimerId>> = RefCell::new(None);
}

type StableResponses = BTreeMap<u64, IlpResponseData>;
static mut RESPONSES: Option<StableResponses> = None;

type StableSLPResponses = BTreeMap<u64, SLPResponseData>;
static mut SLP_RESPONSES: Option<StableSLPResponses> = None;

type StableSLPWithdrawResponses = BTreeMap<u64, SLPWithdrawResponseData>;
static mut SLP_WITHDRAW_RESPONSES: Option<StableSLPWithdrawResponses> = None;

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    unsafe {
        let responses_vec = RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());
        let slp_responses_vec = SLP_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());
        let slp_withdraw_responses_vec = SLP_WITHDRAW_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());

        storage::stable_save((responses_vec, slp_responses_vec, slp_withdraw_responses_vec))
            .expect("Failed to save responses to stable storage");
    }
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    unsafe {
        RESPONSES = Some(StableResponses::new());
        SLP_RESPONSES = Some(StableSLPResponses::new());
        SLP_WITHDRAW_RESPONSES = Some(StableSLPWithdrawResponses::new());

        if let Ok((responses_vec, slp_responses_vec, slp_withdraw_responses_vec)) = 
            storage::stable_restore::<(Vec<IlpResponseData>, Vec<SLPResponseData>, Vec<SLPWithdrawResponseData>)>() 
        {
            for (index, response) in responses_vec.into_iter().enumerate() {
                RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
            for (index, response) in slp_responses_vec.into_iter().enumerate() {
                SLP_RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
            for (index, response) in slp_withdraw_responses_vec.into_iter().enumerate() {
                SLP_WITHDRAW_RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
        }
    }
}

#[derive(Deserialize)]
struct Output {
    vout: u32,
    satoshi: u64,
    address: String,
}

#[derive(Deserialize)]
struct VerificationResponse {
    outputs: Vec<Output>,
    verified: bool,
    message: String,
}

#[derive(candid::CandidType, serde::Deserialize, Clone)]
struct ILPArgs {
    tick_in_name: String,
    tick_in_network: String,
    tick_in_tx_block: String,
    tick_out_name: String,
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone)]
struct IlpResponseData {
    tick_in_address: String,
    tick_in_name: String,
    tick_in_amount: Nat,
    tick_in_usd_amount: f64,
    tick_in_network: String,
    tick_in_tx_block: String,
    tick_out_address: Principal,
    tick_out_name: String,
    tick_out_amount: Nat,
    tick_out_usd_amount: f64,
    tick_out_network: String,
    tick_out_tx_block: String,
    liquidation_type: String,
    transaction_timestamp: String,
}

#[derive(candid::CandidType, serde::Serialize)]
enum IlpResponse {
    Ok(IlpResponseData),
    Err(String),
}

#[derive(CandidType, Deserialize)]
struct PriceFeed {
    id: FeedId,
    value: Vec<u8>,
    timestamp: u64,
}

#[derive(CandidType, Deserialize)]
struct FeedId {
    id: String,
}

#[derive(candid::CandidType, serde::Deserialize, Clone)]
struct SLPArgs {
    tick_in_name: String,
    tick_in_amount: Nat,
    duration: Nat,
}

#[derive(candid::CandidType, serde::Serialize)]
enum SLPResponse {
    Ok(SLPResponseData),
    Err(String),
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone)]
struct SLPResponseData {
    tick_in_name: String,
    tick_in_amount: Nat,
    duration: Nat,
    tick_in_block: Nat,
    tick_in_address: Principal,
    tick_in_timestamp: String
}

#[derive(candid::CandidType, serde::Deserialize, Clone)]
struct SLPWithdrawArgs {
    tick_out_name: String,
    tick_out_amount: Nat,
}

#[derive(candid::CandidType, serde::Serialize)]
enum SLPWithdrawResponse {
    Ok(SLPWithdrawResponseData),
    Err(String),
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone)]
struct SLPWithdrawResponseData {
    tick_out_name: String,
    tick_out_amount: Nat,
    tick_out_block: Nat,
    tick_out_address: Principal,
    tick_out_time: String,
}

#[derive(candid::CandidType, serde::Deserialize, Clone)]
struct TransferFromCanisterArgs {
    tick_out_name: String,
    tick_out_amount: Nat,
    tick_out_duration: Nat,
    tick_out_address: Principal,
}

#[derive(candid::CandidType, serde::Serialize)]
enum TransferFromCanisterResponse {
    Ok(TransferFromCanisterResponseData),
    Err(String),
}

#[derive(candid::CandidType, serde::Serialize, serde::Deserialize, Clone)]
struct TransferFromCanisterResponseData {
    tick_out_name: String,
    tick_out_amount: Nat,
    tick_out_address: Principal,
    tick_out_caller: Principal,
    tick_out_block: Nat,
    tick_out_time: String,
}

const BIT10_BTC_LEDGER_CANISTER_ID: &str = "eegan-kqaaa-aaaap-qhmgq-cai"; // mainnet

async fn retry_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
        let cycles: u128 = 25_000_000_000;
        match http_request(request.clone(), cycles).await {
            Ok((response,)) => {
                if response.status.0.to_u64().unwrap_or(0) == 200 {
                Ok(response.body)
            } else {
                Err(format!("HTTP error: status {}", response.status))
            }
        },
        Err((_, msg)) => {
            if msg.contains("No consensus could be reached") {
                ic_cdk::println!("Consensus error, retrying immediately...");
                return Box::pin(retry_http_request(request)).await;
            }
            Err(format!("Failed API Response error: {}", msg))
        }
    }
}

fn start_retry_interval(request: CanisterHttpRequestArgument) {
    // let secs = Duration::from_secs(30); // 30 sec.
    let secs = Duration::from_secs(1800); // 30min.
    ic_cdk::println!("Starting retry timer with {secs:?} interval...");
    
    let timer_id = ic_cdk_timers::set_timer_interval(secs, {
        let request = request.clone();
        move || {
            ic_cdk::spawn({
                let request = request.clone();
                async move {
                    if let Some(Ok(response_body)) = RETRY_RESULT.with(|result| result.borrow().clone()) {
                        if let Ok(verification) = serde_json::from_slice::<VerificationResponse>(&response_body) {
                            if verification.message.contains("Transaction verified successfully") ||
                               verification.message.contains("First output address does not match expected address") {
                                ic_cdk::println!("Stopping retries as transaction is verified or address mismatch");
                                TIMER_ID.with(|timer| {
                                    if let Some(timer_id) = timer.borrow_mut().take() {
                                        ic_cdk_timers::clear_timer(timer_id);
                                    }
                                });
                                return;
                            }
                        }
                    }

                    RETRY_COUNT.with(|count| {
                        let mut count = count.borrow_mut();
                        if *count >= 5 {
                            ic_cdk::println!("Max retries reached");
                            RETRY_RESULT.with(|result| *result.borrow_mut() = Some(Err("Max retries reached".to_string())));
                            return;
                        }
                        *count += 1;
                        ic_cdk::println!("Retry attempt {} for request: {}", count, request.url);
                    });

                    match retry_http_request(request.clone()).await {
                        Ok(response_body) => {
                            RETRY_RESULT.with(|result| *result.borrow_mut() = Some(Ok(response_body)));
                            ic_cdk::println!("Request succeeded on retry");
                        },
                        Err(e) => {
                            ic_cdk::println!("Retry failed: {}", e);
                            if RETRY_COUNT.with(|count| *count.borrow() >= 5) {
                                RETRY_RESULT.with(|result| *result.borrow_mut() = Some(Err(e)));
                            }
                        }
                    }
                }
            });
        }
    });

    TIMER_ID.with(|timer| *timer.borrow_mut() = Some(timer_id));
}

async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    RETRY_COUNT.with(|count| *count.borrow_mut() = 0);
    RETRY_RESULT.with(|result| *result.borrow_mut() = None);
    
    match retry_http_request(request.clone()).await {
        Ok(response_body) => Ok(response_body),
        Err(e) if e.contains("HTTP error: status 500") => {
            start_retry_interval(request);
            
            loop {
                let _: () = ic_cdk::api::call::call_with_payment128(
                    Principal::management_canister(),
                    "raw_rand",
                    (),
                    25_000_000_000
                ).await.unwrap_or_default();
                
                if let Some(result) = RETRY_RESULT.with(|result| result.borrow().clone()) {
                    return result;
                }
            }
        },
        Err(e) => Err(e),
    }
}

async fn verify_transaction_with_retry(request: CanisterHttpRequestArgument) -> Result<VerificationResponse, String> {
    VERIFICATION_RETRY_COUNT.with(|count| *count.borrow_mut() = 0);
    
    loop {
        match make_http_request(request.clone()).await {
            Ok(response_body) => {
                match serde_json::from_slice::<VerificationResponse>(&response_body) {
                    Ok(verification) => {
                        if verification.verified {
                            return Ok(verification);
                        } else if verification.message.contains("First output address does not match expected address") {
                            return Err("First output address does not match expected address".to_string());
                        } else if verification.message.contains("Transaction not confirmed yet") {
                            let should_retry = VERIFICATION_RETRY_COUNT.with(|count| {
                                let mut count = count.borrow_mut();
                                if *count >= 5 {
                                    return false;
                                }
                                *count += 1;
                                ic_cdk::println!("Transaction not confirmed yet, retry {} in 30 min", count);
                                true
                            });
                            
                            if !should_retry {
                                return Err("Max verification retries reached".to_string());
                            }
                            
                            let _: () = ic_cdk::api::call::call_with_payment128(
                                Principal::management_canister(),
                                "raw_rand",
                                (),
                                25_000_000_000
                            ).await.unwrap_or_default();
                            
                            continue;
                        } else {
                            return Err(verification.message);
                        }
                    },
                    Err(e) => return Err(format!("Failed to parse verification response: {}", e)),
                }
            },
            Err(e) => return Err(e),
        }
    }
}

#[ic_cdk::query]
async fn btc_pool_size() -> Nat {
    Nat::from(BTC_POOL_SIZE)
}

#[ic_cdk::query]
async fn btc_required_pool_size() -> Nat {
    let total_tick_in_amount = unsafe {
        RESPONSES.as_ref().map_or(Nat::from(0u64), |responses| {
            responses.values().fold(Nat::from(0u64), |acc, response| {
                acc + response.tick_in_amount.clone()
            })
        })
    };

    Nat::from(BTC_POOL_SIZE) - total_tick_in_amount
}

#[ic_cdk::update]
async fn te_ilp(args: ILPArgs) -> IlpResponse {
    handle_ilp(args).await
}

#[ic_cdk::query]
fn get_responses() -> Vec<IlpResponseData> {
    unsafe {
        RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect())
    }
}

#[ic_cdk::query]
fn get_response(tx_block: String) -> Option<IlpResponseData> {
    unsafe {
        RESPONSES.as_ref().and_then(|responses| {
            responses.values()
                .find(|response| response.tick_in_tx_block == tx_block)
                .cloned()
        })
    }
}

#[ic_cdk::update]
async fn te_slp(args: SLPArgs) -> SLPResponse {
    handle_slp(args).await
}

#[ic_cdk::query]
fn get_slp_responses() -> Vec<SLPResponseData> {
    unsafe {
        SLP_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect())
    }
}

#[ic_cdk::query]
fn get_slp_responses_by_principal(principal: Principal) -> Vec<SLPResponseData> {
    unsafe {
        SLP_RESPONSES.as_ref().map_or(Vec::new(), |responses| {
            responses.values()
                .filter(|response| response.tick_in_address == principal)
                .cloned()
                .collect()
        })
    }
}

#[ic_cdk::update]
async fn te_slp_withdraw(args: SLPWithdrawArgs) -> SLPWithdrawResponse {
    handle_slp_withdraw(args).await
}

#[ic_cdk::query]
fn get_slp_withdraw_responses() -> Vec<SLPWithdrawResponseData> {
    unsafe {
        SLP_WITHDRAW_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect())
    }
}

#[ic_cdk::query]
fn get_slp_withdraw_responses_by_principal(principal: Principal) -> Vec<SLPWithdrawResponseData> {
    unsafe {
        SLP_WITHDRAW_RESPONSES.as_ref().map_or(Vec::new(), |responses| {
            responses.values()
                .filter(|response| response.tick_out_address == principal)
                .cloned()
                .collect()
        })
    }
}

#[ic_cdk::update]
async fn te_transfer_from_canister(args: TransferFromCanisterArgs) -> TransferFromCanisterResponse {
    let caller: Principal = ic_cdk::caller();
    
    let canister_id = ic_cdk::id();
    let controllers = match ic_cdk::api::management_canister::main::canister_status(
        ic_cdk::api::management_canister::main::CanisterIdRecord { canister_id }
    ).await {
        Ok((status,)) => status.settings.controllers,
        Err((code, msg)) => {
            return TransferFromCanisterResponse::Err(format!(
                "Failed to get canister status: {:?} - {}", code, msg
            ));
        }
    };

    if !controllers.contains(&caller) {
        return TransferFromCanisterResponse::Err(
            "Only the canister controller can call this method".to_string()
        );
    }

    let slp_responses = get_slp_responses();

    let filtered_responses: Vec<&SLPResponseData> = slp_responses.iter()
        .filter(|response| response.tick_in_name == args.tick_out_name)
        .collect();

    let current_time = ic_cdk::api::time();
    let mut total_available = Nat::from(0u64);

    for response in &filtered_responses {
        let start_time = match response.tick_in_timestamp.parse::<u64>() {
            Ok(time) => time,
            Err(_) => continue,
        };

        let duration_ns = response.duration.0.to_u64().unwrap_or(0) * 24 * 60 * 60 * 1_000_000_000;
        let unlock_time = start_time + duration_ns;

        if current_time < unlock_time {
            total_available += response.tick_in_amount.clone();
        }
    }

    let tick_out_duration_ns = args.tick_out_duration.0.to_u64().unwrap_or(0) * 24 * 60 * 60 * 1_000_000_000;

    if total_available < args.tick_out_amount {
        return TransferFromCanisterResponse::Err(format!(
            "Insufficient available balance. Available: {}, Requested: {}",
            total_available, args.tick_out_amount
        ));
    }

    if tick_out_duration_ns == 0 {
        return TransferFromCanisterResponse::Err("Invalid duration".to_string());
    }

    let tick_out_ledger_canister_id = match args.tick_out_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return TransferFromCanisterResponse::Err(format!("Unsupported token: {:?}", args.tick_out_name)),
    };

    let transfer_args = TransferArg {
        memo: None,
        amount: NumTokens::from(args.tick_out_amount.clone()),
        from_subaccount: None,
        fee: None,
        to: args.tick_out_address.into(),
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
        Principal::from_text(tick_out_ledger_canister_id).expect("Could not decode the principal."),
        "icrc1_transfer",
        (transfer_args,),
    )
    .await;

    let block_index = match transfer_result {
        Ok((Ok(block_index),)) => block_index,
        Ok((Err(e),)) => {
            return TransferFromCanisterResponse::Err(format!("Transfer failed: {:?}", e));
        },
        Err(e) => {
            return TransferFromCanisterResponse::Err(format!("Call failed: {:?}", e));
        },
    };

    let response_data = TransferFromCanisterResponseData {
        tick_out_name: args.tick_out_name,
        tick_out_amount: args.tick_out_amount,
        tick_out_address: args.tick_out_address,
        tick_out_caller: caller,
        tick_out_block: Nat::from(block_index),
        tick_out_time: ic_cdk::api::time().to_string(),
    };
    
    TransferFromCanisterResponse::Ok(response_data)
}

ic_cdk::export_candid!();
