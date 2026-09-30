# atlas reference: GitHub clone and cross-repo merge

Load this when the user passed one or more `https://github.com/...` URLs, or named several local subfolders to merge into one graph.

### Step 0 - Clone GitHub repo(s) (only if a GitHub URL was given)

**Single repo:**
```bash
LOCAL_PATH=$(atlas clone <github-url> [--branch <branch>])
# Use LOCAL_PATH as the target for all subsequent steps
```

**Multiple repos (cross-repo graph):**
```bash
# Clone each repo, run the full pipeline on each, then merge
atlas clone <url1>   # → ~/.atlas/repos/<owner1>/<repo1>
atlas clone <url2>   # → ~/.atlas/repos/<owner2>/<repo2>
# Run /atlas on each local path to produce their graph.json files
# Then merge:
atlas merge-graphs \
  ~/.atlas/repos/<owner1>/<repo1>/atlas-out/graph.json \
  ~/.atlas/repos/<owner2>/<repo2>/atlas-out/graph.json \
  --out atlas-out/cross-repo-graph.json
```

Atlas clones into `~/.atlas/repos/<owner>/<repo>` and reuses existing clones on repeat runs. Each node in the merged graph carries a `repo` attribute so you can filter by origin.

**Multiple local subfolders (monorepo or multi-service layout):**

The skill pipeline writes all intermediate and final outputs to `atlas-out/` in the current working directory. Running the skill on each subfolder separately will clobber the same output dir. Instead, use the CLI directly for each subfolder — it places `atlas-out/` *inside* the scanned path:

```bash
atlas extract ./core/     # → ./core/atlas-out/graph.json
atlas extract ./service/  # → ./service/atlas-out/graph.json
atlas extract ./platform/ # → ./platform/atlas-out/graph.json
# Add --backend gemini|kimi|openai|deepseek|claude-cli depending on which API key you have set

# Then merge at the project root:
atlas merge-graphs \
  ./core/atlas-out/graph.json \
  ./service/atlas-out/graph.json \
  ./platform/atlas-out/graph.json \
  --out atlas-out/graph.json
```

Once `atlas-out/graph.json` exists, the fast path above takes over: any codebase question runs `atlas query` directly on the merged graph — no re-extraction, no size gate.
