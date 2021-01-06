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

use crate::message::Message;
use crate::storage_api::*;

use fluence::fce;

pub const SUCCESS_CODE: i32 = 0;

#[fce]
pub struct AddServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub msg_id: u64,
}

#[fce]
fn add(author: String, msg: String, reply_to: i64) -> AddServiceResult {
    add_message(msg, author, reply_to).into()
}

#[fce]
pub struct GetMessagesServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub messages: Vec<Message>,
}

#[fce]
fn get_all() -> GetMessagesServiceResult {
    get_all_messages().into()
}

#[fce]
fn get_last(last: u64) -> GetMessagesServiceResult {
    get_messages_with_limit(last).into()
}

#[fce]
fn get_by_reply_to(reply_to: u64) -> GetMessagesServiceResult {
    get_messages_by_reply_to(reply_to).into()
}

#[fce]
pub struct CountServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub messages_count: u64,
}

#[fce]
fn count_by_reply_to(reply_to: u64) -> CountServiceResult {
    count_messages_by_reply_to(reply_to).into()
}
