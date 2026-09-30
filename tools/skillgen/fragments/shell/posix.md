```bash
# Detect the correct Python interpreter (handles uv tool, pipx, venv, system installs)
PYTHON=""
ATLAS_BIN=$(which atlas 2>/dev/null)
# 1. uv tool installs — most reliable on modern Mac/Linux
if [ -z "$PYTHON" ] && command -v uv >/dev/null 2>&1; then
    _UV_PY=$(uv tool run --from monarch-atlas python -c "import sys; print(sys.executable)" 2>/dev/null)
    if [ -n "$_UV_PY" ]; then PYTHON="$_UV_PY"; fi
fi
# 2. Read shebang from monarch_atlas binary (pipx and direct pip installs)
if [ -z "$PYTHON" ] && [ -n "$ATLAS_BIN" ]; then
    _SHEBANG=$(head -1 "$ATLAS_BIN" | tr -d '#!')
    case "$_SHEBANG" in
        *[!a-zA-Z0-9/_.@-]*) ;;
        *) "$_SHEBANG" -c "import monarch_atlas" 2>/dev/null && PYTHON="$_SHEBANG" ;;
    esac
fi
# 3. Fall back to python3
if [ -z "$PYTHON" ]; then PYTHON="python3"; fi
if ! "$PYTHON" -c "import monarch_atlas" 2>/dev/null; then
    if command -v uv >/dev/null 2>&1; then
        uv tool install --upgrade monarch-atlas -q 2>&1 | tail -3
        _UV_PY=$(uv tool run --from monarch-atlas python -c "import sys; print(sys.executable)" 2>/dev/null)
        if [ -n "$_UV_PY" ]; then PYTHON="$_UV_PY"; fi
    else
        "$PYTHON" -m pip install monarch-atlas -q 2>/dev/null \
          || "$PYTHON" -m pip install monarch-atlas -q --break-system-packages 2>&1 | tail -3
    fi
fi
# Write interpreter path for all subsequent steps (persists across invocations)
mkdir -p atlas-out
"$PYTHON" -c "import sys; open('atlas-out/.atlas_python', 'w', encoding='utf-8').write(sys.executable)"
# Save scan root so `atlas update` (no args) knows where to look next time
echo "$(cd INPUT_PATH && pwd)" > atlas-out/.atlas_root
```

If the import succeeds, print nothing and move straight to Step 2.

**In every subsequent bash block, replace `python3` with `$(cat atlas-out/.atlas_python)` to use the correct interpreter.**
