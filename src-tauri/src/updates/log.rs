use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
};
pub fn record(root: &Path, stage: &str, bytes: u64) {
    // Call sites supply static stage labels only. No network errors, URLs or secrets.
    let path = root.join("updates.log");
    if fs::symlink_metadata(&path).is_ok_and(|m| !m.file_type().is_file()) {
        return;
    }
    if fs::metadata(&path).is_ok_and(|m| m.len() > 64 * 1024) {
        let _ = fs::remove_file(root.join("updates.previous.log"));
        let _ = fs::rename(&path, root.join("updates.previous.log"));
    }
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(
            file,
            "{} stage={} bytes={}",
            chrono::Utc::now().to_rfc3339(),
            stage,
            bytes
        );
    }
}
