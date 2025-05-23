mod ecdsa;
mod ethereum_wallet;
mod state;

use crate::ethereum_wallet::EthereumWallet;
use crate::state::{init_state, read_state};
use alloy_consensus::{SignableTransaction, TxEip1559, TxEnvelope};
use alloy_primitives::{hex, Signature, TxKind, U256};
use candid::{CandidType, Deserialize, Nat, Principal};
use evm_rpc_canister_types::{
    BlockTag, EthMainnetService, EthSepoliaService, EvmRpcCanister, GetTransactionCountArgs,
    GetTransactionCountResult, MultiGetTransactionCountResult, RequestResult, RpcService,
};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};
use ic_cdk::{init, update};
use ic_ethereum_types::Address;
use num::{BigUint, Num};
use std::str::FromStr;
use std::env;
use reqwest;

use crate::{
    evm::utils::{get_rpc_service, get_signer},
    IUniswapV3SwapRouter, UNISWAP_V3_SWAP_ROUTER,
};
use alloy::{
    network::EthereumWallet,
    primitives::{aliases::U24, Address, U160, U256},
    providers::ProviderBuilder,
    transports::icp::IcpConfig,
};

use alloy_eips::eip2718::Encodable2718;

pub const EVM_RPC_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01"); // 7hfb6-caaaa-aaaar-qadga-cai
pub const EVM_RPC: EvmRpcCanister = EvmRpcCanister(EVM_RPC_CANISTER_ID);

#[init]
pub fn init(maybe_init: Option<InitArg>) {
    if let Some(init_arg) = maybe_init {
        init_state(init_arg)
    }
}

const USDC_ADDRESS: &str = "0xf08a50178dfcde18524640ea6618a1f965821715";

#[update]
pub async fn ethereum_address(owner: Option<Principal>) -> String {
    let caller = validate_caller_not_anonymous();
    let owner = owner.unwrap_or(caller);
    let wallet = EthereumWallet::new(owner).await;
    wallet.ethereum_address().to_string()
}

#[update]
pub async fn get_balance(address: Option<String>) -> Nat {
    let address = address.unwrap_or(ethereum_address(None).await);

    let json = format!(
        r#"{{ "jsonrpc": "2.0", "method": "eth_getBalance", "params": ["{}", "latest"], "id": 1 }}"#,
        address
    );

    let max_response_size_bytes = 500_u64;
    let num_cycles = 1_000_000_000u128;

    let ethereum_network = read_state(|s| s.ethereum_network());

    let rpc_service = match ethereum_network {
        EthereumNetwork::Mainnet => RpcService::EthMainnet(EthMainnetService::PublicNode),
        EthereumNetwork::Sepolia => RpcService::EthSepolia(EthSepoliaService::PublicNode),
    };

    let (response,) = EVM_RPC
        .request(rpc_service, json, max_response_size_bytes, num_cycles)
        .await
        .expect("RPC call failed");

    let hex_balance = match response {
        RequestResult::Ok(balance_result) => {
            // The response to a successful `eth_getBalance` call has the following format:
            // { "id": "[ID]", "jsonrpc": "2.0", "result": "[BALANCE IN HEX]" }
            let response: serde_json::Value = serde_json::from_str(&balance_result).unwrap();
            response
                .get("result")
                .and_then(|v| v.as_str())
                .unwrap()
                .to_string()
        }
        RequestResult::Err(e) => panic!("Received an error response: {:?}", e),
    };

    // Remove the "0x" prefix before converting to a decimal number.
    Nat(BigUint::from_str_radix(&hex_balance[2..], 16).unwrap())
}

