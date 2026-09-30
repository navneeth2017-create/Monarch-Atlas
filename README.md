# Monarch Atlas

**Monarch Atlas** is [graphify](https://github.com/Graphify-Labs/graphify) — the
open-source code-to-knowledge-graph tool by Safi Shamsi and the Graphify
contributors (Apache-2.0; see `LICENSE`, `LICENSE-MIT`, `NOTICE`) — shipped as a
Monarch product with our own viewer.

Everything graphify does, this does: tree-sitter extraction, community
detection, `atlas query / path / explain`, the Claude Code skill, the
commit hook. What's different is the **`graph.html`** it writes:

- **3D galaxy (default).** Every community is a solar system: its hub is the
  sun, the other members orbit it on tilted rings, and the systems are laid
  out as a galaxy. Click a group in the list (or double-click a sun) and the
  camera flies through the galaxy into that system; member names fade in
  once you're inside. Hover lights up a node's connections; Esc flies back out.
- **2D map.** The dark, Obsidian-style flat map — same data, same card,
  one click away on the 3D / 2D switch. Labels fade in as you zoom, hover
  traces a node's neighborhood.
- a floating **Graph** card with **Filters** (search, inferred-edge toggle),
  **Groups** (every community, toggleable, click to fly), **Display** (labels,
  node size, link brightness) and **Motion** (auto-rotate, spacing) or
  **Forces** (live physics) depending on the view
- a preview card for the selected node: file, connections in and out, one
  click to jump along an edge or fly into its group
- Monarch Atlas branding and accent

## Install

```bash
pip install git+https://github.com/navneeth2017-create/Monarch-Atlas.git
atlas install             # registers the /graphify skill (unchanged)
atlas update .            # builds atlas-out/ with the Atlas viewer
```

`atlas` is the command; `graphify` is installed as the same CLI. The graph lives
in `atlas-out/`. A project built before the rename keeps working from its
`graphify-out/` until you move it: `git mv graphify-out atlas-out` (and change
`graphify-out/graph.json merge=graphify` in `.gitattributes` to
`atlas-out/graph.json merge=atlas`).

## All your repos in one universe

```bash
python -m graphify.atlas_merge --out universe.html --title "Monarch Universe" \
    AddyDSD=../addydsd WowCow=../wowcow Monarch=../monarch-backend \
    --links links.json
```

Each repo becomes its own galaxy; `links.json` (optional) adds the integrations
graphify can't see from inside one repo — API calls between repos, a shared
database, outside services like Stripe — and a `Services` galaxy at the centre.
See the docstring in `graphify/atlas_merge.py` for the file format.

## It updates itself

Two layers, so a push to `main` reaches everyone without anyone reinstalling:

- **The viewer is live.** Every `graph.html` carries only its data; the viewer
  (`graphify/exporters/atlas_viewer.js`) is fetched from this repo through
  jsDelivr each time a map is opened, so new skins, creatures and controls show
  up in maps that were built weeks ago. The page keeps its own copy as a
  fallback for offline use, blocked networks, or a data format the live viewer
  no longer reads. Set `GRAPHIFY_ATLAS_LOCAL=1` at build time to skip the
  remote entirely (self-hosted, locked-down deployments).
- **The package upgrades itself.** Once a day, when a graph is built, the
  installed version is compared with the newest commit on `main`; if it's
  behind, `pip` upgrades it in the background and prints one line. Turn that
  off with `GRAPHIFY_NO_SELF_UPDATE=1`. Editable installs and CI are never
  touched.

## How this fork stays current

`.github/workflows/upstream-sync.yml` runs daily. It fetches upstream `v8`,
takes everything they changed since the commit recorded in `.upstream-sha`,
applies it here as one commit, smoke-tests that the Atlas viewer still
renders, and pushes. This repo's history is its own — upstream commits never
enter it. If the patch doesn't apply cleanly or the smoke test fails, nothing
is pushed and an issue is opened naming the files that need a human.

## What we changed (keep this list honest — it's the merge map)

| File | Change |
|---|---|
| `graphify/exporters/atlas_html.py` | **New.** The Atlas viewer: styles, script, document. |
| `graphify/exporters/html.py` | 6-line hook at the end of `to_html`: uses the Atlas document unless `GRAPHIFY_THEME=classic`. |
| `graphify/atlas_merge.py` | **New.** Merges several repos' graphs into one universe with realms and cross-repo links. |
| `graphify/atlas_cli.py` | **New.** The `atlas`/`graphify` entry point: picks `atlas-out/` (or a not-yet-moved `graphify-out/`) for the repo a command points at, and words the Claude Code `hook-guard` reminders with `atlas`. |
| `graphify/paths.py` | Default output folder `atlas-out`, falling back to an existing `graphify-out` (`default_out_name`). |
| `graphify/hooks.py` | Git-hook scripts use the same folder fallback; the graph.json merge driver is named `atlas` (legacy `merge=graphify` lines are recognised and upgraded). |
| `graphify/detect.py`, `graphify/exporters/html.py` | `atlas-out` treated like `graphify-out` (never scanned as source; portable page title); `.atlasignore` works like `.graphifyignore`. |
| `conftest.py`, `tests/test_atlas_naming.py`, `tests/test_hooks.py` | Upstream tests run with `GRAPHIFY_OUT=graphify-out`; our naming has its own tests; merge-driver assertions say `atlas`. |
| `pyproject.toml` | `atlas` and `graphify` console scripts both start `graphify.atlas_cli`. The distribution name stays `graphifyy` on purpose: upstream looks its own version up by that name in four places, and renaming it breaks `graphify --version` and the skill-version check. |
| `README.md` | This file, replacing upstream's README. upstream README edits are excluded from the sync patch (their README is always at the upstream link above). |
| `.upstream-sha`, `.github/workflows/upstream-sync.yml` | The upstream commit this tree matches; the sync workflow. |

Set `GRAPHIFY_THEME=classic` to get upstream's original viewer from the same
install.
