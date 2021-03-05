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

use crate::history_entry::HistoryEntry;
use crate::Result;

use crate::results::{AddServiceResult, EmptyResult, GetEntriesServiceResult};
use std::convert::From;
use std::error::Error;

#[derive(Debug)]
pub enum HistoryError {
    InternalError(String),
    InvalidArgument(String),
    Unauthorized(String),
    IOError(String),
    SerializeError(String),
    DeserializeError(String),
}

impl Error for HistoryError {}

impl std::fmt::Display for HistoryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::result::Result<(), std::fmt::Error> {
        match self {
            Self::InternalError(err_msg) => writeln!(f, "{}", err_msg),
            Self::InvalidArgument(err_msg) => writeln!(f, "{}", err_msg),
            Self::Unauthorized(err_msg) => writeln!(f, "{}", err_msg),
            Self::IOError(err_msg) => writeln!(f, "{}", err_msg),
            Self::SerializeError(err_msg) => writeln!(f, "{}", err_msg),
            Self::DeserializeError(err_msg) => writeln!(f, "{}", err_msg),
        }
    }
}

impl From<std::convert::Infallible> for HistoryError {
    fn from(_: std::convert::Infallible) -> Self {
        unreachable!()
    }
}

fn to_error_core(err: &HistoryError) -> i32 {
    match err {
        HistoryError::Unauthorized(_) => 1,
        HistoryError::InternalError(_) => 2,
        HistoryError::InvalidArgument(_) => 3,
        HistoryError::IOError(_) => 4,
        HistoryError::SerializeError(_) => 5,
        HistoryError::DeserializeError(_) => 6,
    }
}

impl From<Result<u64>> for AddServiceResult {
    fn from(result: Result<u64>) -> Self {
        match result {
            Ok(entry_id) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
                entry_id,
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
                entry_id: u64::max_value(),
            },
        }
    }
}

impl From<Result<()>> for EmptyResult {
    fn from(result: Result<()>) -> Self {
        match result {
            Ok(_) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
            },
        }
    }
}

impl From<Result<Vec<HistoryEntry>>> for GetEntriesServiceResult {
    fn from(result: Result<Vec<HistoryEntry>>) -> Self {
        match result {
            Ok(entries) => Self {
                ret_code: crate::service_api::SUCCESS_CODE,
                err_msg: String::new(),
                entries,
            },
            Err(err) => Self {
                ret_code: to_error_core(&err),
                err_msg: format!("{}", err),
                entries: vec![],
            },
        }
    }
}
