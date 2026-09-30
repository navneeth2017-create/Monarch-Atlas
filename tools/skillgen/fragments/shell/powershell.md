```powershell
# Detect Python with atlas — uv/pipx-aware (fixes #831)
New-Item -ItemType Directory -Force -Path atlas-out | Out-Null
$ATLAS_PYTHON = $null

function Find-AtlasPython {
    # 1. uv tool install — 'uv tool dir' is authoritative, respects UV_TOOL_DIR automatically
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        $uvDir = (uv tool dir 2>$null).Trim()
        if ($uvDir) {
            $py = Join-Path $uvDir "monarch-atlas\Scripts\python.exe"
            if (Test-Path $py) {
                & $py -c "import monarch_atlas" 2>$null
                if ($LASTEXITCODE -eq 0) { return $py }
            }
        }
    }
    # 2. pipx install — 'pipx environment' respects PIPX_HOME automatically
    if (Get-Command pipx -ErrorAction SilentlyContinue) {
        $venvs = (pipx environment --value PIPX_LOCAL_VENVS 2>$null).Trim()
        if ($venvs) {
            $py = Join-Path $venvs "monarch-atlas\Scripts\python.exe"
            if (Test-Path $py) {
                & $py -c "import monarch_atlas" 2>$null
                if ($LASTEXITCODE -eq 0) { return $py }
            }
        }
    }
    # 3. Active venv / conda / pip-into-current-env
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) {
        & $pyCmd.Source -c "import monarch_atlas" 2>$null
        if ($LASTEXITCODE -eq 0) {
            return (& $pyCmd.Source -c "import sys; print(sys.executable)").Trim()
        }
    }
    return $null
}

# Try to find the right Python (uv → pipx → active env)
$ATLAS_PYTHON = Find-AtlasPython

# Not found — install then re-detect
if (-not $ATLAS_PYTHON) {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv tool install --upgrade monarch-atlas -q 2>&1 | Select-Object -Last 3
    } else {
        pip install monarch-atlas -q 2>&1 | Select-Object -Last 3
    }
    $ATLAS_PYTHON = Find-AtlasPython
}

# Save interpreter path — all subsequent steps read this.
# `Out-File -Encoding utf8` always writes a BOM on Windows PowerShell 5.1 (utf8NoBOM
# only exists from PowerShell 6), and that BOM rides into the saved path, so the hook
# rebuild fails with WinError 123 (#3028). WriteAllText with an explicit BOM-less
# encoding writes the bytes POSIX writes, and adds no trailing newline.
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Join-Path $PWD 'atlas-out\.atlas_python'), [string]$ATLAS_PYTHON, $Utf8NoBom)
# Save scan root so `atlas update` (no args) knows where to look next time
[System.IO.File]::WriteAllText((Join-Path $PWD 'atlas-out\.atlas_root'), (Resolve-Path INPUT_PATH).Path, $Utf8NoBom)
```

If the import succeeds, print nothing and move straight to Step 2.

**In every subsequent block, run Python through the saved interpreter — `& (Get-Content atlas-out\.atlas_python)` in place of a bare `python3` — so every step uses the interpreter that actually has atlas.**
