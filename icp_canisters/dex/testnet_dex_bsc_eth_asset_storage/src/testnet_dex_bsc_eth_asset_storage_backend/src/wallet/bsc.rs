use crate::wallet::ecdsa::EcdsaPublicKey;
use crate::state::{lazy_call_ecdsa_public_key, read_state};
use candid::Principal;
use ic_secp256k1::{PublicKey, RecoveryId};
use ic_ethereum_types::Address;
use alloy_primitives::hex;

#[derive(Debug, PartialEq, Eq, Clone)]
pub struct BscWallet {
    derived_public_key: EcdsaPublicKey,
}

impl AsRef<PublicKey> for BscWallet {
    fn as_ref(&self) -> &PublicKey {
        self.derived_public_key.as_ref()
    }
}

impl BscWallet {
    pub async fn new(_owner: Principal) -> Self {
        Self::new_canister_wallet().await
    }

    pub async fn new_canister_wallet() -> Self {
        let canister_public_key = lazy_call_ecdsa_public_key().await;
        Self {
            derived_public_key: canister_public_key,
        }
    }

    pub fn bsc_address(&self) -> Address {
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
        match self.as_ref().try_recovery_from_digest(message_hash, signature) {
            Ok(recovery_id) => recovery_id,
            Err(e) => {
                ic_cdk::trap(&format!(
                    "Failed to recover public key from digest and signature: {:?}",
                    e
                ));
            }
        }
    }
}