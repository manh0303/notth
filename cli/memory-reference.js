import fs from 'node:fs';
import { safe, stat, digest, HarnessError } from './files.js';

export function memoryReference(root, name, expected) {
  safe(root, name);
  if (/(?:^|\/)(?:\.git|node_modules|\.venv|\.env(?:\.[^/]*)?|machine\.json|backups|credentials?(?:\.[^/]*)?|id_rsa|id_ed25519)(?:\/|$)/i.test(name))
    throw new HarnessError('Memory cannot reference private paths');
  const info = stat(safe(root, name));
  if (info && info.size > 64 * 1024 * 1024) throw new HarnessError('Memory source exceeds 64 MiB');
  const hash = info ? digest(fs.readFileSync(safe(root, name))) : null;
  return { path: name, sha256: expected ?? hash, current_sha256: hash,
    freshness: hash === null ? 'missing' : expected && expected !== hash ? 'stale' : 'current' };
}
