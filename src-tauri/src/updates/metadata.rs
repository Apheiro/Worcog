use super::Result;
use semver::Version;
use serde::{Deserialize, Serialize};

pub const REPOSITORY: &str = "Apheiro/Worklog";
pub const MAX_DOWNLOAD: u64 = 256 * 1024 * 1024;
#[derive(Deserialize)]
pub struct Release {
    pub tag_name: String,
    pub draft: bool,
    pub prerelease: bool,
    pub body: Option<String>,
    pub assets: Vec<Asset>,
}
#[derive(Clone, Deserialize)]
pub struct Asset {
    pub id: u64,
    pub name: String,
    pub state: String,
    pub size: u64,
    pub digest: Option<String>,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Available {
    pub current_version: String,
    pub version: String,
    pub notes: String,
    pub filename: String,
    pub size: u64,
}
#[derive(Clone)]
pub struct Selection {
    pub view: Available,
    pub asset_id: u64,
    pub hash: String,
}
pub fn select(release: Release, current: &str) -> Result<Option<Selection>> {
    if release.draft || release.prerelease {
        return Ok(None);
    }
    let version = Version::parse(
        release
            .tag_name
            .strip_prefix('v')
            .unwrap_or(&release.tag_name),
    )
    .map_err(|_| "GitHub release has an invalid semantic version.")?;
    let installed = Version::parse(current).map_err(|_| "Installed version is invalid.")?;
    if !version.pre.is_empty() || !version.cmp_precedence(&installed).is_gt() {
        return Ok(None);
    }
    let filename = format!("worklog-v{version}-windows-x64.exe");
    let mut matches = release.assets.into_iter().filter(|a| a.name == filename);
    let Some(asset) = matches.next() else {
        return Ok(None);
    };
    if matches.next().is_some()
        || asset.id == 0
        || asset.state != "uploaded"
        || asset.size < 2
        || asset.size > MAX_DOWNLOAD
    {
        return Ok(None);
    }
    let Some(hash) = asset
        .digest
        .as_deref()
        .and_then(|s| s.strip_prefix("sha256:"))
    else {
        return Ok(None);
    };
    if hash.len() != 64 || !hash.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Ok(None);
    }
    Ok(Some(Selection {
        view: Available {
            current_version: current.into(),
            version: version.to_string(),
            notes: release.body.unwrap_or_default(),
            filename,
            size: asset.size,
        },
        asset_id: asset.id,
        hash: hash.to_ascii_lowercase(),
    }))
}
