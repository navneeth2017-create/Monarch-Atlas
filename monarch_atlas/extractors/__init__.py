"""Per-language extractors, incrementally migrated out of monarch_atlas/extract.py.

Dispatch still flows through monarch_atlas.extract (the facade re-exports every
moved name), so importing from monarch_atlas.extract keeps working unchanged.
LANGUAGE_EXTRACTORS is the registry seed; wiring dispatch through it is a
later, separate step. See MIGRATION.md for how to port another language.
"""
from __future__ import annotations

from pathlib import Path
from typing import Callable

from monarch_atlas.extractors.apex import extract_apex
from monarch_atlas.extractors.bash import extract_bash
from monarch_atlas.extractors.blade import extract_blade
from monarch_atlas.extractors.cobol import extract_cobol
from monarch_atlas.extractors.commonlisp import extract_commonlisp
from monarch_atlas.extractors.dart import extract_dart
from monarch_atlas.extractors.dm import extract_dm, extract_dmf, extract_dmi, extract_dmm
from monarch_atlas.extractors.elixir import extract_elixir
from monarch_atlas.extractors.erlang import extract_erlang
from monarch_atlas.extractors.fortran import extract_fortran
from monarch_atlas.extractors.go import extract_go
from monarch_atlas.extractors.json_config import extract_json
from monarch_atlas.extractors.julia import extract_julia
from monarch_atlas.extractors.markdown import extract_markdown
from monarch_atlas.extractors.objc import extract_objc
from monarch_atlas.extractors.pascal import extract_pascal
from monarch_atlas.extractors.pascal_forms import extract_delphi_form, extract_lazarus_form
from monarch_atlas.extractors.powershell import extract_powershell, extract_powershell_manifest
from monarch_atlas.extractors.r import extract_r
from monarch_atlas.extractors.razor import extract_razor
from monarch_atlas.extractors.rust import extract_rust
from monarch_atlas.extractors.sln import extract_sln
from monarch_atlas.extractors.solidity import extract_solidity
from monarch_atlas.extractors.sql import extract_sql
from monarch_atlas.extractors.terraform import extract_terraform
from monarch_atlas.extractors.verilog import extract_verilog
from monarch_atlas.extractors.vbnet import extract_vbnet
from monarch_atlas.extractors.zig import extract_zig

LANGUAGE_EXTRACTORS: dict[str, Callable[[Path], dict]] = {
    "apex": extract_apex,
    "bash": extract_bash,
    "blade": extract_blade,
    "cobol": extract_cobol,
    "commonlisp": extract_commonlisp,
    "dart": extract_dart,
    "delphi_form": extract_delphi_form,
    "dm": extract_dm,
    "dmf": extract_dmf,
    "dmi": extract_dmi,
    "dmm": extract_dmm,
    "elixir": extract_elixir,
    "erlang": extract_erlang,
    "fortran": extract_fortran,
    "go": extract_go,
    "json": extract_json,
    "julia": extract_julia,
    "lazarus_form": extract_lazarus_form,
    "markdown": extract_markdown,
    "objc": extract_objc,
    "pascal": extract_pascal,
    "powershell": extract_powershell,
    "powershell_manifest": extract_powershell_manifest,
    "r": extract_r,
    "razor": extract_razor,
    "rust": extract_rust,
    "sln": extract_sln,
    "solidity": extract_solidity,
    "sql": extract_sql,
    "terraform": extract_terraform,
    "verilog": extract_verilog,
    "vbnet": extract_vbnet,
    "zig": extract_zig,
}
