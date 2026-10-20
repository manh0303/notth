# Tài liệu đầu vào được lưu ở đâu?

NOTTH giữ bản gốc, bản Markdown và lịch sử trong **`docs/sources/` của dự án**.
Cài lại/cập nhật NOTTH không quản lý hay ghi đè thư mục này. Chỉ có trong phiên bản chứa
`import-source`; merge feature PR không đồng nghĩa đã phát hành npm/PyPI.

Trong chat, đưa file cho AI và yêu cầu: “Lưu tài liệu này làm nguồn của dự án rồi tiếp tục phân tích”.
AI theo workflow source-intake, dùng công cụ đọc/chuyển đổi thực sự có trong phiên làm việc.
CLI không tự chạy AI, OCR hay tải tài liệu từ URL.

## Lệnh trực tiếp

```bash
aih import-source requirements --input "inputs/Yêu cầu.md"
aih sources
```

Markdown/UTF-8 TXT được chuẩn hóa trực tiếp; TXT giữ nội dung nguyên văn trong khối mã.
PDF, DOCX, XLSX, ảnh và định dạng khác được lưu bản gốc với trạng thái `pending`.
Sau khi AI/công cụ chuyển đổi tạo Markdown, đăng ký kết quả:

```bash
aih import-source requirements --input "inputs/Yêu cầu.pdf" --normalized "converted.md"
```

Dùng đúng file gốc của lần chuyển đổi; có thể dùng đường dẫn `original` từ kết quả nhập trước.
`--dry-run` kiểm tra và xem kế hoạch mà không lưu tài liệu. Đường dẫn đầu vào có thể nằm ngoài
project; chỉ tên file được ghi vào manifest, không lưu đường dẫn tuyệt đối của máy.
Mỗi file tối đa 64 MiB; manifest tối đa 4 MiB. File lớn hơn cần quy trình lưu trữ/chia tài liệu
được dự án chấp nhận; CLI từ chối thay vì cắt nội dung.

## Cấu trúc và trạng thái

- `originals/<id>/<sha256>.<ext>`: bản gốc không sửa đổi.
- `normalized/<id>/<original-sha256>-<markdown-sha256>.md`: bản chuyển đổi.
- `manifest.json`: schema 1 cho file local; schema 2 khi thêm provenance, ID, tên file, thời điểm nhập, SHA-256, phương pháp và các phiên bản.

Các đường dẫn trên đều nằm dưới `docs/sources/`. ID là slug chữ thường, tối đa 64 ký tự.
Cùng ID/nội dung không tạo bản trùng; nội dung mới thêm revision. Chuyển đổi lại thêm phiên bản
Markdown, giữ bản cũ. Phiên bản nguồn mới nhập là hiện hành; nhập lại revision cũ không đổi thứ tự.
Không tự gộp hai ID dù chúng có cùng bytes: chúng có thể là hai nguồn độc lập.

`aih sources` kiểm tra hash toàn bộ file đã đăng ký, báo nguồn chưa chuyển đổi và đường dẫn bản
hiện hành. File bị sửa, mất, manifest sai hoặc symlink gây lỗi; không tự ghi đè hay sửa hash.
`available-unreviewed` nghĩa là đã có Markdown, **không phải nội dung đã đúng hoặc spec đã duyệt**.
AI đối chiếu bản gốc và ghi rõ phần thiếu/bảng/hình/công thức/OCR không chắc chắn vào evidence.
Nguồn ở artifacts.json vẫn quyết định ownership/canonical; manifest chỉ là chỉ mục bản lưu.

## Backup và cài lại

1. Lưu **toàn bộ `docs/sources/`** vào Git phù hợp hoặc hệ thống backup được phép của dự án.
2. `aih backup` riêng để xuất cấu hình; lệnh này **không chứa tài liệu**.
3. Khi phục hồi, chép nguyên thư mục nguồn về đúng vị trí, khôi phục cấu hình nếu cần rồi cài NOTTH.
4. Chạy `aih sources` kiểm tra file và hash; AI đọc lại chỉ mục để tiếp tục.

Không tự upload, commit hay push tài liệu. Chỉ lưu trên máy chưa phải backup chống mất máy.
Ghi file dùng cùng guard/rollback của installer: phục hồi khi lỗi ghi thông thường, không phải
transaction chống mất điện giữa nhiều file. Sau gián đoạn, kiểm tra và khôi phục từ backup nếu cần.
Các hash phát hiện thay đổi vô ý, không chứng minh tính xác thực nếu cả manifest và file bị sửa.

## Jira, Confluence, URL, MCP và API

Đã có hợp đồng nhập chung; **AI host lấy dữ liệu**, NOTTH lưu snapshot và nguồn xuất xứ.
Không cần hard-code Jira/Confluence. Nếu host chưa kết nối hoặc không đủ quyền, NOTTH không tự đọc được link.
Bạn chỉ cần đưa link và nói: “Lưu nguồn này vào dự án, ghi rõ phần chưa đọc được, rồi phân tích”.

