use candid::{CandidType, Deserialize, Nat, Principal};
use crate::wallet::bsc_wallet::BscWallet;
use crate::state::read_state;
use crate::utils::parsing::*;
use alloy_primitives::{U256, Bytes};
use num::BigUint;
use std::str::FromStr;
use evm_rpc_canister_types::{BlockTag, EvmRpcCanister, GetTransactionCountArgs, GetTransactionCountResult, MultiGetTransactionCountResult, RequestResult, RpcService, RpcApi, HttpHeader};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use ic_cdk;
use alloy_eips::eip2718::Encodable2718;
use crate::state::BscNetwork;
use crate::wallet::bsc_wallet::BscWallet;
use crate::state::{read_state, BSC_RPC};
use crate::utils::parsing::*;
use alloy_primitives::{hex, Signature, TxKind, U256, Bytes, Address as AlloyAddress};
use std::str::FromStr;

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct BscTransactionInput {
    pub to: String,
    pub value: String,
    pub data: String,
    pub gas_limit: Option<String>,
    pub gas_price: Option<String>,
    pub max_fee_per_gas: Option<String>,
    pub max_priority_fee_per_gas: Option<String>,
}

pub async fn get_balance(address: Option<String>) -> Nat {
    let address = match address {
        Some(addr) => addr,
        None => crate::wallet::bsc_wallet::get_bsc_address(None).await,
    };

    let json = format!(
        r#"{{ "jsonrpc": "2.0", "method": "eth_getBalance", "params": ["{}", "latest"], "id": 1 }}"#,
        address
    );

    let max_response_size_bytes = 500_u64;
    let num_cycles = 1_000_000_000u128;

    let bsc_network = read_state(|s| s.bsc_network());

    let rpc_service = match bsc_network {
        crate::state::BscNetwork::Mainnet => RpcService::Custom(RpcApi {
            url: "https://bsc-dataseed.binance.org/".to_string(),
            headers: None,
        }),
        crate::state::BscNetwork::Testnet => RpcService::Custom(RpcApi {
            url: "https://bsc-testnet.publicnode.com".to_string(),
            headers: None,
        }),
    };

    let response = crate::state::BSC_RPC
        .request(rpc_service, json, max_response_size_bytes, num_cycles)
        .await;

    let (response,) = match response {
        Ok(result) => result,
        Err(e) => {
            ic_cdk::println!("RPC call failed: {:?}", e);
            ic_cdk::trap(&format!("RPC call failed: {:?}", e));
        }
    };

    let hex_balance = match response {
        RequestResult::Ok(balance_result) => {
            let response: serde_json::Value = serde_json::from_str(&balance_result).unwrap_or_else(|e| {
                ic_cdk::println!("Failed to parse balance result: {:?}", e);
                ic_cdk::trap(&format!("Failed to parse balance result: {:?}", e));
            });
            response
                .get("result")
                .and_then(|v| v.as_str())
                .unwrap_or_else(|| {
                    ic_cdk::println!("No result field in response: {:?}", response);
                    ic_cdk::trap("No result field in response");
                })
                .to_string()
        }
        RequestResult::Err(e) => {
            ic_cdk::println!("Received an error response: {:?}", e);
            ic_cdk::trap(&format!("Received an error response: {:?}", e));
        }
    };

    Nat(BigUint::from_str_radix(&hex_balance[2..], 16).unwrap_or_else(|e| {
        ic_cdk::println!("Failed to parse hex balance: {:?}", e);
        ic_cdk::trap(&format!("Failed to parse hex balance: {:?}", e));
    }))
}

