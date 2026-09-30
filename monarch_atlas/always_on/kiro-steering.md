---
inclusion: always
---

atlas: A knowledge graph of this project lives in `atlas-out/`. For codebase, architecture, or dependency questions, when `atlas-out/graph.json` exists, first run `atlas query "<question>"` (or `atlas path "<A>" "<B>"` / `atlas explain "<concept>"`). These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output. Read `GRAPH_REPORT.md` only for broad architecture review or when those commands do not surface enough context.
