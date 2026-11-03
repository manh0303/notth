import { canonicalSkillEntry, distributedSkillName } from './skill-names.js';
import { skillRequirements } from './skill-requirements.js';
import fs from 'node:fs';
import { manifest, readJson, safe, SLUG, HarnessError, payload } from './files.js';
import { validateContract } from './module-contract.js';
import { checksFrom, casesFrom } from './evaluation-contract.js';

const validName = name => typeof name === 'string' && SLUG.test(name);
const fail = message => { throw new HarnessError(message); };
const exact = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...fields].sort().join(',');
const unique = values => new Set(values).size === values.length;

function skillMetadata(body, name) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(body);
  if (!front || !front[1].split(/\r?\n/).includes(`name: ${name}`)) fail(`Invalid skill metadata: ${name}`);
  const description = front[1].split(/\r?\n/).find(line => line.startsWith('description: '))?.slice(13)?.trim();
  if (!description) fail(`Missing skill description: ${name}`);
  for (const heading of ['## Input', '## Procedure', '## Output', '## Constraints']) {
    if (!body.includes(heading)) fail(`Missing ${heading} in skill: ${name}`);
  }
  return { name, description, requires: skillRequirements(body) };
}

export function loadCapability(source, id) {
  if (!validName(id)) fail('Invalid capability ID');
  const prefix = `capabilities/${id}/`;
  const meta = readJson(safe(source, prefix + 'capability.json'));
  // Schema 1 supports optional role and template lists; legacy UI/UX stays valid.
  const required = ['schema_version', 'id', 'description', 'skills', 'workflows'];
  const allowed = new Set([...required, 'agents', 'templates', 'module_version', 'requires', 'recommends', 'conflicts', 'compatible_adapters', 'verification', 'evaluation', 'asset_owner', 'template_aliases', 'agent_aliases']);
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)
      || required.some(k => !Object.hasOwn(meta, k))
      || Object.keys(meta).some(k => !allowed.has(k))
      || meta.schema_version !== 1 || meta.id !== id
      || typeof meta.description !== 'string' || !meta.description.trim()) fail(`Invalid capability: ${id}`);
  validateContract(meta, 'capability', id);
  const owner = meta.asset_owner ?? id;
  if (typeof owner !== 'string' || !/^[a-z][a-z0-9-]*$/.test(owner)) fail('Invalid capability asset owner');
  const assetPrefix = 'capabilities/' + owner + '/';
  if (owner !== id) {
    const ownerMeta = readJson(safe(source, assetPrefix + 'capability.json'));
    if (ownerMeta?.asset_owner) fail('Capability profiles require a canonical owner');
    const canonical = loadCapability(source, owner);
    for (const key of ['skills','workflows','agents','templates']) {
      if (!Array.isArray(meta[key] ?? []) || !(meta[key] ?? []).every(v => (canonical[key] ?? []).includes(v))) fail('Profile contains undeclared canonical ' + key);
    }
  }
  for (const [field, list, pattern] of [
    ['template_aliases', meta.templates ?? [], /^templates\/[a-z][a-z0-9-]*[.]md$/],
    ['agent_aliases', meta.agents ?? [], /^core\/agents\/[a-z][a-z0-9-]*[.]md$/],
  ]) {
    const aliases = meta[field] ?? {};
    if (!aliases || typeof aliases !== 'object' || Array.isArray(aliases)) fail('Invalid capability aliases');
    for (const [from, to] of Object.entries(aliases)) {
      if (!list.includes(from) || typeof to !== 'string' || !pattern.test(to)) fail('Invalid capability alias');
      if (!fs.readFileSync(safe(source, to), 'utf8').trim()) fail('Empty canonical alias');
    }
  }
  if (!Array.isArray(meta.skills) || !meta.skills.length || !unique(meta.skills)
      || !meta.skills.every(name => validName(name) && name.startsWith(`harness-${owner}-`))) fail(`Invalid capability skills: ${id}`);
  if (!Array.isArray(meta.workflows) || !meta.workflows.length || !unique(meta.workflows)
      || !meta.workflows.every(p => /^workflows\/[a-z][a-z0-9-]*\.md$/.test(p))) fail(`Invalid capability workflows: ${id}`);
  for (const name of meta.skills) {
    skillMetadata(fs.readFileSync(safe(source, assetPrefix + `skills/${name}/SKILL.md`), 'utf8'), name);
  }
  for (const workflow of meta.workflows) {
    if (!fs.readFileSync(safe(source, assetPrefix + workflow), 'utf8').trim()) fail(`Empty capability workflow: ${id}/${workflow}`);
  }
  for (const [kind, pattern] of [
    ['agents', new RegExp('^agents/[a-z][a-z0-9-]*[.]md$')],
    ['templates', new RegExp('^templates/[a-z][a-z0-9-]*[.]md$')],
  ]) {
    const entries = meta[kind] ?? [];
    if (!Array.isArray(entries) || !unique(entries) || !entries.every(p => typeof p === 'string' && pattern.test(p))) fail(`Invalid capability ${kind}: ${id}`);
    for (const file of entries) {
      const body = fs.readFileSync(safe(source, assetPrefix + file), 'utf8');
      if (!body.trim()) fail(`Empty capability ${kind}: ${id}/${file}`);
      if (kind === 'agents' && !['## Inputs', '## Outputs', '## Permissions and limits', '## Handoff'].every(h => body.includes(h))) {
        fail(`Invalid capability agent contract: ${id}/${file}`);
      }
    }
  }
  // Optional capability verification/evaluation, installed as locked data.
  if (meta.verification !== undefined && meta.verification !== 'checks/verification.json') fail(`Invalid capability verification: ${id}`);
  if (meta.evaluation !== undefined && meta.evaluation !== 'evals/cases.json') fail(`Invalid capability evaluation: ${id}`);
  const checks = meta.verification ? checksFrom(source, prefix + meta.verification) : [];
  const cases = meta.evaluation ? casesFrom(source, prefix + meta.evaluation) : [];
  return { ...meta, agents: meta.agents ?? [], templates: meta.templates ?? [], checks, cases };
}

