#!/usr/bin/env bash
set -euo pipefail

TARGET="wasm32-unknown-unknown"
CANISTER="brc20_asset_storage"
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Ensuring that the directory exists before navigating
if [ -d "$SCRIPT_DIR" ]; then
  pushd "$SCRIPT_DIR" || exit 1
else
  echo "Directory $SCRIPT_DIR does not exist."
  exit 1
fi

# NOTE: On macOS, a specific version of llvm-ar and clang need to be set here.
# Otherwise, the wasm compilation of rust-secp256k1 will fail.
if [ "$(uname)" == "Darwin" ]; then
  LLVM_PATH=$(brew --prefix llvm)
  # On Macs, use the brew versions of llvm-ar and clang
  AR="${LLVM_PATH}/bin/llvm-ar" CC="${LLVM_PATH}/bin/clang" cargo build --target $TARGET --release
else
  cargo build --target $TARGET --release
fi

cargo install ic-wasm --version 0.2.0 --root ./

# Ensure that the target directory exists before running ic-wasm
if [ -f "$SCRIPT_DIR/../../target/$TARGET/release/$CANISTER.wasm" ]; then
  ./bin/ic-wasm \
      "$SCRIPT_DIR/../../target/$TARGET/release/$CANISTER.wasm" \
      -o "$SCRIPT_DIR/../../target/$TARGET/release/$CANISTER.wasm" \
      metadata candid:service -f "$SCRIPT_DIR/brc20_asset_storage.did" -v public
else
  echo "Wasm file not found at expected location."
  exit 1
fi

# Navigate back to the original directory
popd || exit 1
