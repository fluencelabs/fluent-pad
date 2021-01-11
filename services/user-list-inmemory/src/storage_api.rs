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

use crate::user::User;
use crate::Result;

use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use std::collections::HashMap;

static INSTANCE: OnceCell<Mutex<HashMap<String, User>>> = OnceCell::new();

fn get_data() -> &'static Mutex<HashMap<String, User>> {
    INSTANCE.get_or_init(|| <_>::default())
}

pub fn user_exists(peer_id: String) -> Result<bool> {
    let data = get_data().lock();

    Ok(data.get(&peer_id).is_some())
}

pub fn get_all_users() -> Result<Vec<User>> {
    let data = get_data().lock();

    Ok(data.values().map(|user| user.clone()).collect())
}

pub fn get_user_by_peer_id(peer_id: String) -> Result<Vec<User>> {
    let data = get_data().lock();

    match data.get(&peer_id) {
        None => Ok(vec![]),
        Some(user) => Ok(vec![user.clone()]),
    }
}

pub fn add_user(user: User) -> Result<()> {
    let mut data = get_data().lock();

    data.insert(user.peer_id.clone(), user);

    Ok(())
}

pub fn delete_user(peer_id: String) -> Result<()> {
    let mut data = get_data().lock();

    data.remove(&peer_id);

    Ok(())
}
