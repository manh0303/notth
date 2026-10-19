import fs from 'node:fs';
import { mavenModules } from './maven.js';
import path from 'node:path';
import { safe, readJson, manifest, HarnessError, check, loadLock, encode, digest } from './harness.js';
import { scoreDataset } from '../scripts/score-eval.js';

import { loadAdapter, requireThat, object } from './adapter-schema.js';
import { loadCapability } from './capabilities.js';
import { casesFrom, checksFrom } from './evaluation-contract.js';
export { loadAdapter } from './adapter-schema.js';

export function listAdapters(source) {
  return { status: 'ok', adapters: manifest(source).adapters.map(id => {
    const a = loadAdapter(source, id);
    return { id, description: a.description, module_version: a.module_version ?? null, skills: a.skills, detection: a.detection };
  }) };
}

function exists(root, file) { return fs.existsSync(safe(root, file)); }
function probe(root, file) {
  const filename = safe(root, file);
  if (!fs.existsSync(filename)) return null;
  requireThat(fs.statSync(filename).size <= 1024 * 1024, `Detection file exceeds 1 MiB: ${file}`);
  return fs.readFileSync(filename, 'utf8');
}
export function detect(root, source) {
  const matches = [], maven = mavenModules(root);
  for (const id of manifest(source).adapters) {
    const a = loadAdapter(source, id), evidence = [];
    for (const rule of a.detection) {
      const probes = rule.file === 'pom.xml' ? maven.files : [{ file: rule.file, body: probe(root, rule.file) }];
      for (const entry of probes) {
      const body = entry.body;
      if (body === null) continue;
      let found;
      if (rule.kind === 'dependencies') {
        let pkg; try { pkg = JSON.parse(body); } catch { throw new HarnessError(`Invalid JSON during detection: ${rule.file}`); }
        requireThat(object(pkg), `Invalid package metadata: ${rule.file}`);
        const deps = new Set();
        for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
          if (pkg[field] === undefined) continue;
          requireThat(object(pkg[field]), `Invalid ${field}: ${rule.file}`);
          for (const key of Object.keys(pkg[field])) deps.add(key);
        }
        found = rule.values.filter(v => deps.has(v));
      } else found = rule.values.filter(v => body.includes(v));
      if (found.length) evidence.push({ file: entry.file, kind: rule.kind, matched: found });
      }
    }
    if (evidence.length) matches.push({ id, evidence });
  }
  // Astro can use @astrojs/react islands (react-dom dependency) without being a
  // React/Next.js application. Suppress that heuristic-only overlap unless Next
  // itself is present. Explicit adapter selection remains unrestricted.
  const astroDetected = matches.some(match => match.id === 'astro');
  const filtered = matches.filter(match => !(astroDetected && match.id === 'react-nextjs'
    && !match.evidence.some(row => row.matched.includes('next'))));
  return { status: 'ok', adapters: filtered.map(m => m.id).sort(), matches: filtered, warnings: maven.warnings,
    note: 'Heuristic metadata only; bounded declared Maven modules (depth 2, 64 POMs, 4 MiB total). No application execution; other monorepos require scoped host discovery.' };
}

function installedAdapters(root) {
  const result = check(root);
  requireThat(result.status === 'ok', 'Fix installation drift before reading capabilities');
  const lock = loadLock(root), source = path.join(root, '.notth');
  // Require capability files to be covered by the installed lock, not merely present nearby.
  const adapters = lock.adapters.map(id => {
    requireThat(Object.hasOwn(lock.files, `.notth/adapters/${id}/adapter.yaml`), `Adapter ${id} needs aih update to enable capabilities`);
    const a = loadAdapter(source, id);
    for (const file of [a.verification, a.evaluation, ...a.rules, ...a.skills.map(s => `skills/${s}/SKILL.md`)]) {
      requireThat(Object.hasOwn(lock.files, `.notth/adapters/${id}/${file}`), `Capability is not locked: ${id}/${file}`);
    }
    return a;
  });
  return { adapters, lock };
}

