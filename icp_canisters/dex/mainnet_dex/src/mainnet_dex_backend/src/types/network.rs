use candid::{CandidType, Deserialize};
use ic_cdk::api::management_canister::ecdsa::{EcdsaCurve, EcdsaKeyId};

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq)]
pub struct InitArg {
    pub base_network: Option<BaseNetwork>,
    pub solana_network: Option<SolanaNetwork>,
    pub bsc_network: Option<BscNetwork>,
    pub ecdsa_key_name: Option<EcdsaKeyName>,
    pub ed25519_key_name: Option<Ed25519KeyName>,
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum BaseNetwork {
    Mainnet,
    #[default]
    Sepolia,
}

impl BaseNetwork {
    pub fn chain_id(&self) -> u64 {
        match self {
            BaseNetwork::Mainnet => 8453,
            BaseNetwork::Sepolia => 84532,
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum SolanaNetwork {
    Mainnet,
    #[default]
    Devnet,
}

impl SolanaNetwork {
    pub fn rpc_url(&self) -> String {
        match self {
            SolanaNetwork::Mainnet => {
                "https://mainnet.helius-rpc.com/?api-key=hzggdhfbxcnvcvb".to_string()
            }
            SolanaNetwork::Devnet => {
                format!(
                    "https://rpc.ankr.com/solana_devnet/{}",
                    crate::utils::constants::ANKR_API_KEY
                )
            }
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum BscNetwork {
    #[default]
    Mainnet,
    Testnet,
}

impl BscNetwork {
    pub fn chain_id(&self) -> u64 {
        match self {
            BscNetwork::Mainnet => 56,
            BscNetwork::Testnet => 97,
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone, Copy)]
pub enum Ed25519KeyName {
    #[default]
    LocalDevelopment,
    MainnetTestKey1,
    MainnetProdKey1,
}

impl From<Ed25519KeyName> for sol_rpc_client::ed25519::Ed25519KeyId {
    fn from(key_id: Ed25519KeyName) -> Self {
        match key_id {
            Ed25519KeyName::LocalDevelopment => Self::LocalDevelopment,
            Ed25519KeyName::MainnetTestKey1 => Self::MainnetTestKey1,
            Ed25519KeyName::MainnetProdKey1 => Self::MainnetProdKey1,
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Default, PartialEq, Eq, Clone)]
pub enum EcdsaKeyName {
    #[default]
    TestKeyLocalDevelopment,
    TestKey1,
    ProductionKey1,
}

impl From<&EcdsaKeyName> for ic_cdk::api::management_canister::ecdsa::EcdsaKeyId {
    fn from(key_name: &EcdsaKeyName) -> Self {
        let name = match key_name {
            EcdsaKeyName::TestKeyLocalDevelopment => "dfx_test_key",
            EcdsaKeyName::TestKey1 => "test_key_1",
            EcdsaKeyName::ProductionKey1 => "key_1",
        };
        
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: name.to_string(),
        }
    }
}