# Hỏi rõ và kiểm tra change

Với tính năng cần spec:

```bash
aih new-change add-customer-search
# Trước ready: hoàn thiện proposal/design/tasks/spec và decisions.json từ yêu cầu thực tế.
# Draft vừa tạo còn TODO nên chưa đạt readiness.
aih ready add-customer-search --stage implement
# Sau khi implement và ghi bằng chứng:
aih ready add-customer-search --stage review
```

AI đọc yêu cầu/code/tài liệu trước. Nếu còn mơ hồ về nghiệp vụ, API, dữ liệu hoặc quyền truy cập,
hỏi 1–3 câu mỗi lượt, có A/B/C, trade-off, đề xuất có lý do và phương án trả lời khác. Không hỏi lại
điều đã được xác nhận. Không coi im lặng là đồng ý; tiếp tục phần độc lập đã được cho phép.

## Hai file bổ sung cho mỗi change

`decisions.json` ghi kết quả rà soát và những quyết định ảnh hưởng triển khai:

```json
{
  "schema_version": 1,
  "reviewed": true,
  "decisions": [
    {
      "id": "duplicate-phone",
      "question": "Xử lý số điện thoại đã tồn tại?",
      "status": "resolved",
      "answer": "Trả lỗi trùng; không cập nhật khách hàng cũ.",
      "source": "Người dùng xác nhận trong ticket CRM-42."
    }
  ]
}
```

Đây chỉ là ví dụ, không phải quyết định thực cho project của bạn. `reviewed: true` nghĩa đã rà soát
các điểm mơ hồ, không phải quyền deploy/merge. `decisions: []` hợp lệ nếu thực sự không có điểm
cần hỏi; không xóa các quyết định chưa trả lời để vượt kiểm tra.

`verification.json` ghi bằng chứng thực chạy:

```json
{
  "schema_version": 1,
  "checks": [
    { "name": "unit-tests", "status": "passed", "evidence": "CI run URL hoặc đường dẫn log có kết quả" },
    { "name": "integration", "status": "skipped", "reason": "Host không truy cập được VPN nội bộ" }
  ]
}
```

Chỉ ghi passed khi có bằng chứng. Failed chặn review; skipped phải có lý do và luôn hiện riêng trong
kết quả. Ít nhất một check hoặc manual review đã pass phải được ghi; tất cả skipped không đủ.

## Lệnh thực sự kiểm tra gì?

- Implement: proposal/design/tasks/spec phải có, không còn marker TODO/TBD/FIXME/template ngoài
  code block; có cấu trúc requirement/scenario WHEN/THEN; đã rà soát và giải quyết các quyết định khai báo.
- Review: thêm tasks trước merge đã hoàn thành và verification hợp lệ. Tasks chỉ thuộc phần
  `## After merge` (hoặc `## 4. After merge`) được bỏ qua để không ép archive sớm.
- Missing/invalid/blocked trả exit 1; ready trả exit 0. Không sửa file, gọi model hoặc chạy test.
- Đây là kiểm tra cấu trúc, không thể phát hiện mọi mơ hồ trong ngôn ngữ tự nhiên hoặc chứng minh
  bằng chứng là thật. Reviewer vẫn kiểm tra nguồn, diff và log; dùng OpenSpec CLI riêng để validate.

Change cũ không bị tự sửa. Nếu muốn dùng ready, copy hai template từ
`.notth/templates/openspec/` sau khi update, chỉ khi file đích chưa có; điền theo thực tế.
Sửa nhỏ, ít rủi ro không cần full change: ghi rationale và bằng chứng ngay trong PR.

## Artifact maintenance
With configured outputs in .notth/artifacts.json, readiness also reads artifact-impact.json.
Cover each output plus affected input IDs, record reviewed impact/reasons and respect read-only
sources. Implement allows pending plans; review requires done items and evidence for changes.
Unconfigured/legacy projects keep their existing readiness behavior. See [Artifact contract](artifact-contract.md).
