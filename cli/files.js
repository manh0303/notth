import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { claudeBlock } from './claude.js';
import { isHostBridge } from './host-bridges.js';
import { fileURLToPath } from 'node:url';

// Resolve from the installed package, never the consumer's cwd or npm's bin symlink.
export const SOURCE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const START = '<!-- ai-harness:start -->';
export const END = '<!-- ai-harness:end -->';
export const LOCK = '.notth/lock.json';
export const CONFIG = '.notth/project.json';
export const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const SLUG = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export class HarnessError extends Error {}

export function encode(value) {
  // Matches v0.1 Python json.dumps(indent=2, sort_keys=True, ensure_ascii=False).
  const sorted = item => Array.isArray(item) ? item.map(sorted) : isObject(item)
    ? Object.fromEntries(Object.keys(item).sort().map(k => [k, sorted(item[k])])) : item;
  return Buffer.from(JSON.stringify(sorted(value), null, 2) + '\n');
}
export const digest = data => createHash('sha256').update(data).digest('hex');

export function stat(filename) {
  try { return fs.lstatSync(filename); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

export function safe(root, name) {
  if (typeof name !== 'string' || !name || !/^[a-zA-Z0-9._/-]+$/.test(name)
      || path.posix.isAbsolute(name) || path.posix.normalize(name) !== name
      || name.split('/').some(p => !p || p === '.' || p === '..' || p.endsWith('.')
        || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) {
    throw new HarnessError(`Unsafe relative path: ${name}`);
  }
  let current = root;
  const parts = name.split('/');
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const info = stat(current);
    if (!info) continue;
    if (info.isSymbolicLink()) throw new HarnessError(`Symlink is not supported: ${current}`);
    if (index < parts.length - 1 ? !info.isDirectory() : !info.isFile()) {
      throw new HarnessError(`Unexpected filesystem entry: ${current}`);
    }
  }
  return current;
}

export function targetRoot(value) {
  const root = path.resolve(value);
  for (let current = root; ; current = path.dirname(current)) {
    if (stat(current)?.isSymbolicLink()) throw new HarnessError(`Target contains a symlink: ${current}`);
    if (path.dirname(current) === current) break;
  }
  if (!stat(root)?.isDirectory()) throw new HarnessError('Target must be an existing directory');
  return root;
}

export function assertSeparate(root, source) {
  const inside = (parent, child) => {
    const rel = path.relative(parent, child);
    return !rel || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
  };
  // npm local installs intentionally place the package in the consumer's node_modules.
  const localPackage = path.relative(root, source).split(path.sep)[0] === 'node_modules';
  const relativeParts = path.relative(root, source).split(path.sep);
  const pythonPackage = relativeParts[0] === '.venv' && relativeParts.includes('site-packages')
    && relativeParts.slice(-2).join('/') === 'ai_harness/_bundle'
    && stat(path.join(source, '_python_distribution.json'))?.isFile()
    && ['notth', 'manhd-ai-harness'].includes(readJson(path.join(source, '_python_distribution.json')).name);
  if (inside(source, root) || (inside(root, source) && !localPackage && !pythonPackage)) {
    throw new HarnessError('Source and target must not overlap, except a package installed in node_modules or .venv site-packages');
  }
}

export function readJson(filename) {
  if (filename.endsWith(path.sep + '.notth' + path.sep + 'lock.json') && !stat(filename)
      && stat(path.join(path.dirname(path.dirname(filename)), '.harness', 'lock.json')))
    throw new HarnessError('Legacy installation detected; run aih update --dry-run, then aih update to migrate to .notth');
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch (error) { throw new HarnessError(`Cannot read JSON document: ${filename}: ${error.message}`); }
}

export function block(data) {
  const a = data.indexOf(START), b = data.indexOf(END);
  if (a === -1 && b === -1) return null;
  if (a === -1 || b < a || data.indexOf(START, a + START.length) !== -1
      || data.indexOf(END, b + END.length) !== -1) {
    throw new HarnessError('AGENTS.md has duplicate, reversed or incomplete harness markers');
  }
  return data.subarray(a, b + END.length);
}

export function mergeAgents(existing, generated) {
  const old = block(existing);
  if (old === null) {
    const separator = !existing.length ? '' : existing.at(-1) === 10 ? '\n' : '\n\n';
    return Buffer.concat([existing, Buffer.from(separator), generated, Buffer.from('\n')]);
  }
  const offset = existing.indexOf(START);
  return Buffer.concat([existing.subarray(0, offset), generated, existing.subarray(offset + old.length)]);
}

export function payload(root, name) {
  const filename = safe(root, name);
  if (!stat(filename)) return null;
  const data = fs.readFileSync(filename);
  return name === 'AGENTS.md' || isHostBridge(name) ? block(data) : name === 'CLAUDE.md' ? claudeBlock(data) : data;
}

export function manifest(source) {
  const m = readJson(safe(source, 'harness.yaml'));
  if (!isObject(m) || m.schema_version !== 1 || !VERSION.test(m.version)) {
    throw new HarnessError('Invalid harness manifest schema/version');
  }
  if (m.project_directory !== undefined && m.project_directory !== '.notth') throw new HarnessError('Unsupported project directory in manifest');
  validateAdapters(m.adapters);
  validateCapabilities(m.capabilities ?? []);
  if (!m.adapters.length) throw new HarnessError('Empty adapter registry');
  return m;
}

export function validateAdapters(names) {
  if (!Array.isArray(names) || names.some(a => typeof a !== 'string' || !SLUG.test(a))
      || new Set(names).size !== names.length) throw new HarnessError('Invalid or duplicate adapters');
}

export function validateCapabilities(names) {
  if (!Array.isArray(names) || names.some(a => typeof a !== 'string' || !SLUG.test(a))
      || new Set(names).size !== names.length) throw new HarnessError('Invalid or duplicate capabilities');
}
