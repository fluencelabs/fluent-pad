Use [proto-distributor](https://github.com/fluencelabs/proto-distributor) to upload and test services.

## Build
Step-by-step: 
- install `fce` if needed. [Documentation](https://fluence.dev/docs/how-to-develop-a-module#setting-up)
- build scripts and copy fresh artifacts to `artifacts` directory by a script:
```shell
cd services
./build.sh
```

## Deploy
```shell
$ cd services
$ ./build.sh
$ cd artifacts
$ fldist new_service --modules history.wasm:history.json --name pad-history
    client seed: Fs6nQaGEsM5EgnprUbUtoLYWhUC8o6QK1gseP9pfhzUm
    client peerId: 12D3KooWH2hc6NAE2t6EE5SjmhTtce8VieUiKYNw4ynVCqV6jf6w
    node peerId: 12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb
    ...
    service id: 64ea579e-b863-4a42-b80c-e7b5ec1ab7fa
    service created successfully

$ fldist new_service --modules user-list.wasm:user-list.json --name pad-user-list
    client seed: HaBkus2i7bg6DmvxxSwizcxeo3xhvVJA9wLjyQji4mWc
    client peerId: 12D3KooWR4WGTieeectXFtJxgVqB8vvk3kn531rTdk4pwt4mBn5x
    node peerId: 12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb
    ...
    service id: 91041afe-0c3c-451a-9003-6bb92a570aae
    service created successfully
```
Service ids change on every service creation.

## Set authorization info
We need to set tetraplet so `history` service knows which instance of `user-list` to trust.

[script](../scripts/set_tetraplet.air)
```clojure
(xor
    (seq
        (call relay ("op" "identity") [])
        (seq
            (call relay (history "set_tetraplet") [host userlist function json_path] auth_result)
            (call %init_peer_id% (returnService "run") [auth_result])
        )
    )
    (call %init_peer_id% (returnService "run") [%last_error%])
)
```
Command:
```shell
fldist run_air -p scripts/set_tetraplet.air \
    -s Fs6nQaGEsM5EgnprUbUtoLYWhUC8o6QK1gseP9pfhzUm \
    -d '{
         "host":"12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb", 
         "json_path":"$.[\"is_authenticated\"]",
         "function": "is_authenticated",
         "userlist":"91041afe-0c3c-451a-9003-6bb92a570aae",
         "history":"64ea579e-b863-4a42-b80c-e7b5ec1ab7fa"
        }'
```

## Test
Let's create a new keypair of some user.
```
public  key a.k.a peer id = 12D3KooWSaSTAV7ftrN8f5UXkB9MYnFtdpAJpgUZbV7r2XpfVsF2
private key a.k.a seed    = G2r9BEsuaBHaDyMxGb2Bxv61PpH6r8UjKT564CdeU4BD
``` 
Let's add that user to `userlist` service:
[join script](../scripts/join.air)
```clojure
(xor
    (seq
        (call relay ("op" "identity") [])
        (seq
            (call relay (userlist "join") [user] result)
            (call %init_peer_id% (returnService "run") [result])
        )
    )
    (call %init_peer_id% (returnService "run") [%last_error%])
)
```
Let's execute it, specifying user in `-d` as a JSON object
```shell
fldist run_air -p scripts/join.air -d '{"user":{"peer_id":"12D3KooWSaSTAV7ftrN8f5UXkB9MYnFtdpAJpgUZbV7r2XpfVsF2","relay_id":"","name":"some_name"}, "userlist":"91041afe-0c3c-451a-9003-6bb92a570aae"}' -s 7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar
```

That user can now be authorized and send messages! Let's try it

[add message script](../scripts/add_message.air)
```clojure
(xor
    (seq
        (call relay ("op" "identity") [])
        (seq
            (call relay (userlist "is_authenticated") [] status)
            (seq
                (call relay (history "add") [msg status.$.["is_authenticated"]!] auth_result)
                (call %init_peer_id% (returnService "run") [auth_result])
            )
        )
    )
    (call %init_peer_id% (returnService "run") [%last_error%])
)
```

Note that we provide private key via `-s`:

```shell
fldist -s G2r9BEsuaBHaDyMxGb2Bxv61PpH6r8UjKT564CdeU4BD run_air -p scripts/add_message.air -d '{"msg":"Hi there!", "userlist":"91041afe-0c3c-451a-9003-6bb92a570aae", "history":"64ea579e-b863-4a42-b80c-e7b5ec1ab7fa"}'
```

You can learn more about `Aquamarine` [in the doc](https://fluence.dev/).