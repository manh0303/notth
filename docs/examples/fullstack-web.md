# Walkthrough 2 — Full-stack Spring Boot + Next.js + Product + Figma

**Tình huống giả định:** xây hành trình tạo ticket (backend Spring Boot + frontend Next.js) trong **một repo chứa cả hai module**, bắt đầu từ product idea hoặc Confluence. Đây là runbook minh họa; không có ứng dụng nào được tạo tự động.

## 1. Chọn modules cho repo

~~~bash
cd /path/to/existing-fullstack-repository
aih resolve --adapters java-spring,react-nextjs --capabilities product,uiux,devops
aih init --adapters java-spring,react-nextjs --capabilities product,uiux,devops --dry-run
aih init --adapters java-spring,react-nextjs --capabilities product,uiux,devops
aih check
aih skills
~~~

Chỉ thêm `kubernetes` nếu repo cũng sở hữu manifest/chart. Nếu backend/frontend nằm **hai Git repository** độc lập, cài `aih` riêng từng repo theo stack tương ứng, liên kết hai PR bằng cùng change ID; không cố ép cả hai vào một Git root. `aih detect` đọc package metadata ở root; với Maven, chỉ theo module khai báo tối đa hai tầng (64 POMs). Không tự quét tùy ý `apps/web` / `services/api`.

## 2. Product discovery và gate

~~~bash
aih new-doc brd
aih new-doc prd
aih new-doc backlog
aih new-doc acceptance-criteria
aih new-doc traceability
aih skill harness-product-knowledge-analysis
aih skill harness-product-brd-generation
aih skill harness-product-user-stories
aih skill harness-product-document-review
~~~

BA xác nhận nguồn/timestamps; PM chốt mục tiêu, PO duyệt `US-001`/`AC-US-001-01`; requirements reviewer kiểm tra truy vết. Confluence là **nguồn dữ liệu**, không cấp quyền tự động. Các draft chưa phê duyệt không được tự đánh dấu Approved.

## 3. UI/UX & design gate

~~~bash
aih skill harness-uiux-user-flow
aih skill harness-uiux-screen-planning
aih skill harness-uiux-design-system
aih skill harness-uiux-figma-design
aih skill harness-uiux-design-review
~~~

Từ approved PRD/AC, lập screen inventory (create, success, validation error, permission denial, loading, empty), responsive/keyboard/accessibility states. Nếu UI/UX cần trích nguồn riêng, dùng `harness-uiux-requirements-analysis` nhưng **không tạo lại ID cạnh tranh với Product**.

Figma MCP phải được cấu hình ngoài `aih`; **Gate A:** người phụ trách duyệt flow/screen trước quyền ghi Figma; **Gate B:** duyệt review findings và Figma nodes trước implementation. Không có kết nối Figma thì bàn giao screen specs bằng Markdown, không khẳng định đã tạo frames.

## 4. Spec → implementation

~~~bash
aih new-change add-ticket-creation
aih skill harness-spec
aih skill harness-tdd
aih skill harness-java-spring-spring-api
aih skill harness-react-nextjs-feature-delivery
aih skill harness-react-nextjs-accessible-ui
aih skill harness-react-nextjs-server-boundaries
aih skill harness-react-nextjs-behavior-testing
~~~

Spec phải chứa contract `POST /...` thực tế đã review, authorization, error envelope, loading/empty/errors, client/server boundaries, cache invalidation và contract tests. Implement thành vertical slice API + UI cùng acceptance IDs. Đối với giao diện frontend, kiểm tra SSR/client boundary và tránh đưa credentials ra browser.
Chỉ đọc skill body cần cho task; reuse client/query/FormField hiện có. Skills delivery/testing bao phủ
route/form/API/state và AC-linked component/browser evidence; không ép plain React dùng Next.js.

Ví dụ kiểm tra **chỉ nếu repo có tương ứng**:

~~~bash
# Backend, chạy từ module sở hữu Maven wrapper:
./mvnw test
# Frontend, chạy từ module Next.js có script:
npm test
npm run build
~~~

Không coi dòng lệnh minh họa là bằng chứng đã chạy. Với multi-repo, mỗi repo có CI, owner và PR riêng.

## 5. PR → release & feedback

- Review dùng `harness-review`, `test-engineer`, `security-reviewer`, trace `AC → API/FE tests → PR` và Figma node IDs.
- `aih verify --scope all` và `aih eval --scope all` **chỉ trả kế hoạch/dataset**, không tự chạy tests.
- `harness-devops-ci-cd` + `harness-devops-deployment` cung cấp rollout/rollback plan, `harness-devops-observability` chỉ rõ SLI/SLO/alert.
- Staging/production cần phê duyệt environment và artifact riêng; user hoặc operator quyết định merge/deploy.

**Deliverables:** approved PRD/AC → user-flow/screen-spec/Figma reference → OpenSpec change → backend + frontend diff/tests → reviewed PR(s) → telemetry evidence.
