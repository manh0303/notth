"""Dependency-free PEP 517 backend. npm's files allowlist owns the shared payload."""
import base64
import csv
import hashlib
import io
import json
import pathlib
import re
import tarfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
NAME = "notth"


def package():
    doc = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", doc["version"]):
        raise ValueError("Python distribution requires a three-part release version")
    return doc


def payload():
    paths = {ROOT / p for p in ["package.json", "README.md", "LICENSE"]}
    for pattern in package()["files"]:
        for p in ROOT.glob(pattern.rstrip("/")):
            paths.update(p.rglob("*") if p.is_dir() else [p])
    result = {}
    for p in sorted(paths):
        if p.is_symlink():
            raise ValueError("Symlink in shared distribution payload")
        if p.is_file():
            result[p.relative_to(ROOT).as_posix()] = p.read_bytes()
    result["_python_distribution.json"] = (json.dumps({"name": NAME, "version": package()["version"]}) + "\n").encode()
    return result


def metadata():
    return ("Metadata-Version: 2.4\nName: " + NAME + "\nVersion: " + package()["version"] +
            "\nSummary: Notth shared workflows and Node.js CLI, installable without npm\n"
            "Requires-Python: >=3.9\nLicense-Expression: MIT\nLicense-File: LICENSE\n"
            "Project-URL: Repository, https://github.com/manh0303/notth\n"
            "Description-Content-Type: text/markdown\n\n" + (ROOT / "README.md").read_text(encoding="utf-8")).encode()


def metadata_files():
    folder = NAME + "-" + package()["version"] + ".dist-info/"
    return {folder + "METADATA": metadata(),
            folder + "WHEEL": b"Wheel-Version: 1.0\nGenerator: notth-pep517\nRoot-Is-Purelib: true\nTag: py3-none-any\n",
            folder + "entry_points.txt": b"[console_scripts]\naih = ai_harness.launcher:main\n",
            folder + "licenses/LICENSE": (ROOT / "LICENSE").read_bytes()}


def get_requires_for_build_wheel(config_settings=None):
    return []


def get_requires_for_build_sdist(config_settings=None):
    return []


def prepare_metadata_for_build_wheel(metadata_directory, config_settings=None):
    for name, data in metadata_files().items():
        target = pathlib.Path(metadata_directory) / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    return NAME + "-" + package()["version"] + ".dist-info"


def build_wheel(wheel_directory, config_settings=None, metadata_directory=None):
    files = metadata_files()
    for p in (ROOT / "python/ai_harness").glob("*.py"):
        files["ai_harness/" + p.name] = p.read_bytes()
    files.update({"ai_harness/_bundle/" + p: b for p, b in payload().items()})
    record = io.StringIO(newline="")
    writer = csv.writer(record, lineterminator="\n")
    for name, data in sorted(files.items()):
        hashed = base64.urlsafe_b64encode(hashlib.sha256(data).digest()).rstrip(b"=").decode()
        writer.writerow([name, "sha256=" + hashed, len(data)])
    record_name = NAME + "-" + package()["version"] + ".dist-info/RECORD"
    writer.writerow([record_name, "", ""])
    files[record_name] = record.getvalue().encode()
    filename = NAME + "-" + package()["version"] + "-py3-none-any.whl"
    pathlib.Path(wheel_directory).mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(pathlib.Path(wheel_directory) / filename, "w", zipfile.ZIP_DEFLATED) as wheel:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            wheel.writestr(info, data)
    return filename


def build_sdist(sdist_directory, config_settings=None):
    filename = NAME + "-" + package()["version"] + ".tar.gz"
    prefix = NAME + "-" + package()["version"]
    files = payload()
    files.pop("_python_distribution.json")
    for name in ["pyproject.toml", "python/build_backend.py", "python/ai_harness/__init__.py", "python/ai_harness/launcher.py"]:
        files[name] = (ROOT / name).read_bytes()
    files["PKG-INFO"] = metadata()
    pathlib.Path(sdist_directory).mkdir(parents=True, exist_ok=True)
    with tarfile.open(pathlib.Path(sdist_directory) / filename, "w:gz") as archive:
        for name, data in sorted(files.items()):
            entry = tarfile.TarInfo(prefix + "/" + name)
            entry.size = len(data); entry.mode = 0o644; entry.mtime = 1577836800
            archive.addfile(entry, io.BytesIO(data))
    return filename
