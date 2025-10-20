use alloy_primitives::U256;
use rust_decimal::Decimal;
use std::str::FromStr;

pub fn u256_to_decimal_string(value: U256, decimals: u8) -> Result<String, String> {
    let value_str = value.to_string();
    let value_decimal = Decimal::from_str(&value_str)
        .map_err(|_| "Failed to convert U256 to Decimal")?;
    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    let result = value_decimal / scale_factor;
    Ok(result.to_string())
}

pub fn decimal_to_u256(value: Decimal, decimals: u8) -> Result<U256, String> {
    let scale_factor = Decimal::from(10u64.pow(decimals as u32));
    let amount_in_smallest_unit = (value * scale_factor).trunc();
    U256::from_str(&amount_in_smallest_unit.to_string())
        .map_err(|_| "Failed to convert Decimal to U256".to_string())
}

pub async fn generate_uuid_without_hyphens() -> String {
    use ic_cdk::api::management_canister::main::raw_rand;
    
    let (bytes,): (Vec<u8>,) = raw_rand().await.expect("raw_rand failed");
    let mut id = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        id.push_str(&format!("{:02x}", b));
    }
    id
}