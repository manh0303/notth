import { encode, HarnessError } from './files.js';

export const KIRO_HOOK = '.kiro/hooks/harness-session.json';
export function kiroPayload(files) {
  if (!Object.hasOwn(files, ".agents/skills/harness-start/SKILL.md")) throw new HarnessError("Kiro onboarding requires a source bundle containing harness-start; use a reviewed update");
  const result = {};
  for (const [name, data] of Object.entries(files).filter(([p]) => /^\.agents\/skills\/harness-[a-z0-9-]+\/SKILL\.md$/.test(p))) {
    const id = name.split('/')[2];
    const description = data.toString().match(/^description: (.+)$/m)?.[1] ?? 'Load canonical Harness instructions.';
    result['.kiro/skills/' + id + '/SKILL.md'] = Buffer.from('---\nname: ' + id + '\ndescription: ' + description + '\n---\n\nRead the complete canonical project file `' + name + '` before applying this skill. Follow its inputs, procedure, constraints and handoff.\n');
  }
  result[KIRO_HOOK] = encode({ version: 'v1', hooks: [{ name: 'Harness session context', trigger: 'SessionStart', action: { type: 'agent', prompt:
    'Read AGENTS.md and .notth/local.md. Read .notth/start.json and .notth/decisions.json if present. Inspect .notth/knowledge.json if present and check declared-source freshness using the installed Harness CLI (aih seed --check), or compare its hashes with available host tools. Reuse applicable confirmed decisions; superseded/proposed choices are not current approvals. Load other instructions only when applicable. If setup is missing/stale, mention /harness-start. Do not start an interview, rewrite configuration or execute a saved task solely because this hook ran.' } }] });
  return result;
}
