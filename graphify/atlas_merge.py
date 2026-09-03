"""Monarch Atlas: merge several graphify-out graphs into one universe.

    python -m graphify.atlas_merge --out universe.html \\
        AddyDSD=/path/addydsd WowCow=/path/wowcow [...] \\
        [--links links.json] [--title "Monarch Universe"]

Each ``Name=path`` is a repo whose ``graphify-out/graph.json`` (and
``.graphify_labels.json``) is loaded. Nodes are namespaced ``name::id``,
tagged ``realm=Name``, and community ids are offset per repo so the merged
graph keeps every repo's own clustering. The Atlas viewer lays each realm
out as its own galaxy.

``links.json`` (optional) adds what graphify can't see from one repo at a
time — real integrations between repos, and shared outside services::

    {
      "links": [
        {"from": {"realm": "AddyDSD", "file": "monarch_integration.js"},
         "to":   {"realm": "Monarch", "file": "src/routes/partner.js"},
         "label": "Partner API: provisions Sales Suite tenants", "kind": "api"}
      ],
      "services": [
        {"name": "Stripe", "desc": "Payments, subscriptions, webhooks",
         "uses": [{"realm": "AddyDSD", "files": ["server.js"]}, ...]}
      ]
    }

Links anchor to the file node when the repo graph has one, otherwise to
the best-connected node from that file. Services become a small
``Services`` realm at the heart of the universe, with an edge from every
file that talks to them.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import networkx as nx

REALM_COLORS = ["#3CCB7F", "#E8873B", "#5B8DEF", "#C77DFF", "#F2C14E", "#EF6F6C", "#4DD0E1"]
SERVICES_COLOR = "#e2e2e6"


def _load_repo(name: str, root: str):
    out = Path(root) / "graphify-out"
    gp = out / "graph.json"
    if not gp.exists():
        sys.exit(f"{name}: {gp} not found — run `graphify update {root}` first")
    raw = json.loads(gp.read_text(encoding="utf-8"))
    labels = {}
    lp = out / ".graphify_labels.json"
    if lp.exists():
        try:
            labels = {int(k): v for k, v in json.loads(lp.read_text(encoding="utf-8")).items()}
        except Exception:
            labels = {}
    return raw, labels


def _anchor(nodes_by_realm: dict, realm: str, file: str):
    """Node id for a file inside a realm: the file node itself if present,
    else the best-connected node from that file."""
    cands = [n for n in nodes_by_realm.get(realm, []) if n["source_file"] == file]
    if not cands:
        return None
    for n in cands:
        if n["label"] == file or n["label"] == os.path.basename(file):
            return n["id"]
    return max(cands, key=lambda n: n["degree"])["id"]


def merge(repos: list[tuple[str, str]], links_path: str | None = None):
    G = nx.DiGraph()
    communities: dict[int, list[str]] = {}
    labels: dict[int, str] = {}
    nodes_by_realm: dict[str, list[dict]] = {}
    realm_meta = []
    for ri, (name, root) in enumerate(repos):
        raw, rlabels = _load_repo(name, root)
        color = REALM_COLORS[ri % len(REALM_COLORS)]
        offset = ri * 1000
        deg: dict[str, int] = {}
        edges = raw.get("links") or raw.get("edges") or []
        for e in edges:
            deg[e["source"]] = deg.get(e["source"], 0) + 1
            deg[e["target"]] = deg.get(e["target"], 0) + 1
        for n in raw["nodes"]:
            nid = f"{name}::{n['id']}"
            cid = n.get("community")
            gcid = offset + int(cid) if cid is not None else offset + 999
            attrs = {k: v for k, v in n.items() if k not in ("id", "community", "community_name")}
            attrs.update(realm=name, realm_color=color, community=gcid,
                         community_name=n.get("community_name") or rlabels.get(cid, f"Community {cid}"))
            G.add_node(nid, **attrs)
            communities.setdefault(gcid, []).append(nid)
            labels.setdefault(gcid, rlabels.get(cid) or n.get("community_name") or f"{name} · {cid}")
            nodes_by_realm.setdefault(name, []).append({"id": nid, "label": n.get("label", ""),
                                                        "source_file": n.get("source_file", ""),
                                                        "degree": deg.get(n["id"], 0)})
        for e in edges:
            a, b = f"{name}::{e['source']}", f"{name}::{e['target']}"
            if a in G and b in G:
                attrs = {k: v for k, v in e.items() if k not in ("source", "target")}
                G.add_edge(a, b, **attrs)
        realm_meta.append({"name": name, "color": color, "nodes": len(raw["nodes"]), "edges": len(edges)})

    # cross-repo links + shared services
    if links_path:
        spec = json.loads(Path(links_path).read_text(encoding="utf-8"))
        unanchored = []
        for l in spec.get("links", []):
            a = _anchor(nodes_by_realm, l["from"]["realm"], l["from"]["file"])
            b = _anchor(nodes_by_realm, l["to"]["realm"], l["to"]["file"])
            if a and b:
                G.add_edge(a, b, relation=l.get("kind", "integrates"), confidence="EXTRACTED",
                           cross_realm=True, title=l.get("label", ""), label=l.get("label", ""))
            else:
                unanchored.append(l)
        services = spec.get("services", [])
        if services:
            sname = "Services"
            scid_base = (len(repos) + 1) * 1000
            realm_meta.append({"name": sname, "color": SERVICES_COLOR, "nodes": len(services), "edges": 0, "center": True})
            for si, s in enumerate(services):
                sid = f"{sname}::{s['name']}"
                gcid = scid_base + si
                G.add_node(sid, label=s["name"], title=s.get("desc", ""), file_type="service",
                           source_file="", realm=sname, realm_color=SERVICES_COLOR,
                           community=gcid, community_name=s["name"])
                communities[gcid] = [sid]
                labels[gcid] = s["name"]
                for u in s.get("uses", []):
                    for f in u.get("files", []):
                        a = _anchor(nodes_by_realm, u["realm"], f)
                        if a:
                            G.add_edge(a, sid, relation="uses", confidence="EXTRACTED", cross_realm=True,
                                       title=f"{u['realm']} → {s['name']}: {s.get('desc','')}")
                        else:
                            unanchored.append({"service": s["name"], "realm": u["realm"], "file": f})
        for u in unanchored:
            print("atlas_merge: could not anchor", json.dumps(u), file=sys.stderr)
    G.graph["realms"] = realm_meta
    return G, communities, labels


def main(argv=None):
    ap = argparse.ArgumentParser(description="Merge several graphify graphs into one Monarch Atlas universe.")
    ap.add_argument("repos", nargs="+", help="Name=path pairs")
    ap.add_argument("--out", required=True, help="graph.html to write")
    ap.add_argument("--links", help="links.json with cross-repo links and shared services")
    ap.add_argument("--title", default="Universe")
    args = ap.parse_args(argv)
    repos = []
    for r in args.repos:
        if "=" not in r:
            sys.exit(f"expected Name=path, got {r}")
        name, root = r.split("=", 1)
        repos.append((name.strip(), root.strip()))
    G, communities, labels = merge(repos, args.links)
    os.environ.setdefault("GRAPHIFY_VIZ_NODE_LIMIT", str(max(5000, G.number_of_nodes() + 1)))
    os.environ.setdefault("GRAPHIFY_ATLAS_TITLE", args.title)
    from graphify.exporters.html import to_html
    ok = to_html(G, communities, args.out, community_labels=labels)
    print(f"{args.out}: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, "
          f"{len(communities)} groups across {len(G.graph['realms'])} realms — {'written' if ok else 'skipped'}")


if __name__ == "__main__":
    main()
