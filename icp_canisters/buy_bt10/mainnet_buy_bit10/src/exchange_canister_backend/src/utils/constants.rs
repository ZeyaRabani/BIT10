use ic_principal::Principal;
use crate::types::network::{BaseNetwork, BscNetwork};

pub const ANKR_API_KEY: &str = "hbshdbfjjndkfvnkdlfxv,df";

pub fn get_rpc_url(network: BaseNetwork) -> String {
    match network {
        BaseNetwork::Mainnet => format!(
            "https://rpc.ankr.com/base/{}",
            ANKR_API_KEY
        ),
        BaseNetwork::Sepolia => format!(
            "https://rpc.ankr.com/base_sepolia/{}",
            ANKR_API_KEY
        ),
    }
}

pub fn get_bsc_rpc_url(network: BscNetwork) -> String {
    match network {
        BscNetwork::Mainnet => format!(
            "https://rpc.ankr.com/bsc/{}",
            ANKR_API_KEY
        ),
        BscNetwork::Testnet => format!(
            "https://rpc.ankr.com/bsc_testnet_chapel/{}",
            ANKR_API_KEY
        ),
    }
}

pub static PLATFORM_WALLET: Lazy<Principal> = Lazy::new(|| {
    Principal::from_slice(b"\x5e\xd7\x74\xb7\x50\xc0\xf1\xe0\xca\x4e\x9c\xd8\x0c\x86\x36\x3b\xff\xc3\x1f\xd2\x90\xdd\x84\x4b\x30\x8b\x70\xa5\x02")
});

pub const TARGET_ADDRESS: &str = "sdhbjndfklmflkcvbbmcfv";

pub const BSC_TARGET_ADDRESS: &str = "szxcvhhxjcvjxncvkjnxckvcjxncjvnkjcnvjlkcvn";

pub const SOLANA_TARGET_ADDRESS: &str = "ashdbghjbdjnkjfncv;klmxcvl;,xc'v";

pub const PRICE_FEED_CANISTER: Lazy<Principal> = Lazy::new(|| {Principal::from_slice(b"\x00\x00\x00\x00\x01\xc0\xdd\x96\x01\x01"});
