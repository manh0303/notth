# Kiểm thử như người dùng thật

**AI phải thao tác trên ứng dụng đang chạy và đối chiếu kết quả với yêu cầu.** Build/unit/API test
là phần hỗ trợ; muốn xác nhận một luồng web thì phải chạy qua browser. Đây là workflow của QA
trong AI host, khác với việc đánh giá độc lập chất lượng model/Harness.

Sau init/update vào bản có skill này, giao việc bình thường:

> Đọc AGENTS.md. Kiểm thử [tính năng] như người dùng thật theo tài liệu/AC đã chốt.
> Dùng công cụ hiện có, chạy luồng thành công và lỗi/quyền liên quan. Kiểm tra kết quả sau
> refresh hoặc mở lại nếu yêu cầu cần lưu dữ liệu. Lưu bằng chứng, sửa lỗi trong scope rồi
> test lại; báo rõ những gì chưa chạy hoặc bị chặn.

Host đọc `harness-end-user-testing` và workflow `end-user-acceptance.md` trước review. Bạn không
cần tự gọi từng agent; test-engineer có thể chạy tuần tự trong cùng assistant. CLI không tự mở browser,
khởi động model/server hoặc kết nối account; các thao tác do host được cấp quyền thực hiện.

## Cần cung cấp những gì?

AI đọc repo và câu trả lời đã lưu trước, chỉ hỏi phần còn thiếu:

| Thông tin | Nơi lưu dùng lại |
| --- | --- |
| Yêu cầu/AC, luồng và kết quả mong đợi | Nguồn chính trong artifacts.json / spec hiện có |
| URL môi trường test và phạm vi được phép thao tác | `.notth/local.md` |
| Lệnh start/test/build và tham chiếu môi trường | `.notth/environment.json` |
| Tên tool browser/MCP trong host, nếu dùng | `.notth/integrations.json` |
| Tài khoản/role test | Reference trong context; credential giữ riêng ở host |
| Nơi lưu báo cáo/bằng chứng | Output contract trong artifacts.json hoặc thư mục verification/ đã review |

Không copy credentials/cookies vào shared config hoặc PR. Thông tin cấu hình được backup bằng
cơ chế hiện có; screenshot/trace/report/checkpoint cần backup cùng project/evidence, không nằm trong
archive cấu hình. Nếu output bắt buộc ở hệ thống ngoài nhưng host không ghi được, trả proposal hoặc
BLOCKED theo policy, không tự tạo một nguồn canonical cục bộ khác.

## AI chọn công cụ theo dự án

| Giao diện thực tế | Cách kiểm tra | Giới hạn cần ghi rõ |
| --- | --- | --- |
| Web/React/Next.js/Astro | Playwright/Cypress đang có hoặc browser tool được host cấp quyền | Browser thật; API mock chỉ chứng minh phạm vi giao diện |
| React Native/mobile | Runner device/simulator hiện có, ví dụ Detox/Maestro | Browser viewport mobile không chứng minh app native |
| CLI | Chạy executable/lệnh thật, kiểm tra output và file/state | Unit test của hàm xử lý không thay cho terminal journey |
| Backend/API-only | Client/API workflow qua public endpoints, role và trạng thái | Không giả tạo một UI để gọi đó là browser E2E |
| Chỉ tài liệu | Đối chiếu nguồn, yêu cầu và consistency | Không quảng cáo app/runtime E2E đã chạy |

Có runner thì dùng tiếp, không cài framework cạnh tranh. Với web chưa có runner, Playwright là một
phương án đề xuất; lựa chọn và cài dependency/browser thuộc project/host, không do Harness installer.
Playwright Test và Playwright MCP là hai cách dùng khác nhau: runner thực thi test đã lưu; MCP/browser
cho host tương tác trực tiếp. Tool alias trong config chưa chứng minh runtime đã kết nối.

## Luồng thực thi

1. Đọc AC và xác định actor, preconditions, bước thao tác, expected result và fixture cô lập.
2. Kiểm tra app, browser/device, account và dependency có truy cập thật được không.
3. Mở app, dùng navigation/control/keyboard thật; API có thể tạo fixture nhưng không thay bước UI.
4. Chạy happy path và tình huống negative/role/state phù hợp với thay đổi. Không bắt mọi dự án
   test login/CRUD/upload nếu tính năng không có những hành vi đó.
5. Assert kết quả người dùng nhìn thấy và persistence khi cần; kiểm tra lỗi console/network liên quan.
6. Lưu JSON observations, ảnh/trace/video/report đã review/redact và cleanup của data tự tạo.
7. Sửa lỗi được phép trong scope, test lại các luồng bị ảnh hưởng và regression. Không đổi expected
   result hoặc bỏ assertion để khiến test pass; giữ giới hạn vòng retry/repair của host/project.
