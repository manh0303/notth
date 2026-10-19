import fs from 'node:fs';
import path from 'node:path';
import { HarnessError, SLUG, digest, encode, safe, stat, targetRoot, isObject } from './files.js';
import { guard, transaction } from './harness.js';

const INDEX = 'docs/sources/manifest.json';
const LIMIT = 64 * 1024 * 1024;
const INDEX_LIMIT = 4 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const TEXT = new Set(['.md', '.markdown', '.txt']);
const fail = message => { throw new HarnessError(message); };
function readBounded(filename, limit = LIMIT) {
  const info = stat(filename);
  if (!info?.isFile() || info.isSymbolicLink() || info.size > limit) fail('Source must be a regular file within the size limit');
  return fs.readFileSync(filename);
}
function utf8(data) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(data); }
  catch { fail('Expected UTF-8 text; use a host converter for other encodings'); }
  if (/\u0000/.test(text) || !text.trim()) fail('Expected nonempty text without NUL bytes');
  return text.replace(/\r\n?/g, '\n');
}
function inputFile(root, value) {
  if (typeof value !== 'string' || !value.trim()) fail('import-source requires --input');
  const filename = path.resolve(root, value);
  targetRoot(path.dirname(filename));
  if (stat(filename)?.isSymbolicLink()) fail('Source symlinks are not supported');
  return filename;
}
const originalPath = (id, hash, ext) => `docs/sources/originals/${id}/${hash}${ext}`;
const markdownPath = (id, hash, mdHash) => `docs/sources/normalized/${id}/${hash}-${mdHash}.md`;
function keys(value, expected) {
  if (!isObject(value) || Object.keys(value).sort().join() !== expected.split(' ').sort().join()) fail('Invalid sources manifest fields');
}
function timestamp(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) fail('Invalid source timestamp');
}
function verifyFile(root, name, hash) {
  if (digest(readBounded(safe(root, name))) !== hash) fail(`Source integrity conflict: ${name}`);
}
function load(root) {
  const filename = safe(root, INDEX);
  if (!stat(filename)) return { schema_version: 1, sources: [] };
  let manifest;
  try { manifest = JSON.parse(readBounded(filename, INDEX_LIMIT).toString('utf8')); }
  catch { fail('Cannot read sources manifest; restore it from your project backup'); }
  keys(manifest, 'schema_version sources');
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.sources)) fail('Invalid sources manifest schema');
  const ids = new Set();
  for (const source of manifest.sources) {
    keys(source, 'id revisions');
    if (typeof source.id !== 'string' || !SLUG.test(source.id) || source.id.length > 64 || ids.has(source.id)
        || !Array.isArray(source.revisions) || !source.revisions.length) fail('Invalid source ID/revisions');
    ids.add(source.id);
    const hashes = new Set();
    for (const revision of source.revisions) {
      keys(revision, 'sha256 original filename imported_at normalizations');
      if (typeof revision.sha256 !== 'string' || !HASH.test(revision.sha256) || hashes.has(revision.sha256) || typeof revision.filename !== 'string'
          || !revision.filename || /[/\\\x00-\x1f]/.test(revision.filename)) fail('Invalid source revision');
      hashes.add(revision.sha256);
      timestamp(revision.imported_at);
      const ext = path.extname(revision.filename).toLowerCase();
      const storedExt = /^\.[a-z0-9]{1,12}$/.test(ext) ? ext : '.bin';
      if (revision.original !== originalPath(source.id, revision.sha256, storedExt)) fail('Invalid original path');
      verifyFile(root, revision.original, revision.sha256);
      if (!Array.isArray(revision.normalizations)) fail('Invalid normalizations');
      const mdHashes = new Set();
      for (const md of revision.normalizations) {
        keys(md, 'sha256 path method created_at');
        if (typeof md.sha256 !== 'string' || !HASH.test(md.sha256) || mdHashes.has(md.sha256) || !['utf8-markdown', 'utf8-text', 'host-provided'].includes(md.method)
            || md.path !== markdownPath(source.id, revision.sha256, md.sha256)) fail('Invalid normalization');
        mdHashes.add(md.sha256);
        timestamp(md.created_at);
        verifyFile(root, md.path, md.sha256);
      }
    }
  }
  return manifest;
}

