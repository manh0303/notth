# Coding conventions: dự án mới và maintain

Harness yêu cầu AI đọc cấu trúc và tìm phần tái sử dụng trước khi code. Core áp dụng cho mọi stack;
Java/Spring, React/Next.js và React Native có thêm bộ convention mặc định. Đây là hướng dẫn cho AI
host, không phải công cụ tự phân tích hoặc cưỡng chế kiến trúc ứng dụng.

| Phạm vi | Cách làm |
| --- | --- |
| New | Đề xuất cấu trúc tối thiểu và convention theo adapter; chốt lựa chọn có ảnh hưởng trước khi dựng |
| Maintain | Theo quy định và pattern nhất quán của module đang sửa; giữ public contract và dùng common phù hợp |
| Mixed | Module mới kế thừa quy định chung của repo; chỉ quyết định mới cho phần nội bộ chưa có chuẩn |

Một tính năng mới trong module cũ vẫn là maintain. Có `pom.xml` hay `package.json` chưa đủ để kết luận
mode; `aih detect` chỉ đưa gợi ý stack. AI kiểm tra scope và quyết định đã có, không hỏi lại toàn bộ.

## Quy trình sử dụng

1. Chạy `aih setup`; AI đọc `AGENTS.md`, `.notth/local.md`, build/lint/format và code tương tự.
2. Nếu thiếu lựa chọn quan trọng, AI hỏi A/B/C có trade-off và gợi ý dựa trên bằng chứng. Quyết định
   thông thường đã được scope/convention bao phủ không cần hỏi lại.
3. Lưu các nguồn và quyết định bền vững vào `.notth/local.md`, hoặc liên kết tới tài liệu đang có.
4. Trước mỗi task, AI ghi ngắn: đã đọc đâu, tái sử dụng symbol nào, code mới đặt đâu, vì sao cần tạo mới.
   Đặt ghi chú trong change/PR hiện tại; sửa nhỏ không bắt tạo thêm một bộ tài liệu.
5. Review diff và chạy các kiểm tra của dự án. `aih verify --scope all` xuất checklist gồm Core,
   còn `aih eval --scope all` xuất các tình huống để đánh giá AI thực tế; không lệnh nào tự chạy model.

## Thứ tự ưu tiên

Trong phạm vi quyền và an toàn hiện có: quy định riêng đã thống nhất → cấu hình và pattern nhất quán
trong module → mặc định adapter cho chỗ còn thiếu. Nếu tài liệu và code mâu thuẫn, AI nêu nguồn và
hỏi khi ảnh hưởng đáng kể. Không lấy một file legacy làm chuẩn, không sao chép lỗi bảo mật để đồng bộ.

Ví dụ nội dung ngắn trong `.notth/local.md` (thay bằng đường dẫn thật đã kiểm tra):

```markdown
## Development conventions
- Scope: maintain module customer; new feature follows that module's layout.
- Sources: link the actual team guide, formatter config and comparable endpoint/tests.
- Boundaries: describe the allowed dependency direction and supported shared APIs.
- Reuse: link the actual error contract, pagination, mapper/client/components that apply.
- Checks: link declared project commands and existing architecture tests.
- Exceptions: record reason, scope and decision source; leave unknowns explicit.
```

## Nội dung theo stack

| Adapter | Chuẩn và điểm tái sử dụng |
| --- | --- |
| [Java/Spring](../adapters/java-spring/rules/conventions.md) | Package/naming, injection, DTO, transaction, error/logging, mapper, pagination, test |
| [React/Next.js](../adapters/react-nextjs/rules/conventions.md) | Feature/routes, naming, typed contracts, client/hooks/state, forms, design tokens, UI states |
| [React Native](../adapters/react-native/rules/conventions.md) | Screen/navigation, state, API/device boundaries, theme, secure storage, permission, platform checks |

Không tự tạo thêm `ApiResponse`, HTTP client, theme hoặc permission manager nếu dự án đã có bản phù hợp.
Không ép tái sử dụng bằng cách gọi nội bộ module khác, tạo vòng dependency hoặc đưa nghiệp vụ riêng vào
common. Dependency, base class hoặc abstraction mới cần nhu cầu thật và lý do; thay đổi kiến trúc ngoài
scope cần quyết định của người dùng. Không cài lint/framework mới chỉ vì adapter đề cập tên công cụ.

## Update và giới hạn kiểm chứng

Sau khi phiên bản chứa thay đổi được phát hành, nâng CLI rồi chạy `aih update --dry-run`, `aih update`,
`aih check` trên nhánh consumer. Có thể kiểm thử trước bằng `--source /path/to/reviewed/notth`.
Update giữ nguyên `.notth/local.md`, environment và các tài liệu dự án; host bổ sung thông tin còn
thiếu vào file cũ thay vì ghi đè. Không có schema mới, auto-scaffold ứng dụng hay migration kiến trúc.

`aih check` xác minh snapshot Harness; `aih verify` chỉ lập kế hoạch. Lint, test, build và kiểm tra ranh
giới thực tế do AI host/CI chạy. Khi chưa có kiểm tra kiến trúc tự động, báo kết quả review thủ công
và giới hạn. Các bài test CLI không chứng minh AI luôn tuân thủ convention; xem [đánh giá](../evals/README.md).
