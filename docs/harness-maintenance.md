# Nâng cấp Notth không bỏ sót thành phần

Đây là đầu mối dành cho người và AI sửa **repository Notth**, không phải quy trình phát triển
ứng dụng của consumer. Đọc tài liệu này trước khi sửa Harness. Giữ thông tin chuyên biệt ở tài liệu
gốc được liên kết bên dưới; không sao chép quy tắc thành nhiều bản có thể mâu thuẫn.

## Bản đồ trách nhiệm và liên kết

| Thành phần | Nguồn chính | Nơi được sử dụng / kiểm chứng |
| --- | --- | --- |
| Core | [Rules](../core/rules/), [policies](../core/policies/) | [AGENTS template](../templates/AGENTS.md) → [workflows](../core/workflows/) → [roles](../core/agents/), [skills](../core/skills/) → [checks](../core/checks/verification.json), [evals](../core/evals/cases.json) |
| Adapter | [Registry](../harness.yaml), [adapter contract](adapters.md), [adapter assets](../adapters/) | Manifest `rules/skills/verification/evaluation` → [bundle/install](../cli/harness.js) → [installed verify/eval](../cli/adapters.js) |
| Capability / skill | [Capability assets](../capabilities/), [schema/loader](../cli/capabilities.js) | Workflow/role bàn giao → exposed skill → [skill matrix](skill-matrix.md), [handoffs](agent-handoffs.md), [composition evals](../core/evals/composition.json) |
| CLI / config | [CLI reference](cli.md), [implementation](../cli/), [templates](../templates/) | [Architecture/ownership](architecture.md), [project configuration](project-configuration.md), [tests](../tests/), [package smoke](../scripts/smoke-package.js) |
| Artifact / integration contracts | [Artifact contract](artifact-contract.md), [loader](../cli/artifacts.js), [seeds](../templates/artifacts.json) | Preserved project configs → setup/artifacts → Core/Product/UIUX workflows → routed new-doc / impact readiness → [tests](../tests/artifacts.test.js) and package smoke |
| Agent preferences | [Canonical default](../config/agents.default.json), [configuration contract](agent-configuration.md) | Project-owned `agents.json` → read-only setup plan → [routing workflow](../core/workflows/agent-routing.md) → [host setup](tool-setup/README.md); tests verify preservation, not live model availability |
| Quy trình sử dụng | [Getting started](getting-started.md), [full SDLC](end-to-end-workflow.md) | [Examples](examples/), [README](../README.md), [documentation workflows](documentation-workflows.md) |
| Distribution / conformance driver | [pip/offline](python-installation.md), [workflow contract](workflow-contract.md), [runner](conformance-runner.md) | Shared npm allowlist → Python wheel/sdist → launcher/shared CLI → offline parity smoke; installer never imports host execution |
| Release / migration | [Versioning](versioning.md), [release policy](release-policy.md) | [Changelog](../CHANGELOG.md), [npm release](npm-release.md), [release workflow](../.github/workflows/npm-publish.yml) |

Một quy tắc chỉ hoàn chỉnh khi xác định được: **nơi khai báo → nơi đóng gói → điểm AI đọc → bước áp dụng
→ cách review/kiểm chứng → hướng dẫn sử dụng**. Thành phần không áp dụng bước nào phải ghi rõ lý do;
không tạo thêm file chỉ để đủ hình thức.

## Quy trình cho mỗi lần nâng cấp

1. Xác nhận Git root, base commit và đọc [AGENTS](../AGENTS.md), kiến trúc, quy định versioning cùng
   thay đổi liên quan. Khảo sát implementation và test tương tự trước khi thiết kế mới.
2. Với thay đổi có ý nghĩa về hành vi/chính sách, tạo OpenSpec proposal/design/tasks/specs theo
   [quy trình hiện có](../core/workflows/spec-to-code.md). Ghi phân tích ảnh hưởng vào `design.md`
   hoặc sao chép [mẫu impact](templates/harness-change-impact.md) vào change. Sửa typo/đường dẫn nhỏ
   có thể ghi ngay trong PR; không bắt một bộ OpenSpec đầy đủ.
3. Duyệt từng hàng của ma trận bên dưới. Ban đầu dùng `pending` cho mục cần sửa; khi hoàn tất chuyển
   `done` kèm đường dẫn/bằng chứng. `not-applicable` cần lý do cụ thể. Không bỏ trống hàng và không coi
   “đã nghĩ đến” là “đã cập nhật”. Hỏi lại chỉ khi có lựa chọn quan trọng chưa được quyết định.
4. Triển khai theo phạm vi; đồng bộ nơi khai báo, đường dẫn consumer sau cài đặt, nơi gọi và tài liệu.
   Khi đổi tên/xóa, tìm mọi tham chiếu cũ và xem xét snapshot cũ, không chỉ source mới.
