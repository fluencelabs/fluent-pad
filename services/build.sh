#!/bin/sh

(
  cd user-list-inmemory
  cargo update
  fce build --release
)
(
  cd history-inmemory
  cargo update
  fce build --release
)

rm -f artifacts/user_list.wasm
rm -f artifacts/history.wasm
mkdir -p artifacts
cp user-list-inmemory/target/wasm32-wasi/release/user_list.wasm artifacts/
echo '{"name":"user_list"}' > artifacts/user_list.json
cp history-inmemory/target/wasm32-wasi/release/history.wasm artifacts/
echo '{"name":"history"}' > artifacts/history.json

