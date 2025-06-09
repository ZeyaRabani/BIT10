use ic_cdk::api::management_canister::http_request::{HttpMethod, CanisterHttpRequestArgument};
use crate::services::http::make_http_request;
use crate::state::storage::VERIFICATION_RETRY_COUNT;
use crate::models::common::VerificationResponse;

pub async fn verify_transaction_with_retry(request: CanisterHttpRequestArgument) -> Result<VerificationResponse, String> {
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
                                ic_cdk::api::management_canister::main::CanisterIdRecord { 
                                    canister_id: ic_cdk::id() 
                                },
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
