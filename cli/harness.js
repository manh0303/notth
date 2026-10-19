import { validateAdaptiveUpdate } from './adaptive.js';
import { legacyInstallation, migrateNamespace } from './namespace-migration.js';
import fs from 'node:fs';
import { HOST_BRIDGES, isHostBridge } from './host-bridges.js';
import { localContext } from './knowledge.js';
import { kiroPayload, KIRO_HOOK } from './kiro.js';
import { requirementReport } from './skill-requirements.js';
import { loadStartConfig } from './start-config.js';
import { PROJECT_DECISIONS, emptyProjectDecisions, loadProjectDecisions, projectDecisionReport } from './project-decisions.js';
import { checkpointPath, validateCheckpoint } from './checkpoint.js';
import { readConfig } from './project-config.js';
import { claudeReport, claudeBlock, linkClaude } from './claude.js';
import { emptyEnvironment, environmentReport, loadEnvironment } from './environment.js';
import { AGENT_CONFIG, agentDefaults, loadAgentConfig } from './agents.js';
import { reviewVerification, techspecEvidence } from './verification-report.js';
import { ARTIFACTS, INTEGRATIONS, emptyArtifacts, emptyIntegrations, loadArtifactContract, artifactReport, docRoute } from './artifacts.js';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadAdapter } from './adapter-schema.js';
import { loadCapability } from './capabilities.js';
import { resolveModules } from './composition.js';
import { safe, readJson, manifest, encode, digest, stat, block, mergeAgents, payload, validateAdapters, validateCapabilities, assertSeparate, HarnessError, LOCK, CONFIG, VERSION, SLUG, isObject } from './files.js';
export * from './files.js';

export function projectConfig(root, adapters, capabilities, required = false) {
  const filename = safe(root, CONFIG);
  if (required && !stat(filename)) throw new HarnessError(`Missing ${CONFIG}; restore it from Git`);
  const config = stat(filename) ? readJson(filename) : { schema_version: 1, adapters: adapters ?? [], capabilities: capabilities ?? [] };
  const keys = isObject(config) ? Object.keys(config).sort().join(',') : '';
  if (!isObject(config) || !['adapters,schema_version', 'adapters,capabilities,schema_version'].includes(keys)
      || config.schema_version !== 1) throw new HarnessError('Invalid project.json schema');
  validateAdapters(config.adapters);
  validateCapabilities(config.capabilities ?? []);
  if (adapters !== undefined && stat(filename)
      && JSON.stringify([...adapters].sort()) !== JSON.stringify([...config.adapters].sort())) {
    throw new HarnessError('Edit .notth/project.json to select adapters, then run update');
  }
  if (capabilities !== undefined && stat(filename)
      && JSON.stringify([...capabilities].sort()) !== JSON.stringify([...(config.capabilities ?? [])].sort())) {
    throw new HarnessError('Edit .notth/project.json to select capabilities, then run update');
  }
  return config;
}

export function collect(source, folder) {
  const files = {};
  const visit = name => {
    const filename = path.join(source, name);
    const info = stat(filename);
    if (!info || info.isSymbolicLink()) throw new HarnessError(`Missing/unsafe source: ${name}`);
    if (info.isDirectory()) {
      for (const child of fs.readdirSync(filename).sort()) visit(`${name}/${child}`);
    } else if (info.isFile()) files[name] = fs.readFileSync(safe(source, name));
    else throw new HarnessError(`Unsupported source entry: ${name}`);
  };
  visit(folder);
  if (!Object.keys(files).length) throw new HarnessError(`Empty source directory: ${folder}`);
  return files;
}

