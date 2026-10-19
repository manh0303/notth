# Walkthrough 1 — Spring Boot API từ yêu cầu tới release

**Tình huống giả định:** thêm REST API tra cứu khách hàng theo tenant vào một **repo Spring Boot hiện có**, có PostgreSQL/Oracle tùy dự án, có thể thêm Kafka Outbox và Kubernetes **nếu thật sự có**. Không có source thực tế trong walkthrough này; endpoint, SQL và lệnh test là **đề xuất cần đối chiếu với project**.

**Modules:** Core + `java-spring` + `product`, bổ sung `devops,kubernetes` chỉ khi sở hữu pipeline/manifests. Xem [full SDLC](../end-to-end-workflow.md), [skills](../skill-matrix.md).

## 1. Setup & input

~~~bash
cd /path/to/existing-spring-service
aih resolve --adapters java-spring,kubernetes --capabilities product,devops
aih init --adapters java-spring,kubernetes --capabilities product,devops --dry-run
aih init --adapters java-spring,kubernetes --capabilities product,devops
aih check
aih skills
~~~

Trong service không triển khai trên Kubernetes thì **bỏ `kubernetes`**; không dùng `aih detect` thay cho việc xác nhận stack. `aih init` chỉ chép Harness, không scaffold Spring Boot.

Input: source revision, business owner, endpoint contract đang có, auth/tenant rules, schema migration policy, test/build tool, environment/approver. Ghi fact và unknown trong `.notth/local.md` hoặc change riêng, không thay Core managed files.

## 2. BA/PO → reviewed requirements

~~~bash
aih new-doc brd
aih new-doc prd
aih new-doc backlog
aih new-doc acceptance-criteria
aih new-doc traceability
aih skill harness-product-business-analysis
aih skill harness-product-prd-generation
aih skill harness-product-acceptance-criteria
~~~

AI IDE đọc nguồn được cấp quyền, đề xuất `FR-001`: tenant chỉ xem dữ liệu của mình; `AC-US-001-01`: tenant khác trả 403/404 tùy contract đã duyệt. **Chưa có xác nhận của PO thì đây vẫn là draft.** Reviewer dùng `harness-product-document-review` để phát hiện lỗ hổng; BA/PO là người xác nhận.

## 3. OpenSpec & technical review

~~~bash
aih new-change add-customer-lookup
aih skill harness-spec
~~~

Từ approved `FR/AC`, hoàn thiện `openspec/changes/add-customer-lookup/{proposal,design,tasks}.md` và delta specs. Nội dung cần có: API status/body, JWT/LDAP principal→tenant, authorization ở service/data access, error mapping, pagination, audit, DB indexes và backward compatibility. Không suy đoán dialect hoặc thông số tải.

Nếu OpenSpec CLI được cài **riêng** và version tương thích với project:

~~~bash
openspec validate add-customer-lookup --strict
~~~

Lệnh `new-change` **chỉ tạo draft**, không validate/approve spec. Gate: reviewer duyệt API/security/data boundaries.

## 4. Code theo adapter skills

~~~bash
aih skill harness-java-spring-spring-api
aih skill harness-tdd
aih skill harness-review
~~~

- `spring-api`: controller/service/repository theo pattern hiện có, tenant-scope server-side, DTO và HTTP contract.
- Schema, messaging và deployment choices theo approved SA/ADR và tooling thực tế. Khi chưa có quyết định quan trọng, SA đưa alternatives/trade-offs và hỏi owner trước implementation; không dùng recipe từ adapter.
- `harness-tdd`: negative auth test, missing resource, validation, successful request, regression. Không tạo implementation Kafka/DB nếu requirement không cần.

Lệnh verify ứng dụng **tùy repo** — dưới đây chỉ là ví dụ nếu có Maven wrapper:

~~~bash
# Kiểm tra wrapper và profile của repo trước khi chạy
./mvnw test
# ./mvnw verify  # nếu project cấu hình integration tests phù hợp
~~~

`aih verify --scope all` xuất checklist **không chạy Maven**. Nếu không chạy được integration test do thiếu DB, báo blocker; không ghi Pass.

## 5. PR → staging → production

~~~bash
aih verify --scope all
aih eval --scope all
aih check
~~~

Reviewer sử dụng `harness-review` + `security-reviewer`; PR gắn change ID, approved AC, diff, actual test logs, migration sequence, unrun checks, release/rollback plan. Không tự merge.

Nếu có pipeline/manifests: `harness-devops-ci-cd` → `harness-devops-docker` → `harness-kubernetes-workload-review`, `harness-kubernetes-helm-release` (nếu Helm) → `harness-devops-deployment` / `harness-kubernetes-rollout-safety`. Chỉ người/runtime được phép và có approval theo artifact/environment mới deploy; sau rollout kiểm chứng readiness + actual error/latency data.

## Expected handoff (mẫu, không phải kết quả đã chạy)

| Stage | Output cần bàn giao |
| --- | --- |
| Product | `docs/product/brd.md`, `prd.md`, `backlog.md`, `acceptance-criteria.md`, `traceability.md` approved |
| Spec | `openspec/changes/add-customer-lookup/` reviewed |
| Code | Endpoint + auth/contract tests + migration/event tests nếu có |
| Review | PR, CI/test evidence, risk list, human decision |
| Release | Image digest, environment approval, rollback steps, measured health |

**Sau khi PR đã merge:** upstream OpenSpec archive/sync nếu dự án sử dụng OpenSpec; không archive khi change vẫn chưa merge.
