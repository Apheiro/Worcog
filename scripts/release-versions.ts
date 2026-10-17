import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

const packageSchema = z.object({ name: z.string().min(1), version: z.string().min(1) });
const tauriSchema = z.object({ version: z.string().min(1), mainBinaryName: z.string().min(1) });

function tomlString(section: string, key: string): string {
  // Read only known, generated string fields; this is not a general TOML parser.
  const values = [
    ...section.matchAll(
      new RegExp(`^\\s*${key}\\s*=\\s*["']([^"'\\r\\n]+)["']\\s*(?:#.*)?$`, 'gm'),
    ),
  ];
  if (values.length !== 1) throw new Error(`Expected one TOML ${key} field.`);
  return values[0][1];
}

export function validateReleaseVersions(
  files: {
    packageJson: string;
    tauriJson: string;
    cargoToml: string;
    cargoLock: string;
    manifestJson: string;
  },
  releaseTag = '',
) {
  const pkg = packageSchema.parse(JSON.parse(files.packageJson));
  const tauri = tauriSchema.parse(JSON.parse(files.tauriJson));
  const manifest = z.object({ '.': z.string() }).parse(JSON.parse(files.manifestJson));
  const packageSection = files.cargoToml.match(
    /^\[package\][^\S\r\n]*\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m,
  )?.[1];
  if (!packageSection) throw new Error('Cargo.toml is missing its package section.');
  const cargoName = tomlString(packageSection, 'name');
  const cargoVersion = tomlString(packageSection, 'version');
  // Select the local root crate, never a registry dependency with a similar name.
  const lockEntries = files.cargoLock
    .split(/^\[\[package\]\][^\S\r\n]*\r?\n/m)
    .slice(1)
    .filter(
      (section) => tomlString(section, 'name') === cargoName && !/^\s*source\s*=/m.test(section),
    );
  if (lockEntries.length !== 1)
    throw new Error(`Expected one local ${cargoName} entry in Cargo.lock.`);
  const lockVersion = tomlString(lockEntries[0], 'version');
  if (!/^[A-Za-z0-9_-]+$/.test(tauri.mainBinaryName)) throw new Error('Unsafe executable name.');
  if (pkg.name !== cargoName || cargoName !== tauri.mainBinaryName)
    throw new Error('Package, Rust crate and executable names disagree.');
  if (
    /\s/.test(pkg.version) ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(pkg.version)
  )
    throw new Error('Invalid application version.');
  if (
    [tauri.version, cargoVersion, lockVersion, manifest['.']].some(
      (version) => version !== pkg.version,
    )
  ) {
    throw new Error(
      `Application versions disagree: package=${pkg.version}, tauri=${tauri.version}, cargo=${cargoVersion}, lock=${lockVersion}, manifest=${manifest['.']}`,
    );
  }
  if (releaseTag && releaseTag !== `v${pkg.version}`)
    throw new Error(`Release tag ${releaseTag} does not match v${pkg.version}.`);
  return { version: pkg.version, binaryName: tauri.mainBinaryName };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const read = (path: string) => readFileSync(path, 'utf8');
  const result = validateReleaseVersions(
    {
      packageJson: read('package.json'),
      tauriJson: read('src-tauri/tauri.conf.json'),
      cargoToml: read('src-tauri/Cargo.toml'),
      cargoLock: read('src-tauri/Cargo.lock'),
      manifestJson: read('.release-please-manifest.json'),
    },
    process.env.RELEASE_TAG ?? '',
  );
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${result.version}\nbinary_name=${result.binaryName}\n`,
    );
  console.log(`Validated ${result.binaryName} v${result.version}`);
}