#[update]
pub async fn transaction_count(owner: Option<Principal>, block: Option<BlockTag>) -> Nat {
    let caller = validate_caller_not_anonymous();
    let owner = owner.unwrap_or(caller);
    let wallet = EthereumWallet::new(owner).await;
    let rpc_services = read_state(|s| s.evm_rpc_services());
    let args = GetTransactionCountArgs {
        address: wallet.ethereum_address().to_string(),
        block: block.unwrap_or(BlockTag::Finalized),
    };
    let (result,) = EVM_RPC
        .eth_get_transaction_count(rpc_services, None, args.clone(), 2_000_000_000_u128)
        .await
        .unwrap_or_else(|e| {
            panic!(
                "failed to get transaction count for {:?}, error: {:?}",
                args, e
            )
        });
    match result {
        MultiGetTransactionCountResult::Consistent(consistent_result) => match consistent_result {
            GetTransactionCountResult::Ok(count) => count,
            GetTransactionCountResult::Err(error) => {
                ic_cdk::trap(&format!("failed to get transaction count for {:?}, error: {:?}",args, error))
            }
        },
        MultiGetTransactionCountResult::Inconsistent(inconsistent_results) => {
            ic_cdk::trap(&format!("inconsistent results when retrieving transaction count for {:?}. Received results: {:?}", args, inconsistent_results))
        }
    }
}

#[update]
pub async fn send_eth(to: String, amount: Nat) -> String {
    use alloy_eips::eip2718::Encodable2718;

    let caller = validate_caller_not_anonymous();
    let _to_address = Address::from_str(&to).unwrap_or_else(|e| {
        ic_cdk::trap(&format!("failed to parse the recipient address: {:?}", e))
    });
    let chain_id = read_state(|s| s.ethereum_network().chain_id());
    let nonce = nat_to_u64(transaction_count(Some(caller), Some(BlockTag::Latest)).await);
    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees();

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(to.parse().expect("failed to parse recipient address")),
        value: nat_to_u256(amount),
        access_list: Default::default(),
        input: Default::default(),
    };

    let wallet = EthereumWallet::new(caller).await;
    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("BUG: failed to create a signature");
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));
    ic_cdk::println!(
        "Sending raw transaction hex {} with transaction hash {}",
        raw_transaction_hex,
        raw_transaction_hash
    );
    // The canister is sending a signed statement, meaning a malicious provider could only affect availability.
    // For demonstration purposes, the canister uses a single provider to send the signed transaction,
    // but in production multiple providers (e.g., using a round-robin strategy) should be used to avoid a single point of failure.
    let single_rpc_service = read_state(|s| s.single_evm_rpc_service());
    let (result,) = EVM_RPC
        .eth_send_raw_transaction(
            single_rpc_service,
            None,
            raw_transaction_hex.clone(),
            2_000_000_000_u128,
        )
        .await
        .unwrap_or_else(|e| {
            panic!(
                "failed to send raw transaction {}, error: {:?}",
                raw_transaction_hex, e
            )
        });
    ic_cdk::println!(
        "Result of sending raw transaction {}: {:?}. \
    Due to the replicated nature of HTTPs outcalls, an error such as transaction already known or nonce too low could be reported, \
    even though the transaction was successfully sent. \
    Check whether the transaction appears on Etherscan or check that the transaction count on \
    that address at latest block height did increase.",
        raw_transaction_hex,
        result
    );

    raw_transaction_hash.to_string()
}

#[update]
pub async fn swap(
    token_in: Address,
    token_out: Address,
    fee: U24,
    amount_in: U256,
    amount_out_minimum: U256,
) -> Result<String, String> {
    let (signer, recipient) = get_signer();
    let wallet = EthereumWallet::from(signer);
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new()
        .with_recommended_fillers()
        .wallet(wallet)
        .on_icp(config);

    let args = IUniswapV3SwapRouter::ExactInputSingleParams {
        tokenIn: token_in,
        tokenOut: token_out,
        fee,
        recipient,
        amountIn: amount_in,
        amountOutMinimum: amount_out_minimum,
        sqrtPriceLimitX96: U160::from(0),
    };

    let v3_swap_router = IUniswapV3SwapRouter::new(UNISWAP_V3_SWAP_ROUTER, provider.clone());

    match v3_swap_router.exactInputSingle(args).send().await {
        Ok(res) => Ok(format!("{}", res.tx_hash())),
        Err(e) => Err(e.to_string()),
    }
}

