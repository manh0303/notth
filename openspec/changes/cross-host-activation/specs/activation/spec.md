# Host memory activation

### Requirement: Native event coverage with explicit limits
The reviewed installer MUST configure only the selected opt-in host bridge, preserve unrelated
settings, and reject disabled/modified registrations rather than silently declaring activation.

#### Scenario: Supported source result boundary
WHEN a configured host invokes its post-tool callback
THEN NOTTH requests source capture through the supported native context channel and reuses the
existing task/source workflow; it MUST NOT grant permission or claim the source has been saved.

#### Scenario: Observer-only or missing native capability
WHEN context injection, native identity or callback execution is unavailable
THEN the result explicitly reports limited/unverified activation and follows available scoped file
work without fake callbacks, inferred authority or fabricated saved memory.

### Requirement: Activation evidence is scoped and distinct from persistence
Activation diagnostics MUST check exact host/session/workspace/bundle and fresh prompt/pre/post
receipts, and MUST leave semantic persistence and live-host execution unverified.

#### Scenario: Receipts from a different or earlier execution
WHEN metadata belongs to another session/workspace/bundle, is old, or the post-tool event predates
the latest prompt
THEN activation is blocked/unverified even when registration exists.

#### Scenario: Successful local callback fixture
WHEN current local metadata matches all checks
THEN diagnostic reports observed-local only and requires actual task/source/checkpoint file inspection
before a persistence claim; it does not represent an authenticated host or end-to-end model PASS.
