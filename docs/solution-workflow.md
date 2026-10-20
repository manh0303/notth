# BA → PO → SA → PM → Dev/QA

Product contains BA/PO analysis and documents; optional Architecture adds Solution Architect context,
NFRs/ADRs/design/review; optional Delivery adds Project Manager planning/risks/scope changes.
Roles are instructions for a host and can be performed sequentially. User/stakeholder decisions keep
actual authority. No new workflow engine is installed; OpenSpec owns change proposal/design/tasks/specs.

## Choose proportional depth
| Work | Minimum sufficient context | Optional deeper outputs |
| --- | --- | --- |
| Small clear fix | Existing source/decisions, affected boundary/reuse and regression note | Only new consequential decisions |
| New small product | Actor/problem, usable MVP journey/AC, minimum NFR, minimal solution and slices | Short overview and a significant ADR |
| Material/enterprise change | Source versions, MVP/requirements, module/data/contracts, NFR/failure impact | Project map, ADRs, risk register, rollout plan |

```bash
aih init --adapters java-spring --capabilities product,architecture,delivery
aih setup
aih skills
aih new-doc mvp
aih new-doc overview --capability architecture
aih new-doc nfr --capability architecture
aih new-doc delivery-plan --capability delivery
aih new-change customer-search
aih verify --scope all
aih eval --scope all
```

Blank templates only. Use existing approved requirements documents or Confluence pages instead of re-creating them.
For an existing Harness install, edit selected capabilities in project.json and use reviewed update
--dry-run/update/check. `resolve` validates and warns; it does not install soft recommendations.

## Responsibilities and handoff
| Role / module | Owns | Receives / passes |
| --- | --- | --- |
| BA / Product | Problem, business rules, source authority and requirement gaps | Idea/docs → versioned FR/US/AC/NFR and contradictions |
| PO / Product | MVP value, in/out scope, acceptance and priorities | BA → reviewed journey, outcomes and actual scope decisions |
| SA / Architecture | Context, quality scenarios, solution trade-offs, public boundaries | Scope → NFR/ADR/contracts/failure flows and verification |
| PM / Delivery | Sequencing, dependencies, estimates/risks and status | Accepted scope/design → value slices, owners, blockers and checkpoints |
| Dev/QA / Core + adapters | Implementation and actual tests | OpenSpec/decisions → minimal code, test evidence and findings |
| DevOps / optional capability | Operational release/recovery detail | Agreed constraints → reviewed rollout/rollback/telemetry |

Carry source revision, requirement/AC/NFR/ADR IDs, output paths, decisions/status, unresolved questions,
actual verification and next owner. Scope changes return to PO; technical conflicts to SA; delivery
risks to PM. UX and implementation feedback can revise the plan; this is not a one-way document conveyor.

## MVP and architecture judgment
MVP must let a target actor complete a useful journey. A customer-search MVP can defer bulk import
but must include resource authorization, data integrity and agreed duplicate behavior.
Compare architectures on actual constraints; styles may combine. Ports and Adapters concerns boundaries;
Factory concerns object construction. Add Strategy/Adapter/State only for concrete variation or state
requirements. Direct code is a valid minimal choice. Do not promise enterprise scale from a diagram.

Record important decisions with evidence and owner status, not inferred approval. NFR targets/load,
cost and delivery estimates remain unknown when evidence is absent. Keep the living project-map
linked to actual source; refresh touched entries when code/requirements change instead of loading all docs.

## Templates and reading paths
- [Product handoff](../capabilities/product/workflows/product-to-solution.md): MVP/outcomes, existing BA skills.
- [Architecture entry](../capabilities/architecture/workflows/discovery-to-design.md), [change review](../capabilities/architecture/workflows/change-review.md).
- [Delivery planning](../capabilities/delivery/workflows/planning.md), [execution/change](../capabilities/delivery/workflows/execution-change.md).
- [Core framing](../core/workflows/solution-framing.md), [skill matrix](skill-matrix.md), [agent handoffs](agent-handoffs.md).
- [Research/provenance](research/solution-workflow-sources.md), [coding tool setup](tool-setup/README.md).

`aih new-doc adr --capability architecture` produces one draft; move the populated file to a stable
project-owned `docs/architecture/decisions/adr-NNN.md` path and link it before making the next ADR.
`aih new-doc delivery-plan` keeps its historical Product path; explicitly select Delivery for the richer
plan. Do not duplicate/migrate an accepted plan automatically.