#[update]
pub async fn swap_tokens(
    token_in: Address,
    token_out: Address,
    amount_in: U256,
    fee: U24,
) -> Result<String, String> {
    let (signer, recipient) = get_signer();
    let wallet = EthereumWallet::from(signer);
    let rpc_service = get_rpc_service();
    let config = IcpConfig::new(rpc_service);
    let provider = ProviderBuilder::new()
        .with_recommended_fillers()
        .wallet(wallet)
        .on_icp(config);

    let args = IUniswapV3SwapRouter::ExactInputSingleParams {
        tokenIn: token_in,
        tokenOut: token_out,
        fee,
        recipient,
        amountIn: amount_in,
        amountOutMinimum: U256::from(0),
        sqrtPriceLimitX96: U160::from(0),
    };

    let v3_swap_router = IUniswapV3SwapRouter::new(UNISWAP_V3_SWAP_ROUTER, provider.clone());

    match v3_swap_router.exactInputSingle(args).send().await {
        Ok(res) => Ok(format!("{}", res.tx_hash())),
        Err(e) => Err(e.to_string()),
    }
}

fn estimate_transaction_fees() -> (u128, u128, u128) {
    /// Standard gas limit for an Ethereum transfer to an EOA.
    /// Other transactions, in particular ones interacting with a smart contract (e.g., ERC-20), would require a higher gas limit.
    const GAS_LIMIT: u128 = 700_000;

    /// Very crude estimates of max_fee_per_gas and max_priority_fee_per_gas.
    /// A real world application would need to estimate this more accurately by for example fetching the fee history from the last 5 blocks.
    const MAX_FEE_PER_GAS: u128 = 50_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;
    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub ethereum_network: Option<EthereumNetwork>,
    pub ecdsa_key_name: Option<EcdsaKeyName>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum EthereumNetwork {
    Mainnet,
    #[default]
    Sepolia,
}

impl EthereumNetwork {
    pub fn chain_id(&self) -> u64 {
        match self {
            EthereumNetwork::Mainnet => 1,
            EthereumNetwork::Sepolia => 11155111,
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum EcdsaKeyName {
    #[default]
    TestKeyLocalDevelopment,
    TestKey1,
    ProductionKey1,
}

impl From<&EcdsaKeyName> for EcdsaKeyId {
    fn from(value: &EcdsaKeyName) -> Self {
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: match value {
                EcdsaKeyName::TestKeyLocalDevelopment => "dfx_test_key",
                EcdsaKeyName::TestKey1 => "test_key_1",
                EcdsaKeyName::ProductionKey1 => "key_1",
            }
            .to_string(),
        }
    }
}

pub fn validate_caller_not_anonymous() -> Principal {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        panic!("anonymous principal is not allowed");
    }
    principal
}

fn nat_to_u64(nat: Nat) -> u64 {
    use num_traits::cast::ToPrimitive;
    nat.0
        .to_u64()
        .unwrap_or_else(|| ic_cdk::trap(&format!("Nat {} doesn't fit into a u64", nat)))
}

fn nat_to_u256(value: Nat) -> U256 {
    let value_bytes = value.0.to_bytes_be();
    assert!(
        value_bytes.len() <= 32,
        "Nat does not fit in a U256: {}",
        value
    );
    let mut value_u256 = [0u8; 32];
    value_u256[32 - value_bytes.len()..].copy_from_slice(&value_bytes);
    U256::from_be_bytes(value_u256)
}

#[update]
pub async fn send_erc20(to: String, amount: Nat, token_address: String) -> String {
    use alloy_eips::eip2718::Encodable2718;

    let caller = validate_caller_not_anonymous();
    let to_address = Address::from_str(&to).unwrap_or_else(|e| {
        ic_cdk::trap(&format!("failed to parse the recipient address: {:?}", e))
    });
    let chain_id = read_state(|s| s.ethereum_network().chain_id());
    let nonce = nat_to_u64(transaction_count(Some(caller), Some(BlockTag::Latest)).await);
    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees();

    let mut input_data = hex::decode("a9059cbb").unwrap();
    
    let to_address_str = to_address.to_string();
    let to_address_bytes = hex::decode(&to_address_str[2..]).unwrap();
    
    let mut address_bytes = [0u8; 32];
    address_bytes[12..32].copy_from_slice(&to_address_bytes);
    input_data.extend_from_slice(&address_bytes);
    
    let amount_u256 = nat_to_u256(amount);
    let amount_bytes = amount_u256.to_be_bytes::<32>();
    input_data.extend_from_slice(&amount_bytes);

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(token_address.parse().expect("failed to parse token address")),
        value: U256::from(0),
        access_list: Default::default(),
        input: Bytes::from(input_data),
    };

    let wallet = EthereumWallet::new(caller).await;
    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .expect("BUG: failed to create a signature");
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", hex::encode(&tx_bytes));
    ic_cdk::println!(
        "Sending raw transaction hex {} with transaction hash {}",
        raw_transaction_hex,
        raw_transaction_hash
    );
    let single_rpc_service = read_state(|s| s.single_evm_rpc_service());
    let (result,) = EVM_RPC
        .eth_send_raw_transaction(
            single_rpc_service,
            None,
            raw_transaction_hex.clone(),
            2_000_000_000_u128,
        )
        .await
        .unwrap_or_else(|e| {
            panic!(
                "failed to send raw transaction {}, error: {:?}",
                raw_transaction_hex, e
            )
        });
    ic_cdk::println!(
        "Result of sending raw transaction {}: {:?}. \
    Due to the replicated nature of HTTPs outcalls, an error such as transaction already known or nonce too low could be reported, \
    even though the transaction was successfully sent. \
    Check whether the transaction appears on Etherscan or check that the transaction count on \
    that address at latest block height did increase.",
        raw_transaction_hex,
        result
    );

    raw_transaction_hash.to_string()
}

#[update]
pub async fn rebalance() -> Result<(), String> {
    let api_endpoint = env::var("REBALANCE_API_URL").map_err(|e| format!("Failed to read REBALANCE_API_URL: {}", e))?;
    
    let response = reqwest::get(&api_endpoint)
        .await
        .map_err(|e| format!("Failed to fetch data from API: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    let price_of_token_to_buy = response["test_bit10_top_rebalance"][0]["priceOfTokenToBuy"].as_f64().unwrap_or(0.0);
    let previous_tokens = response["test_bit10_top_rebalance"][0]["previousTokens"].as_array().unwrap_or(&vec![]);
    let new_tokens = response["test_bit10_top_rebalance"][0]["newTokens"].as_array().unwrap_or(&vec![]);

    for previous_token in previous_tokens {
        let token_id = previous_token["id"].as_u64().unwrap_or(0);
        let token_name = previous_token["name"].as_str().unwrap_or("Unknown");
        
        let amount_to_swap = calculate_amount_to_swap(price_of_token_to_buy);

        match swap_tokens(previous_token["address"].as_str().unwrap_or(""), new_tokens[0]["address"].as_str().unwrap_or(""), amount_to_swap).await {
            Ok(tx_hash) => {
                ic_cdk::println!("Successfully swapped {} (ID: {}) for amount: {}. Transaction Hash: {}", token_name, token_id, amount_to_swap, tx_hash);
            }
            Err(e) => {
                ic_cdk::println!("Failed to swap {} (ID: {}): {}", token_name, token_id, e);
            }
        }
    }

    Ok(())
}

fn calculate_amount_to_swap(price_of_token_to_buy: f64) -> Nat {
    Nat::from(price_of_token_to_buy as u64)
}
