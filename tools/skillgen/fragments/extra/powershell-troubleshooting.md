## Troubleshooting

### PowerShell 5.1: Vertical scrolling stops working

If vertical scrolling breaks in PowerShell after running atlas, this is caused by ANSI escape sequences from the `graspologic` library. Atlas v0.3.10+ suppresses this output, but if you still see the issue:

1. **Upgrade atlas**: `pip install --upgrade monarch-atlas`
2. **Use Windows Terminal** instead of the legacy PowerShell console — Windows Terminal handles ANSI codes correctly
3. **Reset your terminal**: close and reopen PowerShell
4. **Skip Leiden**: uninstall its backend (`pip uninstall graspologic` on Python < 3.13, `pip uninstall graspologic-native` on Python 3.13+) and atlas will fall back to NetworkX's built-in Louvain algorithm, which produces no ANSI output

---
