use crate::wallet::ethereum_wallet::EthereumWallet;
use crate::state::{read_state, lazy_call_ecdsa_public_key};
use candid::{CandidType, Deserialize, Nat, Principal};
use ic_ethereum_types::Address;
use num::{BigUint, Num};
use std::str::FromStr;

pub use evm_rpc_canister_types::{BlockTag, EthMainnetService, EthSepoliaService, RpcServices, GetTransactionCountArgs, GetTransactionCountResult, MultiGetTransactionCountResult, RequestResult};
pub use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};

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

pub async fn get_ethereum_address(owner: Option<Principal>) -> Result<String, String> {
    let caller = ic_cdk::caller();
    let owner = owner.unwrap_or(caller);
    let wallet = EthereumWallet::new(owner).await;
    Ok(wallet.ethereum_address().to_string())
}

pub async fn get_balance(address: Option<String>) -> Result<Nat, String> {
    let address = match address {
        Some(addr) => addr,
        None => get_ethereum_address(None).await?,
    };

    let json = format!(
        r#"{{ "jsonrpc": "2.0", "method": "eth_getBalance", "params": ["{}", "latest"], "id": 1 }}"#,
        address
    );

    let max_response_size_bytes = 500_u64;
    let num_cycles = 1_000_000_000u128;

    let ethereum_network = read_state(|s| s.ethereum_network());

    let rpc_service = match ethereum_network {
        EthereumNetwork::Mainnet => RpcServices::EthMainnet(Some(vec![EthMainnetService::PublicNode])),
        EthereumNetwork::Sepolia => RpcServices::EthSepolia(Some(vec![EthSepoliaService::PublicNode])),
    };

    let (response,) = crate::EVM_RPC
        .request(rpc_service, json, max_response_size_bytes, num_cycles)
        .await
        .map_err(|e| format!("RPC call failed: {:?}", e))?;

    let hex_balance = match response {
        RequestResult::Ok(balance_result) => {
            let response: serde_json::Value = serde_json::from_str(&balance_result).map_err(|e| e.to_string())?;
            response
                .get("result")
                .and_then(|v| v.as_str())
                .ok_or("No result field in response".to_string())?
                .to_string()
        }
        RequestResult::Err(e) => return Err(format!("Received an error response: {:?}", e)),
    };

    Ok(Nat(BigUint::from_str_radix(&hex_balance[2..], 16).map_err(|e| e.to_string())?))
}

pub async fn transaction_count(owner: Option<Principal>, block: Option<BlockTag>) -> Result<Nat, String> {
    let caller = ic_cdk::caller();
    let owner = owner.unwrap_or(caller);
    let wallet = EthereumWallet::new(owner).await;
    let rpc_services = read_state(|s| s.evm_rpc_services());
    let args = GetTransactionCountArgs {
        address: wallet.ethereum_address().to_string(),
        block: block.unwrap_or(BlockTag::Finalized),
    };
    let (result,) = crate::EVM_RPC
        .eth_get_transaction_count(rpc_services, None, args.clone(), 2_000_000_000_u128)
        .await
        .map_err(|e| format!("failed to get transaction count for {:?}, error: {:?}", args, e))?;
    match result {
        MultiGetTransactionCountResult::Consistent(consistent_result) => match consistent_result {
            GetTransactionCountResult::Ok(count) => Ok(count),
            GetTransactionCountResult::Err(error) => Err(format!("failed to get transaction count for {:?}, error: {:?}", args, error)),
        },
        MultiGetTransactionCountResult::Inconsistent(inconsistent_results) => {
            Err(format!("inconsistent results when retrieving transaction count for {:?}. Received results: {:?}", args, inconsistent_results))
        }
    }
}

pub async fn send_eth(to: String, amount: Nat) -> Result<String, String> {
    use alloy_eips::eip2718::Encodable2718;
    use crate::wallet::ethereum_wallet::EthereumWallet;
    use crate::state::read_state;
    use alloy_primitives::{Signature, TxKind, U256};
    use alloy_consensus::{TxEip1559, TxEnvelope};
    use std::str::FromStr;

    let caller = ic_cdk::caller();
    let to_address = Address::from_str(&to)
        .map_err(|e| format!("failed to parse the recipient address: {:?}", e))?;
    let chain_id = read_state(|s| s.ethereum_network().chain_id());
    let nonce = super::super::services::eth_service::transaction_count(Some(caller), Some(BlockTag::Latest)).await
        .map_err(|e| format!("failed to get transaction count: {}", e))?;
    let nonce = nat_to_u64(nonce)?;

    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees();

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(to_address),
        value: nat_to_u256(amount.clone()),
        access_list: Default::default(),
        input: Default::default(),
    };

    let wallet = EthereumWallet::new(caller).await;
    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .map_err(|_| "BUG: failed to create a signature".to_string())?;
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", alloy_primitives::hex::encode(&tx_bytes));

    let single_rpc_service = read_state(|s| s.single_evm_rpc_service());
    let (result,) = crate::EVM_RPC
        .eth_send_raw_transaction(
            single_rpc_service,
            None,
            raw_transaction_hex.clone(),
            2_000_000_000_u128,
        )
        .await
        .map_err(|e| format!("failed to send raw transaction {}, error: {:?}", raw_transaction_hex, e))?;

    match result {
        evm_rpc_canister_types::RequestResult::Ok(_) => Ok(raw_transaction_hash.to_string()),
        evm_rpc_canister_types::RequestResult::Err(e) => Err(format!("Error sending transaction: {:?}", e)),
    }
}

