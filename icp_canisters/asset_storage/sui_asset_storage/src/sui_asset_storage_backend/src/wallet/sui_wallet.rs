use crate::ecdsa::EcdsaPublicKey;
use crate::state::{lazy_call_ecdsa_public_key, read_state};
use candid::Principal;
use ic_crypto_ecdsa_secp256k1::{PublicKey, RecoveryId};
use serde_bytes::ByteBuf;
use blake2::{Blake2b, Digest};
use alloy_primitives::hex;
use sha2::{Sha256, Digest as Sha2Digest};
use base64;

type Blake2b256 = Blake2b<blake2::digest::consts::U32>;

#[derive(Debug, PartialEq, Eq, Clone)]
pub struct SuiWallet {
    owner: Principal,
    derived_public_key: EcdsaPublicKey,
}

impl AsRef<PublicKey> for SuiWallet {
    fn as_ref(&self) -> &PublicKey {
        self.derived_public_key.as_ref()
    }
}

impl SuiWallet {
    pub async fn new(owner: Principal) -> Self {
        let derived_public_key = derive_public_key(&owner, &lazy_call_ecdsa_public_key().await);
        Self {
            owner,
            derived_public_key,
        }
    }

    pub fn sui_address(&self) -> String {
        let compressed_public_key = self.derived_public_key.as_ref().serialize_sec1(true);
        
        let mut address_input = vec![0x01];
        address_input.extend_from_slice(&compressed_public_key);
        
        let mut hasher = Blake2b256::new();
        hasher.update(&address_input);
        let hash = hasher.finalize();
        
        format!("0x{}", hex::encode(hash.as_slice()))
    }

    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.derived_public_key.as_ref().serialize_sec1(true).to_vec()
    }

    pub async fn sign_with_ecdsa(&self, message_hash: [u8; 32]) -> ([u8; 64], RecoveryId) {
        use ic_cdk::api::management_canister::ecdsa::SignWithEcdsaArgument;

        let derivation_path = derivation_path(&self.owner);
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
    use ic_crypto_extended_bip32::{DerivationIndex, DerivationPath};
    let derivation_path = DerivationPath::new(
        derivation_path(owner)
            .into_iter()
            .map(DerivationIndex)
            .collect(),
    );
    public_key
        .derive_new_public_key(&derivation_path)
        .expect("BUG: failed to derive an ECDSA public key")
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