export const RETIRED_SKILLS = {
  'harness-java-spring-kafka-outbox': 'Ask SA to assess requirements and existing contracts; no messaging pattern is selected by Harness.',
  'harness-java-spring-database-migration': 'Use the approved SA data/deployment decision and project tooling; no universal migration recipe is installed.',
  'harness-astro-cloudflare': 'Use approved hosting and provider documentation; Astro no longer selects a cloud provider.',
  'harness-astro-microfrontend': 'Use approved SA module/deployment boundaries; no microfrontend recipe is installed.',
};
export function listCapabilities(source) {
  return (manifest(source).capabilities ?? []).map(id => {
    const { description, skills, workflows, agents, templates, module_version, verification, evaluation, asset_owner } = loadCapability(source, id);
    return { id, description, skills, workflows, agents, templates, asset_owner: asset_owner ?? id, module_version: module_version ?? null, verification: verification ?? null, evaluation: evaluation ?? null };
  });
}

// Progressive disclosure: return metadata only; never include skill bodies in a catalog.
export function skillCatalog(root, lock) {
  const skills = Object.keys(lock.files).filter(p => canonicalSkillEntry(p)).sort()
    .map(p => {
      const name = p.split('/')[2];
      const contents = payload(root, p).toString('utf8');
      return { ...skillMetadata(contents, name), path: p };
    });
  return { status: 'ok', version: lock.version, skills, note: 'Descriptions only. Use aih skill <name> to fetch full instructions when relevant.' };
}

export function readSkill(root, lock, name) {
  if (!validName(name) || !distributedSkillName(name)) fail('Invalid skill name');
  const relative = `.agents/skills/${name}/SKILL.md`;
  if (!Object.hasOwn(lock.files, relative)) {
    if (RETIRED_SKILLS[name]) return { status: 'planned', name, retired: true, executed: false, message: RETIRED_SKILLS[name] };
    fail(`Skill is not installed: ${name}`);
  }
  const content = payload(root, relative).toString('utf8');
  skillMetadata(content, name);
  return { status: 'ok', name, path: relative, content };
}
