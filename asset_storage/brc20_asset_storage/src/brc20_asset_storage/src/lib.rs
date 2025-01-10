mod bitcoin_api;
mod bitcoin_wallet;
mod ecdsa_api;
mod schnorr_api;

use candid::{CandidType, Deserialize};
use ic_cdk::api::management_canister::bitcoin::{
    BitcoinNetwork, GetUtxosResponse, MillisatoshiPerByte,
};
use ic_cdk_macros::{init, update};
use std::cell::{Cell, RefCell};
use bitcoin::{Address, Script};
use bitcoin::blockdata::transaction::{Transaction, TxOut, TxIn};
use bitcoin::consensus::encode;
use bitcoin::absolute::LockTime;
use serde_json::json;

thread_local! {
    static NETWORK: Cell<BitcoinNetwork> = Cell::new(BitcoinNetwork::Testnet);
    static DERIVATION_PATH: Vec<Vec<u8>> = vec![];
    static KEY_NAME: RefCell<String> = RefCell::new(String::from(""));
}

#[init]
pub fn init(network: BitcoinNetwork) {
    NETWORK.with(|n| n.set(network));

    KEY_NAME.with(|key_name| {
        key_name.replace(String::from(match network {
            BitcoinNetwork::Regtest => "dfx_test_key",
            BitcoinNetwork::Mainnet | BitcoinNetwork::Testnet => "test_key_1",
        }))
    });
}

#[update]
pub async fn get_balance(address: String) -> u64 {
    let network = NETWORK.with(|n| n.get());
    bitcoin_api::get_balance(network, address).await
}

#[update]
pub async fn get_utxos(address: String) -> GetUtxosResponse {
    let network = NETWORK.with(|n| n.get());
    bitcoin_api::get_utxos(network, address).await
}

pub type Height = u32;
pub type BlockHeader = Vec<u8>;

#[derive(CandidType, Debug, Deserialize, PartialEq, Eq)]
pub struct GetBlockHeadersRequest {
    pub start_height: Height,
    pub end_height: Option<Height>,
    pub network: BitcoinNetwork,
}

#[derive(CandidType, Debug, Deserialize, PartialEq, Eq, Clone)]
pub struct GetBlockHeadersResponse {
    pub tip_height: Height,
    pub block_headers: Vec<BlockHeader>,
}

#[update]
pub async fn get_block_headers(start_height: u32, end_height: Option<u32>) -> GetBlockHeadersResponse{
    let network = NETWORK.with(|n| n.get());
    bitcoin_api::get_block_headers(network, start_height, end_height).await
}

#[update]
pub async fn get_current_fee_percentiles() -> Vec<MillisatoshiPerByte> {
    let network = NETWORK.with(|n| n.get());
    bitcoin_api::get_current_fee_percentiles(network).await
}

#[update]
pub async fn get_p2pkh_address() -> String {
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());
    bitcoin_wallet::p2pkh::get_address(network, key_name, derivation_path).await
}

#[update]
pub async fn send_from_p2pkh(request: SendRequest) -> String {
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let tx_id = bitcoin_wallet::p2pkh::send(
        network,
        derivation_path,
        key_name,
        request.destination_address,
        request.amount_in_satoshi,
    )
    .await;

    tx_id.to_string()
}

#[update]
pub async fn quote_brc20_swap(amount: u64, from_token: String, to_token: String) -> Result<String, String> {
    let url = "https://open-api.unisat.io/v1/brc20-swap/quote_swap";
    let client = reqwest::Client::new();
    
    let response = client.post(url)
        .json(&json!({
            "amount": amount,
            "from": from_token,
            "to": to_token,
        }))
        .send()
        .await.map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let result: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        Ok(result.to_string())
    } else {
        Err(format!("Error: {}", response.status()))
    }
}

#[update]
pub async fn get_transferable_inscriptions(address: String, ticker: String) -> Result<Vec<String>, String> {
    let url = format!("https://open-api.unisat.io/v1/indexer/address/{}/brc20/{}/transferable-inscriptions", address, ticker);
    let client = reqwest::Client::new();

    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let result: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        let inscriptions = result["inscriptions"]
            .as_array()
            .ok_or("Failed to parse inscriptions")?
            .iter()
            .filter_map(|v| v.as_str().map(String::from))
            .collect();
        Ok(inscriptions)
    } else {
        Err(format!("Error: {}", response.status()))
    }
}

#[update]
pub async fn get_p2tr_script_spend_address() -> String {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"script_spend".to_vec());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());

    bitcoin_wallet::p2tr_script_spend::get_address(network, key_name, derivation_path)
        .await
        .to_string()
}

#[update]
pub async fn send_from_p2tr_script_spend(request: SendRequest) -> String {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"script_spend".to_vec());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let tx_id = bitcoin_wallet::p2tr_script_spend::send(
        network,
        derivation_path,
        key_name,
        request.destination_address,
        request.amount_in_satoshi,
    )
    .await;

    tx_id.to_string()
}

#[update]
pub async fn get_p2tr_raw_key_spend_address() -> String {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"key_spend".to_vec());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let network = NETWORK.with(|n| n.get());

    bitcoin_wallet::p2tr_raw_key_spend::get_address(network, key_name, derivation_path)
        .await
        .to_string()
}

#[update]
pub async fn send_from_p2tr_raw_key_spend(request: SendRequest) -> String {
    let mut derivation_path = DERIVATION_PATH.with(|d| d.clone());
    derivation_path.push(b"key_spend".to_vec());
    let network = NETWORK.with(|n| n.get());
    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let tx_id = bitcoin_wallet::p2tr_raw_key_spend::send(
        network,
        derivation_path,
        key_name,
        request.destination_address,
        request.amount_in_satoshi,
    )
    .await;

    tx_id.to_string()
}

#[update]
pub async fn send_brc(
    sender_address: String,
    recipient_address: String,
    brc_id: String,
) -> Result<String, String> {
    let utxos_response = get_utxos(sender_address).await.map_err(|e| e.to_string())?;
    
    let brc_utxo = utxos_response.utxos.iter()
        .find(|utxo| utxo.outpoint.txid.to_vec() == brc_id.as_bytes())
        .ok_or("BRC20 UTXO not found")?;

    let tx_out = TxOut {
        value: brc_utxo.value,
        script_pubkey: Address::from_str(&recipient_address).map_err(|_| "Invalid recipient address")?.script_pubkey(),
    };

    let tx_in = TxIn {
        previous_output: brc_utxo.outpoint,
        script_sig: Script::new(),
        sequence: bitcoin::Sequence(0xFFFFFFFF),
        witness: Vec::<Vec<u8>>::new().into(),
    };

    let mut transaction = Transaction {
        version: 2,
        lock_time: LockTime::from_height(0),
        input: vec![tx_in],
        output: vec![tx_out],
    };

    let key_name = KEY_NAME.with(|kn| kn.borrow().to_string());
    let derivation_path = DERIVATION_PATH.with(|d| d.clone());
    
    let serialized_tx = encode::serialize(&transaction);
    
    let signed_tx = schnorr_api::sign_with_schnorr(key_name, derivation_path, serialized_tx).await.map_err(|e| e.to_string())?;

    let network = NETWORK.with(|n| n.get());
    
    let txid = bitcoin_api::send_transaction(network, &signed_tx).await.map_err(|e| e.to_string())?;

    Ok(txid)
}

#[derive(candid::CandidType, candid::Deserialize)]
pub struct SendRequest {
    pub destination_address: String,
    pub amount_in_satoshi: u64,
}
