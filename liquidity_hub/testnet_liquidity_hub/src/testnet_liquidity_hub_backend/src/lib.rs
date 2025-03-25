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
    Nat::from(278_521_692u64) // 2.78521692 Tokens
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

    Nat::from(278_521_692u64) - total_tick_in_amount
}

#[ic_cdk::update]
async fn te_ilp(args: ILPArgs) -> IlpResponse {
    let caller: Principal = ic_cdk::caller();

    let exists = unsafe {
        RESPONSES.as_ref().map_or(false, |responses| {
            responses.values().any(|response| response.tick_in_tx_block == args.tick_in_tx_block)
        })
    };

    if exists {
        return IlpResponse::Err(format!("Transaction {} already processed", args.tick_in_tx_block));
    }

    let tick_out_ledger_canister_id = match args.tick_out_name.as_str() {
        "ckUSDC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return IlpResponse::Err(format!("Unsupported token: {:?}", args.tick_out_name)),
    };

    let mut tick_in_amount_nat = Nat::from(0u64);
    let mut tick_in_user_address = "some-address".to_string();

    match args.tick_in_name.as_str() {
        "BTC" => {
            if args.tick_in_network != "bitcoin_testnet" {
                return IlpResponse::Err("Invalid network for BTC. Expected 'bitcoin_testnet'".to_string());
            }
            
            let url = format!(
                "https://backend-91c09684-367.bit10.app/verify-transaction?txid={}&chain={}&verification_secret=cd64873b47571ffd6517c5c5184bedf",
                args.tick_in_tx_block,
                args.tick_in_network
            );
            
            let request = CanisterHttpRequestArgument {
                url,
                method: HttpMethod::GET,
                body: None,
                headers: vec![],
                transform: None,
                max_response_bytes: Some(2_000_000),
            };
            
            match verify_transaction_with_retry(request.clone()).await {
                Ok(verification) => {
                    if let Some(output) = verification.outputs.iter().find(|o| o.vout == 0) {
                        ic_cdk::println!("Satoshi value for vout 0: {}", output.satoshi);
                        tick_in_amount_nat = Nat::from(output.satoshi);
                    }
                    if let Some(output) = verification.outputs.iter().find(|o| o.vout == 1) {
                        ic_cdk::println!("Address for vout 1: {}", output.address);
                        tick_in_user_address = output.address.clone();
                    }
                },
                Err(e) => {
                    return IlpResponse::Err(format!("Failed to verify transaction: {}", e));
                }
            }
        }
        "SOL" => {
            if args.tick_in_network != "solana_devnet" {
                return IlpResponse::Err("Invalid network for SOL. Expected 'solana_devnet'".to_string());
            }
        }
        _ => {
            return IlpResponse::Err("Invalid tick_in_name. Expected 'BTC' or 'SOL'".to_string());
        }
    }

    let total_tick_in_amount = unsafe {
        RESPONSES.as_ref().map_or(Nat::from(0u64), |responses| {
            responses.values().fold(Nat::from(0u64), |acc, response| {
                acc + response.tick_in_amount.clone()
            })
        })
    };

    let btc_pool = btc_pool_size().await;

    if btc_pool.clone() - total_tick_in_amount.clone() <= tick_in_amount_nat {
        return IlpResponse::Err("BTC in pool Full".to_string());
    }

    ic_cdk::println!("btc_pool is {:?}, total_tick_in_amount is {:?} and tick_in_amount_nat is {:?}", btc_pool, total_tick_in_amount, tick_in_amount_nat);

    let price_feed_canister = Principal::from_text("qj77p-wiaaa-aaaao-a3wla-cai")
    .expect("Invalid price feed canister principal");

    let data_id = match args.tick_in_name.as_str() {
        "BTC" => "01JJ6Z5FV8CD9A32ZNWN2ECZ1K",
        _ => return IlpResponse::Err(format!("Unsupported token: {}", args.tick_in_name)),
    };

    let price_result: Result<(Option<PriceFeed>,), _> = ic_cdk::call(
        price_feed_canister,
        "get_value",
        (data_id,)
    ).await;

    let price_feed = match price_result {
        Ok((Some(feed),)) => feed,
        Ok((None,)) => return IlpResponse::Err("Price feed not found".to_string()),
        Err(e) => return IlpResponse::Err(format!("Failed to get price feed: {:?}", e)),
    };

    let tick_in_value = match ciborium::from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value as f64,
        Err(_) => {
            match ciborium::from_reader::<u64, _>(&price_feed.value[..]) {
                Ok(int_value) => int_value as f64,
                Err(e) => return IlpResponse::Err(format!("Failed to decode CBOR price: {}", e)),
            }
        }
    };

    ic_cdk::println!("tick_in_value is {:?}", tick_in_value);

    let result = tick_in_amount_nat.0.to_u64().unwrap_or(0) as f64 * tick_in_value;
    let result_nat = Nat::from(result as u64);
    let result_f64 = result / 100_000_000.0;
    
    ic_cdk::println!("Calculated result: {}", result_nat);

    ic_cdk::println!(
        "Transferring {} amount of {} to account {}",
        result_nat,
        tick_out_ledger_canister_id,
        caller,
    );

    let transfer_args: TransferArg = TransferArg {
        memo: None,
        amount: NumTokens::from(result_nat.clone()),
        from_subaccount: None,
        fee: None,
        to: caller.into(),
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
        Principal::from_text(tick_out_ledger_canister_id).expect("Could not decode the principal."),
        "icrc1_transfer",
        (transfer_args,),
    )
    .await;

    let block_index = match transfer_result {
        Ok((Ok(block_index),)) => {
            ic_cdk::println!("Transfer successful, block index: {}", block_index);
            block_index
        }
        Ok((Err(transfer_error),)) => {
            ic_cdk::println!("Transfer failed: {:?}", transfer_error);
            return IlpResponse::Err(format!("Transfer failed: {:?}", transfer_error));
        }
        Err((rejection_code, message)) => {
            ic_cdk::println!("Call failed: {:?} - {}", rejection_code, message);
            return IlpResponse::Err(format!("Call failed: {:?} - {}", rejection_code, message));
        }
    };

    ic_cdk::println!("Block index: {}", block_index);

    let response_data = IlpResponseData {
        tick_in_address: tick_in_user_address,
        tick_in_name: args.tick_in_name,
        tick_in_amount: tick_in_amount_nat,
        tick_in_usd_amount: result_f64,
        tick_in_network: args.tick_in_network,
        tick_in_tx_block: args.tick_in_tx_block,
        tick_out_address: caller,
        tick_out_name: args.tick_out_name,
        tick_out_amount: result_nat,
        tick_out_usd_amount: result_f64,
        tick_out_network: "ICP".to_string(),
        tick_out_tx_block: block_index.to_string(),
        liquidation_type: "Instant Liquidity".to_string(),
        transaction_timestamp: ic_cdk::api::time().to_string(),
    };

    unsafe {
        let index = RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
        RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
    }

    IlpResponse::Ok(response_data)
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
    let caller: Principal = ic_cdk::caller();

    let tick_in_ledger_canister_id = match args.tick_in_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return SLPResponse::Err(format!("Unsupported token: {:?}", args.tick_in_name)),
    };

    ic_cdk::println!("tick_in_ledger_canister_id is {:?}", tick_in_ledger_canister_id);

    // Approve the icrc2_approve before this from the frontend
    let to_account = Account {
        owner: ic_cdk::id(),
        subaccount: None,
    };

    let transfer_args = TransferFromArgs {
        from: Account {
            owner: caller,
            subaccount: None,
        },
        to: to_account.clone(),
        spender_subaccount: None,
        amount: args.tick_in_amount.clone().into(),
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferFromArgs,), (Result<BlockIndex, TransferFromError>,)>(
        Principal::from_text(tick_in_ledger_canister_id).expect("Could not decode the principal."),
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await;

    let tick_in_transfer_result = match transfer_result {
        Ok((Ok(block_index),)) => block_index,
        Ok((Err(e),)) => {
            ic_cdk::println!("tick_in_transfer_result failed: {:?}", e);
            return SLPResponse::Err(format!("Transfer failed for tick_in_transfer_result: {:?}", e));
        },
        Err(e) => {
            ic_cdk::println!("tick_in_transfer_result failed: {:?}", e);
            return SLPResponse::Err(format!("Call failed: {:?}", e));
        },
    };

    let response_data = SLPResponseData {
        tick_in_name: args.tick_in_name,
        tick_in_amount: args.tick_in_amount,
        duration: args.duration,
        tick_in_block: tick_in_transfer_result,
        tick_in_address: caller,
        tick_in_timestamp: ic_cdk::api::time().to_string(),
    };

    unsafe {
        let index = SLP_RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
        SLP_RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
    }

    SLPResponse::Ok(response_data)
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
    let caller: Principal = ic_cdk::caller();

    let slp_responses = get_slp_responses();
    let previous_withdrawals = get_slp_withdraw_responses();
    
    let filtered_responses: Vec<&SLPResponseData> = slp_responses.iter()
        .filter(|response| 
            response.tick_in_address == caller &&
            response.tick_in_name == args.tick_out_name
        )
        .collect();

    let current_time = ic_cdk::api::time();
    ic_cdk::println!("Current time: {}", current_time);
    
    let mut total_available = Nat::from(0u64);
    
    for response in &filtered_responses {
        let start_time = match response.tick_in_timestamp.parse::<u64>() {
            Ok(time) => {
                ic_cdk::println!("Start time for response: {}", time);
                time
            },
            Err(_) => continue,
        };
        
        let duration_ns = response.duration.0.to_u64().unwrap_or(0) * 24 * 60 * 60 * 1_000_000_000;
        ic_cdk::println!("Duration in ns: {}", duration_ns);
        
        let unlock_time = start_time + duration_ns;
        ic_cdk::println!("Unlock time: {}", unlock_time);
        
        if current_time >= unlock_time {
            total_available += response.tick_in_amount.clone();
            ic_cdk::println!("Adding {} to total available amount", response.tick_in_amount);
        } else {
            let remaining_time = unlock_time - current_time;
            let remaining_seconds = remaining_time / 1_000_000_000;
            let remaining_hours = remaining_seconds / 3600;
            let remaining_minutes = (remaining_seconds % 3600) / 60;
            ic_cdk::println!(
                "Response still locked for {} hours and {} minutes", 
                remaining_hours, 
                remaining_minutes
            );
        }
    }

    let total_withdrawn: Nat = previous_withdrawals.iter()
        .filter(|w| w.tick_out_address == caller && w.tick_out_name == args.tick_out_name)
        .fold(Nat::from(0u64), |acc, w| acc + w.tick_out_amount.clone());

    ic_cdk::println!("Total available amount: {}", total_available);
    ic_cdk::println!("Total already withdrawn: {}", total_withdrawn);

    let remaining_withdrawable = if total_available > total_withdrawn {
        total_available.clone() - total_withdrawn.clone()
    } else {
        Nat::from(0u64)
    };

    if args.tick_out_amount > remaining_withdrawable {
        return SLPWithdrawResponse::Err(format!(
            "Insufficient withdrawable balance. Available: {}, Requested: {}, Already withdrawn: {}",
            remaining_withdrawable, args.tick_out_amount, total_withdrawn
        ));
    }

    let total_after_withdrawal = total_withdrawn.clone() + args.tick_out_amount.clone();
    if total_after_withdrawal > total_available {
        return SLPWithdrawResponse::Err(format!(
            "Withdrawal would exceed total available balance. Available: {}, Requested: {}, Already withdrawn: {}",
            total_available, args.tick_out_amount, total_withdrawn
        ));
    }

    let tick_out_ledger_canister_id = match args.tick_out_name.as_str() {
        "BIT10.BTC" => BIT10_BTC_LEDGER_CANISTER_ID,
        _ => return SLPWithdrawResponse::Err(format!("Unsupported token: {:?}", args.tick_out_name)),
    };

    let transfer_args = TransferArg {
        memo: None,
        amount: NumTokens::from(args.tick_out_amount.clone()),
        from_subaccount: None,
        fee: None,
        to: caller.into(),
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
            return SLPWithdrawResponse::Err(format!("Transfer failed: {:?}", e));
        },
        Err(e) => {
            return SLPWithdrawResponse::Err(format!("Call failed: {:?}", e));
        },
    };

    let response_data = SLPWithdrawResponseData {
        tick_out_name: args.tick_out_name,
        tick_out_amount: args.tick_out_amount,
        tick_out_block: Nat::from(block_index),
        tick_out_address: caller,
        tick_out_time: ic_cdk::api::time().to_string(),
    };

    unsafe {
        let index = SLP_WITHDRAW_RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
        SLP_WITHDRAW_RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
    }

    SLPWithdrawResponse::Ok(response_data)
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
