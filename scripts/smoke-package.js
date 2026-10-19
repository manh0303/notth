#!/usr/bin/env node
// Exercises an actual npm tarball, global bin shim and local npx without registry access.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { SOURCE, manifest, readJson } from '../cli/harness.js';
import { parsePackMetadata } from './pack-metadata.js';

const npmCli = process.env.npm_execpath;
if (!npmCli || !fs.existsSync(npmCli)) throw new Error('Run this check through: npm run test:package');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aih-npm-'));
const env = { ...process.env, npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false',
  npm_config_cache: path.join(temp, 'cache'), npm_config_update_notifier: 'false' };
function command(exe, args, cwd, options = {}) {
  const result = spawnSync(exe, args, { cwd, env, encoding: 'utf8', timeout: 120000, ...options });
  assert.equal(result.status, 0, `${exe} ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
  return result.stdout;
}
const npm = (args, cwd = SOURCE) => command(process.execPath, [npmCli, ...args], cwd);
try {
  const packageName = readJson(path.join(SOURCE, 'package.json')).name;
  const packed = parsePackMetadata(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', temp]), packageName);
  const names = packed.files.map(f => f.path);
  for (const name of ['core/workflows/engineering-quality.md', 'integrations/engineering-sources.md',
    'capabilities/product/workflows/document-export.md', 'docs/engineering-quality.md',
    ...['java-spring', 'react-nextjs', 'react-native'].map(id => `adapters/${id}/rules/engineering.md`)]) {
    assert.ok(names.includes(name), `Missing engineering asset: ${name}`);
  }
  for (const required of ['cli/presentation.js', 'core/workflows/task-experience.md', 'capabilities/uiux/workflows/design-delivery.md', 'docs/simple-use.md', 'evals/new-user-experience.md', 'cli/workflow.js', 'core/workflows/spec-to-code.workflow.json', 'core/workflows/workflow.schema.json', 'capabilities/product/workflows/idea-to-prd.workflow.json', 'scripts/conformance-runner.js', 'templates/openspec/approvals.json', 'cli/end-user.js', 'cli/journey-evidence.js', 'core/skills/harness-end-user-testing/SKILL.md', 'core/workflows/end-user-acceptance.md', 'docs/end-user-testing.md', 'cli/start.js', 'cli/start-config.js', 'cli/portable-config.js', 'docs/start.md', 'docs/configuration-backup.md', 'LICENSE', 'bin/aih.js', 'cli/harness.js', 'cli/adapters.js', 'cli/composition.js', 'cli/module-contract.js', 'cli/evaluation-contract.js', 'cli/adapter-schema.js', 'cli/capabilities.js', 'cli/files.js', 'capabilities/uiux/capability.json', 'capabilities/product/capability.json', 'capabilities/devops/capability.json', 'capabilities/devops/evals/cases.json', 'capabilities/monetization/capability.json', 'capabilities/monetization/skills/harness-monetization-adsense-integration/SKILL.md', 'capabilities/monetization/templates/analytics-report.md', 'core/evals/composition.json', 'adapters/kubernetes/adapter.yaml', 'adapters/astro/adapter.yaml', 'adapters/astro/skills/harness-astro-islands/SKILL.md', 'capabilities/product/templates/brd.md', 'scripts/score-eval.js', 'harness.yaml', 'core/skills/harness-tdd/SKILL.md',
    'core/workflows/continuous-development.md', 'docs/continuous-development.md', 'docs/examples/continuous-development.md',
    'templates/openspec/.openspec.yaml', 'templates/AGENTS.md', ...manifest(SOURCE).adapters.map(a => `adapters/${a}/rules.md`)]) assert.ok(names.includes(required), `Missing packaged asset: ${required}`);
  assert.ok(!names.some(n => n.endsWith('.py') || n.startsWith('tests/') || n.startsWith('.git/') || n.endsWith('.tgz')));
  assert.ok(!names.some(n => /(^|\/)\.env(?:\.|$)/.test(n)));
  for (const required of ['cli/sources.js', 'core/workflows/source-intake.md', 'docs/document-sources.md', 'config/agents.default.json', 'cli/agents.js', 'core/workflows/agent-routing.md']) {
    assert.ok(names.includes(required), `Missing agent routing asset: ${required}`);
  }
  for (const required of ['capabilities/architecture/capability.json', 'capabilities/delivery/capability.json',
    'capabilities/architecture/skills/harness-architecture-solution-design/SKILL.md',
    'capabilities/delivery/templates/delivery-plan.md', 'core/workflows/solution-framing.md',
    'docs/solution-workflow.md', 'docs/tool-setup/README.md']) {
    assert.ok(names.includes(required), `Missing solution asset: ${required}`);
  }
  for (const host of ['codex', 'claude-code', 'cursor', 'copilot', 'gemini-cli', 'kiro', 'opencode', 'windsurf']) {
    assert.ok(names.includes(`docs/tool-setup/${host}.md`), `Missing host guide: ${host}`);
  }
  for (const name of ['cli/status.js','cli/host-bridges.js','templates/SETUP.md','templates/QUICKSTART.md','templates/knowledge-index.md','core/workflows/project-knowledge.md','core/workflows/recoverable-verification.md','docs/reusable-workflows.md','docs/tool-portability.md']) assert.ok(names.includes(name), 'Missing portability asset: ' + name);
  const workflowSchemas = JSON.parse(fs.readFileSync(path.join(SOURCE, 'core/workflows/spec-to-code.workflow.json')));
  assert.equal(workflowSchemas.schema_version, 1);
  const conventionAssets = ['core/rules/project-conventions.md',
    ...['java-spring', 'react-nextjs', 'react-native'].map(id => `adapters/${id}/rules/conventions.md`)];
  for (const name of [...conventionAssets, 'docs/project-conventions.md']) {
    assert.ok(names.includes(name), `Missing packaged convention asset: ${name}`);
  }
  assert.equal(path.basename(packed.filename), packed.filename, 'npm pack returned an unsafe archive filename');
  const archive = path.join(temp, packed.filename), prefix = path.join(temp, 'global');
  assert.ok(fs.existsSync(archive) && fs.statSync(archive).isFile(), `npm pack did not write ${archive}`);
  npm(['install', '--global', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', archive]);
  const target = path.join(temp, 'consumer project'); fs.mkdirSync(target);
  const bin = process.platform === 'win32' ? path.join(prefix, 'aih.cmd') : path.join(prefix, 'bin/aih');
  const run = args => process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" ${args.join(' ')}"`], target, { windowsVerbatimArguments: true })
    : command(bin, args, target);
  assert.equal(run(['--version']).trim(), readJson(path.join(SOURCE, 'package.json')).version);
  fs.writeFileSync(path.join(target, 'requirements.txt'), 'Preserve source evidence');
  const importedSource = JSON.parse(run(['import-source', 'requirements', '--input', 'requirements.txt']));
  assert.equal(importedSource.conversion, 'available-unreviewed');
  assert.equal(JSON.parse(run(['sources'])).sources[0].id, 'requirements');
  const solutionTarget = path.join(temp, 'solution project'); fs.mkdirSync(solutionTarget);
  const solutionRun = args => process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" ${args.join(' ')}"`], solutionTarget, { windowsVerbatimArguments: true })
    : command(bin, args, solutionTarget);
  assert.equal(JSON.parse(solutionRun(['init', '--capabilities', 'architecture,delivery'])).status, 'ok');
  for (const [owner, type] of [['architecture', 'overview'], ['delivery', 'delivery-plan']]) {
    const draft = JSON.parse(solutionRun(['new-doc', type, '--capability', owner]));
    assert.equal(draft.path, `docs/${owner}/${type}.md`);
    assert.equal(fs.readFileSync(path.join(solutionTarget, draft.path), 'utf8'),
      fs.readFileSync(path.join(SOURCE, readJson(path.join(SOURCE, `capabilities/${owner}/capability.json`)).template_aliases?.[`templates/${type}.md`] ?? `capabilities/${owner}/templates/${type}.md`), 'utf8'));
  }
  assert.equal(JSON.parse(solutionRun(['check'])).status, 'ok');
  const acceptancePlan = JSON.parse(solutionRun(['verify', '--adaptive'])).end_user_acceptance;
  assert.equal(acceptancePlan.executed, false);
  assert.equal(acceptancePlan.skill, 'harness-end-user-testing');
  assert.ok(fs.existsSync(path.join(solutionTarget, '.agents/skills/harness-end-user-testing/SKILL.md')));
  assert.ok(fs.existsSync(path.join(solutionTarget, '.harness/core/workflows/end-user-acceptance.md')));
  const startPlan = JSON.parse(solutionRun(['start']));
  assert.equal(startPlan.status, 'planned');
  assert.ok(startPlan.host_prompt.includes('project-setup.md'));
  const configBackup = JSON.parse(solutionRun(['backup', '--output', 'settings.json']));
  assert.equal(configBackup.status, 'ok');
  const portableTarget = path.join(temp, 'portable project'); fs.mkdirSync(portableTarget);
  fs.copyFileSync(path.join(solutionTarget, 'settings.json'), path.join(portableTarget, 'settings.json'));
  const packagedCli = path.join(prefix, 'lib/node_modules', packageName, 'bin/aih.js');
  const portableCli = process.platform === 'win32' ? path.join(prefix, 'node_modules', packageName, 'bin/aih.js') : packagedCli;
  const portableRun = args => JSON.parse(command(process.execPath, [portableCli, ...args], portableTarget));
  for (const asset of ['cli/knowledge.js','cli/structured.js','cli/kiro.js','cli/skill-requirements.js','cli/sync-integrations.js','core/skills/harness-start/SKILL.md','templates/local.md','docs/session-onboarding.md']) assert.ok(names.includes(asset), 'Missing session asset: ' + asset);
  for (const [host, bridge] of [['claude-code','CLAUDE.md'],['copilot','.github/copilot-instructions.md'],['gemini-cli','GEMINI.md'],['opencode',null],['windsurf',null]]) {
    const hostTarget = path.join(temp, host + ' project'); fs.mkdirSync(hostTarget);
    const hostRun = args => JSON.parse(command(process.execPath, [portableCli, ...args], hostTarget));
    assert.equal(hostRun(['init','--host',host]).status,'ok');
    if (bridge) assert.ok(fs.existsSync(path.join(hostTarget,bridge)));
    assert.ok(!fs.existsSync(path.join(hostTarget,'.kiro/skills/harness-start/SKILL.md')));
    assert.deepEqual(hostRun(['update']).changes,[]);
    assert.equal(hostRun(['check']).status,'ok');
    assert.match(command(process.execPath, [portableCli, 'start', '--chat', '--host', host, '--format', 'human'], hostTarget), /Next:/);
    assert.equal(hostRun(['status']).progress.deployment, 'unknown');
  }
  const kiroTarget = path.join(temp, 'kiro project'); fs.mkdirSync(kiroTarget);
  const kiroRun = args => JSON.parse(command(process.execPath, [portableCli, ...args], kiroTarget));
  assert.equal(kiroRun(['init','--host','kiro']).status,'ok');
  assert.ok(fs.existsSync(path.join(kiroTarget,'.kiro/skills/harness-start/SKILL.md')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(kiroTarget,'.kiro/hooks/harness-session.json'),'utf8')).hooks[0].trigger,'SessionStart');
  assert.equal(kiroRun(['start','--host','kiro']).knowledge.status,'missing');
  assert.equal(kiroRun(['doctor','--skill','harness-start']).status,'ok');
  for (const asset of ['cli/setup.js', 'cli/project-decisions.js', 'templates/decisions.json', 'core/workflows/seed.md', 'core/workflows/greenfield-setup.md']) assert.ok(names.includes(asset), 'Missing onboarding asset: ' + asset);
  const kiroLockBefore = fs.readFileSync(path.join(kiroTarget, '.harness/lock.json'), 'utf8');
  fs.rmSync(path.join(kiroTarget, '.harness/environment.json'));
  fs.rmSync(path.join(kiroTarget, '.harness/project.json'));
  assert.equal(kiroRun(['setup', '--apply', '--dry-run']).applied, false);
  assert.equal(fs.existsSync(path.join(kiroTarget, '.harness/environment.json')), false);
  assert.equal(kiroRun(['setup', '--apply']).applied, true);
  assert.equal(fs.readFileSync(path.join(kiroTarget, '.harness/lock.json'), 'utf8'), kiroLockBefore);
  assert.deepEqual(kiroRun(['setup', '--apply']).changes, []);
  assert.deepEqual(kiroRun(['decisions']).confirmed, []);
  assert.equal(kiroRun(['start', '--compact', '--host', 'kiro']).context.freshness, 'unchecked');
  fs.writeFileSync(path.join(kiroTarget,'README.md'),'# Source inspected by smoke fixture\n');
  fs.writeFileSync(path.join(kiroTarget,'.harness/local.md'),'---\nschema_version: 1\nstack: {}\nbuild: {}\napproved_deviations: []\nsources: ["README.md"]\n---\n# Fixture summary\n');
  assert.equal(kiroRun(['seed','--record']).status,'ok');
  assert.equal(kiroRun(['seed','--check']).freshness,'current');
  assert.deepEqual(kiroRun(['update']).changes,[]);
  assert.equal(kiroRun(['check']).status,'ok');
  assert.equal(kiroRun(['status']).executed,false);
  assert.deepEqual(kiroRun(['changes']).changes,[]);
  assert.equal(kiroRun(['new-change','sample-change']).status,'ok');
  assert.equal(kiroRun(['start','--goal','change','--change','sample-change','--task','Implement sample']).saved.change_id,'sample-change');
  assert.equal(kiroRun(['status']).change,'sample-change');
  assert.ok(kiroRun(['start','--clear']).backup);
  assert.equal(kiroRun(['status']).task,null);
  assert.ok(fs.existsSync(path.join(kiroTarget,'openspec/changes/sample-change/proposal.md')));


  assert.equal(portableRun(['restore', '--from', 'settings.json', '--transfer', '--dry-run']).status, 'planned');
  assert.equal(fs.existsSync(path.join(portableTarget, '.harness/project.json')), false);
  assert.equal(portableRun(['restore', '--from', 'settings.json', '--transfer']).status, 'ok');
  assert.equal(portableRun(['init']).status, 'ok');
  assert.equal(portableRun(['check']).status, 'ok');
  assert.deepEqual(portableRun(['start']).installed_modules.capabilities, ['architecture', 'delivery']);

  assert.equal(JSON.parse(solutionRun(['verify', '--scope', 'all'])).executed, false);
  assert.ok(JSON.parse(solutionRun(['eval', '--scope', 'all'])).dataset.cases.some(c => c.id === 'capability/architecture/pattern-levels'));
  assert.deepEqual(JSON.parse(solutionRun(['update'])).changes, []);
  JSON.parse(run(['init', '--adapters', 'java-spring,react-nextjs,react-native,ai-python']));
  assert.equal(JSON.parse(run(['check'])).status, 'ok');
  const continuousPath = '.harness/core/workflows/continuous-development.md';
  assert.ok(fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8').includes(continuousPath));
  assert.equal(fs.readFileSync(path.join(target, continuousPath), 'utf8'),
    fs.readFileSync(path.join(SOURCE, 'core/workflows/continuous-development.md'), 'utf8'));
  const continuousEval = JSON.parse(run(['eval', '--scope', 'core']));
  for (const suffix of ['feature', 'small-bug', 'business-rule', 'drift', 'resume', 'read-only', 'feedback']) {
    const row = continuousEval.report.results.find(c => c.id === 'core/continuous-' + suffix);
    assert.ok(row && row.scores.every(score => score === null));
  }
  const agentPreferences = readJson(path.join(target, '.harness/agents.json'));
  assert.equal(agentPreferences.defaultModel, 'host-default');
  assert.equal(agentPreferences.execution.autoEscalateToPremium, false);
  const routing = JSON.parse(run(['setup', '--host', 'codex'])).agent_configuration;
  assert.ok(routing.roles.every(role => role.runtime_verified === false));
  for (const name of conventionAssets) {
    assert.equal(fs.readFileSync(path.join(target, '.harness', name), 'utf8'),
      fs.readFileSync(path.join(SOURCE, name), 'utf8'));
  }
  for (const [adapter, suffixes] of Object.entries({ 'react-nextjs': ['feature-delivery', 'behavior-testing'],
    'react-native': ['screen-delivery', 'behavior-testing'] })) {
    for (const suffix of suffixes) {
      const name = `harness-${adapter}-${suffix}`, asset = `adapters/${adapter}/skills/${name}/SKILL.md`;
      assert.ok(names.includes(asset), `Missing coding skill: ${asset}`);
      assert.equal(fs.readFileSync(path.join(target, '.agents/skills', name, 'SKILL.md'), 'utf8'),
        fs.readFileSync(path.join(SOURCE, asset), 'utf8'));
      assert.ok(JSON.parse(run(['skills'])).skills.some(skill => skill.name === name));
    }
  }
  assert.ok(names.includes('docs/frontend-mobile.md'), 'Missing frontend/mobile guide');
  assert.equal(JSON.parse(run(['list'])).adapters.length, manifest(SOURCE).adapters.length);
  assert.equal(JSON.parse(run(['list'])).capabilities.length, manifest(SOURCE).capabilities.length);
  const uiuxTarget = path.join(temp, 'uiux project'); fs.mkdirSync(uiuxTarget);
  const uiuxOut = process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" init --capabilities uiux"`], uiuxTarget, { windowsVerbatimArguments: true })
    : command(bin, ['init', '--capabilities', 'uiux'], uiuxTarget);
  assert.equal(JSON.parse(uiuxOut).status, 'ok');
  assert.ok(fs.existsSync(path.join(uiuxTarget, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  for (const relative of [
    '.agents/skills/harness-uiux-design-direction/SKILL.md',
    '.agents/skills/harness-uiux-external-design/SKILL.md',
    '.harness/capabilities/uiux/integrations/design-skills.md',
    '.harness/capabilities/uiux/templates/design-system.md',
    '.harness/capabilities/uiux/evals/visual-comparison.md',
  ]) assert.ok(fs.existsSync(path.join(uiuxTarget, relative)), `Missing UI design asset: ${relative}`);
  assert.ok(!fs.existsSync(path.join(uiuxTarget, 'DESIGN.md')), 'Installer must not create a project design master');
  const astroTarget = path.join(temp, 'astro project'); fs.mkdirSync(astroTarget);
  fs.writeFileSync(path.join(astroTarget, 'package.json'), JSON.stringify({ private:true,
    dependencies: { astro: '^5', '@astrojs/react': '^4', 'react-dom': '^19' } }));
  const inAstro = args => process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" ${args.join(' ')}"`], astroTarget, { windowsVerbatimArguments: true })
    : command(bin, args, astroTarget);
  assert.deepEqual(JSON.parse(inAstro(['detect'])).adapters, ['astro']);
  assert.equal(JSON.parse(inAstro(['init', '--detect'])).status, 'ok');
  assert.ok(fs.existsSync(path.join(astroTarget, '.agents/skills/harness-astro-islands/SKILL.md')));
  assert.equal(JSON.parse(inAstro(['check'])).status, 'ok');
  const monetizationTarget = path.join(temp, 'monetization site'); fs.mkdirSync(monetizationTarget);
  const monetizeRun = args => process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" ${args.join(' ')}"`], monetizationTarget, { windowsVerbatimArguments: true })
    : command(bin, args, monetizationTarget);
  assert.equal(JSON.parse(monetizeRun(['init','--capabilities','monetization'])).status,'ok');
  assert.ok(fs.existsSync(path.join(monetizationTarget,'.agents/skills/harness-monetization-adsense-integration/SKILL.md')));
  assert.ok(fs.existsSync(path.join(monetizationTarget,'.harness/capabilities/monetization/templates/site-monetization-plan.md')));
  assert.equal(JSON.parse(monetizeRun(['check'])).status,'ok');
  assert.equal(JSON.parse(monetizeRun(['verify','--scope','capabilities'])).executed,false);
  assert.equal(JSON.parse(monetizeRun(['eval','--scope','capabilities'])).dataset.cases.length,4);
  const productTarget = path.join(temp, 'product project'); fs.mkdirSync(productTarget);
  const productOut = process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" init --capabilities product,uiux"`], productTarget, { windowsVerbatimArguments: true })
    : command(bin, ['init', '--capabilities', 'product,uiux'], productTarget);
  assert.equal(JSON.parse(productOut).status, 'ok');
  assert.ok(fs.existsSync(path.join(productTarget, '.harness/capabilities/product/templates/prd.md')));
  assert.ok(fs.existsSync(path.join(productTarget, '.agents/skills/harness-product-prd-generation/SKILL.md')));
  assert.ok(fs.existsSync(path.join(productTarget, '.agents/skills/harness-uiux-figma-design/SKILL.md')));
  const productDocOut = process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" new-doc brd"`], productTarget, { windowsVerbatimArguments: true })
    : command(bin, ['new-doc', 'brd'], productTarget);
  assert.equal(JSON.parse(productDocOut).status, 'ok');
  assert.ok(fs.existsSync(path.join(productTarget, 'docs/product/brd.md')));
  for (const name of ['artifacts.json', 'integrations.json']) assert.ok(fs.existsSync(path.join(productTarget, '.harness', name)));
  const productRun = args => process.platform === 'win32'
    ? command(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${bin}" ${args.join(' ')}"`], productTarget, { windowsVerbatimArguments: true })
    : command(bin, args, productTarget);
  assert.equal(JSON.parse(productRun(['verify', '--adaptive'])).executed, false);
  assert.ok(fs.existsSync(path.join(productTarget, '.agents/skills/harness-verification/SKILL.md')));
  assert.ok(fs.existsSync(path.join(productTarget, '.agents/skills/harness-product-techspec/SKILL.md')));
  const notRun = { schema_version: 1, metadata: { run_id: 'package', feature: 'package smoke', source_revision: 'fixture', environment: 'offline', producer: 'smoke-package', timestamp: new Date().toISOString() }, requirements: [{ id: 'AC-1', description: 'Pending host check', source: 'package fixture' }], scenarios: [{ id: 'pending', status: 'NOT_RUN', executed: false, references: ['AC-1'], method: 'unit', preconditions: ['host required'], fixture: 'none', steps: ['run host test'], expected: 'fixture result', observed: 'not executed', timestamp: new Date().toISOString(), mutates: false, cleanup: { strategy: 'no mutations', status: 'NOT_RUN' }, evidence: [], assertions: [], reason: 'offline smoke' }] };
  fs.writeFileSync(path.join(productTarget, 'verification.json'), JSON.stringify(notRun));
  assert.equal(JSON.parse(productRun(['verify', '--report', 'verification.json'])).verdict, 'NOT_RUN');
  const draft = JSON.parse(productRun(['new-doc', 'techspec', '--report', 'verification.json']));
  assert.match(fs.readFileSync(path.join(productTarget, draft.path), 'utf8'), /UNVERIFIED/);
  assert.ok(names.includes('scripts/compare-tasks.js'));
  assert.ok(names.includes('cli/checkpoint.js'));
  assert.ok(names.includes('capabilities/analysis/capability.json'));
  assert.ok(names.includes('docs/i18n/README.zh-CN.md'));
  assert.ok(!names.some(n => ['harness-java-spring-kafka-outbox','harness-java-spring-database-migration','harness-astro-cloudflare','harness-astro-microfrontend'].some(id => n.includes('/skills/'+id+'/'))));
  assert.equal(JSON.parse(productRun(['agents'])).roles.find(r => r.id === 'product:project-manager').canonical_id, 'core:project-manager');
  assert.equal(JSON.parse(productRun(['update','--link-claude','--claude-skills'])).status, 'ok');
  assert.ok(fs.existsSync(path.join(productTarget,'.claude/skills/harness-tdd/SKILL.md')));
  const linkedBytes=fs.readFileSync(path.join(productTarget,'CLAUDE.md'));
  assert.equal(JSON.parse(productRun(['update','--link-claude','--claude-skills'])).changes.length,0);
  assert.ok(fs.readFileSync(path.join(productTarget,'CLAUDE.md')).equals(linkedBytes));
  const installedPackage=process.platform==='win32'?path.join(prefix,'node_modules',packageName):path.join(prefix,'lib/node_modules',packageName);
  const exported=JSON.parse(command(process.execPath,[path.join(installedPackage,'scripts/compare-tasks.js'),'--template'],productTarget));
  assert.equal(exported.runs.length,18);
  const artifactContract = { schema_version: 1, mode: 'idea-driven', inputs: {}, outputs: {
    requirements: { kind: 'docs', capability: 'product', location: { path: 'docs/chosen' }, canonical: true, write_policy: 'propose' },
  } };
  fs.writeFileSync(path.join(productTarget, '.harness/artifacts.json'), JSON.stringify(artifactContract));
  assert.equal(JSON.parse(productRun(['new-doc', 'prd-lite'])).path, 'docs/chosen/prd-lite.md');
  assert.ok(fs.existsSync(path.join(productTarget, 'docs/chosen/prd-lite.md')));
  artifactContract.outputs.requirements.location = { url: 'https://example.com/wiki/123', connection: 'wiki' };
  fs.writeFileSync(path.join(productTarget, '.harness/artifacts.json'), JSON.stringify(artifactContract));
  fs.writeFileSync(path.join(productTarget, '.harness/integrations.json'), JSON.stringify({ schema_version: 1, connections: {
    wiki: { via: 'connector', binding: 'atlassian', purpose: 'Requirements' },
  } }));
  const handoff = JSON.parse(productRun(['new-doc', 'srs']));
  assert.equal(handoff.status, 'planned'); assert.equal(handoff.executed, false); assert.ok(handoff.template);
  assert.ok(!fs.existsSync(path.join(productTarget, 'docs/product/srs.md')));
  assert.equal(JSON.parse(productRun(['artifacts'])).connections[0].availability, 'unverified');

  assert.equal(JSON.parse(run(['verify'])).executed, false);
  const adapterEvaluation = JSON.parse(run(['eval']));
  const expectedCases = ['java-spring', 'react-nextjs', 'react-native', 'ai-python']
    .reduce((sum, id) => sum + readJson(path.join(SOURCE, 'adapters', id, 'evals/cases.json')).cases.length, 0);
  assert.equal(adapterEvaluation.dataset.cases.length, expectedCases);
  assert.ok(JSON.parse(run(['eval', '--scope', 'all'])).dataset.cases.some(x => x.id.startsWith('core/')));
  assert.ok(!fs.existsSync(path.join(target, '.agents/skills/harness-java-spring-kafka-outbox/SKILL.md')));
  assert.ok(fs.existsSync(path.join(target, '.agents/skills/harness-java-spring-spring-api/SKILL.md')));
  JSON.parse(run(['new-change', 'package-smoke']));
  assert.ok(fs.existsSync(path.join(target, 'openspec/changes/package-smoke/.openspec.yaml')));
  assert.equal(JSON.parse(run(['setup'])).status, 'planned');
  assert.equal(JSON.parse(run(['doctor'])).environment.configured, true);
  const recovery={schema_version:1,change_id:'package-smoke',phase:'implementation',summary:'Offline recovery fixture',timestamp:new Date().toISOString(),baseline:[],completed:[],pending:[{id:'next',summary:'Review fixture'}],in_progress:null,blockers:[],next_action:'Review actual host state',external_sources:[],operations:[]};
  fs.writeFileSync(path.join(target,'handoff.json'),JSON.stringify(recovery));
  const checkpoint=JSON.parse(run(['checkpoint','package-smoke','--report','handoff.json']));
  assert.ok(checkpoint.checkpoint_sha256);
  assert.equal(JSON.parse(run(['resume','package-smoke'])).revalidate_required,false);
  const profileTarget=path.join(temp,'profile consumer');fs.mkdirSync(profileTarget);
  const profileRun=args=>process.platform==='win32'
    ? command(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`""${bin}" ${args.join(' ')}"`],profileTarget,{windowsVerbatimArguments:true})
    : command(bin,args,profileTarget);
  assert.equal(JSON.parse(profileRun(['init','--capabilities','analysis,discovery'])).status,'ok');
  const catalog=JSON.parse(profileRun(['skills'])).skills;
  assert.equal(catalog.length,new Set(catalog.map(s=>s.name)).size);
  assert.ok(fs.existsSync(path.join(profileTarget,JSON.parse(profileRun(['new-doc','srs'])).path)));
  assert.equal(JSON.parse(profileRun(['check'])).status,'ok');
  const changeDir = path.join(target, 'openspec/changes/package-smoke');
  for (const file of ['decisions.json', 'verification.json', 'artifact-impact.json']) assert.ok(fs.existsSync(path.join(changeDir, file)));
  fs.writeFileSync(path.join(changeDir, 'proposal.md'), '# Proposal\nAdd the reviewed smoke behavior.\n');
  fs.writeFileSync(path.join(changeDir, 'design.md'), '# Design\nUse the existing implementation boundary.\n');
  fs.writeFileSync(path.join(changeDir, 'tasks.md'), '# Tasks\n- [x] Implement and check\n## After merge\n- [ ] Archive\n');
  fs.writeFileSync(path.join(changeDir, 'specs/package-smoke/spec.md'),
    '## ADDED Requirements\n### Requirement: Smoke\nThe tool SHALL report state.\n#### Scenario: State\n- WHEN invoked\n- THEN return state\n');
  fs.writeFileSync(path.join(changeDir, 'decisions.json'), JSON.stringify({ schema_version: 1, reviewed: true, decisions: [] }));
  fs.writeFileSync(path.join(changeDir, 'verification.json'), JSON.stringify({ schema_version: 1,
    checks: [{ name: 'synthetic-smoke', status: 'passed', evidence: 'Synthetic CLI fixture, not live-model evidence' }] }));
  assert.equal(JSON.parse(run(['ready', 'package-smoke', '--stage', 'implement'])).status, 'ready');
  assert.equal(JSON.parse(run(['ready', 'package-smoke', '--stage', 'review'])).status, 'ready');
  assert.deepEqual(JSON.parse(run(['update'])).changes, []);
  // Local installation lives inside the target: this must not trigger overlap protection.
  const local = path.join(temp, 'local-consumer'); fs.mkdirSync(local); fs.writeFileSync(path.join(local, 'package.json'), '{"private":true}'); fs.writeFileSync(path.join(local, 'pom.xml'), '<groupId>org.springframework.boot</groupId>');
  npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', archive], local);
  const localResult = JSON.parse(npm(['exec', '--offline', '--', 'aih', 'init', '--detect'], local));
  assert.equal(localResult.status, 'ok');
  assert.equal(JSON.parse(npm(['exec', '--offline', '--', 'aih', 'check'], local)).status, 'ok');
  console.log(JSON.stringify({ status: 'ok', version: packed.version, package_files: names.length,
    checks: ['npm pack assets', 'packaged and installed Core/BE/FE/mobile conventions', 'global aih shim', 'cwd default', 'all adapters and skills', 'selective UI/UX capability', 'product document bundle', 'artifact seeds, routed docs and external host handoff', 'Architecture/Delivery capability drafts and isolated package installation', 'monetization bundle and advisory checks', 'Astro packaged detection and skills', 'installed verify/eval', 'stack detection', 'new-change dotfile', 'setup/doctor and structural readiness', 'guided start, configuration backup/transfer/restore before init', 'installed end-user skill/workflow and adaptive host plan', 'idempotent update', 'local npm exec without network'] }, null, 2));
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
