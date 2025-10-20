use std::cell::RefCell;
use std::collections::HashMap;
use crate::types::pool::PoolData;
use crate::types::swap::SwapResponse;

thread_local! {
    static CACHED_ICP_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_BASE_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_BSC_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_SOLANA_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static POOL_DATA: RefCell<HashMap<String, PoolData>> = RefCell::new(HashMap::new());
    static SWAP_HISTORY: RefCell<Vec<SwapResponse>> = RefCell::new(Vec::new());
}

pub fn save_to_stable_storage() {
    let icp_addr = CACHED_ICP_ADDRESS.with(|addr| addr.borrow().clone());
    let base_addr = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    let bsc_addr = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    let solana_addr = CACHED_SOLANA_ADDRESS.with(|addr| addr.borrow().clone());
    let pools = POOL_DATA.with(|data| data.borrow().clone());
    let swap_history = SWAP_HISTORY.with(|history| history.borrow().clone());

    ic_cdk::storage::stable_save((icp_addr, base_addr, bsc_addr, solana_addr, pools, swap_history))
        .expect("Failed to save data to stable storage");
}

pub fn restore_from_stable_storage() {
    if let Ok((icp_addr, base_addr, bsc_addr, solana_addr, pools, swap_history)) =
        ic_cdk::storage::stable_restore::<(
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            HashMap<String, PoolData>,
            Vec<SwapResponse>,
        )>()
    {
        CACHED_ICP_ADDRESS.with(|addr| *addr.borrow_mut() = icp_addr);
        CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = base_addr);
        CACHED_BSC_ADDRESS.with(|addr| *addr.borrow_mut() = bsc_addr);
        CACHED_SOLANA_ADDRESS.with(|addr| *addr.borrow_mut() = solana_addr);
        POOL_DATA.with(|data| *data.borrow_mut() = pools);
        SWAP_HISTORY.with(|history| *history.borrow_mut() = swap_history);
    }
}

pub fn update_pool_balances(
    pool_id: &str,
    token_a_balance: String,
    token_b_balance: String,
) -> Result<String, String> {
    POOL_DATA.with(|data| {
        let mut pools = data.borrow_mut();
        
        if let Some(pool) = pools.get_mut(pool_id) {
            pool.token_a_balance = token_a_balance;
            pool.token_b_balance = token_b_balance;
            Ok(format!("Pool {} balances updated successfully", pool_id))
        } else {
            Err(format!("Pool with id {} not found", pool_id))
        }
    })
}

pub fn get_all_pools() -> Vec<PoolData> {
    POOL_DATA.with(|data| {
        data.borrow().values().cloned().collect()
    })
}

pub fn initialize_pools(pools: Vec<PoolData>) {
    POOL_DATA.with(|data| {
        let mut pool_map = data.borrow_mut();
        for pool in pools {
            pool_map.insert(pool.pool_id.clone(), pool);
        }
    });
}

pub fn add_swap_to_history(swap: SwapResponse) {
    SWAP_HISTORY.with(|history| {
        history.borrow_mut().push(swap);
    });
}

pub fn get_swap_history() -> Vec<SwapResponse> {
    SWAP_HISTORY.with(|history| {
        history.borrow().clone()
    })
}

pub fn get_swap_by_id(swap_id: &str) -> Option<SwapResponse> {
    SWAP_HISTORY.with(|history| {
        history
            .borrow()
            .iter()
            .find(|swap| swap.swap_id == swap_id)
            .cloned()
    })
}

pub fn get_swap_history_paginated(offset: usize, limit: usize) -> Vec<SwapResponse> {
    SWAP_HISTORY.with(|history| {
        let all_swaps = history.borrow();
        all_swaps
            .iter()
            .rev()
            .skip(offset)
            .take(limit)
            .cloned()
            .collect()
    })
}

pub fn get_swap_history_count() -> usize {
    SWAP_HISTORY.with(|history| history.borrow().len())
}

pub async fn get_cached_icp_address() -> String {
    let cached = CACHED_ICP_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let address = crate::services::icp_transaction_service::get_canister_icp_address().await;

    CACHED_ICP_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

pub async fn get_cached_base_address() -> String {
    let cached = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let wallet = crate::wallet::base_wallet::BaseWallet::new_canister_wallet().await;
    let address = format!("{:?}", wallet.base_address());

    CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

pub async fn get_cached_bsc_address() -> String {
    let cached = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let wallet = crate::wallet::bsc_wallet::BscWallet::new_canister_wallet().await;
    let address = format!("{:?}", wallet.bsc_address());

    CACHED_BSC_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}

pub async fn get_cached_solana_address() -> String {
    let cached = CACHED_SOLANA_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let wallet = crate::wallet::solana_wallet::SolanaWallet::new_canister_wallet().await;
    let address = wallet.solana_address();

    CACHED_SOLANA_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));

    address
}