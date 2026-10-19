import { localContext } from './knowledge.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { safe, stat, encode, digest, isObject, SOURCE, VERSION, HarnessError } from './files.js';
import { projectConfig, guard, transaction, atomicWrite } from './harness.js';
import { loadEnvironment } from './environment.js';
import { loadAgentConfig } from './agents.js';
import { loadArtifactContract } from './artifacts.js';
import { loadStartConfig } from './start-config.js';
import { resolveModules } from './composition.js';
import { PROJECT_DECISIONS, loadProjectDecisions } from './project-decisions.js';

export const USER_FILES = ['.notth/project.json', '.notth/agents.json', '.notth/artifacts.json',
  '.notth/integrations.json', '.notth/environment.json', '.notth/local.md', '.notth/start.json', PROJECT_DECISIONS, 'openspec/config.yaml'];
const MAX_FILE = 1024 * 1024, MAX_ARCHIVE = 12 * MAX_FILE;
const fail = (ok, message) => { if (!ok) throw new HarnessError(message); };
export const backupName = () => '.notth/backups/config-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID() + '.json';
function readText(root, name) {
  const filename = safe(root, name), info = stat(filename);
  if (!info) return null;
  fail(info.size <= MAX_FILE, 'Configuration exceeds 1 MiB: ' + name);
  const bytes = fs.readFileSync(filename), content = bytes.toString('utf8');
  fail(Buffer.from(content).equals(bytes), 'Configuration must be UTF-8: ' + name);
  return content;
}
export function configArchive(root) {
  const files = {};
  for (const name of USER_FILES) {
    const content = readText(root, name);
    if (content !== null) files[name] = { content, sha256: digest(Buffer.from(content)) };
  }
  fail(Object.hasOwn(files, '.notth/project.json'), 'Missing .notth/project.json; initialize or restore project configuration first');
  return { schema_version: 1, kind: 'notth-user-config', cli_version: JSON.parse(fs.readFileSync(path.join(SOURCE, 'package.json'))).version,
    files };
}
function validateArchive(value) {
  fail(isObject(value) && Object.keys(value).sort().join(',') === 'cli_version,files,kind,schema_version'
    && value.schema_version === 1 && ['notth-user-config', 'ai-harness-user-config'].includes(value.kind) && VERSION.test(value.cli_version)
    && isObject(value.files) && Object.hasOwn(value.files, '.notth/project.json'), 'Unsupported configuration backup schema');
  for (const [name, file] of Object.entries(value.files)) {
    fail(USER_FILES.includes(name), 'Backup contains an unapproved configuration path');
    fail(isObject(file) && Object.keys(file).sort().join(',') === 'content,sha256' && typeof file.content === 'string'
      && Buffer.byteLength(file.content) <= MAX_FILE && /^[a-f0-9]{64}$/.test(file.sha256)
      && digest(Buffer.from(file.content)) === file.sha256, 'Backup content/digest mismatch: ' + name);
  }
}
function normalizeLegacyArchive(value) {
  if (!isObject(value) || value.kind !== 'ai-harness-user-config' || !isObject(value.files)) return;
  const mapped = {};
  for (const [name, file] of Object.entries(value.files)) {
    const target = name.startsWith('.harness/') ? '.notth/' + name.slice('.harness/'.length) : name;
    fail(!Object.hasOwn(mapped, target), 'Backup contains conflicting namespace paths');
    mapped[target] = file;
  }
  value.files = mapped;
}
function validateFiles(files) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-config-'));
  try {
    for (const [name, file] of Object.entries(files)) {
      if (name.endsWith('.json')) { try { JSON.parse(file.content); } catch { throw new HarnessError('Invalid JSON configuration: ' + name); } }
      const dest = safe(temp, name); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, file.content, { mode: 0o600 });
    }
    const config = projectConfig(temp, undefined, undefined, true);
    resolveModules(SOURCE, config);
    loadAgentConfig(temp); loadArtifactContract(temp); loadEnvironment(temp); loadStartConfig(temp); localContext(temp); loadProjectDecisions(temp);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
