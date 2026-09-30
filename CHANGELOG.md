# Changelog

## 0.10.0 — in-house

- Monarch Atlas is developed in-house: the Python package is `monarch_atlas`,
  the command is `atlas` (MCP server: `atlas-mcp`), and nothing is synced from
  the project it started from any more.
- The graph folder is `atlas-out/`, exclusions go in `.atlasignore`, the
  graph.json merge driver is `merge=atlas`, and environment settings are
  `ATLAS_*` (for example `ATLAS_OUT`, `ATLAS_THEME`, `ATLAS_LOCAL`).
- Earlier history is in git.
