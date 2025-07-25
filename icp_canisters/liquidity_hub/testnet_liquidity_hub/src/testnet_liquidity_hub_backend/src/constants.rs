use ic_cdk::api::management_canister::main::CanisterIdRecord;
use candid::Principal;

pub const BIT10_BTC_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01"); // 7hfb6-caaaa-aaaar-qadga-cai

pub const PRICE_FEED_CANISTER_ID: Principal = Principal::from_slice(b"\x82\x7f\xf7\xd9\x00\x00\x00\x00\x01\xc0\xdd\x96"); // qj77p-wiaaa-aaaao-a3wla-cai

pub const MAX_RETRY_COUNT: u8 = 5;
pub const RETRY_INTERVAL_SECONDS: u64 = 1800; // 30 minutes
pub const HTTP_REQUEST_CYCLES: u128 = 25_000_000_000;

// Hardcoed for testing limits on BIT10 Testnet
pub const BTC_POOL_SIZE: u64 = 278_521_692; // 2.78521692 BTC
