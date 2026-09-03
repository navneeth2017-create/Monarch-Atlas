# Monarch Atlas

**Monarch Atlas** is [graphify](https://github.com/Graphify-Labs/graphify) — the
open-source code-to-knowledge-graph tool by Safi Shamsi and the Graphify
contributors (Apache-2.0; see `LICENSE`, `LICENSE-MIT`, `NOTICE`) — shipped as a
Monarch product with our own viewer.

Everything graphify does, this does: tree-sitter extraction, community
detection, `graphify query / path / explain`, the Claude Code skill, the
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
pip install git+https://github.com/navneeth2017-create/monarch-atlas.git
graphify install          # registers the /graphify skill (unchanged)
graphify update .         # builds graphify-out/ with the Atlas viewer
```

Both `graphify` and `atlas` are installed as the same CLI.

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
| `pyproject.toml` | extra `atlas` console script. The distribution name stays `graphifyy` on purpose: upstream looks its own version up by that name in four places, and renaming it breaks `graphify --version` and the skill-version check. |
| `README.md` | This file, replacing upstream's README. upstream README edits are excluded from the sync patch (their README is always at the upstream link above). |
| `.upstream-sha`, `.github/workflows/upstream-sync.yml` | The upstream commit this tree matches; the sync workflow. |

Set `GRAPHIFY_THEME=classic` to get upstream's original viewer from the same
install.
