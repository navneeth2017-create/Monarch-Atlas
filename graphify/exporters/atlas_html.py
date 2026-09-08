"""Monarch Atlas viewer for graph.html.

Same data the upstream exporter builds (nodes, edges, legend, hyperedges) —
a different viewer. Two views share one settings card:

* **3D (default)** — every community is a solar system: its hub is the sun,
  the other members orbit it on tilted rings, and the systems are laid out
  as a galaxy. Clicking a group (or double-clicking a sun) flies the camera
  through the galaxy into that system, where member names fade in.
* **2D** — the dark, Obsidian-style flat map (vis-network), created lazily.

Kept in its own module so upstream merges touch html.py in exactly one
place. Globals `network`, `nodesDS`, `edgesDS`, `toggleAllCommunities` are
exposed once the 2D view is built, for the upstream hyperedge overlay.
"""
from __future__ import annotations

VIS_TAG = (
    '<script src="https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js"\n'
    '        integrity="sha384-Ux6phic9PEHJ38YtrijhkzyJ8yQlH8i/+buBR8s3mAZOJrP1gwyvAcIYl3GWtpX1"\n'
    '        crossorigin="anonymous"></script>'
)
THREE_TAGS = (
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>\n'
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>'
)


VIEWER_REMOTE = "https://cdn.jsdelivr.net/gh/navneeth2017-create/Monarch-Atlas@main/graphify/exporters/atlas_viewer.js"


def viewer_js() -> str:
    """The viewer, from the file that ships in the package (and lives at VIEWER_REMOTE)."""
    from importlib import resources
    return resources.files("graphify.exporters").joinpath("atlas_viewer.js").read_text(encoding="utf-8")


def _js_safe(json_text: str) -> str:
    """JSON is valid JS, but a `</script>` inside a label would end the tag early."""
    return json_text.replace("</", "<\\/")


def _hyperedge_body(hyperedge_script: str) -> str:
    """Strip the <script> wrapper so the upstream overlay can be deferred
    until the 2D network exists (it references the `network` global)."""
    body = hyperedge_script.strip()
    if body.startswith("<script>"):
        body = body[len("<script>"):]
    if body.endswith("</script>"):
        body = body[: -len("</script>")]
    return body


def _realms(G) -> tuple[str, str]:
    """Per-node realm map + realm metadata, from a merged graph (see atlas_merge)."""
    import json
    if G is None:
        return "{}", "[]"
    realms = {str(n): str(d["realm"]) for n, d in G.nodes(data=True) if d.get("realm")}
    meta = list(G.graph.get("realms") or [])
    if realms and not meta:
        seen = []
        for r in realms.values():
            if r not in seen:
                seen.append(r)
        meta = [{"name": r, "color": "#9e9e9e", "nodes": sum(1 for v in realms.values() if v == r)} for r in seen]
    return json.dumps(realms), json.dumps(meta)


SKIN_KEYS = ("monarch", "jarvis", "synthwave", "matrix", "blueprint")


def build_document(*, title: str, stats: str, nodes_json: str, edges_json: str,
                   legend_json: str, hyperedge_script: str, G=None) -> str:
    """Assemble the Monarch Atlas graph.html.

    The page carries the data (window.ATLAS) and a loader. The viewer itself is
    fetched live from the repo through jsDelivr so every map picks up new
    features on the next open, with the copy embedded here as the fallback for
    offline use, blocked networks, or a viewer that can't read this page's data
    version. GRAPHIFY_ATLAS_LOCAL=1 skips the remote entirely (self-hosted builds).
    """
    import html as _h
    import json
    import os
    realms_json, realm_meta_json = _realms(G)
    title = os.environ.get("GRAPHIFY_ATLAS_TITLE") or title
    default_skin = (os.environ.get("GRAPHIFY_ATLAS_SKIN") or "monarch").strip().lower()
    if default_skin not in SKIN_KEYS:
        default_skin = "monarch"
    if G is not None and G.graph.get("realms"):
        stats = f"{stats} · {len(G.graph['realms'])} galaxies"
    local = os.environ.get("GRAPHIFY_ATLAS_LOCAL", "").strip().lower() in ("1", "true", "yes")
    data = ("window.ATLAS={v:1,title:" + _js_safe(json.dumps(title)) + ",stats:" + _js_safe(json.dumps(stats))
            + ",skin:" + json.dumps(default_skin) + ",nodes:" + _js_safe(nodes_json) + ",edges:" + _js_safe(edges_json)
            + ",legend:" + _js_safe(legend_json) + ",realm:" + _js_safe(realms_json) + ",realms:" + _js_safe(realm_meta_json) + "};")
    hyper = "window.__atlasHyper=function(network){\n" + _hyperedge_body(hyperedge_script) + "\n};"
    viewer = viewer_js()
    if local:
        boot = "<script>\n" + viewer + "\n</script>"
    else:
        boot = ("<script>\n"
                "// Live viewer: newest build from the repo, with this page's own copy if that fails or is slow.\n"
                "(function(){var R=" + json.dumps(VIEWER_REMOTE) + ";var done=false;\n"
                "function local(){if(done||window.__atlasReady)return;done=true;var s=document.createElement('script');s.textContent=document.getElementById('atlas-local').textContent;document.body.appendChild(s);}\n"
                "window.__atlasLocal=local;\n"
                "if(navigator.onLine===false||location.protocol==='file:'&&!navigator.onLine){local();return;}\n"
                "var day=new Date().toISOString().slice(0,10).replace(/-/g,'');\n"
                "var t=setTimeout(local,4000);\n"
                "var s=document.createElement('script');s.src=R+'?d='+day;s.async=false;\n"
                "s.onload=function(){clearTimeout(t);local();};s.onerror=function(){clearTimeout(t);local();};\n"
                "document.body.appendChild(s);})();\n"
                "</script>\n"
                '<script type="text/plain" id="atlas-local">\n' + viewer + "\n</script>")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monarch Atlas - {_h.escape(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
{THREE_TAGS}
{VIS_TAG}
<script>{data}</script>
<script>{hyper}</script>
</head>
<body data-view="3d">
{boot}
</body>
</html>"""
