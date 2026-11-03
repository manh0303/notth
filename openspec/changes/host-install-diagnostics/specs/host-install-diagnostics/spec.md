## ADDED Requirements

### Requirement: Report host activation evidence without overstating it

The CLI SHALL provide an opt-in readable doctor report that distinguishes local registration and
receipts from unverified live-host execution and persistence.

#### Scenario: No native session evidence

- **WHEN** a user runs doctor in human format for a selected host without a native session ID
- **THEN** the report states the local registration state and leaves live-host execution and saved data unverified.

#### Scenario: Default machine-readable output

- **WHEN** a user runs doctor without a format option
- **THEN** the existing JSON output and exit code semantics are retained.
