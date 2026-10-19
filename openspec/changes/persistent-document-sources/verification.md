# Verification

Executed on Linux, Node v24.19.0, source base fd5786ab388ab5cacd637896dffc8495f7fe0add.

- `npm test`: PASS, 331 tests, zero failures/skips. Includes 10 source regressions.
- `npm run validate`: PASS, no structural errors, 6 adapters / 8 capabilities.
- `npm run test:package`: PASS, 409 package files. Real packed/installed CLI imports a source
  and lists it; required CLI/workflow/guide assets are present.
- `git diff --check`: PASS.

Source regressions cover duplicate/hash revision handling, binary pending and supplied conversions,
Unicode/space filenames, absolute external inputs, dry-run, edited/missing originals/conversions,
unsafe manifest paths/types, symlinks, bounds, invalid UTF-8, ordinary write rollback and CLI options.
Recovery tests preserve exact manifest bytes through init/update and deletion/recreation of .harness;
a complete source-folder copy validates in a freshly installed project.

Manual source review traced Core start/spec/artifact workflow → installed intake workflow → CLI
storage → review/evidence contract. Shared package allowlist includes new files; harness.yaml registry
and distribution versions need no change. No dependencies, network or shell added to CLI.

NOT_RUN: real model/host intake compliance, PDF/DOCX/XLSX/OCR conversion quality, Windows/macOS and
Node 22 execution in this session, remote backup recovery, upstream OpenSpec CLI validation. These
are not inferred from passing local structural/CLI tests. Binary conversion remains host-provided;
configuration archive remains config-only. Human review/merge and release are still separate.
