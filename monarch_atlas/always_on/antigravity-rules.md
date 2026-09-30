---
trigger: always_on
description: Consult the atlas knowledge graph at atlas-out/ for codebase and architecture questions.
---

## atlas

This project has a atlas knowledge graph at atlas-out/.

Rules:
- For codebase or architecture questions, when `atlas-out/graph.json` exists, first run `atlas query "<question>"` (CLI) or `query_graph` (MCP). Use `atlas path "<A>" "<B>"` / `shortest_path` for relationships and `atlas explain "<concept>"` / `get_node` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If atlas-out/wiki/index.md exists, navigate it instead of reading raw files
- Read atlas-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context
- After modifying code files in this session, run `atlas update .` to keep the graph current (AST-only, no API cost)
