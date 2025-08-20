use candid::{CandidType, Deserialize, Nat};
use rust_decimal::Decimal;
use serde::Deserialize as SerdeDeserialize;
use alloy_primitives::U256;
use std::str::FromStr;

#[derive(CandidType, serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct CreateTransactionArgs {
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub expected_amount_out: String,
    pub slippage: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionData {
    pub from: String,
    pub to: String,
    pub value: String,
    pub data: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct TransactionResponse {
    pub transaction_data: TransactionData,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Token {
    pub token_id: String,
    pub token_name: String,
    pub token_symbol: String,
    pub token_address: Option<String>,
    pub token_chain: String,
    pub token_decimals: u8,
    pub is_native: bool,
    pub is_active: bool,
    pub price_feed_id: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct Pair {
    pub pool_id: String,
    pub token_a_symbol: String,
    pub token_a_chain: String,
    pub token_a_token_id: String,
    pub token_b_symbol: String,
    pub token_b_chain: String,
    pub token_b_token_id: String,
    pub pair_type: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PriceFeed {
    pub id: PriceFeedId,
    pub value: Vec<u8>,
    pub timestamp: u64,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct PriceFeedId {
    pub id: String,
}

#[derive(CandidType, Deserialize, Debug, Clone, serde::Serialize)]
pub struct SwapResponse {
    pub pool_id: String,
    pub tick_in_wallet_address: String,
    pub tick_out_wallet_address: String,
    pub swap_type: String,
    pub source_chain: String,
    pub destination_chain: String,
    pub token_in_address: String,
    pub token_out_address: String,
    pub amount_in: String,
    pub amount_out: String,
    pub slippage: String,
    pub tx_hash_in: String,
    pub tx_hash_out: String,
    pub status: String,
    pub timestamp: u64,
}

impl SwapResponse {
    pub fn new(
        pool_id: String,
        tick_in_wallet_address: String,
        tick_out_wallet_address: String,
        swap_type: String,
        source_chain: String,
        destination_chain: String,
        token_in_address: String,
        token_out_address: String,
        amount_in: String,
        amount_out: String,
        slippage: String,
        tx_hash_in: String,
        tx_hash_out: String,
        status: String,
        timestamp: u64,
    ) -> Self {
        Self {
            pool_id: pool_id.to_lowercase(),
            tick_in_wallet_address: tick_in_wallet_address.to_lowercase(),
            tick_out_wallet_address: tick_out_wallet_address.to_lowercase(),
            swap_type,
            source_chain,
            destination_chain,
            token_in_address: token_in_address.to_lowercase(),
            token_out_address: token_out_address.to_lowercase(),
            amount_in,
            amount_out,
            slippage,
            tx_hash_in: tx_hash_in.to_lowercase(),
            tx_hash_out: tx_hash_out.to_lowercase(),
            status,
            timestamp,
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum SwapResult {
    Success(SwapResponse),
    Error(String),
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub bsc_network: Option<BscNetwork>,
    pub ecdsa_key_name: Option<EcdsaKeyName>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum BscNetwork {
    #[default]
    Testnet,
}

impl BscNetwork {
    pub fn chain_id(&self) -> u64 {
        match self {
            BscNetwork::Testnet => 97,
        }
    }
    pub fn rpc_url(&self) -> &'static str {
        match self {
            BscNetwork::Testnet => "https://bsc-testnet.gateway.tatum.io/",
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

#[derive(SerdeDeserialize, Debug)]
pub struct JsonRpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<serde_json::Value>,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RpcLog {
    pub address: String,
    pub topics: Vec<String>,
    pub data: String,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RpcTransactionReceipt {
    pub from: String,
    pub status: String,
    pub logs: Vec<RpcLog>,
}

#[derive(SerdeDeserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RpcTransaction {
    pub to: Option<String>,
    pub value: String,
    pub input: String,
}

pub fn ic_address_to_alloy_address(ic_addr: &ic_ethereum_types::Address) -> alloy_primitives::Address {
    alloy_primitives::Address::from_slice(ic_addr.as_ref())
}

pub fn string_to_alloy_address(addr_str: &str) -> Result<alloy_primitives::Address, String> {
    alloy_primitives::Address::from_str(addr_str).map_err(|e| format!("Invalid address: {}", e))
}

pub fn u256_to_decimal(value: U256, decimals: u8) -> Result<Decimal, String> {
    let value_str = value.to_string();
    let value_decimal = Decimal::from_str(&value_str)
        .map_err(|_| "Failed to convert U256 to Decimal")?;
    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    Ok(value_decimal / scale_factor)
}

pub fn decimal_to_u256(value: Decimal, decimals: u8) -> Result<U256, String> {
    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    let scaled_value = (value * scale_factor).trunc();
    let value_str = scaled_value.to_string();
    U256::from_str(&value_str)
        .map_err(|_| "Failed to convert Decimal to U256".to_string())
}