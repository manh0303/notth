# Full SDLC — Idea → Product → UI/UX → Spec → Code → Test → PR → Release → Operate

Tài liệu này là **bản đồ điều phối** toàn bộ Core + Product + Architecture + Delivery + UI/UX + technology adapters + DevOps. Mỗi module vẫn có workflow riêng; chỉ **kích hoạt module đã cài và thật sự liên quan**, không bắt buộc dùng đủ tất cả cho một change. Bắt đầu với [Getting started](getting-started.md); xem [ma trận 64 skills](skill-matrix.md) và [role handoffs](agent-handoffs.md).

> **Ranh giới thực thi:** `aih` cài/gợi ý rules, templates, skills và check/eval **advisory**. AI host/IDE và các công cụ bên ngoài thực hiện phân tích, code, test và tương tác hệ thống trong phạm vi được cấp quyền. Không có `aih run` hay `aih deploy`; các hành động ghi Figma, production hoặc merge phải có phê duyệt.

## Monetization: tùy chọn business/marketing

Website miễn phí kiếm tiền quảng cáo có thể cài `--capabilities monetization` cùng Astro/React/Next.js. Sau khi xây các tool hữu ích và được phê duyệt về product, workflow của `monetization` xử lý SEO, publisher policy, consent, ad placement, hiệu quả quảng cáo và Page RPM; qua human approval trước mọi thay đổi ad/deploy. Đọc [Monetization](monetization.md) và [Astro + AdSense walkthrough](examples/astro-adsense-microtools.md). Không được giả định AdSense đã duyệt hoặc tự phát sinh traffic/clicks.

## Astro micro-tools: một stack tùy chọn

Website tiện ích nhỏ có thể chọn riêng adapter `astro` để theo hướng static-first và chỉ thêm React Islands, API/Cloudflare Workers hoặc tách Micro Frontend khi có nhu cầu thật. Product/UX vẫn là optional capabilities như các stack khác. Đọc [Astro walkthrough](examples/astro-micro-tools.md). Không cần backend hay Kubernetes cho tool xử lý hoàn toàn trong trình duyệt.

## Hai chế độ bắt đầu

- **Idea-driven:** developer trình bày ý tưởng → thảo luận và nghiên cứu có nguồn → PRD-lite hoặc BRD/PRD/SRS/use cases tùy độ phức tạp → human approval → OpenSpec.
- **Document-driven:** BA/PO đã có BRD/PRD/SRS/Confluence → lập source register với URL/revision/quyền, gap/traceability → chỉ tạo artifact còn thiếu → human approval → OpenSpec.

Cả hai chế độ đều dùng chung các stage phía dưới và không bắt buộc cài mọi capability. Xem [Documentation workflows](documentation-workflows.md).

## 0. Chọn module và xác định ownership

~~~bash
cd /path/to/existing-repository
aih resolve --adapters java-spring,react-nextjs,kubernetes --capabilities product,uiux,devops
aih init --adapters java-spring,react-nextjs,kubernetes --capabilities product,uiux,devops --dry-run
aih init --adapters java-spring,react-nextjs,kubernetes --capabilities product,uiux,devops
aih check
aih skills
~~~

Lệnh trên là **ví dụ một repo chứa BE/FE/manifests**; nếu frontend/backend thuộc nhiều repo, `aih init` được chạy tại từng repo và chỉ chọn module phù hợp. `aih resolve` không tự bổ sung module được recommend. Không dùng `--detect` như công cụ quét toàn monorepo.

**Project input:** `AGENTS.md`, `.notth/local.md`, source repo, scope và branch, quyền truy cập nguồn; tạo `change-id` và xác định nguồn của từng artifact.

## 1. Các stage, outputs và human gates

