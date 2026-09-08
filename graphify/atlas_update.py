"""Keep an installed Monarch Atlas current on its own.

Once a day, when a graph is built, ask GitHub for the newest commit on main.
If it's newer than the installed build, upgrade the package in the background
and say so in one line — the next run uses it. Opt out with
GRAPHIFY_NO_SELF_UPDATE=1. Editable installs (a developer's checkout), CI and
test runs are never touched. The viewer inside every graph.html updates itself
separately (see exporters/atlas_html.py); this covers the Python side.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

REPO = "navneeth2017-create/Monarch-Atlas"
INSTALL_URL = f"git+https://github.com/{REPO}.git"
CHECK_EVERY = 24 * 3600


def _cache_file() -> Path:
    base = os.environ.get("XDG_CACHE_HOME") or os.path.join(os.path.expanduser("~"), ".cache")
    return Path(base) / "monarch-atlas" / "update.json"


def installed_commit() -> str | None:
    """The commit pip installed from, or None for an editable / non-git install."""
    try:
        from importlib import metadata
        raw = metadata.distribution("graphifyy").read_text("direct_url.json")
        if not raw:
            return None
        info = json.loads(raw)
        if info.get("dir_info", {}).get("editable"):
            return None
        return (info.get("vcs_info") or {}).get("commit_id") or None
    except Exception:
        return None


def latest_commit(timeout: float = 4.0) -> str | None:
    try:
        from urllib.request import Request, urlopen
        req = Request(f"https://api.github.com/repos/{REPO}/commits/main",
                      headers={"Accept": "application/vnd.github.sha", "User-Agent": "monarch-atlas-self-update"})
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode("ascii", "ignore").strip() or None
    except Exception:
        return None


def maybe_self_update(*, now: float | None = None) -> str | None:
    """Returns the short sha being upgraded to, or None when nothing was done."""
    env = os.environ
    if env.get("GRAPHIFY_NO_SELF_UPDATE", "").strip().lower() in ("1", "true", "yes"):
        return None
    if "PYTEST_CURRENT_TEST" in env or env.get("CI"):
        return None
    installed = installed_commit()
    if not installed:
        return None
    now = time.time() if now is None else now
    cache = _cache_file()
    try:
        state = json.loads(cache.read_text(encoding="utf-8"))
    except Exception:
        state = {}
    if now - float(state.get("checked", 0)) < CHECK_EVERY:
        return None
    latest = latest_commit()
    state["checked"] = now
    if latest:
        state["latest"] = latest
    try:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(state), encoding="utf-8")
    except Exception:
        pass
    if not latest or latest == installed or state.get("upgrading") == latest:
        return None
    log = cache.parent / "upgrade.log"
    try:
        with open(log, "ab") as fh:
            subprocess.Popen(
                [sys.executable, "-m", "pip", "install", "--quiet", "--upgrade", "--no-input", INSTALL_URL],
                stdout=fh, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
                start_new_session=True,
            )
        state["upgrading"] = latest
        cache.write_text(json.dumps(state), encoding="utf-8")
    except Exception:
        return None
    short = latest[:7]
    print(f"Monarch Atlas: newer build {short} on GitHub — upgrading in the background, the next run uses it "
          f"(GRAPHIFY_NO_SELF_UPDATE=1 turns this off).", file=sys.stderr)
    return short
