# atlas reference: commit hook and native AGENTS.md integration

Load this when the user asked to install the post-commit hook or wire atlas into a project's AGENTS.md.

## For git commit hook

Install a post-commit hook that auto-rebuilds the graph after every commit. No background process needed - triggers once per commit, works with any editor.

```bash
atlas hook install    # install
atlas hook uninstall  # remove
atlas hook status     # check
```

After every `git commit`, the hook detects which code files changed (via `git diff HEAD~1`), re-runs AST extraction on those files, and rebuilds `graph.json` and `GRAPH_REPORT.md`. Doc/image changes are ignored by the hook - run `/atlas --update` manually for those.

If a post-commit hook already exists, atlas appends to it rather than replacing it.

---

## For native AGENTS.md integration

Run once per project to make atlas always-on in your agent sessions:

```bash
atlas agents install
```

This writes a `## atlas` section to the local `AGENTS.md` that instructs your agent to check the graph before answering codebase questions and rebuild it after code changes. No manual `/atlas` needed in future sessions.

```bash
atlas agents uninstall  # remove the section
```
