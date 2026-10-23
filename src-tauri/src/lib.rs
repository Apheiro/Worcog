#[cfg(any(feature = "desktop", test))]
mod archive;
#[cfg(any(feature = "desktop", test))]
mod attachment_access;
#[cfg(feature = "desktop")]
mod attachment_export;
#[cfg(feature = "desktop")]
mod desktop;
#[cfg(feature = "desktop")]
mod document_shortcuts;
#[cfg(feature = "desktop")]
mod desktop_preferences;
#[cfg(feature = "desktop")]
mod reminder_audio;
#[cfg(feature = "desktop")]
mod reminders;
#[cfg(feature = "desktop")]
mod reminder_commands;
#[cfg(any(feature = "desktop", test))]
mod document_files;
#[cfg(any(feature = "desktop", test))]
mod file_cleanup;
#[cfg(any(feature = "desktop", test))]
mod storage;
#[cfg(any(feature = "desktop", test))]
mod validation;
#[cfg(feature = "desktop")]
pub use desktop::run;
#[cfg(test)]
mod tests;

#[cfg(any(feature = "desktop", test))]
mod updates;
