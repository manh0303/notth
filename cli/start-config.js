import { readConfig } from './project-config.js';
import { isObject, SLUG, HarnessError, safe, stat } from './files.js';
export const START_CONFIG = '.notth/start.json';
export const GOALS = ['idea', 'docs', 'change', 'resume'];
export function loadStartConfig(root) {
  const value = readConfig(root, START_CONFIG);
  if (value === null) { if (stat(safe(root, START_CONFIG))) throw new HarnessError('Invalid start.json schema'); return null; }
  const text = s => typeof s === 'string' && s.trim().length > 0 && s.length <= 4096 && !/[\x00-\x1f\x7f]/.test(s);
  if (!isObject(value) || Object.keys(value).some(k => !['schema_version', 'goal', 'task', 'change_id'].includes(k))
      || value.schema_version !== 1 || !GOALS.includes(value.goal) || !text(value.task)
      || (value.change_id !== undefined && (!['change', 'resume'].includes(value.goal) || !SLUG.test(value.change_id) || value.change_id === 'archive'))
      || (value.goal === 'resume' && value.change_id === undefined)) {
    throw new HarnessError('Invalid start.json schema/goal/task/change_id');
  }
  return value;
}
