import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateReleaseVersions } from '../scripts/release-versions';
const fixture = () => ({
  packageJson: JSON.stringify({ name: 'worklog', version: '1.2.3' }),
  tauriJson: JSON.stringify({ mainBinaryName: 'worklog', version: '1.2.3' }),
  cargoToml: '[package]\nname = "worklog"\nversion = "1.2.3"\n\n[dependencies]\nother = "9.9.9"\n',
  cargoLock:
    'version = 4\n\n[[package]]\nname = "worklog-helper"\nversion = "9.9.9"\n\n[[package]]\nname = "worklog"\nversion = "1.2.3"\n\n[[package]]\nname = "other"\nversion = "2.0.0"\n',
  manifestJson: '{".":"1.2.3"}',
});
describe('release version gate', () => {
  it('accepts aligned versions for artifact-only and release builds', () => {
    expect(validateReleaseVersions(fixture())).toEqual({ version: '1.2.3', binaryName: 'worklog' });
    expect(validateReleaseVersions(fixture(), 'v1.2.3').version).toBe('1.2.3');
  });
  it('reads CRLF files and matches the exact local crate, ignoring registry namesakes', () => {
    const files = fixture();
    files.cargoLock +=
      '\n[[package]]\nname = "worklog"\nversion = "9.9.9"\nsource = "registry+https://example.invalid"\n';
    files.cargoLock = files.cargoLock.replaceAll('\n', '\r\n');
    files.cargoToml = files.cargoToml.replaceAll('\n', '\r\n');
    expect(validateReleaseVersions(files, 'v1.2.3').version).toBe('1.2.3');
  });
  it.each(['tauriJson', 'packageJson', 'cargoToml', 'cargoLock', 'manifestJson'] as const)(
    'rejects a mismatched version in %s',
    (key) => {
      const files = fixture();
      files[key] = files[key].replaceAll('1.2.3', '1.2.4');
      expect(() => validateReleaseVersions(files)).toThrow('versions disagree');
    },
  );
  it.each(['1.2.3', 'v1.2.4', 'v1.2.3\n', 'refs/tags/v1.2.3'])(
    'rejects an incorrect release tag %j',
    (tag) => {
      expect(() => validateReleaseVersions(fixture(), tag)).toThrow('does not match');
    },
  );
  it('rejects missing and duplicate local crate entries', () => {
    const files = fixture();
    files.cargoLock = 'version = 4\n';
    expect(() => validateReleaseVersions(files)).toThrow('Expected one local');
    files.cargoLock = fixture().cargoLock + '\n[[package]]\nname = "worklog"\nversion = "1.2.3"\n';
    expect(() => validateReleaseVersions(files)).toThrow('Expected one local');
  });
  it('rejects mismatched or unsafe executable names', () => {
    const files = fixture();
    files.tauriJson = JSON.stringify({ mainBinaryName: 'proxytools', version: '1.2.3' });
    expect(() => validateReleaseVersions(files)).toThrow('names disagree');
    files.tauriJson = JSON.stringify({ mainBinaryName: '../worklog', version: '1.2.3' });
    expect(() => validateReleaseVersions(files)).toThrow('Unsafe executable');
  });
  it('validates the actual checked-in application files', () => {
    const read = (path: string) => readFileSync(path, 'utf8');
    const files = {
      packageJson: read('package.json'),
      tauriJson: read('src-tauri/tauri.conf.json'),
      cargoToml: read('src-tauri/Cargo.toml'),
      cargoLock: read('src-tauri/Cargo.lock'),
      manifestJson: read('.release-please-manifest.json'),
    };
    expect(validateReleaseVersions(files).binaryName).toBe('worklog');
  });
});
