#!/bin/sh

(
  cd services
  ./build.sh
)

rm -f app/*.wasm
cp -f services/artifacts/*.wasm app/
fldist deploy_app --env local -s Fs6nQaGEsM5EgnprUbUtoLYWhUC8o6QK1gseP9pfhzUm -i app/app.config.json -o client/src/app.json