Luồng: host đọc nguồn → lưu snapshot JSON/HTML/file → tạo metadata → nhập vào kho → chuyển Markdown
→ review. Nhập comment/attachment và phân trang theo phạm vi cần thiết; không mặc định một kết quả API
là toàn bộ nguồn. Snapshot là bản xuất đã lấy được, không nhất thiết là backup đầy đủ hệ thống bên ngoài.

```bash
aih import-source app-123 --input issue.json --metadata metadata.json --normalized issue.md
aih sources
aih source-check app-123 --report observation.json --input evidence.json
```

Hai file mẫu cài tại `.notth/templates/source-metadata.json` và
`.notth/templates/source-observation.json`; AI điền bằng dữ liệu thực, không dùng nguyên placeholder.
Cả hai command ghi dữ liệu đều hỗ trợ `--dry-run` và `--target`.

Metadata mẫu (thay hash/thời gian bằng giá trị thực):

```json
{
  "schema_version": 1,
  "kind": "mcp",
  "locator": "https://issues.example.com/browse/APP-123",
  "connection": "issues",
  "resource_id": "APP-123",
  "snapshot_sha256": "<SHA-256 của issue.json>",
  "revision": "<revision thực do nguồn cung cấp>",
  "captured_at": "<thời điểm UTC dạng ISO>",
  "scope": "description-comments-attachments",
  "completeness": "partial",
  "missing": ["Không đọc được attachment scan.pdf"]
}
```

- `kind`: file/url/mcp/connector/api. Local file không cần metadata; nếu dùng kind=file thì bỏ locator.
- `locator`: permalink HTTPS, không chứa user/password, query hoặc fragment; không phải endpoint có token.
  MCP/connector không có link có thể dùng `connection` + `resource_id`. Connection là alias, không cấp quyền.
- `revision`: phiên bản thực; không biết thì bỏ trường. `captured_at` là thời điểm thực, UTC, không ở tương lai.
- `scope`: giữ ổn định cho cùng ID. Đổi nguồn/phạm vi phải dùng ID khác. Transport có thể đổi nếu permalink giữ nguyên.
- `completeness`: complete theo đúng scope, partial phải liệt kê phần thiếu, unknown khi chưa xác định đủ.
- Hash được tính từ bytes thật, không từ tên file, URL hay bản tóm tắt. Metadata gắn sai hash sẽ bị từ chối.

Dùng `source-check` sau khi AI thực sự kiểm tra nguồn. Report có `schema_version: 1`, `snapshot_sha256`,
`capture_sha256` từ `aih sources`, `checked_at`, `outcome` và `evidence_sha256` của file bằng chứng.
Với `outcome: observed`, gửi `revision` và/hoặc `content_sha256` (hash snapshot cùng scope).
Với `outcome: unavailable`, gửi `reason` và không ghi revision/hash nội dung chưa đọc được.
Bằng chứng đã loại credential được lưu ở `docs/sources/observations/<id>/<hash>.bin`.

| Trạng thái | Ý nghĩa |
| --- | --- |
| not-checked | Chưa có kiểm tra áp dụng cho capture hiện tại |
| unchanged-at-check | Revision/hash so sánh được trùng tại thời điểm kiểm tra |
| changed | Ít nhất một revision/hash so sánh được đã khác |
| unknown | Có quan sát nhưng thiếu cơ sở đối chiếu |
| unavailable | Không đọc được nguồn; lý do nằm trong report lưu trữ |

Đối chiếu hash cùng bytes/scope; timestamp hoặc thứ tự JSON thay đổi cũng làm hash khác. Dùng revision
của provider khi nó thực sự bao phủ scope cần kiểm tra. `unchanged-at-check` không đảm bảo nguồn vẫn mới
mãi và không biến partial thành complete. CLI kiểm tra cấu trúc/hash của bằng chứng, không xác thực
người cung cấp đã gọi API trung thực hay dữ liệu đúng nghĩa. Chưa có tự đồng bộ, lịch chạy hoặc RAG.

## Tương thích kho nguồn

Đọc kho schema 1 không thay đổi file. Lần nhập `--metadata` đầu tiên nâng riêng manifest nguồn lên
schema 2 để chứa captures/checks, giữ nguyên originals/normalized và lịch sử cũ. CLI cũ chỉ hỗ trợ schema 1
sẽ từ chối schema 2; dùng CLI mới hoặc phục hồi bản backup schema 1 đầy đủ khi rollback. Không sửa số
schema bằng tay. Config/lock/backup vẫn giữ schema cũ và không tự chứa tài liệu.

Nguồn có provenance chọn capture mới nhất theo captured_at. Cùng bytes nhưng revision ngoài đổi vẫn
lưu capture mới; nguồn ngoài quay về bytes cũ có thể nhập capture mới để ghi nhận đúng lần quay lại.
Không có metadata thì giữ nguyên quy tắc revision local. Backup phải bao gồm cả observations và manifest.
