# Project experience and live evaluation

### Requirement: Governed evidence-backed experience
Reusable experience MUST retain applicability, current evidence/source revision and project ownership.
#### Scenario: Related task with stale architecture
WHEN a stored solution's source, capture or verification changes
THEN retrieval marks it stale and the host must reconcile/verify before reuse.

### Requirement: Honest matched evaluation
Live behavior MUST NOT be inferred from offline schema/CLI or synthetic report tests.
#### Scenario: Host unavailable
WHEN an A–G scenario cannot be run on the actual host
THEN results remain NOT_RUN/BLOCKED with reasons and no fabricated metrics.

### Requirement: Safe experience lifecycle
Rejecting/superseding MUST preserve conditional history without changing permissions or global skills.
#### Scenario: A replacement solution is verified
WHEN the owner/host records a reason and a current verified replacement
THEN old experience is superseded and excluded from default memory reuse.
