"""
Which distribution is this?

This is Monarch Atlas, a fork of graphify. It installs as ``monarch-atlas``;
upstream installs as ``graphifyy``. The same source tree has to work either
way — someone may still have the upstream package on a machine — so anything
that asks the packaging system about itself asks through here rather than
hard-coding a name that is only right half the time.

Getting this wrong is quiet rather than loud: a missing distribution makes the
version read "unknown", the extractor cache lose its versioning, and the atlas
updater forget where it was installed from. None of that raises.
"""

from importlib.metadata import PackageNotFoundError, distribution as _distribution, version as _version

#: Ours first, then upstream's.
NAMES = ("monarch-atlas", "graphifyy")

#: How to install this fork, for the hints shown when an extra is missing.
GIT_URL = "git+https://github.com/navneeth2017-create/monarch-atlas.git"


def dist():
    """The installed distribution, whichever name it went in under, or None."""
    for name in NAMES:
        try:
            return _distribution(name)
        except PackageNotFoundError:
            continue
    return None


def name() -> str:
    """The name it is actually installed under, falling back to ours."""
    d = dist()
    return (d.metadata["Name"] if d is not None else NAMES[0]) or NAMES[0]


def version(default: str = "unknown") -> str:
    for n in NAMES:
        try:
            return _version(n)
        except Exception:
            continue
    return default


def install_hint(extra: str = "") -> str:
    """What to type to get a missing extra, pointed at this fork rather than upstream."""
    target = f"monarch-atlas[{extra}]" if extra else "monarch-atlas"
    return f'pip install "{target} @ {GIT_URL}"'
