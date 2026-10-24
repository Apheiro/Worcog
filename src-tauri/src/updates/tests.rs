use super::*;
use metadata::{Asset, Release, Selection, MAX_DOWNLOAD};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    io::{self, Read, Write},
    net::TcpListener,
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
const GOOD: &[u8] = b"MZsynthetic-windows-fixture";
fn release(version: &str) -> Release {
    Release {
        tag_name: format!("v{version}"),
        draft: false,
        prerelease: false,
        body: Some("# Changes".into()),
        assets: vec![Asset {
            id: 42,
            name: format!("worcog-v{version}-windows-x64.exe"),
            state: "uploaded".into(),
            size: GOOD.len() as u64,
            digest: Some(format!("sha256:{:x}", Sha256::digest(GOOD))),
        }],
    }
}
fn selection() -> Selection {
    metadata::select(release("1.2.0"), "1.0.0")
        .unwrap()
        .unwrap()
}
fn response(status: &str, headers: &str, body: &[u8]) -> Vec<u8> {
    let mut bytes = format!(
        "HTTP/1.1 {status}\r\nConnection: close\r\nContent-Length: {}\r\n{headers}\r\n",
        body.len()
    )
    .into_bytes();
    bytes.extend(body);
    bytes
}
fn server(responses: Vec<Vec<u8>>) -> (String, thread::JoinHandle<Vec<String>>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = format!("http://{}", listener.local_addr().unwrap());
    listener.set_nonblocking(true).unwrap();
    let task = thread::spawn(move || {
        let mut requests = vec![];
        for response in responses {
            let deadline = Instant::now() + Duration::from_secs(5);
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(e) if e.kind() == io::ErrorKind::WouldBlock => {
                        assert!(Instant::now() < deadline, "fixture server timed out");
                        thread::sleep(Duration::from_millis(5));
                    }
                    Err(e) => panic!("{e}"),
                }
            };
            stream
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            let mut request = Vec::new();
            let mut buffer = vec![0; 1024];
            while !request.windows(4).any(|s| s == b"\r\n\r\n") {
                let n = stream.read(&mut buffer).unwrap();
                if n == 0 {
                    break;
                }
                request.extend_from_slice(&buffer[..n]);
                assert!(request.len() < 16384);
            }
            requests.push(String::from_utf8(request).unwrap());
            let _ = stream.write_all(&response);
        }
        requests
    });
    (address, task)
}
#[test]
fn stable_semantic_precedence_and_complete_asset_gate() {
    for (latest, current, expected) in [
        ("1.10.0", "1.9.0", true),
        ("2.0.0", "10.0.0", false),
        ("1.0.0", "1.0.0", false),
        ("1.0.0+new", "1.0.0+old", false),
        ("1.0.0", "1.0.0-beta.1", true),
        ("2.0.0-beta.1", "1.0.0", false),
    ] {
        assert_eq!(
            metadata::select(release(latest), current)
                .unwrap()
                .is_some(),
            expected
        );
    }
    let mut draft = release("2.0.0");
    draft.draft = true;
    assert!(metadata::select(draft, "1.0.0").unwrap().is_none());
    let mut pre = release("2.0.0");
    pre.prerelease = true;
    assert!(metadata::select(pre, "1.0.0").unwrap().is_none());
    for case in 0..9 {
        let mut r = release("2.0.0");
        match case {
            0 => r.assets.clear(),
            1 => r.assets[0].state = "starter".into(),
            2 => r.assets[0].size = 0,
            3 => r.assets[0].size = MAX_DOWNLOAD + 1,
            4 => r.assets[0].digest = None,
            5 => r.assets[0].digest = Some("sha256:not-a-hash".into()),
            6 => r.assets[0].name = "worcog-v2.0.0-windows-x64-setup.exe".into(),
            7 => r.assets.push(r.assets[0].clone()),
            _ => r.assets[0].id = 0,
        }
        assert!(
            metadata::select(r, "1.0.0").unwrap().is_none(),
            "case {case}"
        );
    }
    assert!(metadata::select(release("nonsense"), "1.0.0").is_err());
}
#[test]
fn streaming_download_verifies_and_reuses_without_overwrite() {
    let dir = tempfile::tempdir().unwrap();
    let s = selection();
    let path = download::save(dir.path(), &s, GOOD).unwrap();
    assert_eq!(fs::read(&path).unwrap(), GOOD);
    download::verify(&path, &s, dir.path()).unwrap();
    assert_eq!(download::save(dir.path(), &s, io::empty()).unwrap(), path);
    fs::write(&path, b"incompatible").unwrap();
    assert!(download::save(dir.path(), &s, GOOD)
        .unwrap_err()
        .contains("incompatible"));
    assert_eq!(fs::read(path).unwrap(), b"incompatible");
}
#[test]
fn corrupt_header_hash_size_and_interrupted_streams_leave_no_partials() {
    let s = selection();
    for bytes in [
        b"MZshort".to_vec(),
        vec![b'X'; GOOD.len()],
        {
            let mut b = GOOD.to_vec();
            b[3] = b'X';
            b
        },
        [GOOD, b"extra"].concat(),
    ] {
        let dir = tempfile::tempdir().unwrap();
        assert!(download::save(dir.path(), &s, bytes.as_slice()).is_err());
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 0);
    }
    struct Interrupted(bool);
    impl Read for Interrupted {
        fn read(&mut self, out: &mut [u8]) -> io::Result<usize> {
            if self.0 {
                Err(io::Error::new(
                    io::ErrorKind::ConnectionReset,
                    "synthetic interruption",
                ))
            } else {
                self.0 = true;
                out[..2].copy_from_slice(b"MZ");
                Ok(2)
            }
        }
    }
    let dir = tempfile::tempdir().unwrap();
    assert!(download::save(dir.path(), &s, Interrupted(false)).is_err());
    assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 0);
}
#[test]
fn stale_partials_cleanup_is_narrow_and_log_is_bounded() {
    let dir = tempfile::tempdir().unwrap();
    let stale = dir
        .path()
        .join(format!("worcog-{}.part", uuid::Uuid::new_v4()));
    fs::write(&stale, b"MZpartial").unwrap();
    fs::write(dir.path().join("keep.part"), b"unrelated").unwrap();
    download::cleanup(dir.path()).unwrap();
    assert!(!stale.exists());
    assert!(dir.path().join("keep.part").exists());
    fs::write(dir.path().join("updates.log"), vec![b'0'; 65537]).unwrap();
    log::record(dir.path(), "check-start", 123);
    assert!(dir.path().join("updates.previous.log").exists());
    assert!(fs::metadata(dir.path().join("updates.log")).unwrap().len() < 200);
}
#[test]
fn anonymous_authenticated_and_redirected_requests_use_correct_headers() {
    let (origin, task) = server(vec![
        response("200 OK", "", b"ok"),
        response("200 OK", "", b"ok"),
        response("302 Found", "Location: /storage\r\n", b""),
        response("200 OK", "", GOOD),
    ]);
    let client = http::Github::local(origin);
    client.get("/anonymous", None, false).unwrap();
    client
        .get("/private", Some("synthetic-token"), false)
        .unwrap();
    let mut body = Vec::new();
    client
        .get("/asset", Some("synthetic-token"), true)
        .unwrap()
        .read_to_end(&mut body)
        .unwrap();
    assert_eq!(body, GOOD);
    let requests = task.join().unwrap();
    assert!(!requests[0].to_lowercase().contains("authorization:"));
    assert!(requests[1].contains("Bearer synthetic-token"));
    assert!(requests[2].contains("Bearer synthetic-token"));
    assert!(!requests[3].to_lowercase().contains("authorization:"));
    assert!(requests[2].contains("application/octet-stream"));
    assert!(requests[0]
        .to_lowercase()
        .contains("x-github-api-version: 2022-11-28"));
    assert!(requests[0].contains("Worcog-Updates"));
}
#[test]
fn request_errors_are_useful_and_never_echo_network_secrets() {
    for (status, headers, expected) in [
        ("401 Unauthorized", "", "authentication"),
        ("403 Forbidden", "", "denied"),
        (
            "403 Forbidden",
            "X-RateLimit-Remaining: 0\r\n",
            "rate limit",
        ),
        ("429 Too Many Requests", "", "rate limit"),
        ("404 Not Found", "", "not found"),
        ("500 Internal Server Error", "", "unsuccessful"),
    ] {
        let (origin, task) = server(vec![response(status, headers, b"signed-url-or-secret")]);
        let error = http::Github::local(origin)
            .get("/asset", Some("synthetic-token"), true)
            .err()
            .unwrap();
        assert!(error.contains(expected), "{error}");
        assert!(!error.contains("synthetic-token"));
        assert!(!error.contains("signed-url"));
        task.join().unwrap();
    }
}
#[test]
fn url_policy_rejects_lookalikes_downgrades_userinfo_ports_and_redirect_loops() {
    for url in [
        "http://api.github.com/a",
        "https://api.github.com.evil.invalid/a",
        "https://user:pass@api.github.com/a",
        "https://api.github.com:8443/a",
        "https://example.com/a",
        "file:///tmp/a",
    ] {
        assert!(!http::allowed(&url::Url::parse(url).unwrap()));
    }
    for host in [
        "api.github.com",
        "github.com",
        "objects.githubusercontent.com",
        "release-assets.githubusercontent.com",
    ] {
        assert!(http::allowed(
            &url::Url::parse(&format!("https://{host}/a")).unwrap()
        ));
    }
    let (origin, task) = server(vec![response(
        "302 Found",
        "Location: https://evil.invalid/secret\r\n",
        b"",
    )]);
    assert!(http::Github::local(origin)
        .get("/asset", Some("synthetic-token"), true)
        .err()
        .unwrap()
        .contains("not permitted"));
    task.join().unwrap();
    let (origin, task) = server(
        (0..6)
            .map(|_| response("302 Found", "Location: /again\r\n", b""))
            .collect(),
    );
    assert!(http::Github::local(origin)
        .get("/asset", None, true)
        .err()
        .unwrap()
        .contains("Too many"));
    task.join().unwrap();
}
struct MemoryVault {
    profile: &'static str,
    data: Arc<Mutex<HashMap<String, String>>>,
}
impl TokenStore for MemoryVault {
    fn read(&self) -> Result<Option<String>> {
        Ok(self.data.lock().unwrap().get(self.profile).cloned())
    }
    fn write(&self, token: Option<&str>) -> Result<()> {
        let mut data = self.data.lock().unwrap();
        if let Some(t) = token {
            data.insert(self.profile.into(), t.into());
        } else {
            data.remove(self.profile);
        }
        Ok(())
    }
    fn supported(&self) -> bool {
        true
    }
}
#[test]
fn profiles_are_isolated_and_frontend_status_never_exposes_the_secret() {
    let data = Arc::new(Mutex::new(HashMap::new()));
    let prod = MemoryVault {
        profile: credentials::service_name(false),
        data: data.clone(),
    };
    let dev = MemoryVault {
        profile: credentials::service_name(true),
        data,
    };
    assert_ne!(prod.profile, dev.profile);
    prod.write(Some("synthetic-private-token")).unwrap();
    assert_eq!(dev.read().unwrap(), None);
    let dir = tempfile::tempdir().unwrap();
    let mut updates = Updates::new(dir.path().into(), "1.0.0".into());
    updates.vault = Arc::new(prod);
    let status = serde_json::to_string(&updates.status().unwrap()).unwrap();
    assert!(status.contains("\"tokenSaved\":false"));
    assert!(!status.contains("synthetic-private-token"));
    assert!(updates.set_token(Some("replacement".into())).is_err());
    assert_eq!(updates.token(None).unwrap(), None);
    assert_eq!(
        updates.token(Some("development-only")).unwrap().as_deref(),
        Some("development-only")
    );
    assert!(updates.set_token(Some("invalid token\n".into())).is_err());
    assert!(updates.set_token(None).is_err());
    assert!(!updates.status().unwrap().token_saved);
}
#[test]
fn service_checks_downloads_reports_locations_and_never_logs_credentials() {
    let dir = tempfile::tempdir().unwrap();
    let body=serde_json::json!({"tag_name":"v1.2.0","draft":false,"prerelease":false,"body":"# Complete notes","assets":[{"id":42,"name":"worcog-v1.2.0-windows-x64.exe","state":"uploaded","size":GOOD.len(),"digest":format!("sha256:{:x}",Sha256::digest(GOOD))}]}).to_string();
    let (origin, task) = server(vec![
        response("200 OK", "", body.as_bytes()),
        response("200 OK", "", GOOD),
    ]);
    let mut updates = Updates::new(dir.path().into(), "1.0.0".into());
    updates.endpoint = Some(origin);
    updates.vault = Arc::new(MemoryVault {
        profile: "fixture",
        data: Arc::new(Mutex::new(HashMap::from([(
            "fixture".into(),
            "synthetic-private-token".into(),
        )]))),
    });
    assert!(updates.folder().is_err());
    assert!(updates
        .download(Some("synthetic-private-token".into()))
        .is_err());
    assert_eq!(
        updates
            .check(Some("synthetic-private-token".into()))
            .unwrap()
            .unwrap()
            .version,
        "1.2.0"
    );
    let receipt = updates
        .download(Some("synthetic-private-token".into()))
        .unwrap();
    assert!(PathBuf::from(&receipt.current_executable).is_absolute());
    assert_eq!(fs::read(&receipt.download_path).unwrap(), GOOD);
    assert_eq!(
        updates.folder().unwrap(),
        fs::canonicalize(dir.path()).unwrap().join("updates")
    );
    assert_eq!(
        updates
            .download(Some("synthetic-private-token".into()))
            .unwrap()
            .download_path,
        receipt.download_path
    );
    let guard = updates.gate.lock().unwrap();
    assert!(updates
        .download(Some("synthetic-private-token".into()))
        .unwrap_err()
        .contains("already"));
    drop(guard);
    let log = fs::read_to_string(dir.path().join("updates/updates.log")).unwrap();
    assert!(log.contains("verified"));
    assert!(!log.contains("synthetic-private-token"));
    assert!(!log.contains("http"));
    let requests = task.join().unwrap();
    assert!(requests[0].contains("Bearer synthetic-private-token"));
}
#[cfg(unix)]
#[test]
fn directory_and_existing_file_symlinks_are_never_followed() {
    let cache = tempfile::tempdir().unwrap();
    let outside = tempfile::tempdir().unwrap();
    std::os::unix::fs::symlink(outside.path(), cache.path().join("updates")).unwrap();
    assert!(download::directory(cache.path()).is_err());
    let target = outside.path().join("original");
    fs::write(&target, GOOD).unwrap();
    let s = selection();
    let root = tempfile::tempdir().unwrap();
    std::os::unix::fs::symlink(&target, root.path().join(&s.view.filename)).unwrap();
    assert!(download::save(root.path(), &s, GOOD).is_err());
    assert_eq!(fs::read(target).unwrap(), GOOD);
}

