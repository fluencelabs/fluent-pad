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

use crate::Result;

use fce_sqlite_connector::Value;

pub(super) fn value_to_string(value: &Value) -> Result<String> {
    use crate::errors::HistoryError::UnexpectedValueType;

    value
        .as_string()
        .ok_or_else(|| UnexpectedValueType(value.clone(), "string"))
        .map(Into::into)
}

pub(super) fn value_to_integer(value: &Value) -> Result<i64> {
    use crate::errors::HistoryError::UnexpectedValueType;

    value
        .as_integer()
        .ok_or_else(|| UnexpectedValueType(value.clone(), "integer"))
        .map(Into::into)
}

pub(super) fn u64_to_i64(value: u64) -> Result<i64> {
    use crate::errors::HistoryError::InvalidArgument;
    use std::convert::TryFrom;

    i64::try_from(value)
        .map_err(|_| InvalidArgument(format!("limit should be less than {}", i64::max_value())))
}
