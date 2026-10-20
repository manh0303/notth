# Session recovery requirements

- A native session MUST recover its pinned task without being switched by another session's intake hint.
- A session without an unambiguous task MUST report needs-selection rather than choose an arbitrary change.
- Essential intent, decision status, source pointers, trace, evidence and unfinished work MUST be retained
  within the budget or the capsule write MUST fail without silent truncation.
- Recovery MUST rebuild from canonical state and identify changed/missing source/evidence/baseline bytes.
- Prepared/unknown external operations MUST require reconciliation; recovery MUST NOT execute them.
- Host hook installation MUST preserve unrelated settings and fail on modified owned handlers.
- Tests MUST distinguish protocol fixtures, executable probes, actual native recovery and automatic native compaction.
- No component SHALL claim to restore hidden reasoning, grant authorization or guarantee native model behavior.
