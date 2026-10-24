# Application updates

Worcog checks GitHub Releases for **Apheiro/Worcog** when a Windows x64 or
macOS application starts. You can also use **Settings → Updates →
Check for updates**. Automatic connection/authentication failures stay silent;
manual checks report connection, authentication, access and rate-limit errors.

This downloads a new application for **manual replacement**. It never closes
Worcog, starts the downloaded executable, invokes PowerShell, deletes the
running executable or installs an update automatically. Application versions,
the Tauri identifier and storage locations remain unchanged.

## What qualifies as an update

The backend calls GitHub's latest stable release endpoint and compares its tag
with the running application's package version using semantic precedence.
Drafts, prereleases, older/equal versions and build-metadata-only changes are
ignored. A downloadable release must contain exactly one matching asset for
the running OS (the macOS bundle supports Intel and Apple Silicon):

```text
worcog-vX.Y.Z-windows-x64.exe
worcog-vX.Y.Z-macos-universal.zip
```

The asset must have a nonzero ID, `state: uploaded`, a size between 2 bytes and
256 MiB, and a valid `sha256:<64 hex digits>` digest supplied by GitHub's API.
The NSIS `-setup.exe` asset is intentionally not selected. The release notes
are displayed in full, within the 2 MiB metadata-response limit.

A release can exist while its platform build is still running. It is not announced
until that platform's asset is uploaded with size and digest metadata. Check again after
the build finishes. If an old asset has no digest, upload a new asset using the
existing publication flow. Each workflow verifies its asset between
jobs without publishing extra checksum files; the app uses GitHub's asset digest.

## Public and private repositories

Without a token, requests are anonymous and can access public releases. For a
private repository, create a **fine-grained personal access token** restricted to
`Apheiro/Worcog`, granting **Contents: Read** and any organization approval
required by the repository. This permission also reads repository source code;
there is no separate releases-only read permission in this flow. GitHub's
normal API limits apply, including anonymous rate limits.

Save, replace or remove the credential in **Application updates**. The replacement
field always starts empty and never retrieves an existing token.

- **Production Windows builds:** a dedicated Rust credential service uses Windows
  Credential Manager under `com.worcog.desktop.updates.production` for the
  `Apheiro/Worcog` account. Only Rust reads the secret. IPC status contains
  presence information, never its value. Deploy keys and Git credentials are not
  used.
- **Production macOS builds:** the same service/account pair uses macOS Keychain
  through keyring's `apple-native` backend. Save, replacement and removal stay
  in Rust, with presence-only IPC status, just like Windows. Tokens are not
  included in workspace backups or exports.
- **Development/debug builds:** the existing development profile uses only
  `worcog.updates.github-token.development.v1` in the webview's localStorage.
  This storage is unencrypted and independent of production. Rust receives the
  development credential transiently for a request; it does not persist it or
  fall back to the production vault. Production rejects development credential
  arguments. There is no transfer or migration between profiles.
- Both profiles contact the real repository through Rust; the development profile
  is not a fake release feed. Browser-only Next previews have no native transport.
  Linux production credential storage and application downloads are unsupported.

A saved token is not a guarantee of access; a subsequent manual check validates
it with GitHub. Removing a token returns subsequent requests to anonymous access.

## Notes and downloading

An available update produces a persistent, clickable Toastify notification at
the lower right. Open it to review the installed and available versions and the
release's Markdown notes. A bounded Radix ScrollArea holds long notes while the
download/close actions remain visible. Raw HTML is rendered as text, images are
not loaded, and only HTTPS links without embedded credentials can be opened
through the existing native opener. Theme tokens and keyboard focus are preserved.

**Download update** runs in a native blocking worker with duplicate-operation
protection in both the UI and backend. The backend retains the validated asset
ID, filename, size and digest. The frontend cannot supply a download URL, trusted
hash or output path.

Networking uses reqwest with normal TLS certificate validation, a Worcog
User-Agent, GitHub API version headers and explicit Accept headers. System and
environment proxies are disabled. Redirects are followed manually, at most five
times, and only HTTPS on these exact hosts is accepted:

- `api.github.com`
- `github.com`
- `objects.githubusercontent.com`
- `release-assets.githubusercontent.com`

Nonstandard ports and URL credentials are rejected. Authorization is sent only
on the initial API request, never on a redirected request. Metadata has a
20-second total request budget; downloads have 180 seconds, including redirects
and body transfer, with a 10-second connection timeout. Network errors are
translated into fixed messages so signed URLs/headers are not exposed.

Downloads stream through a heap-allocated 64 KiB buffer to an exclusively created
UUID `.part` file in `app_cache_dir()/updates`. Size, the platform signature
(`MZ` for Windows or the ZIP local-file header for macOS) and SHA-256
must match before a final file is published. A same-directory hard link publishes
without overwriting an existing file. Existing final files are fully verified
before reuse; incompatible files are left untouched and require manual relocation.
Partial files are removed on failure. Abandoned partials from a terminated process
are cleaned at the next startup check or download, under an operating-system file
lock that protects other instances. Replaced directory links and file symlinks are
rejected.

## Finish manually

After verification, the modal shows both the downloaded file's absolute path and
the running executable's location. **Open download folder** opens a backend-resolved
and validated folder; it does not accept a caller-supplied path.

1. Close Worcog normally.
2. Keep a copy of the previous EXE or `Worcog.app`.
3. On Windows, replace the EXE with the verified download. On macOS, extract
   the ZIP and replace the previous `Worcog.app` with the extracted bundle.
4. Open the new application. The macOS build has an ad-hoc signature without
   notarization and may require authorization in Privacy & Security on first launch.

The workspace stays in its existing application-data directory. The download is
in cache and can be removed by the OS; copy it to its intended location when
performing the update. Cache files are separate from workspace backups/exports.

SHA-256 verifies integrity **relative to GitHub's metadata**, not independent
publisher authenticity. It does not replace a publisher signature or protect
against a compromised repository/account. The existing Windows assets are
unsigned; this feature does not change the signing/release policy.

## Diagnostics and validation

`updates.log` records UTC timestamps, fixed stage names and byte counts. It rotates
at approximately 64 KiB to `updates.previous.log`, keeping at most two small files.
Tokens, headers, signed URLs, workspace data and raw network errors are not logged.

Tests use temporary files, local HTTP servers and synthetic credentials. They
exercise semantic versions, incomplete releases, anonymous/authenticated requests,
redirect restrictions and header stripping, proxy bypass, corrupted/interrupted
streams, size/MZ/hash checks, cleanup, existing-file reuse, locks, profile separation,
safe Markdown, scrolling, notification behavior, errors/retry and folder opening.

Credential Manager/Keychain access, native shortcuts, platform packaging and
manual replacement require their respective operating systems to verify in practice.

References:
[GitHub release assets](https://docs.github.com/en/rest/releases/assets),
[latest release API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release),
[reqwest blocking client](https://docs.rs/reqwest/0.13.5/reqwest/blocking/struct.ClientBuilder.html),
[Windows keyring adapter](https://docs.rs/keyring/3.6.3/keyring/windows/index.html),
[macOS keyring adapter](https://docs.rs/keyring/3.6.3/keyring/macos/index.html).
