# Monarch Atlas: upstream graphify's test suite is written for its graphify-out/
# folder. Pin that here (before any graphify module reads it) so the daily
# upstream sync keeps passing; tests/test_atlas_naming.py covers atlas-out/.
import os

os.environ.setdefault("GRAPHIFY_OUT", "graphify-out")
