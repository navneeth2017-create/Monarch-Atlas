/* Monarch Atlas — the viewer.
 * Every graph.html loads this file live from GitHub (via jsDelivr) and falls back to the copy
 * embedded in the page when it can't. The page only carries data: window.ATLAS = {v, title, stats,
 * skin, nodes, edges, legend, realm, realms}. Keep ATLAS.v backwards-compatible: an old page with a
 * new viewer must still render. Built by graphify/exporters/atlas_html.py.
 */
(function(){
if(!window.ATLAS||!(ATLAS.v>=1&&ATLAS.v<=1))return;   // not our page, or a data format this viewer doesn't speak → the page's own copy runs
if(window.__atlasReady)return;                          // already up (remote won the race, or the local copy did)
const _e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ATLAS_CSS=`
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
  body[data-skin="matrix"] #fx .ck{display:none} body[data-skin="matrix"] #fx canvas{opacity:.55}
  body[data-skin="jarvis"] .lbl,body[data-skin="matrix"] .lbl{font-family:var(--mono);text-transform:uppercase;letter-spacing:.07em}
  body[data-skin="jarvis"] .lbl.realm,body[data-skin="matrix"] .lbl.realm{border-color:var(--accent);background:rgba(0,0,0,.55);border-radius:3px}
  body[data-skin="jarvis"] #brand .name,body[data-skin="matrix"] #brand .name{font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
  /* blueprint: drafting paper (20px minor / 100px major grid), a sheet frame with zone ticks, a title block, square ink UI */
  body[data-skin="blueprint"] #fx{display:block;background:repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 1px,transparent 1px 100px),repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 1px,transparent 1px 100px),repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 20px),repeating-linear-gradient(90deg,rgba(255,255,255,.028) 0 1px,transparent 1px 20px),radial-gradient(ellipse at 45% 42%,transparent 50%,rgba(5,20,56,.42) 100%)}
  body[data-skin="blueprint"] #fx .ck{display:none} #bp-sheet{display:none} body[data-skin="blueprint"] #bp-sheet{display:block;position:absolute;inset:0}
  #bp-sheet .bp-fr{position:absolute;inset:6px;border:1px solid rgba(255,255,255,.55);background:linear-gradient(90deg,rgba(255,255,255,.55) 1px,transparent 1px) 0 0/12.5% 7px repeat-x,linear-gradient(90deg,rgba(255,255,255,.55) 1px,transparent 1px) 0 100%/12.5% 7px repeat-x,linear-gradient(rgba(255,255,255,.55) 1px,transparent 1px) 0 0/7px 25% repeat-y,linear-gradient(rgba(255,255,255,.55) 1px,transparent 1px) 100% 0/7px 25% repeat-y}
  #bp-tb{position:absolute;left:14px;bottom:34px;width:264px;font:600 10px/1.25 var(--mono);color:#f4f8ff;border:1.5px solid rgba(255,255,255,.85);background:rgba(15,53,115,.96);text-transform:uppercase;letter-spacing:.05em} #bp-dwg{text-transform:none}
  #bp-tb span{display:block;font-size:7.5px;font-weight:400;color:#a9c3ee;letter-spacing:.14em;margin-bottom:1px} #bp-tb b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #bp-tb .bp-r{display:flex;align-items:center;gap:6px;padding:4px 7px;border-bottom:1px solid rgba(255,255,255,.38)} #bp-tb .bp-r span{width:50px;flex:none;margin:0} #bp-tb .bp-r b{flex:1;min-width:0}
  #bp-tb .bp-g{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid rgba(255,255,255,.38)} #bp-tb .bp-g>div{padding:4px 7px;border-left:1px solid rgba(255,255,255,.38);min-width:0} #bp-tb .bp-g>div:first-child{border-left:0}
  #bp-tb .bp-sc{border-bottom:0} #bp-bar{max-width:180px;padding-top:1px} #bp-bar i{display:block;height:3px;border:1px solid #fff;background:repeating-linear-gradient(90deg,#fff 0 25%,transparent 0 50%)} #bp-bar em{display:flex;justify-content:space-between;font-style:normal;font-weight:400;font-size:8.5px;margin-top:2px;white-space:nowrap} #bp-bar em small{font-size:inherit}
  .bp-dim{position:absolute;left:0;top:0;font:600 10px/1 var(--mono);letter-spacing:.08em;color:#fff;padding:3px 7px;background:var(--sky);white-space:nowrap;opacity:0;transition:opacity .25s;pointer-events:none;text-transform:uppercase}
  .bp-dim.on{opacity:1} body:not([data-skin="blueprint"]) .bp-dim{display:none}
  body[data-skin="blueprint"] .lbl{font-family:var(--mono);font-size:10.5px;letter-spacing:.02em;text-shadow:0 0 2px var(--halo),0 0 3px var(--halo),0 0 6px var(--halo)}
  body[data-skin="blueprint"] .lbl.sun{font-size:10.5px;font-weight:600;text-transform:none;letter-spacing:.03em;padding:2px 6px;background:rgba(15,53,115,.88);border:1px solid rgba(255,255,255,.85);text-shadow:none}
  body[data-skin="blueprint"] .lbl.sun::after{content:"";position:absolute;left:50%;top:100%;width:1px;height:5px;background:rgba(255,255,255,.85)}
  body[data-skin="blueprint"] .lbl.realm{text-transform:none;letter-spacing:.06em;background:rgba(15,53,115,.88);border:1px solid rgba(255,255,255,.7);border-radius:0;text-shadow:none}
  body[data-skin="blueprint"] #settings,body[data-skin="blueprint"] #card,body[data-skin="blueprint"] #skins .box{border-radius:2px;border-color:rgba(255,255,255,.6);box-shadow:0 0 0 4px rgba(15,53,115,.55),0 12px 32px rgba(3,14,40,.45)}
  body[data-skin="blueprint"] .bar b,body[data-skin="blueprint"] summary,body[data-skin="blueprint"] #card .h,body[data-skin="blueprint"] #skins .hd b{font-family:var(--mono);text-transform:uppercase;letter-spacing:.14em;font-size:11px}
  body[data-skin="blueprint"] .bar,body[data-skin="blueprint"] details,body[data-skin="blueprint"] #skins .hd{border-color:rgba(255,255,255,.28)}
  body[data-skin="blueprint"] .tg{border-radius:2px;background:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.65)} body[data-skin="blueprint"] .tg::after{border-radius:1px;background:rgba(255,255,255,.75)}
  body[data-skin="blueprint"] .tg:checked{background:#fff} body[data-skin="blueprint"] .tg:checked::after{background:var(--bg)}
  body[data-skin="blueprint"] .sw{box-shadow:0 0 0 1px rgba(255,255,255,.7)} body[data-skin="blueprint"] input[type=search]{background:rgba(6,28,72,.45);border-radius:2px}
  body[data-skin="blueprint"] .seg,body[data-skin="blueprint"] #crumb button,body[data-skin="blueprint"] #card .act button,body[data-skin="blueprint"] #skin-row button,body[data-skin="blueprint"] .skin,body[data-skin="blueprint"] .skin .chips i{border-radius:2px}
  body[data-skin="blueprint"] .seg button.on{color:var(--bg)}
  body[data-skin="blueprint"] #tip,body[data-skin="blueprint"] #crumb,body[data-skin="blueprint"] #idle-hint,body[data-skin="blueprint"] #ride-hint{background:rgba(15,53,115,.95);border-color:rgba(255,255,255,.65);border-radius:2px;box-shadow:none}
  body[data-skin="blueprint"] #crumb{font-family:var(--mono);font-size:11.5px;letter-spacing:.03em} body[data-skin="blueprint"] #crumb i{box-shadow:0 0 0 1px #fff}
  body[data-skin="blueprint"] #brand .mark{border-radius:2px;background:rgba(15,53,115,.9);border:1.5px solid #fff;box-shadow:none;font-size:14px;box-sizing:border-box}
  body[data-skin="blueprint"] #brand .name{font-family:var(--mono);text-transform:uppercase;letter-spacing:.1em;font-size:12.5px;text-shadow:0 0 4px var(--halo)} body[data-skin="blueprint"] #brand .name small{text-transform:none;letter-spacing:.02em}
  body[data-skin="blueprint"] #stats{text-shadow:0 0 3px var(--halo);color:var(--muted)}
  @media (max-width:720px){#bp-tb{display:none} #bp-sheet .bp-fr{inset:4px} body[data-skin="blueprint"] #brand .name{letter-spacing:.04em;font-size:12px}}
  @media print{body[data-skin="blueprint"] #settings,body[data-skin="blueprint"] #skins,body[data-skin="blueprint"] #tip,body[data-skin="blueprint"] #crumb,body[data-skin="blueprint"] #idle-hint{display:none}}
  body[data-skin="monarch"] #graph3d::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 120% 100% at 50% 45%,transparent 55%,rgba(3,3,6,.55) 100%)}
  body[data-skin="monarch"] .lbl{letter-spacing:.01em;text-shadow:0 0 2px rgba(7,7,12,.95),0 1px 3px rgba(7,7,12,.9),0 0 10px rgba(7,7,12,.65)}
  body[data-skin="monarch"] .lbl:not(.sun):not(.realm){padding:0 5px;border-radius:5px;background:rgba(12,11,16,.42)}
  body[data-skin="monarch"] .lbl.sun{padding:2px 9px 2px 8px;border-radius:999px;background:rgba(18,16,22,.68);border:1px solid rgba(255,196,138,.22);box-shadow:0 2px 12px rgba(0,0,0,.4);font-size:11px;font-weight:600;letter-spacing:.03em;text-shadow:none}
  body[data-skin="monarch"] .lbl.sun::before{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--sys,var(--accent));box-shadow:0 0 6px var(--sys,var(--accent));margin-right:6px;vertical-align:1px}
  body[data-skin="monarch"] .lbl.sun.on:hover{border-color:rgba(255,196,138,.6)}
  body[data-skin="monarch"] .lbl.realm{background:rgba(16,15,21,.62);border-color:rgba(255,196,138,.22);letter-spacing:.18em}
  body[data-skin="monarch"] #tip,body[data-skin="monarch"] #crumb{background:rgba(24,23,29,.9);border-color:rgba(255,196,138,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  body[data-skin="synthwave"] .lbl{color:#fff;letter-spacing:.02em;text-shadow:0 0 2px #1a0040,0 0 5px rgba(26,0,64,.95),0 0 12px rgba(255,63,208,.45)}
  body[data-skin="synthwave"] .lbl.sun{font-style:italic;font-weight:800;text-transform:uppercase;letter-spacing:.01em;font-size:10.5px;text-shadow:0 0 2px #2a0648,0 0 6px rgba(42,6,72,.95),0 2px 0 #3a0b52,0 0 16px rgba(255,63,208,.75)}
  body[data-skin="synthwave"] .lbl.realm{font-style:italic;background:rgba(26,6,52,.62);border-color:rgba(255,63,208,.45)}
  body[data-skin="synthwave"] #brand .mark{background:linear-gradient(180deg,#ffe066,#ff5ea8 55%,#a03dff);box-shadow:0 0 14px rgba(255,63,208,.5)}
  body[data-skin="synthwave"] #brand .name{font-style:italic;font-weight:800;text-transform:uppercase;letter-spacing:.08em;text-shadow:0 0 8px rgba(255,63,208,.65),0 2px 0 #3a0b52}
  @media (max-width:720px){body[data-skin="synthwave"] #brand .name{text-transform:none;letter-spacing:.02em}}
  body[data-skin="synthwave"] #brand .name small{font-style:normal;font-weight:400;text-transform:none;letter-spacing:0;text-shadow:0 1px 3px #000}
  body[data-skin="synthwave"] #settings,body[data-skin="synthwave"] #card{box-shadow:0 0 0 1px rgba(255,63,208,.16),0 12px 40px rgba(40,0,70,.6)}
  body[data-skin="synthwave"] .seg button.on{background:linear-gradient(180deg,#ff6fdc,#c42fb0);color:#fff}
  body[data-skin="synthwave"] #tip,body[data-skin="synthwave"] #crumb,body[data-skin="synthwave"] #idle-hint,body[data-skin="synthwave"] #ride-hint{background:rgba(31,14,66,.92)}
  body[data-skin="synthwave"] #fx{display:block} body[data-skin="synthwave"] #fx .ck{display:none}
  body[data-skin="synthwave"] #fx::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(12,0,30,.07) 0 1px,transparent 1px 4px),radial-gradient(ellipse at 50% 45%,transparent 58%,rgba(24,0,48,.5) 100%)}
  /* matrix: CRT phosphor. Rain + scanlines sit under the labels (z 0), so names stay crisp over the glow */
  body[data-skin="matrix"] #fx{z-index:0}
  body[data-skin="matrix"] #fx::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px)}
  body[data-skin="matrix"] #fx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(40,255,100,.035) 0,transparent 58%,rgba(0,0,0,.72) 100%)}
  body[data-skin="matrix"] .lbl{text-transform:none;letter-spacing:.01em;color:var(--lbl);text-shadow:0 0 2px #000,0 0 4px #000,0 0 9px rgba(60,255,106,.55)}
  body[data-skin="matrix"] .lbl.sun{text-transform:uppercase;letter-spacing:.08em;font-weight:600;font-size:11px;padding:1px 5px 1px 4px;border-left:2px solid var(--accent);background:rgba(0,14,5,.74);color:var(--lbl-sun);text-shadow:0 0 6px rgba(60,255,106,.7)}
  body[data-skin="matrix"] .lbl.on:hover{color:#fff;text-shadow:0 0 4px #000,0 0 12px rgba(60,255,106,.95)}
  body[data-skin="matrix"] .lbl.sun.on:hover::after{content:"_";animation:mtx-blink 1s steps(1) infinite}
  body[data-skin="matrix"] .lbl.realm{text-transform:uppercase;letter-spacing:.14em;border-radius:2px}
  @keyframes mtx-blink{50%{opacity:0}}
  body[data-skin="matrix"] #brand .mark{background:#000;border:1px solid var(--accent);color:var(--accent);box-shadow:0 0 12px rgba(60,255,106,.4),inset 0 0 8px rgba(60,255,106,.3);border-radius:4px}
  body[data-skin="matrix"] #brand .name{color:var(--accent-2);text-shadow:0 0 8px rgba(60,255,106,.55),0 1px 3px #000}
  body[data-skin="matrix"] #tip,body[data-skin="matrix"] #crumb,body[data-skin="matrix"] #idle-hint,body[data-skin="matrix"] #ride-hint{background:rgba(0,12,4,.93);border-color:var(--border-2);box-shadow:0 0 18px rgba(60,255,106,.12),0 6px 20px rgba(0,0,0,.6)}
  body[data-skin="matrix"] #tip b{color:var(--accent-2)} body[data-skin="matrix"] #crumb,body[data-skin="matrix"] #tip{border-radius:3px}
  body[data-skin="matrix"] #settings,body[data-skin="matrix"] #card{box-shadow:0 0 0 1px rgba(60,255,106,.06),0 0 24px rgba(60,255,106,.07),0 8px 28px rgba(0,0,0,.6)}
  body[data-skin="matrix"] .seg button.on{color:#021006}
  @media (prefers-reduced-motion:reduce){body[data-skin="matrix"] .lbl.sun.on:hover::after{animation:none}}
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
  @media (min-width:721px){#idle-hint,#ride-hint{left:calc((100vw - 314px)/2);transition:left .5s cubic-bezier(.2,.7,.2,1)} body.panel-min #idle-hint,body.panel-min #ride-hint{left:50%}}
  @media (max-width:720px){#settings{width:min(300px,calc(100vw - 28px))} #card{width:calc(100vw - 28px)}}
`;
const ATLAS_MARKUP=`
<div id="graph3d" role="application" aria-label="Knowledge graph, 3D"></div>
<div id="graph" role="application" aria-label="Knowledge graph, 2D"></div>
<div id="fx"><canvas id="fx-canvas"></canvas><i class="ck tl"></i><i class="ck tr"></i><i class="ck bl"></i><i class="ck br"></i></div>
<div id="labels"></div>
<div id="tip"></div>
<div id="brand"><div class="mark" id="brand-mark">🦋</div><div class="name">Monarch Atlas<small>${_e(ATLAS.title)}</small></div></div>
<div id="crumb"><i id="crumb-dot"></i><span id="crumb-name"></span><button id="crumb-back">‹ Back to galaxy</button></div>
<div id="idle-hint">🦋 Riding along with a monarch — move the mouse to take over</div>
<div id="ride-hint">🦋 <kbd>← →</kbd><kbd>A D</kbd> turn &nbsp; <kbd>↑ ↓</kbd><kbd>W S</kbd> climb / dive &nbsp; <kbd>Shift</kbd> boost &nbsp; <kbd>Space</kbd> hover &nbsp; <kbd>Q</kbd><kbd>E</kbd> barrel roll &nbsp; <kbd>F</kbd> loop &nbsp; <kbd>G</kbd> dive loop &nbsp; <kbd>X</kbd> spin<button id="ride-off">Esc · hop off</button></div>
<div id="stats">${_e(String(ATLAS.stats||'').replace(/&middot;/g,'·').replace(/&amp;/g,'&'))} · click a group to fly in · double-click a sun to dive · Esc to zoom out · drag to orbit · shift-drag or right-drag to move</div>
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
`;
document.head.insertAdjacentHTML('beforeend','<style>'+ATLAS_CSS+'</style>');
document.body.insertAdjacentHTML('afterbegin',ATLAS_MARKUP);
const RAW_NODES=ATLAS.nodes,RAW_EDGES=ATLAS.edges,LEGEND=ATLAS.legend,REALM=ATLAS.realm||{},REALMS=ATLAS.realms||[];   // node id -> realm map is empty for a single repo
window.__ATLAS_SKIN__=ATLAS.skin;
const HAS_REALMS = REALMS.length > 0;
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const FONT='"Inter",-apple-system,"Segoe UI",sans-serif';
const maxDeg=Math.max(1,...RAW_NODES.map(n=>n.degree||1));
// Optional per node: weight (how big it draws; defaults to degree) and hub (this node is its group's sun).
const wOf=n=>(typeof n.weight==='number'&&n.weight>0)?n.weight:(n.degree||1);
const maxW=Math.max(1,...RAW_NODES.filter(n=>!n.hub).map(wOf));
// ── shared indexes ──
const base={},outAdj={},inAdj={},nbrs={};
const realmOfCid={};
RAW_NODES.forEach(n=>{base[n.id]={color:(n.color&&n.color.background)||'#9e9e9e',community:n.community,degree:n.degree||1,w:wOf(n),hub:!!n.hub,label:n.label,file:n.source_file,cname:n.community_name,realm:REALM[n.id]||null};if(REALM[n.id]!=null&&realmOfCid[n.community]==null)realmOfCid[n.community]=REALM[n.id];outAdj[n.id]=[];inAdj[n.id]=[];nbrs[n.id]=new Set();});
RAW_EDGES.forEach((e,i)=>{e._i=i;if(outAdj[e.from])outAdj[e.from].push(e);if(inAdj[e.to])inAdj[e.to].push(e);if(nbrs[e.from])nbrs[e.from].add(e.to);if(nbrs[e.to])nbrs[e.to].add(e.from);});
const LEG={};LEGEND.forEach(g=>LEG[g.cid]=g);
let view='3d';try{view=localStorage.getItem('atlas.view')||'3d';}catch(e){}
if(!window.THREE)view='2d';
// ══════════════════════════════════════════ skins ══
// Every skin is the same 3D universe — solar systems in galaxies — dressed differently:
// colours, sky, node style, link glow, and a few props of its own (HUD rings, a neon grid, rain).
const SKINS={
  monarch:{name:'Monarch',mark:'🦋',tag:'Deep night sky, warm suns, soft nebulae, butterflies on the wing.',
    css:{bg:'#16161b','bg-2':'#1d1d23','bg-3':'#28282f',border:'#33333b','border-2':'#46464f',text:'#ececf1',muted:'#a0a0ab',faint:'#6d6d78',accent:'#F0923F','accent-2':'#FFC48A',sky:'#08080d',lbl:'#d9d9e0','lbl-sun':'#fff4e6',halo:'#07070c'},
    // stars:[] — the monarch extras draw their own colour-temperature, twinkling star field (and the sky dome, nebulae, coronas)
    sky:0x08080d,fog:0.00034,rim:0xF0923F,ambient:0.55,stars:[],nebula:0,fade:0x0a0a10,line:0.46,sunEmissive:0x6a6a6a,wire:false,monarchs:true,extras:'monarch',tint:{color:0xffe4c8,k:0.06},
    deep:{bot:'#040407',mid:'#08080e',top:'#0d0e1c',band:'#7468a0',warm:'#b87a48',cool:'#23406e',wash:0.09,bandK:0.1,stars:[[4200,1.25,0.5],[640,2.0,0.8],[70,3.1,1.0]],twinkle:0.4,dust:0.6,amb:0.34,rim:'#FFB070',rimK:0.6,corona:'#ffe2b8'},
    wings:{base:'#b24e0b',mid:'#e2761a',tip:'#f7a03c',vein:'rgba(16,8,3,.96)',margin:'#0d0a08',spot:'rgba(255,249,238,.97)',glow:'rgba(255,200,128,.92)',shade:'rgba(52,18,4,.6)',body:0x120e0b},kin:{head:0xe6e8f2,headEm:0x2a3350,stalk:0xc4c9da},
    pv:{deep:true,cols:['#6ea8ff','#ff8a5b','#7ed957','#ffd166','#c77dff']},
    features:['Solar-system galaxies','Lit planets face their sun','Nebulae & milky-way sky','Twinkling starfield','Ride a butterfly','Walk a kinesin','Idle tour']},
  jarvis:{name:'JARVIS',mark:'◎',tag:'Cyan holographic HUD. Wireframe nodes, targeting rings, scanlines.',
    css:{bg:'#04141a','bg-2':'#061c24','bg-3':'#0a2a34',border:'#0f3d4a','border-2':'#155566',text:'#c8f4f8',muted:'#6fbfca',faint:'#3f8e99',accent:'#19d3e0','accent-2':'#7be9f1',sky:'#020b10',lbl:'#8fe6ee','lbl-sun':'#c9fbff',halo:'#001318',font:'var(--mono)'},
    sky:0x020b10,fog:0.00030,rim:0x19d3e0,ambient:1.0,stars:[[900,1.6,0x19d3e0,0.35],[60,3.0,0x9ff5fb,0.6]],nebula:0.05,fade:0x03202a,line:0.9,sunEmissive:0x19d3e0,wire:true,rings:true,monarchs:true,extras:'hud',tint:{color:0x19d3e0,k:0.26},
    wings:{base:'#067a88',mid:'#12b7c6',tip:'#7ff0f8',vein:'rgba(2,20,26,.95)',margin:'#03242b',spot:'rgba(230,255,255,.95)',glow:'rgba(180,255,255,.9)',shade:'rgba(0,30,40,.55)',body:0x03242b},kin:{head:0x9ff5fb,headEm:0x0a6b75,stalk:0x5fd6e2},
    pv:{stars:'#19d3e0',cols:['#4fc3d6','#7bd6a9','#d6b35f','#5f9be0','#c78bd9'],rings:true,wire:true,scan:true},
    features:['Holographic nodes & orbit rings','Targeting rings lock on','Scanline & vignette overlay','Cyan butterflies & carriers','Monospace readouts']},
  synthwave:{name:'Synthwave',mark:'🌴',tag:'Outrun. A striped sunset over neon mountains, a grid floor to the horizon, chrome nodes.',
    css:{bg:'#170b30','bg-2':'#1f1040','bg-3':'#2a1755',border:'#3a2372','border-2':'#4c2f8f',text:'#f6ecff',muted:'#c0a3e8',faint:'#8a6cc0',accent:'#ff3fd0','accent-2':'#ff9be9',sky:'#0b0420',lbl:'#f3dcff','lbl-sun':'#ffffff',halo:'#1a0040'},
    sky:0x0b0420,fog:0.00024,rim:0xff3fd0,ambient:0.6,stars:[[1600,1.5,0xd7b6ff,0.45],[180,2.6,0xffc6f1,0.7],[40,3.6,0xfff1c9,0.8]],nebula:0.08,fade:0x0b0420,line:0.5,sunEmissive:0xd94fc4,wire:false,monarchs:true,extras:'synth',tint:{color:0xc04fff,k:0.2},
    // chrome nodes: the top half catches the violet sky, the bottom half the floor, a neon rim from magenta (below) to cyan (above)
    body:emis=>new THREE.ShaderMaterial({uniforms:{uSun:{value:emis?1:0},uRimA:{value:new THREE.Color(0xff3fd0)},uRimB:{value:new THREE.Color(0x3df2ff)},uFog:{value:0.00024},uFogC:{value:new THREE.Color(0x0b0420)}},
      vertexShader:`varying vec3 vN,vV,vC;varying float vD;
void main(){vec4 p=vec4(position,1.0);vec3 n=normal;
#ifdef USE_INSTANCING
p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
#endif
vC=vec3(1.0);
#ifdef USE_INSTANCING_COLOR
vC=instanceColor;
#endif
vec4 mv=modelViewMatrix*p;vN=normalize(normalMatrix*n);vV=normalize(-mv.xyz);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`uniform vec3 uRimA,uRimB,uFogC;uniform float uSun,uFog;varying vec3 vN,vV,vC;varying float vD;
void main(){vec3 n=normalize(vN);float ndv=clamp(dot(n,normalize(vV)),0.0,1.0),f=pow(1.0-ndv,2.4),y=n.y;
  vec3 up=vC*(0.78+0.32*y)+vec3(0.10,0.05,0.16)*y;
  vec3 dn=vC*0.40+uRimA*0.30*exp(-abs(y+0.16)*9.0);
  vec3 c=mix(dn,up,smoothstep(-0.06,0.06,y));
  vec3 rim=mix(uRimA,uRimB,smoothstep(-0.35,0.55,y));
  if(uSun>0.5)c=mix(vC,vec3(1.0,0.96,1.0),0.45*ndv*ndv)*1.12;
  c=mix(c,rim,f*0.8)+rim*f*0.25;
  gl_FragColor=vec4(mix(uFogC,c,exp(-uFog*uFog*vD*vD)),1.0);}`}),
    wings:{base:'#7a1fa0',mid:'#d63cc8',tip:'#ff8de6',vein:'rgba(20,4,40,.95)',margin:'#1a0630',spot:'rgba(255,240,255,.95)',glow:'rgba(255,200,120,.9)',shade:'rgba(30,0,50,.55)',body:0x1a0630},kin:{head:0xffd6f7,headEm:0x7a1fa0,stalk:0xd18cff},
    pv:{stars:'#e0c3ff',cols:['#ff3fd0','#a05cff','#3df2ff','#ff9be9','#8b5cf6'],grid:true,sun:true,butterfly:true},
    features:['Striped horizon sun','Scrolling neon grid','Wireframe mountains','Chrome nodes','Chromatic links']},
  matrix:{name:'Matrix',mark:'▚',tag:'Green phosphor on black. Glyph rain falls in 3D all around the graph.',
    css:{bg:'#030805','bg-2':'#07120a','bg-3':'#0c1d10',border:'#153a1c','border-2':'#1f5228',text:'#c9ffd2',muted:'#6fcf84',faint:'#3f8a4f',accent:'#3cff6a','accent-2':'#9dffb4',sky:'#000000',lbl:'#a8ffbc','lbl-sun':'#e0ffe6',halo:'#000a02',font:'var(--mono)'},
    sky:0x000000,fog:0.00042,rim:0x3cff6a,ambient:0.95,stars:[[520,1.3,0x3cff6a,0.22],[60,2.2,0xb8ffc8,0.4]],nebula:0.04,fade:0x04140a,line:0.36,sunEmissive:0x35d45f,wire:false,monarchs:true,extras:'rain',tint:{color:0x3cff6a,k:0.58},
    // phosphor: every node is a CRT dot, a dim core with a hot fresnel rim, its own scanlines and a scan band sweeping up the world
    phosphor:{rim:0xd6ffde,pow:1.8,core:0.2,sunCore:0.42,sunHot:0.66,mix:0.55,scan:0.45,lines:0.42,glow:0.36},
    wings:{base:'#0f6b2a',mid:'#26b34b',tip:'#8fff9f',vein:'rgba(0,20,5,.95)',margin:'#03150a',spot:'rgba(220,255,225,.95)',glow:'rgba(200,255,200,.9)',shade:'rgba(0,25,5,.55)',body:0x03150a},kin:{head:0xc9ffd2,headEm:0x0f6b2a,stalk:0x6fdf84},
    pv:{stars:'#3cff6a',cols:['#3cff6a','#9dffb4','#1fa84a','#c9ffd2','#2fd35e'],rain:true,wire:true,scan:true},
    features:['3D glyph rain','Phosphor scanline nodes','Glowing links','Terminal readouts','Green butterflies & carriers']},
  blueprint:{name:'Blueprint',mark:'✎',tag:'An engineering drawing: white ink on cyanotype blue, drafted circles, dimension callouts and a title block.',
    css:{bg:'#0f3371','bg-2':'#123b7f','bg-3':'#18478f',border:'#4a72b4','border-2':'#6f92c9',text:'#f4f8ff',muted:'#b6cbee',faint:'#8aa7d8',accent:'#ffffff','accent-2':'#dbe8ff',sky:'#0f3573',lbl:'#e4eeff','lbl-sun':'#ffffff',halo:'#0f3573'},
    sky:0x0f3573,fog:0.00024,rim:0xffffff,ambient:0.85,stars:[],nebula:0,fade:0x0f3573,line:0.46,sunEmissive:0xbfd2f5,wire:false,monarchs:true,extras:'grid',tint:{color:0xf2f6ff,k:0.42},
    // ink: node fill toward the community colour, outline weight in px; orbit construction circles; datum floor
    ink:{fill:0.10,sunFill:0.20,w:1.25,sunW:1.9,hatch:0.12,orbit:0.30,floor:[0.045,0.11,0.26]},
    wings:{base:'#9fbcf0',mid:'#d0e0ff',tip:'#ffffff',vein:'rgba(15,45,110,.9)',margin:'#163e8f',spot:'rgba(30,70,150,.9)',glow:'rgba(255,255,255,.9)',shade:'rgba(20,50,120,.5)',body:0x163e8f},kin:{head:0xffffff,headEm:0x3d6fc4,stalk:0xdbe8ff},
    pv:{cols:['#a9c8ff','#ffc2a6','#bfeaa6','#ffe3a0','#dcc0ff'],blueprint:true},
    features:['Drafted ink circles','Dashed construction orbits','Centre marks on every sun','Dimension callouts','Drafting grid & title block','Print-friendly']},
};
const DEFAULT_SKIN=(window.__ATLAS_SKIN__&&SKINS[window.__ATLAS_SKIN__])?window.__ATLAS_SKIN__:'monarch';
let skinKey=DEFAULT_SKIN;try{const u=new URLSearchParams(location.search).get('skin');skinKey=(u&&SKINS[u])?u:(SKINS[localStorage.getItem('atlas.skin')]?localStorage.getItem('atlas.skin'):DEFAULT_SKIN);}catch(e){}
let SKIN=SKINS[skinKey];
const state={labels:true,monarchs:true,walkers:true,idle:true,nsize:1,lw:1,inferred:true,hidden:new Set(),rotate:true,speed:0.5,spacing:1,live:false,repel:2600,center:0.35,dist:80};
const edgeVisible=e=>state.inferred||e.confidence==='EXTRACTED';
const nodeVisible=id=>!state.hidden.has(base[id].community);

// ══════════════════════════════════════════ 3D — galaxy of solar systems ══
// LITE: the cheap path for phones and weak devices. Skins with heavy extras (monarch, synthwave, matrix, blueprint)
// draw fewer stars / rain columns, bake smaller textures and skip their biggest overdraw layers. The graph itself is
// identical. ?lite=1 or ?lite=0 forces it either way.
const LITE=(()=>{try{const q=new URLSearchParams(location.search).get('lite');if(q==='1')return true;if(q==='0')return false;}catch(e){}
  const small=Math.min(window.innerWidth||1e4,window.innerHeight||1e4)<=600,weak=(navigator.deviceMemory||8)<=2||(navigator.hardwareConcurrency||8)<=2;
  return small||weak;})();
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
  // The offset eases to its target so opening or folding the panel slides the universe over instead of snapping it.
  let viewOff=0,viewTarget=0,viewAnim=null;
  function applyOff(){const W=window.innerWidth,H=window.innerHeight;camera.setViewOffset(W,H,viewOff,0,W,H);camera.updateProjectionMatrix();}
  function fitView(animate){const W=window.innerWidth,H=window.innerHeight;let sb=0;const p=document.getElementById('settings');
    if(p&&W>720&&getComputedStyle(p).display!=='none'&&!p.classList.contains('min')){const r=p.getBoundingClientRect();if(r.width>0)sb=Math.max(0,W-r.left);}
    renderer.setSize(W,H);viewTarget=sb/2;
    if(animate===false||Math.abs(viewTarget-viewOff)<1){viewOff=viewTarget;applyOff();return;}
    if(viewAnim)cancelAnimationFrame(viewAnim);const from=viewOff,to=viewTarget,t0=performance.now(),ms=520;
    (function step(){const k=Math.min(1,(performance.now()-t0)/ms),e=1-Math.pow(1-k,3);viewOff=from+(to-from)*e;applyOff();if(k<1)viewAnim=requestAnimationFrame(step);else viewAnim=null;})();}
  fitView(false);
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
  Object.keys(groupsOf).forEach(k=>{const cid=+k,ids=groupsOf[k].slice().sort((a,b)=>(base[b].hub-base[a].hub)||base[b].w-base[a].w||String(a).localeCompare(String(b)));
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
    realmList.forEach(R=>{placeBall(R.systems,20*sp,sp,0.85);let rad=0;R.systems.forEach(s=>rad=Math.max(rad,s.c.length()+s.r));R.r=rad+24*sp;R.systems.forEach((s,i)=>{sysRank[s.sun]=i;sunRealm[s.sun]=R;});});
    if(realmList.length===1){realmList[0].c=new THREE.Vector3();}
    else{
      const centre=realmList.filter(R=>R.meta.center),rest=realmList.filter(R=>!R.meta.center).sort((a,b)=>b.r-a.r);
      let cr=0;centre.forEach(R=>{R.c=new THREE.Vector3();cr=Math.max(cr,R.r);});
      const n=rest.length,gap=170*sp;let ring=0;
      rest.forEach(R=>ring=Math.max(ring,cr+R.r+gap));
      for(let i=0;i<n;i++){const a=rest[i],b=rest[(i+1)%n];if(n>1)ring=Math.max(ring,(a.r+b.r+gap)/(2*Math.sin(Math.PI/n)));}
      // spread the galaxies over a sphere, not a ring, so the universe has depth from every angle
      rest.forEach((R,i)=>{const d=fibDir(i,n);d.z*=0.95;d.normalize();R.c=d.multiplyScalar(ring*1.3);});
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
  const rPlanet=id=>(1.1+2.4*Math.sqrt(Math.min(1,base[id].w/maxW)))*state.nsize;
  const rSun=s=>(3.6+3.2*Math.sqrt(s.n/maxN))*state.nsize;
  function clearMeshes(){[planets,suns,lines].forEach(o=>{if(o){scene.remove(o);if(o.geometry&&o!==planets&&o!==suns)o.geometry.dispose();o.material.dispose();}});glows.forEach(g=>{scene.remove(g);g.material.dispose();});glows=[];lblLayer.innerHTML='';sunLbl={};planetLbl={};realmLbl=[];}
  let sunLbl={},planetLbl={},realmLbl=[];
  function build(){
    clearMeshes();layout();
    planetIds=[];sunIds=[];slotOf={};
    systems.forEach(s=>{if(nodeVisible(s.sun))sunIds.push(s.sun);s.ids.slice(1).forEach(id=>{if(nodeVisible(id))planetIds.push(id);});});
    const bodyMat=emis=>SKIN.body?SKIN.body(emis):SKIN.wire?new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.75}):new THREE.MeshLambertMaterial(emis?{color:0xffffff,emissive:emis}:{color:0xffffff});
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
  window.addEventListener('resize',()=>fitView(false));
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
    if(SKIN.extras==='rain')buildMatrix();else mtx=null;
    bpS=null;if(SKIN.extras==='grid')bpBuild();
    if(SKIN.extras==='synth'){
      if(extras.userData.step)extras.userData.step(0,0);   // a previous synth build: its hook sees its objects gone and frees them
      // Outrun: a sky dome at infinity (gradient, striped sun, wireframe mountains, grid floor melting into the horizon haze).
      // It follows the camera, so the horizon never runs out. Everything moves in the shaders: per frame the CPU writes
      // one time value, two direction vectors and two positions.
      const TILT=Math.asin(0.34),SUNR=0.09,SUNEL=SUNR*0.62,cT=Math.cos(TILT),sT=Math.sin(TILT),cS=Math.cos(SUNEL),sS=Math.sin(SUNEL);
      const rm=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
      const z0=-galaxyR*1.02;
      // the horizon is a plane through the eye tipped TILT below the heading, so it stays a straight line on screen
      // and sits in the empty band above the galaxy in the home view. uUp is its normal.
      const U={uSunD:{value:new THREE.Vector3(0,1,0)},uUp:{value:new THREE.Vector3(0,0,1)},uSunR:{value:SUNR},uTime:{value:0},uZ0:{value:z0},uCell:{value:Math.max(60,galaxyR)*0.055},uGal:{value:Math.max(60,galaxyR)}};
      // One full-screen pass draws sky, sun, mountains and the floor grid (a ray/plane hit per pixel).
      // Every derivative is taken up front, outside the branches, so the anti-aliasing holds at every edge.
      const dome=new THREE.Mesh(new THREE.SphereGeometry(100,48,24),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,depthTest:false,extensions:{derivatives:true},
        vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        defines:LITE?{LITE:1}:{},
        fragmentShader:`uniform vec3 uSunD,uUp;uniform float uSunR,uTime,uZ0,uCell,uGal;varying vec3 vDir;
float swTri(float x){return 1.0-abs(fract(x)-0.5)*2.0;}
float swLine(vec2 g,vec2 fw,out float glow){vec2 l=abs(fract(g-0.5)-0.5)/max(fw,1e-4);float px=min(l.x,l.y);
  float fade=1.0-smoothstep(0.22,0.55,max(fw.x,fw.y));glow=exp(-px*0.45)*fade;return (1.0-min(px,1.0))*fade;}   // cells under ~3px fade out: no moire at the horizon
void main(){vec3 d=normalize(vDir);float e=dot(d,uUp);
  vec3 R=normalize(cross(uSunD,uUp)),V=cross(R,uSunD);vec2 p=vec2(dot(d,R),dot(d,V))/uSunR;float r=length(p),q=(0.34-p.y)*5.2;
  float a=atan(d.y,d.x)/6.2831853;
  float m=0.036*max(0.0,0.55*swTri(a*7.0+0.13)+0.30*swTri(a*17.0+0.41)+0.15*swTri(a*41.0+0.7)-0.28)/0.72;
  float dz=min(d.z,-1e-4);vec2 W=cameraPosition.xy+d.xy*((uZ0-cameraPosition.z)/dz),P=W/uCell;P.y+=uTime*0.5;
  float aa=fwidth(r)*1.2,w=fwidth(q)*1.2,fm=fwidth(e-m),fh=fwidth(e)/0.0075,fa=fwidth(a)*190.0;vec2 fg=fwidth(P);
  vec3 c;
  if(e<0.0){   // ground: violet haze glowing up into the horizon, and the grid floor
    float h=-e;c=vec3(0.030,0.008,0.075)+vec3(0.62,0.10,0.52)*(exp(-h*26.0)*0.42+exp(-h*6.0)*0.06);
    if(d.z<0.0){float g1,g2;float mj=swLine(P*0.2,fg*0.2,g2);float hk=smoothstep(0.0,0.16,h);hk*=hk;
      hk*=mix(0.38,1.0,smoothstep(0.5,1.3,length(W)/uGal));   // the floor dims under the galaxy, so the links read over it
#ifdef LITE
      c+=vec3(1.0,0.25,0.82)*(mj*0.62+g2*0.13)*hk;   // LITE: major lines only, no sheen
#else
      float mi=swLine(P,fg,g1);
      c+=(vec3(0.48,0.18,0.66)*mi*0.26+vec3(1.0,0.25,0.82)*(mj*0.62+g2*0.13))*hk;
      float sd=dot(normalize(d.xy),normalize(uSunD.xy+1e-5));if(sd>0.9)c+=vec3(1.0,0.36,0.66)*pow(sd,90.0)*exp(-h*9.0)*0.30;
#endif
    }
  }else{
    c=mix(vec3(0.60,0.10,0.46),vec3(0.19,0.035,0.30),smoothstep(0.0,0.09,e));
    c=mix(c,vec3(0.020,0.008,0.075),smoothstep(0.05,0.62,e));
    c+=vec3(1.0,0.28,0.72)*exp(-e*38.0)*0.30;
    if(r<9.0&&dot(d,uSunD)>0.0){   // the sun: gradient disc, bands that thicken toward the horizon and drift down, a soft bloom
      float y=p.y;vec3 top=vec3(1.0,0.91,0.42),mid=vec3(1.0,0.36,0.60),bot=vec3(0.78,0.18,0.86);
      vec3 sc=y>0.0?mix(mid,top,smoothstep(0.0,0.95,y)):mix(mid,bot,smoothstep(0.0,-1.0,y));
      float s=fract(q-uTime*0.12),gap=clamp(q*0.0885,0.0,0.62);
      float cut=q>0.0?1.0-smoothstep(gap-w,gap+w,s):0.0;
      float disc=(1.0-smoothstep(1.0-aa,1.0+aa,r))*(1.0-cut);
      float g=exp(-max(r-1.0,0.0)*2.4)*0.42+exp(-max(r-1.0,0.0)*0.55)*0.10;
      c+=vec3(1.0,0.30,0.62)*g*(1.0-disc);c=mix(c,sc*1.04,disc);}
    if(e<m){   // wireframe mountains, fixed to the world so they slide past as you orbit
      float k=e/max(m,1e-4);vec3 f=mix(vec3(0.10,0.02,0.16),vec3(0.035,0.008,0.075),smoothstep(0.0,0.9,k));
#ifdef LITE
      c=f;   // LITE: solid silhouettes, the neon ridge line below still draws them
#else
      float hl=abs(fract(e/0.0075)-0.5)/max(fh,1e-4),vl=abs(fract(a*190.0)-0.5)/max(fa,1e-4);
      c=f+vec3(0.55,0.22,0.95)*(1.0-min(min(hl,vl),1.0))*0.22*(1.0-k*0.4);
#endif
    }
    c+=vec3(1.0,0.35,0.85)*((1.0-smoothstep(0.6,1.8,abs(e-m)/max(fm,1e-5)))*0.85+exp(-max(e-m,0.0)/0.006)*0.10*step(m,e));
  }
  gl_FragColor=vec4(c,1.0);}`}));
      dome.renderOrder=-10;dome.frustumCulled=false;
      // LITE: the sky pass is the expensive one, so it renders at half resolution into a texture that one cheap
      // full-screen blit stretches under the scene
      let lo=null;
      if(LITE){const rt=new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,stencilBuffer:false}),dsc=new THREE.Scene();dsc.add(dome);
        const blit=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:{uT:{value:rt.texture}},depthTest:false,depthWrite:false,
          vertexShader:`varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`uniform sampler2D uT;varying vec2 vU;void main(){gl_FragColor=texture2D(uT,vU);}`}));
        blit.renderOrder=-10;blit.frustumCulled=false;extras.add(blit);lo={rt,dsc,blit};}
      else extras.add(dome);
      const own=lo?lo.blit:dome;
      // the floor itself is depth only: it hides the stars and the far side of the sky below the horizon
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({colorWrite:false}));
      floor.position.z=z0;floor.renderOrder=-9;floor.frustumCulled=false;extras.add(floor);
      // chromatic links: an additive copy of the link geometry (same position + colour buffers, so hover highlights
      // still land), shaded magenta at one end and cyan at the other. It re-attaches itself whenever the links rebuild.
      let chroma=null,chromaOf=null,az=null;const fwd=new THREE.Vector3();
      const CU={uOp:{value:0.5},uLift:{value:0},uA:{value:new THREE.Color(0xff3fd0)},uB:{value:new THREE.Color(0x3df2ff)},uFog:{value:SKIN.fog}};let few=false;
      const attach=()=>{
        if(chroma){extras.remove(chroma);chroma.geometry.dispose();chroma.material.dispose();chroma=null;}   // its shared buffers went with the old links
        chromaOf=lines;if(!lines||!edgeGeom)return;
        const n=edgeGeom.attributes.position.count;few=n<800;CU.uLift.value=few?0.35:0;const T=new Float32Array(n);for(let i=1;i<n;i+=2)T[i]=1;
        const g=new THREE.BufferGeometry();g.setAttribute('position',edgeGeom.attributes.position);g.setAttribute('color',edgeColor);g.setAttribute('aT',new THREE.BufferAttribute(T,1));
        chroma=new THREE.LineSegments(g,new THREE.ShaderMaterial({uniforms:CU,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
          vertexShader:`attribute float aT;varying vec3 vC;varying float vT,vD;void main(){vC=color;vT=aT;vec4 mv=modelViewMatrix*vec4(position,1.0);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
          fragmentShader:`uniform vec3 uA,uB;uniform float uOp,uFog,uLift;varying vec3 vC;varying float vT,vD;
void main(){float l=dot(vC,vec3(0.3,0.5,0.2));vec3 c=mix(vC,mix(uA,uB,vT)*l*1.7,0.62);c=mix(c,vec3(1.0,0.93,1.0),uLift)*(1.0+uLift);gl_FragColor=vec4(c,min(1.0,uOp*exp(-uFog*uFog*vD*vD)));}`}));
        chroma.frustumCulled=false;extras.add(chroma);lines.visible=false;};
      extras.userData.step=(dt)=>{
        if(!own.parent){extras.userData.step=null;if(lo){lo.rt.dispose();dome.geometry.dispose();dome.material.dispose();}return;}   // the skin changed and buildExtras cleared us
        if(lines!==chromaOf)attach();
        if(chroma&&lines)CU.uOp.value=lines.material.opacity*(few?1.1:0.55);
        if(!rm)U.uTime.value+=dt;
        const cp=camera.position;dome.position.copy(cp);
        const h=Math.max(1,cp.z-z0);floor.position.set(cp.x,cp.y,z0);floor.scale.set(h*40,h*40,1);
        // the sun keeps to the heading you look along, like a moon riding with the car
        camera.getWorldDirection(fwd);if(Math.abs(fwd.x)+Math.abs(fwd.y)>1e-3){const t=Math.atan2(fwd.y,fwd.x);
          if(az==null)az=t;else{let df=t-az;df-=Math.round(df/(Math.PI*2))*Math.PI*2;az+=df*(1-Math.exp(-dt*2.5));}}
        const a=az==null?Math.PI/2:az,ca=Math.cos(a),sa=Math.sin(a);U.uUp.value.set(sT*ca,sT*sa,cT);
        U.uSunD.value.set((cS*cT+sS*sT)*ca,(cS*cT+sS*sT)*sa,sS*cT-cS*sT);
        if(lo){const cv=renderer.domElement,w=Math.max(1,cv.width>>1),h=Math.max(1,cv.height>>1);if(lo.rt.width!==w||lo.rt.height!==h)lo.rt.setSize(w,h);
          const prev=renderer.getRenderTarget();renderer.setRenderTarget(lo.rt);renderer.render(lo.dsc,camera);renderer.setRenderTarget(prev);}};
    }
    if(SKIN.extras==='monarch')deepSky();
  }
  // ── monarch: the deep-space sky ──
  // A sky dome with a milky band, colour-temperature stars that twinkle, soft dust nebulae around the systems,
  // warm coronas on the suns, and planets lit from their own sun. Every shader here does its own fog, so the
  // additive ones fade to black rather than to a sky-coloured haze. One shared time uniform is advanced from
  // the dome's onBeforeRender (nothing added to the frame loop, no per-frame allocation); reduced motion freezes it.
  let deepTex=null,deepGeoP=null,deepGeoS=null,deepSunAttr=null;const deepT={value:0};
  const DEEP_NOISE=`float h3(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
  const DEEP_INST=`mat4 im=mat4(1.0);
#ifdef USE_INSTANCING
 im=instanceMatrix;
#endif
 vec4 wp=modelMatrix*im*vec4(position,1.0);vN=normalize(mat3(modelMatrix*im)*normal);vV=cameraPosition-wp.xyz;vCol=vec3(1.0);
#ifdef USE_INSTANCING_COLOR
 vCol=instanceColor;
#endif
 vec4 mv=viewMatrix*wp;vDepth=-mv.z;gl_Position=projectionMatrix*mv;`;
  const DEEP={
    // the sky sits at infinity: rotation-only view, pushed to the far plane
    domeV:`varying vec2 vU;void main(){vU=uv;vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position*100.0,1.0);gl_Position=vec4(p.xy,p.w*0.99999,p.w);}`,
    domeF:`uniform sampler2D uSky;varying vec2 vU;
void main(){vec3 c=texture2D(uSky,vU).rgb;
 c+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))))-0.5)/170.0;   // dither: no banding in the dark gradient
 gl_FragColor=vec4(c,1.0);}`,
    starV:`attribute vec3 aC;attribute vec4 aS;uniform float uT,uPR;varying vec3 vC;varying float vB;varying float vK;varying float vSp;
void main(){vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position*100.0,1.0);gl_Position=vec4(p.xy,p.w*0.99999,p.w);
 float w=0.5+0.5*sin(uT*(0.6+aS.z*1.3)+aS.z*40.0)*sin(uT*(1.7+aS.z)+aS.z*17.0);   // slow, irregular twinkle
 vB=1.0-aS.y*w;vC=aC;vSp=aS.w;float core=aS.x*uPR,spr=core*(aS.w>0.0?7.0:2.6);gl_PointSize=spr;vK=spr/core;}`,
    starF:`varying vec3 vC;varying float vB;varying float vK;varying float vSp;
void main(){vec2 p=gl_PointCoord*2.0-1.0;float d=length(p);if(d>1.0)discard;float r=d*vK;
 float a=exp(-r*r*1.7)+exp(-d*d*7.0)*0.09*vSp;
 if(vSp>0.0){vec2 q=abs(p);a+=(exp(-q.y*vK*2.4)*pow(1.0-q.x,3.0)+exp(-q.x*vK*2.4)*pow(1.0-q.y,3.0))*0.28*vSp;}   // faint diffraction spikes
 a*=vB;if(a<0.004)discard;gl_FragColor=vec4(vC,min(a,1.0));}`,
    // planets: the terminator faces the planet's own sun (aSun); warm atmosphere rim on the sunward limb, cool night fill
    litV:`attribute vec3 aSun;varying vec3 vN;varying vec3 vV;varying vec3 vL;varying vec3 vCol;varying float vDepth;
void main(){${DEEP_INST}vL=aSun-wp.xyz;}`,
    litF:`uniform vec3 uRim,uFogC;uniform float uAmb,uRimK,uFog;varying vec3 vN;varying vec3 vV;varying vec3 vL;varying vec3 vCol;varying float vDepth;
void main(){vec3 n=normalize(vN),l=normalize(vL),v=normalize(vV);float ndl=dot(n,l);
 float diff=smoothstep(-0.3,1.0,ndl),f=pow(1.0-max(dot(n,v),0.0),2.6);
 vec3 base=mix(vCol,vec3(dot(vCol,vec3(0.3,0.59,0.11)))*vec3(1.04,1.0,0.94),0.05);float night=1.0-diff;
 vec3 c=base*(uAmb+diff*0.78+night*0.32)+vec3(0.018,0.026,0.05)*night;   // night side keeps a group-coloured fill
 c+=vCol*f*night*0.7;   // and a group-coloured limb: a planet in front of its sun reads as a coloured disc, not a hole
 c+=uRim*f*uRimK*(0.18+0.82*clamp(ndl+0.35,0.0,1.0));
 c+=vec3(1.0,0.9,0.78)*pow(max(dot(n,normalize(l+v)),0.0),36.0)*0.22*step(0.0,ndl);
 gl_FragColor=vec4(mix(uFogC,c,exp(-uFog*uFog*vDepth*vDepth)),1.0);}`,
    // suns: a white-hot photosphere darkening to the group colour at the limb, slow granulation, warm rim
    sunV:`varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying vec3 vP;varying float vDepth;
void main(){vP=position;${DEEP_INST}}`,
    sunF:`uniform vec3 uRim,uHot,uFogC;uniform float uFog,uT;varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying vec3 vP;varying float vDepth;${DEEP_NOISE}
void main(){vec3 n=normalize(vN);float mu=clamp(dot(n,normalize(vV)),0.0,1.0);
 float limb=1.0-0.55*(1.0-pow(mu,0.55));
 float g=vn(vP*9.0+vec3(0.0,0.0,uT*0.05));
 vec3 c=mix(mix(vCol,uRim,0.15),mix(uHot,vCol,0.6),smoothstep(0.0,0.85,mu))*limb*(0.95+0.1*g)*1.04;
 c+=mix(uRim,vCol,0.5)*pow(1.0-mu,3.2)*0.45;
 gl_FragColor=vec4(mix(uFogC,c,exp(-uFog*uFog*vDepth*vDepth)),1.0);}`,
    // camera-facing quads, one instanced draw per kind: dust nebulae (NEB) and sun coronas (COR)
    quadV:`attribute vec3 aPos;attribute vec4 aCol;attribute vec2 aSz;uniform float uT,uFog,uSpin;varying vec2 vQ;varying vec2 vU;varying vec2 vU2;varying vec4 vC;
void main(){vec4 mv=modelViewMatrix*vec4(aPos,1.0);vQ=position.xy;mv.xy+=vQ*aSz.x;
 float a=aSz.y+uT*uSpin,c=cos(a),s=sin(a);vU=vec2(c*vQ.x-s*vQ.y,s*vQ.x+c*vQ.y)+0.5;
 a=-aSz.y*1.7-uT*uSpin*1.3;c=cos(a);s=sin(a);vU2=vec2(c*vQ.x-s*vQ.y,s*vQ.x+c*vQ.y)*0.85+0.5;
 float d=-mv.z;vC=vec4(aCol.rgb,aCol.a*exp(-uFog*uFog*d*d)*smoothstep(aSz.x*0.12,aSz.x*0.55,d));gl_Position=projectionMatrix*mv;}`,
    quadF:`uniform sampler2D uTex;varying vec2 vQ;varying vec2 vU;varying vec2 vU2;varying vec4 vC;
void main(){float r=length(vQ)*2.0;if(r>1.0||vC.a<0.002)discard;
#ifdef NEB
 vec4 t=texture2D(uTex,vU),t2=texture2D(uTex,vU2);
 float e=t.r*(0.55+0.9*t2.r);e=max(e-smoothstep(0.42,0.8,t2.g)*t.r*0.85,0.0)*(1.0-smoothstep(0.6,1.0,r));
 vec3 col=mix(vC.rgb,vC.rgb*vec3(0.78,0.86,1.12),t2.r);
#else
 float e=(texture2D(uTex,vU).r*0.42+texture2D(uTex,vU2).r*0.3)+exp(-r*r*20.0)*0.9+exp(-r*r*5.0)*0.24;
 e*=1.0-smoothstep(0.7,1.0,r);vec3 col=vC.rgb;
#endif
 gl_FragColor=vec4(col,e*vC.a);}`,
  };
  function deepTextures(){
    if(deepTex)return deepTex;
    const mk=(draw)=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,256);draw(x);return new THREE.CanvasTexture(c);};
    // dust: red = a soft fbm cloud masked to a disc, green = a second noise that carves dark lanes into it
    const dust=(()=>{const N=64,G=new Float32Array(N*N*2),rng=seeded(31);for(let i=0;i<G.length;i++)G[i]=rng();
      const vn=(u,v,o)=>{const i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j,su=fu*fu*(3-2*fu),sv=fv*fv*(3-2*fv),g=(a,b)=>G[o+((b&(N-1))*N)+(a&(N-1))];
        return (g(i,j)*(1-su)+g(i+1,j)*su)*(1-sv)+(g(i,j+1)*(1-su)+g(i+1,j+1)*su)*sv;};
      const fb=(u,v,o)=>vn(u,v,o)*.5+vn(u*2,v*2,o)*.25+vn(u*4,v*4,o)*.125+vn(u*8,v*8,o)*.0625;
      const D=new Uint8Array(256*256*4);
      for(let y=0;y<256;y++)for(let X=0;X<256;X++){const u=X/256*5,v=y/256*5,dx=X/256-.5,dy=y/256-.5,m=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)*2),o=(y*256+X)*4;
        D[o]=Math.min(255,Math.max(0,fb(u,v,0)-0.3)*2.2*m*m*255);D[o+1]=fb(u*1.7+3,v*1.7+1,N*N)*255;D[o+3]=255;}
      const t=new THREE.DataTexture(D,256,256,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();
    // corona: fine radial rays on black
    const corona=mk(x=>{const rng=seeded(77);x.translate(128,128);x.globalCompositeOperation='lighter';
      for(let i=0;i<110;i++){const a=rng()*Math.PI*2,len=18+rng()*70,w=0.5+rng()*1.3,g=x.createLinearGradient(0,0,Math.cos(a)*len,Math.sin(a)*len);
        g.addColorStop(0,'rgba(255,255,255,.26)');g.addColorStop(1,'rgba(255,255,255,0)');x.strokeStyle=g;x.lineWidth=w;x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(a)*len,Math.sin(a)*len);x.stroke();}});
    return deepTex={dust,corona};
  }
  // the sky, baked once into an equirectangular texture (cheap to draw every frame): vertical gradient, a warm wash on
  // one side and a cool one opposite, and a milky band across the home view with a warm core and dark dust lanes
  const DEEP_BAND=[0.42,0.546,0.728];
  function deepSkyTex(D){
    if(deepTex&&deepTex.skyFor===D)return deepTex.sky;
    const W=LITE?384:768,H=LITE?192:384,P=new Uint8Array(W*H*4);
    const h3=(a,b,z)=>{a=a*0.3183099+0.1;b=b*0.3183099+0.1;z=z*0.3183099+0.1;a=(a-Math.floor(a))*17;b=(b-Math.floor(b))*17;z=(z-Math.floor(z))*17;const r=a*b*z*(a+b+z);return r-Math.floor(r);};
    const vn=(X,Y,Z)=>{const i=Math.floor(X),j=Math.floor(Y),k=Math.floor(Z);let u=X-i,v=Y-j,w=Z-k;u=u*u*(3-2*u);v=v*v*(3-2*v);w=w*w*(3-2*w);
      const l=(a,b,c2)=>a+(b-a)*c2;
      return l(l(l(h3(i,j,k),h3(i+1,j,k),u),l(h3(i,j+1,k),h3(i+1,j+1,k),u),v),l(l(h3(i,j,k+1),h3(i+1,j,k+1),u),l(h3(i,j+1,k+1),h3(i+1,j+1,k+1),u),v),w);};
    const C=k=>{const q=new THREE.Color(D[k]);return [q.r,q.g,q.b];},bot=C('bot'),mid=C('mid'),top=C('top'),band=C('band'),warm=C('warm'),cool=C('cool');
    const wd=[-0.55,0.62,0.10],cd=[0.62,-0.25,0.35],nb=DEEP_BAND,wl=Math.hypot(...wd),cl=Math.hypot(...cd),ss=(e0,e1,t)=>{t=Math.min(1,Math.max(0,(t-e0)/(e1-e0)));return t*t*(3-2*t);};
    // texel → direction exactly as the dome's SphereGeometry (rotated so its pole is +z) lays out its uv
    for(let py=0;py<H;py++){const th=(py+0.5)/H*Math.PI,st=Math.sin(th),dz=Math.cos(th);
      for(let px=0;px<W;px++){const ph=(px+0.5)/W*Math.PI*2,dx=-Math.cos(ph)*st,dy=-Math.sin(ph)*st;
        const t=dz<0?ss(0,-0.8,dz):ss(0,0.95,dz),a=dz<0?bot:top;let r=mid[0]+(a[0]-mid[0])*t,g=mid[1]+(a[1]-mid[1])*t,b=mid[2]+(a[2]-mid[2])*t;
        const ww=Math.pow(Math.max(0,(dx*wd[0]+dy*wd[1]+dz*wd[2])/wl),3)*D.wash,cw=Math.pow(Math.max(0,(dx*cd[0]+dy*cd[1]+dz*cd[2])/cl),2.5)*D.wash*1.6;
        r+=warm[0]*ww+cool[0]*cw;g+=warm[1]*ww+cool[1]*cw;b+=warm[2]*ww+cool[2]*cw;
        const bx=dx*nb[0]+dy*nb[1]+dz*nb[2]-0.08;
        if(Math.abs(bx)<0.62){const n=vn(dx*3.5,dy*3.5,dz*3.5)*0.5+vn(dx*8,dy*8,dz*8)*0.3+vn(dx*19,dy*19,dz*19)*0.2;
          const bd=Math.exp(-bx*bx*12)*ss(0.28,0.85,n),core=Math.exp(-bx*bx*60),lane=ss(0.52,0.75,vn(dx*10+7.3,dy*10+7.3,dz*10+7.3)*0.65+vn(dx*26,dy*26,dz*26)*0.35);
          const k=bd*(D.bandK+D.bandK*1.5*core)*(1-0.8*lane*(0.3+0.7*core)),m=core*0.6;
          r+=(band[0]+(warm[0]-band[0])*m)*k;g+=(band[1]+(warm[1]-band[1])*m)*k;b+=(band[2]+(warm[2]-band[2])*m)*k;}
        const o=((H-1-py)*W+px)*4;P[o]=Math.min(255,r*255);P[o+1]=Math.min(255,g*255);P[o+2]=Math.min(255,b*255);P[o+3]=255;}}
    const tx=new THREE.DataTexture(P,W,H,THREE.RGBAFormat);tx.magFilter=tx.minFilter=THREE.LinearFilter;tx.wrapS=THREE.RepeatWrapping;tx.needsUpdate=true;
    if(deepTex.sky)deepTex.sky.dispose();deepTex.sky=tx;deepTex.skyFor=D;return tx;
  }
  function deepQuads(items,tex,def,spin,order){
    const n=items.length;if(!n)return;const g=new THREE.InstancedBufferGeometry();
    g.setIndex([0,1,2,0,2,3]);g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,.5,0],3));
    const P=new Float32Array(n*3),C=new Float32Array(n*4),S=new Float32Array(n*2);
    items.forEach((it,i)=>{P[i*3]=it.p.x;P[i*3+1]=it.p.y;P[i*3+2]=it.p.z;C[i*4]=it.c.r;C[i*4+1]=it.c.g;C[i*4+2]=it.c.b;C[i*4+3]=it.op;S[i*2]=it.size;S[i*2+1]=it.rot;});
    g.setAttribute('aPos',new THREE.InstancedBufferAttribute(P,3));g.setAttribute('aCol',new THREE.InstancedBufferAttribute(C,4));g.setAttribute('aSz',new THREE.InstancedBufferAttribute(S,2));g.instanceCount=n;
    const m=new THREE.Mesh(g,new THREE.ShaderMaterial({vertexShader:DEEP.quadV,fragmentShader:DEEP.quadF,defines:def,uniforms:{uTex:{value:tex},uT:deepT,uFog:{value:SKIN.fog},uSpin:{value:spin}},
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));m.frustumCulled=false;m.renderOrder=order;extras.add(m);
  }
  function deepSky(){
    const D=SKIN.deep,T=deepTextures(),RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),col=h=>new THREE.Color(h);
    // sky dome (opaque, first thing drawn); its onBeforeRender advances the shared clock
    const dome=new THREE.Mesh(new THREE.SphereGeometry(1,64,32).rotateX(Math.PI/2),new THREE.ShaderMaterial({vertexShader:DEEP.domeV,fragmentShader:DEEP.domeF,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
      uniforms:{uSky:{value:deepSkyTex(D)}}}));
    dome.frustumCulled=false;dome.renderOrder=-10;dome.onBeforeRender=()=>{deepT.value=RM?0:(performance.now()/1000)%7200;};extras.add(dome);
    // stars: one Points draw, colour temperature O→M, a third crowded toward the milky band, the brightest with spikes
    const TEMP=[0x9bb0ff,0xaabfff,0xcad7ff,0xf8f7ff,0xfff4ea,0xffe4c4,0xffd2a1,0xffc27a].map(h=>new THREE.Color(h)),nB=new THREE.Vector3(...DEEP_BAND).normalize();
    const SL=LITE?D.stars.map(([N,s,b])=>[Math.ceil(N*0.35),s,b]):D.stars;   // LITE: a third of the stars
    const total=SL.reduce((a,l)=>a+l[0],0),SP=new Float32Array(total*3),SC=new Float32Array(total*3),SS=new Float32Array(total*4),rng=seeded(97),v=new THREE.Vector3();let i=0;
    SL.forEach(([N,size,br],li)=>{for(let k=0;k<N;k++,i++){const t=rng()*Math.PI*2,u=rng()*2-1,q=Math.sqrt(1-u*u);v.set(q*Math.cos(t),q*Math.sin(t),u);
      if(rng()<0.34)v.addScaledVector(nB,-v.dot(nB)*0.88).normalize();SP.set([v.x,v.y,v.z],i*3);
      const c=TEMP[Math.min(TEMP.length-1,Math.floor(Math.pow(rng(),0.85)*TEMP.length))],b=br*(0.5+rng()*0.5);SC.set([c.r*b,c.g*b,c.b*b],i*3);
      SS.set([size*(0.8+rng()*0.45),rng()<0.6?D.twinkle*(0.3+rng()*0.7):0,rng(),li===SL.length-1?1:0],i*4);}});
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(SP,3));sg.setAttribute('aC',new THREE.BufferAttribute(SC,3));sg.setAttribute('aS',new THREE.BufferAttribute(SS,4));
    const stars=new THREE.Points(sg,new THREE.ShaderMaterial({vertexShader:DEEP.starV,fragmentShader:DEEP.starF,uniforms:{uT:deepT,uPR:{value:renderer.getPixelRatio()}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
    stars.frustumCulled=false;stars.renderOrder=-9;extras.add(stars);
    // planets & suns: swap in the lit / photosphere shaders on smoother spheres (cached, never disposed; the meshes are rebuilt every build)
    const fogC=col(SKIN.sky);
    if(planets&&planetIds.length){
      if(!deepGeoP)deepGeoP=new THREE.SphereGeometry(1,20,14);
      if(!deepSunAttr){deepSunAttr=new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1,RAW_NODES.length)*3),3);deepGeoP.setAttribute('aSun',deepSunAttr);}
      planetIds.forEach((id,k)=>{const p=pos[sunOf[sysOf[id]]]||pos[id];deepSunAttr.array[k*3]=p.x;deepSunAttr.array[k*3+1]=p.y;deepSunAttr.array[k*3+2]=p.z;});deepSunAttr.needsUpdate=true;
      planets.geometry=deepGeoP;planets.frustumCulled=false;planets.material.dispose();
      planets.material=new THREE.ShaderMaterial({vertexShader:DEEP.litV,fragmentShader:DEEP.litF,uniforms:{uRim:{value:col(D.rim)},uFogC:{value:fogC},uAmb:{value:D.amb},uRimK:{value:D.rimK},uFog:{value:SKIN.fog}}});}
    if(suns&&sunIds.length){
      if(!deepGeoS)deepGeoS=new THREE.SphereGeometry(1,40,28);
      suns.geometry=deepGeoS;suns.frustumCulled=false;suns.material.dispose();
      suns.material=new THREE.ShaderMaterial({vertexShader:DEEP.sunV,fragmentShader:DEEP.sunF,uniforms:{uRim:{value:col(D.rim)},uHot:{value:col(0xfff5e6)},uFogC:{value:fogC},uFog:{value:SKIN.fog},uT:deepT}});
      if(!LITE)glows.forEach(g=>{if(g.isSprite&&g.material.map===glowTex)g.visible=false;});   // LITE keeps the flat glow sprites instead of coronas
      for(const id in sunLbl)sunLbl[id].style.setProperty('--sys',sysBySun[id].color);   // the chip's dot is the group's colour   // the coronas below replace the flat glow sprites
      const warm=col(D.corona);
      if(!LITE)deepQuads(sunIds.map(id=>{const s=sysBySun[id];return {p:pos[id],size:rSun(s)*10,c:skinCol(new THREE.Color(),s.color).lerp(warm,0.3),op:0.62,rot:s.cid*1.7};}),T.corona,{COR:1},RM?0:0.015,2);}
    // dust nebulae: two offset clouds per real system (its colour graded toward a warm/violet/cool palette), plus a faint
    // galaxy-scale wash behind each galaxy, all one draw
    if(LITE)return;   // LITE: no dust nebulae
    const PAL=[0xF0923F,0x8a5bb8,0x3f6fa8,0xc05a78].map(h=>new THREE.Color(h)),neb=[],nr=seeded(53),_o=new THREE.Vector3();
    systems.forEach((s,k)=>{if(s.n<3||!nodeVisible(s.sun))return;const w=Math.min(1,0.6+s.n/40);
      for(let j=0;j<2;j++){_o.set(nr()-0.5,nr()-0.5,(nr()-0.5)*0.5).multiplyScalar(s.r*(j?0.7:0.3));
        neb.push({p:s.c.clone().add(_o),size:s.r*(j?2.6:3.5)*(0.9+nr()*0.3),c:skinCol(new THREE.Color(),s.color).lerp(PAL[(k+j)%PAL.length],j?0.65:0.4),op:D.dust*w*(j?0.55:1),rot:nr()*6.28});}});
    realmList.forEach((R,k)=>{const rr=R.r||galaxyR;[[0,1.8,0],[1,1.25,1]].forEach(([j,sz,pi])=>{_o.set(nr()-0.5,nr()-0.5,(nr()-0.5)*0.3).multiplyScalar(rr*0.5);
      neb.push({p:(R.c||new THREE.Vector3()).clone().add(_o),size:rr*sz,c:(R.meta&&R.meta.color?col(R.meta.color):PAL[(k+j)%PAL.length].clone()).lerp(PAL[pi],0.5),op:D.dust*0.5,rot:nr()*6.28});});});
    deepQuads(neb,T.dust,{NEB:1},0,1);
  }
  // ── blueprint: the map as an engineering drawing ──
  // Nodes are drafted circles: an ink outline of constant pixel weight over a light fill, drawn from the sphere's
  // own view-space normal (no extra geometry). Suns get a hatched section and a centre mark. Every orbit is a
  // dashed construction circle (one draw call), a datum grid lies under the galaxy, and a dimension callout
  // measures whatever you are looking at. A sheet frame and title block sit on the #fx overlay.
  const BP_VS=`uniform float uFogD;varying vec3 vP;varying vec3 vC;varying float vR;varying vec3 vCol;varying float vFog;
void main(){mat4 im=mat4(1.0);
#ifdef USE_INSTANCING
im=instanceMatrix;
#endif
mat4 m=modelViewMatrix*im;vec4 c=m*vec4(0.0,0.0,0.0,1.0);vec4 mv=m*vec4(position*1.08,1.0);   // inflated so the coarse mesh covers the true disc
vC=c.xyz;vR=length((m*vec4(1.0,0.0,0.0,0.0)).xyz);vP=mv.xyz;vCol=vec3(1.0);
#ifdef USE_INSTANCING_COLOR
vCol=instanceColor;
#endif
vFog=1.0-exp(-uFogD*uFogD*c.z*c.z);gl_Position=projectionMatrix*mv;}`;
  // rho = distance from the pixel's view ray to the sphere centre, in radii: an exact circle at any tessellation
  const BP_FS=`uniform vec3 uPaper,uInk;uniform float uW,uFill,uSun,uHatch,uPx,uInkK;
varying vec3 vP;varying vec3 vC;varying float vR;varying vec3 vCol;varying float vFog;
void main(){vec3 dir=normalize(vP);vec3 o=dir*dot(vC,dir)-vC;float rho=length(o)/vR;float aa=max(fwidth(rho),1e-4);
  if(rho>1.0+2.5*aa)discard;                                                  // beyond: a thin paper gap, lines behind break at the circle
  float inside=1.0-smoothstep(1.0,1.0+aa,rho);
  float ink=smoothstep(1.0-(uW+1.0)*aa,1.0-uW*aa,rho)*inside;                // outline, uW device px at any size
  vec3 inkC=mix(vCol,uInk,uInkK),fill=mix(uPaper,vCol,uFill);
  if(uHatch>0.0){float P=7.0*uPx;float dd=abs(fract((gl_FragCoord.x+gl_FragCoord.y)/P)-0.5)*P*0.7071;
    fill=mix(fill,vCol,(1.0-smoothstep(0.45*uPx,1.1*uPx,dd))*uHatch);}          // 45° section hatch
  if(uSun>0.5){vec2 p=o.xy/vR;float r=length(p);vec2 fw=max(fwidth(p),vec2(1e-4));
    float l=max(1.0-smoothstep(0.55,1.35,abs(p.x)/fw.x),1.0-smoothstep(0.55,1.35,abs(p.y)/fw.y));
    float seg=max(step(r,0.13),step(0.25,r)*step(r,0.86));                   // centre mark: short dash, gap, long dash
    ink=max(ink,l*seg*step(aa*6.0,1.0));}
  fill=mix(uPaper,fill,inside);
  gl_FragColor=vec4(mix(mix(fill,inkC,ink),uPaper,vFog),1.0);}`;
  const BP_FLOOR_VS=`varying vec2 vW;varying float vD;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xy;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}`;
  const BP_FLOOR_FS=`uniform float uCell,uFogD,uR;uniform vec3 uCol,uA;varying vec2 vW;varying float vD;
float gridL(vec2 g){vec2 fw=max(fwidth(g),vec2(1e-5));vec2 l=abs(fract(g-0.5)-0.5)/fw;
  return (1.0-min(min(l.x,l.y),1.0))*(1.0-smoothstep(0.22,0.5,max(fw.x,fw.y)));}   // fades cells under ~3px instead of moiré
void main(){vec2 g=vW/uCell;
#ifdef LITE
  float a=gridL(g/5.0)*uA.y;
#else
  float a=max(gridL(g)*uA.x,gridL(g/5.0)*uA.y);
#endif
  vec2 fw=max(fwidth(vW),vec2(1e-5));vec2 ax=abs(vW)/fw;
  vec2 t=fract(vW.yx/(uCell*2.0));vec2 cl=max(step(t,vec2(0.6)),step(vec2(0.72),t)*step(t,vec2(0.8)));   // dash-dot centre lines
  a=max(a,max((1.0-min(ax.x/1.2,1.0))*cl.x,(1.0-min(ax.y/1.2,1.0))*cl.y)*uA.z);
  a*=(1.0-smoothstep(0.45,1.0,length(vW)/uR))*exp(-uFogD*uFogD*vD*vD);
  if(a<0.003)discard;gl_FragColor=vec4(uCol,a);}`;
  let bpS=null;const _bpv=new THREE.Vector3(),_bpq=new THREE.Quaternion(),_bpO=new THREE.Vector3();
  const bpNice=x=>{const p=Math.pow(10,Math.floor(Math.log10(Math.max(x,1e-6)))),m=x/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p;};
  const bpFmt=x=>x>=100?String(Math.round(x)):x.toFixed(1);
  function bpSheet(){let el=document.getElementById('bp-sheet');if(el)return el;
    el=document.createElement('div');el.id='bp-sheet';
    el.innerHTML=`<i class="bp-fr"></i><div id="bp-tb"><div class="bp-r"><span>Project</span><b>${_e(ATLAS.title||'Monarch Atlas')}</b></div><div class="bp-r"><span>Drawing</span><b id="bp-dwg"></b></div>`+
      `<div class="bp-g"><div><span>Nodes</span><b id="bp-n"></b></div><div><span>Links</span><b id="bp-e"></b></div><div><span>Groups</span><b id="bp-s"></b></div><div><span>Grid</span><b id="bp-grid"></b></div></div>`+
      `<div class="bp-r bp-sc"><span>Scale</span><div id="bp-bar"><i></i><em><small>0</small><small id="bp-len"></small></em></div></div></div>`;
    document.getElementById('fx').appendChild(el);return el;}
  function bpBuild(){
    const I=SKIN.ink||{},px=renderer.getPixelRatio(),R=Math.max(400,galaxyR);
    // nodes → drafted circles (the meshes, their picking and hover scaling stay the engine's)
    const inkMat=sun=>new THREE.ShaderMaterial({vertexShader:BP_VS,fragmentShader:BP_FS,extensions:{derivatives:true},
      uniforms:{uPaper:{value:new THREE.Color(SKIN.sky)},uInk:{value:new THREE.Color(0xffffff)},uInkK:{value:sun?1:0},uFogD:{value:SKIN.fog},uW:{value:(sun?I.sunW||1.9:I.w||1.25)*px},
        uFill:{value:sun?I.sunFill||0.2:I.fill||0.15},uSun:{value:sun?1:0},uHatch:{value:sun?I.hatch||0:0},uPx:{value:px}}});
    if(planets){planets.material.dispose();planets.material=inkMat(false);}
    if(suns){suns.material.dispose();suns.material=inkMat(true);}
    glows.forEach(g=>{if(g.isSprite)g.visible=false;});   // ink doesn't glow
    // construction circles: every orbit of every visible system in one dashed LineSegments
    const rings=[];let nv=0;const sp=state.spacing;
    systems.forEach(s=>{if(!nodeVisible(s.sun)||s.n<2)return;let i=1,k=0;while(i<s.n){k++;const cap=Math.round(6+5.5*k),r=(9+6.5*k)*sp;i+=Math.min(cap,s.n-i);const seg=Math.max(48,Math.min(128,Math.round(r*1.6)));rings.push([s,r,seg]);nv+=seg*2;}});
    if(nv){const P=new Float32Array(nv*3),C=new Float32Array(nv*3);let o=0,last=null;
      for(const [s,r,seg] of rings){if(s!==last){last=s;_bpq.setFromEuler(s.tilt);skinCol(_c,s.color).lerp(_tc.set(0xffffff),0.35);}
        for(let j=0;j<seg;j++)for(let e=0;e<2;e++){const a=(j+e)/seg*Math.PI*2;_bpv.set(r*Math.cos(a),r*Math.sin(a),0).applyQuaternion(_bpq).add(s.c);
          P[o]=_bpv.x;P[o+1]=_bpv.y;P[o+2]=_bpv.z;C[o]=_c.r;C[o+1]=_c.g;C[o+2]=_c.b;o+=3;}}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('color',new THREE.BufferAttribute(C,3));
      const l=new THREE.LineSegments(g,new THREE.LineDashedMaterial({vertexColors:true,dashSize:1.7*sp,gapSize:1.3*sp,transparent:true,opacity:I.orbit||0.3,depthWrite:false}));l.computeLineDistances();extras.add(l);}
    // datum grid under the galaxy: minor cells, a major line every 5, dash-dot centre lines through the origin
    const cell=bpNice(galaxyR/8),F=I.floor||[0.05,0.13,0.3];
    const floor=new THREE.Mesh(new THREE.CircleGeometry(galaxyR*2.6,72),new THREE.ShaderMaterial({vertexShader:BP_FLOOR_VS,fragmentShader:BP_FLOOR_FS,defines:LITE?{LITE:1}:{},extensions:{derivatives:true},transparent:true,depthWrite:false,
      uniforms:{uCell:{value:cell},uFogD:{value:SKIN.fog},uR:{value:galaxyR*2.6},uCol:{value:new THREE.Color(0xffffff)},uA:{value:new THREE.Vector3(F[0],F[1],F[2])}}}));
    floor.position.z=-galaxyR*0.7;floor.renderOrder=-1;extras.add(floor);
    // dimension callout: a phantom envelope circle and a diameter dimension with outside arrows and a leader to the note
    // (unit size, billboarded, scaled to what it measures)
    const D=Math.SQRT1_2,ah=0.045,aw=0.014,t1=1+ah+0.16,env=[],lin=[],tri=[];
    for(let j=0;j<96;j++){const a0=j/96*Math.PI*2,a1=(j+1)/96*Math.PI*2;env.push(Math.cos(a0),Math.sin(a0),0,Math.cos(a1),Math.sin(a1),0);}
    lin.push(-D*(1+ah),D*(1+ah),0,-D*t1,D*t1,0, -D*t1,D*t1,0,-D*t1-0.2,D*t1,0, D*(1+ah),-D*(1+ah),0,D*(1+ah+0.24),-D*(1+ah+0.24),0);
    [[-1,1],[1,-1]].forEach(([sx,sy])=>{const tx=sx*D,ty=sy*D,bx=tx*(1+ah),by=ty*(1+ah),px=-ty*aw,py=tx*aw;tri.push(tx,ty,0,bx+px,by+py,0,bx-px,by-py,0);});
    const dm={color:0xffffff,transparent:true,opacity:0.9,depthTest:false,depthWrite:false,fog:false};
    const g0=new THREE.BufferGeometry();g0.setAttribute('position',new THREE.Float32BufferAttribute(env,3));
    const g1=new THREE.BufferGeometry();g1.setAttribute('position',new THREE.Float32BufferAttribute(lin,3));
    const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(tri,3));
    const envL=new THREE.LineSegments(g0,new THREE.LineDashedMaterial({color:0xffffff,dashSize:0.075,gapSize:0.035,transparent:true,opacity:0.4,depthTest:false,depthWrite:false,fog:false}));envL.computeLineDistances();
    const dim=[envL,new THREE.LineSegments(g1,new THREE.LineBasicMaterial(dm)),new THREE.Mesh(g2,new THREE.MeshBasicMaterial(Object.assign({side:THREE.DoubleSide},dm)))];
    dim.forEach(o=>{o.renderOrder=5;o.visible=false;o.frustumCulled=false;o.scale.setScalar(galaxyR);extras.add(o);});
    const lbl=document.createElement('div');lbl.className='bp-dim';lblLayer.appendChild(lbl);
    bpSheet();const $=id=>document.getElementById(id);
    $('bp-n').textContent=planetIds.length+sunIds.length;$('bp-e').textContent=edgeList.length;$('bp-s').textContent=sunIds.length;$('bp-grid').textContent=bpFmt(cell)+' u';
    bpS={dim,lbl,key:null,c:new THREE.Vector3(),r:galaxyR,t:0,lx:-1,ly:-1,on:false,bar:$('bp-bar'),len:$('bp-len'),dwg:$('bp-dwg'),barW:-1};
  }
  function bpStep(dt,now){const S=bpS;
    // what the callout measures: the focused system, else the focused galaxy, else the whole map
    const key=focused!=null?'s'+focused:(focusedRealm!=null&&multi()?'r'+focusedRealm:'g');
    if(key!==S.key){S.key=key;let c=_bpO.set(0,0,0),r=0,name='General arrangement',note=sunIds.length+' groups';
      systems.forEach(s=>{if(nodeVisible(s.sun))r=Math.max(r,s.c.length()+s.r);});r=r||galaxyR;
      if(focused!=null){const s=systems.find(x=>x.cid===focused);if(s){c=s.c;r=s.r;name='Detail · '+s.label;note='N = '+s.n;}}
      else if(key[0]==='r'){const R=realmList.find(x=>x.name===focusedRealm);if(R){c=R.c;r=R.r;name='Galaxy · '+R.name;note=R.systems.length+' groups';}}
      S.c.copy(c);S.r=r;S.lbl.textContent='Ø '+bpFmt(2*r)+'  ·  '+note;S.dwg.textContent=name;}
    const k=1-Math.exp(-dt*6),d=S.dim[0];d.position.lerp(S.c,k);const sc=d.scale.x+(S.r-d.scale.x)*k;d.scale.setScalar(sc);d.quaternion.copy(camera.quaternion);
    for(let i=1;i<S.dim.length;i++){const a=S.dim[i];a.position.copy(d.position);a.scale.copy(d.scale);a.quaternion.copy(d.quaternion);}
    const W=window.innerWidth,H=window.innerHeight,ppu=pxPer(),rpx=sc*ppu/Math.max(1,camera.position.distanceTo(d.position));
    let on=rpx>70&&rpx<H*0.62;
    if(on){const t=(1+0.045+0.16)*Math.SQRT1_2;_bpv.set(-t-0.2,t,0).applyQuaternion(camera.quaternion).multiplyScalar(sc).add(d.position).project(camera);
      const x=Math.round((_bpv.x+1)/2*W)-6,y=Math.round((1-_bpv.y)/2*H);on=_bpv.z<1&&y>64&&y<H-40&&x>150&&x<W;
      if(on&&(x!==S.lx||y!==S.ly)){S.lx=x;S.ly=y;S.lbl.style.transform='translate(-100%,-50%) translate('+x+'px,'+y+'px)';}}
    if(on!==S.on){S.on=on;for(const o of S.dim)o.visible=on;S.lbl.classList.toggle('on',on);}
    // sun tags sit just above their circle, however big it is on screen
    for(const id in sunLbl){const el=sunLbl[id];if(!el.classList.contains('on'))continue;const s=sysBySun[id];if(!s)continue;
      const lift=Math.min(400,Math.round(rSun(s)*ppu/Math.max(1,camera.position.distanceTo(pos[id]))));if(lift!==el._bpL){el._bpL=lift;el.style.translate='0 '+(-lift)+'px';}}
    // graphic scale in the title block, a few times a second: a round length at the target's depth, ~90px long
    if(now-S.t>250){S.t=now;const u=ppu/Math.max(1,camera.position.distanceTo(controls.target)),L=bpNice(90/u),w=Math.round(L*u);
      if(w!==S.barW){S.barW=w;S.bar.style.width=w+'px';S.len.textContent=bpFmt(L)+' u';}}
  }
  function extrasStep(dt,now){
    if(extras.userData.step)extras.userData.step(dt,now);
    if(mtx)matrixStep(dt);
    if(bpS)bpStep(dt,now);
    if(!hudRings.length)return;
    let c=null,r=galaxyR*1.05;
    if(focused!=null){const s=systems.find(x=>x.cid===focused);if(s){c=s.c;r=s.r*1.5;}}
    else if(focusedRealm!=null&&multi()){const R=realmList.find(x=>x.name===focusedRealm);if(R){c=R.c;r=R.r*1.15;}}
    c=c||new THREE.Vector3();
    for(const l of hudRings){l.position.lerp(c,1-Math.exp(-dt*5));const k=l.scale.x+(r-l.scale.x)*(1-Math.exp(-dt*5));l.scale.set(k,k,k);
      l.quaternion.copy(camera.quaternion);l.rotateZ(now/1000*l.userData.spd*Math.PI*2);}
  }
  // ── matrix: phosphor nodes + 3D glyph rain. Everything here is matrix-only; mtx stays null for every other skin ──
  let mtx=null,mtxGlyphs=null,mtxSunGeo=null;
  const MTX_RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
  // one instanced sphere shader for planets and suns: dim core, hot fresnel rim, scanlines on the dot itself,
  // and a scan band that sweeps up through the whole world at once. Additive, so it does its own depth fade to black.
  const MTX_NODE_VS=`varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying float vDepth;varying float vWz;
void main(){mat4 im=mat4(1.0);
#ifdef USE_INSTANCING
  im=instanceMatrix;
#endif
  vec4 wp=modelMatrix*im*vec4(position,1.0);vec4 mv=viewMatrix*wp;
  vN=normalize(normalMatrix*mat3(im)*normal);vV=normalize(-mv.xyz);vCol=vec3(1.0);
#ifdef USE_INSTANCING_COLOR
  vCol=instanceColor;
#endif
  vDepth=-mv.z;vWz=wp.z;gl_Position=projectionMatrix*mv;}`;
  const MTX_NODE_FS=`uniform vec3 uRim;uniform float uPow,uCore,uMix,uTime,uScan,uLines,uFog,uBandK,uHot;
varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying float vDepth;varying float vWz;
void main(){float f=pow(1.0-clamp(abs(dot(normalize(vN),normalize(vV))),0.0,1.0),uPow);
  vec3 col=mix(vCol,uRim,uMix*f);col=mix(col,vec3(0.86,1.0,0.9),uHot*(1.0-f)*(1.0-f));
  float bs=(fract(vWz*uBandK-uTime*0.1)-0.5)/0.075;float band=uScan*exp(-bs*bs);   // soft on both edges: no hard cut in a still frame
  float a=uCore+uHot*0.35*(1.0-f)+f+band*0.8;
  a*=1.0-uLines*step(1.5,mod(gl_FragCoord.y,3.0));
  a*=exp(-uFog*uFog*vDepth*vDepth);
  gl_FragColor=vec4(col*(0.6+f*1.3+band*1.4),a);}`;
  // glyph rain: columns of points on a loose cylinder round the galaxy. Fall, trail, head highlight, glyph flicker
  // and depth fade all happen in the vertex shader; the CPU only moves two uniforms per frame.
  const MTX_RAIN_VS=`attribute float aK;attribute float aSeed;uniform float uTime,uLen,uScale,uCell,uFog,uMaxPx;
varying float vB;varying float vHead;varying float vG;varying float vF;
void main(){float spd=0.6+fract(aSeed*7.13)*0.9;
  float head=fract(uTime*spd*0.07+aSeed)*(uLen+20.0)-6.0;float behind=head-aK;
  vHead=step(0.0,behind)*step(behind,1.0);
  vB=behind<0.0?0.0:clamp(1.0-behind/(8.0+fract(aSeed*3.7)*12.0),0.0,1.0);
  float rate=0.35+fract(aSeed*5.0+aK*0.13)*0.9+vHead*9.0;
  vG=floor(fract(aSeed*13.1+aK*0.371+floor(uTime*rate+aK*0.61)*0.137)*64.0);
  vec4 mv=modelViewMatrix*vec4(position,1.0);float d=-mv.z;
  float ps=uCell*uScale/max(d,1.0);
  vF=exp(-uFog*uFog*d*d)*(1.0-smoothstep(uMaxPx*0.4,uMaxPx,ps));   // far columns fade into the dark, ones that come too close dissolve
  float dc=-(modelViewMatrix*vec4(0.0,0.0,0.0,1.0)).z;vF*=mix(0.1,1.0,smoothstep(dc*0.45,dc*0.9,d));   // columns in front of the galaxy core fall off before they cross it
  gl_PointSize=min(ps,uMaxPx);
  if(vB<=0.0||vF<0.01)gl_PointSize=0.0;
  gl_Position=projectionMatrix*mv;}`;
  const MTX_RAIN_FS=`uniform sampler2D uGlyph;uniform vec3 uCol;uniform vec3 uHeadCol;varying float vB;varying float vHead;varying float vG;varying float vF;
void main(){if(vB<=0.0)discard;vec2 cell=vec2(mod(vG,8.0),floor(vG/8.0));vec2 pc=gl_PointCoord;
  float a=texture2D(uGlyph,vec2((cell.x+pc.x)/8.0,1.0-(cell.y+pc.y)/8.0)).r;if(a<0.04)discard;
  float b=vHead>0.5?1.0:vB*(0.25+0.6*vB);
  gl_FragColor=vec4(mix(uCol,uHeadCol,vHead),a*b*vF);}`;
  // 8×8 glyph atlas (mirrored half-width katakana, plain digits and symbols), drawn once and kept across reskins
  function mtxGlyphTex(){if(mtxGlyphs)return mtxGlyphs;const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    const G='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789Z:・.=*+-<>¦|';
    x.fillStyle='#000';x.fillRect(0,0,512,512);x.fillStyle='#fff';x.font='bold 46px "MS Gothic","Hiragino Kaku Gothic ProN","Noto Sans Mono CJK JP","IPAGothic",monospace';x.textAlign='center';x.textBaseline='middle';
    for(let i=0;i<64;i++){const ch=G[i%G.length];x.save();x.translate((i%8)*64+32,Math.floor(i/8)*64+34);if(ch>'\u00ff')x.scale(-1,1);x.fillText(ch,0,0);x.restore();}   // katakana mirrored, digits read true
    mtxGlyphs=new THREE.CanvasTexture(c);return mtxGlyphs;}
  function buildMatrix(){
    const P=SKIN.phosphor||{},R=Math.max(60,galaxyR),uT={value:0};
    const mat=(core,hot)=>new THREE.ShaderMaterial({vertexShader:MTX_NODE_VS,fragmentShader:MTX_NODE_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{uRim:{value:new THREE.Color(P.rim||0xd6ffde)},uPow:{value:P.pow||1.8},uCore:{value:core},uMix:{value:P.mix||0.55},uTime:uT,uScan:{value:MTX_RM?0:(P.scan||0)},
        uLines:{value:P.lines||0},uFog:{value:SKIN.fog},uBandK:{value:1/(R*0.45)},uHot:{value:hot}}});
    // the node meshes were just built with the stock material; swap in the phosphor one (clearMeshes disposes it on the next build)
    if(planets){planets.material.dispose();planets.material=mat(P.core||0.2,0);}
    if(suns){suns.material.dispose();suns.material=mat(P.sunCore||0.3,P.sunHot||0.5);suns.geometry=mtxSunGeo||(mtxSunGeo=new THREE.SphereGeometry(1,40,28));}   // suns fill the screen up close: a rounder limb (few instances, cheap; kept across builds)
    glows.forEach(g=>{if(g.isSprite&&g.material.opacity>0.5)g.material.opacity=P.glow||0.3;});   // sun halos (nebulae are the faint ones)
    if(lines)lines.material.blending=THREE.AdditiveBlending;
    const COLS=Math.round(Math.min(140,Math.max(64,R/2))*(LITE?0.55:1)),L=30,n=COLS*L,Pp=new Float32Array(n*3),K=new Float32Array(n),Sd=new Float32Array(n),rng=seeded(9),cell=R*0.045;
    for(let c=0;c<COLS;c++){const a=(c+rng()*0.8)/COLS*Math.PI*2,rr=R*(1.25+rng()*1.75),seed=rng(),top=R*(0.45+rng()*0.9);
      for(let k=0;k<L;k++){const i=c*L+k;Pp[i*3]=rr*Math.cos(a);Pp[i*3+1]=rr*Math.sin(a);Pp[i*3+2]=top-k*cell*1.08;K[i]=k;Sd[i]=seed;}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(Pp,3));g.setAttribute('aK',new THREE.BufferAttribute(K,1));g.setAttribute('aSeed',new THREE.BufferAttribute(Sd,1));
    const dpr=renderer.getPixelRatio();
    const rm=new THREE.ShaderMaterial({vertexShader:MTX_RAIN_VS,fragmentShader:MTX_RAIN_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{uTime:uT,uLen:{value:L},uScale:{value:1},uCell:{value:cell},uFog:{value:0.36/R},uMaxPx:{value:30*dpr},
        uGlyph:{value:mtxGlyphTex()},uCol:{value:new THREE.Color(0x3cff6a)},uHeadCol:{value:new THREE.Color(0xdcffe6)}}});
    const pts=new THREE.Points(g,rm);pts.frustumCulled=false;pts.renderOrder=-1;extras.add(pts);
    mtx={t:mtx?mtx.t:24,uT,rain:rm.uniforms};
  }
  function matrixStep(dt){
    if(!MTX_RM)mtx.t+=dt;   // reduced motion: the rain and scan band hold still
    mtx.uT.value=mtx.t;mtx.rain.uScale.value=renderer.domElement.height/2/Math.tan(camera.fov*Math.PI/360);
    if(lines&&lines.material.blending!==THREE.AdditiveBlending)lines.material.blending=THREE.AdditiveBlending;   // buildEdges() alone (inferred toggle) makes a stock material
  }
  let lastT=performance.now();
  // ── idle tour: leave the page alone and the camera rides along with a monarch ──
  const idleEl=document.getElementById('idle-hint');
  let idle=false,idleAfter=10000,lastInput=performance.now(),follow=null,followSince=0,followUntil=0;
  const _des=new THREE.Vector3(),_side=new THREE.Vector3(),_fwdN=new THREE.Vector3(),_upZ=new THREE.Vector3(0,0,1);
  function touch(){lastInput=performance.now();if(idle){const toured=!!follow;endIdle();if(toured&&!tw)flyHome();}}
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
function __atlasHyper(){if(window.__atlasHyper)window.__atlasHyper(network);}   // upstream's 2D hyperedge overlay ships with the page, not the viewer
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
  l.querySelector('.n').addEventListener('click',()=>{if(view==='3d'&&V3)V3.flyToSystem(g.cid);else if(network){const hub=RAW_NODES.filter(n=>n.community===g.cid).sort((a,b)=>((b.hub?1:0)-(a.hub?1:0))||wOf(b)-wOf(a))[0];if(hub)focusNode(hub.id);}});
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
  if(pv.deep){   // monarch: graded sky, milky band, soft nebulae, colour-temperature stars, warm sun glows
    o+=`<defs><linearGradient id="mn-sky" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#040407"/><stop offset=".55" stop-color="#08080e"/><stop offset="1" stop-color="#0e0f1e"/></linearGradient><radialGradient id="mn-sun"><stop offset="0" stop-color="#fff4e6" stop-opacity=".95"/><stop offset=".2" stop-color="#ffc48a" stop-opacity=".55"/><stop offset=".5" stop-color="#F0923F" stop-opacity=".16"/><stop offset="1" stop-color="#F0923F" stop-opacity="0"/></radialGradient><filter id="mn-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="${W}" height="${H}" fill="url(#mn-sky)"/>`;
    o+=`<g filter="url(#mn-blur)"><g transform="rotate(-20 120 60)"><ellipse cx="120" cy="58" rx="160" ry="15" fill="#6f6390" opacity=".38"/><ellipse cx="140" cy="58" rx="70" ry="6" fill="#b0703e" opacity=".4"/></g><circle cx="74" cy="66" r="30" fill="#8a5bb8" opacity=".28"/><circle cx="160" cy="46" r="22" fill="#F0923F" opacity=".2"/><circle cx="130" cy="104" r="18" fill="#3f6fa8" opacity=".3"/></g>`;
    const TC=['#9bb0ff','#cad7ff','#f8f7ff','#fff4ea','#ffe4c4','#ffd2a1'];
    for(let i=0;i<120;i++){const x=rng()*W,y=rng()*H,big=i%40===0;o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(big?1.1:0.3+rng()*0.6).toFixed(2)}" fill="${TC[i%TC.length]}" opacity="${(0.35+rng()*0.6).toFixed(2)}"/>`;
      if(big)o+=`<path d="M${(x-4).toFixed(1)} ${y.toFixed(1)}h8M${x.toFixed(1)} ${(y-4).toFixed(1)}v8" stroke="#fff4ea" stroke-width=".4" opacity=".7"/>`;}
    [[74,64,24],[158,48,17],[128,102,13]].forEach(([cx,cy,r])=>{o+=`<circle cx="${cx}" cy="${cy}" r="${(r*0.62).toFixed(1)}" fill="url(#mn-sun)"/>`;});
  }
  if(pv.stars)for(let i=0;i<80;i++)o+=`<circle cx="${(rng()*W).toFixed(1)}" cy="${(rng()*H).toFixed(1)}" r="${(0.4+rng()*0.7).toFixed(2)}" fill="${pv.stars}" opacity="${(0.3+rng()*0.6).toFixed(2)}"/>`;
  if(pv.rain){const G='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789Z=*+<>';o+=`<g font-family="'MS Gothic','IPAGothic',monospace" text-anchor="middle">`;   // glyph columns, three depths, white heads
    [[5.5,34,0.3],[7.5,16,0.55],[10,7,0.85]].forEach(([fs,n,op])=>{for(let i=0;i<n;i++){const x=(Math.floor(rng()*W/fs)+0.5)*fs,len=4+Math.floor(rng()*10),y0=rng()*(H+40);
      for(let k=0;k<len;k++){const y=y0-k*fs*1.05;if(y<-2||y>H+fs)continue;const head=k===0;o+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs}" fill="${head?'#e0ffe6':s.css.accent}" opacity="${(head?op+0.15:op*(1-k/len)).toFixed(2)}">${G[Math.floor(rng()*G.length)]}</text>`;}}});o+='</g>';}
  if(pv.sun){const k='sw-'+s.name.replace(/\W/g,'');   // outrun sunset: haze, a banded sun and a neon mountain line on the horizon (y=74)
    o+=`<defs><linearGradient id="${k}-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0b52" stop-opacity="0"/><stop offset=".55" stop-color="#3a0b52" stop-opacity=".75"/><stop offset="1" stop-color="#c02a92"/></linearGradient><linearGradient id="${k}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe86b"/><stop offset=".55" stop-color="#ff5ea8"/><stop offset="1" stop-color="#b02ee0"/></linearGradient><radialGradient id="${k}-g"><stop offset=".5" stop-color="#ff3fd0" stop-opacity=".5"/><stop offset="1" stop-color="#ff3fd0" stop-opacity="0"/></radialGradient><mask id="${k}-m"><rect width="${W}" height="${H}" fill="#fff"/>${[[56,.9],[61,1.4],[65.5,1.9],[69.5,2.4],[73,2.9]].map(([y,h])=>`<rect y="${y}" width="${W}" height="${h}" fill="#000"/>`).join('')}</mask></defs>`
      +`<rect y="20" width="${W}" height="54" fill="url(#${k}-h)"/><circle cx="120" cy="52" r="46" fill="url(#${k}-g)"/><circle cx="120" cy="52" r="26" fill="url(#${k}-s)" mask="url(#${k}-m)"/>`
      +`<path d="M0 74 L14 69 L24 72 L40 62 L52 70 L64 66 L78 74 Z M150 74 L166 67 L176 71 L192 60 L206 70 L220 65 L240 72 L240 74 Z" fill="#12042a" stroke="#ff5fd6" stroke-width=".7" stroke-linejoin="round"/>`;}
  if(pv.grid){o+=`<rect y="74" width="${W}" height="${H-74}" fill="#0d0322"/><rect y="73.4" width="${W}" height="1.2" fill="#ff7ae0" opacity=".9"/>`;
    for(let i=-12;i<=12;i++){const x=120+i*26;o+=`<line x1="${x}" y1="${H}" x2="${(120+i*2.2).toFixed(1)}" y2="74" stroke="#ff3fd0" stroke-opacity=".5" stroke-width=".7"/>`;}
    for(let j=1;j<9;j++){const y=74+Math.pow(j/8,2.1)*(H-74);o+=`<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#ff3fd0" stroke-opacity="${(0.15+0.5*j/8).toFixed(2)}" stroke-width=".7"/>`;}}
  if(pv.blueprint){   // a drawing sheet: grid, frame, construction circles, ink nodes, centre marks, a dimension, a leader note, a title block
    const F='font-family="SFMono-Regular,Consolas,Menlo,monospace"',ink='#fff',pp=s.css.sky;
    for(let x=0;x<=W;x+=6)o+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-opacity="${x%30?0.045:0.12}"/>`;
    for(let y=0;y<=H;y+=6)o+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-opacity="${y%30?0.045:0.12}"/>`;
    o+=`<rect x="4.5" y="4.5" width="${W-9}" height="${H-9}" fill="none" stroke="#fff" stroke-opacity=".6"/>`;
    for(let i=1;i<8;i++){const x=4.5+(W-9)*i/8;o+=`<path d="M${x} 4.5v4M${x} ${H-4.5}v-4" stroke="#fff" stroke-opacity=".5"/>`;}
    const S=[[70,60,30,0],[166,42,19,1],[128,100,14,2]],C=pv.cols;
    o+=`<g stroke="#fff" stroke-opacity=".5" stroke-width=".7"><line x1="70" y1="60" x2="166" y2="42"/><line x1="70" y1="60" x2="128" y2="100"/><line x1="166" y1="42" x2="128" y2="100"/></g>`;
    S.forEach(([cx,cy,r,si])=>{const c=C[si%C.length];
      [0.55,1].forEach(k=>o+=`<ellipse cx="${cx}" cy="${cy}" rx="${(r*k).toFixed(1)}" ry="${(r*k*0.62).toFixed(1)}" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width=".6" stroke-dasharray="2 1.6"/>`);
      for(let j=0;j<8;j++){const a=j/8*6.283+si*0.7,k=j%2?1:0.55,x=cx+Math.cos(a)*r*k,y=cy+Math.sin(a)*r*k*0.62,pc=C[(j+si)%C.length];
        o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${j%3?1.8:2.4}" fill="${pp}" stroke="${pc}" stroke-width=".8"/>`;}
      const q=r>20?6:4.6;o+=`<circle cx="${cx}" cy="${cy}" r="${q}" fill="${pp}" stroke="${ink}" stroke-width="1.1"/><path d="M${cx-q-3} ${cy}h${2*q+6}M${cx} ${cy-q-3}v${2*q+6}" stroke="${ink}" stroke-width=".6" stroke-dasharray="${q+1} 1.2 1.6 1.2"/>`;});
    // dimension under the big system, leader note on the small one
    const q=32*Math.SQRT1_2;o+=`<circle cx="70" cy="60" r="32" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".6" stroke-dasharray="4 2"/>`;
    o+=`<g stroke="${ink}" stroke-width=".6" fill="none"><path d="M${70-q-3} ${60-q-3}L${70-q-9} ${60-q-9}H14M${70+q+3} ${60+q+3}l5 5"/></g><path d="M${70-q} ${60-q}l-3.8 -1.9 1.9 -1.9zM${70+q} ${60+q}l3.8 1.9 -1.9 1.9z" fill="${ink}"/>`;
    o+=`<text x="15" y="${60-q-11}" ${F} font-size="6" fill="${ink}" letter-spacing=".3">Ø 64 · N=9</text>`;
    o+=`<path d="M170 44L186 60h26" fill="none" stroke="${ink}" stroke-width=".6"/><circle cx="170" cy="44" r="1" fill="${ink}"/><text x="188" y="58" ${F} font-size="6" fill="${ink}" letter-spacing=".4">N=19</text>`;
    // title block
    o+=`<g stroke="#fff" stroke-opacity=".75" fill="none" stroke-width=".7"><rect x="166.5" y="104.5" width="64" height="24" fill="${pp}"/><path d="M166.5 116.5h64M198.5 116.5v12"/></g>`;
    o+=`<text x="170" y="112.6" ${F} font-size="5.4" fill="#fff" letter-spacing=".5">MONARCH ATLAS</text><text x="170" y="125" ${F} font-size="4.6" fill="#b6cbee">SCALE 1:1</text><text x="202" y="125" ${F} font-size="4.6" fill="#b6cbee">SHT 1/1</text>`;
    o+=`<path d="M12 ${H-12}h24" stroke="#fff" stroke-width="2.2" stroke-dasharray="6 6"/><rect x="12" y="${H-13.1}" width="24" height="2.2" fill="none" stroke="#fff" stroke-width=".5"/>`;
    return o+'</svg>';}
  const sys=[[74,64,24],[158,48,17],[128,102,13]],cols=pv.cols;
  o+=`<g stroke="${s.css.accent}" stroke-opacity=".45"><line x1="74" y1="64" x2="158" y2="48"/><line x1="74" y1="64" x2="128" y2="102"/><line x1="158" y1="48" x2="128" y2="102"/></g>`;
  sys.forEach(([cx,cy,r],si)=>{o+=`<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="${cols[si%cols.length]}" opacity=".14"/>`;
    for(let k=0;k<9;k++){const a=k/9*6.28+si,rr=r*(0.55+0.45*((k*7)%3)/2),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*0.7,c=cols[(k+si)%cols.length];
      o+=pv.wire?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="none" stroke="${c}" stroke-width=".8"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${c}"/>`;
      if(k%3===0)o+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-opacity=".35"/>`;}
    o+=`<circle cx="${cx}" cy="${cy}" r="4.2" fill="${pv.wire?s.css.accent:'#fff'}"/>`;});
  if(pv.rings)o+=`<g fill="none" stroke="${s.css.accent}"><circle cx="74" cy="64" r="30" stroke-dasharray="7 4" opacity=".8"/><circle cx="74" cy="64" r="36" stroke-dasharray="1 5" opacity=".55"/><circle cx="74" cy="64" r="42" stroke-dasharray="14 8" opacity=".35"/></g><g stroke="${s.css.accent}" opacity=".6"><path d="M6 6h14M6 6v14M234 6h-14M234 6v14M6 129h14M6 129v-14M234 129h-14M234 129v-14" fill="none" stroke-width="1.5"/></g>`;
  if(pv.butterfly)o+=`<text x="188" y="112" font-size="16">🦋</text><text x="40" y="118" font-size="11">🦋</text>`;
  if(pv.deep){const bf=(x,y,k,a)=>`<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})" stroke="#140c06" stroke-width=".9" stroke-linejoin="round"><path d="M0 0C-2-7-11-12-15-8C-17-4-11 0 0 0ZM0 0C2-7 11-12 15-8C17-4 11 0 0 0Z" fill="#ec8a1e"/><path d="M0 0C-1 3-7 9-10 6C-12 3-7 0 0 0ZM0 0C1 3 7 9 10 6C12 3 7 0 0 0Z" fill="#c9640f"/><path d="M0-3.5V5" stroke-width="1.6" stroke-linecap="round"/><g fill="#fff4e6" stroke="none"><circle cx="-13.2" cy="-8.4" r=".8"/><circle cx="13.2" cy="-8.4" r=".8"/><circle cx="-14.8" cy="-5.6" r=".6"/><circle cx="14.8" cy="-5.6" r=".6"/></g></g>`;
    o+=bf(192,106,0.95,-14)+bf(38,114,0.6,12);}
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
// matrix rain, 2D layer: a faint screen-space rain under the labels, in three depths (small, dim and slow far away; bigger,
// brighter and faster up close). Heads are near-white, trails are left behind and fade out. The 3D rain lives in the scene.
let rainTimer=null,rainResize=null;
function rain(on){const c=document.getElementById('fx-canvas');if(rainTimer){cancelAnimationFrame(rainTimer);rainTimer=null;}if(rainResize){window.removeEventListener('resize',rainResize);rainResize=null;}
  if(!on){c.width=c.height=1;return;}
  const x=c.getContext('2d'),G='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789Z:.=*+-<>|';
  let rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  const LAY=[{px:10,a:0.3,v:0.45,gap:2.4},{px:13,a:0.48,v:0.7,gap:4.5},{px:17,a:0.66,v:1.0,gap:11}];   // far → near
  let drops=[],dpr=1,last=0;
  const glyph=()=>G[Math.floor(Math.random()*G.length)];
  const size=()=>{dpr=Math.min(LITE?1:1.5,window.devicePixelRatio||1);   // a faint overlay: full retina resolution buys nothing
c.width=Math.ceil(innerWidth*dpr);c.height=Math.ceil(innerHeight*dpr);drops=[];
    const k=Math.max(0.62,Math.min(1,Math.sqrt(innerWidth/1100)));   // phones get smaller type, so the near layer doesn't shout
    (LITE?LAY.slice(1):LAY).forEach((L0,li)=>{const l={px:Math.round(L0.px*k),a:L0.a,v:L0.v},cw=l.px*1.1,n=Math.ceil(innerWidth/cw/L0.gap),rows=innerHeight/l.px;
      for(let i=0;i<n;i++)drops.push({l,li,x:(Math.floor(Math.random()*innerWidth/cw)+0.5)*cw,y:-Math.random()*rows*1.4,v:l.v*(0.7+Math.random()*0.6),row:-1,ch:''});});
    x.setTransform(dpr,0,0,dpr,0,0);x.textAlign='center';x.textBaseline='top';};
  const step=()=>{x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,.09)';x.fillRect(0,0,innerWidth,innerHeight);x.globalCompositeOperation='source-over';
    for(const d of drops){const l=d.l;d.y+=d.v;const row=Math.floor(d.y);if(row===d.row)continue;
      x.font=l.px+'px "MS Gothic","IPAGothic",monospace';
      if(d.row>=0){x.clearRect(d.x-l.px*0.6,d.row*l.px,l.px*1.2,l.px);x.fillStyle=`rgba(60,255,106,${l.a.toFixed(2)})`;x.fillText(d.ch,d.x,d.row*l.px);}   // the old head cools to green
      d.row=row;d.ch=glyph();if(row>=0){x.fillStyle=`rgba(225,255,232,${Math.min(1,l.a+0.2).toFixed(2)})`;x.fillText(d.ch,d.x,row*l.px);}
      if(row*l.px>innerHeight+l.px*4&&Math.random()<0.06){d.y=-Math.random()*8;d.row=-1;}}};
  size();rainResize=()=>{size();if(rm)for(let i=0;i<90;i++)step();};window.addEventListener('resize',rainResize);
  if(rm){for(let i=0;i<90;i++)step();return;}   // reduced motion: one still frame of rain
  for(let i=0;i<40;i++)step();
  const tick=t=>{rainTimer=requestAnimationFrame(tick);if(t-last<55)return;last=t;step();};rainTimer=requestAnimationFrame(tick);}
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
minBtn.addEventListener('click',()=>{panel.classList.toggle('min');const m=panel.classList.contains('min');minBtn.textContent=m?'+':'–';document.body.classList.toggle('panel-min',m);if(V3)V3.fitView(true);if(view!=='3d'&&network)network.fit({animation:{duration:520,easingFunction:'easeInOutCubic'}});});
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

window.V3=V3;
window.__atlasReady=true;
})();
