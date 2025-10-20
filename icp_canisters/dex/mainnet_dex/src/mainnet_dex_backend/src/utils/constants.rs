use crate::types::network::{BaseNetwork, BscNetwork};

pub const ANKR_API_KEY: &str =
    "xgdghfbjxcfnkmszdhbfhjbdfv";

pub fn get_base_rpc_url(network: BaseNetwork) -> String {
    match network {
        BaseNetwork::Mainnet => {
            format!("https://rpc.ankr.com/base/{}", ANKR_API_KEY)
        }
        BaseNetwork::Sepolia => format!(
            "https://rpc.ankr.com/base_sepolia/{}",
            ANKR_API_KEY
        ),
    }
}

pub fn get_bsc_rpc_url(network: BscNetwork) -> String {
    match network {
        BscNetwork::Mainnet => {
            format!("https://rpc.ankr.com/bsc/{}", ANKR_API_KEY)
        }
        BscNetwork::Testnet => format!(
            "https://rpc.ankr.com/bsc_testnet_chapel/{}",
            ANKR_API_KEY
        ),
    }
}

pub const PRICE_FEED_CANISTER: Principal::from_slice(b"\x00\x00\x00\x00\x01\xc0\xdd\x96\x01\x01");