pub async fn send_erc20(to: String, amount: Nat, token_address: String) -> Result<String, String> {
    use alloy_eips::eip2718::Encodable2718;
    use crate::wallet::ethereum_wallet::EthereumWallet;
    use crate::state::read_state;
    use alloy_primitives::{Signature, TxKind, U256, Bytes};
    use alloy_consensus::{TxEip1559, TxEnvelope};
    use std::str::FromStr;

    let caller = ic_cdk::caller();
    let to_address = Address::from_str(&to)
        .map_err(|e| format!("failed to parse the recipient address: {:?}", e))?;
    let chain_id = read_state(|s| s.ethereum_network().chain_id());
    let nonce = super::super::services::eth_service::transaction_count(Some(caller), Some(BlockTag::Latest)).await
        .map_err(|e| format!("failed to get transaction count: {}", e))?;
    let nonce = nat_to_u64(nonce)?;

    let (gas_limit, max_fee_per_gas, max_priority_fee_per_gas) = estimate_transaction_fees();

    let mut input_data = alloy_primitives::hex::decode("a9059cbb")
        .map_err(|e| format!("failed to decode method selector: {:?}", e))?;

    let to_address_str = to_address.to_string();
    let to_address_bytes = alloy_primitives::hex::decode(&to_address_str[2..])
        .map_err(|e| format!("failed to decode to_address: {:?}", e))?;

    let mut address_bytes = [0u8; 32];
    address_bytes[12..32].copy_from_slice(&to_address_bytes);
    input_data.extend_from_slice(&address_bytes);

    let amount_u256 = nat_to_u256(amount.clone());
    let amount_bytes = amount_u256.to_be_bytes::<32>();
    input_data.extend_from_slice(&amount_bytes);

    let transaction = TxEip1559 {
        chain_id,
        nonce,
        gas_limit,
        max_fee_per_gas,
        max_priority_fee_per_gas,
        to: TxKind::Call(token_address.parse().map_err(|e| format!("failed to parse token address: {:?}", e))?),
        value: U256::from(0),
        access_list: Default::default(),
        input: Bytes::from(input_data),
    };

    let wallet = EthereumWallet::new(caller).await;
    let tx_hash = transaction.signature_hash().0;
    let (raw_signature, recovery_id) = wallet.sign_with_ecdsa(tx_hash).await;
    let signature = Signature::from_bytes_and_parity(&raw_signature, recovery_id.is_y_odd())
        .map_err(|_| "BUG: failed to create a signature".to_string())?;
    let signed_tx = transaction.into_signed(signature);

    let raw_transaction_hash = *signed_tx.hash();
    let mut tx_bytes: Vec<u8> = vec![];
    TxEnvelope::from(signed_tx).encode_2718(&mut tx_bytes);
    let raw_transaction_hex = format!("0x{}", alloy_primitives::hex::encode(&tx_bytes));

    let single_rpc_service = read_state(|s| s.single_evm_rpc_service());
    let (result,) = crate::EVM_RPC
        .eth_send_raw_transaction(
            single_rpc_service,
            None,
            raw_transaction_hex.clone(),
            2_000_000_000_u128,
        )
        .await
        .map_err(|e| format!("failed to send raw transaction {}, error: {:?}", raw_transaction_hex, e))?;

    match result {
        evm_rpc_canister_types::RequestResult::Ok(_) => Ok(raw_transaction_hash.to_string()),
        evm_rpc_canister_types::RequestResult::Err(e) => Err(format!("Error sending transaction: {:?}", e)),
    }
}

fn nat_to_u64(nat: Nat) -> Result<u64, String> {
    use num_traits::cast::ToPrimitive;
    nat.0
        .to_u64()
        .ok_or_else(|| format!("Nat {} doesn't fit into a u64", nat))
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

fn estimate_transaction_fees() -> (u128, u128, u128) {
    const GAS_LIMIT: u128 = 700_000;
    const MAX_FEE_PER_GAS: u128 = 50_000_000_000;
    const MAX_PRIORITY_FEE_PER_GAS: u128 = 1_500_000_000;
    (GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS)
}
