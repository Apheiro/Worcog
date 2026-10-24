mod credentials;
mod download;
mod http;
mod log;
pub mod metadata;
#[cfg(test)]
mod tests;
pub type Result<T> = std::result::Result<T, String>;
use credentials::{TokenStore, NativeCredentials};
use metadata::{Available, Selection, Platform, REPOSITORY};
use serde::Serialize;
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    current_version: String,
    repository: &'static str,
    token_saved: bool,
    credential_supported: bool,
    platform_supported: bool,
    platform: &'static str,
    credential_store: &'static str,
    profile: &'static str,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Receipt {
    download_path: String,
    current_executable: String,
}
pub struct Updates {
    development: bool,
    #[cfg(test)]
    endpoint: Option<String>,
    cache: PathBuf,
    version: String,
    platform: Option<Platform>,
    vault: Arc<dyn TokenStore>,
    gate: Mutex<()>,
    selected: Mutex<Option<Selection>>,
    receipt: Mutex<Option<Receipt>>,
}
impl Updates {
    pub fn new(cache: PathBuf, version: String) -> Self {
        Self {
            development: cfg!(debug_assertions),
            #[cfg(test)]
            endpoint: None,
            cache,
            version,
            platform: Platform::current(),
            vault: Arc::new(NativeCredentials),
            gate: Mutex::new(()),
            selected: Mutex::new(None),
            receipt: Mutex::new(None),
        }
    }
    fn github(&self) -> Result<http::Github> {
        #[cfg(test)]
        if let Some(origin) = &self.endpoint {
            return Ok(http::Github::local(origin.clone()));
        }
        http::Github::new()
    }
    pub fn status(&self) -> Result<Status> {
        Ok(Status {
            current_version: self.version.clone(),
            repository: REPOSITORY,
            token_saved: if self.development {
                false
            } else {
                self.vault.read()?.is_some()
            },
            credential_supported: self.development || self.vault.supported(),
            platform_supported: self.platform.is_some(),
            platform: match self.platform {
                Some(Platform::WindowsX64) => "windows",
                Some(Platform::MacUniversal) => "macos",
                None => "unsupported",
            },
            credential_store: credentials::store_name(),
            profile: if self.development {
                "development"
            } else {
                "production"
            },
        })
    }
    fn token(&self, development_token: Option<&str>) -> Result<Option<String>> {
        if self.development {
            if let Some(token) = development_token {
                credentials::validate_token(token)?;
            }
            return Ok(development_token.map(str::to_owned));
        }
        if development_token.is_some() {
            return Err("Development credentials cannot be used in production.".into());
        }
        self.vault.read()
    }
    pub fn set_token(&self, token: Option<String>) -> Result<Status> {
        let _gate = self
            .gate
            .try_lock()
            .map_err(|_| "An update operation is already in progress.")?;
        if self.development {
            return Err("Development credentials belong to the separate browser profile.".into());
        }
        if let Some(secret) = token.as_deref() {
            credentials::validate_token(secret)?;
        }
        self.vault.write(token.as_deref())?;
        *self
            .selected
            .lock()
            .map_err(|_| "Update state unavailable.")? = None;
        self.status()
    }
    pub fn check(&self, development_token: Option<String>) -> Result<Option<Available>> {
        let _gate = self
            .gate
            .try_lock()
            .map_err(|_| "An update operation is already in progress.")?;
        let root = download::directory(&self.cache)?;
        log::record(&root, "check-start", 0);
        // A crashed download is cleaned on startup check; never touch another
        // instance's active partial file.
        if let Ok(_file_lock) = download::exclusive(&root) {
            download::cleanup(&root)?;
        }

        *self
            .selected
            .lock()
            .map_err(|_| "Update state unavailable.")? = None;
        let result = (|| {
            let github = self.github()?;
            let token = self.token(development_token.as_deref())?;
            let platform = self.platform.ok_or("Application updates are available on Windows x64 and macOS.")?;
            let selection = metadata::select(github.release(token.as_deref())?, &self.version, platform)?;
            let view = selection.as_ref().map(|s| s.view.clone());
            *self
                .selected
                .lock()
                .map_err(|_| "Update state unavailable.")? = selection;
            Ok(view)
        })();
        log::record(
            &root,
            if result.is_ok() {
                "check-complete"
            } else {
                "check-failed"
            },
            0,
        );
        result
    }
    pub fn download(&self, development_token: Option<String>) -> Result<Receipt> {
        let _gate = self
            .gate
            .try_lock()
            .map_err(|_| "An update operation is already in progress.")?;
        let selection = self
            .selected
            .lock()
            .map_err(|_| "Update state unavailable.")?
            .clone()
            .ok_or("Check for updates before downloading.")?;
        let root = download::directory(&self.cache)?;
        let _file_lock = download::exclusive(&root)?;
        download::cleanup(&root)?;
        log::record(&root, "download-start", 0);
        let result = (|| {
            let target = root.join(&selection.view.filename);
            let path = if target.exists() || std::fs::symlink_metadata(&target).is_ok() {
                download::verify(&target, &selection, &root)?;
                target
            } else {
                let github = self.github()?;
                let token = self.token(development_token.as_deref())?;
                let response = github.get(
                    &format!("/repos/{REPOSITORY}/releases/assets/{}", selection.asset_id),
                    token.as_deref(),
                    true,
                )?;
                if response
                    .content_length()
                    .is_some_and(|size| size != selection.view.size)
                {
                    return Err("Download length does not match the selected asset.".into());
                }
                download::save(&root, &selection, response)?
            };
            let current =
                std::env::current_exe().map_err(|_| "Could not resolve the running executable.")?;
            #[cfg(target_os = "macos")]
            let current = current.ancestors()
                .find(|path| path.extension().is_some_and(|extension| extension == "app"))
                .unwrap_or(&current).to_path_buf();
            let receipt = Receipt {
                download_path: path.to_string_lossy().into(),
                current_executable: current.to_string_lossy().into(),
            };
            *self
                .receipt
                .lock()
                .map_err(|_| "Update state unavailable.")? = Some(receipt.clone());
            Ok(receipt)
        })();
        log::record(
            &root,
            if result.is_ok() {
                "download-complete"
            } else {
                "download-failed"
            },
            0,
        );
        result
    }
    pub fn folder(&self) -> Result<PathBuf> {
        let receipt = self
            .receipt
            .lock()
            .map_err(|_| "Update state unavailable.")?
            .clone()
            .ok_or("Download and verify an update first.")?;
        let root = download::directory(&self.cache)?;
        let path = std::fs::canonicalize(&receipt.download_path)
            .map_err(|_| "The verified update no longer exists.")?;
        if path.parent() != Some(root.as_path()) {
            return Err("Download location is no longer valid.".into());
        }
        Ok(root)
    }
}
