use crate::types::swap::SwapResponseData;
use crate::wallet::base_wallet::BaseWallet;
use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static BUY_HISTORY: RefCell<Vec<SwapResponseData>> = RefCell::new(Vec::new());
    static SELL_HISTORY: RefCell<Vec<SwapResponseData>> = RefCell::new(Vec::new());
    static CACHED_BASE_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_BSC_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static CACHED_SOLANA_ADDRESS: RefCell<Option<String>> = RefCell::new(None);
    static TOKEN_DATA: RefCell<HashMap<String, (String, Vec<(String, String, String, String)>)>> = 
        RefCell::new(initialize_token_data());
}

fn initialize_token_data() -> HashMap<String, (String, Vec<(String, String, String, String)>)> {
    let mut token_data = HashMap::new();
    
    token_data.insert(
        "BIT10.DEFI".to_string(),
        (
            "41.77825388".to_string(),
            vec![(
                "ICP".to_string(),
                "bin4j-cyaaa-aaaap-qh7tq-cai".to_string(),
                "0".to_string(),
                "0".to_string(),
            )],
        ),
    );
    
    token_data.insert(
        "BIT10.TOP".to_string(),
        (
            "90.21844660".to_string(),
            vec![
                (
                    "ICP".to_string(),
                    "g37b3-lqaaa-aaaap-qp4hq-cai".to_string(),
                    "0".to_string(),
                    "0".to_string(),
                ),
                (
                    "Base".to_string(),
                    "0x2d309c7c5fbbf74372edfc25b10842a7237b92de".to_string(),
                    "0".to_string(),
                    "0".to_string(),
                ),
                (
                    "Binance Smart Chain".to_string(),
                    "0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9".to_string(),
                    "0".to_string(),
                    "0".to_string(),
                ),
                (
                    "Solana".to_string(),
                    "bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1".to_string(),
                    "0".to_string(),
                    "0".to_string(),
                ),
            ],
        ),
    );
    
    token_data
}

pub fn save_to_stable_storage() {
    let buy_history = BUY_HISTORY.with(|h| h.borrow().clone());
    let sell_history = SELL_HISTORY.with(|h| h.borrow().clone());
    let base_addr = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    let bsc_addr = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    let solana_addr = CACHED_SOLANA_ADDRESS.with(|addr| addr.borrow().clone());
    let token_data = TOKEN_DATA.with(|data| data.borrow().clone());

    ic_cdk::storage::stable_save((
        base_addr,
        bsc_addr,
        solana_addr,
        buy_history,
        sell_history,
        token_data,
    ))
    .expect("Failed to save data to stable storage");
}

pub fn restore_from_stable_storage() {
    if let Ok((base_addr, bsc_addr, solana_addr, buy_history, sell_history, token_data)) =
        ic_cdk::storage::stable_restore::<(
            Option<String>,
            Option<String>,
            Option<String>,
            Vec<SwapResponseData>,
            Vec<SwapResponseData>,
            HashMap<String, (String, Vec<(String, String, String, String)>)>,
        )>()
    {
        CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = base_addr);
        CACHED_BSC_ADDRESS.with(|addr| *addr.borrow_mut() = bsc_addr);
        CACHED_SOLANA_ADDRESS.with(|addr| *addr.borrow_mut() = solana_addr);
        BUY_HISTORY.with(|h| *h.borrow_mut() = buy_history);
        SELL_HISTORY.with(|h| *h.borrow_mut() = sell_history);
        TOKEN_DATA.with(|data| *data.borrow_mut() = token_data);
    }
}

pub async fn get_cached_base_address() -> String {
    let cached = CACHED_BASE_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let canister_id = ic_cdk::id();
    let wallet = BaseWallet::new(canister_id).await;
    let address = wallet.base_address().to_string();
    
    CACHED_BASE_ADDRESS.with(|addr| *addr.borrow_mut() = Some(address.clone()));
    
    address
}

pub async fn get_cached_bsc_address() -> String {
    let cached = CACHED_BSC_ADDRESS.with(|addr| addr.borrow().clone());
    if let Some(address) = cached {
        return address;
    }

    let canister_id = ic_cdk::id();
    let wallet = BaseWallet::new(canister_id).await;
    let address = wallet.base_address().to_string();
    
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

pub fn get_buy_history() -> Vec<SwapResponseData> {
    BUY_HISTORY.with(|h| h.borrow().clone())
}

pub fn get_sell_history() -> Vec<SwapResponseData> {
    SELL_HISTORY.with(|h| h.borrow().clone())
}

pub fn add_to_buy_history(swap: SwapResponseData) {
    BUY_HISTORY.with(|h| h.borrow_mut().push(swap));
}

pub fn add_to_sell_history(swap: SwapResponseData) {
    SELL_HISTORY.with(|h| h.borrow_mut().push(swap));
}

pub fn get_token_data() -> HashMap<String, (String, Vec<(String, String, String, String)>)> {
    TOKEN_DATA.with(|data| data.borrow().clone())
}

pub fn update_token_bought(token_name: &str, token_address: &str, amount: &str) {
    use rust_decimal::Decimal;
    use std::str::FromStr;
    
    TOKEN_DATA.with(|data| {
        let mut token_data = data.borrow_mut();
        
        if let Some((_total_supply, allocations)) = token_data.get_mut(token_name) {
            for (_chain, address, total_bought, _total_sold) in allocations.iter_mut() {
                if address.to_lowercase() == token_address.to_lowercase() {
                    if let (Ok(current), Ok(addition)) = (
                        Decimal::from_str(total_bought),
                        Decimal::from_str(amount),
                    ) {
                        let new_total = current + addition;
                        *total_bought = format!("{:.8}", new_total);
                    }
                    break;
                }
            }
        }
    });
}

pub fn update_token_sold(token_name: &str, token_address: &str, amount: &str) {
    use rust_decimal::Decimal;
    use std::str::FromStr;
    
    TOKEN_DATA.with(|data| {
        let mut token_data = data.borrow_mut();
        
        if let Some((_total_supply, allocations)) = token_data.get_mut(token_name) {
            for (_chain, address, _total_bought, total_sold) in allocations.iter_mut() {
                if address.to_lowercase() == token_address.to_lowercase() {
                    if let (Ok(current), Ok(addition)) = (
                        Decimal::from_str(total_sold),
                        Decimal::from_str(amount),
                    ) {
                        let new_total = current + addition;
                        *total_sold = format!("{:.8}", new_total);
                    }
                    break;
                }
            }
        }
    });
}

pub fn transaction_exists(tx_hash: &str) -> bool {
    BUY_HISTORY.with(|h| {
        h.borrow().iter().any(|swap| {
            swap.token_in_tx_hash == tx_hash || swap.token_out_tx_hash == tx_hash
        })
    })
}