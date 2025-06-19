use candid::Nat;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod, TransformContext,
};
use serde_json::json;

pub async fn get_sui_balance_rpc(address: &str) -> Nat {
    let rpc_url = crate::state::read_state(|s| s.rpc_url());
    let json_body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getBalance",
        "params": [address]
    })
    .to_string();

    let request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(json_body.into_bytes()),
        max_response_bytes: Some(1000),
        transform: Some(TransformContext::from_name("transform_sui_response".to_string(), vec![])),
        headers: vec![
            HttpHeader {
                name: "accept".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "content-type".to_string(),
                value: "application/json".to_string(),
            },
        ],
    };

    let cycles = 1_000_000_000u128;
    let (response,) = http_request(request, cycles).await.expect("HTTP request failed");
    let response_body = String::from_utf8(response.body).expect("Invalid UTF-8");
    let json_response: serde_json::Value = serde_json::from_str(&response_body).expect("Invalid JSON");

    let total_balance = json_response
        .get("result")
        .and_then(|r| r.get("totalBalance"))
        .and_then(|v| v.as_str())
        .unwrap_or("0");

    Nat::from(total_balance.parse::<u64>().unwrap_or(0))
}

pub async fn send_sui_rpc(wallet: crate::wallet::sui_wallet::SuiWallet, to: String, amount: Option<Nat>) -> String {
    use candid::Principal;
    use base64;
    use blake2::{Blake2b, Digest as BlakeDigest};
    use sha2::{Sha256, Digest as ShaDigest};

    let sender_address = wallet.sui_address();
    let amount_mist = amount.unwrap_or(Nat::from(100_000_000u64));

    let rpc_url = crate::state::read_state(|s| s.rpc_url());

    let gas_request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getCoins",
        "params": [sender_address, "0x2::sui::SUI", null, null]
    }).to_string();

    let gas_request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(gas_request_body.into_bytes()),
        max_response_bytes: Some(2000),
        transform: Some(TransformContext::from_name("transform_sui_response".to_string(), vec![])),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
        ],
    };

    let cycles = 2_000_000_000u128;
    let (gas_response,) = http_request(gas_request, cycles).await.expect("Failed to get coins");
    let gas_body = String::from_utf8(gas_response.body).expect("Invalid UTF-8");
    let gas_json: serde_json::Value = serde_json::from_str(&gas_body).expect("Invalid JSON");

    let coins = gas_json
        .get("result")
        .and_then(|r| r.get("data"))
        .and_then(|d| d.as_array())
        .expect("No coins data found");

    if coins.is_empty() {
        panic!("No SUI coins available. You need to have SUI in your wallet first.");
    }

    let mut coin_ids = Vec::new();
    let mut total_balance = 0u64;
    for coin in coins {
        let coin_id = coin.get("coinObjectId").and_then(|id| id.as_str()).expect("No coin ID");
        let balance = coin.get("balance").and_then(|b| b.as_str()).and_then(|s| s.parse::<u64>().ok()).expect("No balance");
        coin_ids.push(coin_id);
        total_balance += balance;
    }

    let amount_u64 = amount_mist.0.to_u64().unwrap_or(0);
    if total_balance < amount_u64 {
        panic!("Insufficient balance. Available: {} MIST, Required: {} MIST", total_balance, amount_u64);
    }

    let gas_price_request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getReferenceGasPrice",
        "params": []
    }).to_string();

    let gas_price_request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(gas_price_request_body.into_bytes()),
        max_response_bytes: Some(500),
        transform: Some(TransformContext::from_name("transform_sui_response".to_string(), vec![])),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
        ],
    };

    let (gas_price_response,) = http_request(gas_price_request, cycles).await.expect("Failed to get gas price");
    let gas_price_body = String::from_utf8(gas_price_response.body).expect("Invalid UTF-8");
    let gas_price_json: serde_json::Value = serde_json::from_str(&gas_price_body).expect("Invalid JSON");
    let gas_price = gas_price_json.get("result").and_then(|r| r.as_str()).unwrap_or("1000");

    let tx_request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "unsafe_paySui",
        "params": [
            sender_address,
            coin_ids,
            [to],
            [amount_u64.to_string()],
            gas_price
        ]
    }).to_string();

    let tx_request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(tx_request_body.into_bytes()),
        max_response_bytes: Some(5000),
        transform: Some(TransformContext::from_name("transform_sui_response".to_string(), vec![])),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
        ],
    };

    let (tx_response,) = http_request(tx_request, cycles).await.expect("Failed to create transaction");
    let tx_body = String::from_utf8(tx_response.body).expect("Invalid UTF-8");
    let tx_json: serde_json::Value = serde_json::from_str(&tx_body).expect("Invalid JSON");
    let tx_bytes = tx_json.get("result").and_then(|r| r.get("txBytes")).and_then(|b| b.as_str()).expect("No txBytes");

    let tx_bytes_decoded = base64::decode(tx_bytes).expect("Failed to decode txBytes");
    let mut intent_message = vec![0x01, 0x01, 0x01];
    intent_message.extend_from_slice(&tx_bytes_decoded);

    let mut blake_hasher = Blake2b::<blake2::digest::consts::U32>::new();
    blake_hasher.update(&intent_message);
    let blake2_hash: [u8; 32] = blake_hasher.finalize().into();

    let mut sha_hasher = Sha256::new();
    sha_hasher.update(&blake2_hash);
    let sha256_hash: [u8; 32] = sha_hasher.finalize().into();

    let (signature_bytes, _recovery_id) = wallet.sign_with_ecdsa(sha256_hash).await;
    let compressed_public_key = wallet.as_ref().serialize_sec1(true);

    let mut sui_signature = Vec::new();
    sui_signature.push(0x01);
    sui_signature.extend_from_slice(&signature_bytes);
    sui_signature.extend_from_slice(&compressed_public_key);

    let signature_base64 = base64::encode(&sui_signature);

    let execute_request_body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_executeTransactionBlock",
        "params": [
            tx_bytes,
            [signature_base64],
            {
                "showInput": true,
                "showRawInput": false,
                "showEffects": true,
                "showEvents": true,
                "showObjectChanges": false,
                "showBalanceChanges": true
            },
            "WaitForEffectsCert"
        ]
    }).to_string();

    let execute_request = CanisterHttpRequestArgument {
        url: rpc_url.to_string(),
        method: HttpMethod::POST,
        body: Some(execute_request_body.into_bytes()),
        max_response_bytes: Some(10000),
        transform: Some(TransformContext::from_name("transform_sui_response".to_string(), vec![])),
        headers: vec![
            HttpHeader { name: "accept".to_string(), value: "application/json".to_string() },
            HttpHeader { name: "content-type".to_string(), value: "application/json".to_string() },
        ],
    };

    let (execute_response,) = http_request(execute_request, cycles).await.expect("Failed to execute transaction");
    let execute_body = String::from_utf8(execute_response.body).expect("Invalid UTF-8");
    let execute_json: serde_json::Value = serde_json::from_str(&execute_body).expect("Invalid JSON");

    let tx_digest = execute_json
        .get("result")
        .and_then(|r| r.get("digest"))
        .and_then(|d| d.as_str())
        .or_else(|| {
            execute_json
                .get("result")
                .and_then(|r| r.get("effects"))
                .and_then(|e| e.get("transactionDigest"))
                .and_then(|d| d.as_str())
        })
        .or_else(|| {
            execute_json
                .get("result")
                .and_then(|r| r.as_str())
        })
        .expect("Failed to get transaction digest from response");

    tx_digest.to_string()
}