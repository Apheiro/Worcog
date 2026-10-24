# Releases and desktop assets

The package, native executable and product are named `worcog` / Worcog.
The macOS bundle is `Worcog.app`.

Use Conventional Commits on `main`, for example
`feat(tasks): add recurring follow-ups`. The release process is:

1. A push to `main` (or manual Release Please run on `main`) creates or updates
   the release PR with versions and changelog.
2. After the release PR is merged, Release Please creates the `v<version>` tag
   and GitHub release.
3. Only when `release_created` is true, the same workflow invokes
   `windows-build.yml` and `macos-build.yml` with that exact tag.
4. Each workflow validates release versions and builds its platform application. The assets are
   saved as an Actions artifact. A separate publication job verifies checksums
   and attaches the assets to the existing release.

The root package version, Tauri configuration, Rust crate and local crate entry
in `Cargo.lock` are updated together. The release manifest also tracks that
version. `pnpm release:validate` rejects inconsistencies, unexpected executable
names and mismatched tags before packaging. Set `RELEASE_TAG=v<version>` to
validate against a particular tag. The lockfile extra-file selector uses
`@.name.value` because Release Please's TOML parser wraps scalar values with
position metadata; the generic TOML updater was exercised with the actual files.

Release Please formats `CHANGELOG.md` and `src-tauri/tauri.conf.json` itself.
These two files are excluded from Prettier so generated release commits do not
fail lint solely because of formatting. Tauri configuration parsing and version
validation remain enforced; this exclusion does not disable application checks.

The reusable workflow call avoids relying on tag events created by
`GITHUB_TOKEN`, which do not start another workflow. No personal access token
is required. Enable **Settings → Actions → General → Allow GitHub Actions to
create and approve pull requests**, subject to repository policy. The Release
Please job has contents/issues/pull-request write permissions. Platform compilation
has only contents read; its separate publication job has contents write.
Actions are pinned by commit SHA and checkout does not persist credentials.

## Build manually or retry publication

Open **Actions → Windows build** or **macOS build → Run workflow**:

- Leave `release_tag` empty to build the selected ref and keep artifacts only.
- Manual builds use the selected workflow branch, even when `release_tag` is
  supplied. Select `main` to include its latest fixes. `source_ref` optionally
  overrides the source; use a branch, tag or full commit SHA.
- Enter an existing tag in `release_tag` to attach assets to that release.
  The source version must match the release tag; mismatches fail validation.
  For example, select `main` and enter `v0.3.0` to rebuild that release with
  current fixes. This does not create a release or move a tag. To deliberately
  rebuild the original tagged source, also set `source_ref` to `refs/tags/v0.3.0`.
- Pushes of tags matching `v*` also build artifacts only. Automatic release
  publication comes from the explicit reusable workflow call, avoiding duplicate
  uploads from tag events.

The build installs the exact pnpm version from `packageManager`, Node.js 22,
stable Rust on `windows-latest`. It runs the frozen dependency install and
release version validation before invoking the build below. This workflow does
not run lint, standalone type checks, unit tests or UI tests. Tauri exports the
frontend through its configured `beforeBuildCommand` during compilation:

```sh
pnpm tauri build --target x86_64-pc-windows-msvc --no-bundle -- --locked
```

This builds only the portable application executable using the committed Cargo
lockfile. Bundling is disabled in Tauri configuration as well. The workflow creates:

- `worcog-v<version>-windows-x64.exe`: portable application executable.

No checksum or build-info text files are generated. The build passes the executable
name and SHA-256 through job outputs; the publication job verifies the downloaded
artifact against those values before uploading it. Source commit and workflow
details remain available in the Actions run.

Download the `worcog-windows-x64-v<version>` artifact from the run's
**Artifacts** section; it expires after 14 days. Publication failure leaves
that build artifact available. If packaging fails after Release Please succeeds,
the release/tag still exists without Windows assets; fix the error and rerun
the appropriate job/workflow. Do not create a second release manually.

The publish job checks that the release exists and uses `gh release upload
--clobber`: retrying intentionally replaces the executable of the same name.
It does not create releases or move tags. All other release
assets remain untouched. Runs for the same build ref/tag are serialized with
cancellation disabled.

The executable is unsigned. Windows can show SmartScreen or unknown-publisher
warnings. The portable executable does not install WebView2; that runtime must already
be available on the destination machine. No installer is generated. Signing certificates, ARM64 builds and MSI packaging are not
configured by this workflow. No credentials or signing material are stored in
the repository.

References:
[Release Please action and token behavior](https://github.com/googleapis/release-please-action/tree/v4.2.0),
[extra-file configuration](https://github.com/googleapis/release-please/blob/main/docs/customizing.md),
[TOML updater](https://github.com/googleapis/release-please/blob/v16.18.0/src/updaters/generic-toml.ts),
[reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
[release asset upload](https://cli.github.com/manual/gh_release_upload),
[Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows).

## In-app update availability

The application selects the versioned standalone Windows x64 executable or
macOS universal ZIP according to its running OS, only
after GitHub reports it as uploaded with valid size and SHA-256 digest metadata.
A release created before its build completes is therefore not announced yet.
Do not rename that asset. No workflow or
versioning change is needed. See [application updates](updates.md) for complete
publication, private-access and manual replacement requirements.

## macOS portable build

`macos-build.yml` runs on `macos-latest`, installs both Rust targets
`aarch64-apple-darwin` and `x86_64-apple-darwin`, and builds a universal app:

```sh
pnpm tauri build --target universal-apple-darwin --bundles app --config '{"bundle":{"active":true}}' -- --locked
```

The config override enables bundling only for this build; Windows continues
producing its portable EXE. `ditto` packages `Worcog.app`, preserving bundle
metadata, as `worcog-v<version>-macos-universal.zip`. There is no DMG, installer,
checksum text file or build-info file. The Actions artifact is
`worcog-macos-universal-v<version>`, retained for 14 days.

The app is ad-hoc signed using `APPLE_SIGNING_IDENTITY=-`, without Developer ID
certificates or notarization. Gatekeeper can require first-launch authorization
in Privacy & Security. Both Intel and Apple Silicon use this same download.

Release Please calls the workflow alongside Windows after creating a release.
The separate publish job verifies SHA-256 and attaches only the ZIP to that
existing release. A manual run accepts the same `release_tag` and `source_ref`
semantics as Windows; leaving the tag empty only uploads the Actions artifact.
Neither platform workflow creates a new release or moves an existing tag.

## Refresh application icons without a new release

The original artwork is `public/assets/icons/ico.svg`; the simplified application
icon is `public/assets/icons/ico-small.svg`. Generate desktop and mobile variants
with `pnpm tauri icon public/assets/icons/ico-small.svg --fit contain --output src-tauri/icons`.
The transparent contain fit preserves the proportions of the artwork.
`src/app/favicon.ico` and `src/app/icon.png` mirror the generated ICO and PNG
for the webview/browser icon (use `64x64.png` for `src/app/icon.png`).

Include `[skip release]` in an icon-only commit message to skip the Release
Please job for that push. Other workflows remain enabled, and the manual
Windows workflow can still run. No version or tag needs to change. Build from
`main` with `source_ref=main`; set `release_tag=v0.3.0` to replace assets on
the existing 0.3.0 release, or leave it empty for Actions artifacts only.
Simply rerunning an old build uses its old checkout and will not include new icons.