| Stage | Input và việc phải làm | Module / skills & roles | Output / điều kiện bàn giao |
| --- | --- | --- | --- |
| **1. Intake** | Ý tưởng, ticket, Confluence/PDF được phép đọc, version/source, scope | Product: `knowledge-analysis`, `business-analysis`; BA | Source register, FACT/INFERENCE/UNKNOWN, AS-IS/TO-BE, quyết định còn thiếu |
| **2. Business & Product** | Nguồn có traceability, mục tiêu, rules, NFR | Product: `brd-generation`, `prd-generation`, `user-stories`, `acceptance-criteria`, `backlog-prioritization`, `document-review`, `traceability`; PM/PO/requirements reviewer | PRD-lite hoặc BRD/PRD/SRS/UC khi cần, story IDs, AC, backlog; **Gate A: stakeholder duyệt**, không gắn nhãn Approved bởi AI |
| **3. UX/UI (nếu cần)** | Approved PRD/stories/AC; Figma file và quyền (nếu dùng) | UI/UX: `requirements-analysis` (chỉ khi cần), `user-flow`, `screen-planning`, `design-system`, `figma-design`, `design-review` | User flows, screen specs, component/tokens, Figma node IDs; **Gate B trước ghi Figma**, gate sau design review |
| **3a. Solution architecture (when material)** | Reviewed MVP/AC, existing decisions and constraints | Architecture skills/SA and reviewer | Source-linked context, NFR scenarios, module/data/contracts, ADRs and critical failure flows |
| **3b. Delivery planning (when material)** | Accepted scope/design, known estimates/dependencies | Delivery skills/Project Manager | Value slices, owners, risks, checkpoints and actual estimate authority |
| **4. Technical spec** | Approved requirements, API constraints, architecture, DB/event contracts | Core: `harness-spec`, planner; tech adapter phù hợp; OpenSpec | `openspec/changes/<change-id>/` (proposal, design, tasks, delta specs), measurable AC; **Gate C: duyệt thay đổi có ảnh hưởng** |
| **5. Implementation** | Change được duyệt, kiến trúc, repo, tests | Core: `harness-tdd`, `harness-debugging` khi sửa lỗi; Spring/React/Native/AI adapter theo stack; implementer | Minimal code diff, unit/integration/contract tests, migration plans, không thay đổi unrelated files |
| **6. Verify & code review** | Diff, specs, test logs thực chạy | Core: `harness-review`, `harness-ai-evaluation` nếu AI; test-engineer/security-reviewer; `aih verify/eval --scope all` (chỉ plan) | Evidence của test chạy thực tế, scope chưa test, security findings, trace requirement → test; **Gate D: human PR review** |
| **7. Delivery** | PR đã review/CI và artifact định danh | DevOps: `ci-cd`, `docker`, `deployment`, `infrastructure`; Kubernetes: workload/Helm/rollout skills | Build provenance, deploy/rollback runbook, staging evidence; **Gate E: approve artifact + production environment** |
| **Optional: Monetization** | Website/tool hoạt động hợp lệ, có traffic, quyền publisher | `monetization`: `adsense-integration`, `ad-placement-ux`, `seo-growth`, `analytics-revenue`, `publisher-compliance` | Plan ads.txt/consent, ads UX and revenue scenarios; **Gate: owner approves provider/production changes** |
| **8. Operations** | Authorized release, metrics/logs/traces và runbooks | DevOps: `observability`, `incident-response`; Kubernetes khi liên quan | SLO signals, incident timeline/postmortem, follow-up changes; không tự động thay đổi production |

**Nhớ:** bảng stage sử dụng tên kỹ năng viết gọn; sử dụng [skill-matrix.md](skill-matrix.md) để lấy **ID chính xác** và command `aih skill <name>`. Core và adapter xử lý phạm vi kỹ thuật cơ bản; capability `architecture` bổ sung phân tích giải pháp, NFR/ADR và review khi cần.

## 2. Luồng thực tế qua các handoff

1. **Discover**: BA/PM ghi `SRC-001` từ nguồn có phiên bản và kiểm tra quyền, tạo `BR-001`, `FR-001`, `NFR-001` trong BRD. Không lấy tài liệu ngoài phạm vi để làm prompt.
2. **Product gate**: PO xác nhận `US-001`, `AC-US-001-01` và trace tới `FR-001`; bản nháp chỉ chuyển sang Ready sau khi người có thẩm quyền chấp thuận.
3. **Design gate**: UI/UX ánh xạ `US-001` đến screen `SCR-001`, mô tả loading/error/empty/accessibility. Figma chỉ được ghi khi được phê duyệt đúng file/node; giữ node-ID để review.
4. **Spec gate**: planner và `harness-spec` tạo change (ví dụ `add-customer-api`) mang lại `FR-001`/`AC-US-001-01`, API semantics và test plan. Nếu dùng OpenSpec CLI riêng, chạy `openspec validate add-customer-api --strict` sau khi hoàn thiện TODO.
5. **Implementation & QA**: từng nhiệm vụ dùng `harness-tdd` và skill adapter phù hợp, bảo vệ tenancy/auth, test failures và DB migration; reviewer kiểm tra diff theo approved AC.
6. **PR**: branch riêng, PR có change ID, source/spec links, tests thực chạy, tests còn thiếu, plan rollback; không tự merge.
7. **Release**: DevOps dùng artifact immutable + explicit human production gate; người vận hành hoặc runtime đã cấp quyền mới có thể deploy. Sau đó thu thập latency/errors/traffic/saturation và cập nhật postmortem nếu cần.

**Traceability mẫu (đây là ví dụ, không phải dữ liệu thật):**

