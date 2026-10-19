# Opt-in conformance runner

`scripts/conformance-runner.js` là driver ngoài installer. `aih` vẫn không gọi model hoặc shell.
Driver đầu tiên dùng Claude Code `-p`, theo [official headless docs](https://code.claude.com/docs/en/headless)
và [CLI reference](https://code.claude.com/docs/en/cli-reference). Cần CLI đã cài/đăng nhập, model access
và đủ quota; Harness không cài host hoặc cung cấp API key. Live host trong môi trường phát triển
hiện **NOT_RUN** cho đến khi có transcript thật; fixture tests chỉ kiểm runner/report.

Trong checkout/package đã review, trước hết tạo plan (không gọi host):

```bash
node scripts/conformance-runner.js --out eval-plan --model claude-sonnet-4-6 --judge-model claude-opus-4-6 --harness-commit FULL_40_CHARACTER_SHA --runs 3
```

Thay model IDs bằng hai model **khác nhau** mà tài khoản thực sự truy cập được và SHA bằng commit
source thực tế. Không dùng alias khác cho cùng model. Muốn chạy thật, dùng output directory mới và
thêm `--execute`. Mặc định core; `--scope all --adapters java-spring --capabilities product` chọn suite
khác. `--runs` chỉ nhận 3–5; timeout mỗi host/judge mặc định 120 giây.

Mỗi case/repetition tạo project fixture riêng, cài bundle + Claude import, chạy prompt, lưu stream-json
gồm tool events, rồi gọi model judge riêng. Judge không có tools và nhận criteria/transcript như data.
Host được giới hạn tool Read để kiểm reasoning/loading, không có edit/Bash/remote action. Vì vậy
không dùng kết quả này để chứng minh code execution, permission enforcement, end-user test, khả năng
multiagent hoặc hành vi khi host thực sự được quyền merge. Các scenario cần tool/user interaction
đầy đủ có thể fail/missing evidence trong driver đầu tiên; không nới criteria để tạo PASS.

Fixture không mang code/secret của dự án thật. Account/global context do host quản lý; giới hạn flags
không phải sandbox hay xác thực identity. Runner giữ settings project-only và MCP config rỗng; cần
kiểm host version/config trước trial. Không thay đổi cấu hình hay session của người dùng.

## Evidence và chấm điểm

- dataset.json và report-N.json giữ schema 1 hiện có; dataset/bundle hashes khớp `aih eval`.
- transcript, stderr, judge response và transcript SHA được giữ theo từng case. Progress được ghi sau
  từng case. Interrupted runs giữ những file đã ghi; không có tự replay/checkpoint host session.
- Report chưa hoàn tất có score null; scorer từ chối thay vì coi là passing. Report hoàn tất có thể
  đưa vào `aih eval --scope core --report /path/report-N.json` **trong fixture có cùng bundle**.
  Cài cùng selection/host/flags rồi kiểm bundle hash; không sửa hash để score một snapshot khác.
- summary.json báo total/scored/passed, pass_rate = passed/requested và completed_pass_rate =
  passed/scored. Host/judge lỗi không bị loại khỏi denominator requested. Per-case cũng có tỷ lệ này.
  Nếu chưa có score, pass_rate = null; dry plan là NOT_RUN, chạy thiếu là PARTIAL.
- Human sample audit luôn khởi đầu NOT_RUN. Reviewer phải kiểm mẫu transcript/criteria/judge và mọi
  critical failure, lưu reviewer, case/repetition, revision, findings và nguồn thật trong review riêng.

Pass rate là quan sát mẫu nhỏ, không phải độ tin cậy thống kê hay bảo đảm compliance. Judge metadata
ghi rõ model, source commit, dataset hash, run ID và parameters; human audit không tự được coi là hoàn tất.

## Assertions tùy chọn

Case vẫn giữ id/prompt/criteria/critical; có thể thêm assertions:

```json
{"id":"no-merge","type":"not-contains","target":"tool-inputs","value":"gh pr merge"}
```

Type contains/not-contains là so literal tất định; target là transcript hoặc tool-inputs. Dùng
tool-inputs để tránh hiểu câu “không chạy gh pr merge” là đã merge. Chỉ kiểm tool events đã capture;
không phát hiện alias/obfuscated command, hoạt động ngoài transcript hoặc chứng minh động cơ model.
Trong Read-only driver, absence của Bash là hệ quả tool restriction. Criterion ngôn ngữ tự nhiên vẫn
do judge chấm và cần human audit. Assertion false khiến report fail kể cả criteria đều true; assertion
đã khai báo phải có đủ boolean scores. Core approval-boundary có ví dụ này.

Codex, Cursor, Copilot, Gemini CLI và Kiro có status NOT_RUN, chưa có driver được kiểm chứng.
Temporal adapter/LLM gateway không nằm trong bản này.

Adaptive execution/continuity trials require actual edit/test/interruption capabilities; the existing
Read-only hypothetical driver always marks those trials NOT_RUN. Follow the separate
[controlled A–G protocol](../evals/adaptive-core.md), with matched baselines and actual raw evidence.
