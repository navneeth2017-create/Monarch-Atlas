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

STYLES = """<style>
  :root { --bg:#1b1b1f; --bg-2:#242428; --bg-3:#2d2d32; --border:#3a3a40; --border-2:#4a4a52;
    --text:#e2e2e6; --muted:#9a9aa3; --faint:#6b6b74; --accent:#E8873B; --accent-2:#f3a866;
    --font:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif; --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace; --lbl:#c9c9d0; --lbl-sun:#e6e6ea; --halo:#000; }
  html,body{height:100%} body{margin:0;background:var(--sky,#0c0c11);color:var(--text);font-family:var(--font);font-size:13px;line-height:1.45;overflow:hidden}
  #graph,#graph3d{position:absolute;inset:0} #graph{background:var(--bg)} #graph3d canvas{display:block}
  body[data-view="3d"] #graph{display:none} body[data-view="2d"] #graph3d{display:none} body[data-view="2d"] #labels{display:none}
  #labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .lbl{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-size:11px;color:var(--lbl);text-shadow:0 1px 2px var(--halo),0 0 6px var(--halo);opacity:0;transition:opacity .15s;will-change:transform;pointer-events:none}
  .lbl.on{opacity:1;pointer-events:auto;cursor:pointer} .lbl.on:hover{color:#fff} .lbl.dim{opacity:.3}
  .lbl.sun{font-weight:500;font-size:11.5px;color:var(--lbl-sun)}
  .lbl.realm{font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:12px;background:rgba(12,12,17,.55);border:1px solid rgba(255,255,255,.08)} .lbl.realm.on:hover{border-color:rgba(255,255,255,.3)}
  .grp-h{display:flex;align-items:center;gap:8px;margin:8px 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);cursor:pointer} .grp-h:hover{color:#fff} .grp-h .sw{width:8px;height:8px}
  .realm-row{display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer} .realm-row:hover{color:#fff} .realm-row .c{color:var(--faint);font-size:11px;margin-left:auto}
  #tip{position:absolute;pointer-events:none;background:rgba(36,36,40,.94);border:1px solid var(--border-2);border-radius:6px;padding:6px 9px;font-size:12px;max-width:320px;transform:translate(12px,12px);display:none;z-index:5}
  #tip b{display:block;font-weight:600;color:#fff} #tip span{color:var(--muted)}
  #brand{position:absolute;left:14px;top:12px;display:flex;align-items:center;gap:9px;pointer-events:none;z-index:3}
  #brand .mark{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,var(--accent),#c96a22);display:grid;place-items:center;font-size:15px;box-shadow:0 2px 10px rgba(232,135,59,.35)}
  #brand .name{font-weight:700;font-size:14px;letter-spacing:.01em;text-shadow:0 1px 4px #000}
  #brand .name small{display:block;font-weight:400;font-size:11px;color:var(--muted)}
  #stats{position:absolute;left:14px;bottom:12px;color:var(--faint);font-size:11.5px;pointer-events:none;z-index:3;text-shadow:0 1px 3px #000}
  #crumb{position:absolute;left:50%;top:14px;transform:translateX(-50%);display:none;align-items:center;gap:8px;background:rgba(36,36,40,.92);border:1px solid var(--border);border-radius:20px;padding:6px 8px 6px 14px;font-size:12.5px;z-index:4;box-shadow:0 6px 20px rgba(0,0,0,.4)}
  #crumb.on{display:flex} body[data-view="2d"] #crumb{display:none} #crumb i{width:9px;height:9px;border-radius:50%;display:inline-block}
  #crumb button{background:var(--bg-3);border:1px solid var(--border-2);color:var(--text);border-radius:14px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer}
  #crumb button:hover{border-color:var(--accent);color:var(--accent-2)}
  #idle-hint{position:absolute;left:50%;bottom:40px;transform:translateX(-50%);background:rgba(36,36,40,.85);border:1px solid var(--border);border-radius:20px;padding:6px 14px;font-size:12.5px;color:var(--muted);opacity:0;pointer-events:none;transition:opacity .6s;z-index:4}
  #idle-hint.on{opacity:1}
  #ride-hint{position:absolute;left:50%;bottom:40px;transform:translateX(-50%);background:rgba(36,36,40,.88);border:1px solid var(--accent);border-radius:20px;padding:7px 16px;font-size:12.5px;color:var(--text);opacity:0;pointer-events:none;transition:opacity .4s;z-index:4;white-space:normal;max-width:min(880px,calc(100vw - 28px));text-align:center;line-height:1.9}
  #ride-hint.on{opacity:1;pointer-events:auto} #ride-hint kbd{font:inherit;padding:0 5px;border:1px solid var(--border-2);border-radius:4px;background:rgba(255,255,255,.06)} #ride-hint button{margin-left:10px;border:1px solid var(--border-2);background:none;color:var(--accent);border-radius:12px;padding:2px 9px;font:inherit;cursor:pointer}
  #settings{position:absolute;top:14px;right:14px;width:300px;max-height:calc(100vh - 28px);overflow:auto;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.45);font-size:13px;z-index:4}
  #settings.min details{display:none}
  .bar{display:flex;align-items:center;justify-content:space-between;padding:8px 8px 8px 12px;border-bottom:1px solid var(--border);gap:8px}
  .bar b{font-weight:600;flex:1} .bar button{background:none;border:0;color:var(--muted);cursor:pointer;font:inherit;padding:2px 6px;border-radius:4px}
  .bar button:hover{background:var(--bg-3);color:var(--text)}
  .seg{display:inline-flex;border:1px solid var(--border-2);border-radius:6px;overflow:hidden}
  .seg button{padding:3px 10px;font-size:12px;border-radius:0;color:var(--muted)} .seg button.on{background:var(--accent);color:#1b1b1f;font-weight:600}
  .seg button.on:hover{background:var(--accent-2);color:#1b1b1f}
  details{border-bottom:1px solid var(--border)} details:last-child{border-bottom:0}
  body[data-view="3d"] details.only-2d{display:none} body[data-view="2d"] details.only-3d{display:none}
  body[data-view="3d"] .only-2d{display:none} body[data-view="2d"] .only-3d{display:none}
  summary{list-style:none;cursor:pointer;padding:9px 12px;font-weight:600;font-size:12.5px;display:flex;align-items:center;gap:8px;user-select:none}
  summary::before{content:"";width:0;height:0;border-left:5px solid var(--muted);border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .12s}
  details[open] summary::before{transform:rotate(90deg)} summary::-webkit-details-marker{display:none}
  .body{padding:2px 12px 12px;display:flex;flex-direction:column;gap:8px}
  input[type=search],input[type=text]{width:100%;box-sizing:border-box;background:var(--bg);border:1px solid var(--border-2);color:var(--text);border-radius:6px;padding:7px 9px;font:inherit;outline:none}
  input[type=search]:focus{border-color:var(--accent)}
  #hits{list-style:none;margin:0;padding:0;max-height:200px;overflow:auto}
  #hits li{padding:5px 6px;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:7px} #hits li:hover,#hits li:focus{background:var(--bg-3);outline:none}
  #hits small{color:var(--faint);margin-left:auto;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
  .sw{width:9px;height:9px;border-radius:50%;flex:none;display:inline-block}
  .row{display:flex;align-items:center;justify-content:space-between;gap:10px} .row .sub{display:block;color:var(--faint);font-size:11.5px}
  .tg{appearance:none;width:34px;height:20px;border-radius:10px;background:var(--border-2);position:relative;cursor:pointer;flex:none;margin:0;transition:background .15s}
  .tg::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}
  .tg:checked{background:var(--accent)} .tg:checked::after{left:16px}
  .rng{display:flex;flex-direction:column;gap:3px} .rng .top{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}
  input[type=range]{width:100%;accent-color:var(--accent);margin:0}
  .grp{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 0}
  .grp .n{display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer;flex:1} .grp .n:hover{color:#fff}
  .grp .n span.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .grp .c{color:var(--faint);font-size:11px;margin-left:4px}
  .grp .fly{visibility:hidden;color:var(--faint);font-size:11px;flex:none} .grp:hover .fly{visibility:visible}
  .links{display:flex;gap:10px;font-size:12px;margin-bottom:4px} .links a{color:var(--accent);cursor:pointer} .links a:hover{text-decoration:underline}
  #card{position:absolute;left:14px;bottom:44px;width:370px;max-height:60vh;overflow:auto;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.45);padding:14px 16px;z-index:4}
  #card[hidden]{display:none}
  #card h2{margin:0 0 4px;font-size:16px;font-weight:600;word-break:break-word} #card .tag{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);margin-bottom:6px}
  #card .tag i{width:9px;height:9px;border-radius:50%;display:inline-block} #card p{margin:0 0 8px;color:var(--muted)}
  #card .h{color:var(--faint);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 4px}
  #card ul{list-style:none;margin:0;padding:0} #card li{display:flex;justify-content:space-between;gap:8px;padding:4px 6px;border-radius:5px;cursor:pointer}
  #card li:hover{background:var(--bg-3)} #card li span{color:var(--faint);font-size:11.5px;flex:none}
  #card .x{position:absolute;top:8px;right:10px;background:none;border:0;color:var(--muted);cursor:pointer;font-size:16px} #card .x:hover{color:#fff}
  #card .rel{display:inline-block;padding:2px 8px;border-radius:10px;background:var(--bg-3);font-size:12px;margin-top:4px} #card .rel.inf{border:1px dashed var(--border-2)}
  #card .act{margin-top:10px;display:flex;gap:8px} #card .act button{background:var(--bg-3);border:1px solid var(--border-2);color:var(--text);border-radius:6px;padding:5px 10px;font:inherit;font-size:12px;cursor:pointer}
  #card .act button:hover{border-color:var(--accent);color:var(--accent-2)}
  ::-webkit-scrollbar{width:8px} ::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:4px}
  /* ── skins: everything visual hangs off the CSS variables above plus body[data-skin] ── */
  #fx{position:absolute;inset:0;pointer-events:none;z-index:1;display:none} #fx canvas{display:block;width:100%;height:100%}
  #fx .ck{position:absolute;width:26px;height:26px;border:2px solid var(--accent);opacity:.55} #fx .tl{left:14px;top:14px;border-right:0;border-bottom:0} #fx .tr{right:14px;top:14px;border-left:0;border-bottom:0} #fx .bl{left:14px;bottom:14px;border-right:0;border-top:0} #fx .br{right:14px;bottom:14px;border-left:0;border-top:0}
  body[data-skin="jarvis"] #fx,body[data-skin="matrix"] #fx{display:block}
  body[data-skin="jarvis"] #fx::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 1px,transparent 1px 3px)}
  body[data-skin="jarvis"] #fx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,20,30,.55) 100%)}
  body[data-skin="matrix"] #fx .ck{display:none} body[data-skin="matrix"] #fx canvas{opacity:.32}
  body[data-skin="jarvis"] .lbl,body[data-skin="matrix"] .lbl{font-family:var(--mono);text-transform:uppercase;letter-spacing:.07em}
  body[data-skin="jarvis"] .lbl.realm,body[data-skin="matrix"] .lbl.realm{border-color:var(--accent);background:rgba(0,0,0,.55);border-radius:3px}
  body[data-skin="jarvis"] #brand .name,body[data-skin="matrix"] #brand .name{font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
  body[data-skin="blueprint"] .lbl{font-family:var(--mono);letter-spacing:.04em} body[data-skin="blueprint"] .lbl.realm{background:rgba(13,42,98,.7);border:1px solid rgba(255,255,255,.35);border-radius:3px}
  body[data-skin="blueprint"] #tip,body[data-skin="blueprint"] #crumb,body[data-skin="blueprint"] #idle-hint,body[data-skin="blueprint"] #ride-hint{background:rgba(16,50,120,.94)}
  body[data-skin="blueprint"] .seg button.on{color:#0f2f6e}
  body[data-skin="synthwave"] .lbl{font-style:italic;letter-spacing:.03em}
  #skins{position:absolute;inset:0;z-index:8;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}
  #skins.on{display:flex}
  #skins .box{width:min(1040px,calc(100vw - 40px));max-height:calc(100vh - 40px);overflow:auto;background:var(--bg-2);border:1px solid var(--border);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6)}
  #skins .hd{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)} #skins .hd b{font-size:15px} #skins .hd span{color:var(--muted);font-size:12.5px;flex:1} #skins .hd button{background:none;border:0;color:var(--muted);font-size:20px;cursor:pointer;line-height:1}
  #skins .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;padding:16px 18px 18px}
  .skin{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg);cursor:pointer;transition:transform .12s,border-color .12s;display:flex;flex-direction:column}
  .skin:hover{transform:translateY(-2px);border-color:var(--border-2)} .skin.on{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
  .skin svg{display:block;width:100%;aspect-ratio:16/9;background:#000}
  .skin .meta{padding:10px 12px 12px} .skin .meta b{font-size:14px;display:flex;align-items:center;gap:8px} .skin .meta b em{font-style:normal;font-size:10.5px;color:var(--accent);border:1px solid var(--accent);border-radius:10px;padding:0 7px;margin-left:auto}
  .skin .meta p{margin:3px 0 8px;color:var(--muted);font-size:12px} .skin .chips{display:flex;flex-wrap:wrap;gap:5px} .skin .chips i{font-style:normal;font-size:11px;color:var(--text);background:var(--bg-3);border:1px solid var(--border);border-radius:10px;padding:2px 8px}
  #skin-row{display:flex;align-items:center;gap:8px;padding:6px 0} #skin-row b{font-weight:500} #skin-row button{margin-left:auto;background:var(--bg-3);border:1px solid var(--border-2);color:var(--text);border-radius:6px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer} #skin-row button:hover{border-color:var(--accent);color:var(--accent-2)}
  @media (min-width:721px){#idle-hint,#ride-hint{left:calc((100vw - 314px)/2)}}
  @media (max-width:720px){#settings{width:min(300px,calc(100vw - 28px))} #card{width:calc(100vw - 28px)}}
</style>"""


