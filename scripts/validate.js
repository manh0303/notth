#!/usr/bin/env node
import { workflowReport } from '../cli/workflow.js';
import { loadAdapter } from '../cli/adapter-schema.js';
import { loadCapability } from '../cli/capabilities.js';
import { validateRegistry } from '../cli/composition.js';
import { checksFrom, casesFrom } from '../cli/evaluation-contract.js';
import { agentDefaults, registeredRoles, validatePreferredSkills } from '../cli/agents.js';
import fs from 'node:fs';
import { hasReleaseHeading } from './release-heading.js';
import path from 'node:path';
import { SOURCE, manifest, bundle, readJson } from '../cli/harness.js';

try {
  const errors = [], m = manifest(SOURCE), pkg = readJson(path.join(SOURCE, 'package.json'));
  if (m.version !== pkg.version) errors.push('package.json and harness.yaml versions differ');
  if (readJson(path.join(SOURCE, 'package-lock.json')).version !== pkg.version) errors.push('package-lock version mismatch');
  if (pkg.bin?.aih !== 'bin/aih.js') errors.push('aih executable missing');
  if (pkg.license !== 'MIT' || readJson(path.join(SOURCE, 'package-lock.json')).packages?.['']?.license !== 'MIT') {
    errors.push('npm license metadata must be MIT');
  }
  const licenseFile = path.join(SOURCE, 'LICENSE');
  if (!fs.existsSync(licenseFile) || !fs.readFileSync(licenseFile, 'utf8').startsWith('MIT License\n')) {
    errors.push('Missing or invalid MIT LICENSE file');
  }
  if (Object.keys(pkg.dependencies ?? {}).length) errors.push('Runtime must remain dependency-free');
  const required = ['README.md', 'AGENTS.md', 'CHANGELOG.md', 'docs/architecture.md', 'docs/versioning.md',
    'core/rules/foundations.md', 'core/rules/context.md', 'core/policies/security.md', 'core/policies/permissions.md',
    'core/workflows/spec-to-code.md', 'integrations/github/README.md', 'integrations/gitlab/harness-ci.yml',
    'integrations/mcp/server-inventory.example.json', '.github/workflows/harness.yml'];
  for (const name of required) if (!fs.existsSync(path.join(SOURCE, name)) || !fs.statSync(path.join(SOURCE, name)).size) errors.push(`Missing/empty file: ${name}`);
  const skills = fs.readdirSync(path.join(SOURCE, 'core/skills'));
  if (skills.length < 5) errors.push('Missing required skills');
  for (const name of skills) {
    const text = fs.readFileSync(path.join(SOURCE, 'core/skills', name, 'SKILL.md'), 'utf8');
    if (!text.startsWith('---\n') || !text.includes(`name: ${name}\n`) || !text.includes('description: ')) errors.push(`Invalid skill metadata: ${name}`);
    for (const section of ['## Input', '## Procedure', '## Output', '## Constraints']) if (!text.includes(section)) errors.push(`Missing ${section}: ${name}`);
  }
  for (const name of ['planner', 'implementer', 'reviewer', 'security-reviewer', 'test-engineer']) {
    const text = fs.readFileSync(path.join(SOURCE, `core/agents/${name}.md`), 'utf8');
    for (const section of ['## Inputs', '## Outputs', '## Permissions and limits', '## Handoff']) if (!text.includes(section)) errors.push(`Missing ${section}: ${name}`);
  }
  for (const name of m.adapters) {
    loadAdapter(SOURCE, name);
  }
  for (const name of m.capabilities ?? []) loadCapability(SOURCE, name);
  validateRegistry(SOURCE);
  const workflowContracts = workflowReport(SOURCE, m.capabilities ?? []).workflows.map(w => w.path);
  if (JSON.stringify(m.workflow_contracts) !== JSON.stringify(workflowContracts)) errors.push('Workflow manifest paths differ from validated contracts');
  const knownSkills = new Set([...skills,
    ...m.adapters.flatMap(id => loadAdapter(SOURCE,id).skills),
    ...(m.capabilities ?? []).flatMap(id => loadCapability(SOURCE,id).skills)]);
  const contracts = new Set([...Object.values(registeredRoles(SOURCE,m.capabilities ?? [])), ...(m.capabilities ?? []).flatMap(id => { const info=loadCapability(SOURCE,id); return info.agents.map(file => 'capabilities/' + (info.asset_owner ?? id) + '/' + file); })]);
  for (const contract of contracts) {
    try { validatePreferredSkills(fs.readFileSync(path.join(SOURCE,contract),'utf8'), knownSkills); }
    catch(error) { errors.push(contract + ': ' + error.message); }
  }
  // Validate installed shared references and required skill availability, not just source paths.
  for (const selection of [[],['analysis'],['discovery'],['product'],['product','analysis','discovery']]) {
    const installed = bundle(SOURCE,{adapters:[],capabilities:selection}).files;
    for (const [p, data] of Object.entries(installed)) {
      if (p.startsWith('.agents/skills/')) {
        for (const match of data.toString().matchAll(/\.notth\/capabilities\/[a-z0-9/-]+\.md/g))
          if (!Object.hasOwn(installed, match[0])) errors.push('Missing installed reference: ' + p + ' -> ' + match[0]);
      }
    }
  }
  const defaultAgents = agentDefaults(SOURCE);
  for (const role of Object.keys(registeredRoles(SOURCE, m.capabilities ?? []))) {
    if (!Object.hasOwn(defaultAgents.agents, role)) errors.push('Missing default agent role: ' + role);
  }
  checksFrom(SOURCE, 'core/checks/verification.json');
  casesFrom(SOURCE, 'core/evals/cases.json');
  const { files } = bundle(SOURCE, { schema_version: 1, adapters: m.adapters, capabilities: m.capabilities ?? [] });
  function links(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'fixtures'].includes(item.name)) continue;
      const filename = path.join(dir, item.name);
      if (item.isDirectory()) links(filename);
      else if (item.name.endsWith('.md')) {
        const text = fs.readFileSync(filename, 'utf8');
        for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
          const target = match[1];
          if (target.includes('://') || target.startsWith('#') || target.startsWith('mailto:')) continue;
          if (!fs.existsSync(path.resolve(path.dirname(filename), target.split('#')[0]))) errors.push(`Broken link: ${filename} -> ${target}`);
        }
      }
    }
  }
  links(SOURCE);
  const cases = readJson(path.join(SOURCE, 'evals/cases.json')).cases, ids = new Set();
  for (const c of cases) {
    if (ids.has(c.id) || !c.criteria.length || typeof c.critical !== 'boolean') errors.push(`Invalid eval case: ${c.id}`);
    ids.add(c.id);
  }
  if (!hasReleaseHeading(fs.readFileSync(path.join(SOURCE, 'CHANGELOG.md'), 'utf8'), m.version)) errors.push('Manifest version missing from CHANGELOG');
  console.log(JSON.stringify({ status: errors.length ? 'error' : 'ok', version: m.version, adapters: m.adapters.length, capabilities: (m.capabilities ?? []).length,
    core_skills: skills.length, adapter_skills: m.adapters.reduce((n, id) => n + loadAdapter(SOURCE, id).skills.length, 0), managed_files_all_adapters: Object.keys(files).length, errors,
    scope: 'Offline structure only; upstream OpenSpec and live model evaluation are separate' }, null, 2));
  process.exitCode = errors.length ? 1 : 0;
} catch (error) { console.error(JSON.stringify({ status: 'error', message: error.message })); process.exitCode = 1; }
