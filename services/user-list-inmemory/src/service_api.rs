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
use crate::user::User;
use crate::Result;
use fluence::{fce, CallParameters};

pub const SUCCESS_CODE: i32 = 0;

#[fce]
pub struct GetUsersServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub users: Vec<User>,
}

#[fce]
fn get_users() -> GetUsersServiceResult {
    get_all_users().into()
}

#[fce]
fn get_user(peer_id: String) -> GetUsersServiceResult {
    get_user_by_peer_id(peer_id).into()
}

#[fce]
pub struct EmptyServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
}

#[fce]
fn join(user: User) -> EmptyServiceResult {
    fn add_impl(user: User) -> Result<()> {
        is_authenticated()?;
        add_user(user)
    }

    add_impl(user).into()
}

#[fce]
fn delete(peer_id: String) -> EmptyServiceResult {
    fn delete_impl(peer_id: String) -> Result<()> {
        is_authenticated()?;

        delete_user(peer_id)
    }

    delete_impl(peer_id).into()
}

#[fce]
pub struct ExistsServiceResult {
    pub ret_code: i32,
    pub err_msg: String,
    pub is_exists: bool,
}

#[fce]
fn is_exists(user_name: String) -> ExistsServiceResult {
    user_exists(user_name).into()
}

fn is_authenticated() -> Result<()> {
    use crate::errors::UserListError::UserNotExist;
    use boolinator::Boolinator;

    let call_parameters: CallParameters = fluence::get_call_parameters();
    let init_peer_id = call_parameters.init_peer_id;

    let existed = get_user_by_peer_id(init_peer_id.clone())?.pop();

    (init_peer_id == call_parameters.service_creator_peer_id || existed.is_some()).ok_or_else(|| UserNotExist(init_peer_id.clone()))
}
