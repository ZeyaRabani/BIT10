//1. IMPORT IC MANAGEMENT CANISTER
//This includes all methods and types needed
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse, TransformArgs,
    TransformContext,
};

use ic_cdk_macros::{self, query, update};
use serde::{Serialize, Deserialize};
use serde_json::{self, Value};

use ic_cdk::api::call::call_with_payment;
use ic_cdk::call;
use candid::{Nat, Principal, candid_method};

//Update method using the HTTPS outcalls feature 
#[ic_cdk::update]
async fn bit10_oracle() -> String {
    //2. SETUP ARGUMENTS FOR HTTP GET request

    // 2.1 Setup the URL for CoinGecko API
    let coingecko_url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=conflux-token";

    // 2.2 prepare headers for the system http_request call
    let request_headers = vec![
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "exchange_rate_canister".to_string(),
        },
    ];

    //note "CanisterHttpRequestArgument" and "HttpMethod" are declared in line 4
    let request = CanisterHttpRequestArgument {
        url: coingecko_url.to_string(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: None,
        transform: Some(TransformContext::new(transform, vec![])),
        headers: request_headers.clone(),
    };

    //3. MAKE HTTPS REQUEST AND WAIT FOR RESPONSE
    match http_request(request).await {
        //4. DECODE AND RETURN THE RESPONSE
        Ok((response,)) => {
            // Decode the response body into a string
            let str_body = String::from_utf8(response.body)
                .expect("Transformed response is not UTF-8 encoded.");

            // Parse the JSON response
            let data: Value = serde_json::from_str(&str_body)
                .expect("Failed to parse JSON response.");

            // Extract the current_price from the JSON response
            let current_price = data[0]["current_price"].as_f64().unwrap_or_default();

            // Make HTTP requests to Coinbase API to get the value of STX-USD, ICP-USD, and RIF-USD
            let coinbase_urls = vec![
                "https://api.coinbase.com/v2/prices/STX-USD/buy",
                "https://api.coinbase.com/v2/prices/ICP-USD/buy",
                "https://api.coinbase.com/v2/prices/RIF-USD/buy",
                "https://api.coinbase.com/v2/prices/MAPO-USD/buy"
            ];
            let mut total_amount = 0.0;

            for url in coinbase_urls {
                let coinbase_request_headers = vec![
                    HttpHeader {
                        name: "User-Agent".to_string(),
                        value: "exchange_rate_canister".to_string(),
                    },
                ];
                let coinbase_request = CanisterHttpRequestArgument {
                    url: url.to_string(),
                    method: HttpMethod::GET,
                    body: None,
                    max_response_bytes: None,
                    transform: Some(TransformContext::new(transform, vec![])),
                    headers: coinbase_request_headers.clone(),
                };

                match http_request(coinbase_request).await {
                    Ok((coinbase_response,)) => {
                        // Decode the response body into a string
                        let coinbase_str_body = String::from_utf8(coinbase_response.body)
                            .expect("Transformed response is not UTF-8 encoded.");

                        // Parse the JSON response from Coinbase API
                        let coinbase_data: Value = serde_json::from_str(&coinbase_str_body)
                            .expect("Failed to parse JSON response from Coinbase.");

                        // Extract the amount from the JSON response
                        let amount = coinbase_data["data"]["amount"].as_str().unwrap_or_default().parse::<f64>().unwrap_or_default();

                        total_amount += amount;
                    }
                    Err((r, m)) => {
                        let message =
                            format!("The http_request to Coinbase for {} resulted into error. RejectionCode: {r:?}, Error: {m}", url);

                        //Return the error as a string and end the method
                        return message;
                    }
                }
            }

            // Calculate the average value
            let average = (current_price + total_amount) / 6.0;

            // Return the average as a string
            average.to_string()
        }
        Err((r, m)) => {
            let message =
                format!("The http_request resulted into error. RejectionCode: {r:?}, Error: {m}");

            //Return the error as a string and end the method
            message
        }
    }
}

// Strips unnecessary data from the original response.
#[query]
fn transform(raw: TransformArgs) -> HttpResponse {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        HttpHeader {
            name: "Referrer-Policy".to_string(),
            value: "strict-origin".to_string(),
        },
        HttpHeader {
            name: "Permissions-Policy".to_string(),
            value: "geolocation=(self)".to_string(),
        },
        HttpHeader {
            name: "Strict-Transport-Security".to_string(),
            value: "max-age=63072000".to_string(),
        },
        HttpHeader {
            name: "X-Frame-Options".to_string(),
            value: "DENY".to_string(),
        },
        HttpHeader {
            name: "X-Content-Type-Options".to_string(),
            value: "nosniff".to_string(),
        },
    ];

    let res = HttpResponse {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers,
        ..Default::default()
    };

    res
}

#[ic_cdk::query]
async fn bit10_defi_total_supply_of_token_available() -> u64 {
    // 7100000000 // 71 Tokens
    // 2785216926 // 27.85216926 Tokens
    4177825388 // 41.77825388 Tokens
}

#[ic_cdk::update]
async fn bit10_defi_total_token_bought() -> Result<Nat, String> {
    let canister_id = Principal::from_text("bin4j-cyaaa-aaaap-qh7tq-cai").map_err(|e| e.to_string())?;
    
    match call::<(), (Nat,)>(canister_id, "icrc1_total_supply", ()).await {
        Ok((total_supply,)) => Ok(total_supply),
        Err((code, msg)) => Err(format!("Error calling icrc1_total_supply: {:?} - {}", code, msg)),
    }
}

#[ic_cdk::update]
async fn bit10_defi_total_token_available_for_buying() -> Result<Nat, String> {
    let canister_id = Principal::from_text("bin4j-cyaaa-aaaap-qh7tq-cai").map_err(|e| e.to_string())?;
    
    match call::<(), (Nat,)>(canister_id, "icrc1_total_supply", ()).await {
        Ok((total_supply,)) => Ok(Nat::from(4177825388u64) - total_supply),
        Err((code, msg)) => Err(format!("Error calling icrc1_total_supply: {:?} - {}", code, msg)),
    }
}