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
use fluence::fce;

#[fce]
pub struct AddServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub msg_id: u64,
}

#[fce]
pub struct GetMessagesServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub messages: Vec<Message>,
}

#[fce]
pub struct EmptyResult {
    pub ret_code: i32,
    pub err_msg: String,
}
