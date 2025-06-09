use std::collections::BTreeMap;
use std::cell::RefCell;
use ic_cdk::storage;
use crate::models::ilp::IlpResponseData;
use crate::models::slp::{SLPResponseData, SLPWithdrawResponseData};

thread_local! {
    pub static RETRY_COUNT: RefCell<u8> = RefCell::new(0);
    pub static RETRY_RESULT: RefCell<Option<Result<Vec<u8>, String>>> = RefCell::new(None);
    pub static VERIFICATION_RETRY_COUNT: RefCell<u8> = RefCell::new(0);
    pub static TIMER_ID: RefCell<Option<ic_cdk_timers::TimerId>> = RefCell::new(None);
}

pub type StableResponses = BTreeMap<u64, IlpResponseData>;
pub type StableSLPResponses = BTreeMap<u64, SLPResponseData>;
pub type StableSLPWithdrawResponses = BTreeMap<u64, SLPWithdrawResponseData>;

pub static mut RESPONSES: Option<StableResponses> = None;
pub static mut SLP_RESPONSES: Option<StableSLPResponses> = None;
pub static mut SLP_WITHDRAW_RESPONSES: Option<StableSLPWithdrawResponses> = None;

#[ic_cdk::pre_upgrade]
pub fn pre_upgrade() {
    unsafe {
        let responses_vec = RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());
        let slp_responses_vec = SLP_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());
        let slp_withdraw_responses_vec = SLP_WITHDRAW_RESPONSES.as_ref().map_or(Vec::new(), |r| r.values().cloned().collect());

        storage::stable_save((responses_vec, slp_responses_vec, slp_withdraw_responses_vec))
            .expect("Failed to save responses to stable storage");
    }
}

#[ic_cdk::post_upgrade]
pub fn post_upgrade() {
    unsafe {
        RESPONSES = Some(StableResponses::new());
        SLP_RESPONSES = Some(StableSLPResponses::new());
        SLP_WITHDRAW_RESPONSES = Some(StableSLPWithdrawResponses::new());

        if let Ok((responses_vec, slp_responses_vec, slp_withdraw_responses_vec)) = 
            storage::stable_restore::<(Vec<IlpResponseData>, Vec<SLPResponseData>, Vec<SLPWithdrawResponseData>)>() 
        {
            for (index, response) in responses_vec.into_iter().enumerate() {
                RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
            for (index, response) in slp_responses_vec.into_iter().enumerate() {
                SLP_RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
            for (index, response) in slp_withdraw_responses_vec.into_iter().enumerate() {
                SLP_WITHDRAW_RESPONSES.as_mut().unwrap().insert(index as u64, response);
            }
        }
    }
}
