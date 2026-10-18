#!/usr/bin/env node
import fs from 'node:fs';
import { hasReleaseHeading } from './release-heading.js';
import path from 'node:path';
import { SOURCE, VERSION, manifest, readJson } from '../cli/files.js';
import { listCapabilities } from '../cli/capabilities.js';
import { listAdapters } from '../cli/adapters.js';
const pkg = readJson(path.join(SOURCE, 'package.json'));
const lock = readJson(path.join(SOURCE, 'package-lock.json'));
const m = manifest(SOURCE);
const versions = [pkg.version, lock.version, lock.packages?.['']?.version, m.version];
if (!versions.every(v => v === versions[0])) throw new Error('Distribution version mismatch: package.json, package-lock.json and harness.yaml');
if (m.distribution?.pypi !== 'notth' || m.distribution?.npm !== pkg.name) throw new Error('Distribution names mismatch');
const pyproject = fs.readFileSync(path.join(SOURCE, 'pyproject.toml'), 'utf8');
if (!pyproject.includes('dynamic = ["version"]') || !pyproject.includes('name = "notth"')) throw new Error('Python version must be derived from package.json and distribution must be notth');
if (/^version\s*=/m.test(pyproject)) throw new Error('Do not duplicate the distribution version in pyproject.toml');
if (!VERSION.test(versions[0])) throw new Error('Invalid release semver');
if (pkg.name !== '@manhd_d/notth' || lock.name !== pkg.name || lock.packages?.['']?.name !== pkg.name) throw new Error('npm package name or scope mismatch');
if (pkg.publishConfig?.access !== 'public') throw new Error('npm distribution must be public');
const releaseManifest = readJson(path.join(SOURCE, '.release-please-manifest.json'));
if (releaseManifest['.'] !== versions[0]) throw new Error('Release Please manifest version mismatch');
const changelog = fs.readFileSync(path.join(SOURCE, 'CHANGELOG.md'), 'utf8');
if (!hasReleaseHeading(changelog, versions[0])) throw new Error('Distribution version missing from CHANGELOG');
const modules = [...listAdapters(SOURCE).adapters, ...listCapabilities(SOURCE)];
for (const mod of modules) if (mod.module_version != null && !VERSION.test(mod.module_version)) {
  throw new Error(`Invalid module version: ${mod.id}`);
}
console.log(JSON.stringify({status:'ok',distribution_version:versions[0],modules:modules.length,
  note:'Local metadata only; no tag, publish or remote checks performed'},null,2));
