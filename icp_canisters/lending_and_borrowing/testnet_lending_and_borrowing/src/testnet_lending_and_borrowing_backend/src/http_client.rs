use ic_cdk::api::management_canister::http_request::{
    CanisterHttpRequestArgument, HttpMethod, HttpResponse, TransformArgs, TransformContext,
};
use ic_cdk::api::call::call;
use serde_json::Value;


pub async fn fetch_interest_rate() -> Result<String, String> {
    let url = "";
    let host = "";

    let request_headers = vec![
        ("Host".to_string(), host.to_string()),
        ("User-Agent".to_string(), "ic-lend-borrow-canister".to_string()),
    ];

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::GET,
        headers: request_headers,
        body: None,
        max_response_bytes: Some(2000),
        transform: Some(TransformContext::new(transform_http_response, vec![])),
    };

    let management_canister_principal = Principal::from_text("aaaaa-aa").unwrap();

    let (response,): (HttpResponse,) = match call(
        management_canister_principal,
        "http_request",
        (request,),
    )
    .await
    {
        Ok(res) => res,
        Err((r, msg)) => {
            return Err(format!("Failed to make HTTP request: {:?} - {}", r, msg));
        }
    };

    let response_body = String::from_utf8(response.body)
        .map_err(|e| format!("Failed to parse HTTP response body as UTF-8: {}", e))?;

    let parsed_json: Value = serde_json::from_str(&response_body)
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    parsed_json["interest_rate"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Could not find 'interest_rate' in JSON response".to_string())
}

#[ic_cdk::query]
fn transform_http_response(args: TransformArgs) -> HttpResponse {
    let mut res = HttpResponse {
        status: args.response.status,
        headers: Vec::new(),
        body: args.response.body,
    };

    if res.status != 200 {
        res.body.clear();
    } else if res.body.len() > 1024 {
        res.body.truncate(1024);
    }
    res
}