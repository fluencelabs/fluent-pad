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

use fluence::{fce, CallParameters};
use crate::Result;
use crate::utils::u64_to_usize;

pub const SUCCESS_CODE: i32 = 0;

#[fce]
pub struct AddServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub msg_id: u64,
}

#[fce]
fn add(msg: String, auth: bool) -> AddServiceResult {
    fn add_impl(msg: String, auth: bool) -> Result<u64> {
        is_authenticated(auth, 2)?;
        add_message(msg)
    }

    add_impl(msg, auth).into()
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
pub struct EmptyResult {
    pub ret_code: i32,
    pub err_msg: String,
}

#[fce]
pub fn set_tetraplet(peer_id: String, service_id: String, fn_name: String, path: String) -> EmptyResult {
    fn set_impl(peer_id: String, service_id: String, fn_name: String, path: String) -> Result<()> {
        is_owner()?;
        Ok(store_tetraplet(peer_id, service_id, fn_name, path))
    }

    set_impl(peer_id, service_id, fn_name, path).into()
}

pub fn is_owner() -> Result<()> {
    use crate::errors::HistoryError::Unauthorized;
    use boolinator::Boolinator;

    let call_parameters: CallParameters = fluence::get_call_parameters();
    let init_peer_id = call_parameters.init_peer_id;

    (init_peer_id == call_parameters.service_creator_peer_id).ok_or_else(|| Unauthorized("This operation could be processed only by owner.".to_string()))
}

pub fn is_authenticated(auth: bool, index: u64) -> Result<()> {
    use crate::errors::HistoryError::Unauthorized;
    use boolinator::Boolinator;

    match get_tetraplet() {
        None => Err(Unauthorized("Set tetraplet before usage".to_string())),
        Some(t) => {
            let call_parameters: CallParameters = fluence::get_call_parameters();
            let index = u64_to_usize(index)?;
            let st = &call_parameters.tetraplets[index][0];

            (st.peer_pk == t.peer_pk && st.function_name == t.fn_name
                && st.service_id == t.service_id &&
                st.json_path == t.json_path && auth).ok_or_else(|| Unauthorized("Tetraplet did not pass the check.".to_string()))
        }
    }
}