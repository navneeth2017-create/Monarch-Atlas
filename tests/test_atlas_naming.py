"""Monarch Atlas naming: atlas-out/ folder, `atlas` wording, `atlas` merge driver."""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from graphify import atlas_cli
from graphify.paths import default_out_name
from graphify import hooks

REPO = Path(__file__).resolve().parents[1]


def test_default_out_name_prefers_atlas_out(tmp_path):
    assert default_out_name(tmp_path) == "atlas-out"            # fresh project
    (tmp_path / "graphify-out").mkdir()
    assert default_out_name(tmp_path) == "graphify-out"         # built before the rename
    (tmp_path / "atlas-out").mkdir()
    assert default_out_name(tmp_path) == "atlas-out"            # moved


def test_cli_rule_matches_paths_rule(tmp_path):
    for dirs in ([], ["graphify-out"], ["atlas-out"], ["graphify-out", "atlas-out"]):
        root = tmp_path / "-".join(dirs or ["none"])
        root.mkdir()
        for d in dirs:
            (root / d).mkdir()
        assert atlas_cli._out_name_for(str(root)) == default_out_name(root)


def test_target_root(tmp_path):
    d = str(tmp_path)
    assert atlas_cli._target_root(["atlas", "update", d]) == d
    assert atlas_cli._target_root(["atlas", "update", "--force", d]) == d
    assert atlas_cli._target_root(["atlas", d]) == d
    assert atlas_cli._target_root(["atlas", "query", "where is auth"]) == "."
    assert atlas_cli._target_root(["atlas", "hook-guard", "search"]) == "."
    assert atlas_cli._target_root(["atlas", "update", str(tmp_path / "missing")]) == "."


def _hook_guard(cwd, kind="search", payload=None):
    env = {k: v for k, v in os.environ.items() if k != "GRAPHIFY_OUT"}
    env["PYTHONPATH"] = str(REPO)
    code = f"import sys; sys.argv = ['atlas', 'hook-guard', {kind!r}]; from graphify.atlas_cli import main; main()"
    res = subprocess.run(
        [sys.executable, "-c", code], cwd=cwd, env=env, capture_output=True, text=True,
        input=json.dumps(payload or {"tool_name": "Grep", "tool_input": {"pattern": "x"}}), timeout=60,
    )
    assert res.returncode == 0, res.stderr
    return res.stdout


@pytest.mark.parametrize("folder", ["atlas-out", "graphify-out"])
def test_hook_guard_speaks_atlas(tmp_path, folder):
    (tmp_path / folder).mkdir()
    (tmp_path / folder / "graph.json").write_text("{}")
    msg = json.loads(_hook_guard(tmp_path))["hookSpecificOutput"]["additionalContext"]
    assert "`atlas query" in msg
    assert f"{folder}/graph.json exists" in msg
    assert "graphify query" not in msg and "run graphify" not in msg


def test_hook_guard_quiet_without_graph(tmp_path):
    assert _hook_guard(tmp_path) == ""


def test_merge_attr_line_uses_atlas(tmp_path, monkeypatch):
    monkeypatch.setattr("graphify.paths.GRAPHIFY_OUT", "atlas-out")
    assert hooks._merge_attr_line() == "atlas-out/graph.json merge=atlas"
    assert hooks._has_merge_attr("atlas-out/graph.json merge=atlas\n")
    assert hooks._has_merge_attr("graphify-out/graph.json merge=graphify\n")   # legacy still recognised
    assert not hooks._has_merge_attr("# atlas-out/graph.json merge=atlas\n")


def test_register_upgrades_legacy_driver(tmp_path):
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    attrs = tmp_path / ".gitattributes"
    attrs.write_text("*.png binary\ngraphify-out/graph.json merge=graphify\n")
    out = hooks._register_merge_driver(tmp_path)
    assert "renamed" in out
    assert attrs.read_text() == "*.png binary\ngraphify-out/graph.json merge=atlas\n"
    cfg = subprocess.run(["git", "-C", str(tmp_path), "config", "--get", "merge.atlas.driver"],
                         capture_output=True, text=True)
    assert "merge-driver %O %A %B" in cfg.stdout
    assert hooks._merge_driver_status(tmp_path) == "registered"
    hooks._unregister_merge_driver(tmp_path)
    assert attrs.read_text() == "*.png binary\n"


@pytest.mark.parametrize("folder", ["atlas-out", "graphify-out"])
def test_universe_merge_reads_either_folder(tmp_path, folder):
    from graphify.atlas_merge import _load_repo
    (tmp_path / folder).mkdir()
    (tmp_path / folder / "graph.json").write_text(json.dumps({"nodes": [], "links": []}))
    raw, labels = _load_repo("Repo", str(tmp_path))
    assert raw == {"nodes": [], "links": []} and labels == {}


def test_atlas_out_is_never_scanned_as_source():
    from graphify import detect
    src = Path(detect.__file__).read_text(encoding="utf-8")
    assert '"atlas-out"' in src


def test_atlasignore_excludes_like_graphifyignore(tmp_path):
    from graphify.detect import detect
    (tmp_path / "app.py").write_text("def main():\n    return 1\n")
    (tmp_path / "vendor").mkdir()
    (tmp_path / "vendor" / "lib.py").write_text("def lib():\n    return 2\n")
    (tmp_path / ".atlasignore").write_text("# not our code\nvendor/\n")
    found = json.dumps(detect(tmp_path), default=str)
    assert "app.py" in found and "lib.py" not in found
