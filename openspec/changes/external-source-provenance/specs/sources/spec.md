## ADDED Requirements

### Requirement: Provider-independent capture provenance
The system SHALL bind source identity, revision, scope, capture time and completeness to exact snapshot bytes.
#### Scenario: Partial external retrieval
- WHEN the host retrieves an issue but cannot read required comments or attachments
- THEN it records partial completeness and missing parts without claiming complete or approved requirements.
#### Scenario: Same bytes, changed provider revision
- WHEN a newer capture uses identical bytes but a new observed revision
- THEN both captures remain and the latest timestamp determines the active capture.

### Requirement: Evidence-bound external observations
The system SHALL record observations against an exact current capture with raw evidence hashes.
#### Scenario: External source changes or becomes unavailable
- WHEN comparable revisions/hashes differ or authorized access fails
- THEN status is changed or unavailable, not fresh based only on local file integrity.
#### Scenario: Matching observation
- WHEN comparable revision/hash matches
- THEN status is unchanged-at-check with timestamp, retaining partial/unknown completeness separately.
#### Scenario: Concurrent capture update
- WHEN a check targets a capture superseded before recording
- THEN the CLI rejects it and requires reading the current capture before retrying.

### Requirement: Safe source-manifest evolution
The system SHALL read legacy stores unchanged and preserve originals/history during metadata opt-in.
#### Scenario: Explicit metadata import
- WHEN valid metadata is supplied to a schema-1 store
- THEN manifest schema becomes 2 without losing existing files; older readers fail explicitly.
#### Scenario: Restore complete source store
- WHEN manifest, originals, normalized files and observation evidence are restored together
- THEN provenance and checks remain readable independently of the original host configuration.
