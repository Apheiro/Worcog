use super::Result;
pub trait TokenStore: Send + Sync {
    fn read(&self) -> Result<Option<String>>;
    fn write(&self, token: Option<&str>) -> Result<()>;
    fn supported(&self) -> bool;
}
#[cfg(any(windows, test))]
pub fn service_name(development: bool) -> &'static str {
    if development {
        "com.worklog.desktop.updates.development"
    } else {
        "com.worklog.desktop.updates.production"
    }
}
pub struct WindowsCredentials;
#[cfg(windows)]
fn entry() -> Result<keyring::Entry> {
    keyring::Entry::new(service_name(false), super::metadata::REPOSITORY)
        .map_err(|_| "Could not open Windows Credential Manager.".into())
}
impl TokenStore for WindowsCredentials {
    fn supported(&self) -> bool {
        cfg!(windows)
    }
    fn read(&self) -> Result<Option<String>> {
        #[cfg(windows)]
        {
            match entry()?.get_password() {
                Ok(token) => Ok(Some(token)),
                Err(keyring::Error::NoEntry) => Ok(None),
                Err(_) => Err(
                    "Could not read the update credential from Windows Credential Manager.".into(),
                ),
            }
        }
        #[cfg(not(windows))]
        {
            Ok(None)
        }
    }
    fn write(&self, _token: Option<&str>) -> Result<()> {
        #[cfg(windows)]
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
        #[cfg(not(windows))]
        {
            Err("Update credentials require Windows Credential Manager on Windows.".into())
        }
    }
}

pub fn validate_token(secret: &str) -> Result<()> {
    if secret.is_empty() || secret.len() > 4096 || !secret.bytes().all(|b| b.is_ascii_graphic()) {
        return Err("Enter a valid GitHub token without spaces.".into());
    }
    Ok(())
}
