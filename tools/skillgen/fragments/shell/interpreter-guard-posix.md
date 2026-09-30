```bash
if [ ! -f atlas-out/.atlas_python ]; then
    ATLAS_BIN=$(which atlas 2>/dev/null)
    if [ -n "$ATLAS_BIN" ]; then
        PYTHON=$(head -1 "$ATLAS_BIN" | tr -d '#!')
        case "$PYTHON" in *[!a-zA-Z0-9/_.@-]*) PYTHON="python3" ;; esac
    else
        PYTHON="python3"
    fi
    mkdir -p atlas-out
    "$PYTHON" -c "import sys; open('atlas-out/.atlas_python', 'w', encoding='utf-8').write(sys.executable)"
fi
```
