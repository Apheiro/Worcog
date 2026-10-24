use super::{metadata::REPOSITORY, Result};
use reqwest::{
    blocking::{Client, Response},
    header::{ACCEPT, AUTHORIZATION, LOCATION},
    redirect::Policy,
    StatusCode,
};
use std::{
    io::Read,
    time::{Duration, Instant},
};
use url::Url;
pub struct Github {
    client: Client,
    origin: String,
    #[cfg(test)]
    pub test_origin: Option<String>,
}
pub fn allowed(url: &Url) -> bool {
    url.scheme() == "https"
        && url.username().is_empty()
        && url.password().is_none()
        && url.port_or_known_default() == Some(443)
        && matches!(
            url.host_str(),
            Some(
                "api.github.com"
                    | "github.com"
                    | "objects.githubusercontent.com"
                    | "release-assets.githubusercontent.com"
            )
        )
}
pub fn network_error(error: reqwest::Error) -> String {
    if error.is_timeout() {
        "GitHub request timed out. Please retry.".into()
    } else if error.is_connect() {
        "Could not connect to GitHub. Check your connection.".into()
    } else {
        "GitHub request failed or was interrupted. Please retry.".into()
    }
}
impl Github {
    pub fn new() -> Result<Self> {
        let client = Client::builder()
            .no_proxy()
            .redirect(Policy::none())
            .connect_timeout(Duration::from_secs(10))
            .timeout(Duration::from_secs(180))
            .user_agent("Worcog-Updates")
            .build()
            .map_err(network_error)?;
        Ok(Self {
            client,
            origin: "https://api.github.com".into(),
            #[cfg(test)]
            test_origin: None,
        })
    }
    #[cfg(test)]
    pub fn local(origin: String) -> Self {
        let mut this = Self::new().unwrap();
        this.origin = origin.clone();
        this.test_origin = Some(origin);
        this
    }
    fn accepts(&self, url: &Url) -> bool {
        #[cfg(test)]
        if let Some(origin) = &self.test_origin {
            if url.origin().ascii_serialization() == *origin {
                return true;
            }
        }
        allowed(url)
    }
    pub fn get(&self, path: &str, token: Option<&str>, binary: bool) -> Result<Response> {
        let mut url = Url::parse(&format!("{}{path}", self.origin))
            .map_err(|_| "Invalid GitHub endpoint.")?;
        let started = Instant::now();
        let budget = Duration::from_secs(if binary { 180 } else { 20 });
        for hop in 0..=5 {
            let remaining = budget.saturating_sub(started.elapsed());
            if remaining.is_zero() {
                return Err("GitHub request timed out. Please retry.".into());
            }
            if !self.accepts(&url) {
                return Err("GitHub redirect destination is not permitted.".into());
            }
            let mut request = self
                .client
                .get(url.clone())
                .timeout(remaining)
                .header(
                    ACCEPT,
                    if binary {
                        "application/octet-stream"
                    } else {
                        "application/vnd.github+json"
                    },
                )
                .header("X-GitHub-Api-Version", "2022-11-28");
            // Only the initial API request may carry a credential. Redirected storage requests never do.
            if hop == 0 {
                if let Some(secret) = token {
                    request = request.header(AUTHORIZATION, format!("Bearer {secret}"));
                }
            }
            let response = request.send().map_err(network_error)?;
            if response.status().is_redirection() {
                if hop == 5 {
                    return Err("Too many GitHub redirects.".into());
                }
                let location = response
                    .headers()
                    .get(LOCATION)
                    .and_then(|v| v.to_str().ok())
                    .ok_or("GitHub returned an invalid redirect.")?;
                url = url
                    .join(location)
                    .map_err(|_| "GitHub returned an invalid redirect.")?;
                continue;
            }
            return match response.status() {
                StatusCode::UNAUTHORIZED=>Err("GitHub authentication failed. Replace or remove the saved token.".into()),
                StatusCode::FORBIDDEN|StatusCode::TOO_MANY_REQUESTS=>{
                    let limited=response.status()==StatusCode::TOO_MANY_REQUESTS || response.headers().get("x-ratelimit-remaining").is_some_and(|v|v=="0") || response.headers().contains_key("retry-after");
                    Err(if limited {"GitHub API rate limit reached. Wait before trying again."} else {"GitHub denied access. Grant this repository Contents: Read and any required organization approval."}.into())
                },
                StatusCode::NOT_FOUND=>Err("Release or asset not found. The repository may be private, access may be missing, or no stable release is published.".into()),
                status if status.is_success()=>Ok(response),
                _=>Err("GitHub returned an unsuccessful response. Please retry later.".into()),
            };
        }
        Err("Too many GitHub redirects.".into())
    }
    pub fn release(&self, token: Option<&str>) -> Result<super::metadata::Release> {
        let response = self.get(
            &format!("/repos/{REPOSITORY}/releases/latest"),
            token,
            false,
        )?;
        let cap = 2 * 1024 * 1024;
        if response.content_length().is_some_and(|n| n > cap) {
            return Err("GitHub release metadata is too large.".into());
        }
        let mut bytes = Vec::new();
        response
            .take(cap + 1)
            .read_to_end(&mut bytes)
            .map_err(|_| "GitHub metadata transfer was interrupted.")?;
        if bytes.len() as u64 > cap {
            return Err("GitHub release metadata is too large.".into());
        }
        serde_json::from_slice(&bytes)
            .map_err(|_| "GitHub returned invalid release metadata.".into())
    }
}
