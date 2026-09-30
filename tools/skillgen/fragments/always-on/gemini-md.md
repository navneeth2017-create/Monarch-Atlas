## atlas

This project has a knowledge graph at atlas-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `atlas query "<question>"` when atlas-out/graph.json exists. Use `atlas path "<A>" "<B>"` for relationships and `atlas explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If atlas-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read atlas-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `atlas update .` to keep the graph current (AST-only, no API cost).
