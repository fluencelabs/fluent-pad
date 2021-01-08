/*
 * Copyright 2020 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

mod utils;

use utils::*;

use serde::Deserialize;
use serde::Serialize;
use serde_json::json;

const TEST_CONFIG_PATH: &str = "UserListTestConfig.toml";

#[derive(Clone, Debug, Default, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct User {
    pub peer_id: String,
    pub relay_id: String,
    pub name: String,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct GetUsersServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub users: Vec<User>,
}

#[test]
fn add_delete_users() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let result = call_app_service!(
        app_service,
        "join",
        json!([["peer_id", "relay_id", "name"]])
    );
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(app_service, "get_users", json!([]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "users": [ {
        "peer_id": "peer_id",
        "relay_id": "relay_id",
        "name": "name"
        }]})
    );

    let result = call_app_service!(app_service, "delete", json!(["peer_id"]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "" }));

    let result = call_app_service!(app_service, "get_users", json!([]));
    let get_users_result: GetUsersServiceResult =
        serde_json::from_value(result).expect("success deserialization");
    assert_eq!(get_users_result.ret_code, 0);
    assert!(get_users_result.users.is_empty());
}

#[test]
fn add_delete_many_users() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let user_count = 10_000;
    let mut users = Vec::with_capacity(user_count);
    for i in 0..user_count {
        let user = User {
            peer_id: format!("peer_id_{}", i),
            relay_id: format!("relay_id_{}", i),
            name: format!("name_{}", i),
        };

        users.push(user.clone());
        let user = serde_json::to_value(user).expect("success serialization");

        let result = call_app_service!(app_service, "join", json!([user]));
        assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));
    }

    let result = call_app_service!(app_service, "get_users", json!([]));
    let get_users_result: GetUsersServiceResult =
        serde_json::from_value(result).expect("success deserialization");
    assert_eq!(get_users_result.ret_code, 0);
    assert_eq!(get_users_result.users.len(), users.len());

    for i in 0..user_count {
        let user_id = format!("peer_id_{}", i);
        let result = call_app_service!(app_service, "delete", json!([user_id]));
        assert_eq!(result, json!({ "ret_code": 0, "err_msg": "" }));
    }

    let result = call_app_service!(app_service, "get_users", json!([]));
    let get_users_result: GetUsersServiceResult =
        serde_json::from_value(result).expect("success deserialization");
    assert_eq!(get_users_result.ret_code, 0);
    assert!(get_users_result.users.is_empty());
}

#[test]
fn is_exists() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let peer_id = String::from("peer_id");
    let result = call_app_service!(app_service, "is_exists", json!([peer_id]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "is_exists": 0 })
    );

    let user = User {
        peer_id: peer_id.clone(),
        relay_id: String::from("relay_id"),
        name: String::from("name"),
    };
    let user = serde_json::to_value(user).expect("success serialization");

    let result = call_app_service!(app_service, "join", json!([user]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(app_service, "is_exists", json!([peer_id]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "is_exists": 1 })
    );

    let result = call_app_service!(app_service, "delete", json!(["peer_id"]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "" }));

    let result = call_app_service!(app_service, "is_exists", json!([peer_id]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "is_exists": 0 })
    );
}

#[test]
fn unicode_symbols() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let peer_id = String::from("русский");
    let user = User {
        peer_id: peer_id.clone(),
        relay_id: String::from("µµµµ"),
        name: String::from("adasd"),
    };
    let user = serde_json::to_value(user).expect("valid serialization");

    let result = call_app_service!(app_service, "join", json!([user]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(app_service, "is_exists", json!([peer_id]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "is_exists": 1 })
    );

    let result = call_app_service!(app_service, "get_users", json!([]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "users": [ user ]})
    );

    let result = call_app_service!(app_service, "delete", json!([peer_id]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "" }));

    let result = call_app_service!(app_service, "is_exists", json!([peer_id]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "is_exists": 0 })
    );
}

#[test]
fn update_user_info() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let result = call_app_service!(
        app_service,
        "join",
        json!([["peer_id", "relay_id", "name"]])
    );
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(
        app_service,
        "join",
        json!([[
            "peer_id",
            "relay_id_changed",
            "name_changed"
        ]])
    );
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(app_service, "get_users", json!([]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "users": [ {
        "peer_id": "peer_id",
        "relay_id": "relay_id_changed",
        "name": "name_changed"
        }]})
    );
}

#[test]
fn get_user_by_peer_id() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let result = call_app_service!(
        app_service,
        "join",
        json!([["peer_id_1", "relay_id_1", "name_1"]])
    );
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(
        app_service,
        "join",
        json!([["peer_id_2", "relay_id_2", "name_2"]])
    );
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": ""}));

    let result = call_app_service!(app_service, "get_user", json!(["peer_id_1"]));
    assert_eq!(
        result,
        json!({ "ret_code": 0, "err_msg": "", "users": [ {
        "peer_id": "peer_id_1",
        "relay_id": "relay_id_1",
        "name": "name_1"
        }]})
    );

    let result = call_app_service!(app_service, "get_user", json!(["peer_id_3"]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "", "users": [] }));
}
