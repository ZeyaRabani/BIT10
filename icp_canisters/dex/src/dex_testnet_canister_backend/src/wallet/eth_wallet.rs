use crate::state::{lazy_call_ecdsa_public_key, read_state};
use crate::wallet::ecdsa::EcdsaPublicKey;
use candid::Principal;
use ic_ethereum_types::Address;
use ic_secp256k1::{PublicKey, RecoveryId};
use serde_bytes::ByteBuf;

#[derive(Debug, PartialEq, Eq, Clone)]
pub struct EthereumWallet {
    derived_public_key: EcdsaPublicKey,
}

impl AsRef<PublicKey> for EthereumWallet {
    fn as_ref(&self) -> &PublicKey {
        self.derived_public_key.as_ref()
    }
}

impl EthereumWallet {
    pub async fn new(owner: Principal) -> Self {
        let derived_public_key = derive_public_key(&owner, &lazy_call_ecdsa_public_key().await);
        Self {
            derived_public_key,
        }
    }

    pub async fn new_canister_wallet() -> Self {
        let canister_public_key = lazy_call_ecdsa_public_key().await;
        Self {
            derived_public_key: canister_public_key,
        }
    }

    pub fn ethereum_address(&self) -> Address {
        Address::from(&self.derived_public_key)
    }

    pub async fn sign_with_ecdsa(&self, message_hash: [u8; 32]) -> ([u8; 64], RecoveryId) {
        use ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument;

        let derivation_path = vec![];
        let key_id = read_state(|s| s.ecdsa_key_id());
        let (result,) =
            ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(SignWithEcdsaArgument {
                message_hash: message_hash.to_vec(),
                derivation_path,
                key_id,
            })
            .await
            .expect("failed to sign with ecdsa");
        let signature_length = result.signature.len();
        let signature = <[u8; 64]>::try_from(result.signature).unwrap_or_else(|_| {
            panic!(
                "BUG: invalid signature from management canister. Expected 64 bytes but got {} bytes",
                signature_length
            )
        });
        let recovery_id = self.compute_recovery_id(&message_hash, &signature);
        if recovery_id.is_x_reduced() {
            ic_cdk::trap("BUG: affine x-coordinate of r is reduced which is so unlikely to happen that it's probably a bug");
        }
        (signature, recovery_id)
    }

    fn compute_recovery_id(&self, message_hash: &[u8], signature: &[u8]) -> RecoveryId {
        use alloy_primitives::hex;

        assert!(
            self.as_ref()
                .verify_signature_prehashed(message_hash, signature),
            "failed to verify signature prehashed, digest: {:?}, signature: {:?}, public_key: {:?}",
            hex::encode(message_hash),
            hex::encode(signature),
            hex::encode(self.as_ref().serialize_sec1(true)),
        );
        self.as_ref()
            .try_recovery_from_digest(message_hash, signature)
            .unwrap_or_else(|e| {
                panic!(
                    "BUG: failed to recover public key {:?} from digest {:?} and signature {:?}: {:?}",
                    hex::encode(self.as_ref().serialize_sec1(true)),
                    hex::encode(message_hash),
                    hex::encode(signature),
                    e
                )
            })
    }
}

fn derive_public_key(owner: &Principal, public_key: &EcdsaPublicKey) -> EcdsaPublicKey {
    use ic_secp256k1::{DerivationIndex, DerivationPath};
    let derivation_path = DerivationPath::new(
        derivation_path(owner)
            .into_iter()
            .map(DerivationIndex)
            .collect(),
    );
    public_key.derive_new_public_key(&derivation_path)
}

fn derivation_path(owner: &Principal) -> Vec<Vec<u8>> {
    const SCHEMA_V1: u8 = 1;
    [
        ByteBuf::from(vec![SCHEMA_V1]),
        ByteBuf::from(owner.as_slice().to_vec()),
    ]
    .iter()
    .map(|x| x.to_vec())
    .collect()
}