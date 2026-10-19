import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { safe, stat, readJson, encode, digest, isObject, HarnessError } from './files.js';

export const LEGACY_DIRECTORY = '.harness';
const fail = (ok, message) => { if (!ok) throw new HarnessError('Namespace migration: ' + message); };
export function legacyInstallation(root) {
  safe(root, LEGACY_DIRECTORY + '/.migration-probe');
  return Boolean(stat(path.join(root, LEGACY_DIRECTORY)));
}
function collect(root, folder) {
  const result = {}; let size = 0, count = 0;
  function visit(name) {
    const info = stat(path.join(root, name));
    fail(info && !info.isSymbolicLink(), 'symlinks or missing entries are not supported');
    if (info.isDirectory()) {
      safe(root, name + '/.migration-probe');
      for (const child of fs.readdirSync(path.join(root, name)).sort()) visit(name + '/' + child);
    } else {
      const filename = safe(root, name);
      fail(info.isFile() && ++count <= 20000 && (size += info.size) <= 512 * 1024 * 1024,
        'legacy folder exceeds migration bounds; preserve it in a project backup before a scoped migration');
      result[name] = fs.readFileSync(filename);
    }
  }
  visit(folder);
  return result;
}
function put(root, name, data) {
  const filename = safe(root, name);
  fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, data, { mode: 0o600 });
}
function removeEmpty(root, folder) {
  const filename = path.join(root, folder), info = stat(filename);
  if (!info?.isDirectory() || info.isSymbolicLink()) return;
  for (const name of fs.readdirSync(filename)) removeEmpty(root, folder + '/' + name);
  if (!fs.readdirSync(filename).length) fs.rmdirSync(filename);
}

// Preflight in an isolated workspace; target writes use the installer's existing rollback boundary.
// The callback supplies the current installer so this module cannot execute another CLI or shell.
export function migrateNamespace(root, source, options, { install, bundle, transaction, atomicWrite }) {
  safe(root, '.notth/.migration-probe');
  fail(!stat(path.join(root, '.notth')), 'both namespaces exist; reconcile .harness and .notth before updating');
  const originals = collect(root, LEGACY_DIRECTORY), lockPath = LEGACY_DIRECTORY + '/lock.json';
  fail(originals[lockPath] && originals[lockPath].length <= 4 * 1024 * 1024, 'missing or oversized legacy lock');
  const old = readJson(safe(root, lockPath));
  fail(isObject(old.files) && old.bundle_sha256 === digest(encode(old.files)), 'legacy lock digest mismatch');
  const relocate = name => name.startsWith(LEGACY_DIRECTORY + '/') ? '.notth/' + name.slice(LEGACY_DIRECTORY.length + 1) : name;
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'notth-migrate-'));
  try {
    for (const [name, data] of Object.entries(originals)) put(stage, relocate(name), data);
    const external = new Set(['AGENTS.md', 'CLAUDE.md', 'openspec/config.yaml', '.kiro/hooks/harness-session.json', '.github/copilot-instructions.md', 'GEMINI.md', '.codex/hooks.json', '.claude/settings.local.json']);
    for (const name of Object.keys(old.files)) if (!name.startsWith(LEGACY_DIRECTORY + '/')) external.add(name);
    const config = readJson(safe(stage, '.notth/project.json'));
    for (const name of Object.keys(bundle(source, config).files)) {
      if (!name.startsWith('.notth/')) external.add(name);
      if (name.startsWith('.agents/skills/')) {
        external.add(name.replace('.agents/', '.claude/')); external.add(name.replace('.agents/', '.kiro/'));
      }
    }
    for (const name of external) {
      const filename = safe(root, name), info = stat(filename);
      if (info) { fail(info.isFile() && info.size <= 4 * 1024 * 1024, 'oversized external instruction/config'); put(stage, name, fs.readFileSync(filename)); }
    }
    const files = Object.fromEntries(Object.entries(old.files).map(([name, sha]) => [relocate(name), sha]));
    put(stage, '.notth/lock.json', encode({ ...old, files, bundle_sha256: digest(encode(files)) }));
    const planned = install(stage, source, { ...options, command: 'update', dryRun: false, writer: undefined });
    const staged = collect(stage, '.notth'), changes = {};
    for (const [name, data] of Object.entries(staged)) changes[name] = data;
    for (const item of planned.changes) {
      if (item.path.startsWith('.notth/')) continue;
      changes[item.path] = item.action === 'delete' ? null : fs.readFileSync(safe(stage, item.path));
    }
    // Keep a complete original namespace and owned host bytes for a reviewed rollback.
    const backup = '.notth/backups/namespace-' + digest(originals[lockPath]);
    for (const [name, data] of Object.entries(originals)) {
      changes[backup + '/' + name] = data;
      changes[name] = null;
    }
    for (const name of Object.keys(old.files).filter(name => !name.startsWith(LEGACY_DIRECTORY + '/'))) {
      changes[backup + '/' + name] = fs.readFileSync(safe(root, name));
    }
    changes['.notth/namespace-migration.json'] = encode({ schema_version: 1, from: LEGACY_DIRECTORY, to: '.notth',
      legacy_lock_sha256: digest(originals[lockPath]), backup, reference_action: 'Reconcile old namespace pointers in project notes/checkpoints; do not refresh evidence hashes without verification.' });
    const plan = Object.entries(changes).map(([name, data]) => ({ path: name, action: data === null ? 'delete' : 'write' }));
    if (!options.dryRun) {
      try { transaction(root, changes, options.writer ?? ((filename, data) => atomicWrite(filename, data, 0o600))); }
      catch (error) {
        try { removeEmpty(root, '.notth'); } catch { /* Preserve any surviving bytes for inspection. */ }
        throw error;
      }
      try { removeEmpty(root, LEGACY_DIRECTORY); } catch { /* Empty folders may remain; no user bytes are removed here. */ }
    }
    return { status: options.dryRun ? 'planned' : 'ok', version: planned.version, changes: plan,
      warnings: planned.warnings, migration: { from: LEGACY_DIRECTORY, to: '.notth', backup,
        note: 'Original project-owned bytes preserved; old managed references/evidence require scoped reconciliation by the host.' } };
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}
