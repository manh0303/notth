# Thiết kế UI với NOTTH

Cài mới với CLI đã review chứa UIUX 1.2.0:

```bash
aih init --host codex --capabilities uiux
```

Đổi host theo tool bạn dùng. Project đã cài: chọn uiux trong `.notth/project.json`, giữ các lựa chọn
khác, rồi review `aih update --dry-run`, `aih update`, `aih check` trên branch. Không chạy init để thay
selection. Nếu không có lệnh global, dùng CLI local/offline đã review. Merge PR chưa phải npm release.

Sau khi harness-start đã được đọc, chỉ cần nói:

> Thiết kế trang giới thiệu sản phẩm. Chỉ có headline, hướng dẫn setup và workflow. Cho tôi xem preview trước.

> Thêm màn quản lý user, giữ design system hiện tại; ưu tiên bảng dễ đọc và thao tác bàn phím.

> Sửa lỗi tràn nút trên mobile, không đổi phong cách hay các phần khác.

AI đọc flow `design-delivery`, chọn skill theo task và giữ một nguồn thiết kế: `DESIGN.md` hoặc master
hiện có. Sửa nhỏ không cần tạo thêm tài liệu hay ba phương án. Chỉ hỏi khi thiếu quyết định quan trọng.
Host phải đọc/thực hiện hướng dẫn; không cam kết mọi client tự nhận skill hoặc tuân thủ hoàn toàn.

## Dùng UI UX Pro Max / Google Stitch Skills

Đây là **tích hợp tùy chọn qua hướng dẫn handoff**, không phải thư viện đã nhúng vào NOTTH.
Xem [nguồn và commit đã khảo sát](../capabilities/uiux/integrations/design-skills.md).

1. Cung cấp checkout/bộ skill đầy đủ từ nguồn được review, giữ license và supporting files.
2. Ghi đường dẫn thực tế và revision vào context project-owned, không vào file managed hay commit secrets.
3. Yêu cầu: “Dùng bộ UI UX Pro Max đã có để tra typography/UX; giữ nguyên design master hiện tại.”
4. Với Stitch: cấu hình MCP ở host rồi yêu cầu tạo preview/screen trong project được phép. NOTTH không
   tự kết nối tài khoản hoặc cấp quyền. Chỉ gửi nội dung được phép ra dịch vụ.

UI UX Pro Max search cần Python + scripts/data đầy đủ. Khi offline có thể tra local, nhưng font/asset
remote chưa chắc có. Google enhance-prompt có yêu cầu đọc hướng dẫn online: thiếu truy cập thì ghi rõ
chưa chạy đầy đủ upstream và dùng hướng dẫn local của NOTTH. Không có Stitch vẫn làm code preview nếu
được chấp nhận. Nếu bạn yêu cầu file editable thì thiếu dịch vụ phải báo BLOCKED, không tráo bằng ảnh.

`taste-design` có các lựa chọn thẩm mỹ mạnh; không áp nguyên xi cấm font/màu hoặc animation lặp lên
mọi sản phẩm. Quyết định đã duyệt và accessibility có ưu tiên cao hơn gợi ý bên ngoài.

## Hai ví dụ nghiệm thu

| Brief | Quyết định cần giữ | Kiểm tra thực tế |
| --- | --- | --- |
| Landing page setup nhanh | Đúng ba phần được yêu cầu, một hành động chính, nội dung thật, không thêm testimonials/metrics giả | Preview hẹp/rộng; đọc headline, copy setup, kiểm tra link/focus và reduced motion |
| Console quản trị nhiều dữ liệu | Kế thừa font/token, bảng có sort/filter và trạng thái, ưu tiên mật độ theo tác vụ, không ép thành card | Tên dài, empty/loading/error, keyboard, focus, filter/sort, khả năng truy cập dữ liệu trên màn hẹp |

Đây là ví dụ kỳ vọng, không phải báo cáo đã chạy. Build/test pass không chứng minh UI đẹp hoặc dùng tốt.
Yêu cầu bàn giao gồm revision, preview/ảnh, viewport, tương tác đã thử, lỗi đã sửa/recheck và phần NOT_RUN.
Đánh giá trước/sau theo cùng brief và điều kiện; xem hướng dẫn trong
[behavioral evaluation](../capabilities/uiux/evals/visual-comparison.md).

## Update / rollback

UIUX 1.2.0 giữ ID Figma cũ, schema và config hiện có. Update thêm hai skill và tài liệu managed;
không tạo/ghi đè DESIGN.md, external skill installs hoặc native settings. Commit snapshot và lock cùng
nhau; rollback bằng revert commit cài đặt với CLI tương ứng. Không sửa hash để vượt qua conflict.
Upstream upgrade là review riêng (diff/license/dependencies), không tự theo main.
