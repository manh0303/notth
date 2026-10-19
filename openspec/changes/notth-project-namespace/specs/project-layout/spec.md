# Project namespace

### Requirement: Branded project installation
New installs MUST place the managed snapshot and shared project configuration under .notth, with
canonical instructions/host bridges pointing there. The primary READMEs MUST present NOTTH without
the former product-name introduction. Technical skill IDs and ownership boundaries remain compatible.

#### Scenario: First installation
WHEN the owner installs NOTTH in a fresh project
THEN the installer creates .notth and the selected host bridge, and no legacy root or task backend.

### Requirement: Safe legacy migration
Update MUST preflight original hashes/config/paths before moving a legacy installation. It MUST keep
all user bytes and an original rollback copy, and refuse mixed namespaces, drift or unsafe paths.

#### Scenario: Legacy update preview
WHEN update --dry-run runs against a valid .harness consumer
THEN it returns the full .notth migration plan without target writes.

#### Scenario: Ordinary write failure
WHEN a migration target write fails
THEN prior namespace and host bytes are restored and a retry remains possible.

### Requirement: Backup compatibility and evidence preservation
New configuration backups MUST use the NOTTH kind/path; restored legacy archives MUST pass original
digest/path validation. Evidence/checkpoints MUST NOT be silently rehashed or rewritten.

#### Scenario: Old archive restore
WHEN a valid legacy configuration archive is restored
THEN its envelope paths map into .notth and the original configuration bytes are preserved.

### Requirement: Remove optional external task-backend behavior
New payload MUST NOT discover or recommend Beads. Local context/checkpoint functionality remains.

#### Scenario: Old context declares a retired backend
WHEN an older context sidecar is loaded and subsequently saved with a matching revision
THEN the declaration grants no behavior and is omitted from the new context revision.
