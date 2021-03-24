#!/bin/sh

docker kill fluence_node
docker run --rm --name fluence_node -e RUST_LOG="info" -p 1210:1210 -p 4310:4310 fluencelabs/fluence -t 1210 -w 4310 -k gKdiCSUr1TFGFEgu2t8Ch1XEUsrN5A2UfBLjSZvfci9SPR3NvZpACfcpPGC3eY4zma1pk7UvYv5zb1VjvPHwCjj
fldist deploy_app --env local -s Fs6nQaGEsM5EgnprUbUtoLYWhUC8o6QK1gseP9pfhzUm -i app/app.config.json -o client/src/app.json
