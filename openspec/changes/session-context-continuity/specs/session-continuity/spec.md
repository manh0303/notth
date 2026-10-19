# Session continuity

### Requirement: Source-linked intent and conditional persistence
Each existing change MAY carry optional bounded context linking original problem/outcome to canonical
source revisions/locators and typed dependency links. Progress and decisions MUST retain existing owners.

#### Scenario: Two writers update one context
WHEN two sessions prepare the same observed digest/revision
THEN only a matching conditional replacement succeeds, the loser reconciles and prior bytes are retained.

### Requirement: Source changes invalidate dependent context
CLI MUST identify changed/missing local sources and superseded imported snapshots, propagate affected
links, and expose the result in task context and recovery. Host MUST reconcile meaning before dependent work.

#### Scenario: New import preserves old bytes
WHEN a newer imported revision becomes current while the older referenced snapshot remains intact
THEN the older pointer is superseded and recovery requires revalidation.

### Requirement: Automatic host housekeeping and session scope
Entry/review instructions MUST route through automatic continuity without user-maintained memory.
The current request MUST pin task identity; shared saved intake MUST remain a hint across sessions.

#### Scenario: Parallel session saves another task
WHEN session B saves beta while session A continues alpha
THEN session A reads explicit alpha context and does not switch scope from shared intake.

### Requirement: Optional Beads coordination boundary
Beads MAY own task status/dependencies/claiming through actual host tools. NOTTH MUST NOT install it
or execute it in the installer; marker discovery MUST remain unverified until host inspection.

#### Scenario: Mapped backend is unavailable
WHEN a task mapped to Beads cannot reach its configured backend
THEN coordinated writes are blocked, its mapping is preserved, and no silent local writable fallback occurs.
