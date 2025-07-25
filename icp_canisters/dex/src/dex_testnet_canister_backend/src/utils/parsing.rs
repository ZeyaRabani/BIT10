use candid::Nat;
use num::ToPrimitive;

pub fn nat_to_u64(nat: Nat) -> u64 {
    nat.0.to_u64().unwrap_or_else(|| {
        ic_cdk::trap(&format!("Nat {} doesn't fit into a u64", nat))
    })
}