export function bundle(source, config) {
  const selection = resolveModules(source, config);
  const m = manifest(source), adapters = selection.adapters, capabilities = selection.capabilities;
  const unknown = adapters.filter(a => !m.adapters.includes(a));
  if (unknown.length) throw new HarnessError(`Unknown adapters: ${unknown.join(', ')}`);
  const unknownCapabilities = capabilities.filter(c => !(m.capabilities ?? []).includes(c));
  if (unknownCapabilities.length) throw new HarnessError(`Unknown capabilities: ${unknownCapabilities.join(', ')}`);
  const files = {};
  for (const folder of ['core', 'integrations', 'templates', ...adapters.map(a => `adapters/${a}`), ...capabilities.map(c => `capabilities/${c}`), ...[...new Set(capabilities.map(c => loadCapability(source, c).asset_owner).filter(Boolean))].map(c => `capabilities/${c}`)]) {
    for (const [name, data] of Object.entries(collect(source, folder))) {
      files[`.notth/${name}`] = data;
      if (name.startsWith('core/skills/')) files[`.agents/skills/${name.slice('core/skills/'.length)}`] = data;
    }
  }
  for (const a of adapters) {
    const info = loadAdapter(source, a);
    for (const name of info.skills) {
      const dest = `.agents/skills/${name}/SKILL.md`;
      if (Object.hasOwn(files, dest)) throw new HarnessError(`Skill collision: ${name}`);
      files[dest] = fs.readFileSync(safe(source, `adapters/${a}/skills/${name}/SKILL.md`));
    }
  }
  files['.notth/templates/agents.default.json'] = encode(agentDefaults(source));
  for (const c of capabilities) {
    const info = loadCapability(source, c);
    for (const name of info.skills) {
      const dest = `.agents/skills/${name}/SKILL.md`;
      const data = fs.readFileSync(safe(source, `capabilities/${info.asset_owner ?? c}/skills/${name}/SKILL.md`));
      if (Object.hasOwn(files, dest) && !files[dest].equals(data)) throw new HarnessError(`Skill collision: ${name}`);
      files[dest] = data;
    }
  }
  const capabilityLinks = capabilities.map(c => `- For ${c} tasks, read \`.notth/capabilities/${loadCapability(source,c).asset_owner ?? c}/workflows/\` and discover relevant \`.agents/skills/harness-${loadCapability(source,c).asset_owner ?? c}-*/SKILL.md\` by description.`).join('\n')
    || '- No optional capability selected.';
  const links = adapters.map(a => `- Read \`.notth/adapters/${a}/rules.md\` and \`.notth/adapters/${a}/adapter.yaml\`; load relevant skills from \`.agents/skills/harness-${a}-*\`.`).join('\n') || '- No technology adapter selected.';
  const template = fs.readFileSync(safe(source, 'templates/AGENTS.md'), 'utf8');
  const generated = Buffer.from(template.replaceAll('{{version}}', m.version).replaceAll('{{adapters}}', links).replaceAll('{{capabilities}}', capabilityLinks).trim());
  if (!block(generated)?.equals(generated)) throw new HarnessError('AGENTS template must be one managed block');
  files['AGENTS.md'] = generated;
  const hashes = Object.fromEntries(Object.keys(files).sort().map(k => [k, digest(files[k])]));
  return { files, warnings: selection.warnings, lock: { schema_version: 1, version: m.version, adapters, capabilities, files: hashes, bundle_sha256: digest(encode(hashes)) } };
}

function managedName(name) {
  return name === 'AGENTS.md' || name === 'CLAUDE.md' || isHostBridge(name) || name === KIRO_HOOK || ['.notth/core/', '.notth/adapters/', '.notth/capabilities/', '.notth/integrations/', '.notth/templates/', '.agents/skills/harness-', '.claude/skills/harness-', '.kiro/skills/harness-'].some(prefix => name.startsWith(prefix));
}

export function loadLock(root) {
  const lock = readJson(safe(root, LOCK));
  if (!isObject(lock) || !['adapters,bundle_sha256,files,schema_version,version',
      'adapters,bundle_sha256,capabilities,files,schema_version,version'].includes(Object.keys(lock).sort().join(','))
      || lock.schema_version !== 1 || !VERSION.test(lock.version) || !isObject(lock.files)
      || !Object.hasOwn(lock.files, 'AGENTS.md')) throw new HarnessError('Invalid lock schema/content');
  validateAdapters(lock.adapters);
  validateCapabilities(lock.capabilities ?? []);
  for (const [name, sha] of Object.entries(lock.files)) {
    if (!managedName(name) || typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha)) throw new HarnessError(`Invalid lock entry: ${name}`);
    safe(root, name);
  }
  if (lock.bundle_sha256 !== digest(encode(lock.files))) throw new HarnessError('Lock digest mismatch');
  return lock;
}

