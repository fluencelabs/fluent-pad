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

use fce_sqlite_connector::Connection;
use fce_sqlite_connector::Value;
use fce_sqlite_connector::Value::Integer as VInteger;
use fce_sqlite_connector::Value::String as VString;

use once_cell::sync::Lazy;

static SQLITE: Lazy<Connection> = Lazy::new(|| Connection::open(":memory:").unwrap());

pub fn init() -> Result<()> {
    let init_sql = "CREATE TABLE IF NOT EXISTS history(\
        msg_id INTEGER PRIMARY KEY,\
        msg TEXT NOT NULL,\
        author TEXT NOT NULL,\
        reply_to INTEGER\
    );";

    SQLITE.execute(init_sql).map_err(Into::into)
}

pub fn add_message(msg: String, author: String, reply_to: i64) -> Result<i64> {
    use crate::errors::HistoryError::InternalError;

    let add_msg_sql = "INSERT INTO history (msg, author, reply_to) VALUES (?, ?, ?)";
    let mut cursor = SQLITE.prepare(add_msg_sql)?.cursor();
    cursor.bind(&[VString(msg), VString(author), VInteger(reply_to)])?;
    cursor.next()?;

    let last_rowid_sql = "SELECT last_insert_rowid()";
    let mut cursor = SQLITE.prepare(last_rowid_sql)?.cursor();
    let raw_id = cursor
        .next()?
        .ok_or_else(|| InternalError(String::from("last_insert_rowid didn't return any value")))?
        .first()
        .unwrap();

    value_to_integer(raw_id)
}

pub fn get_messages_with_limit(limit: u64) -> Result<Vec<Message>> {
    let get_messages_with_limit_sql = "SELECT * FROM history ORDER BY msg_id DESC LIMIT ?";
    let limit = u64_to_i64(limit)?;

    get_messages(get_messages_with_limit_sql, &[VInteger(limit)])
}

pub fn get_messages_by_reply_to(reply_to: u64) -> Result<Vec<Message>> {
    let get_messages_by_reply_to_sql = "SELECT * FROM history WHERE reply_to = ?";
    let reply_to = u64_to_i64(reply_to)?;

    get_messages(get_messages_by_reply_to_sql, &[VInteger(reply_to)])
}

pub fn get_all_messages() -> Result<Vec<Message>> {
    let get_all_messages_sql = "SELECT * FROM history";

    get_messages(get_all_messages_sql, &[])
}

pub fn count_messages_by_reply_to(reply_to: u64) -> Result<i64> {
    use crate::errors::HistoryError::InternalError;

    let get_messages_count_by_reply_to_sql = "SELECT COUNT(*) FROM history WHERE reply_to = ?";
    let mut cursor = SQLITE.prepare(get_messages_count_by_reply_to_sql)?.cursor();

    let reply_to = u64_to_i64(reply_to)?;
    cursor.bind(&[VInteger(reply_to)])?;

    let messages_count = cursor
        .next()?
        .ok_or_else(|| InternalError(String::from("count didn't return any value")))?
        .first()
        .unwrap();

    value_to_integer(messages_count)
}

fn get_messages(sql: &str, bind_values: &[Value]) -> Result<Vec<Message>> {
    use crate::errors::HistoryError::CorruptedMessage;
    use crate::message::MESSAGE_FIELDS_COUNT;

    let mut get_msgs_cursor = SQLITE.prepare(sql)?.cursor();
    get_msgs_cursor.bind(bind_values)?;

    let mut messages = Vec::new();
    while let Some(raw_message) = get_msgs_cursor.next()? {
        if raw_message.len() != MESSAGE_FIELDS_COUNT {
            return Err(CorruptedMessage(raw_message.into()));
        }

        let message = Message {
            id: value_to_integer(&raw_message[0])?,
            author: value_to_string(&raw_message[2])?,
            body: value_to_string(&raw_message[1])?,
            reply_to: value_to_integer(&raw_message[3])?,
        };

        messages.push(message);
    }

    Ok(messages)
}
