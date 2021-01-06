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

use crate::message::Message;
use crate::Result;
use utils::*;

use once_cell::sync::{OnceCell};
use parking_lot::Mutex;

static INSTANCE: OnceCell<Mutex<Vec<Message>>> = OnceCell::new();

pub fn init() -> Result<()> {
    Ok(())
}

fn get_data() -> &'static Mutex<Vec<Message>> {
    INSTANCE.get_or_init(|| {
        <_>::default()
    })
}

pub fn add_message(msg: String) -> Result<u64> {
    let mut data = get_data().lock();

    let id = usize_to_u64(data.len())?;

    data.push(Message { id, body: msg });

    return Ok(id)

}

pub fn get_messages_with_limit(limit: u64) -> Result<Vec<Message>> {
    let data = get_data().lock();
    let limit = u64_to_usize(limit)?;

    let msgs: Vec<Message> = data.to_vec().iter().rev().take(limit).map(|msg| msg.clone()).collect();

    Ok(msgs)
}

pub fn get_all_messages() -> Result<Vec<Message>> {
    let data = get_data().lock();

    Ok(data.to_vec())
}
