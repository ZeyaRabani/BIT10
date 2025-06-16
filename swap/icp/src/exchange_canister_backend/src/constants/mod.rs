use ic_cdk::Principal;

pub const BIT10_BTC_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x01");
pub const TEST_BIT10_DEFI_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x02");
pub const TEST_BIT10_BRC20_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x03");
pub const TEST_BIT10_TOP_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x04");
pub const TEST_BIT10_MEME_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x05");

pub const CKBTC_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x06");
pub const CKETH_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x07");
pub const ICP_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x08");
pub const BIT10_DEFI_LEDGER_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x09");

// Platform fee constants
pub const PLATFORM_FEE_PERCENTAGE: f64 = 0.03; // 3%
pub const MINTING_FEE_PERCENTAGE: f64 = 0.01; // 1%

// Price feed canister ID
pub const PRICE_FEED_CANISTER_ID: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x0A");

// Treasury account
pub const TREASURY_ACCOUNT: Principal = Principal::from_slice(b"\x00\x00\x00\x00\x02\x30\x00\xCC\x01\x0B");

// API URLs
pub const BIT10_DEFI_PRICE_URL: &str = "https://backend-91c09684-367d-4578-8623-5085be8c9158.bit10.app/bit10-defi-current-price";
pub const BIT10_BRC20_PRICE_URL: &str = "https://backend-91c09684-367d-4578-8623-5085be8c9158.bit10.app/bit10-brc20-current-price";
pub const BIT10_TOP_PRICE_URL: &str = "https://backend-91c09684-367d-4578-8623-5085be8c9158.bit10.app/test-bit10-top-current-price";
pub const BIT10_MEME_PRICE_URL: &str = "https://backend-91c09684-367d-4578-8623-5085be8c9158.bit10.app/test-bit10-meme-current-price";