// Presentation only: never execute tasks or infer remote state.
export function renderResult(command, result, { host } = {}) {
  const lines = [`Notth ${result.version ?? ''} — ${command}: ${result.status ?? 'unknown'}`.trim()];
  if (['init', 'update'].includes(command)) {
    lines.push(`Files changed: ${result.changes?.length ?? 0}`);
    if (result.onboarding) {
      lines.push(`Host: ${host ?? 'your AI tool'}`,
        `Adapters: ${result.onboarding.adapters.join(', ') || 'Core only'}`,
        `Capabilities: ${result.onboarding.capabilities.join(', ') || 'none'}`,
        'Installed workflows; project documents are created only when your task needs them.',
        `Next: ${result.onboarding.prompt}`);
      if (result.activation) lines.push(
        `Session hooks: ${result.activation.configured ? 'configured locally' : 'not confirmed'}`,
        `Live host and saved memory: unverified`,
        `Next: ${result.activation.next_action ?? 'Review host compatibility and use the instruction fallback.'}`);
    } else lines.push(...(result.next_steps ?? []));
  } else if (command === 'doctor') {
    lines.push(`Diagnostic result: ${result.status}`,
      `Installation problems: ${result.problems?.length ?? 'unknown'}`,
      `Environment problems: ${result.environment?.problems?.length ?? 'unknown'}`,
      `Configured host: ${host ?? 'not specified; use --host to inspect a host bridge'}`);
    if (result.activation) lines.push(
      `Session hook registration: ${result.activation.activation}`,
      `Local event evidence: ${result.activation.events?.map(e => `${e.event}=${e.state}`).join(', ') || 'not observed'}`,
      `Live host execution: ${result.activation.live_host ?? 'unverified'}`,
      `Saved task and sources: ${result.activation.persistence ?? 'unverified'}`,
      `Next: ${result.activation.next_action ?? 'Review host compatibility and use the instruction fallback.'}`);
    lines.push(...(result.problems ?? []).map(problem => `Problem: ${problem}`));
    lines.push(...(result.environment?.problems ?? []).map(problem => `Environment problem: ${typeof problem === 'string' ? problem : JSON.stringify(problem)}`));
  } else if (command === 'status') {
    lines.push(`Task: ${result.task ?? 'none selected'}`, `Phase: ${result.progress.phase}`,
      `Declared completed tasks: ${result.tasks?.checked ?? 0} (not verification evidence)`,
      `Blockers: ${result.progress.blockers.join('; ') || 'none recorded'}`,
      `Next owner: ${result.progress.next_owner}`, `Next: ${result.next_action}`,
      'Merge / deployment / live verification: unknown until checked by the host.');
  } else if (command === 'changes') {
    lines.push(...result.changes.map(c => `${c.active ? '*' : '-'} ${c.id}: ${c.tasks.unchecked} pending declarations`));
    if (!result.changes.length) lines.push('No local changes. Describe your task in AI chat.');
    if (result.truncated) lines.push('More changes exist; listing is truncated.');
  } else if (command === 'start') {
    lines.push(`Task: ${result.task ?? result.saved?.task ?? 'describe your task in AI chat'}`,
      `Next: ${result.next_action ?? result.host_prompt ?? result.note ?? 'Read harness-start in your AI chat.'}`);
  }
  for (const warning of result.warnings ?? []) lines.push(`Warning: ${typeof warning === 'string' ? warning : JSON.stringify(warning)}`);
  if (result.backup) lines.push(`Backup: ${result.backup}`);
  if (result.note) lines.push(result.note);
  return lines.join('\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '');
}
