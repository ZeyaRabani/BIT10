use ic_cdk::api::management_canister::http_request::{HttpMethod, http_request, CanisterHttpRequestArgument};
use crate::constants::{HTTP_REQUEST_CYCLES, MAX_RETRY_COUNT, RETRY_INTERVAL_SECONDS};
use crate::state::storage::{RETRY_COUNT, RETRY_RESULT, TIMER_ID};
use ic_cdk_timers;
use std::time::Duration;

pub async fn retry_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    match http_request(request.clone(), HTTP_REQUEST_CYCLES).await {
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

pub fn start_retry_interval(request: CanisterHttpRequestArgument) {
    let secs = Duration::from_secs(RETRY_INTERVAL_SECONDS);
    ic_cdk::println!("Starting retry timer with {secs:?} interval...");
    
    let timer_id = ic_cdk_timers::set_timer_interval(secs, {
        let request = request.clone();
        move || {
            ic_cdk::spawn({
                let request = request.clone();
                async move {
                    if let Some(Ok(response_body)) = RETRY_RESULT.with(|result| result.borrow().clone()) {
                        if let Ok(verification) = serde_json::from_slice::<crate::models::common::VerificationResponse>(&response_body) {
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
                        if *count >= MAX_RETRY_COUNT {
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
                            if RETRY_COUNT.with(|count| *count.borrow() >= MAX_RETRY_COUNT) {
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

pub async fn make_http_request(request: CanisterHttpRequestArgument) -> Result<Vec<u8>, String> {
    RETRY_COUNT.with(|count| *count.borrow_mut() = 0);
    RETRY_RESULT.with(|result| *result.borrow_mut() = None);
    
    match retry_http_request(request.clone()).await {
        Ok(response_body) => Ok(response_body),
        Err(e) if e.contains("HTTP error: status 500") => {
            start_retry_interval(request);
            
            loop {
                let _: () = ic_cdk::api::call::call_with_payment128(
                    ic_cdk::api::management_canister::main::CanisterIdRecord { 
                        canister_id: ic_cdk::id() 
                    },
                    "raw_rand",
                    (),
                    HTTP_REQUEST_CYCLES
                ).await.unwrap_or_default();
                
                if let Some(result) = RETRY_RESULT.with(|result| result.borrow().clone()) {
                    return result;
                }
            }
        },
        Err(e) => Err(e),
    }
}
