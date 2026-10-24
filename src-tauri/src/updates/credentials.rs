use super::Result;
pub trait TokenStore: Send + Sync {
    fn read(&self) -> Result<Option<String>>;
    fn write(&self, token: Option<&str>) -> Result<()>;
    fn supported(&self) -> bool;
}
#[cfg(any(windows, target_os = "macos", test))]
pub fn service_name(development: bool) -> &'static str {
    if development {
        "com.worcog.desktop.updates.development"
    } else {
        "com.worcog.desktop.updates.production"
    }
}
pub struct NativeCredentials;
pub fn store_name() -> &'static str {
    if cfg!(windows) { "Windows Credential Manager" }
    else if cfg!(target_os = "macos") { "macOS Keychain" }
    else { "Unavailable" }
}
#[cfg(any(windows, target_os = "macos"))]
fn entry() -> Result<keyring::Entry> {
    keyring::Entry::new(service_name(false), super::metadata::REPOSITORY)
        .map_err(|_| format!("Could not open {}.", store_name()))
}
impl TokenStore for NativeCredentials {
    fn supported(&self) -> bool {
        cfg!(any(windows, target_os = "macos"))
    }
    fn read(&self) -> Result<Option<String>> {
        #[cfg(any(windows, target_os = "macos"))]
        {
            match entry()?.get_password() {
                Ok(token) => Ok(Some(token)),
                Err(keyring::Error::NoEntry) => Ok(None),
                Err(_) => Err(format!("Could not read the update credential from {}.", store_name())),
            }
        }
        #[cfg(not(any(windows, target_os = "macos")))]
        {
            Ok(None)
        }
    }
    fn write(&self, _token: Option<&str>) -> Result<()> {
        #[cfg(any(windows, target_os = "macos"))]
        {
            let entry = entry()?;
            match _token {
                Some(token) => entry
                    .set_password(token)
                    .map_err(|_| "Could not save the update credential.".into()),
                None => match entry.delete_credential() {
                    Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
                    Err(_) => Err("Could not delete the update credential.".into()),
                },
            }
        }
        #[cfg(not(any(windows, target_os = "macos")))]
        {
            Err("Update credentials require Windows Credential Manager or macOS Keychain.".into())
        }
    }
}

pub fn validate_token(secret: &str) -> Result<()> {
    if secret.is_empty() || secret.len() > 4096 || !secret.bytes().all(|b| b.is_ascii_graphic()) {
        return Err("Enter a valid GitHub token without spaces.".into());
    }
    Ok(())
}
