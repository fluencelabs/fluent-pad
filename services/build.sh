#!/bin/sh

cd user-list-inmemory
cargo update
fce build --release
cd ../history-inmemory
cargo update
fce build --release

cd ../
rm -f artifacts/user-list.wasm
rm -f artifacts/history.wasm
cp user-list-inmemory/target/wasm32-wasi/release/user-list.wasm artifacts/
cp history-inmemory/target/wasm32-wasi/release/history.wasm artifacts/
