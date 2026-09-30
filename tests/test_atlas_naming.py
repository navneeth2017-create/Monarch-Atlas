"""Monarch Atlas naming: atlas-out/ folder, `atlas` wording, `atlas` merge driver, .atlasignore."""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from monarch_atlas import hooks

REPO = Path(__file__).resolve().parents[1]
OLD_NAME = "graph" + "ify"  # the upstream project Monarch Atlas started from; nothing should carry its name


def _hook_guard(cwd, kind="search"):
    env = {k: v for k, v in os.environ.items() if k != "ATLAS_OUT"}
    env["PYTHONPATH"] = str(REPO)
    res = subprocess.run(
        [sys.executable, "-m", "monarch_atlas", "hook-guard", kind], cwd=cwd, env=env,
        capture_output=True, text=True, timeout=60,
        input=json.dumps({"tool_name": "Grep", "tool_input": {"pattern": "x"}}),
    )
    assert res.returncode == 0, res.stderr
    return res.stdout


def test_hook_guard_speaks_atlas(tmp_path):
    (tmp_path / "atlas-out").mkdir()
    (tmp_path / "atlas-out" / "graph.json").write_text("{}")
    msg = json.loads(_hook_guard(tmp_path))["hookSpecificOutput"]["additionalContext"]
    assert "atlas-out/graph.json exists" in msg and "`atlas query" in msg


def test_hook_guard_quiet_without_graph(tmp_path):
    assert _hook_guard(tmp_path) == ""


def test_merge_driver_is_atlas(tmp_path):
    assert hooks._merge_attr_line().endswith("graph.json merge=atlas")
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    attrs = tmp_path / ".gitattributes"
    attrs.write_text("*.png binary\n")
    hooks._register_merge_driver(tmp_path)
    assert "atlas-out/graph.json merge=atlas" in attrs.read_text()
    assert hooks._merge_driver_status(tmp_path) == "registered"
    hooks._unregister_merge_driver(tmp_path)
    assert attrs.read_text() == "*.png binary\n"


def test_universe_merge_reads_atlas_out(tmp_path):
    from monarch_atlas.atlas_merge import _load_repo
    (tmp_path / "atlas-out").mkdir()
    (tmp_path / "atlas-out" / "graph.json").write_text(json.dumps({"nodes": [], "links": []}))
    raw, labels = _load_repo("Repo", str(tmp_path))
    assert raw == {"nodes": [], "links": []} and labels == {}


def test_atlasignore_excludes(tmp_path):
    from monarch_atlas.detect import detect
    (tmp_path / "app.py").write_text("def main():\n    return 1\n")
    (tmp_path / "vendor").mkdir()
    (tmp_path / "vendor" / "lib.py").write_text("def lib():\n    return 2\n")
    (tmp_path / ".atlasignore").write_text("# not our code\nvendor/\n")
    found = json.dumps(detect(tmp_path), default=str)
    assert "app.py" in found and "lib.py" not in found


def test_no_upstream_name_left():
    # The license files keep the original authors' credit (Apache-2.0 requires it); nothing else may.
    hits = subprocess.run(
        ["git", "-C", str(REPO), "grep", "-I", "-i", "-l", OLD_NAME, "--", ".",
         ":!LICENSE", ":!LICENSE-MIT", ":!NOTICE"],
        capture_output=True, text=True,
    ).stdout.split()
    assert hits == [], hits