function outputPath(root, name) {
  fail(typeof name === 'string' && !name.startsWith('.harness/') && name.endsWith('.json') && !/^(?:\.git|\.agents|\.claude|node_modules)(?:\/|$)/.test(name) && !USER_FILES.includes(name) && !name.startsWith('.notth/core/') && !name.startsWith('openspec/changes/')
    && (!name.startsWith('.notth/') || name.startsWith('.notth/backups/')), 'Use a backup path outside active Harness configuration');
  const filename = safe(root, name); fail(!stat(filename), 'Backup destination already exists'); return filename;
}
export function backupConfig(root, output = backupName()) {
  return guard(root, () => {
    const archive = configArchive(root); validateArchive(archive); validateFiles(archive.files);
    const filename = outputPath(root, output);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, encode(archive), { flag: 'wx', mode: 0o600 });
    return { status: 'ok', backup: output, included: Object.keys(archive.files),
      excluded: ['machine.json', 'credentials and native host settings', 'managed snapshot and lock', 'custom skills', 'source/output document contents', 'OpenSpec changes, checkpoints and evidence'],
      next_steps: ['Copy the backup to a private location outside this project.', 'Keep code/docs/openspec changes and custom skills in your repository backup; configuration backup is not a full project backup.'] };
  });
}
export function restoreConfig(root, from, { dryRun = false, transfer = false, replace = false, writer } = {}) {
  const filename = safe(root, from); fail(stat(filename)?.size <= MAX_ARCHIVE, 'Missing or oversized configuration backup');
  const archive = readConfigArchive(filename); normalizeLegacyArchive(archive); validateArchive(archive); validateFiles(archive.files);
  return guard(root, () => {
    const files = transfer ? Object.fromEntries(Object.entries(archive.files).filter(([name]) => ['.notth/project.json', '.notth/agents.json'].includes(name))) : archive.files;
    if (transfer && files['.notth/agents.json']) {
      const config = JSON.parse(files['.notth/agents.json'].content);
      delete config.execution.autonomy; // Repository-scoped decisions never move to a different project.
      for (const agent of Object.values(config.agents)) delete agent.extensions;
      files['.notth/agents.json'] = { content: encode(config).toString() };
    }
    const changes = {}, conflicts = [];
    for (const [name, file] of Object.entries(files)) {
      const current = readText(root, name);
      if (current === file.content) continue;
      if (current !== null) conflicts.push(name);
      changes[name] = Buffer.from(file.content);
    }
    fail(!conflicts.length || replace || dryRun, 'Existing configuration differs: ' + conflicts.join(', ') + '; review --dry-run --replace before replacement');
    // Validate the prospective merged configuration before any target writes.
    const merged = {};
    for (const name of USER_FILES) {
      const content = changes[name]?.toString() ?? readText(root, name);
      if (content !== null) merged[name] = { content };
    }
    validateFiles(merged);
    // Validate declared artifact paths against actual target symlinks, not only temporary files.
    const artifacts = merged['.notth/artifacts.json'] ? JSON.parse(merged['.notth/artifacts.json'].content) : null;
    for (const group of ['inputs','outputs']) for (const item of Object.values(artifacts?.[group] ?? {})) {
      if (item.location.path) safe(root, item.location.path + (group === 'outputs' || stat(path.join(root, item.location.path))?.isDirectory() ? '/.artifact-probe' : ''));
    }
    let backup = null;
    if (!dryRun && conflicts.length) {
      const before = configArchive(root); backup = backupName(); outputPath(root, backup);
      changes[backup] = encode(before);
    }
    if (!dryRun) transaction(root, changes, writer ?? ((filename, data) => atomicWrite(filename, data, filename === (backup ? safe(root, backup) : null) ? 0o600 : 0o644)));
    return { status: dryRun ? 'planned' : 'ok', mode: transfer ? 'transfer' : 'restore', changes: Object.keys(changes), conflicts,
      backup, omitted: Object.keys(archive.files).filter(name => !Object.hasOwn(files, name)),
      next_steps: ['Run init on a fresh project, or update --dry-run then update on an installed project; run check.',
        transfer ? 'Run start for a new task; rebind input/output locations, commands and connections. Old autonomy declarations were removed.' : 'Run doctor and start; restore docs/checkpoints/evidence separately from your project backup before resume.',
        'Review host access, models, sources and write policies; importing declarations does not grant permission or connect accounts.'] };
  });
}
function readConfigArchive(filename) {
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch { throw new HarnessError('Invalid configuration backup JSON'); }
}
