// Exact unprefixed Core exception; do not claim arbitrary project skills as managed.
export const distributedSkillName = name => typeof name === 'string'
  && /^(?:harness-[a-z0-9-]+|debug-evidence)$/.test(name);
export const canonicalSkillEntry = name => {
  const match = /^\.agents\/skills\/([^/]+)\/SKILL\.md$/.exec(name);
  return Boolean(match && distributedSkillName(match[1]));
};
export const debugEvidenceAsset = name => /^(?:\.agents|\.claude|\.kiro)\/skills\/debug-evidence\//.test(name);
