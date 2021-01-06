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
use crate::service_api::AddServiceResult;
use crate::service_api::CountServiceResult;
use crate::service_api::GetMessagesServiceResult;
use crate::Result;

use fce_sqlite_connector::Error as SqliteConnectorError;
use fce_sqlite_connector::Value;

use std::convert::From;
use std::error::Error;

#[derive(Debug)]
pub enum HistoryError {
    SqliteConnectorError(SqliteConnectorError),
    CorruptedMessage(Vec<Value>),
    InternalError(String),
    InvalidArgument(String),
    UnexpectedValueType(Value, &'static str),
}

impl Error for HistoryError {}

impl std::fmt::Display for HistoryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::result::Result<(), std::fmt::Error> {
        match self {
            Self::SqliteConnectorError(err) => writeln!(f, "{:?}", err),
            Self::CorruptedMessage(values) => writeln!(
                f,
                "message can't be constructed from returned values: {:?}",
                values
            ),
            Self::InternalError(err_msg) => writeln!(f, "{}", err_msg),
            Self::InvalidArgument(err_msg) => writeln!(f, "{}", err_msg),
            Self::UnexpectedValueType(value, expected_type) => writeln!(
                f,
                "expected type {}, but value {:?} received",
                expected_type, value
            ),
        }
    }
}

impl From<SqliteConnectorError> for HistoryError {
    fn from(err: SqliteConnectorError) -> Self {
        HistoryError::SqliteConnectorError(err)
    }
}

impl From<std::convert::Infallible> for HistoryError {
    fn from(_: std::convert::Infallible) -> Self {
        unreachable!()
    }
}

fn to_error_core(err: &HistoryError) -> i32 {
    match err {
        HistoryError::SqliteConnectorError(_) => 0,
        HistoryError::CorruptedMessage(_) => 1,
        HistoryError::InternalError(_) => 2,
        HistoryError::InvalidArgument(_) => 3,
        HistoryError::UnexpectedValueType(..) => 4,
    }
}

impl From<Result<i64>> for AddServiceResult {
    fn from(result: Result<i64>) -> Self {
        match result {
            Ok(msg_id) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
                msg_id: msg_id as u64,
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
                msg_id: u64::max_value(),
            },
        }
    }
}

impl From<Result<Vec<Message>>> for GetMessagesServiceResult {
    fn from(result: Result<Vec<Message>>) -> Self {
        match result {
            Ok(messages) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
                messages,
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
                messages: vec![],
            },
        }
    }
}

impl From<Result<i64>> for CountServiceResult {
    fn from(result: Result<i64>) -> Self {
        match result {
            Ok(messages_count) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
                messages_count: messages_count as u64,
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
                messages_count: 0,
            },
        }
    }
}