pub async fn send_bnb_transaction(tx_input: BscTransactionInput) -> String {
    fn convert_to_alloy_address(address: &str) -> Result<AlloyAddress, String> {
        AlloyAddress::from_str(address).map_err(|e| format!("Failed to parse address: {}", e))
    }

    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() {
        ic_cdk::trap("anonymous principal is not allowed");
    }

    let to_address = convert_to_alloy_address(&tx_input.to).unwrap_or_else(|e| {
        ic_cdk::trap(&format!("failed to parse the recipient address '{}': {}", tx_input.to, e))
    });

    let bsc_network = read_state(|s| s.bsc_network());

    match bsc_network {
        BscNetwork::Mainnet | BscNetwork::Testnet => {}
        _ => {
            ic_cdk::trap("send_bnb_transaction can only be used on BSC mainnet or testnet");
        }
    }

    let chain_id = bsc_network.chain_id();

    async fn get_bnb_transaction_count_with_retry(owner: Principal, max_retries: u32) -> Result<Nat, String> {
        let wallet = BscWallet::new(owner).await;
        let address = wallet.bsc_address().to_string();
        let bsc_network = read_state(|s| s.bsc_network());

        fn get_bnb_rpc_endpoints(bsc_network: BscNetwork) -> Vec<(String, RpcService)> {
            match bsc_network {
                BscNetwork::Mainnet => {
                    vec![
                        ("Tatum-BSC-Mainnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-mainnet.gateway.tatum.io/".to_string(),
                            headers: Some(vec![HttpHeader {
                                name: "x-api-key".to_string(),
                                value: "<API_KEY>".to_string(),
                            }]),
                        })),
                        ("Binance-Public".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-dataseed.binance.org/".to_string(),
                            headers: None,
                        })),
                        ("PublicNode-BSC".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc.publicnode.com".to_string(),
                            headers: None,
                        })),
                    ]
                }
                BscNetwork::Testnet => {
                    vec![
                        ("Tatum-BSC-Testnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-testnet.gateway.tatum.io/".to_string(),
                            headers: Some(vec![HttpHeader {
                                name: "x-api-key".to_string(),
                                value: "<API_KEY>".to_string(),
                            }]),
                        })),
                        ("PublicNode-BSC-Testnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-testnet.publicnode.com".to_string(),
                            headers: None,
                        })),
                    ]
                }
                _ => vec![]
            }
        }

        for attempt in 0..max_retries {
            for (endpoint_name, rpc_service) in &get_bnb_rpc_endpoints(bsc_network) {
                ic_cdk::println!("Attempt {} using endpoint {}", attempt + 1, endpoint_name);

                let json = format!(
                    r#"{{ "jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": ["{}", "latest"], "id": 1 }}"#,
                    address
                );

                let max_response_size_bytes = 2000_u64;
                let num_cycles = 3_000_000_000u128;

                let response = BSC_RPC
                    .request(rpc_service.clone(), json, max_response_size_bytes, num_cycles)
                    .await;

                match response {
                    Ok((response,)) => {
                        match response {
                            RequestResult::Ok(count_result) => {
                                let response: serde_json::Value = serde_json::from_str(&count_result)
                                    .map_err(|e| format!("Failed to parse JSON: {}", e))?;
                                let hex_count = response
                                    .get("result")
                                    .and_then(|v| v.as_str())
                                    .ok_or("No result field in response")?;
                                let count = BigUint::from_str_radix(&hex_count[2..], 16)
                                    .map_err(|e| format!("Failed to parse hex count: {}", e))?;
                                return Ok(Nat(count));
                            }
                            RequestResult::Err(e) => {
                                ic_cdk::println!("RPC error from {}: {:?}", endpoint_name, e);
                                continue;
                            }
                        }
                    }
                    Err(e) => {
                        ic_cdk::println!("HTTP outcall error with {}: {:?}", endpoint_name, e);
                        continue;
                    }
                }
            }
        }
        Err("All retry attempts failed".to_string())
    }

    fn nat_to_u64(nat: Nat) -> u64 {
        use num_traits::cast::ToPrimitive;
        nat.0
            .to_u64()
            .unwrap_or_else(|| ic_cdk::trap(&format!("Nat {} doesn't fit into a u64", nat)))
    }

    let nonce = match get_bnb_transaction_count_with_retry(caller, 3).await {
        Ok(count) => nat_to_u64(count),
        Err(e) => {
            ic_cdk::trap(&format!("Failed to get transaction count after retries: {}", e));
        }
    };

    let value = parse_hex_to_u256(&tx_input.value).unwrap_or_else(|e| {
        ic_cdk::trap(&format!("Failed to parse value '{}': {}", tx_input.value, e))
    });

    let data = parse_hex_to_bytes(&tx_input.data).unwrap_or_else(|e| {
        ic_cdk::trap(&format!("Failed to parse data '{}': {}", tx_input.data, e))
    });

    let gas_limit = if let Some(gl) = &tx_input.gas_limit {
        parse_hex_to_u128(gl).unwrap_or_else(|e| {
            ic_cdk::trap(&format!("Failed to parse gas_limit '{}': {}", gl, e))
        })
    } else {
        500_000u128
    };

    fn get_recommended_gas_price(bsc_network: BscNetwork) -> (u128, u128) {
        match bsc_network {
            BscNetwork::Mainnet => (5_000_000_000, 1_000_000_000),
            BscNetwork::Testnet => (10_000_000_000, 1_500_000_000),
            _ => (50_000_000_000, 1_500_000_000),
        }
    }

    fn parse_decimal_to_u128(decimal_str: &str) -> Result<u128, String> {
        decimal_str.parse::<u128>()
            .map_err(|e| format!("Invalid decimal string: {}", e))
    }

    let (max_fee_per_gas, max_priority_fee_per_gas) = if tx_input.max_fee_per_gas.is_some() || tx_input.max_priority_fee_per_gas.is_some() {
        let max_fee = if let Some(fee) = &tx_input.max_fee_per_gas {
            parse_decimal_to_u128(fee).unwrap_or_else(|e| {
                ic_cdk::trap(&format!("Failed to parse max_fee_per_gas '{}': {}", fee, e))
            })
        } else {
            get_recommended_gas_price(bsc_network).0
        };

        let max_priority_fee = if let Some(fee) = &tx_input.max_priority_fee_per_gas {
            parse_decimal_to_u128(fee).unwrap_or_else(|e| {
                ic_cdk::trap(&format!("Failed to parse max_priority_fee_per_gas '{}': {}", fee, e))
            })
        } else {
            get_recommended_gas_price(bsc_network).1
        };

        (max_fee, max_priority_fee)
    } else if let Some(gas_price) = &tx_input.gas_price {
        let provided_gas_price = parse_decimal_to_u128(gas_price).unwrap_or_else(|e| {
            ic_cdk::trap(&format!("Failed to parse gas_price '{}': {}", gas_price, e))
        });

        let (min_gas_price, min_priority_fee) = get_recommended_gas_price(bsc_network);

        let effective_gas_price = std::cmp::max(provided_gas_price, min_gas_price);
        let priority_fee = std::cmp::max(provided_gas_price / 10, min_priority_fee);

        (effective_gas_price, priority_fee)
    } else {
        get_recommended_gas_price(bsc_network)
    };

    let transaction = alloy_consensus::TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: alloy_primitives::TxKind::Call(to_address),
        value,
        access_list: Default::default(),
        input: data,
    };

    let wallet = BscWallet::new(caller).await;
    let from_address = wallet.bsc_address().to_string();

    ic_cdk::println!(
        "Creating BNB transaction:\n  From: {}\n  To: {}\n  Value: {} wei\n  Gas Limit: {}\n  Max Fee Per Gas: {} wei ({} Gwei)\n  Max Priority Fee: {} wei ({} Gwei)\n  Data Length: {} bytes\n  Nonce: {}",
        from_address,
        tx_input.to,
        value,
        gas_limit,
        max_fee_per_gas,
        max_fee_per_gas / 1_000_000_000,
        max_priority_fee_per_gas,
        max_priority_fee_per_gas / 1_000_000_000,
        transaction.input.len(),
        nonce
    );

    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("BUG: failed to create a signature");
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    alloy_eips::eip2718::Encodable2718::encode_2718(&alloy_consensus::TxEnvelope::from(signed_tx), &mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));

    ic_cdk::println!(
        "Signed transaction hash: {}\nRaw transaction: {}",
        raw_transaction_hash,
        raw_transaction_hex
    );

    async fn send_bnb_transaction_with_better_retry(raw_transaction_hex: &str, bsc_network: BscNetwork, max_retries: u32) -> Result<String, String> {
        fn get_bnb_rpc_endpoints(bsc_network: BscNetwork) -> Vec<(String, RpcService)> {
            match bsc_network {
                BscNetwork::Mainnet => {
                    vec![
                        ("Tatum-BSC-Mainnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-mainnet.gateway.tatum.io/".to_string(),
                            headers: Some(vec![HttpHeader {
                                name: "x-api-key".to_string(),
                                value: "<API_KEY>".to_string(),
                            }]),
                        })),
                        ("Binance-Public".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-dataseed.binance.org/".to_string(),
                            headers: None,
                        })),
                        ("PublicNode-BSC".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc.publicnode.com".to_string(),
                            headers: None,
                        })),
                    ]
                }
                BscNetwork::Testnet => {
                    vec![
                        ("Tatum-BSC-Testnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-testnet.gateway.tatum.io/".to_string(),
                            headers: Some(vec![HttpHeader {
                                name: "x-api-key".to_string(),
                                value: "<API_KEY>".to_string(),
                            }]),
                        })),
                        ("PublicNode-BSC-Testnet".to_string(), RpcService::Custom(RpcApi {
                            url: "https://bsc-testnet.publicnode.com".to_string(),
                            headers: None,
                        })),
                    ]
                }
                _ => vec![]
            }
        }

        let rpc_endpoints = get_bnb_rpc_endpoints(bsc_network);
        let mut last_error = String::new();

        for attempt in 0..max_retries {
            for (endpoint_name, rpc_service) in &rpc_endpoints {
                ic_cdk::println!("Send attempt {} using endpoint {}", attempt + 1, endpoint_name);

                let json = format!(
                    r#"{{ "jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ["{}"], "id": 1 }}"#,
                    raw_transaction_hex
                );

                let max_response_size_bytes = 2000_u64;
                let num_cycles = 5_000_000_000u128;

                let response = BSC_RPC
                    .request(rpc_service.clone(), json, max_response_size_bytes, num_cycles)
                    .await;

                match response {
                    Ok((response,)) => {
                        match response {
                            RequestResult::Ok(tx_result) => {
                                match serde_json::from_str::<serde_json::Value>(&tx_result) {
                                    Ok(json_response) => {
                                        if let Some(error) = json_response.get("error") {
                                            let error_code = error.get("code").and_then(|c| c.as_i64()).unwrap_or(0);
                                            let error_message = error.get("message")
                                                .and_then(|m| m.as_str())
                                                .unwrap_or("Unknown error");

                                            last_error = format!("RPC Error {}: {}", error_code, error_message);
                                            ic_cdk::println!("RPC error from {}: {}", endpoint_name, last_error);

                                            match error_code {
                                                -32000 => {
                                                    if error_message.contains("nonce too low") {
                                                        return Err("Transaction failed: nonce too low (transaction may have already been sent)".to_string());
                                                    } else if error_message.contains("insufficient funds") {
                                                        return Err("Transaction failed: insufficient funds for gas or value".to_string());
                                                    } else if error_message.contains("gas price too low") || error_message.contains("underpriced") {
                                                        return Err("Transaction failed: gas price too low for current network conditions".to_string());
                                                    }
                                                }
                                                -32602 => {
                                                    return Err("Transaction failed: invalid transaction parameters".to_string());
                                                }
                                                _ => {}
                                            }

                                            continue;
                                        }

                                        if let Some(tx_hash) = json_response.get("result").and_then(|v| v.as_str()) {
                                            ic_cdk::println!("Transaction sent successfully via {}: {}", endpoint_name, tx_hash);
                                            return Ok(tx_hash.to_string());
                                        } else {
                                            last_error = "No transaction hash in response".to_string();
                                            continue;
                                        }
                                    }
                                    Err(e) => {
                                        last_error = format!("JSON parse error: {}", e);
                                        ic_cdk::println!("Failed to parse response from {}: {}. Raw: {}", endpoint_name, e, tx_result);
                                        continue;
                                    }
                                }
                            }
                            RequestResult::Err(e) => {
                                last_error = format!("RPC request error: {:?}", e);
                                ic_cdk::println!("RPC request error from {}: {:?}", endpoint_name, e);
                                continue;
                            }
                        }
                    }
                    Err(e) => {
                        last_error = format!("HTTP outcall error: {:?}", e);
                        ic_cdk::println!("HTTP outcall error with {}: {:?}", endpoint_name, e);
                        continue;
                    }
                }
            }

            if attempt < max_retries - 1 {
                ic_cdk::println!("All endpoints failed for attempt {}, retrying...", attempt + 1);
            }
        }

        Err(format!("All send attempts failed. Last error: {}", last_error))
    }

    match send_bnb_transaction_with_better_retry(&raw_transaction_hex, bsc_network, 3).await {
        Ok(tx_hash) => {
            ic_cdk::println!("BNB transaction sent successfully with hash: {}", tx_hash);
            tx_hash
        },
        Err(e) => {
            ic_cdk::println!(
                "Failed to send transaction after retries. Error: {}. Expected tx hash: {}",
                e,
                raw_transaction_hash
            );
            ic_cdk::trap(&format!("Transaction failed: {}", e));
        }
    }
}