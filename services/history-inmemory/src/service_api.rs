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

use crate::storage_api::*;

use crate::history_entry::HistoryEntry;
use crate::results::{AddServiceResult, EmptyResult, GetEntriesServiceResult};
use crate::utils::u64_to_usize;
use crate::Result;
use fluence::{marine, CallParameters};

pub const SUCCESS_CODE: i32 = 0;

// add an entry if authenticated, return an error if not
#[marine]
fn add(entry: String, auth: bool) -> AddServiceResult {
    fn add_impl(entry: String, auth: bool) -> Result<u64> {
        is_authenticated(auth, 1)?;
        add_entry(entry)
    }

    add_impl(entry, auth).into()
}

// get all entries
#[marine]
fn get_all(auth: bool) -> GetEntriesServiceResult {
    fn get_all_impl(auth: bool) -> Result<Vec<HistoryEntry>> {
        is_authenticated(auth, 0)?;
        get_all_entries()
    }
    get_all_impl(auth).into()
}

// get last entry
#[marine]
fn get_last(last: u64, auth: bool) -> GetEntriesServiceResult {
    fn get_last_impl(last: u64, auth: bool) -> Result<Vec<HistoryEntry>> {
        is_authenticated(auth, 1)?;
        get_entries_with_limit(last)
    }
    get_last_impl(last, auth).into()
}

// set tetraplet to check on the authentication process. Only the service owner could set it
#[marine]
pub fn set_tetraplet(
    peer_id: String,
    service_id: String,
    fn_name: String,
    path: String,
) -> EmptyResult {
    fn set_impl(peer_id: String, service_id: String, fn_name: String, path: String) -> Result<()> {
        is_owner()?;
        Ok(store_tetraplet(peer_id, service_id, fn_name, path)?)
    }

    set_impl(peer_id, service_id, fn_name, path).into()
}

// check if a calles is an owner of the service
pub fn is_owner() -> Result<()> {
    use crate::errors::HistoryError::Unauthorized;
    use boolinator::Boolinator;

    let call_parameters: CallParameters = fluence::get_call_parameters();
    let init_peer_id = call_parameters.init_peer_id;

    (init_peer_id == call_parameters.service_creator_peer_id)
        .ok_or_else(|| Unauthorized("This operation could be processed only by owner.".to_string()))
}

// check if a caller is authenticated
pub fn is_authenticated(auth: bool, index: u64) -> Result<()> {
    use crate::errors::HistoryError::Unauthorized;
    use boolinator::Boolinator;

    match get_tetraplet()? {
        None => Err(Unauthorized("Set tetraplet before usage".to_string())),
        Some(t) => {
            let call_parameters: CallParameters = fluence::get_call_parameters();
            let index = u64_to_usize(index)?;
            let st = &call_parameters.tetraplets[index][0];

            (st.peer_pk == t.peer_pk
                && st.function_name == t.fn_name
                && st.service_id == t.service_id
                && st.json_path == t.json_path
                && auth)
                .ok_or_else(|| {
                    Unauthorized(format!(
                        "Tetraplet did not pass the check. Expected: {:?}, actual: {:?}",
                        t, st
                    ))
                })
        }
    }
}
