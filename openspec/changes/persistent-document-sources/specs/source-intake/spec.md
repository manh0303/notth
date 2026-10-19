## ADDED Requirements

### Requirement: Durable source preservation
The system SHALL retain exact originals, versioned conversions and source hashes as project data.
#### Scenario: Repeated and changed source inputs
- WHEN an input is imported repeatedly under the same ID
- THEN equal bytes create no duplicate and changed bytes retain prior revisions.
#### Scenario: Reinstall or restore
- WHEN init/update runs or the complete source folder is copied to a fresh project
- THEN sources remain readable and their hashes can be checked independently of installation state.

### Requirement: Honest conversion and approval boundaries
The system SHALL distinguish saved originals, available conversions and business approval.
#### Scenario: Binary input without converter
- WHEN a PDF or other non-text format is imported without normalized Markdown
- THEN the original is preserved and conversion is pending, with no fabricated Markdown or approval.
#### Scenario: Host conversion
- WHEN the host supplies Markdown for the exact original bytes
- THEN the new conversion is linked by hash and marked available-unreviewed.

### Requirement: Fail safely on conflicting storage
The system SHALL reject malformed manifests, unsafe paths and modified/missing indexed files.
#### Scenario: Source drift or write failure
- WHEN indexed file bytes differ or ordinary writes fail
- THEN the import fails without replacing conflicting data and rolls back applied writes.
