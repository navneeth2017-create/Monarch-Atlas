"""Monarch Atlas viewer — kept in its own file so upstream test merges never touch it."""
import networkx as nx

from graphify.exporters.html import to_html


def _graph():
    G = nx.DiGraph()
    G.add_node("a", label="A", source_file="a.py")
    G.add_node("b", label="B", source_file="b.py")
    G.add_edge("a", "b", relation="calls", confidence="EXTRACTED")
    return G


def test_atlas_is_the_default_outside_pytest(tmp_path, monkeypatch):
    monkeypatch.delenv("GRAPHIFY_THEME", raising=False)
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    out = tmp_path / "graph.html"
    assert to_html(_graph(), {0: ["a", "b"]}, str(out), community_labels={0: "Test"}) is True
    html = out.read_text(encoding="utf-8")
    assert "Monarch Atlas" in html
    assert 'id="settings"' in html and 'id="graph3d"' in html
    assert "three.min.js" in html and "vis-network" in html


def test_classic_theme_still_available(tmp_path, monkeypatch):
    monkeypatch.setenv("GRAPHIFY_THEME", "classic")
    out = tmp_path / "graph.html"
    to_html(_graph(), {0: ["a", "b"]}, str(out), community_labels={0: "Test"})
    html = out.read_text(encoding="utf-8")
    assert "Monarch Atlas" not in html
    assert "<title>graphify - " in html


def test_realms_render_as_galaxies(tmp_path, monkeypatch):
    monkeypatch.setenv("GRAPHIFY_THEME", "atlas")
    G = _graph()
    G.nodes["a"]["realm"] = "One"
    G.nodes["b"]["realm"] = "Two"
    G.graph["realms"] = [{"name": "One", "color": "#111111", "nodes": 1}, {"name": "Two", "color": "#222222", "nodes": 1}]
    out = tmp_path / "graph.html"
    to_html(G, {0: ["a"], 1: ["b"]}, str(out), community_labels={0: "Alpha", 1: "Beta"})
    html = out.read_text(encoding="utf-8")
    assert '"a": "One"' in html and '"b": "Two"' in html
    assert "2 galaxies" in html
    assert 'id="realms-wrap"' in html


def test_atlas_merge_namespaces_and_links(tmp_path):
    import json
    from graphify.atlas_merge import merge

    def repo(name):
        root = tmp_path / name
        (root / "graphify-out").mkdir(parents=True)
        g = {"directed": True, "nodes": [
                {"id": "server", "label": "server.js", "community": 0, "source_file": "server.js"},
                {"id": "fn", "label": "fn()", "community": 0, "source_file": "server.js"}],
             "links": [{"source": "server", "target": "fn", "relation": "contains", "confidence": "EXTRACTED"}]}
        (root / "graphify-out" / "graph.json").write_text(json.dumps(g), encoding="utf-8")
        (root / "graphify-out" / ".graphify_labels.json").write_text(json.dumps({"0": name.upper() + " core"}), encoding="utf-8")
        return str(root)

    links = tmp_path / "links.json"
    links.write_text(json.dumps({
        "links": [{"from": {"realm": "A", "file": "server.js"}, "to": {"realm": "B", "file": "server.js"}, "label": "calls B", "kind": "api"}],
        "services": [{"name": "Stripe", "desc": "Payments", "uses": [{"realm": "A", "files": ["server.js"]}]}],
    }), encoding="utf-8")
    G, communities, labels = merge([("A", repo("a")), ("B", repo("b"))], str(links))
    assert "A::server" in G and "B::server" in G and "Services::Stripe" in G
    assert G.nodes["A::server"]["realm"] == "A" and G.nodes["B::fn"]["community"] == 1000
    assert G.has_edge("A::server", "B::server") and G.has_edge("A::server", "Services::Stripe")
    assert labels[0] == "A core" and labels[1000] == "B core"
    assert [r["name"] for r in G.graph["realms"]] == ["A", "B", "Services"]
