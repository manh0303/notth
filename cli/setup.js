import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { safe, stat, encode, HarnessError, CONFIG } from './files.js';
import { loadLock, snapshotCheck, projectConfig, guard, transaction, userIgnoreChanges } from './harness.js';
import { validateAgentConfig, loadAgentConfig, AGENT_CONFIG } from './agents.js';
import { loadEnvironment, setupPlan } from './environment.js';
import { loadArtifactContract, ARTIFACTS, INTEGRATIONS } from './artifacts.js';
import { localContext } from './knowledge.js';
import { loadStartConfig } from './start-config.js';
import { PROJECT_DECISIONS, emptyProjectDecisions, loadProjectDecisions } from './project-decisions.js';

function validateCandidate(root, changes) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-setup-validate-'));
  try {
    for (const name of [CONFIG, AGENT_CONFIG, ARTIFACTS, INTEGRATIONS, '.notth/environment.json',
      '.notth/machine.json', '.notth/local.md', '.notth/start.json', PROJECT_DECISIONS]) {
      const p = safe(root, name), data = changes[name] ?? (stat(p) ? fs.readFileSync(p) : null);
      if (data !== null) { const dest = safe(temp, name); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, data, { mode: 0o600 }); }
    }
    projectConfig(temp, undefined, undefined, true); loadAgentConfig(temp); loadEnvironment(temp);
    loadArtifactContract(temp); loadStartConfig(temp); localContext(temp); loadProjectDecisions(temp);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

// A cloned snapshot supplies templates; this operation never reinstalls or changes its payload/lock.
export function setupProject(root, { apply = false, dryRun = false, greenfield = false, host, writer } = {}) {
  if (dryRun && !apply) throw new HarnessError('setup --dry-run requires --apply');
  const operation = () => {
    if (snapshotCheck(root).status !== 'ok') throw new HarnessError('Fix installation drift before setup');
    const lock = loadLock(root), hasProject = Boolean(stat(safe(root, CONFIG)));
    const config = hasProject ? projectConfig(root, undefined, undefined, true)
      : { schema_version: 1, adapters: lock.adapters, capabilities: lock.capabilities ?? [] };
    if (JSON.stringify([...config.adapters].sort()) !== JSON.stringify([...lock.adapters].sort())
      || JSON.stringify([...(config.capabilities ?? [])].sort()) !== JSON.stringify([...(lock.capabilities ?? [])].sort())) {
      throw new HarnessError('Project selection changed; run update before setup');
    }
    loadAgentConfig(root); loadEnvironment(root); loadArtifactContract(root); loadStartConfig(root); localContext(root); loadProjectDecisions(root);
    if (!hasProject && !apply) throw new HarnessError('Missing project.json; use setup --apply to scaffold from the installed snapshot');
    const changes = {};
    if (apply) {
      const template = name => {
        const p = '.notth/templates/' + name;
        if (!Object.hasOwn(lock.files, p)) throw new HarnessError('Setup requires installed template ' + name + '; use a reviewed update');
        return fs.readFileSync(safe(root, p));
      };
      const missingTemplate = (dest, name) => { if (!stat(safe(root, dest))) changes[dest] = template(name); };
      if (!hasProject) changes[CONFIG] = encode(config);
      if (!stat(safe(root, AGENT_CONFIG))) {
        const data = template('agents.default.json'); validateAgentConfig(JSON.parse(data)); changes[AGENT_CONFIG] = data;
      }
      missingTemplate(ARTIFACTS, 'artifacts.json'); missingTemplate(INTEGRATIONS, 'integrations.json');
      missingTemplate('.notth/environment.json', 'environment.json'); missingTemplate('.notth/local.md', 'local.md');
      missingTemplate('openspec/config.yaml', 'openspec/config.yaml');
      if (!stat(safe(root, PROJECT_DECISIONS))) changes[PROJECT_DECISIONS] = encode(emptyProjectDecisions());
      Object.assign(changes, userIgnoreChanges(root));
      validateCandidate(root, changes);
      if (!dryRun) transaction(root, changes, writer);
    }
    return { ...(dryRun ? { status: 'planned' } : setupPlan(root, lock.adapters, process.env, host)),
      changes: Object.keys(changes), applied: apply && !dryRun,
      workflow: '.notth/core/workflows/' + (greenfield ? 'greenfield-setup.md' : 'seed.md'),
      note: 'Missing-only configuration scaffolding from the installed snapshot. Existing answers, machine paths, managed files and lock are preserved; host inspection/interview establishes facts.' };
  };
  return apply ? guard(root, operation) : operation();
}
