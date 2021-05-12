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

use crate::results::{AuthResult, EmptyServiceResult, ExistsServiceResult, GetUsersServiceResult};
use crate::storage_api::*;
use crate::user::User;
use crate::Result;
use fluence::{marine, CallParameters};

pub const SUCCESS_CODE: i32 = 0;

// get all users
#[marine]
fn get_users() -> GetUsersServiceResult {
    get_all_users().into()
}

// get user by peer_id
#[marine]
fn get_user(peer_id: String) -> GetUsersServiceResult {
    get_user_by_peer_id(peer_id).into()
}

// add a user too the service
#[marine]
fn join(user: User) -> EmptyServiceResult {
    fn add_impl(user: User) -> Result<()> {
        // TODO uncomment to have an access to join method only for existing users
        // check_auth()?;
        add_user(user)
    }

    add_impl(user).into()
}

// delete a user from the service
#[marine]
fn leave(peer_id: String) -> EmptyServiceResult {
    fn delete_impl(peer_id: String) -> Result<()> {
        check_auth()?;

        delete_user(peer_id)
    }

    delete_impl(peer_id).into()
}

// check if a user is exists in the service
#[marine]
fn is_exists(peer_id: String) -> ExistsServiceResult {
    user_exists(peer_id).into()
}

// check if a caller is authenticated in this service
#[marine]
fn is_authenticated() -> AuthResult {
    check_auth().into()
}

// return an error if request is not authenticated
fn check_auth() -> Result<()> {
    use crate::errors::UserListError::UserNotExist;
    use boolinator::Boolinator;

    let call_parameters: CallParameters = fluence::get_call_parameters();
    let init_peer_id = call_parameters.init_peer_id.clone();

    let existed = get_user_by_peer_id(init_peer_id.clone())?.pop();

    (init_peer_id == call_parameters.service_creator_peer_id || existed.is_some()).ok_or_else(
        || {
            UserNotExist(format!(
                "init_peer_id is {:?} and it is not existed or an owner. Owner: {:?}",
                &init_peer_id, &call_parameters.service_creator_peer_id
            ))
        },
    )
}
