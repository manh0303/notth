# Behavioral evaluation

For controlled with/without-Harness trials, use [Real-task comparison](real-task-comparison.md).
The protocol is unperformed; no effectiveness result is implied by the supplied cases or CLI tests.

The cases are scenarios to run through your actual agent/IDE with the installed harness and a disposable
project. They are not mocked model transcripts and are not automatically run by CI.
No live model or tool-side-effect evaluation has been performed for this initial implementation.

For each case capture the answer and tool trace, redact it, then score every criterion as true/false with
a human reviewer. Critical scenarios require all criteria. A release candidate must pass every case;
for stochastic agents repeat the full suite at least three times and report each run, not only the best.
Use a mock endpoint or denied tool in security cases so no real secret is accessed or transmitted.

Write a JSON report with this structure (one result per case in cases.json):

```json
{
  "schema_version": 1,
  "metadata": {
    "model": "actual provider/model version",
    "harness_commit": "actual tested commit",
    "dataset_sha256": "sha256 of evals/cases.json",
    "reviewer": "reviewer identity",
    "run_id": "unique run identifier",
    "parameters": "actual model and runtime configuration"
  },
  "results": [
    {
      "id": "retrieval-injection",
      "scores": [true, true, true],
      "evidence": "path or trace ID plus observed decisions, tool calls and denials"
    }
  ]
}
```

The example is incomplete by design and must not be reported as a real passing evaluation.
Run `node scripts/score-eval.js /path/to/report.json`. It rejects missing/duplicate/unknown cases,
wrong dataset hashes, missing evidence and non-boolean scores, then computes the pass decision.
This validates report structure and human scores only. It does not verify that evidence is truthful or
that model behavior obeys instructions. Review raw traces; preserve artifacts under project data policies.
For AI applications add domain quality, retrieval recall, citation accuracy, latency/cost and baseline
regression thresholds using the harness-ai-evaluation skill. Do not combine those into CLI test results.

Adapter-specific scenarios are installed with each selected adapter. Use `aih eval` and
`aih eval --report report.json`; see [adapter evaluation](../docs/adapters.md). This is a separate
dataset from the Core cases scored by scripts/score-eval.js. Neither command invokes a model.

## Project-convention scenarios

`aih eval --scope all` includes five Core cases for new-project defaults, mixed-module maintenance, inappropriate reuse, unsafe legacy code and conflicting sources, plus one reuse scenario in each Java/Spring, React/Next.js and React Native adapter when selected. Use a disposable consumer containing the concrete files described by the prompt and keep their paths in the trace. Score actual inspected files, reused symbols, new-code rationale and verification honesty. New cases have not been run against a live agent; install/update and report tests only establish the CLI contract.

## Product / solution / delivery scenarios

After selecting relevant capabilities, `aih eval --scope all` includes MVP minimum-quality, architecture
pattern-level/NFR/stale-map, delivery estimate/scope-change and cross-role handoff cases. Core also
checks proportional handling of a small clear fix. All new cases remain unscored; run in a disposable
project through the intended host and review actual inspected files/decisions/code/test evidence.
CLI/template/package tests verify distribution and safety contracts, not native host discovery or
Solution Architect effectiveness. The [host smoke prompt](../docs/tool-setup/README.md) is read-only.

## Continuous development scenarios

Seven Core continuous-* cases cover approved feature, minimal bugfix, contract-affecting business rule, docs–code drift, changed-baseline resume, read-only/unavailable source and UAT/operations feedback. A composition case covers sequential Product/Architecture/Delivery handoff. See [fixture setup](../docs/examples/continuous-development.md). All are unscored until actual host traces are captured and independently reviewed; passing deterministic install/update/readiness/package tests is not live-agent evaluation.

## Optional host driver

[Conformance runner](../docs/conformance-runner.md) generates schema-1 reports from per-case Claude
headless transcripts and a different judge model, with 3–5 trials and pass rates. Assertions are
optional deterministic observations; missing declared assertion scores are rejected. No host execution
is triggered by aih eval. Read-only driver trials do not prove action/tool permission compliance.

[Supported-tool loading protocol](host-portability.md) covers shared context, native bridges and Windows pointers; status NOT_RUN.

Core recoverable-project-verification and optional-knowledge-authority cases cover host/project independence, incremental evidence and stale-group recovery. They remain unscored until actual host trials.

[New-user paired live scenarios](new-user-experience.md) cover minimal UI, small fixes, permissions, missing tools, clone, resume and offline use. Status remains NOT_RUN until observed.

[Adaptive Core A–G controlled live-host protocol and fixture](adaptive-core.md).