8. Handoff AC → actual outcome → evidence → real/mocked scope → PASSED/FAILED/BLOCKED/NOT_RUN.

Ví dụ minh họa form có lưu dữ liệu: mở form → nhập giá trị hợp lệ → click Save → kiểm tra dòng mới →
reload → dòng vẫn còn; nhập giá trị sai → đúng thông báo; actor bị hạn chế → action bị từ chối nếu AC
quy định. Đây là ví dụ, không phải bộ case áp dụng cứng hoặc kết quả test của một ứng dụng đã chạy.

## Plan và bằng chứng

```bash
aih verify --adaptive
aih skill harness-end-user-testing
aih verify --report verification/report.json
```

Nếu dùng npx, thay `aih` bằng `npx --yes @manhd_d/notth`. Adaptive plan có
`end_user_acceptance` với gợi ý surface/tools, context còn cần và host_prompt. Đây là metadata plan,
chưa có thao tác thật. Host cần đọc scoped source và tool runtime để chọn đúng test.

Report schema vẫn là 1; requirement cần end-user thêm:

```json
{"id":"AC-1","description":"Item survives reload","source":"approved AC reference","verification_target":"end-user","surface":"web"}
```

Scenario thêm khai báo, dùng URL thực trong môi trường được phép, không chứa credential:

```json
{"journey":{"surface":"web","actor":"test-editor","entrypoint":"test-page-reference","interaction":"browser","dependencies":"real","attachments":[]}}
```

Surface/interaction: web/browser, mobile/device, cli/terminal, api/http. Journey methods:
browser-e2e/web, mobile-e2e/mobile, cli-e2e/cli; api/backend-e2e/authorization/security dùng api.
end-user hoặc business-workflow có thể dùng surface thích hợp; unit/component/build không là journey. Dependencies: real, mocked,
not-applicable hoặc unknown. `not-applicable` chỉ dùng khi dependency thực sự không tồn tại trong
thiết kế, ví dụ calculator chạy hoàn toàn trong browser; không dùng để che backend mock/không truy cập.
Một requirement web không VERIFIED nhờ journey API/unit. Nếu backend mock/unknown, scoped assertions
có thể PASSED nhưng end-user target vẫn UNVERIFIED và overall report NOT_RUN.

Attachments tùy chọn: `{kind,path,sha256}` với kind screenshot (.png/.jpg/.jpeg/.webp), trace (.zip),
video (.webm/.mp4), report (.html/.json). Path tính từ project root; từng file regular không symlink,
không rỗng, tối đa 50 MiB; tối đa 20 file và 100 MiB tổng mỗi scenario. Binary attachments được kiểm
tra digest riêng; assertion vẫn đọc JSON evidence ≤1 MiB qua JSON pointer như contract hiện có.
Không nới giới hạn JSON để đọc binary trace/screenshot. Compress/scope evidence nếu quá giới hạn.
File-extension/digest chỉ kiểm tra consistency, không giải mã/đánh giá tính đúng của ảnh/trace.
Review nội dung raw độc lập; binary traces có thể chứa secrets, validator không tự scrub chúng.

Report cũ không khai báo target mới vẫn hợp lệ. Browser/mobile/CLI E2E đòi hỏi assertion ngoài transport:
chỉ HTTP 200 hay process exit 0 không thể là PASSED. Receipt/semantic labels do producer khai báo;
validator không xác thực rằng Playwright đã chạy hay nguồn revision đúng. Screenshot đơn lẻ không
thay cho bước/assertion nghiệp vụ và không phải human UAT approval.

## Thiếu môi trường

Browser executable, device, app URL/start access hoặc account cần thiết bị thiếu → BLOCKED cho luồng
đó, kèm đúng bước bị chặn và cách xử lý. Chủ động bỏ scope → NOT_RUN với lý do. Tự động hóa được
thực hiện khi host có tool và quyền; không hứa chạy được mọi app ngay sau một lệnh cài Harness.

[Adaptive report contract](adaptive-verification.md) · [Configuration backup](configuration-backup.md).

## Nguồn công cụ đã review

Official references reviewed 2026-10-14; use the installed project's actual version/configuration:
[Playwright installation](https://playwright.dev/docs/intro),
[assertions](https://playwright.dev/docs/test-assertions),
[locators](https://playwright.dev/docs/locators),
[trace viewer](https://playwright.dev/docs/trace-viewer),
[Playwright MCP](https://github.com/microsoft/playwright-mcp).
