Use [proto-distributor](https://github.com/fluencelabs/proto-distributor) to upload and test services.

## Deploy and test
Step-by-step: 

- build scripts and copy fresh artifacts to `artifacts` directory by a script:
```shell
cd services
./build.sh
```

- upload modules and create services. We need to remember a pid of a client, because some of methods in services can be called only by an owner. Some random seed for current owner: `7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar`. Use your own path to services artifacts.
```shell
# upload modules
# -n - name of a module
# -p - path to a wasm file
node -r esm . upload -n user-list -p path/to/fluent-pad/services/artifacts/user-list.wasm
node -r esm . upload -n history -p path/to/fluent-pad/services/artifacts/history.wasm
# create blueprints with this modules
# -d - list of dependencies
# -i - id of a blueprint
# -n - name of a blueprint
node -r esm . add_blueprint -d user-list -i user-list -n user-list
node -r esm . add_blueprint -d user-list -i history -n history
# create services with hardcoded seed
# -i - id of a blueprint
# -s - seed of a client that will be a creator/owner of a service
node -r esm . create_service -i user-list -s 7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar
node -r esm . create_service -i history -s 7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar
```
- last two command will return service ids, we need to store it somewhere
```shell
# user-list a38a396a-2b3d-4ef5-8b8b-ed448670bcfe
# history d9abbacf-6ee2-49e5-9683-536a5c931fa1
```
Service ids changed per every service creation.
- other hardcoded peer id `12D3KooWSaSTAV7ftrN8f5UXkB9MYnFtdpAJpgUZbV7r2XpfVsF2z` with seed `G2r9BEsuaBHaDyMxGb2Bxv61PpH6r8UjKT564CdeU4BD`  we will add to userlist service by air script. Save this script to a file.
```shell
(seq
 (call relay ("op" "identity") [])
 (seq
  (call relay (userlist "join")
        [user] result)
  (call %init_peer_id% (returnService "") [result])
     ))
```
More about `aquamarine` you can find [here](https://fluence-labs.readme.io/docs/air-scripts).

Command to send script:
```shell
node -r esm . run_air -p path/to/script -d '{"userlist":"a38a396a-2b3d-4ef5-8b8b-ed448670bcfe","history":"d9abbacf-6ee2-49e5-9683-536a5c931fa1","user":{"peer_id":"12D3KooWSaSTAV7ftrN8f5UXkB9MYnFtdpAJpgUZbV7r2XpfVsF2","relay_id":"","name":"some_name"}}' -s 7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar
```
- add a tetraplet by a creator to a history service. `12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb` is a peer id of a node where service deployed

Script:
```shell
(seq
 (call relay ("op" "identity") [])
 (seq
  (call relay (history "set_tetraplet")
        ["12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb" "a38a396a-2b3d-4ef5-8b8b-ed448670bcfe" "is_authenticated" json_path] auth_result)
  (call %init_peer_id% (returnService "") [auth_result])
     ))
```
Command:
```shell
ode -r esm . run_air -p /path/to/script -d '{"userlist":"a38a396a-2b3d-4ef5-8b8b-ed448670bcfe","history":"d9abbacf-6ee2-49e5-9683-536a5c931fa1", "json_path":"$.[\"is_authenticated\"]"}' -s 7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar
```
- A second user can auth and add messages after
```shell
(seq
 (call relay ("op" "identity") [])
 (seq
  (call relay (userlist "is_authenticated")
        [] status)
  (seq
  (call relay (history "add")
        [msg status.$.["is_authenticated"]] auth_result)
  (call %init_peer_id% (returnService "") [auth_result])
     )))
```
```shell
node -r esm . run_air -p path/to-script -d '{"userlist":"a38a396a-2b3d-4ef5-8b8b-ed448670bcfe","history":"d9abbacf-6ee2-49e5-9683-536a5c931fa1", "json_path":"$.[\"is_authenticated\"]", "msg":"Hi there!"}' -s G2r9BEsuaBHaDyMxGb2Bxv61PpH6r8UjKT564CdeU4BD
```
- also, we can get user list by `get_users` method and messages by `get_all` method