function drift(root, lock) {
  return Object.entries(lock.files).filter(([name, sha]) => {
    const data = payload(root, name);
    return data === null || digest(data) !== sha;
  }).map(([name]) => name);
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

export function snapshotCheck(root) {
  const lock = loadLock(root), problems = drift(root, lock);
  return { status: problems.length ? 'error' : 'ok', version: lock.version, problems };
}

export function userIgnoreChanges(root) {
  const name = '.notth/.gitignore', filename = safe(root, name);
  const data = stat(filename) ? fs.readFileSync(filename, 'utf8') : '';
  return data.trimEnd().split(/\r?\n/).slice(-2).join('\n') === '/backups/\n/machine.json' ? {}
    : { [name]: Buffer.from(data + (data && !data.endsWith('\n') ? '\n' : '') + '/backups/\n/machine.json\n') };
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

export function install(root, source, options = {}) {
  assertSeparate(root, source);
  if (legacyInstallation(root)) return guard(root, () => migrateNamespace(root, source, options,
    { install: installCurrent, bundle, transaction, atomicWrite }));
  return installCurrent(root, source, options);
}

function installCurrent(root, source, { command = 'init', adapters, capabilities, agentPreset, dryRun = false, allowMajor = false, host, linkClaude: linkClaudeOpt = false, claudeSkills = false, writer } = {}) {
  assertSeparate(root, source);
  if (host !== undefined && (typeof host !== 'string' || !SLUG.test(host))) throw new HarnessError('Invalid host ID; choose one tool');
  return guard(root, () => {
    const hasLock = Boolean(stat(safe(root, LOCK)));
    if (command === 'update' && !hasLock) throw new HarnessError('Not installed; run init first');
    const old = hasLock ? loadLock(root) : null;
    const existingAgents = loadAgentConfig(root);
    loadStartConfig(root);
    loadProjectDecisions(root);
    loadEnvironment(root);
    localContext(root);
    loadArtifactContract(root); // Validate project-owned declarations before planning any writes.
    if (agentPreset !== undefined && command !== 'init') throw new HarnessError('Agent preset is supported only by init');
    if (agentPreset !== undefined && existingAgents) throw new HarnessError('agents.json is project-owned; edit it explicitly instead of applying an init preset');
    const config = projectConfig(root, adapters, capabilities, hasLock);
    const { files, lock, warnings } = bundle(source, config);
    const claudeName = 'CLAUDE.md', claudePath = safe(root, claudeName);
    const existingClaude = stat(claudePath) ? fs.readFileSync(claudePath) : Buffer.alloc(0);
    if (existingClaude.length > 1024 * 1024) throw new HarnessError('CLAUDE.md exceeds 1 MiB');
    let linkedClaude;
    if (linkClaudeOpt || host === 'claude-code' || old?.files[claudeName]) {
      linkedClaude = linkClaude(existingClaude);
      const owned = claudeBlock(linkedClaude);
      if (owned) { files[claudeName] = owned; lock.files[claudeName] = digest(owned); }
    }
    if (claudeSkills || host === 'claude-code' || Object.keys(old?.files ?? {}).some(p => p.startsWith('.claude/skills/harness-'))) {
      for (const [name, data] of Object.entries(files).filter(([p]) => /^\.agents\/skills\/harness-[a-z0-9-]+\/SKILL\.md$/.test(p))) {
        const id = name.split('/')[2], description = data.toString().match(/^description: (.+)$/m)?.[1] ?? 'Load canonical Harness instructions.';
        const destination = '.claude/skills/' + id + '/SKILL.md';
        files[destination] = Buffer.from('---\nname: ' + id + '\ndescription: ' + description + '\n---\n\nRead the complete canonical project file ' + String.fromCharCode(96) + name + String.fromCharCode(96) + ' before applying this skill. Follow its inputs, procedure, constraints and handoff; do not substitute this wrapper for the full instructions.\n');
        lock.files[destination] = digest(files[destination]);
      }
    }
    if (host === 'kiro' || Object.keys(old?.files ?? {}).some(p => p.startsWith('.kiro/skills/harness-'))) {
      for (const [name, data] of Object.entries(kiroPayload(files))) { files[name] = data; lock.files[name] = digest(data); }
    }
    for (const [id, bridge] of Object.entries(HOST_BRIDGES)) {
      if (host !== id && !old?.files[bridge.path]) continue;
      const data = Buffer.from('<!-- ai-harness:start -->\n' + bridge.body + '\n<!-- ai-harness:end -->');
      files[bridge.path] = data;
      lock.files[bridge.path] = digest(data);
    }
    lock.files = Object.fromEntries(Object.entries(lock.files).sort(([a],[b]) => a.localeCompare(b)));
    lock.bundle_sha256 = digest(encode(lock.files));
    if (old) {
      const conflicts = drift(root, old);
      if (conflicts.length) throw new HarnessError(`Managed files changed; reconcile in Git before updating: ${conflicts.join(', ')}`);
      const before = old.version.split('.').map(BigInt), after = lock.version.split('.').map(BigInt);
      const diff = after.findIndex((v, i) => v !== before[i]);
      if (diff !== -1 && after[diff] < before[diff]) throw new HarnessError('Downgrades are refused; revert the installation commit in Git');
      if (after[0] !== before[0] && !allowMajor) throw new HarnessError('Major upgrade requires --allow-major and migration review');
      if (command === 'init' && !encode(old).equals(encode(lock))) throw new HarnessError('Already installed; use update');
    }
    const changes = {};
    for (const [name, data] of Object.entries(files)) {
      const present = payload(root, name), owned = old && Object.hasOwn(old.files, name);
      if (present !== null && !owned && !present.equals(data)) throw new HarnessError(`Unmanaged file collision: ${name}`);
      if (present === null || !present.equals(data)) {
        const filename = safe(root, name);
        const existing = stat(filename) ? fs.readFileSync(filename) : Buffer.alloc(0);
        changes[name] = name === 'AGENTS.md' || isHostBridge(name) ? mergeAgents(existing, data) : name === 'CLAUDE.md' ? linkedClaude : data;
      }
    }
    if (old) for (const name of Object.keys(old.files)) if (!Object.hasOwn(files, name)) changes[name] = null;
    const seeds = {
      [AGENT_CONFIG]: encode(agentDefaults(source, agentPreset ?? 'recommended', host)),
      [CONFIG]: encode(config),
      [ARTIFACTS]: encode(emptyArtifacts()),
      [INTEGRATIONS]: encode(emptyIntegrations()),
      [PROJECT_DECISIONS]: encode(emptyProjectDecisions()),
      '.notth/environment.json': encode(emptyEnvironment()),
      'openspec/config.yaml': fs.readFileSync(safe(source, 'templates/openspec/config.yaml')),
      '.notth/local.md': stat(safe(source, 'templates/local.md')) ? fs.readFileSync(safe(source, 'templates/local.md')) : Buffer.from('# Project overrides\n\nRecord project facts and reviewed exceptions here.\n'),
    };
    for (const [name, data] of Object.entries(seeds)) if (!stat(safe(root, name))) changes[name] = data;
    // Project-owned ignore file: preserve all prior rules, place our anchored rule last.
    // This does not remove an already tracked machine file from the Git index.
    Object.assign(changes, userIgnoreChanges(root));
    const newLock = encode(lock);
    if (!hasLock || !fs.readFileSync(safe(root, LOCK)).equals(newLock)) changes[LOCK] = newLock;
    const plan = Object.entries(changes).map(([name, data]) => ({ path: name, action: data === null ? 'delete' : 'write' }));
    if (!dryRun) transaction(root, changes, writer);
    return { status: dryRun ? 'planned' : 'ok', version: lock.version, changes: plan, warnings };
  });
}

export function check(root) {
  const lock = loadLock(root), config = projectConfig(root, undefined, undefined, true);
  const problems = drift(root, lock);
  loadArtifactContract(root);
  loadStartConfig(root);
  loadProjectDecisions(root);
  localContext(root);
  loadAgentConfig(root); // Optional on legacy installs; validate user config without managing its bytes.
  if (JSON.stringify([...config.adapters].sort()) !== JSON.stringify([...lock.adapters].sort())) problems.push(`${CONFIG}: adapter selection changed; run update`);
  if (JSON.stringify([...(config.capabilities ?? [])].sort()) !== JSON.stringify([...(lock.capabilities ?? [])].sort())) problems.push(`${CONFIG}: capability selection changed; run update`);
  return { status: problems.length ? 'error' : 'ok', version: lock.version, problems };
}

export function changeSidecars(root, name) {
  if (!SLUG.test(name) || name === 'archive') throw new HarnessError('Invalid change ID');
  return guard(root, () => {
    if (check(root).status !== 'ok') throw new HarnessError('Fix installation drift before creating sidecars');
    const base = 'openspec/changes/' + name;
    if (!stat(safe(root, base + '/proposal.md'))) throw new HarnessError('Sidecars require an existing proposal.md');
    const lock = loadLock(root), changes = {};
    for (const file of ['.openspec.yaml', 'decisions.json', 'verification.json', 'artifact-impact.json']) {
      const template = '.notth/templates/openspec/' + file;
      if (!Object.hasOwn(lock.files, template)) throw new HarnessError('Update Harness to install sidecar templates');
      const destination = base + '/' + file;
      if (!stat(safe(root,destination))) changes[destination] = Buffer.from(fs.readFileSync(safe(root,template),'utf8').replaceAll('{{change_id}}',name));
    }
    transaction(root, changes);
    return { status: 'ok', change: name, created: Object.keys(changes), note: 'Draft sidecars only; existing files preserved.' };
  });
}

export function newChange(root, name) {
  if (!SLUG.test(name) || name === 'archive') throw new HarnessError('Change ID must be a lowercase hyphenated slug, excluding archive');
  return guard(root, () => {
    if (check(root).status !== 'ok') throw new HarnessError('Fix installation drift before creating a change');
    const folder = path.join(root, 'openspec', 'changes', name);
    safe(root, `openspec/changes/${name}/proposal.md`);
    if (stat(folder)) throw new HarnessError(`Change already exists: ${name}`);
    const mapping = { 'proposal.md': 'proposal.md', 'design.md': 'design.md', 'tasks.md': 'tasks.md', 'spec.md': `specs/${name}/spec.md`, '.openspec.yaml': '.openspec.yaml' };
    const locked = loadLock(root);
    for (const name of ['decisions.json', 'verification.json', 'artifact-impact.json']) {
      if (Object.hasOwn(locked.files, '.notth/templates/openspec/' + name)) mapping[name] = name;
    }
    const changes = {};
    for (const [src, dest] of Object.entries(mapping)) {
      const text = fs.readFileSync(safe(root, `.notth/templates/openspec/${src}`), 'utf8');
      changes[`openspec/changes/${name}/${dest}`] = Buffer.from(text.replaceAll('{{change_id}}', name));
    }
    transaction(root, changes);
    return { status: 'ok', change: name, path: folder, note: 'Draft only; replace TODOs and validate with OpenSpec' };
  });
}

// Capability drafts are project-owned and never added to the managed bundle.
export function newDoc(root, name, capability = 'product', options = {}) {
  if (!SLUG.test(name)) throw new HarnessError('Document type must be a lowercase hyphenated slug');
  if (!SLUG.test(capability)) throw new HarnessError('Capability must be a lowercase hyphenated slug');
  return guard(root, () => {
    if (check(root).status !== 'ok') throw new HarnessError('Fix installation drift before creating a document');
    const lock = loadLock(root);
    const selected = lock.capabilities ?? [];
    const profile = selected.find(id => {
      const info = loadCapability(path.join(root, '.notth'), id);
      return info.asset_owner === capability && info.templates.includes('templates/' + name + '.md');
    });
    if (!selected.includes(capability) && !profile) {
      throw new HarnessError(capability === 'product' ? 'Product capability is not installed' : `Capability is not installed: ${capability}`);
    }
    const info = loadCapability(path.join(root, '.notth'), capability);
    const owner = info.asset_owner ?? capability;
    const sourceName = info.template_aliases?.['templates/' + name + '.md']
      ? '.notth/' + info.template_aliases['templates/' + name + '.md']
      : `.notth/capabilities/${owner}/templates/${name}.md`;
    if (!Object.hasOwn(lock.files, `.notth/capabilities/${capability}/capability.json`)) {
      throw new HarnessError(`Capability metadata is not locked: ${capability}`);
    }
    const declared = loadCapability(path.join(root, '.notth'), capability).templates;
    if (!declared.includes(`templates/${name}.md`)) throw new HarnessError(`Unknown document type for ${capability}: ${name}`);
    if (!Object.hasOwn(lock.files, sourceName)) throw new HarnessError(`Document template is not locked: ${capability}/${name}`);
    if (options.report && (owner !== 'product' || name !== 'techspec')) throw new HarnessError('--report is supported only for product techspec');
    const content = options.report ? techspecEvidence(reviewVerification(root, options.report)) : fs.readFileSync(safe(root, sourceName), 'utf8');
    const folder = capability === 'product' && ['idea', 'research'].includes(name) ? 'discovery' : capability;
    const outputs = loadArtifactContract(root).artifacts.outputs;
    const routeCapability = Object.values(outputs).some(a => a.kind === 'docs' && (a.capability ?? 'product') === capability) ? capability : owner;
    const route = docRoute(root, routeCapability, name);
    if (route?.external) return { status: 'planned', type: name, capability, destination: route.destination,
      write_policy: route.write_policy, executed: false,
      template: content,
      note: 'External destination: host handoff only. No local fallback or remote write. Use the declared connection and existing authorization; preserve observed revision and return publication evidence.' };
    const outputName = route?.path ?? `docs/${folder}/${name}.md`;
    if (stat(safe(root, outputName))) throw new HarnessError(`Document already exists: ${outputName}`);
    transaction(root, { [outputName]: content });
    return { status: 'ok', type: name, capability, path: outputName,
      note: 'Template only; populate from authorized evidence and obtain human approval.' };
  });
}

export function doctor(root, skill) {
  const extensions = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  const tools = {};
  for (const name of ['git', 'node', 'npm', 'java', 'mvn', 'openspec']) {
    tools[name] = (process.env.PATH || '').split(path.delimiter).filter(Boolean).some(dir => extensions.some(ext => {
      try { const p = path.join(dir, name + ext); fs.accessSync(p, fs.constants.X_OK); return fs.statSync(p).isFile(); }
      catch { return false; }
    }));
  }
  const state = check(root), environment = environmentReport(root);
  const prerequisites = skill ? requirementReport(root, skill) : null;
  return { ...state, status: state.status !== 'ok' || environment.problems.length || prerequisites?.status === 'blocked' ? 'error' : 'ok',
    prerequisites, tools, environment, decisions: projectDecisionReport(root),
    context: { structured: localContext(root).structured, warnings: localContext(root).structured ? [] : ['Legacy prose is valid; use harness-start to add source-linked structured context when needed.'] },
    claude: claudeReport(root), artifacts: artifactReport(root), note: 'Tool presence only; no commands executed or compatibility claim made. Configured project tools take precedence over generic PATH hints.' };
}

export function saveCheckpoint(root, id, report, expected) {
  return guard(root, () => {
    if (check(root).status !== 'ok') throw new HarnessError('Fix installation drift before checkpointing');
    const name = checkpointPath(id);
    if (!stat(safe(root, 'openspec/changes/' + id + '/tasks.md'))) throw new HarnessError('Checkpoint requires an existing change');
    const row = validateCheckpoint(root, id, readConfig(root, report));
    const destination = safe(root, name), previous = stat(destination) ? fs.readFileSync(destination) : null;
    if (previous && (!/^[a-f0-9]{64}$/.test(expected ?? '') || digest(previous) !== expected)) throw new HarnessError('Checkpoint exists or changed; resume, reconcile, then supply --expected digest');
    if (!previous && expected !== undefined) throw new HarnessError('Expected checkpoint is missing');
    validateAdaptiveUpdate(previous ? JSON.parse(previous) : null, row);
    const changes = { [name]: encode(row) };
    if (previous) {
      const history = 'openspec/changes/' + id + '/checkpoint-history/' + digest(previous) + '.json';
      const p = safe(root, history);
      if (stat(p) && !fs.readFileSync(p).equals(previous)) throw new HarnessError('Checkpoint history collision');
      if (!stat(p)) changes[history] = previous;
    }
    transaction(root, changes);
    return { status: 'ok', checkpoint: name, checkpoint_sha256: digest(encode(row)), executed: false, note: 'Saved project-owned handoff/evidence declarations. Execution and remote state still require host verification.' };
  });
}
