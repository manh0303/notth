# Unified memory and portability

### Requirement: Derived canonical memory
Retrieval MUST return bounded, source-linked references without a competing authoritative store.
#### Scenario: Selective fresh-session retrieval
WHEN a host requests scoped memory with a byte budget
THEN it receives stable typed references, freshness and omitted-count metadata within that record budget.

### Requirement: Honest cross-host handoff
A handoff MUST preserve canonical intent/progress/evidence and require actual host reconciliation.
#### Scenario: Changed baseline or uncertain side effect
WHEN a synchronized project has changed sources or unknown operations
THEN the handoff requires reconciliation and MUST NOT claim permission or automatic host execution.
