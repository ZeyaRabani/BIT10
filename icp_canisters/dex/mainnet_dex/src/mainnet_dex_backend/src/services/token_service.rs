use crate::utils::constants::PRICE_FEED_CANISTER;
use crate::types::pool::{PoolData, PoolInfo, PoolsResponse};
use crate::types::token::{Token, Pair};
use candid::Principal;
use ciborium::from_reader;

pub fn get_supported_tokens() -> Vec<Token> {
    vec![
        Token {
            token_id: "8916".to_string(),
            token_name: "ICP".to_string(),
            token_symbol: "ICP".to_string(),
            token_address: Some("ryjl3-tyaaa-aaaaa-aaaba-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 8,
            is_native: true,
            is_active: true,
            price_feed_id: "xbygsdfghjdfkgf".to_string(),
        },
        Token {
            token_id: "3408_8916".to_string(),
            token_name: "ckUSDC".to_string(),
            token_symbol: "ckUSDC".to_string(),
            token_address: Some("xevnm-gaaaa-aaaar-qafnq-cai".to_string()),
            token_chain: "ICP".to_string(),
            token_decimals: 6,
            is_native: false,
            is_active: true,
            price_feed_id: "hgdfhgdfhbdjgf".to_string(),
        },
        Token {
            token_id: "1027".to_string(),
            token_name: "Ethereum".to_string(),
            token_symbol: "ETH".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000base".to_string()),
            token_chain: "Base".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: "xgvhjcbxjvcjxnbjcvbvcb".to_string(),
        },
        Token {
            token_id: "3408_1027".to_string(),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            // token_address: Some("0x036cbd53842c5426634e7929541ec2318f3dcf7e".to_string()), // ToDo: Update this local
            token_address: Some("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913".to_string()), // Mainnet
            token_chain: "Base".to_string(),
            token_decimals: 6,
            is_native: false,
            is_active: true,
            price_feed_id: "zxvghbxfjcbnjcnbkg".to_string(),
        },
        Token {
            token_id: "5426".to_string(),
            token_name: "Solana".to_string(),
            token_symbol: "SOL".to_string(),
            token_address: Some("So11111111111111111111111111111111111111111".to_string()),
            token_chain: "Solana".to_string(),
            token_decimals: 9,
            is_native: true,
            is_active: true,
            price_feed_id: "zhxbdjbxfjbvkcfbv".to_string(),
        },
        Token {
            token_id: "3408_5426".to_string(),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            // token_address: Some("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU".to_string()), // ToDo: Update this local (Case sensitive)
            token_address: Some("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".to_string()), // Mainnet (Case sensitive)
            token_chain: "Solana".to_string(),
            token_decimals: 6,
            is_native: false,
            is_active: true,
            price_feed_id: "dvhbxfbhjxcbfvjkf".to_string(),
        },
        Token {
            token_id: "1839".to_string(),
            token_name: "BNB".to_string(),
            token_symbol: "BNB".to_string(),
            token_address: Some("0x0000000000000000000000000000000000000000bnb".to_string()),
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: true,
            is_active: true,
            price_feed_id: "hsgdvfhvdfbvjfv".to_string(),
        },
        Token {
            token_id: "3408_1839".to_string(),
            token_name: "USD Coin".to_string(),
            token_symbol: "USDC".to_string(),
            // token_address: Some("0x64544969ed7ebf5f083679233325356ebe738930".to_string()), // ToDo: Update this local
            token_address: Some("0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d ".to_string()), // Mainnet
            token_chain: "Binance Smart Chain".to_string(),
            token_decimals: 18,
            is_native: false,
            is_active: true,
            price_feed_id: "xhbvhjbcjvbcvnb".to_string(),
        },
    ]
}

pub fn get_supported_pairs() -> Vec<Pair> {
    vec![
        Pair {
            pool_id: "2998n9dml3".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "ckUSDC".to_string(),
            token_b_chain: "ICP".to_string(),
            token_b_token_id: "3408_8916".to_string(),
            pair_type: "Native".to_string(),
        },
        Pair {
            pool_id: "wq1ntmadx4".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "ETH".to_string(),
            token_b_chain: "Base".to_string(),
            token_b_token_id: "1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "8kusm7wsxp".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Base".to_string(),
            token_b_token_id: "3408_1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "3606lhoz4x".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "SOL".to_string(),
            token_b_chain: "Solana".to_string(),
            token_b_token_id: "5426".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "jsrp07jpta".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Solana".to_string(),
            token_b_token_id: "3408_5426".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "32nd91gfq4".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "BNB".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "1839".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "yomp1nefsj".to_string(),
            token_a_symbol: "ICP".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "3408_1839".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "037cntksm7".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "ETH".to_string(),
            token_b_chain: "Base".to_string(),
            token_b_token_id: "1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "7kfye2or11".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Base".to_string(),
            token_b_token_id: "3408_1027".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "uftn6j4djt".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "SOL".to_string(),
            token_b_chain: "Solana".to_string(),
            token_b_token_id: "5426".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "422o3xsuzx".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Solana".to_string(),
            token_b_token_id: "3408_5426".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "ccuhrdww3k".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "BNB".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "1839".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
        Pair {
            pool_id: "4irjsvtjke".to_string(),
            token_a_symbol: "ckUSDC".to_string(),
            token_a_chain: "ICP".to_string(),
            token_a_token_id: "3408_8916".to_string(),
            token_b_symbol: "USDC".to_string(),
            token_b_chain: "Binance Smart Chain".to_string(),
            token_b_token_id: "3408_1839".to_string(),
            pair_type: "Cross-Chain".to_string(),
        },
    ]
}

pub fn get_pair_by_pool_id(pool_id: &str) -> Option<Pair> {
    get_supported_pairs()
        .into_iter()
        .find(|p| p.pool_id == pool_id)
}

pub fn find_token_by_address(address: &str, chain: &str) -> Option<Token> {
    get_supported_tokens().into_iter().find(|token| {
        token
            .token_address
            .as_ref()
            .map(|addr| {
                addr.eq_ignore_ascii_case(address)
                    && token.token_chain.eq_ignore_ascii_case(chain)
            })
            .unwrap_or(false)
    })
}

pub async fn get_token_price_from_feed(token: &Token) -> Result<f64, String> {
    #[derive(candid::CandidType, serde::Deserialize)]
    struct PriceFeedResult {
        value: Vec<u8>,
        timestamp: u64,
    }

    let price_feed_canister = Principal::from_text(PRICE_FEED_CANISTER)
        .map_err(|e| format!("Invalid price feed canister ID: {}", e))?;

    let price_result: Result<(Option<PriceFeedResult>,), _> = ic_cdk::call(
        price_feed_canister,
        "get_value",
        (token.price_feed_id.clone(),),
    )
    .await;

    match price_result {
        Ok((Some(feed),)) => match from_reader::<f64, _>(&feed.value[..]) {
            Ok(value) => Ok(value),
            Err(_) => match from_reader::<u64, _>(&feed.value[..]) {
                Ok(int_value) => Ok(int_value as f64),
                Err(e) => Err(format!("Failed to decode CBOR price: {}", e)),
            },
        },
        Ok((None,)) => Err("Price feed not found".to_string()),
        Err(e) => Err(format!("Failed to get price feed: {:?}", e)),
    }
}

pub fn initialize_pools_from_pairs() {
    let pairs = get_supported_pairs();
    let tokens = get_supported_tokens();
    
    let pool_data: Vec<PoolData> = pairs
        .into_iter()
        .map(|pair| {
            let token_a = tokens
                .iter()
                .find(|t| t.token_id == pair.token_a_token_id)
                .expect(&format!("Token A not found for pair {}", pair.pool_id));
            
            let token_b = tokens
                .iter()
                .find(|t| t.token_id == pair.token_b_token_id)
                .expect(&format!("Token B not found for pair {}", pair.pool_id));
            
            PoolData {
                pool_id: pair.pool_id,
                token_a: pair.token_a_symbol,
                token_b: pair.token_b_symbol,
                token_a_address: token_a.token_address.clone().unwrap_or_default(),
                token_b_address: token_b.token_address.clone().unwrap_or_default(),
                token_a_chain: pair.token_a_chain,
                token_b_chain: pair.token_b_chain,
                token_a_balance: "0.00".to_string(),
                token_b_balance: "0.00".to_string(),
            }
        })
        .collect();
    
    crate::state::storage::initialize_pools(pool_data);
}

pub fn get_pool_info() -> PoolsResponse {
    let pool_data = crate::state::storage::get_all_pools();
    
    if pool_data.is_empty() {
        initialize_pools_from_pairs();
        let pool_data = crate::state::storage::get_all_pools();
        
        let pools = pool_data
            .into_iter()
            .map(|p| PoolInfo {
                pool_id: p.pool_id,
                token_a: p.token_a,
                token_b: p.token_b,
                token_a_address: p.token_a_address,
                token_b_address: p.token_b_address,
                token_a_chain: p.token_a_chain,
                token_b_chain: p.token_b_chain,
                token_a_balance: p.token_a_balance,
                token_b_balance: p.token_b_balance,
            })
            .collect();
        
        return PoolsResponse { pools };
    }
    
    let pools = pool_data
        .into_iter()
        .map(|p| PoolInfo {
            pool_id: p.pool_id,
            token_a: p.token_a,
            token_b: p.token_b,
            token_a_address: p.token_a_address,
            token_b_address: p.token_b_address,
            token_a_chain: p.token_a_chain,
            token_b_chain: p.token_b_chain,
            token_a_balance: p.token_a_balance,
            token_b_balance: p.token_b_balance,
        })
        .collect();

    PoolsResponse { pools }
}