def _script(nodes_json: str, edges_json: str, legend_json: str, hyperedge_body: str,
            realms_json: str, realm_meta_json: str) -> str:
    # Plain string concatenation (no f-string) so JS braces and ${} are literal.
    return """<script>
const RAW_NODES = """ + nodes_json + """;
const RAW_EDGES = """ + edges_json + """;
const LEGEND = """ + legend_json + """;
const REALM = """ + realms_json + """;      // node id -> realm (empty when the graph is a single repo)
const REALMS = """ + realm_meta_json + """; // [{name,color,nodes,center}]
const HAS_REALMS = REALMS.length > 0;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const FONT='"Inter",-apple-system,"Segoe UI",sans-serif';
const maxDeg=Math.max(1,...RAW_NODES.map(n=>n.degree||1));
// ── shared indexes ──
const base={},outAdj={},inAdj={},nbrs={};
const realmOfCid={};
RAW_NODES.forEach(n=>{base[n.id]={color:(n.color&&n.color.background)||'#9e9e9e',community:n.community,degree:n.degree||1,label:n.label,file:n.source_file,cname:n.community_name,realm:REALM[n.id]||null};if(REALM[n.id]!=null&&realmOfCid[n.community]==null)realmOfCid[n.community]=REALM[n.id];outAdj[n.id]=[];inAdj[n.id]=[];nbrs[n.id]=new Set();});
RAW_EDGES.forEach((e,i)=>{e._i=i;if(outAdj[e.from])outAdj[e.from].push(e);if(inAdj[e.to])inAdj[e.to].push(e);if(nbrs[e.from])nbrs[e.from].add(e.to);if(nbrs[e.to])nbrs[e.to].add(e.from);});
const LEG={};LEGEND.forEach(g=>LEG[g.cid]=g);
let view='3d';try{view=localStorage.getItem('atlas.view')||'3d';}catch(e){}
if(!window.THREE)view='2d';
// ══════════════════════════════════════════ skins ══
// Every skin is the same 3D universe — solar systems in galaxies — dressed differently:
// colours, sky, node style, link glow, and a few props of its own (HUD rings, a neon grid, rain).
const SKINS={
  monarch:{name:'Monarch',mark:'🦋',tag:'Night sky, warm orange, butterflies on the wing.',
    css:{bg:'#1b1b1f','bg-2':'#242428','bg-3':'#2d2d32',border:'#3a3a40','border-2':'#4a4a52',text:'#e2e2e6',muted:'#9a9aa3',faint:'#6b6b74',accent:'#E8873B','accent-2':'#f3a866',sky:'#0c0c11',lbl:'#c9c9d0','lbl-sun':'#e6e6ea',halo:'#000'},
    sky:0x0c0c11,fog:0.00038,rim:0xE8873B,ambient:0.55,stars:[[4200,2.0,0xc9cde0,0.5],[520,3.2,0xf2f4ff,0.7],[70,4.8,0xffe9c4,0.85]],nebula:0.09,fade:0x0c0c11,line:0.55,sunEmissive:0x6a6a6a,wire:false,monarchs:true,extras:null,tint:null,
    wings:{base:'#c9640f',mid:'#ec8a1e',tip:'#f7a23a',vein:'rgba(22,12,6,.95)',margin:'#120d09',spot:'rgba(255,250,240,.96)',glow:'rgba(255,190,110,.9)',shade:'rgba(40,16,4,.55)',body:0x17120e},kin:{head:0xdde3f2,headEm:0x2a3350,stalk:0xbfc7dc},
    pv:{stars:'#dfe3ff',cols:['#6ea8ff','#ff8a5b','#7ed957','#ffd166','#c77dff'],butterfly:true},
    features:['Solar-system galaxies','Ride a butterfly','Walk a kinesin','Nebulae & starfield','Idle tour']},
  jarvis:{name:'JARVIS',mark:'◎',tag:'Cyan holographic HUD. Wireframe nodes, targeting rings, scanlines.',
    css:{bg:'#04141a','bg-2':'#061c24','bg-3':'#0a2a34',border:'#0f3d4a','border-2':'#155566',text:'#c8f4f8',muted:'#6fbfca',faint:'#3f8e99',accent:'#19d3e0','accent-2':'#7be9f1',sky:'#020b10',lbl:'#8fe6ee','lbl-sun':'#c9fbff',halo:'#001318',font:'var(--mono)'},
    sky:0x020b10,fog:0.00030,rim:0x19d3e0,ambient:1.0,stars:[[900,1.6,0x19d3e0,0.35],[60,3.0,0x9ff5fb,0.6]],nebula:0.05,fade:0x03202a,line:0.9,sunEmissive:0x19d3e0,wire:true,rings:true,monarchs:true,extras:'hud',tint:{color:0x19d3e0,k:0.55},
    wings:{base:'#067a88',mid:'#12b7c6',tip:'#7ff0f8',vein:'rgba(2,20,26,.95)',margin:'#03242b',spot:'rgba(230,255,255,.95)',glow:'rgba(180,255,255,.9)',shade:'rgba(0,30,40,.55)',body:0x03242b},kin:{head:0x9ff5fb,headEm:0x0a6b75,stalk:0x5fd6e2},
    pv:{stars:'#19d3e0',cols:['#19d3e0','#5fe8f0','#0fa9b6','#9ff5fb','#3ecfd9'],rings:true,wire:true,scan:true},
    features:['Holographic nodes & orbit rings','Targeting rings lock on','Scanline & vignette overlay','Cyan butterflies & carriers','Monospace readouts']},
  synthwave:{name:'Synthwave',mark:'🌴',tag:'Magenta and violet, a neon grid floor and a setting sun.',
    css:{bg:'#170b30','bg-2':'#1f1040','bg-3':'#2a1755',border:'#3a2372','border-2':'#4c2f8f',text:'#f3e7ff',muted:'#b79ae0',faint:'#7d63b0',accent:'#ff3fd0','accent-2':'#ff8de6',sky:'#0d0620',lbl:'#e6cfff','lbl-sun':'#fff0ff',halo:'#1a0040'},
    sky:0x0d0620,fog:0.00030,rim:0xff3fd0,ambient:0.6,stars:[[3000,1.9,0xd7b6ff,0.5],[300,3.0,0xff9de8,0.7]],nebula:0.14,fade:0x0d0620,line:0.5,sunEmissive:0xd94fc4,wire:false,monarchs:true,extras:'synth',tint:{color:0xc04fff,k:0.35},
    wings:{base:'#7a1fa0',mid:'#d63cc8',tip:'#ff8de6',vein:'rgba(20,4,40,.95)',margin:'#1a0630',spot:'rgba(255,240,255,.95)',glow:'rgba(255,200,120,.9)',shade:'rgba(30,0,50,.55)',body:0x1a0630},kin:{head:0xffd6f7,headEm:0x7a1fa0,stalk:0xd18cff},
    pv:{stars:'#e0c3ff',cols:['#ff3fd0','#a05cff','#c86bff','#ff8de6','#8b5cf6'],grid:true,sun:true,butterfly:true},
    features:['Neon grid floor','Retro horizon sun','Glowing links & nebulae','Butterflies & carriers','Idle tour']},
  matrix:{name:'Matrix',mark:'▚',tag:'Green phosphor on black, digital rain behind the graph.',
    css:{bg:'#050a06','bg-2':'#08120a','bg-3':'#0d1d10',border:'#153a1c',border:'#153a1c','border-2':'#1f5228',text:'#c9ffd2',muted:'#6fcf84',faint:'#3f8a4f',accent:'#3cff6a','accent-2':'#9dffb4',sky:'#000000',lbl:'#8fe8a3','lbl-sun':'#d6ffde',halo:'#001a05',font:'var(--mono)'},
    sky:0x000000,fog:0.00030,rim:0x3cff6a,ambient:0.95,stars:[[1500,1.6,0x3cff6a,0.35]],nebula:0.05,fade:0x071c0d,line:0.9,sunEmissive:0x35d45f,wire:false,monarchs:true,extras:null,tint:{color:0x3cff6a,k:0.62},
    wings:{base:'#0f6b2a',mid:'#26b34b',tip:'#8fff9f',vein:'rgba(0,20,5,.95)',margin:'#03150a',spot:'rgba(220,255,225,.95)',glow:'rgba(200,255,200,.9)',shade:'rgba(0,25,5,.55)',body:0x03150a},kin:{head:0xc9ffd2,headEm:0x0f6b2a,stalk:0x6fdf84},
    pv:{stars:'#3cff6a',cols:['#3cff6a','#9dffb4','#1fa84a','#c9ffd2','#2fd35e'],rain:true,butterfly:true},
    features:['Digital rain behind the graph','Terminal type','Everything in green phosphor','Green butterflies & carriers']},
  blueprint:{name:'Blueprint',mark:'✎',tag:'White ink on drafting blue. Clean, technical, printable.',
    css:{bg:'#0f2f6e','bg-2':'#123a82','bg-3':'#184a9c',border:'#2a5bb0','border-2':'#3d6fc4',text:'#eaf2ff',muted:'#a9c3ee',faint:'#6f92cf',accent:'#ffffff','accent-2':'#dbe8ff',sky:'#0d2a62',lbl:'#dbe8ff','lbl-sun':'#ffffff',halo:'#0a2050'},
    sky:0x0d2a62,fog:0.00030,rim:0xffffff,ambient:0.95,stars:[],nebula:0.07,fade:0x1f4a96,line:0.75,sunEmissive:0xbfd2f5,wire:false,monarchs:true,extras:'grid',tint:{color:0xdbe8ff,k:0.45},
    wings:{base:'#9fbcf0',mid:'#d0e0ff',tip:'#ffffff',vein:'rgba(15,45,110,.9)',margin:'#163e8f',spot:'rgba(30,70,150,.9)',glow:'rgba(255,255,255,.9)',shade:'rgba(20,50,120,.5)',body:0x163e8f},kin:{head:0xffffff,headEm:0x3d6fc4,stalk:0xdbe8ff},
    pv:{cols:['#dbe8ff','#ffffff','#a9c3ee','#eaf2ff','#c7d9ff'],blueprint:true,butterfly:true},
    features:['Drafting-blue paper','White ink links','Grid floor','Pale butterflies & carriers','Print-friendly']},
};
const DEFAULT_SKIN=(window.__ATLAS_SKIN__&&SKINS[window.__ATLAS_SKIN__])?window.__ATLAS_SKIN__:'monarch';
let skinKey=DEFAULT_SKIN;try{const u=new URLSearchParams(location.search).get('skin');skinKey=(u&&SKINS[u])?u:(SKINS[localStorage.getItem('atlas.skin')]?localStorage.getItem('atlas.skin'):DEFAULT_SKIN);}catch(e){}
let SKIN=SKINS[skinKey];
const state={labels:true,monarchs:true,walkers:true,idle:true,nsize:1,lw:1,inferred:true,hidden:new Set(),rotate:true,speed:0.5,spacing:1,live:false,repel:2600,center:0.35,dist:80};
const edgeVisible=e=>state.inferred||e.confidence==='EXTRACTED';
const nodeVisible=id=>!state.hidden.has(base[id].community);

// ══════════════════════════════════════════ 3D — galaxy of solar systems ══
const V3=(()=>{
  if(!window.THREE)return null;
  const el=document.getElementById('graph3d'),lblLayer=document.getElementById('labels'),tip=document.getElementById('tip');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(window.innerWidth,window.innerHeight);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(SKIN.sky);scene.fog=new THREE.FogExp2(SKIN.sky,SKIN.fog);
  const camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.5,40000);camera.up.set(0,0,1);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.screenSpacePanning=true;if(controls.listenToKeyEvents)controls.listenToKeyEvents(window);
  window.addEventListener('keydown',ev=>{if(ev.key==='Shift')controls.mouseButtons.LEFT=THREE.MOUSE.PAN;});
  window.addEventListener('keyup',ev=>{if(ev.key==='Shift')controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;});
  // pixels per world unit at distance 1 (screen-size gates for labels, monarchs, kinesins)
  const pxPer=()=>(window.innerHeight/2)/Math.tan(camera.fov*Math.PI/360);
  // the settings panel covers the right edge: shift the projection so the scene sits in the middle of what you can actually see
  function fitView(){const W=window.innerWidth,H=window.innerHeight;let sb=0;const p=document.getElementById('settings');
    if(p&&W>720&&getComputedStyle(p).display!=='none'){const r=p.getBoundingClientRect();if(r.width>0)sb=Math.max(0,W-r.left);}
    camera.setViewOffset(W,H,sb/2,0,W,H);camera.updateProjectionMatrix();renderer.setSize(W,H);}
  fitView();
  controls.enableDamping=true;controls.dampingFactor=0.07;controls.rotateSpeed=0.6;controls.zoomSpeed=0.9;controls.autoRotate=state.rotate;controls.autoRotateSpeed=state.speed;controls.maxDistance=30000;
  const ambient=new THREE.AmbientLight(0xffffff,SKIN.ambient);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffffff,0.75);key.position.set(0.4,0.8,1);scene.add(key);
  const rim=new THREE.DirectionalLight(SKIN.rim,0.25);rim.position.set(-1,-0.4,-0.6);scene.add(rim);
  // stars: rebuilt after layout so the sky scales with the scene. Fixed pixel
  // size so they're evenly bright in every direction, with a few brighter ones.
  let starLayers=[];
  function buildStars(){
    starLayers.forEach(o=>{scene.remove(o);o.geometry.dispose();o.material.dispose();});starLayers=[];
    const R=Math.max(400,galaxyR)*7;
    const mk=(N,size,color,opacity)=>{const p=new Float32Array(N*3);const rng=seeded(N);
      for(let i=0;i<N;i++){const r=R*(0.8+rng()*0.6),t=rng()*Math.PI*2,u=rng()*2-1,q=Math.sqrt(1-u*u);p[i*3]=r*q*Math.cos(t);p[i*3+1]=r*q*Math.sin(t);p[i*3+2]=r*u;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
      // glowTex is defined further down; buildStars() only runs from build(), after everything is set up
      const pts=new THREE.Points(g,new THREE.PointsMaterial({color,size,map:glowTex,alphaTest:0.05,sizeAttenuation:false,transparent:true,opacity,fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(pts);starLayers.push(pts);};
    (SKIN.stars||[]).forEach(a=>mk(...a));
  }
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.55)');g.addColorStop(0.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);return t;})();
  const seeded=seed=>{let s=(seed*9301+49297)%233280;return()=>{s=(s*9301+49297)%233280;return s/233280;};};
  // ── layout: solar systems on a galaxy ──
  const systems=[],sysOf={},sysN={},sysRank={},sunRealm={},pos={},sunOf={},radiusOf={},sysBySun={};
  const groupsOf={};RAW_NODES.forEach(n=>{const c=n.community==null?-1:n.community;(groupsOf[c]=groupsOf[c]||[]).push(n.id);});
  Object.keys(groupsOf).forEach(k=>{const cid=+k,ids=groupsOf[k].slice().sort((a,b)=>base[b].degree-base[a].degree||String(a).localeCompare(String(b)));
    const g=LEG[cid]||{color:'#9e9e9e',label:cid===-1?'Unclustered':'Community '+cid};systems.push({cid,color:g.color,label:g.label,ids,n:ids.length,realm:base[ids[0]].realm||''});ids.forEach(id=>{sysOf[id]=cid;sysN[id]=ids.length;});});
  systems.sort((a,b)=>b.n-a.n);
  let realmList=[];
  // Fibonacci directions: evenly spread over a sphere, deterministic
  const fibDir=(i,n)=>{const z=1-2*(i+0.5)/n,r=Math.sqrt(Math.max(0,1-z*z)),t=i*2.399963;return new THREE.Vector3(r*Math.cos(t),r*Math.sin(t),z);};
  // pack items into an oblate ball: walk outward along a well-spread direction until nothing overlaps
  function placeBall(items,gap,sp,flat){const placed=[];items.forEach((it,i)=>{const d=fibDir(i,items.length);d.z*=flat;d.normalize();let c=null;
    for(let rr=0;rr<400000;rr+=5*sp){const cand=d.clone().multiplyScalar(rr);cand.z*=flat;
      if(placed.every(p=>cand.distanceTo(p.c)>=p.r+it.r+gap)){c=cand;break;}}
    it.c=c||new THREE.Vector3();placed.push({c:it.c,r:it.r});});}
  const maxN=Math.max(1,...systems.map(s=>s.n));
  function layout(){
    const sp=state.spacing;
    systems.forEach(s=>{
      const rng=seeded(s.cid+7);const sun=s.ids[0];s.sun=sun;sunOf[s.cid]=sun;
      const local={};local[sun]=new THREE.Vector3(0,0,0);
      let i=1,k=0,R=0;
      while(i<s.n){k++;const cap=Math.round(6+5.5*k);R=(9+6.5*k)*sp;const cnt=Math.min(cap,s.n-i);const off=rng()*Math.PI*2;
        for(let j=0;j<cnt;j++,i++){const a=off+Math.PI*2*j/cnt;local[s.ids[i]]=new THREE.Vector3(R*Math.cos(a),R*Math.sin(a),(rng()-0.5)*3*sp);}}
      s.r=(s.n===1?8:R+6);sysBySun[sun]=s;s.tilt=new THREE.Euler((rng()-0.5)*1.3,(rng()-0.5)*1.3,rng()*Math.PI);s.local=local;
    });
    // each realm is its own galaxy: systems spiral out from the realm's centre
    const byRealm={};systems.forEach(s=>{(byRealm[s.realm]=byRealm[s.realm]||[]).push(s);});
    realmList=Object.keys(byRealm).map(k=>({name:k,systems:byRealm[k],meta:REALMS.find(r=>r.name===k)||{}}));
    realmList.forEach(R=>{placeBall(R.systems,14*sp,sp,0.55);let rad=0;R.systems.forEach(s=>rad=Math.max(rad,s.c.length()+s.r));R.r=rad+24*sp;R.systems.forEach((s,i)=>{sysRank[s.sun]=i;sunRealm[s.sun]=R;});});
    if(realmList.length===1){realmList[0].c=new THREE.Vector3();}
    else{
      const centre=realmList.filter(R=>R.meta.center),rest=realmList.filter(R=>!R.meta.center).sort((a,b)=>b.r-a.r);
      let cr=0;centre.forEach(R=>{R.c=new THREE.Vector3();cr=Math.max(cr,R.r);});
      const n=rest.length,gap=90*sp;let ring=0;
      rest.forEach(R=>ring=Math.max(ring,cr+R.r+gap));
      for(let i=0;i<n;i++){const a=rest[i],b=rest[(i+1)%n];if(n>1)ring=Math.max(ring,(a.r+b.r+gap)/(2*Math.sin(Math.PI/n)));}
      // spread the galaxies over a sphere, not a ring, so the universe has depth from every angle
      rest.forEach((R,i)=>{const d=fibDir(i,n);d.z*=0.7;d.normalize();R.c=d.multiplyScalar(ring*0.92);});
    }
    realmList.forEach(R=>R.systems.forEach(s=>{s.c.add(R.c);s.ids.forEach(id=>{pos[id]=s.local[id].clone().applyEuler(s.tilt).add(s.c);});}));
    let R=0;realmList.forEach(r=>R=Math.max(R,r.c.length()+r.r));galaxyR=R;
  }
  let galaxyR=100;
  // ── meshes ──
  const geo=new THREE.SphereGeometry(1,16,12),RING_GEO=new THREE.RingGeometry(0.985,1,96);
  let planets=null,suns=null,lines=null,glows=[],planetIds=[],sunIds=[],slotOf={},edgeSlots={},edgeGeom=null,edgeColor=null,edgeList=[];
  const _m=new THREE.Matrix4(),_c=new THREE.Color(),_s=new THREE.Vector3(),_fade=new THREE.Color(SKIN.fade),_tc=new THREE.Color();
  // every colour in the scene passes through here, so a skin can pull the whole palette toward its own hue
  const skinCol=(c,hex)=>{c.set(hex);if(SKIN.tint)c.lerp(_tc.set(SKIN.tint.color),SKIN.tint.k);return c;};
  const rPlanet=id=>(1.1+2.4*Math.sqrt(base[id].degree/maxDeg))*state.nsize;
  const rSun=s=>(3.6+3.2*Math.sqrt(s.n/maxN))*state.nsize;
  function clearMeshes(){[planets,suns,lines].forEach(o=>{if(o){scene.remove(o);if(o.geometry&&o!==planets&&o!==suns)o.geometry.dispose();o.material.dispose();}});glows.forEach(g=>{scene.remove(g);g.material.dispose();});glows=[];lblLayer.innerHTML='';sunLbl={};planetLbl={};realmLbl=[];}
  let sunLbl={},planetLbl={},realmLbl=[];
  function build(){
    clearMeshes();layout();
    planetIds=[];sunIds=[];slotOf={};
    systems.forEach(s=>{if(nodeVisible(s.sun))sunIds.push(s.sun);s.ids.slice(1).forEach(id=>{if(nodeVisible(id))planetIds.push(id);});});
    const bodyMat=emis=>SKIN.wire?new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.75}):new THREE.MeshLambertMaterial(emis?{color:0xffffff,emissive:emis}:{color:0xffffff});
    planets=new THREE.InstancedMesh(geo,bodyMat(null),Math.max(1,planetIds.length));planets.count=planetIds.length;planets.name='planets';
    planetIds.forEach((id,i)=>{slotOf[id]={mesh:'p',i};_m.makeScale(rPlanet(id),rPlanet(id),rPlanet(id)).setPosition(pos[id]);planets.setMatrixAt(i,_m);planets.setColorAt(i,skinCol(_c,base[id].color));});
    planets.instanceMatrix.needsUpdate=true;if(planets.instanceColor)planets.instanceColor.needsUpdate=true;scene.add(planets);
    if(SKIN.wire){   // a translucent core under the wire so the balls still read as solids from a distance
      const core=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.28,depthWrite:false}),Math.max(1,planetIds.length));core.count=planetIds.length;
      planetIds.forEach((id,i)=>{_m.makeScale(rPlanet(id)*0.92,rPlanet(id)*0.92,rPlanet(id)*0.92).setPosition(pos[id]);core.setMatrixAt(i,_m);core.setColorAt(i,skinCol(_c,base[id].color));});
      core.instanceMatrix.needsUpdate=true;if(core.instanceColor)core.instanceColor.needsUpdate=true;scene.add(core);glows.push(core);}
    suns=new THREE.InstancedMesh(geo,bodyMat(SKIN.sunEmissive),Math.max(1,sunIds.length));suns.count=sunIds.length;suns.name='suns';
    sunIds.forEach((id,i)=>{const s=systems.find(x=>x.sun===id);slotOf[id]={mesh:'s',i};const r=rSun(s);_m.makeScale(r,r,r).setPosition(pos[id]);suns.setMatrixAt(i,_m);suns.setColorAt(i,skinCol(_c,s.color).lerp(new THREE.Color(0xffffff),0.2));
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:skinCol(new THREE.Color(),s.color),transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));sp.position.copy(pos[id]);sp.scale.set(r*6,r*6,1);scene.add(sp);glows.push(sp);
      const d=document.createElement('div');d.className='lbl sun';d.textContent=s.label;d.dataset.id=id;d.addEventListener('click',()=>flyToSystem(s.cid));lblLayer.appendChild(d);sunLbl[id]=d;});
    suns.instanceMatrix.needsUpdate=true;if(suns.instanceColor)suns.instanceColor.needsUpdate=true;scene.add(suns);
    if(SKIN.rings){   // HUD orbit rings: one flat ring per system, sized to it, tilted with it
      const ring=new THREE.InstancedMesh(RING_GEO,new THREE.MeshBasicMaterial({color:SKIN.rim,transparent:true,opacity:0.35,side:THREE.DoubleSide,depthWrite:false}),Math.max(1,sunIds.length));ring.count=sunIds.length;
      sunIds.forEach((id,i)=>{const s=systems.find(x=>x.sun===id);const r=Math.max(s.r*0.9,rSun(s)*2.2);_m.makeRotationFromEuler(s.tilt).scale(new THREE.Vector3(r,r,1)).setPosition(pos[id]);ring.setMatrixAt(i,_m);});
      ring.instanceMatrix.needsUpdate=true;scene.add(ring);glows.push(ring);}
    buildStars();
    if(HAS_REALMS&&realmList.length>1)realmList.forEach(R=>{if(!R.name)return;const d=document.createElement('div');d.className='lbl realm';d.textContent=R.name;d.style.color=R.meta.color||'#fff';d.addEventListener('click',()=>flyToRealm(R.name));lblLayer.appendChild(d);realmLbl.push({d,R});
      const neb=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:R.meta.color||'#888',transparent:true,opacity:SKIN.nebula,blending:THREE.AdditiveBlending,depthWrite:false}));neb.position.copy(R.c);neb.scale.set(R.r*2.4,R.r*2.4,1);if(SKIN.nebula>0){scene.add(neb);glows.push(neb);}});
    buildEdges();buildExtras();
    if(focused!=null)showSystemLabels(focused);
  }
  function buildEdges(){
    if(lines){scene.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}
    edgeList=RAW_EDGES.filter(e=>pos[e.from]&&pos[e.to]&&edgeVisible(e)&&nodeVisible(e.from)&&nodeVisible(e.to));
    const P=new Float32Array(edgeList.length*6),C=new Float32Array(edgeList.length*6);edgeSlots={};
    edgeList.forEach((e,i)=>{const a=pos[e.from],b=pos[e.to];P.set([a.x,a.y,a.z,b.x,b.y,b.z],i*6);(edgeSlots[e.from]=edgeSlots[e.from]||[]).push(i);(edgeSlots[e.to]=edgeSlots[e.to]||[]).push(i);paintEdge(C,i,e,false);});
    edgeGeom=new THREE.BufferGeometry();edgeGeom.setAttribute('position',new THREE.BufferAttribute(P,3));edgeColor=new THREE.BufferAttribute(C,3);edgeGeom.setAttribute('color',edgeColor);
    lines=new THREE.LineSegments(edgeGeom,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:Math.min(1,SKIN.line*state.lw),depthWrite:false}));scene.add(lines);
    buildWalkers();
  }
  function paintEdge(C,i,e,hot){
    if(hot){C.set([1,1,1,1,1,1],i*6);return;}
    const cross=sysOf[e.from]!==sysOf[e.to];const inf=e.confidence!=='EXTRACTED';
    skinCol(_c,base[e.from].color).lerp(_fade,inf?0.72:(cross?0.45:0.55));
    if(cross&&!inf)_c.lerp(new THREE.Color(0xffffff),0.12);
    const xr=HAS_REALMS&&base[e.from].realm!==base[e.to].realm;
    if(xr)skinCol(_c,base[e.from].color).lerp(new THREE.Color(0xffffff),0.55);
    if(focused!=null&&sysOf[e.from]!==focused&&sysOf[e.to]!==focused)_c.lerp(_fade,xr?0.5:0.8);
    C.set([_c.r,_c.g,_c.b,_c.r,_c.g,_c.b],i*6);
  }
  function repaintEdges(){if(!edgeColor)return;edgeList.forEach((e,i)=>paintEdge(edgeColor.array,i,e,false));edgeColor.needsUpdate=true;}
  // ── hover / select ──
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(-9,-9);let hover=null,pendingPick=false,selected=null;
  function idAt(hit){if(!hit)return null;return hit.object===planets?planetIds[hit.instanceId]:sunIds[hit.instanceId];}
  let hoverM=null,hoverW=null;
  function pick(){pendingPick=false;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects([planets,suns].filter(Boolean));
    // a monarch under the pointer wins over whatever is behind it (never the one you're riding — it's right in front of the camera)
    let mh=null;if(monarchGroup.visible){const h=ray.intersectObject(monarchGroup,true)[0];if(h&&(!hits[0]||h.distance<hits[0].distance)){let o=h.object;while(o&&o.parent!==monarchGroup)o=o.parent;mh=monarchs.find(m=>m.g===o)||null;if(mh===ride)mh=null;}}
    if(mh!==hoverM){hoverM=mh;if(hoverM){setHover(null);renderer.domElement.style.cursor='pointer';tip.innerHTML='<b>🦋 Monarch</b><span>click to ride it · steer with the arrow keys or WASD</span>';tip.style.display='block';}else{tip.style.display='none';renderer.domElement.style.cursor='';}}
    if(hoverM)return;
    // a kinesin under the pointer (only the visible, zoomed-in ones can be hit)
    let wh=null;if(walkerGroup.visible&&!mh){const h=ray.intersectObject(walkerGroup,true)[0];if(h&&(!hits[0]||h.distance<hits[0].distance)){let o=h.object;while(o&&o.parent!==walkerGroup)o=o.parent;wh=walkers.find(w=>w.g===o)||null;if(wh===walk)wh=null;}}
    if(wh!==hoverW){hoverW=wh;if(hoverW){setHover(null);renderer.domElement.style.cursor='pointer';tip.innerHTML='<b>🧬 Kinesin</b><span>click to take it for a walk · arrows or WASD steer</span>';tip.style.display='block';}else if(!hoverM){tip.style.display='none';renderer.domElement.style.cursor='';}}
    if(hoverW)return;
    const id=idAt(hits[0]);if(id!==hover){setHover(id);}}
  function scaleSlot(id,k){const sl=slotOf[id];if(!sl)return;const mesh=sl.mesh==='p'?planets:suns;const r=(sl.mesh==='p'?rPlanet(id):rSun(systems.find(x=>x.sun===id)))*k;_m.makeScale(r,r,r).setPosition(pos[id]);mesh.setMatrixAt(sl.i,_m);mesh.instanceMatrix.needsUpdate=true;}
  function setHover(id){
    if(hover){scaleSlot(hover,1);(edgeSlots[hover]||[]).forEach(i=>paintEdge(edgeColor.array,i,edgeList[i],false));if(edgeColor)edgeColor.needsUpdate=true;}
    hover=id;renderer.domElement.style.cursor=id?'pointer':'';
    if(!id){tip.style.display='none';return;}
    scaleSlot(id,1.35);(edgeSlots[id]||[]).forEach(i=>paintEdge(edgeColor.array,i,edgeList[i],true));if(edgeColor)edgeColor.needsUpdate=true;
    const b=base[id];tip.innerHTML=`<b>${esc(b.label)}</b><span>${esc(b.cname||'')}${b.file?' · '+esc(b.file):''} · ${b.degree} connection${b.degree===1?'':'s'}</span>`;tip.style.display='block';
  }
  renderer.domElement.addEventListener('mousemove',ev=>{mouse.set(ev.clientX/window.innerWidth*2-1,-(ev.clientY/window.innerHeight)*2+1);tip.style.left=ev.clientX+'px';tip.style.top=ev.clientY+'px';pendingPick=true;});
  renderer.domElement.addEventListener('mouseleave',()=>{setHover(null);});
  let downAt=null;
  renderer.domElement.addEventListener('pointerdown',ev=>{downAt=[ev.clientX,ev.clientY];});
  renderer.domElement.addEventListener('click',ev=>{if(!downAt||Math.hypot(ev.clientX-downAt[0],ev.clientY-downAt[1])>4)return;pick();if(hoverM){beginRide(hoverM);return;}if(hoverW){beginWalk(hoverW);return;}if(hover)select(hover);});
  renderer.domElement.addEventListener('dblclick',ev=>{if(ride||walk)return;pick();if(hover)flyToSystem(sysOf[hover]);else flyHome();});
  function select(id){selected=id;showCard(id);}
  // ── camera ──
  let tw=null,focused=null;
  function flyTo(p,t,ms){if(idle)endIdle();if(ride)endRide();if(walk)endWalk();lastInput=performance.now();tw={p0:camera.position.clone(),p1:p.clone(),t0:controls.target.clone(),t1:t.clone(),s:performance.now(),ms:ms||1600};controls.autoRotate=false;}
  function homeCam(){const R=galaxyR;return new THREE.Vector3(0,-R*1.9,R*1.45);}
  let focusedRealm=null;
  function flyHome(){setFocused(null);focusedRealm=null;updateCrumb();flyTo(homeCam(),new THREE.Vector3(0,0,0),1500);}
  function flyToSystem(cid){const s=systems.find(x=>x.cid===cid);if(!s)return;setFocused(cid);
    const dir=s.c.length()>1?s.c.clone().normalize():new THREE.Vector3(0,-1,0.4).normalize();
    const p=s.c.clone().add(dir.multiplyScalar(s.r*2.3)).add(new THREE.Vector3(0,0,s.r*1.1));flyTo(p,s.c,1900);}
  function flyToRealm(name){const R=realmList.find(r=>r.name===name);if(!R)return;setFocused(null);focusedRealm=name;updateCrumb();flyTo(R.c.clone().add(new THREE.Vector3(0,-R.r*1.9,R.r*1.15)),R.c,1800);}
  function flyToNode(id){if(!pos[id])return;const s=systems.find(x=>x.cid===sysOf[id]);setFocused(sysOf[id]);
    const dir=camera.position.clone().sub(pos[id]);if(dir.length()<1)dir.set(0,-1,0.5);dir.normalize();
    flyTo(pos[id].clone().add(dir.multiplyScalar(Math.max(22,rPlanet(id)*14))),pos[id],1400);}
  const crumb=document.getElementById('crumb'),crumbName=document.getElementById('crumb-name'),crumbDot=document.getElementById('crumb-dot');
  function showSystemLabels(cid){Object.values(planetLbl).forEach(d=>d.remove());planetLbl={};if(!state.labels)return;const s=systems.find(x=>x.cid===cid);if(!s)return;
    s.ids.slice(1,161).forEach(id=>{if(!nodeVisible(id))return;const d=document.createElement('div');d.className='lbl';d.textContent=base[id].label;d.addEventListener('click',()=>focusNode(id));lblLayer.appendChild(d);planetLbl[id]=d;});}
  const multi=()=>HAS_REALMS&&realmList.length>1;
  function setFocused(cid){focused=cid;repaintEdges();Object.values(planetLbl).forEach(d=>d.remove());planetLbl={};
    if(cid!=null){const s=systems.find(x=>x.cid===cid);if(s&&s.realm)focusedRealm=s.realm;showSystemLabels(cid);}
    updateCrumb();}
  // breadcrumb pill at the top: where you are, and one button that takes you one level back out
  const crumbBack=document.getElementById('crumb-back');
  function updateCrumb(){
    if(focused!=null){const s=systems.find(x=>x.cid===focused);crumb.classList.add('on');crumbDot.style.background=s.color;
      crumbName.textContent=(multi()&&s.realm?s.realm+' › ':'')+s.label+' · '+s.n+' nodes';
      crumbBack.textContent=multi()&&s.realm?'‹ Back to '+s.realm:'‹ Back to galaxy';return;}
    if(focusedRealm!=null&&multi()){const R=realmList.find(r=>r.name===focusedRealm);crumb.classList.add('on');crumbDot.style.background=(R&&R.meta.color)||'#fff';
      crumbName.textContent=focusedRealm+' · '+(R?R.systems.length:0)+' groups';crumbBack.textContent='‹ Back to universe';return;}
    crumb.classList.remove('on');}
  crumbBack.addEventListener('click',()=>{if(focused!=null&&multi()&&focusedRealm)flyToRealm(focusedRealm);else flyHome();});
  // ── labels projection ──
  const _v=new THREE.Vector3();
  function projectLabels(){
    const W=window.innerWidth,H=window.innerHeight,cam=camera.position,taken=[],ppu=pxPer();
    const fits=(x,y,w,h)=>{for(const r of taken){if(x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y)return false;}taken.push({x,y,w,h});return true;};
    const off=d=>d.classList.remove('on');
    const put=(d,x,y,w,h)=>{if(x<-w||x>W+w||y<-h||y>H+h||!fits(x-w/2,y-h/2,w,h)){off(d);return;}d.style.transform=`translate(-50%,-50%) translate(${x|0}px,${y|0}px)`;d.classList.add('on');};
    const box=(text,px,pad)=>[text.length*px*0.62+pad,px+8];
    // galaxy names: only from outside the galaxy, pinned above it
    for(const {d,R} of realmLbl){const top=R.c.clone();top.z+=R.r*0.9;_v.copy(top).project(camera);const dist=cam.distanceTo(R.c);
      if(_v.z>1||dist<R.r*2.4){off(d);continue;}const [w,h]=box(R.name,13,40);put(d,(_v.x+1)/2*W,(1-_v.y)/2*H,w,h);}
    // system names: near their galaxy, biggest first, never overlapping
    const cands=[];
    for(const id in sunLbl){const R=sunRealm[id];const p=pos[id];const dR=R?cam.distanceTo(R.c):0;
      if(HAS_REALMS&&realmList.length>1&&R&&dR>R.r*2.6){off(sunLbl[id]);continue;}
      const dist=cam.distanceTo(p);const near=R?dist<R.r*1.6:dist<galaxyR*1.3;
      if(!near&&sysRank[id]>=(HAS_REALMS?6:36)){off(sunLbl[id]);continue;}
      if(sysN[id]<3&&dist>galaxyR*0.9){off(sunLbl[id]);continue;}
      if(focused!=null&&sysOf[id]!==focused){off(sunLbl[id]);continue;}   // inside a system only that system is named — no clutter from the neighbours
      const sys=sysBySun[id];if(sys&&sys.r*ppu/dist<(sysRank[id]<6?7:15)){off(sunLbl[id]);continue;}   // too small on screen to deserve a name
      _v.copy(p).project(camera);if(_v.z>1){off(sunLbl[id]);continue;}
      cands.push({id,rank:sysRank[id],x:(_v.x+1)/2*W,y:(1-_v.y)/2*H-12});}
    cands.sort((a,b)=>a.rank-b.rank);
    for(const c of cands){const d=sunLbl[c.id];const [w,h]=box(d.textContent,11.5,6);put(d,c.x,c.y,w,h);d.classList.toggle('dim',focused!=null&&sysOf[c.id]!==focused);}
    // member names inside the focused system, best-connected first
    const pl=[];
    for(const id in planetLbl){const p=pos[id];const dist=cam.distanceTo(p);_v.copy(p).project(camera);
      if(_v.z>1||dist>420*state.spacing||rPlanet(id)*ppu/dist<2.2){off(planetLbl[id]);continue;}pl.push({id,deg:base[id].degree,x:(_v.x+1)/2*W,y:(1-_v.y)/2*H-rPlanet(id)*1.2-9});}
    pl.sort((a,b)=>b.deg-a.deg);
    for(const c of pl){const d=planetLbl[c.id];const [w,h]=box(d.textContent,11,6);put(d,c.x,c.y,w,h);}
  }
  // ── loop ──
  let running=false;
  function frame(){if(!running)return;requestAnimationFrame(frame);
    if(tw){let k=Math.min(1,(performance.now()-tw.s)/tw.ms);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;camera.position.lerpVectors(tw.p0,tw.p1,k);controls.target.lerpVectors(tw.t0,tw.t1,k);if(k>=1){tw=null;controls.autoRotate=state.rotate;}}
    const nowT=performance.now(),dt=Math.min(0.05,(nowT-lastT)/1000);lastT=nowT;updateMonarchs(dt,nowT);rideStep(dt);updateWalkers(dt);walkStep(dt);extrasStep(dt,nowT);idleStep(dt,nowT);
    controls.update();if(pendingPick)pick();autoUnfocus();projectLabels();renderer.render(scene,camera);}
  // zoom right out of a system (or a galaxy) by hand and the focus lets go, so the map stops dimming and labelling around it
  function autoUnfocus(){if(tw||idle)return;const cam=camera.position;
    if(focused!=null){const s=systems.find(x=>x.cid===focused);if(s&&cam.distanceTo(s.c)>s.r*12){setFocused(null);}}
    if(focused==null&&focusedRealm!=null&&multi()){const R=realmList.find(r=>r.name===focusedRealm);if(R&&cam.distanceTo(R.c)>R.r*5){focusedRealm=null;updateCrumb();}}}
  function start(){if(running)return;running=true;frame();}
  function stop(){running=false;}
  window.addEventListener('resize',fitView);
  window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&view==='3d'&&!/INPUT|TEXTAREA/.test(ev.target.tagName)){if(document.getElementById('skins').classList.contains('on'))return;if(ride)endRide();else if(walk)endWalk();else flyHome();}});

  // ── monarchs: a few butterflies drifting through the galaxy ──
  // Built from primitives (no model to load): a body, four wings with a
  // hand-drawn monarch pattern, a slow flap with glide pauses, banking on
  // turns. They wander between systems and favour the one you're in.
  const monarchGroup=new THREE.Group();scene.add(monarchGroup);
  const monarchs=[];
  function wingTexture(kind,P){
    // 512px canvas per wing. Base (where it meets the body) is the left edge;
    // the forewing's tip points to the top-right (forward), the hindwing hangs back.
    const S=512,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
    const path=new Path2D();
    if(kind==='fore'){path.moveTo(10,330);path.bezierCurveTo(40,180,200,20,470,26);path.bezierCurveTo(500,60,478,190,420,290);path.bezierCurveTo(360,380,150,390,10,330);}
    else{path.moveTo(10,200);path.bezierCurveTo(90,80,330,70,450,180);path.bezierCurveTo(500,290,420,460,250,486);path.bezierCurveTo(120,496,10,380,10,200);}
    const base=kind==='fore'?[10,330]:[10,200];
    // orange with a warm gradient: deeper at the base, brighter at the tip
    const grad=x.createLinearGradient(0,0,S,0);grad.addColorStop(0,P.base);grad.addColorStop(.35,P.mid);grad.addColorStop(1,P.tip);
    x.fillStyle=grad;x.fill(path);
    x.save();x.clip(path);
    // veins: fine dark lines fanning from the base, with a few cross-veins
    x.strokeStyle=P.vein;x.lineCap='round';x.lineWidth=3.2;
    const tips=kind==='fore'?[[470,26],[476,100],[456,190],[420,290],[340,352],[240,380],[130,372]]:[[450,180],[470,120],[478,260],[420,380],[330,450],[220,486],[110,470]];
    tips.forEach(([tx,ty],i)=>{x.beginPath();x.moveTo(base[0],base[1]);const bend=kind==='fore'?-26:14;x.quadraticCurveTo((base[0]+tx)*0.55,(base[1]+ty)*0.5+bend*(i-3)/3,tx,ty);x.stroke();});
    x.lineWidth=2.2;
    const cross=kind==='fore'?[[300,110,330,200],[330,200,300,300],[190,220,200,320]]:[[290,150,330,250],[330,250,280,360],[170,220,190,340]];
    cross.forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.quadraticCurveTo((a+c2)/2+18,(b+d)/2,c2,d);x.stroke();});
    // veins thicken into the black margin band
    x.lineWidth=46;x.strokeStyle=P.margin;x.stroke(path);
    // forewing apex is black with pale spots
    if(kind==='fore'){x.fillStyle=P.margin;x.beginPath();x.moveTo(330,60);x.bezierCurveTo(400,20,470,26,470,26);x.bezierCurveTo(500,60,478,190,440,250);x.bezierCurveTo(400,190,360,130,330,60);x.fill();}
    // two rows of white spots along the margin
    x.fillStyle=P.spot;
    const outer=kind==='fore'?[[458,60],[470,110],[458,160],[436,214],[402,270],[352,322],[290,356],[220,372],[150,368]]:[[452,150],[468,210],[466,275],[434,350],[380,410],[300,458],[210,478],[120,458]];
    outer.forEach(([px,py],i)=>{x.beginPath();x.arc(px,py,i%2?4.2:6,0,7);x.fill();});
    const inner=kind==='fore'?[[430,120],[416,176],[386,236],[344,286],[290,322]]:[[428,190],[436,260],[402,330],[344,392],[268,432]];
    inner.forEach(([px,py])=>{x.beginPath();x.arc(px,py,3.2,0,7);x.fill();});
    if(kind==='fore'){x.fillStyle=P.glow;[[372,96],[400,140],[352,132]].forEach(([px,py])=>{x.beginPath();x.arc(px,py,9,0,7);x.fill();});}
    // soft dark shading at the base, like real scales
    const sh=x.createRadialGradient(base[0],base[1],10,base[0],base[1],260);sh.addColorStop(0,P.shade);sh.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sh;x.fillRect(0,0,S,S);
    x.restore();
    const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;
  }
  let WING_TEX=null,WING_FOR=null;
  function wingsFor(){if(WING_FOR!==SKIN){if(WING_TEX){WING_TEX.fore.dispose();WING_TEX.hind.dispose();}WING_TEX={fore:wingTexture('fore',SKIN.wings),hind:wingTexture('hind',SKIN.wings)};WING_FOR=SKIN;}return WING_TEX;}
  const WING_GEO=new THREE.PlaneGeometry(1,1,1,1);WING_GEO.translate(0.5,0,0);WING_GEO.rotateX(Math.PI/2);   // x∈[0,1] out from the body, tip forward (+z)
  const BODY_GEO=new THREE.CylinderGeometry(0.045,0.028,1,8);BODY_GEO.rotateX(Math.PI/2);
  const seedRng=seeded(4242);
  function makeMonarch(size){
    const g=new THREE.Group();
    const W=wingsFor();const body=new THREE.Mesh(BODY_GEO,new THREE.MeshLambertMaterial({color:SKIN.wings.body}));body.scale.set(size*1.3,size*1.3,size*0.6);g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.05*size,8,8),new THREE.MeshLambertMaterial({color:SKIN.wings.body}));head.position.z=size*0.3;g.add(head);
    const ant=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(-0.09*size,0.06*size,0.22*size),new THREE.Vector3(0,0,0),new THREE.Vector3(0.09*size,0.06*size,0.22*size)]);
    const antL=new THREE.LineSegments(ant,new THREE.LineBasicMaterial({color:SKIN.wings.body}));antL.position.z=size*0.3;g.add(antL);
    const wingMat=k=>new THREE.MeshBasicMaterial({map:W[k],transparent:true,alphaTest:0.5,side:THREE.DoubleSide});
    const pivots=[];
    [-1,1].forEach(side=>{
      const pv=new THREE.Group();
      const fore=new THREE.Mesh(WING_GEO,wingMat('fore'));fore.scale.set(side*size*0.5,1,size*0.4);fore.position.set(0,size*0.008,size*0.06);
      const hind=new THREE.Mesh(WING_GEO,wingMat('hind'));hind.scale.set(side*size*0.4,1,size*0.42);hind.position.set(0,-size*0.008,-size*0.16);
      pv.add(fore);pv.add(hind);g.add(pv);pivots.push({pv,side});
    });
    return {g,pivots};
  }
  function monarchTarget(m,now){
    const visible=s=>s.n>=2&&nodeVisible(s.sun);
    const home=realmList[m.realm]&&realmList[m.realm].systems.filter(visible);
    const pool=systems.filter(visible);
    let s=null;
    if(focused!=null&&seedRng()<0.35)s=systems.find(x=>x.cid===focused);          // a visitor drops by the system you're in
    if(!s&&home&&home.length&&seedRng()<0.8)s=home[Math.floor(seedRng()*home.length)]; // mostly roam their own galaxy
    if(!s&&pool.length)s=pool[Math.floor(seedRng()*pool.length)];                    // now and then cross to another
    const c=s?s.c:new THREE.Vector3(),r=s?s.r:galaxyR*0.5;
    const d=new THREE.Vector3(seedRng()-0.5,seedRng()-0.5,(seedRng()-0.5)*0.7).normalize();
    m.target=c.clone().add(d.multiplyScalar(r*(0.7+seedRng()*0.9)));
    m.tNext=now+30+seedRng()*30;   // long enough to actually get there
  }
  function buildMonarchs(){
    monarchs.forEach(m=>monarchGroup.remove(m.g));monarchs.length=0;
    const count=HAS_REALMS&&realmList.length>1?14:6;
    const base=Math.min(26,Math.max(5,galaxyR*0.013));
    for(let i=0;i<count;i++){
      const size=base*(0.8+seedRng()*0.5);
      const {g,pivots}=makeMonarch(size);g.up.set(0,0,1);
      // spawn spread out: each one starts in its own galaxy, at a random system there
      const realm=i%Math.max(1,realmList.length);const homeSys=(realmList[realm]&&realmList[realm].systems.length)?realmList[realm].systems[Math.floor(seedRng()*realmList[realm].systems.length)]:null;
      const start=homeSys?homeSys.c.clone().add(new THREE.Vector3(seedRng()-0.5,seedRng()-0.5,(seedRng()-0.5)*0.5).multiplyScalar(homeSys.r*1.5)):new THREE.Vector3((seedRng()-0.5)*galaxyR,(seedRng()-0.5)*galaxyR,0);
      const m={g,pivots,size,realm,pos:start,vel:new THREE.Vector3(),
        speed:Math.max(size*1.3,galaxyR*0.022)*(0.85+seedRng()*0.3),k:1,phase:seedRng()*6.28,amp:1,ampT:1,modeAt:0,seed:seedRng()*100,heading:0,bank:0,target:null,tNext:0};
      g.position.copy(m.pos);monarchGroup.add(g);monarchs.push(m);
    }
  }
  const _fwd=new THREE.Vector3(),_look=new THREE.Vector3();
  function updateMonarchs(dt,now){
    if(!monarchGroup.visible)return;
    const t=now/1000;
    for(const m of monarchs){
      if(m===ride){rideSteer(m,dt);continue;}
      if(!m.target||t>m.tNext||m.pos.distanceTo(m.target)<m.size*4)monarchTarget(m,t);
      // flap or glide: a few seconds of each, eased
      if(t>m.modeAt){m.ampT=seedRng()<0.62?1:0.14;m.modeAt=t+1.5+seedRng()*3.5;}
      m.amp+=(m.ampT-m.amp)*Math.min(1,dt*2.2);
      m.phase+=dt*(m.amp>0.5?10.5:5.5);
      const flap=0.2+m.amp*0.95*Math.sin(m.phase);
      m.pivots.forEach(({pv,side})=>{pv.rotation.z=side*flap;});
      // steer toward the target smoothly; slower while gliding
      _fwd.copy(m.target).sub(m.pos).normalize().multiplyScalar(m.speed*(0.7+0.4*m.amp));
      m.vel.lerp(_fwd,Math.min(1,dt*0.7));
      m.pos.addScaledVector(m.vel,dt);
      const prevHeading=m.heading;m.heading=Math.atan2(m.vel.y,m.vel.x);
      let turn=m.heading-prevHeading;turn=Math.atan2(Math.sin(turn),Math.cos(turn));
      m.bank+=(-turn*18-m.bank)*Math.min(1,dt*3);m.bank=Math.max(-0.9,Math.min(0.9,m.bank));
      m.g.position.copy(m.pos);m.g.position.z+=Math.sin(t*1.7+m.seed)*m.size*0.12;
      // from far away a monarch grows (up to 6×) so it stays a visible speck of orange; up close it is its true size
      const dCam=camera.position.distanceTo(m.g.position);m.k=Math.min(6,Math.max(1,(20*dCam/pxPer())/m.size));m.g.scale.setScalar(m.k);
      if(m.vel.lengthSq()>1e-6){_look.copy(m.g.position).add(m.vel);m.g.lookAt(_look);m.g.rotateZ(m.bank);}
    }
  }
  // ── kinesins: like the motor protein, a two-footed carrier walks hand-over-hand along a connection with a
  // packet of data on its back. Only some links get one, and they only show once you're close enough to see them.
  const walkerGroup=new THREE.Group();scene.add(walkerGroup);const walkers=[];
  const HEAD_GEO=new THREE.SphereGeometry(1,10,8),CARGO_GEO=new THREE.IcosahedronGeometry(1,0),STALK_GEO=new THREE.CylinderGeometry(1,1,1,6);
  const HEAD_MAT=new THREE.MeshLambertMaterial({color:0xdde3f2,emissive:0x2a3350}),STALK_MAT=new THREE.MeshLambertMaterial({color:0xbfc7dc});
  function skinKinesins(){const k=SKIN.kin||{};HEAD_MAT.color.set(k.head||0xdde3f2);HEAD_MAT.emissive.set(k.headEm||0x2a3350);STALK_MAT.color.set(k.stalk||0xbfc7dc);}
  const wRng=seeded(777);const _wa=new THREE.Vector3(),_wb=new THREE.Vector3(),_wb2=new THREE.Vector3(),_wr=new THREE.Vector3(),_wq=new THREE.Quaternion(),_Y=new THREE.Vector3(0,1,0);
  function walkerEdgeOK(i){const e=edgeList[i];if(!e||e.confidence!=='EXTRACTED'||sysOf[e.from]!==sysOf[e.to])return false;return pos[e.from].distanceTo(pos[e.to])>state.nsize*6;}
  function walkerSetEdge(w,i,fromId){const e=edgeList[i];w.i=i;w.a=fromId;w.b=e.from===fromId?e.to:e.from;
    w.dir=pos[w.b].clone().sub(pos[w.a]);w.len=w.dir.length();w.dir.normalize();
    const t=new THREE.Vector3().crossVectors(w.dir,new THREE.Vector3(0,0,1));if(t.lengthSq()<1e-6)t.set(1,0,0);t.normalize();
    w.n=new THREE.Vector3().crossVectors(t,w.dir).normalize();w.s=w.u*1.2;w.p=0;
    skinCol(w.cargo.material.color,base[w.a].color);w.cargo.material.emissive.copy(w.cargo.material.color);}
  function buildWalkers(){
    if(walk)endWalk();idleW=null;walkers.forEach(w=>walkerGroup.remove(w.g));walkers.length=0;skinKinesins();
    const ok=[];for(let i=0;i<edgeList.length;i++)if(walkerEdgeOK(i))ok.push(i);
    const count=Math.min(150,Math.max(0,Math.round(edgeList.length/25)),ok.length);
    for(let k=0;k<count;k++){
      const i=ok.splice(Math.floor(wRng()*ok.length),1)[0];const e=edgeList[i];
      const u=1.5*state.nsize,g=new THREE.Group();
      const heads=[0,1].map(()=>{const h=new THREE.Mesh(HEAD_GEO,HEAD_MAT);h.scale.setScalar(0.2*u);g.add(h);return h;});
      const legs=[0,1].map(()=>{const l=new THREE.Mesh(STALK_GEO,STALK_MAT);g.add(l);return l;});
      const stalk=new THREE.Mesh(STALK_GEO,STALK_MAT);g.add(stalk);
      const cargo=new THREE.Mesh(CARGO_GEO,new THREE.MeshLambertMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.5,transparent:true,opacity:0.88}));cargo.scale.setScalar(0.5*u);g.add(cargo);
      const w={g,heads,legs,stalk,cargo,u,L:0.45*u,period:0.5+wRng()*0.25,lead:0,i:-1};walkerSetEdge(w,i,wRng()<0.5?e.from:e.to);w.s=wRng()*Math.max(w.u,w.len-2*w.u);
      walkerGroup.add(g);walkers.push(w);}
  }
  function updateWalkers(dt){
    if(!walkerGroup.visible||!walkers.length)return;const ppu=pxPer(),cam=camera.position;
    for(const w of walkers){
      const ctl=w===walk;
      const mult=ctl?(held(' ')?0:held('Shift')?2.6:(held('ArrowUp','w')?1.7:0.7)):1;
      w.p+=dt/w.period*mult;
      while(w.p>=1){w.p-=1;w.s+=w.L;w.lead=1-w.lead;}
      if(w.s+w.L>w.len-w.u*0.8){   // reached the far node: carry on down another of its links, or turn back
        const opts=(edgeSlots[w.b]||[]).filter(j=>j!==w.i&&walkerEdgeOK(j));
        let next=opts.length?opts[Math.floor(wRng()*opts.length)]:null;
        if(ctl&&opts.length){const bias=(held('ArrowRight','d')?1:0)-(held('ArrowLeft','a')?1:0);
          if(bias){_wr.set(bias,0,0).applyQuaternion(camera.quaternion);let best=-2;for(const j of opts){const e=edgeList[j];const other=e.from===w.b?e.to:e.from;_wb2.copy(pos[other]).sub(pos[w.b]).normalize();const d=_wb2.dot(_wr);if(d>best){best=d;next=j;}}}}
        if(next!=null)walkerSetEdge(w,next,w.b);else walkerSetEdge(w,w.i,w.b);}
      _wa.copy(pos[w.a]).addScaledVector(w.dir,w.s);
      const dist=cam.distanceTo(_wa);const px=w.u*2.2*ppu/dist;w.g.visible=px>5||ctl||w===idleW;if(!w.g.visible)continue;
      const e=w.p<0.5?2*w.p*w.p:1-Math.pow(-2*w.p+2,2)/2;                            // the swinging foot eases through its step
      w.heads[w.lead].position.copy(_wa);                                                  // planted foot
      w.heads[1-w.lead].position.copy(pos[w.a]).addScaledVector(w.dir,w.s-w.L+2*w.L*e).addScaledVector(w.n,Math.sin(w.p*Math.PI)*w.L*0.55);
      _wb.copy(pos[w.a]).addScaledVector(w.dir,w.s+w.L*(e-0.5));                        // where the stalk meets the feet
      const lean=Math.sin((w.p+0.25)*Math.PI*2)*0.08;const stalkLen=w.u*1.5;
      w.stalk.scale.set(0.05*w.u,stalkLen,0.05*w.u);w.stalk.quaternion.copy(_wq.setFromUnitVectors(_Y,_wa.copy(w.n).addScaledVector(w.dir,lean).normalize()));
      w.stalk.position.copy(_wb).addScaledVector(_wa,stalkLen/2);
      w.cargo.position.copy(_wb).addScaledVector(_wa,stalkLen+0.35*w.u);
      w.cargo.rotation.y+=dt*0.8;
      // neck linkers: a thin leg from each foot up to the base of the stalk
      for(let f=0;f<2;f++){const leg=w.legs[f],foot=w.heads[f].position;_wb2.copy(_wb).addScaledVector(_wa,w.u*0.32).sub(foot);const len=_wb2.length();
        leg.scale.set(0.035*w.u,len,0.035*w.u);leg.quaternion.copy(_wq.setFromUnitVectors(_Y,_wb2.normalize()));leg.position.copy(foot).addScaledVector(_wb2,len/2);}
      w.cargo.material.opacity=0.6+0.28*Math.min(1,(px-5)/10);
    }
  }
  // ── ride a monarch: click one and you're flying it — arrows / WASD steer, Shift boosts, Space hovers, Esc hops off ──
  const rideEl=document.getElementById('ride-hint');
  let ride=null,rideHeading=0,ridePitch=0,trick=null;const keys=new Set();
  const TRICKS={q:{type:'roll',dir:1,dur:0.75},e:{type:'roll',dir:-1,dur:0.75},f:{type:'loop',dir:1,dur:1.25},g:{type:'loop',dir:-1,dur:1.25},x:{type:'spin',dir:1,dur:0.8}};
  function startTrick(k){if(!ride||trick||!TRICKS[k])return;trick=Object.assign({t:0},TRICKS[k]);}
  const keyName=ev=>ev.key.length===1?ev.key.toLowerCase():ev.key;
  window.addEventListener('keydown',ev=>{if((!ride&&!walk)||/INPUT|TEXTAREA/.test(ev.target.tagName))return;keys.add(keyName(ev));if(/^Arrow|^ $/.test(ev.key))ev.preventDefault();if(ride&&!ev.repeat)startTrick(keyName(ev));});
  window.addEventListener('keyup',ev=>{keys.delete(keyName(ev));});
  window.addEventListener('blur',()=>keys.clear());
  const held=(...ks)=>ks.some(k=>keys.has(k));
  function beginRide(m){if(!m)return;if(idle)endIdle();if(walk)endWalk();ride=m;trick=null;tw=null;controls.autoRotate=false;controls.enabled=false;keys.clear();
    hoverM=null;setHover(null);tip.style.display='none';renderer.domElement.style.cursor='';
    rideHeading=Math.atan2(m.vel.y,m.vel.x)||0;ridePitch=0;m.target=null;rideEl.classList.add('on');
    // start right behind it, no lerp-in from across the map
    rideCam(m,1);}
  function endRide(){const m=ride;if(!m)return;ride=null;trick=null;m.g.up.set(0,0,1);keys.clear();controls.enabled=true;controls.autoRotate=false;
    controls.target.copy(m.g.position);controls.update();monarchTarget(m,performance.now()/1000);lastInput=performance.now();rideEl.classList.remove('on');}
  const _up=new THREE.Vector3();
  function rideSteer(m,dt){
    const turn=(held('ArrowLeft','a')?1:0)-(held('ArrowRight','d')?1:0);
    const climb=(held('ArrowUp','w')?1:0)-(held('ArrowDown','s')?1:0);
    const boost=held('Shift'),hover=held(' ');
    rideHeading+=turn*dt*1.9;
    ridePitch+=(climb*0.8-ridePitch)*Math.min(1,dt*3);
    // a monarch you're flying is quick: 4× its roaming pace, 12× on a boost
    const sp=m.speed*(boost?12:hover?0.12:4);
    let pitch=ridePitch,extraRoll=0,side=0;
    if(trick){trick.t+=dt/trick.dur;const u=Math.min(1,trick.t),ease=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
      if(trick.type==='loop')pitch=ridePitch+trick.dir*ease*Math.PI*2;                       // a full loop through the vertical
      else if(trick.type==='roll'){extraRoll=trick.dir*ease*Math.PI*2;side=trick.dir*Math.sin(u*Math.PI)*m.size*1.6;}   // barrel roll: corkscrews sideways
      else if(trick.type==='spin')rideHeading+=trick.dir*dt/trick.dur*Math.PI*2;             // flat 360 spin
      if(trick.t>=1)trick=null;}
    _fwd.set(Math.cos(rideHeading)*Math.cos(pitch),Math.sin(rideHeading)*Math.cos(pitch),Math.sin(pitch)).multiplyScalar(sp);
    if(trick&&trick.type==='loop')m.vel.copy(_fwd);else m.vel.lerp(_fwd,Math.min(1,dt*3.5));
    m.pos.addScaledVector(m.vel,dt);
    if(m.pos.length()>galaxyR*1.8)m.pos.setLength(galaxyR*1.8);       // the universe has an edge
    // wings: beat hard on a boost, a climb or a trick; fold into a glide when hovering or diving
    m.ampT=hover?0.1:(boost||climb>0||trick)?1:(climb<0?0.2:m.ampT);if(!hover&&!boost&&!trick&&climb===0&&performance.now()/1000>m.modeAt){m.ampT=seedRng()<0.62?1:0.14;m.modeAt=performance.now()/1000+1.5+seedRng()*3.5;}
    m.amp+=(m.ampT-m.amp)*Math.min(1,dt*2.2);
    m.phase+=dt*(m.amp>0.5?(boost?14:10.5):5.5);
    const flap=0.2+m.amp*0.95*Math.sin(m.phase);
    m.pivots.forEach(({pv,side})=>{pv.rotation.z=side*flap;});
    m.bank+=(-turn*0.55-m.bank)*Math.min(1,dt*3);
    m.g.position.copy(m.pos);m.g.scale.setScalar(1);m.k=1;
    // through a loop the wings' "up" follows the arc, so it really goes over the top; otherwise up is up
    if(trick&&trick.type==='loop')m.g.up.set(-Math.cos(rideHeading)*Math.sin(pitch),-Math.sin(rideHeading)*Math.sin(pitch),Math.cos(pitch));else m.g.up.set(0,0,1);
    if(side){_up.set(-Math.sin(rideHeading),Math.cos(rideHeading),0);m.g.position.addScaledVector(_up,side);}
    if(m.vel.lengthSq()>1e-6){_look.copy(m.g.position).add(m.vel);m.g.lookAt(_look);m.g.rotateZ(m.bank+extraRoll);}
  }
  // ── walk a kinesin: click one and you're it. ↑/W hurry, ↓/S turn around, ←/→ pick the link at the next node, Shift sprint, Space rest, J jump to another galaxy ──
  let walk=null,idleW=null;const _wc=new THREE.Vector3(),_ws=new THREE.Vector3(),_wt=new THREE.Vector3();
  const RIDE_HTML=document.getElementById('ride-hint').innerHTML;
  const WALK_HTML='🧬 <kbd>↑</kbd><kbd>W</kbd> hurry &nbsp; <kbd>↓</kbd><kbd>S</kbd> turn around &nbsp; <kbd>← →</kbd><kbd>A D</kbd> pick the next link &nbsp; <kbd>Shift</kbd> sprint &nbsp; <kbd>Space</kbd> rest &nbsp; <kbd>J</kbd> jump to another galaxy<button id="ride-off">Esc · let go</button>';
  function setHint(html){const el=document.getElementById('ride-hint');el.innerHTML=html;el.querySelector('#ride-off').addEventListener('click',()=>{if(ride)endRide();if(walk)endWalk();});}
  function beginWalk(w){if(!w)return;if(idle)endIdle();if(ride)endRide();walk=w;tw=null;controls.autoRotate=false;controls.enabled=false;keys.clear();
    hoverW=null;setHover(null);tip.style.display='none';renderer.domElement.style.cursor='';setHint(WALK_HTML);rideEl.classList.add('on');walkCam(w,1);}
  function endWalk(){const w=walk;if(!w)return;walk=null;keys.clear();controls.enabled=true;controls.autoRotate=false;controls.target.copy(w.cargo.position);controls.update();lastInput=performance.now();rideEl.classList.remove('on');setHint(RIDE_HTML);}
  function walkTurn(w){walkerSetEdge(w,w.i,w.b);w.s=Math.max(w.u,w.len-w.s);}
  function walkJump(w){   // hop to a random link in a different galaxy (or anywhere else in a single map)
    const here=w.a&&base[w.a].realm;const ok=[];for(let i=0;i<edgeList.length;i++){if(!walkerEdgeOK(i))continue;if(multi()&&base[edgeList[i].from].realm===here)continue;ok.push(i);}
    if(!ok.length)return;const i=ok[Math.floor(wRng()*ok.length)],e=edgeList[i];walkerSetEdge(w,i,wRng()<0.5?e.from:e.to);w.s=w.u*1.2;
    const sys=systems.find(x=>x.cid===sysOf[w.a]);if(sys){setFocused(sys.cid);}walkCam(w,1);}
  window.addEventListener('keydown',ev=>{if(!walk||ev.repeat||/INPUT|TEXTAREA/.test(ev.target.tagName))return;const k=keyName(ev);if(k==='ArrowDown'||k==='s')walkTurn(walk);if(k==='j')walkJump(walk);});
  function walkCam(w,k){
    _ws.crossVectors(w.dir,w.n).normalize();
    _wc.copy(pos[w.a]).addScaledVector(w.dir,w.s);const u=w.u;
    _wt.copy(_wc).addScaledVector(w.n,u*1.85);   // where the cargo sits — computed, since a far-off kinesin's mesh hasn't been placed yet
    _wc.addScaledVector(w.n,u*2.6).addScaledVector(w.dir,-u*5).addScaledVector(_ws,u*3.2);
    camera.position.lerp(_wc,k);controls.target.lerp(_wt,Math.min(1,k*1.5));}
  function walkStep(dt){if(!walk)return;walkCam(walk,1-Math.exp(-dt*7));}
  const _rd=new THREE.Vector3(),_rf=new THREE.Vector3();
  function rideCam(m,k){
    // the camera trails the heading (yaw only), so loops and dives play out in front of you instead of throwing the view around
    _rf.set(Math.cos(rideHeading),Math.sin(rideHeading),0);
    const sz=m.size,back=held('Shift')?5.6:4.2;_rd.copy(m.g.position).addScaledVector(_rf,-sz*back).addScaledVector(_upZ,sz*1.4);
    camera.position.lerp(_rd,k);controls.target.copy(m.g.position).addScaledVector(_rf,sz*1.2);}
  function rideStep(dt){if(!ride)return;rideCam(ride,1-Math.exp(-dt*9));}
  // ── skin props: JARVIS targeting rings, the synthwave grid + sun ──
  const extras=new THREE.Group();scene.add(extras);let hudRings=[];
  function ringLine(r,dash,gap,op){const pts=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0));}
    const g=new THREE.BufferGeometry().setFromPoints(pts);const m=dash?new THREE.LineDashedMaterial({color:SKIN.rim,dashSize:dash,gapSize:gap,transparent:true,opacity:op,fog:false}):new THREE.LineBasicMaterial({color:SKIN.rim,transparent:true,opacity:op,fog:false});
    const l=new THREE.Line(g,m);if(dash)l.computeLineDistances();return l;}
  function buildExtras(){
    while(extras.children.length){const o=extras.children.pop();if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}}hudRings=[];
    if(SKIN.extras==='hud'){
      // three rings that sit on whatever you're looking at and turn at their own pace, plus a fixed outer reticle around the whole galaxy
      [[1,0.12,0.06,0.85,0.35],[1.18,0.02,0.05,0.5,-0.22],[1.36,0.3,0.12,0.35,0.12]].forEach(([r,d,g,op,spd])=>{const l=ringLine(r,d,g,op);l.userData.spd=spd;extras.add(l);hudRings.push(l);});
      const tick=new THREE.Group();for(let i=0;i<36;i++){const a=i/36*Math.PI*2,len=i%9===0?0.12:0.05;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*1.5,Math.sin(a)*1.5,0),new THREE.Vector3(Math.cos(a)*(1.5+len),Math.sin(a)*(1.5+len),0)]);tick.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:SKIN.rim,transparent:true,opacity:0.5,fog:false})));}
      tick.userData.spd=-0.05;extras.add(tick);hudRings.push(tick);
    }
    if(SKIN.extras==='grid'){const size=Math.max(400,galaxyR)*9,grid=new THREE.GridHelper(size,120,0xffffff,0xffffff);grid.rotation.x=Math.PI/2;grid.position.z=-galaxyR*0.7;grid.material.transparent=true;grid.material.opacity=0.10;extras.add(grid);}
    if(SKIN.extras==='synth'){
      const size=Math.max(400,galaxyR)*9,grid=new THREE.GridHelper(size,90,0xff3fd0,0x7a2ea8);grid.rotation.x=Math.PI/2;grid.position.z=-galaxyR*0.7;grid.material.transparent=true;grid.material.opacity=0.42;extras.add(grid);
      const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#ffe066');g.addColorStop(0.55,'#ff5fa8');g.addColorStop(1,'#a03cff');x.fillStyle=g;x.beginPath();x.arc(128,128,124,0,7);x.fill();
      x.globalCompositeOperation='destination-out';for(let y=150;y<256;y+=14){x.fillRect(0,y,256,Math.min(9,(y-140)/9));}
      const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0.95,depthWrite:false,fog:false}));sun.position.set(0,galaxyR*7,-galaxyR*3.2);sun.scale.set(galaxyR*2.6,galaxyR*2.6,1);extras.add(sun);
    }
  }
  function extrasStep(dt,now){
    if(!hudRings.length)return;
    let c=null,r=galaxyR*1.05;
    if(focused!=null){const s=systems.find(x=>x.cid===focused);if(s){c=s.c;r=s.r*1.5;}}
    else if(focusedRealm!=null&&multi()){const R=realmList.find(x=>x.name===focusedRealm);if(R){c=R.c;r=R.r*1.15;}}
    c=c||new THREE.Vector3();
    for(const l of hudRings){l.position.lerp(c,1-Math.exp(-dt*5));const k=l.scale.x+(r-l.scale.x)*(1-Math.exp(-dt*5));l.scale.set(k,k,k);
      l.quaternion.copy(camera.quaternion);l.rotateZ(now/1000*l.userData.spd*Math.PI*2);}
  }
  let lastT=performance.now();
  // ── idle tour: leave the page alone and the camera rides along with a monarch ──
  const idleEl=document.getElementById('idle-hint');
  let idle=false,idleAfter=10000,lastInput=performance.now(),follow=null,followSince=0,followUntil=0;
  const _des=new THREE.Vector3(),_side=new THREE.Vector3(),_fwdN=new THREE.Vector3(),_upZ=new THREE.Vector3(0,0,1);
  function touch(){lastInput=performance.now();if(idle)endIdle();}
  ['pointerdown','pointermove','wheel','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,touch,{passive:true}));
  function pickFollow(now){const ms=monarchGroup.visible?monarchs.filter(m=>m!==follow):[],ws=walkerGroup.visible?walkers.filter(w=>w!==follow):[];
    const useW=ws.length&&(!ms.length||seedRng()<0.5);const pool=useW?ws:ms;follow=pool.length?pool[Math.floor(seedRng()*pool.length)]:null;idleW=useW?follow:null;
    followSince=now;followUntil=now+(useW?25000:40000)+seedRng()*25000;idleEl.textContent=useW?'🧬 Watching a kinesin at work — move the mouse to take over':'🦋 Riding along with a monarch — move the mouse to take over';}
  function beginIdle(now){if(!((monarchs.length&&monarchGroup.visible)||(walkers.length&&walkerGroup.visible)))return;idle=true;tw=null;controls.autoRotate=false;tip.style.display='none';setHover(null);pickFollow(now);idleEl.classList.add('on');}
  function endIdle(){idle=false;follow=null;idleW=null;controls.autoRotate=state.rotate;idleEl.classList.remove('on');}
  function idleStep(dt,now){
    if(ride||walk)return;
    if(!state.idle||!(monarchGroup.visible||walkerGroup.visible)){if(idle)endIdle();return;}
    if(!idle){if(!tw&&now-lastInput>idleAfter)beginIdle(now);return;}
    if(!follow||now>followUntil)pickFollow(now);
    if(!follow)return;
    if(idleW){const settling=Math.min(1,(now-followSince)/3000);walkCam(idleW,1-Math.exp(-dt*(0.8+3*settling)));return;}
    const m=follow;const settling=Math.min(1,(now-followSince)/4500);            // ease in over the first seconds, then hold close
    _fwdN.copy(m.vel);if(_fwdN.lengthSq()<1e-6)_fwdN.set(1,0,0);_fwdN.normalize();
    _side.crossVectors(_fwdN,_upZ).normalize();
    const sway=Math.sin(now/1000*0.22+m.seed)*1.4;
    const sz=m.size*(m.k||1);_des.copy(m.g.position).addScaledVector(_fwdN,-sz*4.6).addScaledVector(_upZ,sz*1.5).addScaledVector(_side,sz*sway);
    const k=1-Math.exp(-dt*(0.5+1.6*settling));
    camera.position.lerp(_des,k);
    controls.target.lerp(m.g.position,1-Math.exp(-dt*(1+3*settling)));
  }
  build();buildMonarchs();monarchGroup.visible=state.monarchs&&SKIN.monarchs!==false;camera.position.copy(homeCam());controls.target.set(0,0,0);controls.update();
  return {start,stop,build,buildEdges,repaintEdges,flyToSystem,flyToNode,flyToRealm,flyHome,
    setMonarchs(on){monarchGroup.visible=!!on&&SKIN.monarchs!==false;if(!on&&ride)endRide();if(idle)endIdle();},rebuildMonarchs(){if(ride)endRide();buildMonarchs();},
    ride(i){beginRide(monarchs[i||0]);},hopOff:endRide,isRiding(){return !!ride;},ridePos(){return ride?ride.pos.toArray():null;},trick:startTrick,inTrick(){return trick?trick.type:null;},rideUp(){return ride?ride.g.up.toArray():null;},
    setIdle(on){state.idle=!!on;if(!on&&idle)endIdle();},setIdleAfter(ms){idleAfter=ms;},isIdle(){return idle;},
    peekMonarch(i){const m=monarchs[i||0];if(!m)return;tw=null;controls.autoRotate=false;controls.target.copy(m.g.position);camera.position.copy(m.g.position).add(new THREE.Vector3(m.size*1.6,-m.size*2.6,m.size*1.4));controls.update();},
    fitView,setWalkers(on){walkerGroup.visible=!!on;if(!on&&walk)endWalk();if(idle)endIdle();},walkerCount(){return walkers.length;},walkerNode(i){const w=walkers[i||0];return w?w.a:null;},walkIt(i){beginWalk(walkers[i||0]);},walkDbg(){const w=walk;if(!w)return null;const v=w.cargo.position.clone().project(camera);return {vis:w.g.visible,cam:camera.position.toArray().map(x=>+x.toFixed(1)),cargo:w.cargo.position.toArray().map(x=>+x.toFixed(1)),tgt:controls.target.toArray().map(x=>+x.toFixed(1)),ndc:[+v.x.toFixed(2),+v.y.toFixed(2),+v.z.toFixed(3)],dist:+camera.position.distanceTo(w.cargo.position).toFixed(1),u:w.u,scale:w.g.scale.x};},isWalking(){return !!walk;},walkPos(){return walk?[walk.a,walk.b,+walk.s.toFixed(1)]:null;},walkRealm(){return walk?base[walk.a].realm:null;},
    peekWalker(i){const w=walkers[i||0];if(!w)return;tw=null;controls.autoRotate=false;const c=w.cargo.position.clone();controls.target.copy(c);camera.position.copy(c).addScaledVector(w.n,w.u*1.2).addScaledVector(new THREE.Vector3().crossVectors(w.dir,w.n),w.u*7);controls.update();},
    setSpeed(v){controls.autoRotateSpeed=v;},setRotate(on){controls.autoRotate=on;},
    setLineOpacity(){if(lines)lines.material.opacity=Math.min(1,SKIN.line*state.lw);},
    reskin(){_fade.set(SKIN.fade);scene.background.set(SKIN.sky);scene.fog.color.set(SKIN.sky);scene.fog.density=SKIN.fog;rim.color.set(SKIN.rim);ambient.intensity=SKIN.ambient;
      if(ride)endRide();if(walk)endWalk();build();buildMonarchs();monarchGroup.visible=state.monarchs&&SKIN.monarchs!==false;},
    relabel(){if(focused!=null)showSystemLabels(focused);},
    systems};
})();

// ══════════════════════════════════════════ 2D — flat map (vis-network) ══
let network=null,nodesDS=null,edgesDS=null,lit=null;
function init2D(){
  if(network||!window.vis)return;
  nodesDS=new vis.DataSet(RAW_NODES.map(n=>{const col=base[n.id].color;
    const nd={id:n.id,label:n.label,title:n.title,value:1+(n.degree||1),shape:'dot',
      color:{background:col,border:col,highlight:{background:'#fff',border:'#fff'},hover:{background:'#fff',border:'#fff'}},borderWidth:n.borderWidth||0,
      font:{color:'#cfcfd4',face:FONT,size:11,strokeWidth:0},_community:n.community,_degree:n.degree};
    if(n.shapeProperties)nd.shapeProperties=n.shapeProperties;return nd;}));
  edgesDS=new vis.DataSet(RAW_EDGES.map((e,i)=>({id:i,from:e.from,to:e.to,title:e.title,label:'',_relation:e.label,_confidence:e.confidence,
    dashes:e.confidence!=='EXTRACTED',width:e.confidence==='EXTRACTED'?1.2:0.8,color:{color:e.confidence==='EXTRACTED'?'#4a4a52':'#3a3a40',opacity:1},arrows:{to:{enabled:true,scaleFactor:0.35}},smooth:false})));
  const physicsOpts=()=>({enabled:state.live,solver:'barnesHut',barnesHut:{gravitationalConstant:-state.repel,centralGravity:state.center,springLength:state.dist,springConstant:0.04,damping:0.5,avoidOverlap:0.25},minVelocity:0.6,stabilization:false});
  network=new vis.Network(document.getElementById('graph'),{nodes:nodesDS,edges:edgesDS},{
    physics:{enabled:true,solver:'barnesHut',barnesHut:{gravitationalConstant:-2600,centralGravity:0.35,springLength:80,springConstant:0.04,damping:0.5,avoidOverlap:0.25},stabilization:{iterations:350,updateInterval:50}},
    interaction:{hover:true,hoverConnectedEdges:false,selectConnectedEdges:false,tooltipDelay:200,navigationButtons:false,keyboard:false,zoomSpeed:0.8},
    nodes:{shadow:false,scaling:{min:4*state.nsize,max:36*state.nsize,label:{enabled:true,min:9,max:22,drawThreshold:8,maxVisible:36}}},
    edges:{smooth:false,selectionWidth:0,hoverWidth:0},layout:{improvedLayout:false}});
  network.once('stabilizationIterationsDone',()=>{network.setOptions({physics:physicsOpts()});network.fit({animation:{duration:500}});});
  const edgeBase=e=>({color:e._confidence==='EXTRACTED'?'#4a4a52':'#3a3a40',opacity:1});
  const edgeWidth=e=>(e._confidence==='EXTRACTED'?1.2:0.8)*state.lw;
  const fontFor=on=>({color:on?'#cfcfd4':'rgba(0,0,0,0)',face:FONT,size:11,strokeWidth:0});
  function unlight(){if(!lit)return;nodesDS.update(lit.nodes.map(id=>base[id]?{id,color:{background:base[id].color,border:base[id].color},font:fontFor(state.labels)}:null).filter(Boolean));edgesDS.update(lit.edges.map(id=>{const e=edgesDS.get(id);return e?{id,color:edgeBase(e),width:edgeWidth(e)}:null;}).filter(Boolean));lit=null;}
  function light(id){unlight();const ns=[id,...network.getConnectedNodes(id)].slice(0,400),es=network.getConnectedEdges(id).slice(0,600);
    nodesDS.update(ns.map(nid=>({id:nid,color:{background:nid===id?'#ffffff':base[nid].color,border:'#ffffff'},font:{color:'#f5f5f5',face:FONT,size:nid===id?14:11,strokeWidth:0}})));
    edgesDS.update(es.map(eid=>({id:eid,color:{color:'#d8d8dc',opacity:1},width:Math.max(1.6,edgeWidth(edgesDS.get(eid))+0.8)})));lit={nodes:ns,edges:es};}
  let hoverTimer=null;
  network.on('hoverNode',p=>{clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>light(p.node),60);});
  network.on('blurNode',()=>{clearTimeout(hoverTimer);unlight();});
  network.on('doubleClick',p=>{const id=p.nodes[0];if(id!=null)network.focus(id,{scale:Math.max(network.getScale()*2.2,1.6),animation:{duration:500,easingFunction:'easeInOutQuad'}});});
  network.on('click',p=>{if(p.nodes[0]!=null)showCard(p.nodes[0]);else if(p.edges[0]!=null){const e=edgesDS.get(p.edges[0]);if(e)showEdgeCard(e.from,e.to,e._relation,e._confidence);}});
  window.__apply2D=function(){nodesDS.update(nodesDS.get().map(nd=>({id:nd.id,hidden:state.hidden.has(nd._community),font:fontFor(state.labels)})));edgesDS.update(edgesDS.get().map(e=>({id:e.id,hidden:!state.inferred&&e._confidence!=='EXTRACTED'})));};
  window.__physics2D=function(){network.setOptions({physics:physicsOpts()});};
  window.__lw2D=function(){edgesDS.update(edgesDS.get().map(e=>({id:e.id,width:edgeWidth(e)})));};
  window.__apply2D();
  try{__atlasHyper();}catch(e){}
}
function __atlasHyper(){
""" + hyperedge_body + """
}
// Kept for the upstream legend API surface (used by older embeds).
function toggleAllCommunities(hide){if(hide)LEGEND.forEach(g=>state.hidden.add(g.cid));else state.hidden.clear();renderGroups();applyVisibility();}

// ══════════════════════════════════════════ shared UI ══
function setView(v){if(v==='3d'&&!V3)v='2d';view=v;document.body.dataset.view=v;try{localStorage.setItem('atlas.view',v);}catch(e){}
  document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='2d'){if(V3)V3.stop();init2D();}else{V3.start();}}
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v)));
function applyVisibility(){if(V3){V3.build();}if(network)window.__apply2D();}
const groups=document.getElementById('groups');
function renderGroups(){groups.innerHTML='';let lastRealm=null;LEGEND.forEach(g=>{
  if(HAS_REALMS){const r=realmOfCid[g.cid]||'';if(r!==lastRealm){lastRealm=r;const meta=REALMS.find(x=>x.name===r)||{};const h=document.createElement('div');h.className='grp-h';h.innerHTML=`<i class="sw" style="background:${meta.color||'#9e9e9e'}"></i>${esc(r||'Other')}`;h.addEventListener('click',()=>{if(view==='3d'&&V3)V3.flyToRealm(r);});groups.appendChild(h);}}
  const l=document.createElement('div');l.className='grp';
  l.innerHTML=`<span class="n" title="Fly to ${esc(g.label)}"><i class="sw" style="background:${g.color}"></i><span class="t">${esc(g.label)}</span><span class="c">${g.count}</span><span class="fly only-3d">fly ›</span></span><input class="tg" type="checkbox" ${state.hidden.has(g.cid)?'':'checked'}>`;
  l.querySelector('input').addEventListener('change',ev=>{ev.target.checked?state.hidden.delete(g.cid):state.hidden.add(g.cid);applyVisibility();});
  l.querySelector('.n').addEventListener('click',()=>{if(view==='3d'&&V3)V3.flyToSystem(g.cid);else if(network){const hub=RAW_NODES.filter(n=>n.community===g.cid).sort((a,b)=>b.degree-a.degree)[0];if(hub)focusNode(hub.id);}});
  groups.appendChild(l);});}
renderGroups();
(()=>{const wrap=document.getElementById('realms-wrap'),el=document.getElementById('realms');if(!HAS_REALMS||REALMS.length<2){wrap.remove();return;}
  REALMS.forEach(r=>{const d=document.createElement('div');d.className='realm-row';d.innerHTML=`<i class="sw" style="background:${r.color}"></i><span>${esc(r.name)}</span><span class="c">${r.nodes} nodes</span>`;d.addEventListener('click',()=>{if(view==='3d'&&V3)V3.flyToRealm(r.name);});el.appendChild(d);});})();
document.getElementById('grp-all').addEventListener('click',()=>{state.hidden.clear();renderGroups();applyVisibility();});
document.getElementById('grp-none').addEventListener('click',()=>{LEGEND.forEach(g=>state.hidden.add(g.cid));renderGroups();applyVisibility();});
document.getElementById('inferred').addEventListener('change',ev=>{state.inferred=ev.target.checked;if(V3)V3.buildEdges();if(network)window.__apply2D();});
document.getElementById('labels').addEventListener('change',ev=>{state.labels=ev.target.checked;if(V3)V3.relabel();if(network)window.__apply2D();});
document.getElementById('monarchs').addEventListener('change',ev=>{state.monarchs=ev.target.checked;if(V3)V3.setMonarchs(state.monarchs);});
document.getElementById('walkers').addEventListener('change',ev=>{state.walkers=ev.target.checked;if(V3)V3.setWalkers(state.walkers);});
const slider=(id,fmt,fn)=>{const el=document.getElementById(id),v=document.getElementById(id+'-v');el.addEventListener('input',()=>{v.textContent=fmt(parseFloat(el.value));fn(parseFloat(el.value));});};
slider('nsize',x=>x.toFixed(1),x=>{state.nsize=x;if(V3)V3.build();if(network)network.setOptions({nodes:{scaling:{min:4*x,max:36*x}}});});
slider('lw',x=>x.toFixed(1),x=>{state.lw=x;if(V3)V3.setLineOpacity();if(network)window.__lw2D();});
slider('speed',x=>x.toFixed(1),x=>{state.speed=x;if(V3)V3.setSpeed(x);});
slider('spacing',x=>x.toFixed(2),x=>{state.spacing=x;if(V3){V3.build();V3.rebuildMonarchs();}});
document.getElementById('rotate').addEventListener('change',ev=>{state.rotate=ev.target.checked;if(V3)V3.setRotate(state.rotate);});
document.getElementById('idle').addEventListener('change',ev=>{if(V3)V3.setIdle(ev.target.checked);});
slider('f-center',x=>x.toFixed(2),x=>{state.center=x;if(network)window.__physics2D();});
slider('f-repel',x=>String(x),x=>{state.repel=x;if(network)window.__physics2D();});
slider('f-dist',x=>String(x),x=>{state.dist=x;if(network)window.__physics2D();});
document.getElementById('live').addEventListener('change',ev=>{state.live=ev.target.checked;if(network)window.__physics2D();});
// ── skins: apply + picker ──
function previewSVG(s){
  const W=240,H=135,pv=s.pv||{};let _r=11;const rng=()=>{_r=(_r*9301+49297)%233280;return _r/233280;};let o=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sun-${s.name}"><stop offset="0" stop-color="#ffe066"/><stop offset=".55" stop-color="#ff5fa8"/><stop offset="1" stop-color="#a03cff"/></radialGradient><pattern id="scan-${s.name}" width="1" height="3" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="rgba(0,0,0,.35)"/></pattern></defs><rect width="${W}" height="${H}" fill="${s.css.sky}"/>`;
  if(pv.stars)for(let i=0;i<80;i++)o+=`<circle cx="${(rng()*W).toFixed(1)}" cy="${(rng()*H).toFixed(1)}" r="${(0.4+rng()*0.7).toFixed(2)}" fill="${pv.stars}" opacity="${(0.3+rng()*0.6).toFixed(2)}"/>`;
  if(pv.rain)for(let i=0;i<26;i++){const x=i*9.4+2,n=3+Math.floor(rng()*9),y0=rng()*H;for(let k=0;k<n;k++)o+=`<rect x="${x}" y="${((y0+k*7)%H).toFixed(1)}" width="3.5" height="5" fill="${s.css.accent}" opacity="${(0.12+0.5*(k/n)).toFixed(2)}"/>`;}
  if(pv.sun)o+=`<circle cx="120" cy="52" r="30" fill="url(#sun-${s.name})"/>`+[62,70,77,83].map((y,i)=>`<rect x="88" y="${y}" width="64" height="${2+i}" fill="${s.css.sky}"/>`).join('');
  if(pv.grid){for(let i=0;i<=8;i++){const x=i*30;o+=`<line x1="${x}" y1="${H}" x2="${120+(x-120)*0.25}" y2="82" stroke="${s.css.accent}" stroke-opacity=".35"/>`;}for(let i=0;i<5;i++){const y=82+i*i*3.2;o+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${s.css.accent}" stroke-opacity=".3"/>`;}}
  if(pv.blueprint){for(let x=0;x<W;x+=16)o+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-opacity=".08"/>`;for(let y=0;y<H;y+=16)o+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-opacity=".08"/>`;}
  const sys=[[74,64,24],[158,48,17],[128,102,13]],cols=pv.cols;
  o+=`<g stroke="${s.css.accent}" stroke-opacity=".45"><line x1="74" y1="64" x2="158" y2="48"/><line x1="74" y1="64" x2="128" y2="102"/><line x1="158" y1="48" x2="128" y2="102"/></g>`;
  sys.forEach(([cx,cy,r],si)=>{o+=`<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="${cols[si%cols.length]}" opacity=".14"/>`;
    for(let k=0;k<9;k++){const a=k/9*6.28+si,rr=r*(0.55+0.45*((k*7)%3)/2),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*0.7,c=cols[(k+si)%cols.length];
      o+=pv.wire?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="none" stroke="${c}" stroke-width=".8"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${c}"/>`;
      if(k%3===0)o+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-opacity=".35"/>`;}
    o+=`<circle cx="${cx}" cy="${cy}" r="4.2" fill="${pv.wire?s.css.accent:'#fff'}"/>`;});
  if(pv.rings)o+=`<g fill="none" stroke="${s.css.accent}"><circle cx="74" cy="64" r="30" stroke-dasharray="7 4" opacity=".8"/><circle cx="74" cy="64" r="36" stroke-dasharray="1 5" opacity=".55"/><circle cx="74" cy="64" r="42" stroke-dasharray="14 8" opacity=".35"/></g><g stroke="${s.css.accent}" opacity=".6"><path d="M6 6h14M6 6v14M234 6h-14M234 6v14M6 129h14M6 129v-14M234 129h-14M234 129v-14" fill="none" stroke-width="1.5"/></g>`;
  if(pv.butterfly)o+=`<text x="188" y="112" font-size="16">🦋</text><text x="40" y="118" font-size="11">🦋</text>`;
  if(pv.scan)o+=`<rect width="${W}" height="${H}" fill="url(#scan-${s.name})"/>`;
  return o+'</svg>';
}
function applySkin(key,first){
  if(!SKINS[key])return;skinKey=key;SKIN=SKINS[key];
  const r=document.documentElement.style;Object.entries(SKIN.css).forEach(([k,v])=>r.setProperty('--'+k,v));if(!SKIN.css.font)r.removeProperty('--font');
  document.body.dataset.skin=key;document.getElementById('brand-mark').textContent=SKIN.mark;document.getElementById('skin-name').textContent=SKIN.name;
  document.querySelectorAll('.skin').forEach(el=>el.classList.toggle('on',el.dataset.skin===key));
  try{localStorage.setItem('atlas.skin',key);}catch(e){}
  if(!first&&V3)V3.reskin();
  rain(key==='matrix');
}
// matrix rain: a 2D overlay behind the labels — the graph itself stays the same 3D universe
let rainTimer=null;
function rain(on){const c=document.getElementById('fx-canvas');if(rainTimer){cancelAnimationFrame(rainTimer);rainTimer=null;}if(!on){c.width=c.height=1;return;}
  const x=c.getContext('2d');const glyphs='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789ABCDEF<>/{}=;';let cols=[],last=0;
  const size=()=>{c.width=innerWidth;c.height=innerHeight;cols=Array.from({length:Math.ceil(c.width/22)},()=>Math.floor(Math.random()*c.height/16));};size();window.addEventListener('resize',size);
  const tick=t=>{rainTimer=requestAnimationFrame(tick);if(t-last<90)return;last=t;x.clearRect(0,0,c.width,c.height);x.font='13px monospace';
    cols.forEach((y,i)=>{for(let k=0;k<14;k++){const yy=y-k;if(yy<0)break;x.fillStyle=k===0?'rgba(201,255,210,.9)':`rgba(60,255,106,${(0.5*(1-k/14)).toFixed(2)})`;x.fillText(glyphs[(i*7+yy)%glyphs.length],i*22,yy*16);}cols[i]=(y*16>c.height+220&&Math.random()>0.97)?0:y+1;});};
  rainTimer=requestAnimationFrame(tick);}
const skinsEl=document.getElementById('skins'),skinsGrid=document.getElementById('skins-grid');
Object.entries(SKINS).forEach(([k,s])=>{const d=document.createElement('div');d.className='skin'+(k===skinKey?' on':'');d.dataset.skin=k;
  d.innerHTML=`${previewSVG(s)}<div class="meta"><b>${s.mark} ${esc(s.name)}${k===DEFAULT_SKIN?'<em>default</em>':''}</b><p>${esc(s.tag)}</p><div class="chips">${s.features.map(f=>`<i>${esc(f)}</i>`).join('')}</div></div>`;
  d.addEventListener('click',()=>{applySkin(k);closeSkins();});skinsGrid.appendChild(d);});
function openSkins(){skinsEl.classList.add('on');}function closeSkins(){skinsEl.classList.remove('on');}
document.getElementById('skin-btn').addEventListener('click',openSkins);document.getElementById('skin-btn-2').addEventListener('click',openSkins);
document.getElementById('skins-x').addEventListener('click',closeSkins);skinsEl.addEventListener('click',ev=>{if(ev.target===skinsEl)closeSkins();});
window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&skinsEl.classList.contains('on'))closeSkins();});
applySkin(skinKey,true);
window.__atlasSkin=applySkin;
const panel=document.getElementById('settings'),minBtn=document.getElementById('min');
minBtn.addEventListener('click',()=>{panel.classList.toggle('min');minBtn.textContent=panel.classList.contains('min')?'+':'–';if(V3)V3.fitView();});
document.getElementById('home').addEventListener('click',()=>{if(view==='3d'&&V3)V3.flyHome();else if(network)network.fit({animation:{duration:500}});});

// ── preview card ──
const card=document.getElementById('card'),cb=document.getElementById('card-body');
document.getElementById('card-x').addEventListener('click',()=>{card.hidden=true;});
function showCard(id){const b=base[id];if(!b)return;card.hidden=false;
  const out=outAdj[id]||[],inn=inAdj[id]||[];const lbl=x=>base[x]?base[x].label:x;
  cb.innerHTML=`<div class="tag"><i style="background:${b.color}"></i>${b.realm?esc(b.realm)+' · ':''}${esc(b.cname||'')}</div><h2>${esc(b.label)}</h2>`+
    (b.file?`<p style="font-size:12px">${esc(b.file)}</p>`:'')+`<p>${b.degree} connection${b.degree===1?'':'s'}</p>`+
    `<div class="act only-3d"><button data-act="sys">Fly into ${esc(b.cname||'its group')} ›</button><button data-act="node">Go to node</button></div>`+
    (out.length?`<div class="h">Out (${out.length})</div><ul>${out.slice(0,40).map(e=>`<li data-go="${esc(e.to)}">${esc(lbl(e.to))}<span>${esc(e.label||'')}${e.confidence!=='EXTRACTED'?' · inferred':''}</span></li>`).join('')}</ul>`:'')+
    (inn.length?`<div class="h">In (${inn.length})</div><ul>${inn.slice(0,40).map(e=>`<li data-go="${esc(e.from)}">${esc(lbl(e.from))}<span>${esc(e.label||'')}${e.confidence!=='EXTRACTED'?' · inferred':''}</span></li>`).join('')}</ul>`:'');
  cb.querySelectorAll('[data-act]').forEach(btn=>btn.addEventListener('click',()=>{if(!V3)return;btn.dataset.act==='sys'?V3.flyToSystem(b.community):V3.flyToNode(id);}));}
function showEdgeCard(from,to,rel,conf){card.hidden=false;cb.innerHTML=`<div class="tag">Connection</div><h2>${esc(base[from]?base[from].label:from)} → ${esc(base[to]?base[to].label:to)}</h2><div class="rel ${conf!=='EXTRACTED'?'inf':''}">${esc(rel||'related')} <small>· ${esc(conf||'')}</small></div>`;}
cb.addEventListener('click',ev=>{const go=ev.target.closest('[data-go]');if(go)focusNode(go.dataset.go);});
function focusNode(id){if(!base[id])return;showCard(id);
  if(view==='3d'&&V3)V3.flyToNode(id);
  else if(network){network.selectNodes([id]);network.focus(id,{scale:Math.max(network.getScale(),1.6),animation:{duration:450,easingFunction:'easeInOutQuad'}});}}

// ── search ──
const hits=document.getElementById('hits');let t=null;
document.getElementById('q').addEventListener('input',ev=>{clearTimeout(t);const q=ev.target.value.trim().toLowerCase();
  t=setTimeout(()=>{hits.innerHTML='';if(q.length<2)return;
    const hs=RAW_NODES.filter(n=>String(n.label).toLowerCase().includes(q)||String(n.source_file||'').toLowerCase().includes(q)).sort((a,b)=>String(a.label).toLowerCase().indexOf(q)-String(b.label).toLowerCase().indexOf(q)||(b.degree-a.degree)).slice(0,14);
    hs.forEach(h=>{const li=document.createElement('li');li.tabIndex=0;li.innerHTML=`<i class="sw" style="background:${base[h.id].color}"></i>${esc(h.label)} <small>${base[h.id].realm?esc(base[h.id].realm)+' · ':''}${esc(h.community_name||'')}${h.source_file?' · '+esc(String(h.source_file).split('/').pop()):''}</small>`;
      const go=()=>focusNode(h.id);li.addEventListener('click',go);li.addEventListener('keydown',e=>{if(e.key==='Enter')go();});hits.appendChild(li);});
    if(!hs.length)hits.innerHTML='<li><small>Nothing matches — try part of a name.</small></li>';},200);});
setView(view);
</script>"""


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
    """Assemble the Monarch Atlas graph.html."""
    import html as _h
    import os
    realms_json, realm_meta_json = _realms(G)
    title = _h.escape(os.environ.get("GRAPHIFY_ATLAS_TITLE") or "") or title
    default_skin = (os.environ.get("GRAPHIFY_ATLAS_SKIN") or "monarch").strip().lower()
    if default_skin not in SKIN_KEYS:
        default_skin = "monarch"
    if G is not None and G.graph.get("realms"):
        stats = f"{stats} · {len(G.graph['realms'])} galaxies"
    script = _script(nodes_json, edges_json, legend_json, _hyperedge_body(hyperedge_script),
                     realms_json, realm_meta_json)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monarch Atlas - {title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
{THREE_TAGS}
{VIS_TAG}
{STYLES}
<script>window.__ATLAS_SKIN__="{default_skin}";</script>
</head>
<body data-view="3d">
<div id="graph3d" role="application" aria-label="Knowledge graph, 3D"></div>
<div id="graph" role="application" aria-label="Knowledge graph, 2D"></div>
<div id="fx"><canvas id="fx-canvas"></canvas><i class="ck tl"></i><i class="ck tr"></i><i class="ck bl"></i><i class="ck br"></i></div>
<div id="labels"></div>
<div id="tip"></div>
<div id="brand"><div class="mark" id="brand-mark">🦋</div><div class="name">Monarch Atlas<small>{title}</small></div></div>
<div id="crumb"><i id="crumb-dot"></i><span id="crumb-name"></span><button id="crumb-back">‹ Back to galaxy</button></div>
<div id="idle-hint">🦋 Riding along with a monarch — move the mouse to take over</div>
<div id="ride-hint">🦋 <kbd>← →</kbd><kbd>A D</kbd> turn &nbsp; <kbd>↑ ↓</kbd><kbd>W S</kbd> climb / dive &nbsp; <kbd>Shift</kbd> boost &nbsp; <kbd>Space</kbd> hover &nbsp; <kbd>Q</kbd><kbd>E</kbd> barrel roll &nbsp; <kbd>F</kbd> loop &nbsp; <kbd>G</kbd> dive loop &nbsp; <kbd>X</kbd> spin<button id="ride-off">Esc · hop off</button></div>
<div id="stats">{stats} · click a group to fly in · double-click a sun to dive · Esc to zoom out · drag to orbit · shift-drag or right-drag to move</div>
<div id="settings">
  <div class="bar"><b>Graph</b><span class="seg"><button data-v="3d" class="on">3D</button><button data-v="2d">2D</button></span><button id="skin-btn" title="Skins">🎨</button><button id="home" title="Reset view">⌂</button><button id="min" title="Collapse">–</button></div>
  <details open><summary>Filters</summary><div class="body">
    <input id="q" type="search" placeholder="Search nodes, files…" autocomplete="off" aria-label="Search">
    <ul id="hits"></ul>
    <label class="row"><span>Inferred connections<span class="sub">Dashed edges graphify inferred, not read directly</span></span><input class="tg" type="checkbox" id="inferred" checked></label>
  </div></details>
  <details open class="only-3d" id="realms-wrap"><summary>Galaxies</summary><div class="body"><div id="realms"></div></div></details>
  <details open><summary>Groups</summary><div class="body">
    <div class="links"><a id="grp-all">Show all</a><a id="grp-none">Hide all</a></div>
    <div id="groups"></div>
  </div></details>
  <details><summary>Display</summary><div class="body">
    <div id="skin-row"><span>Skin: <b id="skin-name">Monarch</b></span><button id="skin-btn-2">Change…</button></div>
    <label class="row"><span>Labels<span class="sub only-3d">Names appear once you fly into a group</span></span><input class="tg" type="checkbox" id="labels" checked></label>
    <label class="row only-3d"><span>Monarchs<span class="sub">Butterflies drifting between the systems</span></span><input class="tg" type="checkbox" id="monarchs" checked></label>
    <label class="row only-3d"><span>Kinesins<span class="sub">Tiny carriers walking data along some links — zoom in to watch them, click one to walk it</span></span><input class="tg" type="checkbox" id="walkers" checked></label>
    <div class="rng"><div class="top"><span>Node size</span><span id="nsize-v">1.0</span></div><input type="range" id="nsize" min="0.4" max="2.5" step="0.1" value="1"></div>
    <div class="rng"><div class="top"><span class="only-3d">Link brightness</span><span class="only-2d">Link thickness</span><span id="lw-v">1.0</span></div><input type="range" id="lw" min="0.2" max="2.5" step="0.1" value="1"></div>
  </div></details>
  <details class="only-3d"><summary>Motion</summary><div class="body">
    <label class="row"><span>Auto-rotate<span class="sub">Slow orbit around the galaxy</span></span><input class="tg" type="checkbox" id="rotate" checked></label>
    <label class="row"><span>Idle tour<span class="sub">Left alone for 10 s, the camera rides a monarch or watches a kinesin work</span></span><input class="tg" type="checkbox" id="idle" checked></label>
    <div class="rng"><div class="top"><span>Rotate speed</span><span id="speed-v">0.5</span></div><input type="range" id="speed" min="0" max="3" step="0.1" value="0.5"></div>
    <div class="rng"><div class="top"><span>System spacing</span><span id="spacing-v">1.00</span></div><input type="range" id="spacing" min="0.6" max="2" step="0.05" value="1"></div>
  </div></details>
  <details class="only-2d"><summary>Forces</summary><div class="body">
    <label class="row"><span>Live physics<span class="sub">Let the map keep settling</span></span><input class="tg" type="checkbox" id="live"></label>
    <div class="rng"><div class="top"><span>Center force</span><span id="f-center-v">0.35</span></div><input type="range" id="f-center" min="0" max="1" step="0.05" value="0.35"></div>
    <div class="rng"><div class="top"><span>Repel force</span><span id="f-repel-v">2600</span></div><input type="range" id="f-repel" min="200" max="8000" step="100" value="2600"></div>
    <div class="rng"><div class="top"><span>Link distance</span><span id="f-dist-v">80</span></div><input type="range" id="f-dist" min="20" max="300" step="5" value="80"></div>
  </div></details>
</div>
<div id="card" hidden><button class="x" id="card-x" aria-label="Close">×</button><div id="card-body"></div></div>
<div id="skins"><div class="box"><div class="hd"><b>🎨 Skins</b><span>Same 3D universe, a different look. Switch any time — it's remembered in this browser.</span><button id="skins-x" aria-label="Close">×</button></div><div class="grid" id="skins-grid"></div></div></div>
{script}
</body>
</html>"""
