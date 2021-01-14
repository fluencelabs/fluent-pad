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

use crate::entry::Entry;
use crate::Result;

use crate::utils::{u64_to_usize, usize_to_u64};
use once_cell::sync::OnceCell;
use parking_lot::Mutex;

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Tetraplet {
    pub peer_pk: String,
    pub service_id: String,
    pub fn_name: String,
    pub json_path: String,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Data {
    entries: Vec<Entry>,
    tetraplet: Option<Tetraplet>,
}

static INSTANCE: OnceCell<Mutex<Data>> = OnceCell::new();

fn get_data() -> &'static Mutex<Data> {
    INSTANCE.get_or_init(|| <_>::default())
}

pub fn add_entry(entry: String) -> Result<u64> {
    let mut data = get_data().lock();

    let id = usize_to_u64(data.entries.len())?;

    data.entries.push(Entry { id, body: entry });

    return Ok(id);
}

pub fn get_entries_with_limit(limit: u64) -> Result<Vec<Entry>> {
    let data = get_data().lock();
    let limit = u64_to_usize(limit)?;

    let entries: Vec<Entry> = data
        .entries
        .to_vec()
        .iter()
        .rev()
        .take(limit)
        .map(|entry| entry.clone())
        .collect();

    Ok(entries)
}

pub fn get_all_entries() -> Result<Vec<Entry>> {
    let data = get_data().lock();

    Ok(data.entries.to_vec())
}

pub fn store_tetraplet(peer_id: String, service_id: String, fn_name: String, path: String) {
    let mut data = get_data().lock();

    let tetraplet = Tetraplet {
        peer_pk: peer_id,
        service_id,
        fn_name,
        json_path: path,
    };

    data.tetraplet = Some(tetraplet)
}

pub fn get_tetraplet() -> Option<Tetraplet> {
    let data = get_data().lock();
    data.tetraplet.clone()
}
