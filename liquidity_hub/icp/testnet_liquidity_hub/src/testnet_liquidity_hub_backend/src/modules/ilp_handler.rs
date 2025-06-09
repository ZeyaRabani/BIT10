use candid::{Principal, Nat};
use ic_cdk::api::management_canister::http_request::{HttpMethod, CanisterHttpRequestArgument};
use icrc_ledger_types::icrc1::transfer::{BlockIndex, NumTokens, TransferArg, TransferError};
use crate::constants::*;
use crate::modules::{ILPArgs, IlpResponse, IlpResponseData, PriceFeed};
use crate::services::verification::verify_transaction_with_retry;
use crate::state::storage::RESPONSES;

pub async fn handle_ilp(args: ILPArgs) -> IlpResponse {
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

    let (tick_in_amount_nat, tick_in_user_address) = match process_tick_in(&args).await {
        Ok(result) => result,
        Err(e) => return IlpResponse::Err(e),
    };

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

    let price_feed = match get_price_feed().await {
        Ok(feed) => feed,
        Err(e) => return IlpResponse::Err(e),
    };

    let (result_nat, result_f64) = calculate_result(tick_in_amount_nat, price_feed);

    match transfer_tokens(caller, result_nat.clone(), tick_out_ledger_canister_id).await {
        Ok(block_index) => {
            let response_data = create_response_data(
                args,
                caller,
                tick_in_user_address,
                tick_in_amount_nat,
                result_nat,
                result_f64,
                block_index,
            );

            unsafe {
                let index = RESPONSES.as_ref().map_or(0, |r| r.len() as u64);
                RESPONSES.as_mut().unwrap().insert(index, response_data.clone());
            }

            IlpResponse::Ok(response_data)
        }
        Err(e) => IlpResponse::Err(e),
    }
}

async fn process_tick_in(args: &ILPArgs) -> Result<(Nat, String), String> {
    let mut tick_in_amount_nat = Nat::from(0u64);
    let mut tick_in_user_address = "some-address".to_string();

    match args.tick_in_name.as_str() {
        "BTC" => {
            if args.tick_in_network != "bitcoin_testnet" {
                return Err("Invalid network for BTC. Expected 'bitcoin_testnet'".to_string());
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
                        tick_in_amount_nat = Nat::from(output.satoshi);
                    }
                    if let Some(output) = verification.outputs.iter().find(|o| o.vout == 1) {
                        tick_in_user_address = output.address.clone();
                    }
                },
                Err(e) => return Err(format!("Failed to verify transaction: {}", e)),
            }
        }
        "SOL" => {
            if args.tick_in_network != "solana_devnet" {
                return Err("Invalid network for SOL. Expected 'solana_devnet'".to_string());
            }
        }
        _ => return Err("Invalid tick_in_name. Expected 'BTC' or 'SOL'".to_string()),
    }

    Ok((tick_in_amount_nat, tick_in_user_address))
}

async fn get_price_feed() -> Result<PriceFeed, String> {
    let price_result: Result<(Option<PriceFeed>,), _> = ic_cdk::call(
        PRICE_FEED_CANISTER_ID,
        "get_value",
        ("01JJ6Z5FV8CD9A32ZNWN2ECZ1K",)
    ).await;

    match price_result {
        Ok((Some(feed),)) => Ok(feed),
        Ok((None,)) => Err("Price feed not found".to_string()),
        Err(e) => Err(format!("Failed to get price feed: {:?}", e)),
    }
}

fn calculate_result(tick_in_amount_nat: Nat, price_feed: PriceFeed) -> (Nat, f64) {
    let tick_in_value = match ciborium::from_reader::<f64, _>(&price_feed.value[..]) {
        Ok(value) => value as f64,
        Err(_) => {
            match ciborium::from_reader::<u64, _>(&price_feed.value[..]) {
                Ok(int_value) => int_value as f64,
                Err(_) => 0.0,
            }
        }
    };

    let result = tick_in_amount_nat.0.to_u64().unwrap_or(0) as f64 * tick_in_value;
    let result_nat = Nat::from(result as u64);
    let result_f64 = result / 100_000_000.0;

    (result_nat, result_f64)
}

async fn transfer_tokens(
    caller: Principal,
    amount: Nat,
    canister_id: Principal,
) -> Result<BlockIndex, String> {
    let transfer_args: TransferArg = TransferArg {
        memo: None,
        amount: NumTokens::from(amount),
        from_subaccount: None,
        fee: None,
        to: caller.into(),
        created_at_time: None,
    };

    let transfer_result = ic_cdk::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(
        canister_id,
        "icrc1_transfer",
        (transfer_args,),
    )
    .await;

    match transfer_result {
        Ok((Ok(block_index),)) => Ok(block_index),
        Ok((Err(e),)) => Err(format!("Transfer failed: {:?}", e)),
        Err((code, msg)) => Err(format!("Call failed: {:?} - {}", code, msg)),
    }
}

fn create_response_data(
    args: ILPArgs,
    caller: Principal,
    tick_in_user_address: String,
    tick_in_amount_nat: Nat,
    result_nat: Nat,
    result_f64: f64,
    block_index: BlockIndex,
) -> IlpResponseData {
    IlpResponseData {
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
    }
}
