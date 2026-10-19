# Walkthrough B — dự án đã có tài liệu BA/Confluence → OpenSpec → code

Dùng chế độ **Document-driven** cho dự án doanh nghiệp hoặc bất kỳ codebase nào đã có BRD/PRD/SRS/Confluence/Jira. Tài liệu gốc tiếp tục do hệ thống/chủ sở hữu hiện tại quản lý; AI **không cần tạo lại BRD hay PRD** chỉ để code.

## 1. Cài Harness trong repository hiện có

Ví dụ một backend Spring Boot đã được checkout. Cần Node.js 22+, Git và `aih` đã cài từ bản nguồn được review.

```bash
cd /path/to/existing-spring-project
git switch -c feat/customer-search
aih init --adapters java-spring --capabilities product --dry-run
aih init --adapters java-spring --capabilities product
aih check
aih skills
aih skill harness-product-knowledge-analysis
```

Nếu repository **đã cài** Harness, chỉnh `.notth/project.json` nếu cần thêm capability rồi `aih update --dry-run`, `aih update`, `aih check`. Không thực hiện init chồng lên bộ cài do dự án đã quản lý.

## 2. Cung cấp tài liệu có quyền truy cập

Chia sẻ **đường dẫn/trang được cấp phép** (Confluence, Git files) hoặc export được phép. Agent phải ghi ID trang, URL, revision, owner, phạm vi quyền và approval status; không suy diễn rằng mọi trang đều mới nhất hoặc đã được duyệt.

```bash
aih new-doc source-register
aih new-doc traceability
```

Prompt dùng với AI host có quyền đọc project và nguồn:

> Đọc AGENTS.md, Product workflow document-driven và các tài liệu BA tôi cho phép. Tác vụ: triển khai tìm kiếm khách hàng có phân quyền. Đầu tiên xác định BRD/PRD/SRS nào là nguồn chuẩn, ghi source IDs, URL và phiên bản trong docs/product/source-register.md. Liệt kê FR/NFR/US/AC liên quan, kiểm tra mâu thuẫn và thông tin còn thiếu. Không bịa nội dung chưa đọc được, không viết lại tài liệu BA đã approved. Hoàn thiện traceability draft và đưa tôi review trước khi tạo technical spec.

Nếu Confluence chưa kết nối trong AI host, agent phải báo là **không thể đọc**, yêu cầu export/phạm vi được phép; `aih` không tự truy cập Confluence.

## 3. Gap analysis và phê duyệt

- Tài liệu BA có sẵn và hợp lệ: chỉ tạo `source-register`, `traceability`, decision log hoặc các artifact thiếu.
- SRS chưa có hoặc thiếu chi tiết thực sự: có thể chạy `aih new-doc srs` và `aih new-doc use-cases`, nhờ AI điền **draft** từ những requirement đã xác nhận.
- Có source conflict, thiếu AC hoặc yêu cầu chưa rõ: AI ghi UNKNOWN và chờ BA/PO hoặc chủ dự án có quyền quyết định; không tự gắn nhãn approved.

## 4. Tạo OpenSpec từ phạm vi đã duyệt

```bash
aih new-change customer-search
# Điền TODO trong openspec/changes/customer-search/ rồi review.
```

Prompt handoff:

> Dựa vào các requirement IDs đã approved và source revisions trong docs/product/traceability.md, dùng core harness-spec và skill adapter java-spring phù hợp để lập proposal/design/tasks/spec cho customer-search. Chỉ mô tả hành vi có bằng chứng, test cases gồm authorization deny-other-tenant, input validation, no-result/error cases nếu phù hợp với yêu cầu nguồn. Đánh dấu NFR còn thiếu; không tự duyệt. Sau khi tôi chốt spec, implement trên branch hiện tại, chạy test thực tế, tạo PR để review và không tự merge/deploy.

Nếu dùng OpenSpec upstream thì pin và cài CLI riêng, sau đó có thể chạy `openspec validate customer-search --strict` khi bản nháp đã hoàn thiện.

## 5. Lưu trữ và bảo mật

- Tài liệu BA chính thức vẫn ở Confluence/Drive/repo được chỉ định; trong repository kỹ thuật giữ URL/revision và những tài liệu dẫn xuất được phép lưu.
- `docs/product/` chứa traceability, source register và các bản draft phục vụ dự án; `openspec/` chứa technical spec và change liên kết FR/US/AC.
- Không đưa tài liệu khách hàng mật, secrets hoặc export nguyên bản vào repo không được phép. Không publish Confluence hay sửa PRD gốc nếu chưa được phê duyệt.
- Khi tài liệu BA đổi revision, dùng change-impact analysis và review delta thay vì ghi đè code/spec.

**Giới hạn:** skills và role contracts không tự biến thành agent runtime; CI/test/OpenSpec validation thực tế phải do host/IDE và công cụ liên quan chạy, có kết quả kiểm chứng.
