## atlas

This project has a knowledge graph at atlas-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/atlas`, use the installed atlas skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `atlas query "<question>"` when atlas-out/graph.json exists. Use `atlas path "<A>" "<B>"` for relationships and `atlas explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty atlas-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip atlas. Only skip atlas if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If atlas-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read atlas-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `atlas update .` to keep the graph current (AST-only, no API cost).
