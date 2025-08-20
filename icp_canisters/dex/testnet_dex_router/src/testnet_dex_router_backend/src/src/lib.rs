use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::call;

#[derive(Debug, Clone, CandidType, Deserialize)]
struct CreateTransactionArgs {
    pool_id: String,
    tick_in_wallet_address: String,
    tick_out_wallet_address: String,
    swap_type: String,
    source_chain: String,
    destination_chain: String,
    token_in_address: String,
    token_out_address: String,
    amount_in: String,
    expected_amount_out: String,
    slippage: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct TransactionData {
    tx_type: Option<String>,
    blockchain: Option<String>,
    from: String,
    to: String,
    value: String,
    data: String,
    gas_limit: Option<String>,
    max_priority_fee_per_gas: Option<String>,
    max_fee_per_gas: Option<String>,
    nonce: Option<String>,
    chain_id: Option<u64>,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct TransactionResponse {
    transaction_data: TransactionData,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct SwapResponse {
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
}

#[derive(Debug, Clone, CandidType, Deserialize)]
enum SwapResult {
    Success(SwapResponse),
    Error(String),
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct VerifyAndSwapArgs {
    pool_id: String,
    transaction_hash: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct CrossChainVerifyAndSwapArgs {
    pool_id: String,
    source_chain: String,
    transaction_hash: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct CrossChainCallArgs {
    source_chain: String,
    transaction_hash: String,
}

#[derive(Debug, Clone, CandidType, Deserialize)]
struct GetSwapHistoryByAddressArgs {
    chain: String,
    tick_in_wallet_address: String,
}

fn get_principal_from_pool_id(pool_id: &str) -> Result<Principal, String> {
    match pool_id {
        "y0a4pk" => Ok(Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7f\xc5\x01\x01")),
        "39ef62" | "cg15vp" | "dat49f" => Ok(Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x80\x56\x01\x01")),
        "a9f2k3" | "m3n8x1" | "z6y4b8" | "q7p5d2" | "h4c9v7" | "t8k1w5" => Ok(Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x80\x78\x01\x01")),
        _ => Err(format!("Unknown pool_id: {}", pool_id)),
    }
}

fn get_principal_from_chain(chain: &str) -> Result<Principal, String> {
    match chain.to_lowercase().as_str() {
        "ethereum" => Ok(Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x7f\xc5\x01\x01")),
        "binance" => Ok(Principal::from_slice(b"\x00\x00\x00\x00\x01\xf0\x80\x56\x01\x01")),
        _ => Err(format!("Unknown chain: {}", chain)),
    }
}

#[ic_cdk::update]
async fn create_transaction(
    args: CreateTransactionArgs,
) -> Result<TransactionResponse, String> {
    let target_canister = get_principal_from_pool_id(&args.pool_id)?;

    let result: Result<(TransactionResponse,), _> =
        call(target_canister, "create_transaction", (args,)).await;

    match result {
        Ok((response,)) => Ok(response),
        Err((code, msg)) => Err(format!(
            "Inter-canister call failed: {:?} - {}",
            code, msg
        )),
    }
}

#[ic_cdk::update]
async fn verify_and_swap(
    args: VerifyAndSwapArgs,
) -> Result<SwapResult, String> {
    let target_canister = get_principal_from_pool_id(&args.pool_id)?;

    let result: Result<(SwapResult,), _> =
        call(target_canister, "verify_and_swap", (args.transaction_hash,)).await;

    match result {
        Ok((response,)) => Ok(response),
        Err((code, msg)) => Err(format!(
            "Inter-canister call failed: {:?} - {}",
            code, msg
        )),
    }
}

#[ic_cdk::update]
async fn cross_chain_verify_and_swap(
    args: CrossChainVerifyAndSwapArgs,
) -> Result<SwapResult, String> {
    let target_canister = get_principal_from_pool_id(&args.pool_id)?;

    let call_args = CrossChainCallArgs {
        source_chain: args.source_chain,
        transaction_hash: args.transaction_hash,
    };

    let result: Result<(SwapResult,), _> =
        call(target_canister, "verify_and_swap", (call_args,)).await;

    match result {
        Ok((response,)) => Ok(response),
        Err((code, msg)) => Err(format!(
            "Inter-canister call failed: {:?} - {}",
            code, msg
        )),
    }
}

#[ic_cdk::update]
async fn get_swap_history_by_address(
    args: GetSwapHistoryByAddressArgs,
) -> Result<Vec<SwapResponse>, String> {
    let target_canister = get_principal_from_chain(&args.chain)?;

    let result: Result<(Vec<SwapResponse>,), _> =
        call(target_canister, "get_swap_history_by_address", (args.tick_in_wallet_address,)).await;

    match result {
        Ok((history,)) => Ok(history),
        Err((code, msg)) => Err(format!(
            "Inter-canister call failed: {:?} - {}",
            code, msg
        )),
    }
}