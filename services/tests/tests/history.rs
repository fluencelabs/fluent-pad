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

const TEST_CONFIG_PATH: &str = "HistoryTestConfig.toml";

#[derive(Clone, Debug, Default, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub body: String,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct GetMessagesServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub messages: Vec<Message>,
}

#[test]
fn get_all() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    call_app_service!(app_service, "set_tetraplet", json!(["", "", "", ""]));
    let result = call_app_service!(app_service, "add", json!(["body_1", 1]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "", "msg_id": 0 }));

    let result = call_app_service!(app_service, "add", json!(["body_2", 1]));
    assert_eq!(result, json!({ "ret_code": 0, "err_msg": "", "msg_id": 1 }));

    let result = call_app_service!(app_service, "get_all", json!([]));
    let result: GetMessagesServiceResult =
        serde_json::from_value(result).expect("valid deserialization");

    assert_eq!(result.ret_code, 0);
    assert_eq!(
        result.messages,
        vec![
            Message {
                id: 0,
                body: String::from("body_1"),
            },
            Message {
                id: 1,
                body: String::from("body_2"),
            },
        ]
    );
}

#[test]
fn get_last() {
    let mut app_service = create_app_service(TEST_CONFIG_PATH);

    let messages_count = 10_000;
    for i in 0..messages_count {
        let body = format!("body_{}", i);

        let result = call_app_service!(app_service, "add", json!([body]));
        assert_eq!(
            result,
            json!({ "ret_code": 0, "err_msg": "", "msg_id": i })
        );
    }

    let result = call_app_service!(app_service, "get_last", json!([7]));
    let result: GetMessagesServiceResult =
        serde_json::from_value(result).expect("valid deserialization");
    assert_eq!(result.messages.len(), 7);

    assert_eq!(
        result.messages[0],
        Message {
            id: messages_count - 1,
            body: format!("body_{}", messages_count - 1),
        }
    );
}
