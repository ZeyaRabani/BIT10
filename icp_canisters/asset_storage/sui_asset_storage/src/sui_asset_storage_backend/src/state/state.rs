use candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub sui_network: Option<SuiNetwork>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum SuiNetwork {
    Mainnet,
    Testnet,
    #[default]
    Devnet,
}

impl SuiNetwork {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            SuiNetwork::Mainnet => "https://sui-mainnet.gateway.tatum.io/",
            SuiNetwork::Testnet => "https://sui-testnet.gateway.tatum.io/",
            SuiNetwork::Devnet => "https://fullnode.devnet.sui.io:443",
        }
    }
}

static mut SUI_NETWORK: Option<SuiNetwork> = None;

pub fn init_state(arg: InitArg) {
    unsafe {
        SUI_NETWORK = arg.sui_network;
    }
}

pub fn read_state<F, R>(f: F) -> R
where
    F: FnOnce(&SuiNetwork) -> R,
{
    unsafe {
        let network = SUI_NETWORK.unwrap_or_default();
        f(&network)
    }
}