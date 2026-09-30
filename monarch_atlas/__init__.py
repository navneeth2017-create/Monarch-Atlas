"""atlas - extract · build · cluster · analyze · report."""


def __getattr__(name):
    # Lazy imports so `atlas install` works before heavy deps are in place.
    _map = {
        "extract": ("monarch_atlas.extract", "extract"),
        "collect_files": ("monarch_atlas.extract", "collect_files"),
        "build_from_json": ("monarch_atlas.build", "build_from_json"),
        "cluster": ("monarch_atlas.cluster", "cluster"),
        "score_all": ("monarch_atlas.cluster", "score_all"),
        "cohesion_score": ("monarch_atlas.cluster", "cohesion_score"),
        "god_nodes": ("monarch_atlas.analyze", "god_nodes"),
        "surprising_connections": ("monarch_atlas.analyze", "surprising_connections"),
        "suggest_questions": ("monarch_atlas.analyze", "suggest_questions"),
        "generate": ("monarch_atlas.report", "generate"),
        "to_json": ("monarch_atlas.export", "to_json"),
        "to_html": ("monarch_atlas.export", "to_html"),
        "to_svg": ("monarch_atlas.export", "to_svg"),
        "to_canvas": ("monarch_atlas.export", "to_canvas"),
        "to_wiki": ("monarch_atlas.wiki", "to_wiki"),
        "reflect": ("monarch_atlas.reflect", "reflect"),
        "save_query_result": ("monarch_atlas.ingest", "save_query_result"),
    }
    if name in _map:
        import importlib
        mod_name, attr = _map[name]
        mod = importlib.import_module(mod_name)
        return getattr(mod, attr)
    raise AttributeError(f"module 'monarch_atlas' has no attribute {name!r}")
