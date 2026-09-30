# Monarch Atlas

**Monarch Atlas** turns a folder of code into a queryable knowledge graph and
draws it as a 3D galaxy. It's Monarch's in-house tool: tree-sitter extraction,
community detection, `atlas query / path / explain`, the Claude Code skill and
the commit hook, with the Monarch viewer in every **`graph.html`** it writes:

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
- skins and games, and Monarch Atlas branding and accent

## Install

```bash
pip install git+https://github.com/navneeth2017-create/Monarch-Atlas.git
atlas install             # registers the /atlas skill
atlas update .            # builds atlas-out/ with the Atlas viewer
```

The graph lives in `atlas-out/`. Keep files out of it with `.atlasignore`
(same syntax as `.gitignore`), and add `atlas-out/graph.json merge=atlas` to
`.gitattributes` so two branches' graphs merge cleanly (`atlas hook install`
does both the git hooks and the merge driver).

## All your repos in one universe

```bash
python -m monarch_atlas.atlas_merge --out universe.html --title "Monarch Universe" \
    AddyDSD=../addydsd WowCow=../wowcow Monarch=../monarch-backend \
    --links links.json
```

Each repo becomes its own galaxy; `links.json` (optional) adds the integrations
Atlas can't see from inside one repo — API calls between repos, a shared
database, outside services like Stripe — and a `Services` galaxy at the centre.
See the docstring in `monarch_atlas/atlas_merge.py` for the file format.

## It updates itself

Two layers, so a push to `main` reaches everyone without anyone reinstalling:

- **The viewer is live.** Every `graph.html` carries only its data; the viewer
  (`monarch_atlas/exporters/atlas_viewer.js`) is fetched from this repo through
  jsDelivr each time a map is opened, so new skins, creatures and controls show
  up in maps that were built weeks ago. The page keeps its own copy as a
  fallback for offline use, blocked networks, or a data format the live viewer
  no longer reads. Set `ATLAS_LOCAL=1` at build time to skip the remote
  entirely (self-hosted, locked-down deployments).
- **The package upgrades itself.** Once a day, when a graph is built, the
  installed version is compared with the newest commit on `main`; if it's
  behind, `pip` upgrades it in the background and prints one line. Turn that
  off with `ATLAS_NO_SELF_UPDATE=1`. Editable installs and CI are never
  touched.

Set `ATLAS_THEME=classic` for the plain classic viewer instead of the galaxy.

## Credits

Monarch Atlas began as a fork of an Apache-2.0 open-source project and is now
developed in-house. The original authors' copyright and license notices are
kept, as the license requires, in `LICENSE`, `LICENSE-MIT` and `NOTICE`.
