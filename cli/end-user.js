// Tool selection is a host decision. This plan never runs or installs browser/device tooling.
export function endUserPlan({ adapters, frameworks, hasStaticPage, hasApi, hasCli }) {
  const surfaces = [];
  if (hasStaticPage || adapters.some(id => ['react-nextjs', 'astro'].includes(id))) surfaces.push('web');
  if (adapters.includes('react-native')) surfaces.push('mobile');
  if (hasApi || adapters.includes('java-spring')) surfaces.push('api');
  if (hasCli) surfaces.push('cli');
  const tools = surfaces.map(surface => ({ surface, availability: 'unverified',
    candidates: surface === 'web' ? frameworks.filter(x => ['@playwright/test', 'playwright', 'cypress'].includes(x)).length
      ? frameworks.filter(x => ['@playwright/test', 'playwright', 'cypress'].includes(x)) : ['authorized host browser tool', 'Playwright if a new runner is agreed']
      : surface === 'mobile' ? frameworks.filter(x => ['detox', 'maestro'].includes(x)).length
        ? frameworks.filter(x => ['detox', 'maestro'].includes(x)) : ['existing device/simulator tooling; clarify missing runner']
      : surface === 'cli' ? ['authorized host terminal and existing CLI tests'] : ['existing HTTP/API test client'],
  }));
  return { executed: false, status: 'planned', surface_hints: surfaces, tools,
    workflow: '.notth/core/workflows/end-user-acceptance.md', skill: 'harness-end-user-testing', role: 'core:test-engineer',
    required_context: ['Reviewed AC and affected user journeys/roles; inspect input sources before asking.',
      'Actual app URL/start command or public CLI/API entry; reachable test environment and test-account references.',
      'Existing runner or available host tools, isolated fixtures and permitted mutations/cleanup.',
      'Real vs mocked dependencies, tested revision and configured evidence/output destination.'],
    completion_gate: ['Exercise the actual user-facing interface for applicable AC, including relevant failure/role/state paths.',
      'Record observed user outcomes with requirement-linked JSON assertions and redacted screenshot/trace/video receipts where applicable.',
      'For full acceptance use verification_target=end-user and a matching real/not-applicable dependency journey; mocks/unknown dependencies cannot verify that target.',
      'Unavailable browser/device/account/service is BLOCKED; a deliberate skip is NOT_RUN; never replace UI proof with API/build/unit proof.',
      'Browser/device/CLI/API automation does not establish business-owner UAT approval or actual model compliance.'],
    host_prompt: 'Read AGENTS.md, the end-user-acceptance workflow and harness-end-user-testing. Inspect approved requirements, app entry points, existing test configuration and actual host tools. '
      + 'Reuse established answers; ask only missing consequential environment/account/fixture decisions. Run affected user journeys through the real interface, assert visible and persisted outcomes, '
      + 'classify real/mocked dependencies and save redacted evidence using the existing verification report. Mark required missing access BLOCKED; report gaps before completion.',
    note: 'Surface hints are metadata only. Requirements choose actual journeys; no generic login/CRUD/browser suite is forced on every project.' };
}
