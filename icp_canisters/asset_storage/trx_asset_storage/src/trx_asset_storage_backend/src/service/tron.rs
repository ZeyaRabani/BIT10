use crate::{
    state::{read_state, init_state},
    types::{Nat, TronNetwork},
    utils::principal::principal_to_tron_address,
};
use candid::Principal;
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
};
use sha2::{Sha256, Digest};
use crate::utils::principal::principal_to_tron_address;
use crate::wallet::bsc_wallet::TronWallet;

pub async fn tron_address_impl(owner: Option<Principal>) -> String {
    let owner = owner.unwrap_or_else(ic_cdk::caller);
    principal_to_tron_address(&owner)
}

pub async fn get_tron_balance_impl(address: Option<String>) -> Result<Nat, String> {
    let address = match address {
        Some(addr) => addr,
        None => principal_to_tron_address(&ic_cdk::caller()),
    };

    let tron_network = read_state(|s| s.tron_network());
    let (api_url, api_key) = match tron_network {
        TronNetwork::Mainnet => (
            "https://tron-mainnet.gateway.tatum.io",
            "<API_KEY>",
        ),
        TronNetwork::Nile => (
            "https://tron-testnet.gateway.tatum.io",
            "<API_KEY>",
        ),
    };

    let balance_request_body = format!(
        r#"{{
            "address": "{}",
            "visible": true
        }}"#,
        address
    );

    let balance_request = CanisterHttpRequestArgument {
        url: format!("{}/wallet/getaccount", api_url),
        method: HttpMethod::POST,
        body: Some(balance_request_body.into_bytes()),
        max_response_bytes: Some(2000),
        transform: None,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "accept".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "x-api-key".to_string(),
                value: api_key.to_string(),
            },
        ],
    };

    let cycles = 2_000_000_000u128;
    match http_request(balance_request, cycles).await {
        Ok((response,)) => {
            if response.status == 200u32 {
                let body = String::from_utf8(response.body)
                    .map_err(|e| format!("Failed to parse balance response body: {:?}", e))?;
                let json_response: serde_json::Value = serde_json::from_str(&body)
                    .map_err(|e| format!("Failed to parse balance JSON response: {:?}", e))?;
                let balance = json_response["balance"]
                    .as_u64()
                    .ok_or_else(|| "Failed to get balance from response".to_string())?;
                Ok(Nat::from(balance))
            } else {
                Err(format!("Balance request failed with status: {}", response.status))
            }
        }
        Err((code, message)) => Err(format!("Balance request failed: {:?} - {}", code, message)),
    }
}

pub async fn send_trx_impl(to: String, amount: Nat) -> Result<String, String> {
    let caller = ic_cdk::caller();
    let wallet = TronWallet::new(caller).await;
    let from_address = wallet.tron_address();

    let amount_sun = nat_to_u64(amount);
    if amount_sun == 0 {
        return Err("Amount must be greater than 0".to_string());
    }

    let tron_network = read_state(|s| s.tron_network());
    let (api_url, api_key) = match tron_network {
        TronNetwork::Mainnet => (
            "https://tron-mainnet.gateway.tatum.io",
            "<API_KEY>",
        ),
        TronNetwork::Nile => (
            "https://tron-testnet.gateway.tatum.io",
            "<API_KEY>",
        ),
    };

    let create_tx_body = format!(
        r#"{{
            "owner_address": "{}",
            "to_address": "{}",
            "amount": {},
            "visible": true
        }}"#,
        from_address, to, amount_sun
    );

    let create_tx_request = CanisterHttpRequestArgument {
        url: format!("{}/wallet/createtransaction", api_url),
        method: HttpMethod::POST,
        body: Some(create_tx_body.into_bytes()),
        max_response_bytes: Some(4000),
        transform: None,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "accept".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "x-api-key".to_string(),
                value: api_key.to_string(),
            },
        ],
    };

    let cycles = 3_000_000_000u128;
    let create_response = match http_request(create_tx_request, cycles).await {
        Ok((response,)) => {
            if response.status == 200u32 {
                let body = String::from_utf8(response.body)
                    .map_err(|e| format!("Failed to parse create transaction response: {:?}", e))?;
                let json_response: serde_json::Value = serde_json::from_str(&body)
                    .map_err(|e| format!("Failed to parse create transaction JSON: {:?}", e))?;
                if let Some(error) = json_response.get("Error") {
                    return Err(format!("Transaction creation failed: {}", error));
                }
                json_response
            } else {
                return Err(format!("Create transaction failed with status: {}", response.status));
            }
        }
        Err((code, message)) => {
            return Err(format!("Create transaction request failed: {:?} - {}", code, message));
        }
    };

    let tx_id = create_response["txID"]
        .as_str()
        .ok_or_else(|| "Failed to get txID from response".to_string())?;
    let raw_data_hex = create_response["raw_data_hex"]
        .as_str()
        .ok_or_else(|| "Failed to get raw_data_hex from response".to_string())?;

    let raw_data_hex_clean = if raw_data_hex.starts_with("0x") {
        &raw_data_hex[2..]
    } else {
        raw_data_hex
    };
    let raw_data = hex::decode(raw_data_hex_clean)
        .map_err(|e| format!("Failed to decode raw_data_hex: {:?}", e))?;

    let mut hasher = Sha256::new();
    hasher.update(&raw_data);
    let tx_hash: [u8; 32] = hasher.finalize().into();

    let signature_with_recovery = wallet.sign_with_ecdsa_enhanced(tx_hash).await;
    let signature_hex = hex::encode(&signature_with_recovery);

    let signed_tx_body = format!(
        r#"{{
            "raw_data": {},
            "raw_data_hex": "{}",
            "txID": "{}",
            "signature": ["{}"],
            "visible": true
        }}"#,
        create_response["raw_data"],
        raw_data_hex,
        tx_id,
        signature_hex
    );

    let broadcast_request = CanisterHttpRequestArgument {
        url: format!("{}/wallet/broadcasttransaction", api_url),
        method: HttpMethod::POST,
        body: Some(signed_tx_body.into_bytes()),
        max_response_bytes: Some(2000),
        transform: None,
        headers: vec![
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "accept".to_string(),
                value: "application/json".to_string(),
            },
            HttpHeader {
                name: "x-api-key".to_string(),
                value: api_key.to_string(),
            },
        ],
    };

    match http_request(broadcast_request, cycles).await {
        Ok((response,)) => {
            let body = String::from_utf8(response.body)
                .map_err(|e| format!("Failed to parse broadcast response: {:?}", e))?;
            if response.status == 200u32 {
                let json_response: serde_json::Value = serde_json::from_str(&body)
                    .map_err(|e| format!("Failed to parse broadcast JSON: {:?}", e))?;
                let result = json_response["result"].as_bool().unwrap_or(false);
                if result {
                    Ok(tx_id.to_string())
                } else {
                    let message = json_response["message"]
                        .as_str()
                        .unwrap_or("Unknown error");
                    Err(format!("Transaction broadcast failed: {}", message))
                }
            } else {
                Err(format!("Broadcast failed with status: {} - Response: {}", response.status, body))
            }
        }
        Err((code, message)) => {
            Err(format!("Broadcast request failed: {:?} - {}", code, message))
        }
    }
}

fn nat_to_u64(nat: Nat) -> u64 {
    use num_traits::cast::ToPrimitive;
    nat.0
        .to_u64()
        .unwrap_or_else(|| ic_cdk::trap(&format!("Nat {} doesn't fit into a u64", nat)))
}