~~~text
SRC-001 (Confluence page, revision)
  → BR-001 / FR-001 → PRD-001
  → US-001 / AC-US-001-01
  → SCR-001 / Figma node (nếu có UI)
  → openspec/changes/add-customer-api/
  → source/tests/commit SHA
  → PR / CI evidence
  → artifact digest / approved release / observed SLO
~~~

Project tự sở hữu các file `docs/product/` và cập nhật `traceability.md`. Không có automation nào tự cập nhật trace ID giữa Figma, Jira, code và release.

## 3. Thực thi từ AI IDE theo stage (prompts mẫu)

**Business phase:**

> Đọc AGENTS.md, tài liệu nguồn được phép truy cập và capability Product đã cài. Sử dụng knowledge-analysis → BRD/PRD → stories/AC/traceability. Ghi nguồn và revision cho mọi fact, tách suy luận và quyết định. Tạo draft trong docs/product/ và yêu cầu BA/PO review, không tự approve.

**Design phase (tùy chọn):**

> Dùng các requirement ID đã được phê duyệt, lập UX flow và screen inventory với trạng thái lỗi/rỗng/loading. Chờ duyệt trước mọi thay đổi Figma; chỉ thao tác trên file được cấp quyền. Ghi screen-to-node mapping.

**Implement phase:**

> Dựa trên approved OpenSpec change, chọn chính xác Core/adapter skill cần dùng; thực hiện test-first slice nhỏ, không đụng file ngoài scope. Báo kết quả tests đã chạy, cập nhật requirement-to-test evidence, mở PR để review, không tự merge.

**Release phase:**

> Lập CI/CD, container, deployment và rollback plan với các signal có thể đo. Chỉ đề xuất thao tác production; không deploy/rollback nếu chưa có phê duyệt riêng cho artifact và environment.

## 4. Khi thay đổi không cần cả vòng đời

- **Bugfix nhỏ:** đọc [bugfix workflow](../core/workflows/bugfix.md), tái hiện lỗi → regression test → patch → PR. Không tự tạo BRD/PRD mới khi không cần.
- **Refactor/upgrade:** theo [upgrade workflow](../core/workflows/upgrade.md), inventory tương thích, baseline và rollback, giữ public contracts.
- **Backend-only:** bỏ UI/UX; dùng Product nếu cần xác nhận nghiệp vụ, Java/AI adapter khi implement.
- **Mobile-only:** dùng React Native adapter và UI/UX; không cài Kubernetes cho app di động chỉ vì cần release.
- **No code yet:** Product + UI/UX có thể dừng sau design gate, không tạo PR implementation giả.

## 5. Verify, eval và hồ sơ release
Web/mobile implementation and testing use [Frontend/mobile coding](frontend-mobile.md): select the
feature/screen skill plus relevant testing/boundary skills, preserve existing common APIs and hand off
actual browser/server or per-platform native evidence. Load only needed skill bodies for simple tasks.


~~~bash
aih verify --scope all
aih eval --scope all
aih check
~~~

`aih verify` **không chạy** lint/build/test; `aih eval` tạo report chưa chấm, không chạy model. Chạy các lệnh build/test từ repo bằng công cụ tương ứng, đính kèm evidence và run scenarios với mô hình thật nếu có nhu cầu. Chỉ khi đã ghi điểm có căn cứ mới dùng `aih eval --scope all --report /path/to/report.json` để tổng hợp.

**Checklist hoàn thành một change:** scope và approved AC rõ; diff có trace; tests thực chạy với kết quả chính xác; security/permissions đã review; CI xanh; PR được human quyết định; deployment (nếu có) có artifact/environment approval; OpenSpec archive/sync **chỉ sau khi các PR liên quan đã merge**, thông qua upstream CLI/human được quyền.

Xem [handoff contracts](agent-handoffs.md), [OpenSpec integration](openspec.md), [DevOps PR-to-production](../capabilities/devops/workflows/pr-to-production.md) và các [ví dụ theo stack](README.md#ví-dụ).

For new/material journeys use [Solution workflow](solution-workflow.md); for existing clear fixes keep
a compact source/impact note. Set up the host with [Coding tools](tool-setup/README.md).

Before assigning roles, apply [Agent configuration](agent-configuration.md) and Core routing workflow.
Use one session for simple work, hybrid only for independent authorized work with host support, and
carry short source/evidence handoffs. User preferences do not grant runtime permissions or model access.

## Continuous changes

After the first delivery, use [Continuous development](continuous-development.md) for each feature, bugfix, rule change or resume. Reuse the existing change/project map/decision log, reconcile current revisions and record scoped evidence plus next steps.

For user-facing verification, load Core harness-end-user-testing and follow
[End-user acceptance](end-user-testing.md). Exercise actual interface journeys; keep real/mocked
scope and unavailable tool/account/environment gaps explicit before review.