#[test]
fn interrupted_http_body_is_removed_and_metadata_limits_are_enforced() {
    let mut partial =
        b"HTTP/1.1 200 OK\r\nConnection: close\r\nContent-Length: 100\r\n\r\n".to_vec();
    partial.extend(GOOD);
    let (origin, task) = server(vec![partial]);
    let stream = http::Github::local(origin)
        .get("/asset", None, true)
        .unwrap();
    let dir = tempfile::tempdir().unwrap();
    assert!(download::save(dir.path(), &selection(), stream).is_err());
    assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 0);
    task.join().unwrap();
    let (origin, task) = server(vec![response("200 OK", "", b"invalid JSON")]);
    assert!(http::Github::local(origin)
        .release(None)
        .err()
        .unwrap()
        .contains("invalid release"));
    task.join().unwrap();
    let (origin, task) = server(vec![
        b"HTTP/1.1 200 OK\r\nContent-Length: 2097153\r\nConnection: close\r\n\r\n".to_vec(),
    ]);
    assert!(http::Github::local(origin)
        .release(None)
        .err()
        .unwrap()
        .contains("too large"));
    task.join().unwrap();
}
#[test]
fn network_client_ignores_environment_proxies() {
    let result = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "updates::tests::anonymous_authenticated_and_redirected_requests_use_correct_headers",
        ])
        .env("HTTP_PROXY", "http://127.0.0.1:9")
        .env("HTTPS_PROXY", "http://127.0.0.1:9")
        .env("ALL_PROXY", "http://127.0.0.1:9")
        .env("http_proxy", "http://127.0.0.1:9")
        .env("https_proxy", "http://127.0.0.1:9")
        .env("all_proxy", "http://127.0.0.1:9")
        .env("NO_PROXY", "")
        .env("no_proxy", "")
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "Direct requests must work with an unusable proxy environment"
    );
}
#[test]
fn filesystem_lock_protects_other_instances_and_stale_parts_cleanup() {
    let dir = tempfile::tempdir().unwrap();
    let root = download::directory(dir.path()).unwrap();
    let file = download::exclusive(&root).unwrap();
    assert!(download::exclusive(&root).is_err());
    drop(file);
    assert!(download::exclusive(&root).is_ok());
}

#[test]
fn production_refuses_development_tokens_and_uses_only_its_vault() {
    let dir = tempfile::tempdir().unwrap();
    let mut updates = Updates::new(dir.path().into(), "1.0.0".into());
    updates.development = false;
    updates.vault = Arc::new(MemoryVault {
        profile: credentials::service_name(false),
        data: Arc::new(Mutex::new(HashMap::new())),
    });
    updates
        .set_token(Some("production-fixture".into()))
        .unwrap();
    assert_eq!(
        updates.token(None).unwrap().as_deref(),
        Some("production-fixture")
    );
    assert!(updates.status().unwrap().token_saved);
    assert!(updates.token(Some("development-fixture")).is_err());
    assert!(updates.set_token(Some("bad token".into())).is_err());
    updates.set_token(None).unwrap();
    assert!(!updates.status().unwrap().token_saved);
}
