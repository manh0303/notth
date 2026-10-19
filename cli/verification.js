import fs from 'node:fs';
import { endUserPlan } from './end-user.js';
import { safe, stat, HarnessError } from './files.js';
import { detect } from './adapters.js';
import { loadArtifactContract } from './artifacts.js';
import { loadEnvironment } from './environment.js';

function read(root, name) {
  const p = safe(root, name), info = stat(p);
  if (!info) return null;
  if (info.size > 1024 * 1024) throw new HarnessError('Discovery file exceeds 1 MiB');
  return fs.readFileSync(p, 'utf8');
}
export function adaptiveVerification(root, source) {
  const detected = detect(root, source), signals = [], frameworks = new Set(), languages = new Set(), methods = new Map();
  const add = (method, reason, evidence) => {
    if (!methods.has(method)) methods.set(method, { method, reasons: [], evidence: [], executed: false });
    const row = methods.get(method); row.reasons.push(reason); row.evidence.push(evidence);
  };
  const pkgBody = read(root, 'package.json');
  let pkg = {};
  if (pkgBody !== null) {
    try { pkg = JSON.parse(pkgBody); } catch { throw new HarnessError('Invalid project package.json'); }
    if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) throw new HarnessError('Invalid project package.json');
    if (pkg.scripts !== undefined && (!pkg.scripts || typeof pkg.scripts !== 'object' || Array.isArray(pkg.scripts))) throw new HarnessError('Invalid package scripts during discovery');
    languages.add('javascript/typescript');
    const deps = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
    for (const [dep, method] of [['vitest','unit'],['jest','unit'],['@playwright/test','browser-e2e'],['playwright','browser-e2e'],['cypress','browser-e2e'],['detox','mobile-e2e']]) {
      if (deps.has(dep)) { frameworks.add(dep); add(method, 'Reuse declared project framework', 'package.json#' + dep); }
    }
    for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
      if (typeof command !== 'string') throw new HarnessError('Invalid package script during discovery');
      signals.push({ source: 'package.json#scripts.' + name, fact: 'Declared script; review before execution' });
      if (/^(test|test:unit)$/.test(name)) add('unit', 'Existing test entry point', 'package.json#scripts.' + name);
      if (/^(build|typecheck|lint|check)$/.test(name)) add(name, 'Existing project check', 'package.json#scripts.' + name);
      if (/maestro/i.test(command)) { frameworks.add('maestro'); add('mobile-e2e', 'Existing mobile test script', 'package.json#scripts.' + name); }
    }
  }
  for (const name of ['pom.xml','build.gradle','build.gradle.kts','pyproject.toml','requirements.txt','go.mod','Cargo.toml']) {
    const body = read(root, name); if (body === null) continue;
    signals.push({ source: name, fact: 'Build/dependency metadata exists; source inspection still needed' });
    if (/pom|gradle/.test(name)) {
      languages.add('java/jvm');
      for (const dep of ['junit','testcontainers','rest-assured','spring-boot-starter-test']) if (body.toLowerCase().includes(dep)) frameworks.add(dep);
      if (/test|junit/i.test(body)) add('unit', 'Test dependency declared', name);
      if (/testcontainers/i.test(body)) add('integration', 'Container fixture dependency declared; verify runtime access', name);
      if (/rest-assured/i.test(body)) add('api', 'Existing API testing dependency', name);
    } else if (/pyproject|requirements/.test(name)) {
      languages.add('python');
      if (/pytest/i.test(body)) { frameworks.add('pytest'); add('unit', 'Existing Python test framework', name); }
      if (/langchain|llama.index|sentence.transformers/i.test(body)) add('ai-rag-evaluation', 'AI/retrieval dependency; inspect actual requirements and datasets', name);
    } else languages.add(name === 'go.mod' ? 'go' : 'rust');
  }
  let hasApi = false;
  for (const name of ['openapi.json','openapi.yaml','openapi.yml']) {
    if (read(root, name) !== null) {
      hasApi = true;
      signals.push({ source: name, fact: 'API contract present; does not prove a running service' });
      add('contract', 'Existing interface contract', name); add('api', 'Exercise applicable contract scenarios through authorized host tools', name);
    }
  }
  const contract = loadArtifactContract(root), env = loadEnvironment(root);
  for (const [id, a] of Object.entries(contract.artifacts.inputs)) {
    signals.push({ source: 'input:' + id, fact: 'Declared source; availability/content not verified', location: a.location });
    if (a.kind === 'business-workflow') add('business-workflow', 'Declared workflow source; inspect transitions and AC before choosing a pattern', 'input:' + id);
  }
  const hasStaticPage = read(root, 'index.html') !== null;
  if (detected.adapters.includes('astro') || hasStaticPage) {
    add('build', 'Static site must build or validate its output', 'static-site metadata');
    add('accessibility', 'Review applicable static-site accessibility requirements', 'static-site metadata');
  }
  if (detected.adapters.includes('react-nextjs')) add('component', 'UI stack detected; inspect feature and existing tests', 'adapter:react-nextjs');
  if (detected.adapters.includes('react-native')) add('component', 'Mobile stack detected; device E2E only when needed and available', 'adapter:react-native');
  if (!methods.size) add('manual-review', 'No supported test entry point discovered; inspect source and clarify essential gaps', 'project discovery');
  return { status: 'planned', executed: false, discovery: { adapters: detected.adapters, languages: [...languages],
    frameworks: [...frameworks], signals, commands: Object.keys(env.shared.commands).map(id => ({ id, source: '.notth/environment.json#commands.' + id })) },
    end_user_acceptance: endUserPlan({ adapters: detected.adapters, frameworks: [...frameworks], hasStaticPage, hasApi, hasCli: typeof pkg.bin === 'string' || (pkg.bin !== null && typeof pkg.bin === 'object' && !Array.isArray(pkg.bin) && Object.keys(pkg.bin).length > 0) }),
    methods: [...methods.values()], connections: Object.entries(contract.integrations.connections).map(([id]) => ({ id, availability: 'unverified' })),
    unknowns: ['Inspect scoped source to determine architecture, routes/auth, database/service dependencies and business patterns.',
      'Check actual tools, fixture isolation and permission before executing; metadata is not evidence of environment readiness.',
      'Requirements determine integration/E2E/auth/security/regression scope; never force every method or install a missing framework automatically.'],
    note: 'Read-only heuristic plan. Preserve existing frameworks and project commands; host executes tests. No network, shell, database or model calls.' };
}
