# Walkthrough A — từ ý tưởng của developer tới tài liệu và code

Đây là **ví dụ thực hành** của chế độ **Idea-driven**, không gắn với một dự án CRM hay công nghệ cụ thể. `aih` chỉ cài hướng dẫn/skills và tạo **template trống**; AI host như Codex, IDE assistant hoặc ChatGPT Work có quyền repo mới có thể phân tích và ghi nội dung. Trong Chat thông thường, bạn vẫn có thể thảo luận ý tưởng, nhưng việc ghi file cần công cụ và quyền truy cập phù hợp.

## 1. Chuẩn bị dự án và cài Harness

Yêu cầu: Node.js 22+, Git, CLI `aih` đã cài từ bản nguồn được review, và một thư mục dự án tồn tại. Xem [Getting started](../getting-started.md) để cài CLI từ source; bản tính năng này nằm trong PR cho tới khi merge.

```bash
mkdir expense-app
cd expense-app
git init
aih init --capabilities product
aih new-doc idea
aih new-doc decision-log
aih check
aih skills
aih skill harness-product-idea-discovery
aih skill harness-product-product-research
```

Nếu dự án đã cài Harness, sửa `.notth/project.json` để thêm `product` vào `capabilities`, rồi dùng `aih update --dry-run && aih update && aih check` trên branch riêng; **không** chạy lại init với lựa chọn không tương thích.

## 2. Giao AI thảo luận thay vì bắt đầu code

Dán prompt này vào AI host có quyền đọc repository (hoặc thảo luận trước trong Chat):

> Đọc AGENTS.md và skill harness-product-idea-discovery đã cài. Ý tưởng ban đầu của tôi: “Ứng dụng quản lý chi tiêu cá nhân cho phép nhập giao dịch, AI đề xuất phân loại, có báo cáo theo tháng”. Hãy giữ nguyên ý tưởng gốc, đóng vai BA/PM/PO và thảo luận từng nhóm vấn đề quan trọng với tôi. Đề xuất user personas, MVP, non-goals và trade-off; không tự cho rằng các đề xuất là quyết định của tôi. Phân biệt FACT / INFERENCE / DECISION / UNKNOWN. Chưa code hay tự duyệt scope.

Sau mỗi vòng thảo luận, AI host cập nhật các file đã tạo trước đó: `docs/discovery/idea.md` và `docs/product/decision-log.md` (nếu được cấp quyền). Bạn là người chốt mục tiêu và MVP, không cần có BA/PM/PO riêng cho dự án cá nhân.

## 3. Tạo draft tài liệu có cấu trúc

```bash
aih new-doc research
aih new-doc prd-lite
aih new-doc acceptance-criteria
aih new-doc traceability
aih check
```

`idea.md` và `decision-log.md` đã tạo tại bước 1; không chạy lại. Các lệnh chỉ chạy **một lần trên mỗi file** và sẽ từ chối ghi đè. Khi đã có file, AI host điền nội dung vào đúng file dựa trên thảo luận, không chạy lại `new-doc`.

Prompt mẫu:

> Đọc AGENTS.md và skill harness-product-product-research đã cài. Nếu có công cụ web được cấp phép, hãy tìm các sản phẩm tương tự và ghi nguồn, ngày kiểm tra, điểm mạnh/yếu vào docs/discovery/research.md; nếu không có công cụ thì đánh dấu chưa nghiên cứu, không bịa nguồn. Từ các quyết định tôi đã duyệt, hoàn thiện docs/product/prd-lite.md, acceptance-criteria.md và traceability.md. Chỉ ghi draft/pending-review đối với thông tin chưa phê duyệt, rồi gửi diff để tôi review.

Khi cần chi tiết hơn (đa actor, nghiệp vụ phức tạp, nhiều tích hợp), tạo thêm `aih new-doc brd`, `aih new-doc prd`, `aih new-doc srs`, `aih new-doc use-cases` theo **mức độ cần thiết**, không bắt mọi dự án phải có tất cả.

## 4. Human approval và OpenSpec

Sau khi duyệt scope, cập nhật trạng thái/decision record thật của owner. Chỉ khi requirements và AC cho một thay đổi đã được duyệt, mới chuyển sang OpenSpec:

```bash
aih new-change add-expense-categorization
# Chỉ là các file proposal/design/tasks/spec dạng TODO, chưa được phê duyệt.
```

Prompt handoff:

> Đọc approved scope trong docs/product/ và requirement IDs; dùng core harness-spec để hoàn thiện openspec/changes/add-expense-categorization/, bao gồm test scenarios, rủi ro bảo mật dữ liệu, xử lý lỗi và những điểm còn thiếu. Không tự triển khai nếu scope chưa được duyệt. Sau khi tôi review, dùng adapter phù hợp để implement/test và tạo PR, không tự merge.

Nếu dùng OpenSpec upstream, cài/pin CLI riêng và chạy `openspec validate add-expense-categorization --strict` sau khi điền nội dung. Harness không tự cài hay chạy OpenSpec CLI.

## 5. Lưu trữ và thay đổi về sau

- `docs/discovery/` lưu ý tưởng và research đã ghi nguồn; `docs/product/` lưu tài liệu yêu cầu của **project**, không lưu trong source `notth`.
- `openspec/` lưu technical change và trace ID. Review tài liệu, code và CI trên PR, sau đó con người quyết định merge.
- Khi ý tưởng thay đổi, dùng `workflows/change-impact-analysis.md` và yêu cầu AI tạo diff; không tự ghi đè tài liệu approved.

**Giới hạn:** `aih verify --scope all` / `aih eval --scope all` chỉ cho checklist/eval advisory; không chứng minh đã thực sự chạy test, nghiên cứu hoặc review.
