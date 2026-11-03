## ADDED Requirements

### Requirement: Proportional portable debug evidence
Daily bugfix workflow SHALL select debug-evidence for requested packs or material interface/data
fixes, reusing actual testing and verification contracts; small isolated fixes MAY retain adequate
existing regression evidence with an explicit rationale.

#### Scenario: Real API bug pack
- **WHEN** an authorized API fix needs baseline and after-fix evidence
- **THEN** the agent uses the configured artifact route and project runner, retains unique attempt
  logs, tested code/deployed build, cause/assertion links and actual outcomes without inventing PASS.

#### Scenario: Missing execution or uncertain seed
- **WHEN** baseline access is unavailable or a terminal disconnects during a mutating request
- **THEN** the agent marks the gap BLOCKED/NOT_RUN, preserves partial evidence and reconciles side
  effects before any bounded retry; a copied summary cannot satisfy verification.

### Requirement: Exact skill distribution and ownership
Installer SHALL support debug-evidence and all its resources without adopting arbitrary unprefixed
project skills, overwriting custom content or changing default names of existing skills.

#### Scenario: Selected host bridge
- **WHEN** a user installs or updates with the Claude/Kiro bridge
- **THEN** the bridge exposes debug-evidence and directs the host to canonical complete instructions;
  catalog and readSkill expose the same exact ID and managed drift checks include its resources.

### Requirement: Optional policy preserves project configuration
Environment schema 1 SHALL accept absent/null bug_evidence or a validated portable policy referencing
an existing evidence output; paths, credentials and runner execution SHALL remain outside Core defaults.

#### Scenario: Legacy environment and custom policy update
- **WHEN** an existing project updates to the new bundle
- **THEN** old environment files remain accepted and existing project-owned policy bytes are retained.
