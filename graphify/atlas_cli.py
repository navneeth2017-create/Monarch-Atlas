"""Monarch Atlas command line — the `atlas` command (and `graphify`, the same tool).

Runs graphify's CLI with the Monarch naming, kept in this one file so the daily
upstream sync never has to merge it:

* The graph folder is ``atlas-out/``. A project built before the rename keeps
  its ``graphify-out/`` until it is moved (``git mv graphify-out atlas-out``).
  The choice is made for the repo a command points at (``atlas update ../wowcow``),
  not the directory it happens to run from.
* The reminders Claude Code gets from ``hook-guard`` name the ``atlas`` command
  and the project's real graph folder.
"""
from __future__ import annotations

import os
import re
import sys

# Subcommands whose first argument is the project directory.
_PATH_CMDS = {"update", "watch", "cluster-only", "label", "check-update", "extract"}


def _target_root(argv: list[str]) -> str:
    """The project directory a command line points at ('.' when none)."""
    args = [a for a in argv[1:] if not a.startswith("-")]
    if args and args[0] in _PATH_CMDS:
        return args[1] if len(args) > 1 and os.path.isdir(args[1]) else "."
    if args and os.path.isdir(args[0]):
        return args[0]  # `atlas <path>` runs an extract on it
    return "."


def _brand(text: str, out: str) -> str:
    """graphify's wording, with Monarch Atlas's command and folder names."""
    text = text.replace("graphify-out/", out.rstrip("/") + "/")
    return re.sub(r"\bgraphify\b(?!-out)", "atlas", text)


def _rebrand_hook_messages() -> None:
    from graphify import cli
    from graphify.paths import GRAPHIFY_OUT

    for name in ("_SEARCH_NUDGE", "_READ_NUDGE", "_READ_NUDGE_STALE", "_READ_DENY", "_GEMINI_NUDGE_TEXT"):
        if isinstance(getattr(cli, name, None), str):
            setattr(cli, name, _brand(getattr(cli, name), GRAPHIFY_OUT))


def _out_name_for(root: str) -> str:
    """Same rule as graphify.paths.default_out_name, without importing graphify.paths
    (it reads GRAPHIFY_OUT once, at import, so this must run first)."""
    if not os.path.isdir(os.path.join(root, "atlas-out")) and os.path.isdir(os.path.join(root, "graphify-out")):
        return "graphify-out"
    return "atlas-out"


def main() -> None:
    if os.environ.get("GRAPHIFY_OUT") is None:
        os.environ["GRAPHIFY_OUT"] = _out_name_for(_target_root(sys.argv))
    if len(sys.argv) > 1 and sys.argv[1] == "hook-guard":
        _rebrand_hook_messages()
    from graphify.__main__ import main as graphify_main

    graphify_main()


if __name__ == "__main__":
    main()
