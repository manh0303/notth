import fs from 'node:fs';
import { safe, stat, digest, isObject, HarnessError } from './files.js';
import { runtimeIntegrity } from '../core/runtime/session.js';
import { SESSION_HOSTS, sessionHookChanges, sessionHookPath, activationEvents } from './session-hooks.js';

// Read-only diagnostics. Local receipts prove neither host identity nor semantic persistence.
export function activationReport(root, { host, sessionId, now = Date.now() } = {}) {
  if (!SESSION_HOSTS.includes(host)) throw new HarnessError('activation requires a supported --host');
  const lock = runtimeIntegrity(root);
  const result = { status: 'blocked', host, registration: sessionHookPath(root, host), configured: false,
    session_id: sessionId ?? null, activation: 'not-configured', events: [],
    persistence: 'unverified', live_host: 'unverified',
    instruction_delivery: host === 'windsurf' ? 'instructions-only' : ['cursor', 'copilot'].includes(host) ? 'session-and-post-tool' : 'native-context',
    note: 'Read-only local configuration/receipt checks; producer-declared events are not proof of native execution or saved task/source content.' };
  try {
    const delta = sessionHookChanges(root, host);
    if (Object.keys(delta).length) return { ...result, next_action: 'Host: enable/update the reviewed bridge with update --host ' + host + ' --session-hooks, then reload the host. Do not claim activation.' };
    result.configured = true;
  } catch {
    return { ...result, activation: 'configuration-blocked', next_action: 'Inspect disabled, modified or incompatible native hook settings; preserve user handlers and reconcile before enabling.' };
  }
  if (sessionId === undefined) return { ...result, activation: 'session-required', next_action: 'Host: check activation with its actual current native session ID. Never borrow a previous session or invent an ID.' };
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(sessionId)) throw new HarnessError('Invalid activation session identity');
  const key = digest(Buffer.from(host + '\0' + sessionId));
  const workspace = digest(Buffer.from(fs.realpathSync(root)));
  for (const event of activationEvents(host)) {
    const name = '.notth/sessions/' + key + '/latest-' + event + '.json', filename = safe(root, name), info = stat(filename);
    let row = null;
    if (info) {
      if (!info.isFile() || info.size > 65536) throw new HarnessError('Invalid activation receipt');
      try { row = JSON.parse(fs.readFileSync(filename, 'utf8')); } catch { throw new HarnessError('Invalid activation receipt'); }
    }
    const timestamp = Date.parse(row?.timestamp);
    const valid = isObject(row) && row.schema_version === 1 && row.host === host && row.session_id === sessionId
      && row.event === event && row.workspace === workspace && row.bundle_sha256 === lock.bundle_sha256
      && Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= 15 * 60 * 1000;
    result.events.push({ event, state: valid ? 'observed-local' : info ? 'stale-or-invalid' : 'not-observed', timestamp: valid ? row.timestamp : null });
  }
  const events = result.events;
  const sameTurn = events.every(e => e.state === 'observed-local')
    && events.slice(1).every(e => Date.parse(e.timestamp) >= Date.parse(events[0].timestamp));
  result.activation = sameTurn ? 'observed-local' : 'unverified';
  if (sameTurn && host !== 'windsurf') result.status = 'ok';
  result.next_action = result.status === 'ok'
    ? 'Host: inspect actual task/source/checkpoint files before claiming persistence. Hook events alone do not prove saved memory.'
    : host === 'windsurf' && sameTurn
      ? 'Observer hooks ran locally; Cascade stdout is not a documented agent context channel. Follow the installed capture workflow and report instruction-only enforcement.'
      : 'Host: verify hooks are enabled/trusted and observe prompt/pre-tool/post-tool events in this current session. Missing/stale evidence is not successful activation.';
  return result;
}
