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

use fluence_app_service::AppService;
use fluence_app_service::TomlAppServiceConfig;

use std::collections::HashMap;
use std::path::PathBuf;

pub fn create_app_service<S: Into<PathBuf>>(config_file_path: S) -> AppService {
    let tmp_path: String = std::env::temp_dir().to_string_lossy().into();
    let service_id = uuid::Uuid::new_v4().to_string();

    let mut config = TomlAppServiceConfig::load(config_file_path).expect("a valid config");
    config.service_base_dir = Some(tmp_path);

    AppService::new(config, &service_id, HashMap::new()).expect("app service is created")
}

#[macro_export]
macro_rules! call_app_service {
    ($app_service:expr, $func_name:expr, $arg:expr) => {
        $app_service
            .call($func_name, $arg, <_>::default())
            .unwrap_or_else(|err| panic!("App service call failed: {}", err));
    };
}
