#[cfg(any(feature = "desktop", test))]
mod archive;
#[cfg(feature = "desktop")]
mod desktop;
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
