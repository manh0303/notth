# Adaptive execution

### Requirement: Bounded evidence-driven recovery
Attempts MUST retain observable outcomes, bounded counts and justified safe retries.
#### Scenario: Repeated test failure
WHEN a failed action is repeated without justification or exceeds configured bounds
THEN saving the unsupported adaptive claim is rejected and recovery preserves existing work.

### Requirement: Current source verification
Completion MUST reference passing verification for the current declared code and acceptance scope.
#### Scenario: Code changes after passing verification
WHEN a baseline file changes or raw verification evidence is lost
THEN resume requires revalidation and completion cannot be claimed from stale evidence.