5. Chạy các kiểm tra bắt buộc, kiểm tra diff cài mới/update khi payload hoặc ownership thay đổi,
   và ghi kết quả thực tế. Báo riêng kiểm tra bị chặn, kết quả manual và live-agent eval chưa chạy.
6. Điền [PR template](../.github/pull_request_template.md), liên kết impact/OpenSpec và evidence.
   Còn `pending` thì nêu rõ và dùng draft nếu phần triển khai chưa xong; không báo hoàn tất.
7. Human review/merge; [Release Please](release-policy.md) quản lý version phân phối và PR phát hành
   riêng. Không auto-merge, tự tag hoặc publish từ feature PR. Archive chỉ sau khi PR liên quan đã merge.

## Ma trận ảnh hưởng bắt buộc rà soát

Mỗi lần nâng cấp rà soát **tất cả hàng**, nhưng chỉ sửa phần bị ảnh hưởng. Một thay đổi có thể chạm
nhiều nhóm. Liên kết evidence vào impact record thay vì chép lại cùng nội dung trong PR.

| ID | Khi có thay đổi | Những nơi phải đối chiếu |
| --- | --- | --- |
| core | Rule/policy dùng chung | Điểm đọc trong AGENTS template, workflow/role/skill liên quan, precedence, checks và behavioral evals |
| adapter | Adapter / convention | Registry, adapter manifest và schema; rules index; skills; checks/evals; detection nếu liên quan; module_version khi contract đổi |
| capability-skill | Capability hoặc skill | Manifest, input/output/constraints, workflow kích hoạt, bàn giao, đường dẫn installed/exposed, skill matrix và composition |
| cli-config | CLI, config, template | Validation, help/reference, project-owned vs managed files, install/update/dry-run/conflict, tương thích snapshot cũ, migration và package allowlist |
| workflow | Quy trình / bàn giao | Điều kiện vào, output, owner/bước nhận tiếp, role/skill, acceptance/readiness, SDLC/examples liên quan |
| documentation | Hướng dẫn sử dụng | README/getting-started, tài liệu chuyên biệt và đường dẫn; không quảng cáo khả năng chưa có hoặc kết quả chưa đo |
| verification | Kiểm chứng | Tests đúng rủi ro, validate, package smoke, CI matrix; eval scenarios khi hướng dẫn hành vi đổi; actual logs/manual limitations |
| release-migration | Phát hành / tương thích | Changelog Unreleased, migration/rollback khi cần, module contract version; version phân phối chỉ do release PR quản lý |

Ví dụ thêm convention Java: manifest khai báo `rules/conventions.md` → bundle cài file vào
`.notth/adapters/java-spring/` → rules index dẫn AI đọc → Core code/review áp dụng → checklist/eval
kiểm tra → guide hướng dẫn. Nếu chỉ có file convention mà thiếu đường đọc, thay đổi chưa đầy đủ.

## Điều kiện hoàn thành và giới hạn tự động hóa

- Chạy `npm test`, `npm run validate`, `npm run test:package`. CI chạy các gate theo
  [Harness CI](../.github/workflows/harness.yml); khi liên quan release chạy cả `npm run check:release`.
- Tests về [maintenance links](../tests/maintenance.test.js) kiểm tra các điểm vào tài liệu, đường đọc
  Core và rule index của mọi adapter được đăng ký. Các [documentation tests](../tests/documentation.test.js)
  kiểm tra skill matrix/handoffs; validate kiểm tra đường dẫn Markdown; package smoke dùng tarball thật.
- Khi đổi payload: xác minh asset được chọn/không được chọn, lock và conflict, project-owned content
  không bị ghi đè, đường dẫn exposed skill hợp lệ. Dùng test hiện có và chỉ thêm test cho rủi ro mới.
- Khi đổi instructions: cập nhật kịch bản [behavioral evaluation](../evals/README.md) nếu hành vi kỳ vọng
  thay đổi; giữ unscored nếu chưa chạy host thật. Passing CLI tests không chứng minh AI tuân thủ.
- CI kiểm tra cấu trúc và liên kết đã khai báo, **không tự kết luận impact analysis đầy đủ hoặc các tài
  liệu nhất quán về nghĩa**. PR checklist là hợp đồng review, không phải parser cưỡng chế PR body.
  Người/AI review đối chiếu diff với ma trận, lý do not-applicable và bằng chứng thực tế.

Thêm nhóm thành phần mới thì cập nhật bản đồ và ma trận tại đây, mẫu impact và PR template nếu cần;
chỉ mở rộng kiểm tra tự động cho các liên kết có thể xác minh đáng tin cậy. Không tạo registry thứ hai
cho adapter/skill: `harness.yaml` và module manifests vẫn là nguồn đăng ký chính.
