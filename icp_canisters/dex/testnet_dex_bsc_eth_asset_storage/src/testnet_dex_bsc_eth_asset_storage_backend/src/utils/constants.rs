use candid::Principal;

pub const TATUM_API_KEY: &str = "<YOUR-API-KEY>";

pub const EVM_RPC_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01");

pub const PRICE_FEED_CANISTER_ID: Principal =
    Principal::from_slice(b"\x00\x00\x00\x00\x01\xc0\xdd\x96\x01\x01").expect("Invalid price feed canister principal");

pub const TRANSFER_EVENT_SIGNATURE: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";