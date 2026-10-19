# Coding và tài liệu kỹ thuật

Người dùng vẫn giao việc tự nhiên. NOTTH hướng dẫn host chọn phần cần dùng; không tự chạy model,
cài thư viện, thêm worker hay bảo đảm host tuân thủ chỉ nhờ một file Markdown.

| Nhóm | Hướng dẫn được nâng cấp | Đầu ra |
| --- | --- | --- |
| Coding | Core planner/debugging/TDD/review + engineering-quality | Khảo sát/reuse, lát cắt chức năng, nguyên nhân có bằng chứng, regression và refactor có kiểm soát |
| Kiến trúc | Architecture solution-design/decision-records | Tổng quan rút gọn theo tinh thần arc42 và ADR theo MADR; không nhận là template đầy đủ được sao chép |
| TechSpec | Product techspec | API/data/transaction/integration/rollout chọn theo rủi ro, không bắt mọi mục |
| Theo stack | Java/Spring, React/Next.js, React Native rules/engineering.md | Quy tắc chuyên stack với phiên bản, invariant và bằng chứng phù hợp |
| Kiểm chứng | Core verification/recoverable-verification | Requirement → risk → scenario → actual evidence; rõ mock/thật và phần chưa chạy |
| Tài liệu | Product document-review + optional document-export | Fact/proposal/unknown, cập nhật theo diff, xuất định dạng và render QA bằng công cụ host |

## Bắt đầu

Chọn CLI đã review chứa bản nâng cấp. Core-only đã có coding/debug/review/verification:

```bash
aih init --host codex
```

Ví dụ cài mới cần Java và tài liệu kỹ thuật:

```bash
aih init --host codex --adapters java-spring --capabilities product,architecture
```

Frontend chọn react-nextjs hoặc react-native; không cài cả ba nếu không cần. Project đã cài: giữ các
lựa chọn trong .notth/project.json, bổ sung module cần thiết rồi backup, update --dry-run, update,
check trên branch. Nếu không có global aih, dùng supporting CLI local/offline đã review. Package CLI
và snapshot project là hai thứ khác nhau; merge source chưa chứng minh đã phát hành npm/PyPI.

Sau khi harness-start được đọc, ví dụ:

> Sửa lỗi cập nhật trùng này. Tái hiện và xác định nguyên nhân trước, thêm regression test rồi tạo PR.

> Thêm export có phân quyền. Phân tích ảnh hưởng, cập nhật TechSpec liên quan, triển khai và kiểm chứng.

> Refactor module này, giữ API/error contract và hành vi hiện tại, không đổi kiến trúc ngoài phạm vi.

> Cập nhật tài liệu kiến trúc từ source; đánh dấu điều chưa rõ. Chỉ xuất Word khi nội dung đã được review.

## Độ sâu theo task

- Sửa nhỏ: note ngắn, source/test liên quan và actual check; không bắt tạo ADR/TechSpec dài.
- Thay đổi chức năng: lát cắt có đầu ra, intended files, dependency, verification và done condition.
- Rủi ro dữ liệu/tích hợp: phân tích invariant, concurrent/duplicate/failure và tương thích consumer.
- Tài liệu: kế thừa nguồn chính, cập nhật section bị ảnh hưởng; không sinh nhiều bản cùng sở hữu một fact.

Ví dụ API cập nhật tồn kho: TechSpec nêu invariant không âm, transaction và xung đột; ADR chỉ cần nếu
có lựa chọn kiến trúc đáng kể. Test dùng yêu cầu đồng thời có phối hợp và kiểm tra trạng thái cuối;
test mock/H2 không tự chứng minh locking trên database thật. Không mặc định phải thêm Redis/Kafka.
Ví dụ React: xác định ai sở hữu state, tenant cache và boundary trước tối ưu; không memo mọi component.
Ví dụ mobile: tách JS assertions khỏi kết quả permission/back/keyboard trên iOS/Android thật.

## Xuất Word / PDF / slide

Product có workflow document-export do host thực hiện, không có exporter nhúng trong CLI. Chỉ chạy khi
người dùng yêu cầu định dạng cụ thể. Host kiểm tra skill/tools/license/prerequisites sẵn có trước;
không tự cài dependencies hoặc upload tài liệu riêng lên dịch vụ. Thiếu exporter: BLOCKED. Có file nhưng
chưa render: visual QA NOT_RUN. Render mọi trang/slide, kiểm tra tràn bảng/font tiếng Việt/page break,
sửa và render lại; đối chiếu nội dung với revision nguồn. Không dùng file export làm nguồn chính thứ hai.

## Nguồn và giới hạn

[Inventory nguồn đã pin](../integrations/engineering-sources.md) ghi Superpowers, Vercel, arc42, MADR,
Spec Kit và Anthropic. Bản này đưa hướng dẫn gốc của NOTTH vào snapshot; không nhúng toàn bộ upstream,
không chạy workflow thứ hai cạnh OpenSpec, không tự nhận đã dùng một skill ngoài chưa cài.
Tài liệu source-available không mặc nhiên được phân phối lại dưới MIT. Java/database thực thi phải
đối chiếu phiên bản thực tế và nguồn chính thức, không áp semantics của một vendor sang vendor khác.

## Kiểm chứng và rollback

Tests kiểm tra registry, đường đọc, asset cài chọn lọc, update/conflict và ownership. Eval scenarios là
kỳ vọng hành vi; chưa chạy host thật thì không có điểm chất lượng. So sánh trước/sau cần cùng brief,
repo fixture, model/tools, điều kiện và reviewer; không suy ra ít lỗi/nhanh hơn chỉ từ test cấu trúc.
Revert commit snapshot/lock với CLI tương ứng để rollback. Giữ tài liệu/config user-owned và external
installs riêng; không sửa hash để ép update. Xem [verification](verification.md) và [versioning](versioning.md).
