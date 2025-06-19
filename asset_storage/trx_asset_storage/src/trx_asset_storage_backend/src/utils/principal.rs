use candid::Principal;

pub fn principal_to_tron_address(principal: &Principal) -> String {
    let bytes = principal.as_slice();

    let mut address = vec![0x41];
    if bytes.len() >= 20 {
        address.extend_from_slice(&bytes[0..20]);
    } else {
        address.extend_from_slice(bytes);
        address.resize(21, 0);
    }

    bs58::encode(address).with_check().into_string()
}