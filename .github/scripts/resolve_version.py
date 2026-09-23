"""Every upstream release conflicts on the same three lines of pyproject.toml: upstream
bumps name/version/description, we ship as monarch-atlas. Keep our name and description,
take upstream's version with our local segment. Exits 1 if any other conflict remains."""
import re, sys

p = 'pyproject.toml'
s = open(p).read()
s = re.sub(
    r'<<<<<<< ours\n(name = "monarch-atlas"\n)version = "[^"]+"\n(description = [^\n]+\n)=======\n'
    r'name = "[^"]+"\nversion = "([^"]+)"\ndescription = [^\n]+\n>>>>>>> theirs\n',
    lambda m: f'{m.group(1)}version = "{m.group(3)}+monarch.1"\n{m.group(2)}', s)
if '<<<<<<<' in s or '>>>>>>>' in s:
    sys.exit(1)
open(p, 'w').write(s)
