# Releases and Windows assets

Use Conventional Commits on `main`, for example
`feat(tasks): add recurring follow-ups`. The release process is:

1. A push to `main` (or manual Release Please run on `main`) creates or updates
   the release PR with versions and changelog.
2. After the release PR is merged, Release Please creates the `v<version>` tag
   and GitHub release.
3. Only when `release_created` is true, the same workflow invokes
   `windows-build.yml` with that exact tag.
4. Windows validates release versions and builds the selected application. The assets are
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
Please job has contents/issues/pull-request write permissions. Windows compilation
has only contents read; its separate publication job has contents write.
Actions are pinned by commit SHA and checkout does not persist credentials.

## Build manually or retry publication

Open **Actions → Windows build → Run workflow**:

- Leave `release_tag` empty to build the selected ref and keep artifacts only.
- Enter an existing tag, for example `v0.1.0`, to check out
  `refs/tags/v0.1.0`, validate its versions and attach assets to its existing
  GitHub release. The selected tag must contain this build pipeline's scripts.
- To repair an existing release without moving its tag, select workflow branch
  `main`, set `release_tag` to `v0.2.0` and `source_ref` to `main` (or a specific
  corrected commit). The source must still declare version `0.2.0` in all
  version files; mismatches fail validation. Leave `source_ref` empty for normal
  builds from the release tag. This does not create a release or move a tag.
- Pushes of tags matching `v*` also build artifacts only. Automatic release
  publication comes from the explicit reusable workflow call, avoiding duplicate
  uploads from tag events.

The build installs the exact pnpm version from `packageManager`, Node.js 22,
stable Rust on `windows-latest`. It runs the frozen dependency install and
release version validation before invoking the build below. This workflow does
not run lint, standalone type checks, unit tests or UI tests. Tauri exports the
frontend through its configured `beforeBuildCommand` during compilation:

```sh
pnpm tauri build --target x86_64-pc-windows-msvc --bundles nsis -- --locked
```

This produces both the application executable and an NSIS installer using the
committed Cargo lockfile. The build requires exactly one installer and creates:

- `worklog-v<version>-windows-x64.exe`: application executable.
- `worklog-v<version>-windows-x64-setup.exe`: NSIS installer.
- `SHA256SUMS.txt`: SHA-256 hashes of both executables.
- `BUILD-INFO.txt`: exact source commit, version, target release and workflow run.

Download the `worklog-windows-x64-v<version>` artifact from the run's
**Artifacts** section; it expires after 14 days. Publication failure leaves
that build artifact available. If packaging fails after Release Please succeeds,
the release/tag still exists without Windows assets; fix the error and rerun
the appropriate job/workflow. Do not create a second release manually.

The publish job checks that the release exists and uses `gh release upload
--clobber`: retrying intentionally replaces assets of the same name, including
the checksum file. It does not create releases or move tags. All other release
assets remain untouched. Runs for the same build ref/tag are serialized with
cancellation disabled.

Both executables are unsigned. Windows can show SmartScreen or unknown-publisher
warnings. The application executable alone does not install WebView2; the
installer is the normal distribution path and handles the configured Tauri
prerequisites. Signing certificates, ARM64 builds and MSI packaging are not
configured by this workflow. No credentials or signing material are stored in
the repository.

References:
[Release Please action and token behavior](https://github.com/googleapis/release-please-action/tree/v4.2.0),
[extra-file configuration](https://github.com/googleapis/release-please/blob/main/docs/customizing.md),
[TOML updater](https://github.com/googleapis/release-please/blob/v16.18.0/src/updaters/generic-toml.ts),
[reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
[release asset upload](https://cli.github.com/manual/gh_release_upload),
[Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/#windows).
