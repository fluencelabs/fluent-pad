#!/bin/sh

(
  cd services/user-list-inmemory
  cargo update
  marine build --release
)

(
  cd services/history-inmemory
  cargo update
  marine build --release
)

rm -f app/user_list.wasm
rm -f app/history.wasm

cp services/user-list-inmemory/target/wasm32-wasi/release/user_list.wasm app/
cp services/history-inmemory/target/wasm32-wasi/release/history.wasm app/
