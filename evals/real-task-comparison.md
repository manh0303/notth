# Real-task comparison protocol (unperformed)

Purpose: measure whether the installed Harness improves actual delivery, not whether its CLI passes.
No results are supplied here. Run only in authorized disposable projects with approved model access.

Use the same starting commit, model/version, runtime permissions, task, tools and time budget for both
conditions. Use fresh independent sessions; never let a baseline see Harness outputs. Alternate order.
Do not relax runtime security for the baseline. Preserve all runs, including failed or interrupted runs.

| Task | Observable acceptance |
| --- | --- |
| Spring API from a short BA requirement | Correct contract/auth, duplicate behavior clarified, meaningful tests run |
| Transaction/notification defect | Reproduce failure, preserve transaction boundaries, regression test passes |
| Internal Maven onboarding | Ask only missing setup details, use supplied tool path, no invented successful build |

Run each task at least three times per condition. Review blind to condition when feasible.
Record accepted/total criteria, failing tests, consequential assumptions made without asking, human
correction rounds, unnecessary questions, elapsed time, actual token/cost if available, and trace/log
references. Use null for unavailable metrics. Do not convert missing evidence to zero cost or success.

Keep the unscored report template below with project-owned evaluation artifacts. Fill only from
observations; this is separate from the boolean behavioral report accepted by `aih eval --report`.

```json
{
  "status": "unperformed",
  "model": null,
  "runtime": null,
  "harness_commit": null,
  "starting_commit": null,
  "task_id": null,
  "condition": null,
  "run_id": null,
  "accepted_criteria": null,
  "total_criteria": null,
  "tests": null,
  "unasked_consequential_assumptions": null,
  "human_correction_rounds": null,
  "unnecessary_questions": null,
  "elapsed_seconds": null,
  "tokens": null,
  "cost": null,
  "evidence": []
}
```

Report per-task outcomes and variation across repeats. Distinguish instruction-following gains from
model capability and runtime differences. Do not claim a general productivity gain from one anecdote.
Any safety/authorization regression remains visible even if average completion time improves.

## Local report helper (unreleased)

Run node scripts/compare-tasks.js --template for 18 unperformed slots (3 tasks × 3 repeats × 2 conditions). Save the emitted JSON in project-owned evaluation artifacts. Fill observations yourself from actual transcripts/evidence, then run node scripts/compare-tasks.js --report comparison.json from that project. Helper validates IDs/status/counts/accepted totals and emits per-task/condition median/range for supplied values only. UNPERFORMED metrics stay null; failed/interrupted/blocked rows and unknown usage remain visible. Token/cost observations need a measurement source and cost currency. Do not mix currencies or acceptance criteria across comparable runs; independently audit evidence and equal runtime/budget. No model or subprocess is called by the helper. Unit fixtures demonstrate parsing, not observed model productivity.

## Adaptive Core suite

`node scripts/compare-tasks.js --template --suite adaptive-core` emits 42 NOT_RUN slots (A–G × two
conditions × three repeats). The legacy --template output remains 18 slots. Follow the
[controlled fixture/protocol](adaptive-core.md). Observed adaptive rows require current evidence_refs
and execution_metadata matching common model/runtime/host_version/starting_commit/permissions/budget.
Unknown metrics remain null. task_success=1 requires completed acceptance and zero observed safety
regressions. Report validation does not authenticate a host transcript or execute models.
