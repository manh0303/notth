#!/usr/bin/env python3
"""Exercise an actual wheel/sdist, isolated pip installs and shared CLI without registry access."""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import tempfile
import venv
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))
import build_backend


def run(args, cwd, env=None, code=0):
    result = subprocess.run([str(a) for a in args], cwd=cwd, env=env, capture_output=True, text=True, timeout=120)
    assert result.returncode == code, result.stdout + result.stderr
    return result.stdout


def main():
    node = shutil.which("node")
    assert node, "Node.js 22+ is required for package smoke"
    with tempfile.TemporaryDirectory(prefix="aih-pip-") as folder:
        work = pathlib.Path(folder); dist = work / "dist"; dist.mkdir()
        wheel = dist / build_backend.build_wheel(str(dist))
        sdist = dist / build_backend.build_sdist(str(dist))
        assert wheel.name == "notth-" + build_backend.package()["version"] + "-py3-none-any.whl"
        assert sdist.name == "notth-" + build_backend.package()["version"] + ".tar.gz"
        # Compare every byte against the shared allowlist and require no Python runtime dependencies.
        with zipfile.ZipFile(wheel) as archive:
            for name, expected in build_backend.payload().items():
                assert archive.read("ai_harness/_bundle/" + name) == expected, name
            metadata = archive.read(build_backend.NAME + "-" + build_backend.package()["version"] + ".dist-info/METADATA").decode()
            assert "Requires-Dist:" not in metadata
            assert "\nName: notth\n" in metadata
            assert json.loads(archive.read("ai_harness/_bundle/_python_distribution.json"))["name"] == "notth"
            assert "Version: " + build_backend.package()["version"] in metadata
            assert not any("/tests/" in n or "/node_modules/" in n for n in archive.namelist())
        project = work / "project with spaces"; project.mkdir()
        venv.create(project / ".venv", with_pip=True)
        scripts = project / ".venv" / ("Scripts" if os.name == "nt" else "bin")
        python = scripts / ("python.exe" if os.name == "nt" else "python")
        aih = scripts / ("aih.exe" if os.name == "nt" else "aih")
        env = dict(os.environ, AIH_NODE=node, PIP_NO_INDEX="1", PIP_DISABLE_PIP_VERSION_CHECK="1")
        run([python, "-m", "pip", "install", "--no-index", "--no-deps", wheel], project, env)
        assert "Name: notth" in run([python, "-m", "pip", "show", "notth"], project, env)
        assert run([aih, "--version"], project, env).strip() == build_backend.package()["version"]
        expected = json.loads(run([node, ROOT / "bin/aih.js", "list"], project))
        assert json.loads(run([aih, "list"], project, env)) == expected
        run([aih, "init", "--host", "kiro", "--adapters", "java-spring"], project, env)
        assert json.loads(run([aih, "check"], project, env))["status"] == "ok"
        assert json.loads(run([aih, "workflow", "validate"], project, env))["workflows"][0]["id"] == "spec-to-code"
        run([aih, "update", "--dry-run"], project, env)
        run([aih, "start", "--compact", "--host", "codex"], project, env)
        (project / ".harness/local.md").write_text("# Retained user decisions\n", encoding="utf-8")
        run([python, "-m", "pip", "install", "--no-index", "--no-deps", "--force-reinstall", wheel], project, env)
        run([aih, "update"], project, env)
        assert (project / ".harness/local.md").read_text(encoding="utf-8") == "# Retained user decisions\n"
        missing = dict(env, AIH_NODE=str(work / "missing-node"))
        run([aih, "--version"], project, missing, code=2)
        # sdist must rebuild the exact wheel without reaching any index/build dependency.
        source = work / "source"; source.mkdir()
        with tarfile.open(sdist) as archive:
            archive.extractall(source, filter="data") if sys.version_info >= (3, 12) else archive.extractall(source)
        unpacked = next(source.iterdir())
        run([python, "-m", "pip", "wheel", "--no-index", "--no-deps", "--wheel-dir", work / "rebuilt", unpacked], work, env)
        rebuilt = next((work / "rebuilt").glob("*.whl"))
        assert rebuilt.read_bytes() == wheel.read_bytes(), "sdist and source wheels differ"
    print(json.dumps({"status": "ok", "version": build_backend.package()["version"], "checks": "offline wheel/sdist install, .venv overlap, byte parity, reinstall/update preservation, missing Node, no registry/build dependencies"}))


if __name__ == "__main__":
    main()
