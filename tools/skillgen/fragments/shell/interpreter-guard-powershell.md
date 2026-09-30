```powershell
if (-not (Test-Path atlas-out\.atlas_python)) {
    $ATLAS_PYTHON = $null
    $atlasCmd = Get-Command atlas -ErrorAction SilentlyContinue
    if ($atlasCmd) {
        # The interpreter that owns the atlas entry point sits next to it
        # (<env>\Scripts\python.exe for uv tool, pipx, and venv installs).
        $py = Join-Path (Split-Path $atlasCmd.Source) "python.exe"
        if (Test-Path $py) { $ATLAS_PYTHON = $py }
    }
    if (-not $ATLAS_PYTHON) { $ATLAS_PYTHON = "python" }
    New-Item -ItemType Directory -Force -Path atlas-out | Out-Null
    & $ATLAS_PYTHON -c "import sys; open('atlas-out/.atlas_python', 'w', encoding='utf-8').write(sys.executable)"
}
```