export function sourceReport(root) {
  const manifest = load(root);
  return { status: 'ok', manifest: INDEX, sources: manifest.sources.map(source => {
    const revision = source.revisions.at(-1), md = revision.normalizations.at(-1);
    return { id: source.id, revisions: source.revisions.length, sha256: revision.sha256,
      original: revision.original, normalized: md?.path ?? null,
      conversion: md ? 'available-unreviewed' : 'pending', approval: 'not-established' };
  }), backup: 'Copy all of docs/sources to approved external storage or version control; aih backup excludes documents.' };
}

export function importSource(root, id, { input, normalized, dryRun = false, writer } = {}) {
  if (typeof id !== 'string' || !SLUG.test(id) || id.length > 64) fail('Source ID must be a lowercase slug of at most 64 characters');
  return guard(root, () => {
    const manifest = load(root);
    const filename = inputFile(root, input), original = readBounded(filename);
    const basename = path.basename(filename);
    if (/[\x00-\x1f]/.test(basename)) fail('Invalid source filename');
    const ext = path.extname(filename).toLowerCase();
    const storedExt = /^\.[a-z0-9]{1,12}$/.test(ext) ? ext : '.bin';
    const hash = digest(original), now = new Date().toISOString();
    let markdown, method;
    if (normalized !== undefined) {
      const mdFile = inputFile(root, normalized);
      if (!['.md', '.markdown'].includes(path.extname(mdFile).toLowerCase())) fail('--normalized must name a Markdown file');
      markdown = Buffer.from(utf8(readBounded(mdFile)));
      method = 'host-provided';
    } else if (TEXT.has(ext)) {
      const text = utf8(original);
      // Fence plaintext so Markdown-like content is preserved as literal source data.
      const fence = '`'.repeat([...text.matchAll(/`+/g)].reduce((length, match) => Math.max(length, match[0].length + 1), 3));
      markdown = Buffer.from(ext === '.txt' ? `${fence}text\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}\n` : text);
      method = ext === '.txt' ? 'utf8-text' : 'utf8-markdown';
    }
    if (markdown && markdown.length > LIMIT) fail('Normalized Markdown exceeds 64 MiB limit');
    let source = manifest.sources.find(s => s.id === id);
    if (!source) { source = { id, revisions: [] }; manifest.sources.push(source); }
    let revision = source.revisions.find(r => r.sha256 === hash);
    const changes = {};
    const add = (name, data) => {
      const destination = safe(root, name);
      if (stat(destination)) fail(`Unmanaged source collision: ${name}`);
      changes[name] = data;
    };
    if (!revision) {
      revision = { sha256: hash, original: originalPath(id, hash, storedExt), filename: basename, imported_at: now, normalizations: [] };
      source.revisions.push(revision);
      add(revision.original, original);
    }
    if (markdown && !revision.normalizations.some(md => md.sha256 === digest(markdown))) {
      const mdHash = digest(markdown), name = markdownPath(id, hash, mdHash);
      add(name, markdown);
      revision.normalizations.push({ sha256: mdHash, path: name, method, created_at: now });
    }
    if (Object.keys(changes).length) {
      const encoded = encode(manifest);
      if (encoded.length > INDEX_LIMIT) fail('Sources manifest exceeds 4 MiB limit');
      changes[INDEX] = encoded;
      if (!dryRun) transaction(root, changes, writer);
    }
    const md = revision.normalizations.at(-1);
    return { status: 'ok', action: Object.keys(changes).length ? (dryRun ? 'planned' : 'imported') : 'unchanged',
      id, manifest: INDEX, sha256: hash, original: revision.original, normalized: md?.path ?? null,
      conversion: md ? 'available-unreviewed' : 'pending', approval: 'not-established',
      current: source.revisions.at(-1).sha256 === hash,
      next_action: md ? 'Review conversion against the original before deriving requirements.'
        : 'Host: convert the saved original to Markdown, then repeat import-source with --input saved-original --normalized converted.md.' };
  });
}
