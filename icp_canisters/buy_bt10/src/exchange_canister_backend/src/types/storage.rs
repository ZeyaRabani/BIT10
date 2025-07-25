use candid::Nat;
use ic_stable_structures::{BoundedStorable, Storable};
use std::borrow::Cow;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct StableString(pub String);

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct StableNat(pub Nat);

impl Storable for StableString {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Borrowed(self.0.as_bytes())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StableString(String::from_utf8(bytes.to_vec()).unwrap())
    }
}

impl BoundedStorable for StableString {
    const MAX_SIZE: u32 = 100;
    const IS_FIXED_SIZE: bool = false;
}

impl Storable for StableNat {
    fn to_bytes(&self) -> Cow<[u8]> {
        let bytes = self.0.0.to_bytes_be();
        Cow::Owned(bytes)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        StableNat(Nat(num_bigint::BigUint::from_bytes_be(&bytes)))
    }
}

impl BoundedStorable for StableNat {
    const MAX_SIZE: u32 = 32;
    const IS_FIXED_SIZE: bool = false;
}