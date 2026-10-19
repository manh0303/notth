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
- `manifest.json`: schema 1, ID, tên file, thời điểm nhập, SHA-256, phương pháp và các phiên bản.

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
