use ic_cdk::api;
use ic_cdk::export::candid::{CandidType, Encode, Decode};
use std::collections::HashMap;

#[derive(CandidType, Debug)]
struct Asset {
    id: String,
    amount: u64,
}

#[update]
fn store_asset(asset: Asset) {
    let mut assets: HashMap<String, Asset> = api::data::get::<HashMap<String, Asset>>().unwrap_or_default();
    assets.insert(asset.id.clone(), asset);
    api::data::set(&assets);
}

#[query]
fn get_asset(id: String) -> Option<Asset> {
    let assets: HashMap<String, Asset> = api::data::get::<HashMap<String, Asset>>().unwrap_or_default();
    assets.get(&id).cloned()
}