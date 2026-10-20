# npm, pip và cài offline

Hai kênh dùng cùng Core, Agents, Skills, Workflows, Adapters và CLI JavaScript. npm cần Node.js 22+;
pip cần Python 3.9+ **và Node.js 22+**. Wheel không tải Node, không phụ thuộc package Python khác,
không chạy npm/npx và không kết nối mạng khi chạy `aih`. Host AI có yêu cầu mạng riêng.

PyPI name: `notth`. Chỉ dùng lệnh pip khi phiên bản cần cài đã có trên registry;
workflow build thành công hoặc GitHub Release không chứng minh PyPI publish đã thành công.
Nếu chưa có, dùng wheel offline được build/kiểm tra từ đúng release tag. Maintainer cấu hình
Trusted Publisher trước lần publish đầu; xem mục phát hành bên dưới.

## Cài và dùng

Trong virtualenv đã kích hoạt (khuyến nghị `.venv` hoặc virtualenv ngoài project):

```bash
python -m pip install notth
aih init --host codex
aih check
```

Chọn host `codex`, `claude-code`, `cursor`, `copilot`, `gemini-cli`, `kiro`, `opencode` hoặc `windsurf`. Mở session AI,
gọi skill harness-start nếu host nhận diện; nếu không, gửi prompt đọc
`.agents/skills/harness-start/SKILL.md`. Xem [setup đa IDE](tool-setup/README.md).

Không cần npm. Nếu `aih` chưa nằm trong PATH, kích hoạt virtualenv hoặc dùng
`python -m ai_harness.launcher`. Đặt `AIH_NODE` tới file `node`/`node.exe` khi Node không có trong PATH.
Ví dụ PowerShell: `$env:AIH_NODE = 'D:\tools\node\node.exe'`.
Không cài cả npm global và pip vào cùng PATH nếu không muốn lựa chọn executable mơ hồ;
`Get-Command aih` (PowerShell) hoặc `command -v aih` xác định launcher đang dùng.

## Công ty chặn npm và PyPI

Trên máy có Internet, tải wheel của phiên bản đã phát hành:

```bash
python -m pip download --only-binary=:all: --no-deps notth -d wheelhouse
```

Chuyển wheel, Python và Node portable/installer phù hợp OS/CPU vào máy công ty qua kênh được phép.
Wheel là pure Python, dùng chung các OS; Node portable phải đúng nền tảng.
Tại máy offline, kích hoạt virtualenv và chỉ định **đúng tên wheel đã tải**:

```bash
python -m pip install --no-index --no-deps wheelhouse/notth-X.Y.Z-py3-none-any.whl
aih init --host kiro --adapters java-spring
aih check
```

X.Y.Z là placeholder cho release thực tế. `pip --no-index` không hỏi registry; `.whl` đã chứa toàn bộ
payload nên không cần build tool hoặc dependencies. Không cần OpenSpec CLI để tạo draft.
Package không thay cấu hình proxy/TLS của công ty. Nếu PyPI được phép và chỉ npm bị chặn, dùng pip
trực tiếp. Có thể dùng mirror PyPI nội bộ đã được tổ chức phê duyệt.

## Cập nhật

```bash
python -m pip install --upgrade notth
aih --version
aih backup
aih update --dry-run
aih update
aih check
```

Offline: thay lệnh đầu bằng `python -m pip install --no-index --no-deps --upgrade /path/to/new.whl`.
pip cập nhật CLI; `aih update` cập nhật snapshot của **từng project**, không tải gì. Hai bước khác nhau.
User config được giữ nguyên; managed drift vẫn chặn update. Backup + Git giữ khả năng rollback.
Trong cùng release npm/pip dùng version từ package.json; không có version Python độc lập.

## Build và phát hành

`python scripts/build-python.py` tạo wheel/sdist bằng thư viện chuẩn. Backend PEP 517 trong
pyproject.toml có `requires = []`; `python -m pip wheel --no-index --no-deps .` cũng build được offline.
Không nhân bản source: payload lấy từ files allowlist của package.json, gồm cả hidden OpenSpec template.
`python scripts/smoke-python.py` kiểm từng byte, cài wheel trong .venv, CLI, update/reinstall,
Node thiếu, và rebuild sdist offline. Không gọi npm để build/install wheel.

Workflow [npm-publish.yml](../.github/workflows/npm-publish.yml) build/test cả hai kênh từ cùng tag
Release Please, publish npm rồi publish PyPI bằng wheel đã kiểm. Maintainer cấu hình PyPI Trusted
Publisher cho project `notth`: owner `manh0303`, repository `notth`, workflow `npm-publish.yml`, environment `pypi`.
Đặt environment review theo chính sách repo. Theo [PyPA guide](https://packaging.python.org/en/latest/guides/publishing-package-distribution-releases-using-github-actions-ci-cd-workflows/).

Hai registry không có transaction chung: npm có thể thành công còn PyPI lỗi. Rerun **job publish-pypi**
của release đó khi đã sửa cấu hình, dùng cùng artifact; không đổi version để chữa lỗi xác thực.
Artifact có thời hạn lưu của Actions; nếu hết hạn, rebuild từ đúng tag và kiểm payload/version trước
khi publish phần thiếu. Feature PR không tự tag, merge hoặc publish.
