import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
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

export function guard(root, operation) {
  const markers = ['.notth-install.lock', '.harness-install.lock'];
  const acquired = [];
  try {
    for (const name of markers) {
      const filename = safe(root, name);
      let fd;
      try { fd = fs.openSync(filename, 'wx', 0o600); }
      catch (error) {
        if (error.code === 'EEXIST') throw new HarnessError('Another installation is active; inspect ' + name + ' before removing a stale lock');
        throw error;
      }
      acquired.push({ filename, fd }); fs.writeSync(fd, String(process.pid));
    }
    return operation();
  } finally {
    for (const { filename, fd } of acquired.reverse()) { fs.closeSync(fd); fs.unlinkSync(filename); }
  }
}

export function atomicWrite(filename, data, mode = 0o644) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const tmp = path.join(path.dirname(filename), `.notth-tmp-${randomUUID()}`);
  try {
    fs.writeFileSync(tmp, data, { flag: 'wx', mode: 0o600 });
    fs.chmodSync(tmp, stat(filename) ? fs.statSync(filename).mode & 0o777 : mode);
    fs.renameSync(tmp, filename);
  } finally { fs.rmSync(tmp, { force: true }); }
}

export function transaction(root, changes, writer = atomicWrite) {
  const originals = {}, applied = [];
  for (const name of Object.keys(changes)) {
    const filename = safe(root, name);
    originals[name] = stat(filename) ? fs.readFileSync(filename) : null;
  }
  try {
    for (const [name, data] of Object.entries(changes)) {
      const filename = safe(root, name);
      if (data === null) fs.rmSync(filename, { force: true });
      else writer(filename, data);
      applied.push(name);
    }
  } catch (error) {
    for (const name of applied.reverse()) {
      const filename = safe(root, name);
      if (originals[name] === null) fs.rmSync(filename, { force: true });
      else atomicWrite(filename, originals[name]);
    }
    throw error;
  }
}

