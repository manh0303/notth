# Golden reference: synthetic duplicate-request bug

This is an illustrative NOT_RUN reference, not a real customer ticket, run or sanitized production
capture. It contains no pre-generated successful output. Copy structure only; derive assertions,
authority and runner from the target project.

Example pack: `<configured-evidence-output>/<date>/debug-example-duplicate/`.

| Path inside pack | Purpose |
| --- | --- |
| README.md | Bug, source/AC links, supported cause, cases and exact code/deployed build identities |
| runner file or existing runner reference | Project's authorized test mechanism; no fixed language |
| runs/<baseline-run>/run_output.txt | Real failing baseline output, created only after execution |
| runs/<after-run>/run_output.txt | Real post-fix output, created only after execution |
| runs/<after-run>/stderr.txt | Diagnostic errors if emitted |
| runs/<probe-run>/probe-output.json | Optional redacted observation attached to its scenario |

Use the pack template at `assets/evidence-pack.md` relative to this skill's root. Suggested cases:

| ID | Expected assertion | Status in this reference |
| --- | --- | --- |
| TC-1 | Repeated same request does not create a second business record | NOT_RUN |
| TC-2 | Independent request still succeeds | NOT_RUN |
| TC-3 | Concurrent same-key calls preserve the agreed unique-record invariant | NOT_RUN |
| TC-4 | A denied actor cannot mutate the record | NOT_RUN |

Do not infer the agreed API status code, database technology or duplicate-prevention design from
this sample. A real run checks both response contract and authorized observable final state.
When baseline access is unavailable record the reason; do not synthesize a failure log. Mark the
scope real/mocked and reconcile cleanup before retrying mutations. Use distinct unique run folders,
including for interrupted attempts; never replace the original failure with a successful rerun.
