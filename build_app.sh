#!/bin/sh

(
  cd services
  ./build.sh
)

rm -f app/*.wasm
cp -f services/artifacts/*.wasm app/
echo fldist deploy_app "$@" -i app/app.config.json -o client/src/app.json