const SCOPES = new Set(['adapters', 'capabilities', 'core', 'all']);
function installedEvaluations(root, scope) {
  requireThat(SCOPES.has(scope), `Invalid evaluation scope: ${scope}`);
  const { adapters, lock } = installedAdapters(root);
  const source = path.join(root, '.notth');
  const include = part => part === scope || scope === 'all';
  const capabilities = [];
  if (include('capabilities')) {
    for (const id of lock.capabilities ?? []) {
      const name = `.notth/capabilities/${id}/capability.json`;
      requireThat(Object.hasOwn(lock.files, name), `Capability is not locked: ${id}`);
      const c = loadCapability(source, id);
      for (const file of [c.verification, c.evaluation].filter(Boolean)) {
        requireThat(Object.hasOwn(lock.files, `.notth/capabilities/${id}/${file}`),
          `Capability is not locked: ${id}/${file}`);
      }
      capabilities.push(c);
    }
  }
  let core = { checks: [], cases: [] }, composition = [];
  if (include('core')) {
    for (const relative of ['core/checks/verification.json', 'core/evals/cases.json', 'core/evals/composition.json']) {
      requireThat(Object.hasOwn(lock.files, `.notth/${relative}`), 'Core evaluation assets missing; run aih update');
    }
    core = { checks: checksFrom(source, 'core/checks/verification.json'), cases: casesFrom(source, 'core/evals/cases.json') };
    const manifest = readJson(safe(source, 'core/evals/composition.json'));
    requireThat(manifest?.schema_version === 1 && Array.isArray(manifest.cases), 'Invalid composition dataset');
    const selected = new Set([...lock.adapters.map(x => `adapter:${x}`), ...(lock.capabilities ?? []).map(x => `capability:${x}`)]);
    const ids = new Set();
    for (const row of manifest.cases) {
      requireThat(typeof row.id === 'string' && /^[a-z][a-z0-9-]*$/.test(row.id) && !ids.has(row.id)
        && Array.isArray(row.requires) && row.requires.length > 0 && new Set(row.requires).size === row.requires.length
        && row.requires.every(ref => typeof ref === 'string' && /^(adapter|capability):[a-z][a-z0-9-]*$/.test(ref))
        && typeof row.prompt === 'string' && row.prompt.trim()
        && Array.isArray(row.criteria) && row.criteria.length > 0 && row.criteria.every(x => typeof x === 'string' && x.trim())
        && typeof row.critical === 'boolean', `Invalid composition scenario: ${row.id}`);
      ids.add(row.id);
      if (row.requires.every(x => selected.has(x))) {
        const { requires, ...scenario } = row;
        composition.push(scenario);
      }
    }
  }
  return { adapters: include('adapters') ? adapters : [], capabilities, core, composition, lock };
}
export function verify(root, scope = 'adapters') {
  const { adapters, capabilities, core, lock } = installedEvaluations(root, scope);
  const checks = [
    ...adapters.flatMap(a => a.checks.map(c => ({ adapter: a.id, ...c }))),
    ...capabilities.flatMap(c => c.checks.map(check => ({ capability: c.id, ...check }))),
    ...core.checks.map(c => ({ core: true, ...c })),
  ];
  return { status: 'planned', version: lock.version, scope, executed: false,
    checks: checks.map(c => ({ ...c,
      applicability: c.when_file === null ? 'review-required' : exists(root, c.when_file) ? 'candidate' : 'not-detected' })),
    note: 'Advisory plan only; commands are NOT executed and manual gates require human evidence.' };
}

export function evaluate(root, reportPath, scope = 'adapters') {
  const { adapters, capabilities, core, composition, lock } = installedEvaluations(root, scope);
  const dataset = { schema_version: 1, cases: [
    ...adapters.flatMap(a => a.cases.map(c => ({ ...c, id: `${a.id}/${c.id}` }))),
    ...capabilities.flatMap(c => c.cases.map(row => ({ ...row, id: `capability/${c.id}/${row.id}` }))),
    ...core.cases.map(c => ({ ...c, id: `core/${c.id}` })),
    ...composition.map(c => ({ ...c, id: `composition/${c.id}` })),
  ] };
  requireThat(dataset.cases.length > 0, 'Select at least one adapter or capability to evaluate, or use --scope core/all');
  const bytes = encode(dataset), hash = digest(bytes);
  if (!reportPath) return { status: 'planned', scope, dataset, report: { schema_version: 1,
    metadata: { model: '', harness_commit: '', dataset_sha256: hash, bundle_sha256: lock.bundle_sha256, reviewer: '', run_id: '', parameters: '' },
    results: dataset.cases.map(c => ({ id: c.id, scores: c.criteria.map(() => null), ...(c.assertions ? { assertions: c.assertions.map(() => null) } : {}), evidence: '' })) },
    note: 'Unscored template; run a real model separately and record reviewer evidence. No model is invoked.' };
  const report = readJson(path.resolve(reportPath));
  requireThat(report?.metadata?.bundle_sha256 === lock.bundle_sha256, 'Evaluation report belongs to a different installed bundle');
  return { ...scoreDataset(report, bytes), version: lock.version, scope, dataset_sha256: hash };
}
