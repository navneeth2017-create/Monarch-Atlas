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
  .ico{display:inline-block;width:1.2em;height:1.2em;vertical-align:-.26em;margin-right:.35em;color:var(--accent);fill:currentColor;filter:drop-shadow(0 0 3px rgba(0,0,0,.6));flex:none}
  #ride-hint .ico,#idle-hint .ico{margin-right:.5em}
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
  #fx{position:absolute;inset:0;pointer-events:none;z-index:1;display:none}
  #fx .ck{position:absolute;width:26px;height:26px;border:2px solid var(--accent);opacity:.55} #fx .tl{left:14px;top:14px;border-right:0;border-bottom:0} #fx .tr{right:14px;top:14px;border-left:0;border-bottom:0} #fx .bl{left:14px;bottom:14px;border-right:0;border-top:0} #fx .br{right:14px;bottom:14px;border-left:0;border-top:0}
  body[data-skin="jarvis"] #fx{display:block}
  body[data-skin="jarvis"] #fx::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,10,14,.16) 0 1px,transparent 1px 3px)}
  body[data-skin="jarvis"] #fx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 115% 100% at 50% 46%,transparent 54%,rgba(0,20,28,.62) 100%)}
  body[data-skin="jarvis"] #fx .ck{width:34px;height:34px;border:1.5px solid var(--accent);opacity:.8;filter:drop-shadow(0 0 4px rgba(25,211,224,.75))}
  body[data-skin="jarvis"] #fx .tl{left:9px;top:9px;border-right:0;border-bottom:0} body[data-skin="jarvis"] #fx .tr{right:9px;top:9px;border-left:0;border-bottom:0} body[data-skin="jarvis"] #fx .bl{left:9px;bottom:9px;border-right:0;border-top:0} body[data-skin="jarvis"] #fx .br{right:9px;bottom:9px;border-left:0;border-top:0}
  body[data-skin="jarvis"] #fx .ck::after{content:"";position:absolute;width:4px;height:4px;background:#dffcff;box-shadow:0 0 6px var(--accent)} body[data-skin="jarvis"] #fx .tl::after{left:-2.5px;top:-2.5px} body[data-skin="jarvis"] #fx .tr::after{right:-2.5px;top:-2.5px} body[data-skin="jarvis"] #fx .bl::after{left:-2.5px;bottom:-2.5px} body[data-skin="jarvis"] #fx .br::after{right:-2.5px;bottom:-2.5px}
  body[data-skin="jarvis"] .lbl{font-size:10.5px;letter-spacing:.09em;color:var(--lbl);text-shadow:0 0 2px #00070a,0 0 3px #00070a,0 0 9px rgba(25,211,224,.5)}
  body[data-skin="jarvis"] .lbl.on:hover{color:#fff}
  body[data-skin="jarvis"] .lbl:not(.sun):not(.realm){padding:0 4px;color:#c6f7fb;background:rgba(2,14,20,.78);text-shadow:0 0 2px #00070a}
  body[data-skin="jarvis"] .lbl.sun{font-size:10.5px;font-weight:600;letter-spacing:.12em;color:var(--lbl-sun);padding:1px 8px 1px 7px;border-left:2px solid var(--accent);background:rgba(3,22,29,.9);box-shadow:0 0 10px rgba(0,8,12,.6);text-shadow:0 0 2px #00070a,0 0 6px rgba(25,211,224,.55)}
  body[data-skin="jarvis"] .lbl.sun::after{content:attr(data-an);margin-left:7px;padding:0 4px;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#ffcf7a;background:rgba(36,22,4,.95);border:1px solid rgba(242,184,90,.6);text-shadow:none}
  body[data-skin="jarvis"]:not([data-jv-focus]) .lbl.sun{translate:calc(50% + 11px) -13px}
  body[data-skin="jarvis"]:not([data-jv-focus]) .lbl.sun::before{content:"";position:absolute;right:100%;top:100%;width:13px;height:1px;background:var(--accent);opacity:.75;transform-origin:100% 0;transform:rotate(-45deg);margin-right:2px}
  body[data-skin="jarvis"] .lbl.realm{background:rgba(2,18,25,.92);border:1px solid rgba(25,211,224,.55);border-radius:0;box-shadow:0 0 14px rgba(25,211,224,.18)}
  body[data-skin="jarvis"] #brand{left:24px;top:19px} body[data-skin="jarvis"] #brand .mark{background:rgba(4,30,38,.6);border:1.5px solid var(--accent);border-radius:50%;color:#dffcff;font-size:14px;box-shadow:0 0 10px rgba(25,211,224,.55),inset 0 0 8px rgba(25,211,224,.4)}
  body[data-skin="jarvis"] #brand .name{letter-spacing:.14em;font-size:13px;text-shadow:0 0 10px rgba(25,211,224,.6)} body[data-skin="jarvis"] #brand .name small{letter-spacing:.12em;font-size:10px}
  body[data-skin="jarvis"] #stats{left:26px;bottom:15px;padding:2px 7px;background:rgba(1,10,14,.8);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-shadow:0 0 2px #00070a,0 0 3px #00070a,0 0 6px #00070a}
  body[data-skin="jarvis"] #settings,body[data-skin="jarvis"] #card{background:linear-gradient(180deg,rgba(5,28,36,.96),rgba(3,14,19,.96));border:1px solid rgba(25,211,224,.3);border-radius:2px;box-shadow:inset 0 1px 0 rgba(123,233,241,.45),0 0 26px rgba(25,211,224,.08),0 10px 30px rgba(0,0,0,.5);backdrop-filter:blur(6px)}
  body[data-skin="jarvis"] .bar b,body[data-skin="jarvis"] summary{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-2)}
  body[data-skin="jarvis"] details,body[data-skin="jarvis"] .bar{border-color:rgba(25,211,224,.16)} body[data-skin="jarvis"] summary::before{border-left-color:var(--accent)}
  body[data-skin="jarvis"] .seg,body[data-skin="jarvis"] .seg button,body[data-skin="jarvis"] input[type=search],body[data-skin="jarvis"] #skin-row button,body[data-skin="jarvis"] #card .act button{border-radius:2px}
  body[data-skin="jarvis"] input[type=search]{background:rgba(1,10,14,.75);border-color:rgba(25,211,224,.3)}
  body[data-skin="jarvis"] .tg{border-radius:2px;background:#0b3a45} body[data-skin="jarvis"] .tg::after{border-radius:1px;background:#bfeff4} body[data-skin="jarvis"] .tg:checked{background:var(--accent);box-shadow:0 0 8px rgba(25,211,224,.55)} body[data-skin="jarvis"] .tg:checked::after{background:#eaffff}
  body[data-skin="jarvis"] #tip,body[data-skin="jarvis"] #crumb,body[data-skin="jarvis"] #idle-hint,body[data-skin="jarvis"] #ride-hint{background:rgba(3,20,27,.95);border:1px solid rgba(25,211,224,.45);border-radius:2px;box-shadow:0 0 18px rgba(25,211,224,.14);letter-spacing:.04em}
  body[data-skin="jarvis"] #crumb button{border-radius:2px}
  #jv-hud{display:none;position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden;font:10.5px/1.55 var(--mono);color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
  body[data-skin="jarvis"][data-view="3d"] #jv-hud{display:block}
  /* the readout: four rows and a thin bar strip, sized to the viewer (the ResizeObserver in jvHudDom sets data-fit and --jv-k
     on #jv-hud); in a short or narrow viewer it folds to a one-line pill that opens on click */
  #jv-ro{position:absolute;left:14px;top:62px;width:172px;box-sizing:border-box;padding:6px 10px 7px;font-size:11px;line-height:1.38;letter-spacing:.08em;border:1px solid rgba(25,211,224,.28);background:linear-gradient(180deg,rgba(4,26,34,.97),rgba(2,12,17,.96));clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px));transform-origin:0 0;transform:scale(var(--jv-k,1))}
  #jv-ro::before,#jv-ro::after{content:"";position:absolute;width:13px;height:1px;background:rgba(25,211,224,.55);transform:rotate(45deg)} #jv-ro::before{right:-2px;top:4px} #jv-ro::after{left:-2px;bottom:4px}
  #jv-ro .h{display:flex;justify-content:space-between;align-items:center;gap:8px;color:var(--accent);font-weight:700;letter-spacing:.12em;padding-bottom:3px;margin-bottom:2px;border-bottom:1px solid rgba(25,211,224,.2);white-space:nowrap} #jv-ro .h i{font-style:normal;font-weight:400;color:#f2b85a;animation:jv-blink 1.8s steps(2) infinite}
  #jv-ro .h em{display:none;font-style:normal;font-weight:500;color:#dffcff;overflow:hidden;text-overflow:ellipsis;max-width:190px}
  #jv-ro .r{display:flex;justify-content:space-between;gap:10px} #jv-ro .r b{color:#dffcff;font-weight:500;max-width:104px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #jv-ro .bars{display:flex;align-items:flex-end;gap:1.5px;height:11px;margin-top:5px;border-bottom:1px solid rgba(25,211,224,.3)} #jv-ro .bars i{flex:1;max-width:8px;background:linear-gradient(0deg,rgba(25,211,224,.25),rgba(25,211,224,.85))} #jv-ro .bars i.on{background:#dffcff;box-shadow:0 0 6px var(--accent)}
  #jv-ro.pill{width:auto;max-width:260px;padding:4px 10px;pointer-events:auto;cursor:pointer;clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))}
  #jv-ro.pill::before{top:2.5px;width:10px} #jv-ro.pill::after{bottom:2.5px;width:10px}
  #jv-ro.pill .h{border:0;padding:0;margin:0;justify-content:flex-start} #jv-ro.pill .h span{display:none} #jv-ro.pill .h em{display:block} #jv-ro.pill .h i{order:-1}
  #jv-ro.pill .h::after{content:"▾";color:var(--accent-2);font-weight:400} #jv-ro.pill.open .h::after{content:"▴"}
  #jv-ro.pill:not(.open) .r,#jv-ro.pill:not(.open) .bars{display:none} #jv-ro.pill.open{width:172px} #jv-ro.pill.open .h{margin-bottom:3px;padding-bottom:3px;border-bottom:1px solid rgba(25,211,224,.2)} #jv-ro.pill.open .h em{display:none} #jv-ro.pill.open .h span{display:inline}
  #jv-tape{position:absolute;left:50%;top:12px;width:380px;height:44px;transform:translateX(-50%) scale(var(--jv-k,1));transform-origin:50% 0;overflow:hidden;background:linear-gradient(180deg,rgba(1,10,14,.94),rgba(1,10,14,.88));-webkit-mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);transition:top .3s}
  #jv-tape svg{position:absolute;left:0;top:0;will-change:transform} #jv-tape line{stroke:var(--accent);stroke-opacity:.9} #jv-tape line.mn{stroke-opacity:.4} #jv-tape text{fill:var(--accent-2);font:9px var(--mono);text-anchor:middle;letter-spacing:.05em}
  #jv-tape::before{content:"";position:absolute;left:50%;top:10px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid #dffcff;transform:translateX(-50%);filter:drop-shadow(0 0 3px var(--accent))}
  #jv-tape b{position:absolute;left:50%;top:28px;transform:translateX(-50%);font-weight:500;font-size:10px;color:#dffcff;padding:0 6px;border:1px solid rgba(25,211,224,.4);background:rgba(2,16,22,.97);white-space:nowrap}
  #crumb.on~#jv-hud #jv-tape{top:56px}
  #jv-map{position:absolute;right:340px;bottom:58px;width:120px;height:120px;transform:scale(var(--jv-k,1));transform-origin:100% 100%;transition:right .5s cubic-bezier(.2,.7,.2,1)}
  #jv-map svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible} #jv-map circle{fill:none;stroke:rgba(25,211,224,.28)} #jv-map circle.o{stroke:rgba(25,211,224,.6);fill:rgba(1,12,17,.94)} #jv-map path.x{stroke:rgba(25,211,224,.18)}
  #jv-map #jv-blips circle{fill:rgba(123,233,241,.55);stroke:none} #jv-map #jv-blips circle.on{fill:#fff;filter:drop-shadow(0 0 3px var(--accent))} #jv-fov path{fill:rgba(123,233,241,.12);stroke:rgba(123,233,241,.5);stroke-width:.6}
  #jv-map .sweep{position:absolute;inset:4px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0deg,transparent 290deg,rgba(25,211,224,.32) 360deg);animation:jv-spin 9s linear infinite}
  #jv-map .cap{position:absolute;top:100%;left:50%;transform:translateX(-50%);white-space:nowrap;padding:0 6px;font-size:8.5px;letter-spacing:.2em;margin-top:5px;color:var(--muted);background:rgba(1,10,14,.92)}
  .jv-arc{position:absolute;top:50%;margin-top:-160px;width:70px;height:320px;opacity:.8} .jv-arc.l{left:6px} .jv-arc.r{right:320px;transition:right .5s cubic-bezier(.2,.7,.2,1)}
  .jv-arc path.bk{fill:none;stroke:rgba(25,211,224,.55)} .jv-arc line{stroke:var(--accent);stroke-opacity:.75} .jv-arc line.mn{stroke-opacity:.35} .jv-arc text{fill:var(--accent-2);font:9px var(--mono);letter-spacing:.1em;paint-order:stroke;stroke:#01080c;stroke-width:3px;stroke-linejoin:round} .jv-arc text.tt{text-anchor:middle;fill:var(--faint)}
  .jv-arc .pt path{fill:#dffcff;filter:drop-shadow(0 0 3px var(--accent))} .jv-arc .pt text{fill:#dffcff;font-size:9.5px}
  #jv-lock{position:absolute;left:0;top:0;width:40px;height:40px;display:none;will-change:transform;z-index:1}
  #jv-lock.on{display:block} #jv-lock i{position:absolute;width:11px;height:11px;border:2px solid #effeff;filter:drop-shadow(0 0 3px var(--accent)) drop-shadow(0 0 1px #000);animation:jv-lockin .38s cubic-bezier(.2,.8,.2,1) both}
  #jv-lock i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0} #jv-lock i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0} #jv-lock i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0} #jv-lock i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
  #jv-lock span{position:absolute;left:calc(100% + 6px);bottom:calc(100% + 2px);white-space:nowrap;padding:3px 9px 3px 8px;background:rgba(2,18,24,.94);border:1px solid rgba(25,211,224,.45);border-left:2px solid var(--accent);color:#effeff;font-size:10.5px;font-weight:600;box-shadow:0 0 12px rgba(25,211,224,.25)} #jv-lock span small{display:block;color:var(--accent-2);font-size:9px;font-weight:400;letter-spacing:.08em}
  @keyframes jv-spin{to{transform:rotate(360deg)}} @keyframes jv-blink{50%{opacity:.55}} @keyframes jv-lockin{from{transform:scale(2.4);opacity:0}}
  @media (min-width:721px){#jv-tape{left:calc((100vw - 314px)/2);transition:left .5s cubic-bezier(.2,.7,.2,1),top .3s} body.panel-min #jv-tape{left:50%} body.panel-min #jv-map{right:26px} body.panel-min .jv-arc.r{right:6px}}
  #jv-hud[data-fit="md"] .jv-arc{display:none}
  #jv-hud[data-fit="sm"] #jv-ro{left:10px;top:auto;bottom:58px;font-size:10px} #jv-hud[data-fit="sm"] #jv-tape,#jv-hud[data-fit="sm"] #jv-map,#jv-hud[data-fit="sm"] .jv-arc{display:none}
  @media (max-width:720px){body[data-skin="jarvis"] #fx .ck{width:22px;height:22px} body[data-skin="jarvis"] #brand{left:16px;top:14px}}
  @media (prefers-reduced-motion:reduce){#jv-map .sweep,#jv-ro .h i,#jv-lock i{animation:none}}
  body[data-skin="jarvis"] .lbl{font-family:var(--mono);text-transform:uppercase;letter-spacing:.07em}
  body[data-skin="jarvis"] .lbl.realm{border-color:var(--accent);background:rgba(0,0,0,.55);border-radius:3px}
  body[data-skin="jarvis"] #brand .name{font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase}
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
  body[data-skin="synthwave"] #fx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 58%,rgba(24,0,48,.5) 100%)}   /* no scanline overlay: it read as low resolution */
  /* hover cards and hints wear the skin too: its type, colours, backplate and border */
  body[data-skin="monarch"] #tip b{color:#fff4e6;letter-spacing:.01em} body[data-skin="monarch"] #tip span{color:#b9b3ad}
  body[data-skin="monarch"] #idle-hint,body[data-skin="monarch"] #ride-hint{background:rgba(24,23,29,.9);border-color:rgba(255,196,138,.34);color:#ece6df;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
  body[data-skin="monarch"] #ride-hint kbd{border-color:rgba(255,196,138,.3);background:rgba(255,196,138,.07)}
  body[data-skin="jarvis"] #tip{font-size:11px;letter-spacing:.06em;text-transform:uppercase;border-left:2px solid var(--accent);padding:5px 10px 6px 9px}
  body[data-skin="jarvis"] #tip b{color:#effeff;font-weight:700;letter-spacing:.12em;text-shadow:0 0 8px rgba(25,211,224,.55)} body[data-skin="jarvis"] #tip span{color:var(--accent-2);font-size:10px}
  body[data-skin="jarvis"] #idle-hint,body[data-skin="jarvis"] #ride-hint{font-size:11px;text-transform:uppercase;color:#c8f4f8} body[data-skin="jarvis"] #ride-hint kbd{border-radius:1px;border-color:rgba(25,211,224,.45);color:#effeff}
  body[data-skin="synthwave"] #tip,body[data-skin="synthwave"] #idle-hint,body[data-skin="synthwave"] #ride-hint,body[data-skin="synthwave"] #crumb{border:1px solid rgba(255,63,208,.55);box-shadow:0 0 16px rgba(255,63,208,.28),0 8px 24px rgba(20,0,40,.6)}
  body[data-skin="synthwave"] #tip{background:linear-gradient(180deg,rgba(44,14,84,.95),rgba(26,8,56,.95));border-radius:4px}
  body[data-skin="synthwave"] #tip b{font-style:italic;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#fff;text-shadow:0 0 8px rgba(255,63,208,.8),0 2px 0 #3a0b52} body[data-skin="synthwave"] #tip span{color:#e2c4ff}
  body[data-skin="synthwave"] #idle-hint,body[data-skin="synthwave"] #ride-hint{color:#f6ecff;font-style:italic} body[data-skin="synthwave"] #ride-hint kbd{font-style:normal;border-color:rgba(255,63,208,.5);background:rgba(255,63,208,.12)}
  /* TRON: the Grid. Black glass, thin glowing cyan edges, cut corners, tracked-out geometric caps */
  body[data-skin="tron"]{--tron-edge:rgba(0,229,255,.55);--tron-glow:rgba(0,229,255,.28)}
  body[data-skin="tron"] #fx{display:block} body[data-skin="tron"] #fx .ck{display:none}
  body[data-skin="tron"] #fx::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 125% 105% at 50% 48%,transparent 58%,rgba(0,0,0,.6) 100%)}
  body[data-skin="tron"] .lbl{letter-spacing:.05em;color:var(--lbl);text-shadow:0 0 2px #000,0 0 3px #000,0 0 10px rgba(0,229,255,.35)}
  body[data-skin="tron"] .lbl:not(.sun):not(.realm){padding:0 5px;background:rgba(0,4,6,.7);box-shadow:inset 1px 0 0 var(--tron-edge)}
  body[data-skin="tron"] .lbl.sun{font-size:10.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#fff;padding:2px 9px 2px 10px;background:rgba(0,6,9,.86);border:1px solid var(--sys,var(--accent));box-shadow:0 0 10px var(--tron-glow),inset 0 0 6px rgba(0,229,255,.12);text-shadow:0 0 6px rgba(0,229,255,.6);clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))}
  body[data-skin="tron"] .lbl.sun.on:hover{background:rgba(0,30,38,.92)}
  body[data-skin="tron"] .lbl.realm{border-radius:0;background:rgba(0,6,9,.8);border-color:var(--tron-edge);letter-spacing:.24em}
  body[data-skin="tron"] #brand .mark{background:#000;border:1.5px solid var(--accent);border-radius:50%;box-shadow:0 0 10px rgba(0,229,255,.6),inset 0 0 8px rgba(0,229,255,.35);color:var(--accent)}
  body[data-skin="tron"] #brand .mark .ico{margin:0;width:18px;height:18px}
  body[data-skin="tron"] #brand .name{font-weight:600;font-size:13px;letter-spacing:.26em;text-transform:uppercase;color:#effeff;text-shadow:0 0 10px rgba(0,229,255,.7)} body[data-skin="tron"] #brand .name small{letter-spacing:.16em;font-size:10px;text-shadow:0 1px 3px #000}
  body[data-skin="tron"] #stats{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-shadow:0 0 2px #000,0 0 4px #000}
  body[data-skin="tron"] #settings,body[data-skin="tron"] #card,body[data-skin="tron"] #skins .box{background:linear-gradient(180deg,rgba(0,12,16,.95),rgba(0,4,6,.95));border:1px solid var(--tron-edge);border-radius:0;box-shadow:0 0 18px var(--tron-glow),inset 0 0 22px rgba(0,229,255,.06),0 12px 34px rgba(0,0,0,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  body[data-skin="tron"] .bar b,body[data-skin="tron"] summary{font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--accent-2)}
  body[data-skin="tron"] details,body[data-skin="tron"] .bar{border-color:rgba(0,229,255,.18)} body[data-skin="tron"] summary::before{border-left-color:var(--accent)}
  body[data-skin="tron"] .seg,body[data-skin="tron"] .seg button,body[data-skin="tron"] input[type=search],body[data-skin="tron"] #skin-row button,body[data-skin="tron"] #card .act button,body[data-skin="tron"] #crumb button,body[data-skin="tron"] .skin,body[data-skin="tron"] .skin .chips i{border-radius:0}
  body[data-skin="tron"] .seg{border-color:var(--tron-edge)} body[data-skin="tron"] .seg button.on{background:var(--accent);color:#001014;box-shadow:0 0 10px rgba(0,229,255,.6)}
  body[data-skin="tron"] input[type=search]{background:rgba(0,0,0,.8);border-color:rgba(0,229,255,.35)} body[data-skin="tron"] input[type=search]:focus{box-shadow:0 0 8px var(--tron-glow)}
  body[data-skin="tron"] .tg{border-radius:1px;background:#031c22;box-shadow:inset 0 0 0 1px rgba(0,229,255,.3)} body[data-skin="tron"] .tg::after{border-radius:0;background:#6fbfcb}
  body[data-skin="tron"] .tg:checked{background:rgba(0,229,255,.28);box-shadow:inset 0 0 0 1px var(--accent),0 0 8px rgba(0,229,255,.5)} body[data-skin="tron"] .tg:checked::after{background:#eaffff;box-shadow:0 0 6px var(--accent)}
  body[data-skin="tron"] #tip,body[data-skin="tron"] #crumb,body[data-skin="tron"] #idle-hint,body[data-skin="tron"] #ride-hint{background:rgba(0,5,8,.94);border:1px solid var(--tron-edge);border-radius:0;box-shadow:0 0 14px var(--tron-glow),inset 0 0 10px rgba(0,229,255,.08);letter-spacing:.05em}
  body[data-skin="tron"] #tip{clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));padding:6px 11px}
  body[data-skin="tron"] #tip b{font-weight:600;font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:#effeff;text-shadow:0 0 8px rgba(0,229,255,.7)} body[data-skin="tron"] #tip span{color:var(--accent-2);font-size:11px}
  body[data-skin="tron"] #idle-hint,body[data-skin="tron"] #ride-hint{color:#dcfbff;text-transform:uppercase;font-size:11.5px;letter-spacing:.1em} body[data-skin="tron"] #ride-hint kbd{border-radius:0;border-color:var(--tron-edge);color:#effeff;box-shadow:0 0 6px rgba(0,229,255,.25)}
  body[data-skin="tron"] #ride-hint button{border-radius:0;border-color:var(--tron-edge)}
  body[data-skin="tron"] .skin.on{box-shadow:0 0 0 1px var(--accent),0 0 16px var(--tron-glow)}
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
  @media (max-width:720px){#settings{width:min(300px,calc(100vw - 28px))} #card{width:calc(100vw - 28px)} #ride-hint{left:14px;right:14px;transform:none;max-width:none;bottom:58px}}
`;
const ATLAS_MARKUP=`
<div id="graph3d" role="application" aria-label="Knowledge graph, 3D"></div>
<div id="graph" role="application" aria-label="Knowledge graph, 2D"></div>
<div id="fx"><i class="ck tl"></i><i class="ck tr"></i><i class="ck bl"></i><i class="ck br"></i></div>
<div id="labels"></div>
<div id="tip"></div>
<div id="brand"><div class="mark" id="brand-mark">🦋</div><div class="name">Monarch Atlas<small>${_e(ATLAS.title)}</small></div></div>
<div id="crumb"><i id="crumb-dot"></i><span id="crumb-name"></span><button id="crumb-back">‹ Back to galaxy</button></div>
<div id="idle-hint"></div>
<div id="ride-hint"><!--ico--><kbd>← →</kbd><kbd>A D</kbd> turn &nbsp; <kbd>↑ ↓</kbd><kbd>W S</kbd> climb / dive &nbsp; <kbd>Shift</kbd> boost &nbsp; <kbd>Space</kbd> hover &nbsp; <kbd>Q</kbd><kbd>E</kbd> barrel roll &nbsp; <kbd>F</kbd> loop &nbsp; <kbd>G</kbd> dive loop &nbsp; <kbd>X</kbd> spin<button id="ride-off">Esc · hop off</button></div>
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
    <label class="row only-3d"><span><span id="walkers-t">Kinesins</span><span class="sub" id="walkers-s">Tiny carriers walking data along some links — zoom in to watch them, click one to walk it</span></span><input class="tg" type="checkbox" id="walkers" checked></label>
    <div class="rng"><div class="top"><span>Node size</span><span id="nsize-v">1.0</span></div><input type="range" id="nsize" min="0.4" max="2.5" step="0.1" value="1"></div>
    <div class="rng"><div class="top"><span class="only-3d">Link brightness</span><span class="only-2d">Link thickness</span><span id="lw-v">1.0</span></div><input type="range" id="lw" min="0.2" max="2.5" step="0.1" value="1"></div>
  </div></details>
  <details class="only-3d"><summary>Motion</summary><div class="body">
    <label class="row"><span>Auto-rotate<span class="sub">Slow orbit around the galaxy</span></span><input class="tg" type="checkbox" id="rotate" checked></label>
    <label class="row"><span>Idle tour<span class="sub" id="idle-s">Left alone for 10 s, the camera rides a monarch or watches a kinesin work</span></span><input class="tg" type="checkbox" id="idle" checked></label>
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
// inline icons (never emoji): they take the skin's accent through currentColor
const ico=inner=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const ICO={
  butterfly:ico('<path d="M11.3 10.6C9.6 6.4 5.6 3.2 2.9 3.9C1.1 4.4 1.3 7.2 2.6 9.1C3.9 11 7.3 12 11.3 11.6ZM12.7 10.6C14.4 6.4 18.4 3.2 21.1 3.9C22.9 4.4 22.7 7.2 21.4 9.1C20.1 11 16.7 12 12.7 11.6Z"/>'
    +'<path opacity=".82" d="M11.3 12.6C8.4 12.7 5.2 13.8 4.6 16.4C4.1 18.7 6.2 20.3 8.2 19.1C9.9 18.1 11 15.2 11.3 12.6ZM12.7 12.6C15.6 12.7 18.8 13.8 19.4 16.4C19.9 18.7 17.8 20.3 15.8 19.1C14.1 18.1 13 15.2 12.7 12.6Z"/>'
    +'<path d="M10.9 11C8.2 9.1 5.4 6.6 3.6 5.2M10.9 12.9C8.6 14.2 6.8 16.1 6.2 18.2M13.1 11C15.8 9.1 18.6 6.6 20.4 5.2M13.1 12.9C15.4 14.2 17.2 16.1 17.8 18.2" fill="none" stroke="rgba(0,0,0,.42)" stroke-width=".7"/>'
    +'<rect x="11.35" y="8.3" width="1.3" height="10" rx=".65"/><path d="M11.7 8.5C11.2 6.6 10.2 5.4 9.1 4.9M12.3 8.5C12.8 6.6 13.8 5.4 14.9 4.9" fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round"/>'),
  kinesin:ico('<circle cx="8" cy="19" r="2.6"/><circle cx="16" cy="19" r="2.6"/><path d="M8 17L12 12L16 17M12 12V8.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2.4L15.6 6L12 9.6L8.4 6Z"/>'),
  cycle:ico('<circle cx="6" cy="15.6" r="3.9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18.4" cy="15.6" r="3.9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M1.4 13.4C2 10.6 4.2 9.1 7.2 9.3L10.9 11L14.3 8.9C17.6 8.4 21.4 9.4 22.9 12.9H20.6C18.8 11.4 15.8 11.5 13.9 12.8L9.7 13.8L4.8 11.7C3.5 11.9 2.4 12.5 1.4 13.4Z"/>'),
  disc:ico('<circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="5.7" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="4.3 1.6"/><circle cx="12" cy="12" r="2.3"/>'),
};
// TRON node bodies: identity discs. A sphere is shaded by its screen-space radius (r = √(1 − (n·v)²)), so from any angle
// it reads as a disc: dark tinted glass, a white-hot rim, a thin inner ring and a glowing core in the group's neon colour.
// Suns get a bigger white core and a segmented outer ring that turns (uT, advanced by the tron extras).
function tronBodyMat(emis){
  return new THREE.ShaderMaterial({uniforms:{uSun:{value:emis?1:0},uT:{value:0},uFog:{value:0.00022}},extensions:{derivatives:true},
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
    fragmentShader:`uniform float uSun,uT,uFog;varying vec3 vN,vV,vC;varying float vD;
float ring(float r,float c,float w,float aa){return 1.0-smoothstep(w,w+aa,abs(r-c));}
void main(){vec3 n=normalize(vN);float ndv=clamp(dot(n,normalize(vV)),0.0,1.0),r=sqrt(max(0.0,1.0-ndv*ndv));float aa=max(fwidth(r)*1.2,0.02);
  vec3 hot=mix(vC,vec3(1.0),0.55);
  vec3 c=vC*0.13+vC*smoothstep(0.45,0.95,r)*0.28;
  c+=vC*ring(r,0.64,0.028,aa)*0.95;
  if(uSun>0.5){float a=atan(n.y,n.x)/6.2831853;float seg=step(0.28,fract(a*6.0+uT*0.08));
    c+=hot*ring(r,0.8,0.035,aa)*seg*1.1;c=mix(c,vec3(1.0,0.99,0.96),1.0-smoothstep(0.26,0.36+aa,r));c=mix(c,hot,(1.0-smoothstep(0.36,0.46+aa,r))*step(0.26,r)*0.8);}
  else c=mix(c,hot,(1.0-smoothstep(0.2,0.29+aa,r))*0.9);
  c=mix(c,hot*1.15,smoothstep(0.86-aa,0.88+aa,r));
  gl_FragColor=vec4(c*exp(-uFog*uFog*vD*vD),1.0);}`});
}
// Every skin is the same 3D universe — solar systems in galaxies — dressed differently:
// colours, sky, node style, link glow, and a few props of its own (HUD rings, a neon grid, light cycles).
const SKINS={
  monarch:{name:'Monarch',mark:'🦋',tag:'Deep night sky, warm suns, soft nebulae, butterflies on the wing.',
    css:{bg:'#16161b','bg-2':'#1d1d23','bg-3':'#28282f',border:'#33333b','border-2':'#46464f',text:'#ececf1',muted:'#a0a0ab',faint:'#6d6d78',accent:'#F0923F','accent-2':'#FFC48A',sky:'#08080d',lbl:'#d9d9e0','lbl-sun':'#fff4e6',halo:'#07070c'},
    // stars:[] — the monarch extras draw their own colour-temperature, twinkling star field (and the sky dome, nebulae, coronas)
    sky:0x08080d,fog:0.00034,rim:0xF0923F,ambient:0.55,stars:[],nebula:0,fade:0x0a0a10,line:0.46,sunEmissive:0x6a6a6a,wire:false,monarchs:true,extras:'monarch',tint:{color:0xffe4c8,k:0.06},
    deep:{bot:'#040407',mid:'#08080e',top:'#0d0e1c',band:'#7468a0',warm:'#b87a48',cool:'#23406e',wash:0.09,bandK:0.1,stars:[[4200,1.25,0.5],[640,2.0,0.8],[70,3.1,1.0]],twinkle:0.4,dust:0.6,amb:0.34,rim:'#FFB070',rimK:0.6,corona:'#ffe2b8'},
    wings:{base:'#b24e0b',mid:'#e2761a',tip:'#f7a03c',vein:'rgba(16,8,3,.96)',margin:'#0d0a08',spot:'rgba(255,249,238,.97)',glow:'rgba(255,200,128,.92)',shade:'rgba(52,18,4,.6)',body:0x120e0b},kin:{head:0xe6e8f2,headEm:0x2a3350,stalk:0xc4c9da},
    pv:{deep:true,cols:['#6ea8ff','#ff8a5b','#7ed957','#ffd166','#c77dff']},
    features:['Solar-system galaxies','Lit planets face their sun','Nebulae & milky-way sky','Twinkling starfield','Ride a butterfly','Walk a kinesin','Idle tour']},
  jarvis:{name:'JARVIS',mark:'◎',tag:'Holographic tactical display. Hologram nodes in their group colours, targeting rings, radar sweep, live readouts.',
    css:{bg:'#04141a','bg-2':'#061c24','bg-3':'#0a2a34',border:'#0f3d4a','border-2':'#155566',text:'#c8f4f8',muted:'#6fbfca',faint:'#3f8e99',accent:'#19d3e0','accent-2':'#7be9f1',sky:'#01080c',lbl:'#8fe6ee','lbl-sun':'#dffcff',halo:'#001318',font:'var(--mono)'},
    sky:0x01080c,fog:0.00030,rim:0x19d3e0,ambient:1.0,stars:[[1400,1.4,0x3fe0ec,0.3],[160,2.4,0xbffbff,0.55]],nebula:0.05,fade:0x03202a,line:0.72,sunEmissive:0x19d3e0,wire:false,monarchs:true,extras:'hud',tint:{color:0x19d3e0,k:0.1},
    holo:{rim:0xe2fdff,pow:2.2,mix:0.55,scan:0.9,ring:0x5fe8f2,lineGain:1.7},
    wings:{base:'#067a88',mid:'#12b7c6',tip:'#7ff0f8',vein:'rgba(2,20,26,.95)',margin:'#03242b',spot:'rgba(230,255,255,.95)',glow:'rgba(180,255,255,.9)',shade:'rgba(0,30,40,.55)',body:0x03242b},kin:{head:0x9ff5fb,headEm:0x0a6b75,stalk:0x5fd6e2},
    pv:{holo:true},
    features:['Hologram nodes in group colours','Ring stacks & orbit guides','Radar table & lock-on','Live telemetry HUD','Data packets on links']},
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
  tron:{name:'TRON',mark:'◎',icon:ICO.disc,tag:'The Grid. A black void over a glowing light-grid floor, identity-disc nodes, light-trail links, and light cycles racing their light walls.',
    css:{bg:'#010507','bg-2':'#020b0f','bg-3':'#061a22',border:'#0b3a47','border-2':'#0f5566',text:'#dcfbff',muted:'#7fcfdc',faint:'#468f9b',accent:'#00e5ff','accent-2':'#8ff4ff',sky:'#000000',lbl:'#c8f7ff','lbl-sun':'#ffffff',halo:'#000000',
      font:'"Avenir Next","Futura","Century Gothic","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'},
    // neon: every group colour is pushed to full saturation (it keeps its hue, so the legend still matches)
    sky:0x000000,fog:0.00022,rim:0x00e5ff,ambient:0.8,stars:[],nebula:0.035,fade:0x010507,line:0.62,sunEmissive:0x00e5ff,wire:false,monarchs:true,extras:'tron',neon:true,cycles:true,
    body:emis=>tronBodyMat(emis),
    wings:{base:'#00596a',mid:'#00a9c2',tip:'#48ecff',vein:'rgba(0,16,22,.85)',margin:'#063a44',spot:'rgba(225,255,255,.98)',glow:'rgba(200,255,255,.95)',shade:'rgba(0,10,14,.5)',body:0x00202a},kin:{head:0x9ff5fb,headEm:0x0a6b75,stalk:0x5fd6e2},
    pv:{tron:true},
    features:['Light-grid floor','Light cycles & light walls','Identity-disc nodes','Light-trail links','Ride a light cycle']},
};
// retired skins: a saved or linked "matrix" becomes Tron, its successor; any other unknown name (e.g. the old "blueprint") is the default
const SKIN_ALIAS={matrix:'tron'};
const skinOf=k=>{k=String(k==null?'':k).trim().toLowerCase();k=SKIN_ALIAS[k]||k;return Object.prototype.hasOwnProperty.call(SKINS,k)?k:null;};
const DEFAULT_SKIN=skinOf(window.__ATLAS_SKIN__)||'monarch';
let skinKey=DEFAULT_SKIN;try{skinKey=skinOf(new URLSearchParams(location.search).get('skin'))||skinOf(localStorage.getItem('atlas.skin'))||DEFAULT_SKIN;}catch(e){}
let SKIN=SKINS[skinKey];
const state={labels:true,monarchs:true,walkers:true,idle:true,nsize:1,lw:1,inferred:true,hidden:new Set(),rotate:true,speed:0.5,spacing:1,live:false,repel:2600,center:0.35,dist:80};
const edgeVisible=e=>state.inferred||e.confidence==='EXTRACTED';
const nodeVisible=id=>!state.hidden.has(base[id].community);

// ══════════════════════════════════════════ 3D — galaxy of solar systems ══
// LITE: the cheap path for phones and weak devices. Skins with heavy extras (monarch, synthwave, tron)
// draw fewer stars / rain columns, bake smaller textures and skip their biggest overdraw layers. The graph itself is
// identical. ?lite=1 or ?lite=0 forces it either way.
const LITE=(()=>{try{const q=new URLSearchParams(location.search).get('lite');if(q==='1')return true;if(q==='0')return false;}catch(e){}
  // judged by the device's screen, not the window: an Atlas embedded in a short iframe on a desktop is not a phone
  const scr=Math.min((window.screen&&screen.width)||1e4,(window.screen&&screen.height)||1e4);
  const small=scr<560,weak=(navigator.deviceMemory||8)<=2||(navigator.hardwareConcurrency||8)<=2;
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
  const _nh={h:0,s:0,l:0};
  const skinCol=(c,hex)=>{c.set(hex);if(SKIN.tint)c.lerp(_tc.set(SKIN.tint.color),SKIN.tint.k);
    if(SKIN.neon){c.getHSL(_nh);if(_nh.s<0.12)c.setHSL(0.52,0.35,0.74);else c.setHSL(_nh.h,Math.min(1,0.78+_nh.s*0.3),Math.min(0.62,Math.max(0.5,_nh.l)));}   // neon: same hue, full saturation
    return c;};
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
    if(mh!==hoverM){hoverM=mh;if(hoverM){setHover(null);renderer.domElement.style.cursor='pointer';tip.innerHTML=`<b>${ICO.butterfly}Monarch</b><span>click to ride it · steer with the arrow keys or WASD</span>`;tip.style.display='block';}else{tip.style.display='none';renderer.domElement.style.cursor='';}}
    if(hoverM)return;
    // a kinesin under the pointer (only the visible, zoomed-in ones can be hit)
    let wh=null;if(walkerGroup.visible&&!mh){const h=ray.intersectObject(walkerGroup,true)[0];if(h&&(!hits[0]||h.distance<hits[0].distance)){let o=h.object;while(o&&o.parent!==walkerGroup)o=o.parent;wh=walkers.find(w=>w.g===o)||null;if(wh===walk)wh=null;}}
    if(wh!==hoverW){hoverW=wh;if(hoverW){setHover(null);renderer.domElement.style.cursor='pointer';tip.innerHTML=SKIN.cycles?`<b>${ICO.cycle}Light cycle</b><span>click to ride it · arrows or WASD pick the turns</span>`:`<b>${ICO.kinesin}Kinesin</b><span>click to take it for a walk · arrows or WASD steer</span>`;tip.style.display='block';}else if(!hoverM){tip.style.display='none';renderer.domElement.style.cursor='';}}
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
    const W=window.innerWidth,H=window.innerHeight,cam=camera.position,taken=JV&&jvDom?jvDom.box.slice():[],ppu=pxPer();
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
  // ── light cycles (TRON): a bike and its light wall, shared by the riders on the floor grid and the ones on the links ──
  // A bike is two meshes on shared geometry, unit length along +x, wheels on z=0, up +z: a dark glass shell (the extruded
  // Tron: Legacy side profile, the rider tucked into it, dark wheel discs) and one glow mesh in the bike's colour (two big
  // wheel rings, a light line down each flank, nose and tail lights), plus a soft glow sprite so a far-off bike still reads.
  let CYC=null;
  function mergeGeo(list){let n=0;const parts=list.map(g=>{const q=g.index?g.toNonIndexed():g;n+=q.attributes.position.count;return q;});
    const P=new Float32Array(n*3);let o=0;parts.forEach(q=>{P.set(q.attributes.position.array,o);o+=q.attributes.position.array.length;});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));return g;}
  function cycleGeo(){
    if(CYC)return CYC;
    const sh=new THREE.Shape();sh.moveTo(-0.47,0.1);sh.lineTo(-0.53,0.2);sh.quadraticCurveTo(-0.46,0.35,-0.25,0.345);sh.lineTo(-0.09,0.265);
    sh.quadraticCurveTo(0.06,0.24,0.2,0.305);sh.quadraticCurveTo(0.43,0.345,0.53,0.17);sh.lineTo(0.47,0.1);sh.lineTo(-0.47,0.1);
    const shell=new THREE.ExtrudeGeometry(sh,{depth:0.09,bevelEnabled:false,curveSegments:5});shell.translate(0,0,-0.045);shell.rotateX(Math.PI/2);
    const torso=new THREE.BoxGeometry(0.2,0.07,0.055);torso.rotateY(0.32);torso.translate(-0.05,0,0.3);
    const helmet=new THREE.SphereGeometry(0.045,8,6);helmet.scale(1.3,1,0.9);helmet.translate(0.075,0,0.325);
    const disc=x=>{const d=new THREE.CircleGeometry(0.15,18);d.rotateX(Math.PI/2);d.translate(x,0,0.175);return d;};
    const ring=x=>{const t=new THREE.TorusGeometry(0.158,0.019,5,26);t.rotateX(Math.PI/2);t.translate(x,0,0.175);return t;};
    // the silhouette in light: a thin band traced round the side profile, on each flank
    const outl=sh.getPoints(5),strip=y=>{const P=[],t=0.0095;for(let i=0;i<outl.length;i++){const a=outl[i],b=outl[(i+1)%outl.length],dx=b.x-a.x,dz=b.y-a.y,l=Math.hypot(dx,dz);if(l<1e-5)continue;
        const nx=-dz/l*t,nz=dx/l*t,q=[[a.x-nx,a.y-nz],[a.x+nx,a.y+nz],[b.x+nx,b.y+nz],[b.x-nx,b.y-nz]];[0,1,2,0,2,3].forEach(k=>P.push(q[k][0],y,q[k][1]));}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));return g;};
    const nose=new THREE.BoxGeometry(0.05,0.1,0.02);nose.translate(0.49,0,0.15);const tail=new THREE.BoxGeometry(0.03,0.08,0.025);tail.translate(-0.515,0,0.21);
    const hub=x=>{const t=new THREE.TorusGeometry(0.055,0.01,4,14);t.rotateX(Math.PI/2);t.translate(x,0,0.175);return t;};
    return CYC={shell:mergeGeo([shell,torso,helmet,disc(-0.3),disc(0.3)]),glow:mergeGeo([ring(-0.3),ring(0.3),strip(0.047),strip(-0.047),nose,tail,hub(-0.3),hub(0.3)])};
  }
  const CYC_SHELL=new THREE.MeshBasicMaterial({color:0x03090c,transparent:true,opacity:0.88,depthWrite:false});
  function makeCycle(col){
    const G=cycleGeo(),g=new THREE.Group(),hot=new THREE.Color(col).lerp(new THREE.Color(0xffffff),0.3);
    const shell=new THREE.Mesh(G.shell,CYC_SHELL);const gm=new THREE.MeshBasicMaterial({color:hot,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const glow=new THREE.Mesh(G.glow,gm);glow.renderOrder=2;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:new THREE.Color(col),transparent:true,opacity:0.55,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.set(1.5,1.5,1);sp.position.z=0.18;
    g.add(shell,glow,sp);
    return {g,gm,sp,setColor(c){gm.color.copy(c).lerp(_cw,0.3);sp.material.color.copy(c);},dispose(){gm.dispose();sp.material.dispose();}};
  }
  const _cw=new THREE.Color(0xffffff),_rbv=new THREE.Vector3(),_UPZ=new THREE.Vector3(0,0,1);
  // the light wall: a tall thin ribbon along the path, additive, brightest along its top edge, fading out toward the tail.
  // Capped buffer: the head is the bike, then the corners it turned at (newest first); corners past the tail are dropped.
  const RIB_VS=`attribute float aD;attribute float aH;uniform float uL,uFog;varying float vD,vH,vF;
void main(){vD=aD;vH=aH;vec4 mv=modelViewMatrix*vec4(position,1.0);vF=exp(-uFog*uFog*mv.z*mv.z);gl_Position=projectionMatrix*mv;}`;
  const RIB_FS=`uniform vec3 uC;uniform float uL,uGap,uOp;varying float vD,vH,vF;
void main(){if(vD<uGap)discard;float t=clamp(1.0-vD/uL,0.0,1.0);float fade=t*t*(3.0-2.0*t)*smoothstep(uGap,uGap*1.6,vD);
 float top=smoothstep(0.8,1.0,vH),bot=1.0-smoothstep(0.0,0.14,vH);
 vec3 c=uC*(0.2+0.24*vH+top*1.4+bot*0.55)+vec3(1.0)*smoothstep(0.93,1.0,vH)*0.55;
 gl_FragColor=vec4(c,fade*uOp*vF);}`;
  function makeRibbon(cap,col,h,L,gap){
    const P=new Float32Array(cap*6),D=new Float32Array(cap*2),H=new Float32Array(cap*2);for(let i=0;i<cap;i++)H[i*2+1]=1;
    const idx=[];for(let i=0;i<cap-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
    const g=new THREE.BufferGeometry();g.setIndex(idx);const pa=new THREE.BufferAttribute(P,3),da=new THREE.BufferAttribute(D,1);pa.setUsage(THREE.DynamicDrawUsage);da.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position',pa);g.setAttribute('aD',da);g.setAttribute('aH',new THREE.BufferAttribute(H,1));g.setDrawRange(0,0);
    const m=new THREE.Mesh(g,new THREE.ShaderMaterial({vertexShader:RIB_VS,fragmentShader:RIB_FS,uniforms:{uC:{value:new THREE.Color(col)},uL:{value:L},uGap:{value:gap},uOp:{value:1},uFog:{value:SKIN.fog}},
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
    m.frustumCulled=false;m.renderOrder=1;
    return {m,pa,da,P,D,cap,h,L,pts:[]};}
  function ribbonWrite(rb,p,n){
    let k=0,acc=0,i=0;const P=rb.P,D=rb.D,h=rb.h;
    const put=(q,u,d)=>{const o=k*6;P[o]=q.x;P[o+1]=q.y;P[o+2]=q.z;P[o+3]=q.x+u.x*h;P[o+4]=q.y+u.y*h;P[o+5]=q.z+u.z*h;D[k*2]=D[k*2+1]=d;k++;};
    put(p,n,0);let prev=p;
    for(;i<rb.pts.length&&k<rb.cap;i++){const c=rb.pts[i],d=prev.distanceTo(c.p);
      if(acc+d>=rb.L){_rbv.copy(c.p).sub(prev).multiplyScalar((rb.L-acc)/Math.max(d,1e-6)).add(prev);put(_rbv,c.n,rb.L);i++;break;}
      acc+=d;put(c.p,c.n,acc);prev=c.p;}
    if(i<rb.pts.length)rb.pts.length=i;
    rb.pa.needsUpdate=true;rb.da.needsUpdate=true;rb.m.geometry.setDrawRange(0,Math.max(0,k-1)*6);}
  function disposeRibbon(rb){if(rb.m.parent)rb.m.parent.remove(rb.m);rb.m.geometry.dispose();rb.m.material.dispose();}
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
    if(w.bike){skinCol(_c,base[w.a].color);w.bike.setColor(_c);w.rb.m.material.uniforms.uC.value.copy(_c);}
    else{skinCol(w.cargo.material.color,base[w.a].color);w.cargo.material.emissive.copy(w.cargo.material.color);}}
  function buildWalkers(){
    if(walk)endWalk();idleW=null;walkers.forEach(w=>{walkerGroup.remove(w.g);if(w.bike){w.bike.dispose();disposeRibbon(w.rb);}});walkers.length=0;skinKinesins();
    const ok=[];for(let i=0;i<edgeList.length;i++)if(walkerEdgeOK(i))ok.push(i);
    const count=Math.min(150,Math.max(0,Math.round(edgeList.length/25)),ok.length);
    for(let k=0;k<count;k++){
      const i=ok.splice(Math.floor(wRng()*ok.length),1)[0];const e=edgeList[i];
      const u=1.5*state.nsize,g=new THREE.Group();
      if(SKIN.cycles){   // TRON: a light cycle rides the links node to node, laying its light wall behind it
        const col=skinCol(new THREE.Color(),base[e.from].color),bike=makeCycle(col);bike.g.scale.setScalar(u*2.7);g.add(bike.g);
        const rb=makeRibbon(LITE?14:24,col,u*1.25,u*(LITE?16:28),u*1.45);walkerGroup.add(rb.m);
        const w={g,bike,rb,u,cargo:g,L:0,period:1,lead:0,i:-1,spd:6+wRng()*3};walkerSetEdge(w,i,wRng()<0.5?e.from:e.to);w.s=wRng()*w.len;
        rb.pts.push({p:pos[w.a].clone(),n:w.n.clone()});   // the wall starts where the ride did
        walkerGroup.add(g);walkers.push(w);continue;}
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
      if(w.bike){cycleStep(w,dt*(ctl?(held(' ')?0.05:held('Shift')?1.9:held('ArrowUp','w')?1.4:1):1),ctl,ppu,cam);continue;}
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
  // a light cycle on the links: rides straight through each node onto another of its links (a crisp turn, the wall keeps both
  // legs), turns back at a dead end; the one you ride takes ←/→ at the next node
  const _wn=new THREE.Vector3(),_wm=new THREE.Matrix4(),_wy=new THREE.Vector3();
  function cycleNext(w,ctl){
    const opts=(edgeSlots[w.b]||[]).filter(j=>j!==w.i&&walkerEdgeOK(j));let next=opts.length?opts[Math.floor(wRng()*opts.length)]:null;
    if(ctl&&opts.length){const bias=(held('ArrowRight','d')?1:0)-(held('ArrowLeft','a')?1:0);
      if(bias){_wr.set(bias,0,0).applyQuaternion(camera.quaternion);let best=-2;for(const j of opts){const e=edgeList[j];const other=e.from===w.b?e.to:e.from;_wb2.copy(pos[other]).sub(pos[w.b]).normalize();const d=_wb2.dot(_wr);if(d>best){best=d;next=j;}}}}
    return next;}
  function cycleCorner(w,p,oldN){w.rb.pts.unshift({p:p.clone(),n:w.n.clone()},{p:p.clone(),n:oldN.clone()});if(w.rb.pts.length>w.rb.cap*2)w.rb.pts.length=w.rb.cap*2;}
  function cycleStep(w,dt,ctl,ppu,cam){
    w.s+=w.u*w.spd*dt;
    for(let guard=0;w.s>=w.len&&guard<4;guard++){const over=w.s-w.len,node=pos[w.b],next=cycleNext(w,ctl);_wn.copy(w.n);
      walkerSetEdge(w,next!=null?next:w.i,w.b);w.s=Math.min(over,w.len*0.5);cycleCorner(w,node,_wn);}
    _wa.copy(pos[w.a]).addScaledVector(w.dir,w.s);
    const dist=cam.distanceTo(_wa),px=w.u*2.2*ppu/dist;w.g.visible=px>5||ctl||w===idleW;w.rb.m.visible=w.g.visible;if(!w.g.visible)return;
    w.g.position.copy(_wa);_wy.crossVectors(w.n,w.dir);_wm.makeBasis(w.dir,_wy,w.n);w.g.quaternion.setFromRotationMatrix(_wm);
    ribbonWrite(w.rb,_wa,w.n);}
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
  const RIDE_HTML=document.getElementById('ride-hint').innerHTML.replace('<!--ico-->',ICO.butterfly);setHint(RIDE_HTML);
  const WALK_HTML=()=>SKIN.cycles?ICO.cycle+'<kbd>↑</kbd><kbd>W</kbd> throttle &nbsp; <kbd>↓</kbd><kbd>S</kbd> U-turn &nbsp; <kbd>← →</kbd><kbd>A D</kbd> pick the next turn &nbsp; <kbd>Shift</kbd> boost &nbsp; <kbd>Space</kbd> brake &nbsp; <kbd>J</kbd> jump to another galaxy<button id="ride-off">Esc · get off</button>'
    :ICO.kinesin+'<kbd>↑</kbd><kbd>W</kbd> hurry &nbsp; <kbd>↓</kbd><kbd>S</kbd> turn around &nbsp; <kbd>← →</kbd><kbd>A D</kbd> pick the next link &nbsp; <kbd>Shift</kbd> sprint &nbsp; <kbd>Space</kbd> rest &nbsp; <kbd>J</kbd> jump to another galaxy<button id="ride-off">Esc · let go</button>';
  function setHint(html){const el=document.getElementById('ride-hint');el.innerHTML=html;el.querySelector('#ride-off').addEventListener('click',()=>{if(ride)endRide();if(walk)endWalk();});}
  function beginWalk(w){if(!w)return;if(idle)endIdle();if(ride)endRide();walk=w;tw=null;controls.autoRotate=false;controls.enabled=false;keys.clear();
    hoverW=null;setHover(null);tip.style.display='none';renderer.domElement.style.cursor='';setHint(WALK_HTML());rideEl.classList.add('on');walkCam(w,1);}
  function endWalk(){const w=walk;if(!w)return;walk=null;keys.clear();controls.enabled=true;controls.autoRotate=false;controls.target.copy(w.cargo.position);controls.update();lastInput=performance.now();rideEl.classList.remove('on');setHint(RIDE_HTML);}
  function walkTurn(w){
    if(w.bike){_wc.copy(pos[w.a]).addScaledVector(w.dir,w.s);_wn.copy(w.n);const s=w.s;walkerSetEdge(w,w.i,w.b);w.s=Math.max(0,w.len-s);cycleCorner(w,_wc,_wn);return;}
    walkerSetEdge(w,w.i,w.b);w.s=Math.max(w.u,w.len-w.s);}
  function walkJump(w){   // hop to a random link in a different galaxy (or anywhere else in a single map)
    const here=w.a&&base[w.a].realm;const ok=[];for(let i=0;i<edgeList.length;i++){if(!walkerEdgeOK(i))continue;if(multi()&&base[edgeList[i].from].realm===here)continue;ok.push(i);}
    if(!ok.length)return;const i=ok[Math.floor(wRng()*ok.length)],e=edgeList[i];walkerSetEdge(w,i,wRng()<0.5?e.from:e.to);w.s=w.u*1.2;if(w.rb){w.rb.pts.length=0;w.rb.pts.push({p:pos[w.a].clone(),n:w.n.clone()});}
    const sys=systems.find(x=>x.cid===sysOf[w.a]);if(sys){setFocused(sys.cid);}walkCam(w,1);}
  window.addEventListener('keydown',ev=>{if(!walk||ev.repeat||/INPUT|TEXTAREA/.test(ev.target.tagName))return;const k=keyName(ev);if(k==='ArrowDown'||k==='s')walkTurn(walk);if(k==='j')walkJump(walk);});
  function walkCam(w,k){
    _ws.crossVectors(w.dir,w.n).normalize();
    _wc.copy(pos[w.a]).addScaledVector(w.dir,w.s);const u=w.u;
    if(w.bike){   // chase cam: steeply above and behind the bike, off to one side: its light wall shows (not edge-on) and the node it just left stays under the line of sight it's riding
      const nar=Math.min(1,camera.aspect*1.2);_wt.copy(_wc).addScaledVector(w.dir,u*3*nar);_wc.addScaledVector(w.n,u*7.5).addScaledVector(w.dir,-u*6).addScaledVector(_ws,u*3.6*nar);
      for(const id of [w.a,w.b]){const sl=slotOf[id];if(!sl)continue;const r=(sl.mesh==='s'?rSun(sysBySun[id]):rPlanet(id))*1.7;_wr.copy(_wc).sub(pos[id]);const d=_wr.length();   // never inside the node it left or is heading for
        if(d<r){_wc.copy(pos[id]).addScaledVector(d>1e-4?_wr.multiplyScalar(1/d):w.n,r);}}
      camera.position.lerp(_wc,k);controls.target.lerp(_wt,Math.min(1,k*1.5));return;}
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
  // ── skin props: the JARVIS HUD, monarch sky, synthwave outrun, matrix rain, blueprint drafting ──
  const extras=new THREE.Group();scene.add(extras);
  // ── JARVIS: holographic tactical display. Everything below only runs for the skin whose extras is 'hud'. ──
  // Solid group-coloured node bodies with a hologram rim and scanlines, additive wire shells, fake bloom points, a procedural ring stack
  // per system, a radar disc, a lock-on reticle, orbit guides, data packets on links, a sky dome and a DOM HUD.
  const JV_FOG='float fogK(float d,float k){return exp(-k*k*d*d);}';
  const JV_HOLO_VS=`uniform float uGrow,uPx;varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying float vDepth;varying float vWz;varying float vSz;varying vec3 vON;
void main(){mat4 im=mat4(1.0);
#ifdef USE_INSTANCING
im=instanceMatrix;
#endif
vec4 wp=modelMatrix*im*vec4(position*uGrow,1.0);vec4 mv=viewMatrix*wp;
vON=normal;vN=normalize(normalMatrix*mat3(im)*normal);vV=normalize(-mv.xyz);vCol=vec3(1.0);
#ifdef USE_INSTANCING_COLOR
vCol=instanceColor;
#endif
vDepth=-mv.z;vWz=wp.z;vSz=length(im[0].xyz)*uGrow*uPx/max(1.0,-mv.z);gl_Position=projectionMatrix*mv;}`;
  const JV_HOLO_FS=`uniform vec3 uRim;uniform float uPow,uCoreA,uRimA,uMix,uTime,uScan,uScanK,uFog,uFlick,uBright,uWF;
varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying float vDepth;varying float vWz;varying float vSz;
${JV_FOG}
void main(){float f=pow(1.0-clamp(abs(dot(normalize(vN),normalize(vV))),0.0,1.0),uPow);
vec3 col=mix(vCol,uRim,uMix*f);
float s=fract(vWz*uScanK-uTime*0.08);float band=uScan*pow(s,18.0);
float a=(uCoreA+f*uRimA+band*0.6)*uFlick*fogK(vDepth,uFog);
a*=mix(1.0,smoothstep(3.0,16.0,vSz),uWF);
gl_FragColor=vec4(col*uBright*(0.55+f*1.2+band*1.5),a);}`;
  // node bodies: opaque and group-coloured (the legend colour is the one cue a node has), so the hologram only tints the
  // edge (fresnel rim toward ice-cyan), adds fine screen scanlines and a slow scan band, and on suns a lat/long grid
  const JV_BODY_FS=`uniform vec3 uRim,uFogC;uniform float uPow,uTime,uScan,uScanK,uFog,uFlick,uSun,uRimK;
varying vec3 vN;varying vec3 vV;varying vec3 vCol;varying float vDepth;varying float vWz;varying float vSz;varying vec3 vON;
${JV_FOG}
float gl(float x,float w){float d=abs(fract(x+0.5)-0.5);return 1.0-smoothstep(w,w+fwidth(x)*1.5,d);}
void main(){vec3 n=normalize(vN);float ndv=clamp(abs(dot(n,normalize(vV))),0.0,1.0),f=pow(1.0-ndv,uPow);
vec3 c=vCol*(0.74+0.34*ndv);
c*=0.9+0.1*step(1.0,mod(gl_FragCoord.y,3.0));
if(uSun>0.5){vec3 o=normalize(vON);float lat=asin(clamp(o.z,-1.0,1.0))*1.9099,lon=atan(o.y,o.x)*1.9099+uTime*0.02;
  float g=max(gl(lat,0.02),gl(lon,0.02))*smoothstep(4.0,24.0,vSz);c*=0.86;c=mix(c,uRim,g*0.32);c+=vCol*g*0.12;}
float s=fract(vWz*uScanK-uTime*0.08);c+=uRim*uScan*pow(s,18.0)*0.22;
c=mix(c,uRim,f*uRimK)+uRim*f*0.22;
gl_FragColor=vec4(mix(uFogC,c*uFlick,fogK(vDepth,uFog)),1.0);}`;
  // fake bloom: one Points object, world-sized soft sprites, additive
  const JV_HALO_VS=`attribute float aSize;attribute vec3 aColor;uniform float uScale,uFog,uFade,uBoost;varying vec3 vC;varying float vF;
${JV_FOG}
void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);float ps=aSize*uScale/-mv.z;gl_PointSize=min(ps,512.0);vC=aColor;vF=fogK(-mv.z,uFog)*(1.0-smoothstep(uFade*0.35,uFade,ps))*(1.0+uBoost*(1.0-smoothstep(10.0,48.0,ps)));gl_Position=projectionMatrix*mv;}`;
  // small graphs: two extra passes of the link lines, nudged a pixel right and a pixel down, so a lone link is ~2px wide.
  // They draw the engine's own edge geometry, so focus dimming and hover highlights follow for free.
  const JV_THICK_VS=`uniform vec2 uOff,uRes;uniform float uFog;varying vec3 vC;varying float vF;
${JV_FOG}
void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_Position.xy+=uOff*2.0/uRes*gl_Position.w;vC=color;vF=fogK(-mv.z,uFog);}`;
  const JV_THICK_FS=`uniform float uOp,uGain;varying vec3 vC;varying float vF;void main(){gl_FragColor=vec4(min(vC*uGain,vec3(1.0)),uOp*vF);}`;
  const JV_PKT_VS=`attribute vec3 aB;attribute float aT;attribute float aV;attribute float aSize;attribute vec3 aColor;uniform float uScale,uFog,uTime;varying vec3 vC;varying float vF;
${JV_FOG}
void main(){float k=fract(aT+uTime*aV);vec4 mv=modelViewMatrix*vec4(mix(position,aB,k),1.0);gl_PointSize=min(aSize*uScale/-mv.z,64.0);vC=aColor;vF=fogK(-mv.z,uFog)*smoothstep(0.0,0.08,k)*smoothstep(1.0,0.92,k);gl_Position=projectionMatrix*mv;}`;
  const JV_HALO_FS=`uniform float uI;varying vec3 vC;varying float vF;
void main(){vec2 p=gl_PointCoord*2.0-1.0;float d=length(p);if(d>1.0)discard;
float g=(exp(-d*d*5.0)*(1.0-d)+0.6*exp(-d*d*48.0))*uI*vF;gl_FragColor=vec4(vC*g,g);}`;
  // one quad, three looks: 0 = the ring stack round every sun, 1 = radar disc, 2 = camera-facing lock-on reticle
  const JV_RING_VS=`attribute float aSeed;attribute float aIn;varying vec2 vP;varying float vSeed;varying float vIn;varying float vDepth;
void main(){mat4 im=mat4(1.0);
#ifdef USE_INSTANCING
im=instanceMatrix;
#endif
vP=position.xy;vSeed=aSeed;vIn=aIn;vec4 mv=modelViewMatrix*im*vec4(position,1.0);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;
  const JV_RING_FS=`uniform vec3 uColor;uniform float uTime,uOp,uFog,uMode;varying vec2 vP;varying float vSeed;varying float vIn;varying float vDepth;
${JV_FOG}
float ring(float r,float c,float w){float aa=fwidth(r)*1.2;return 1.0-smoothstep(w,w+aa,abs(r-c));}
float tk(float x,float w){float d=abs(fract(x+0.5)-0.5);return 1.0-smoothstep(w,w+fwidth(x),d);}
float band(float r,float a,float b){return step(a,r)*step(r,b);}
void main(){float r=length(vP);if(r>1.0)discard;
float a=atan(vP.y,vP.x)/6.2831853+0.5;float t=uTime;float s=vSeed;float v=0.0;
float det=1.0-smoothstep(0.012,0.035,fwidth(r));
if(uMode<0.5){
  float ci=vIn;
  v+=0.06*smoothstep(ci*1.35,ci*0.85,r);
  v+=ring(r,ci,0.0065)*step(0.42,fract(a*36.0+t*0.05+s))*0.9;
  v+=ring(r,ci*1.22,0.0022)*0.45*det;
  v+=tk(a*72.0,0.1)*band(r,ci*1.08,ci*1.15)*0.45*det;
  v+=tk(a*90.0,0.08)*band(r,0.905,0.93)*0.4*det;
  v+=tk(a*8.0,0.01)*band(r,0.885,0.95)*0.9;
  v+=ring(r,0.958,0.008)*step(fract(a*3.0-t*0.035+s),0.22)*0.85;
  v+=ring(r,0.978,0.0022)*step(0.5,fract(a*180.0))*0.35*det;
  v+=ring(r,0.996,0.0024)*step(fract(a-t*0.02+s*0.3),0.1)*1.0;
}else if(uMode<1.5){
  float px=fwidth(r);float g=ring(fract(r*4.0),0.0,min(0.008,px*0.6))+ring(fract(r*4.0),1.0,min(0.008,px*0.6));
  float spoke=1.0-smoothstep(0.0,fwidth(a*12.0)*1.2,0.5-abs(fract(a*12.0)-0.5));
  float d=fract(t*0.07-a);float trail=exp(-d*16.0)*0.22+smoothstep(0.005,0.0,d)*0.35;
  v=(g*0.26+spoke*0.07)*smoothstep(1.0,0.25,r)+trail*smoothstep(0.98,0.1,r)*smoothstep(0.0,0.1,r)+ring(r,0.99,min(0.003,px*0.8))*0.55;
  v+=tk(a*120.0,0.06)*band(r,0.955,0.975)*0.35*det;
}else{
  float q=fract(a*4.0+t*0.012+0.125);
  v+=ring(r,0.885,0.006)*step(abs(q-0.5),0.14)*0.9;
  v+=tk(a*72.0,0.06)*band(r,0.925,0.945)*0.45*det;
  v+=tk(a*4.0,0.004)*band(r,0.91,0.995);
}
float al=v*uOp*fogK(vDepth,uFog);if(al<0.003)discard;
gl_FragColor=vec4(uColor*(0.8+v*0.6),al);}`;
  const _jm=new THREE.Matrix4(),_jq=new THREE.Quaternion(),_jv=new THREE.Vector3(),_js=new THREE.Vector3(),_jc=new THREE.Color(),_jc2=new THREE.Color();
  const _jhsl={h:0,s:0,l:0},JV_ICE=new THREE.Color(0x7be9f1);
  const jvCol=(c,hex,l)=>{c.set(hex).getHSL(_jhsl);return c.setHSL(_jhsl.h,Math.min(0.66,_jhsl.s*0.85),l).lerp(JV_ICE,0.08);};
  // a node's own group colour, exactly as its legend dot shows it (only near-black colours are lifted so they stay visible)
  const jvGrp=(c,hex)=>{c.set(hex).getHSL(_jhsl);if(_jhsl.l<0.4)c.setHSL(_jhsl.h,_jhsl.s,0.4);return c;};
  const jvU=o=>{const u={};for(const k in o)u[k]={value:o[k]};return u;};
  let JV=null,jvDom=null;
  function jvHudDom(){
    if(jvDom)return jvDom;
    const $e=id=>document.getElementById(id);
    let tape='';for(let d=0;d<=800;d+=5){const x=d*3;tape+=`<line x1="${x}" y1="${d%30?19:12}" x2="${x}" y2="26"${d%30?' class="mn"':''}/>`;if(d%30===0)tape+=`<text x="${x}" y="8">${String(d%360).padStart(3,'0')}</text>`;}
    // a tick-marked arc at the screen edge (side -1: left edge, +1: right edge); ticks point outward, the pointer rides inside
    const arc=(side,title)=>{const W=70,H=320,R=420,cy=H/2,cx=side<0?R+20:W-R-20,P=(th,rr)=>{const f=side<0?Math.PI+th:-th;return [+(cx+Math.cos(f)*rr).toFixed(1),+(cy+Math.sin(f)*rr).toFixed(1)];};
      const [ax,ay]=P(-0.36,R),[bx,by]=P(0.36,R);let s=`<path class="bk" d="M${ax} ${ay}A${R} ${R} 0 0 ${side<0?1:0} ${bx} ${by}"/>`;
      for(let a=-20;a<=20;a+=2){const th=a*Math.PI/180,mj=a%10===0,[x1,y1]=P(th,R),[x2,y2]=P(th,R+(mj?11:5));s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${mj?'':' class="mn"'}/>`;}
      const [tx,ty]=P(0.43,R-2),e=side<0?20:W-20;
      return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}<text class="tt" x="${tx}" y="${ty}">${title}</text><g class="pt"><path d="M${e-2*side} ${cy}l${-8*side} -4v8z"/><text x="${e-13*side}" y="${cy+3}" text-anchor="${side<0?'start':'end'}"></text></g></svg>`;};
    const h=document.createElement('div');h.id='jv-hud';h.setAttribute('aria-hidden','true');
    h.innerHTML=`<div id="jv-tape"><svg width="2400" height="28" viewBox="0 0 2400 28">${tape}</svg><b id="jv-hdg">HDG 000</b></div>
<div id="jv-ro"><div class="h"><span>TACTICAL</span><em id="jv-sum">GALAXY</em><i>● LIVE</i></div>
<div class="r"><span>TARGET</span><b id="jv-sys">GALAXY</b></div><div class="r"><span id="jv-nk">NODES</span><b id="jv-n">0</b></div><div class="r"><span>LINKS</span><b id="jv-l">0</b></div><div class="r"><span>GROUPS</span><b id="jv-g">0</b></div>
<div class="bars" id="jv-bars"></div></div>
<div id="jv-map"><svg viewBox="-64 -64 128 128"><circle r="60" class="o"/><circle r="40"/><circle r="20"/><path d="M-60 0H60M0 -60V60" class="x"/><g id="jv-blips"></g><g id="jv-fov"><path d="M0 0L-15 -44A46 46 0 0 1 15 -44Z"/></g></svg><div class="sweep"></div><div class="cap">SECTOR MAP</div></div>
<div class="jv-arc l">${arc(-1,'ELV')}</div><div class="jv-arc r">${arc(1,'RNG')}</div>
<div id="jv-lock"><i></i><i></i><i></i><i></i><span id="jv-lock-t"></span></div>`;
    document.body.appendChild(h);
    const q=s=>h.querySelector(s);
    jvDom={h,tape:q('#jv-tape svg'),hdg:$e('jv-hdg'),sys:$e('jv-sys'),nk:$e('jv-nk'),n:$e('jv-n'),stats:$e('stats'),ro:$e('jv-ro'),roB:-1,l:$e('jv-l'),g:$e('jv-g'),sum:$e('jv-sum'),bars:$e('jv-bars'),
      blips:$e('jv-blips'),fov:$e('jv-fov'),lock:$e('jv-lock'),lockT:$e('jv-lock-t'),elv:q('.jv-arc.l .pt'),elvT:q('.jv-arc.l .pt text'),rng:q('.jv-arc.r .pt'),rngT:q('.jv-arc.r .pt text'),txt:{},fit:'lg',brand:$e('brand'),box:[]};
    // The HUD is sized to the viewer's own box, not the window (an Atlas can sit in a 580px iframe on a big screen):
    // lg — the full readout; md (under 700 tall or 900 wide) — the readout folds to a pill, the tape and sector map shrink;
    // sm (phone width) — pill above the stats line, no tape / map / arcs.
    const D=jvDom,fit=()=>{const r=el.getBoundingClientRect(),W=r.width||window.innerWidth,H=r.height||window.innerHeight;
      const f=W<=720?'sm':(W<900||H<700)?'md':'lg',k=Math.max(0.74,Math.min(1,Math.min(W/1440,H/900)*1.08));
      if(f!==D.fit){D.fit=f;D.ro.classList.toggle('pill',f!=='lg');D.ro.classList.remove('open');D.roB=-1;D.ro.style.bottom='';}
      h.dataset.fit=f;h.style.setProperty('--jv-k',f==='lg'?Math.max(0.86,k).toFixed(3):k.toFixed(3));D.boxT=0;};
    fit();if(window.ResizeObserver)new ResizeObserver(fit).observe(el);else window.addEventListener('resize',fit);
    D.ro.addEventListener('click',()=>{if(D.ro.classList.contains('pill')){D.ro.classList.toggle('open');D.boxT=0;}});
    return jvDom;
  }
  function jvBuild(){
    const H=SKIN.holo||{},RM=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const J={RM,t:0,timed:[],halo:null,pk:null,ring:null,radar:null,ret:null,retOp:0,fc:undefined,fs:null,hudT:0,az:-999,el:-999,rg:-999,lockId:null,lockSz:0,dom:jvHudDom()};
    const R=Math.max(400,galaxyR);const add=o=>{extras.add(o);return o;};
    const holoMat=o=>{const m=new THREE.ShaderMaterial({vertexShader:JV_HOLO_VS,fragmentShader:JV_HOLO_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,wireframe:!!o.wire,
      uniforms:jvU({uRim:new THREE.Color(H.rim||0xbffbff),uPow:H.pow||2.2,uCoreA:o.core,uRimA:o.rimA,uMix:H.mix||0.6,uTime:0,uScan:RM?0:(H.scan||0),uScanK:1/Math.max(60,galaxyR*1.2),uFog:SKIN.fog,uFlick:1,uBright:o.bright||1,uGrow:o.grow||1,uPx:1,uWF:o.wire?1:0})});J.timed.push(m.uniforms);return m;};
    const ringMat=(mode,color,op,fog)=>new THREE.ShaderMaterial({vertexShader:JV_RING_VS,fragmentShader:JV_RING_FS,extensions:{derivatives:true},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
      uniforms:jvU({uColor:new THREE.Color(color),uTime:0,uOp:op,uFog:fog,uMode:mode})});
    // sky dome: a dark teal gradient with a faint horizon glow
    {const g=new THREE.SphereGeometry(R*12,24,24),P=g.attributes.position,C=new Float32Array(P.count*3),bot=new THREE.Color(0x000305),mid=new THREE.Color(0x01090e),top=new THREE.Color(0x02141b),glow=new THREE.Color(0x06303a);
      for(let i=0;i<P.count;i++){_jv.fromBufferAttribute(P,i).normalize();const h=_jv.z;
        if(h<0)_jc.copy(bot).lerp(mid,Math.max(0,1+h/0.5)**2);else _jc.copy(mid).lerp(top,Math.min(1,h/0.9));_jc.r+=glow.r*0.14*Math.exp(-h*h*6);_jc.g+=glow.g*0.14*Math.exp(-h*h*6);_jc.b+=glow.b*0.14*Math.exp(-h*h*6);C[i*3]=_jc.r;C[i*3+1]=_jc.g;C[i*3+2]=_jc.b;}
      g.setAttribute('color',new THREE.BufferAttribute(C,3));
      const dome=add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false})));dome.renderOrder=-10;dome.frustumCulled=false;}
    // node bodies stay solid and keep their legend colour; the hologram is the ice rim, the scanlines and a geodesic wire shell
    // that shares the body's instance buffers (hover growth follows for free)
    planetIds.forEach((id,i)=>planets.setColorAt(i,jvGrp(_jc,base[id].color)));sunIds.forEach((id,i)=>suns.setColorAt(i,jvGrp(_jc,base[id].color)));
    [planets,suns].forEach(m=>{if(m&&m.instanceColor)m.instanceColor.needsUpdate=true;});
    const bodyMat=sun=>{const m=new THREE.ShaderMaterial({vertexShader:JV_HOLO_VS,fragmentShader:JV_BODY_FS,extensions:{derivatives:true},
      uniforms:jvU({uRim:new THREE.Color(H.rim||0xbffbff),uFogC:new THREE.Color(SKIN.sky),uPow:H.pow||2.2,uRimK:sun?0.4:0.5,uTime:0,uScan:RM?0:(H.scan||0),uScanK:1/Math.max(60,galaxyR*1.2),uFog:SKIN.fog,uFlick:1,uSun:sun,uGrow:1,uPx:1})});J.timed.push(m.uniforms);return m;};
    [[planets,0],[suns,1]].forEach(([mesh,sun])=>{if(!mesh)return;mesh.material.dispose();mesh.material=bodyMat(sun);mesh.frustumCulled=false;
      const sh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,sun?2:1),holoMat({wire:true,core:sun?0.06:0.1,rimA:sun?0.4:0.45,grow:sun?1.08:1.07,bright:0.9}),1);
      sh.instanceMatrix=mesh.instanceMatrix;sh.instanceColor=mesh.instanceColor;sh.count=mesh.count;sh.frustumCulled=false;add(sh);});
    // soften the stock sun glow sprites (they keep the group colour)
    glows.forEach(g=>{if(g.isSprite&&g.material.opacity>0.5)g.material.opacity=0.16;});
    // fake bloom: a soft glow behind every node, one draw call
    const ids=planetIds.concat(sunIds);if(ids.length){const P=new Float32Array(ids.length*3),C=new Float32Array(ids.length*3),S=new Float32Array(ids.length);
      ids.forEach((id,i)=>{const p=pos[id],sun=i>=planetIds.length;P[i*3]=p.x;P[i*3+1]=p.y;P[i*3+2]=p.z;jvGrp(_jc,base[id].color);C[i*3]=_jc.r;C[i*3+1]=_jc.g;C[i*3+2]=_jc.b;
        S[i]=sun?rSun(sysBySun[id])*5:rPlanet(id)*4.2;});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('aColor',new THREE.BufferAttribute(C,3));g.setAttribute('aSize',new THREE.BufferAttribute(S,1));
      const m=new THREE.ShaderMaterial({vertexShader:JV_HALO_VS,fragmentShader:JV_HALO_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:jvU({uScale:1,uI:0.3,uFog:SKIN.fog,uFade:460,uBoost:1.4})});
      const pts=add(new THREE.Points(g,m));pts.frustumCulled=false;J.halo=m.uniforms;}
    const vis=sunIds.map(id=>sysBySun[id]).filter(Boolean);
    // the ring stack round every sun: one instanced quad, every ring drawn in the fragment shader
    if(vis.length){const g=new THREE.PlaneGeometry(2,2);const seeds=new Float32Array(vis.length);const inner=new Float32Array(vis.length);vis.forEach((s,i)=>{seeds[i]=(i*0.37)%1;inner[i]=Math.min(0.8,rSun(s)*1.45/(s.r+2*state.spacing));});g.setAttribute('aSeed',new THREE.InstancedBufferAttribute(seeds,1));g.setAttribute('aIn',new THREE.InstancedBufferAttribute(inner,1));
      const im=new THREE.InstancedMesh(g,ringMat(0,H.ring||0x5fe8f2,0.75,SKIN.fog),vis.length);
      vis.forEach((s,i)=>{const r=s.r+2*state.spacing;_jm.compose(pos[s.sun],_jq.setFromEuler(s.tilt),_js.set(r,r,r));im.setMatrixAt(i,_jm);});
      im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;add(im);J.ring=im.material.uniforms;}
    // orbit guides: every orbit of every system in one LineSegments, dashed by leaving every third segment out
    {const pts=[],cols=[],SEG=96;vis.forEach(s=>{let i=1,k=0;const rings=[];while(i<s.n){k++;i+=Math.min(Math.round(6+5.5*k),s.n-i);rings.push((9+6.5*k)*state.spacing);}
        jvCol(_jc,s.color,0.55).lerp(_jc2.set(0x19d3e0),0.5);
        rings.forEach(rr=>{for(let j=0;j<SEG;j++){if(j%3===2)continue;for(const a of [j/SEG*Math.PI*2,(j+1)/SEG*Math.PI*2]){_jv.set(rr*Math.cos(a),rr*Math.sin(a),0).applyEuler(s.tilt).add(s.c);pts.push(_jv.x,_jv.y,_jv.z);cols.push(_jc.r,_jc.g,_jc.b);}}});});
      if(pts.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
        add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0.2,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})));}}
    // radar disc: under the galaxy, glides to whichever system you fly into
    {const g=new THREE.PlaneGeometry(2,2);g.setAttribute('aSeed',new THREE.BufferAttribute(new Float32Array(4),1));g.setAttribute('aIn',new THREE.BufferAttribute(new Float32Array(4),1));
      let zmin=0,ext=0;vis.forEach(s=>{zmin=Math.min(zmin,s.c.z-s.r);ext=Math.max(ext,Math.hypot(s.c.x,s.c.y)+s.r);});
      const m=new THREE.Mesh(g,ringMat(1,0x19d3e0,0.42,0));m.position.set(0,0,zmin-galaxyR*0.12);m.scale.setScalar(Math.max(ext*1.18,galaxyR*0.6));m.frustumCulled=false;add(m);J.radar=m;}
    // lock-on reticle: faces the camera and frames the focused system
    {const g=new THREE.PlaneGeometry(2,2);g.setAttribute('aSeed',new THREE.BufferAttribute(new Float32Array(4),1));g.setAttribute('aIn',new THREE.BufferAttribute(new Float32Array(4),1));
      const m=new THREE.Mesh(g,ringMat(2,0x9ff5fb,0,0));m.visible=false;m.frustumCulled=false;add(m);J.ret=m;}
    // data packets: preallocated points sliding along a sample of the links, positions rewritten in place
    if(!RM&&edgeList.length){const n=Math.min(260,edgeList.length*2),A=new Float32Array(n*3),B=new Float32Array(n*3),C=new Float32Array(n*3),S=new Float32Array(n),T=new Float32Array(n),V=new Float32Array(n),rng=seeded(5);_jc.set(0x9ff5fb);
      for(let i=0;i<n;i++){const e=edgeList[Math.floor(rng()*edgeList.length)],a=pos[e.from],b=pos[e.to];A[i*3]=a.x;A[i*3+1]=a.y;A[i*3+2]=a.z;B[i*3]=b.x;B[i*3+1]=b.y;B[i*3+2]=b.z;
        T[i]=rng();V[i]=0.12+rng()*0.16;S[i]=1.2+rng()*1.4;C[i*3]=_jc.r;C[i*3+1]=_jc.g;C[i*3+2]=_jc.b;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(A,3));g.setAttribute('aB',new THREE.BufferAttribute(B,3));g.setAttribute('aT',new THREE.BufferAttribute(T,1));g.setAttribute('aV',new THREE.BufferAttribute(V,1));
      g.setAttribute('aColor',new THREE.BufferAttribute(C,3));g.setAttribute('aSize',new THREE.BufferAttribute(S,1));
      const m=new THREE.ShaderMaterial({vertexShader:JV_PKT_VS,fragmentShader:JV_HALO_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:jvU({uScale:1,uI:1.1,uFog:SKIN.fog,uTime:0})});
      const p=add(new THREE.Points(g,m));p.frustumCulled=false;J.pk=m.uniforms;}
    // system labels get a designation line (CSS draws it from data-an, so the label's own text and box stay as they are)
    // group suns that are the group itself (Jarvis's circles, file_type 'group') are not members: counts leave them out,
    // and the readout names its unit from the stats line ("24 people · …" reads PEOPLE; anything else NODES)
    const synth=new Set();RAW_NODES.forEach(n=>{if(n.file_type==='group')synth.add(n.id);});
    J.cnt=s=>s.n-(synth.has(s.sun)?1:0);J.nAll=planetIds.length+sunIds.filter(id=>!synth.has(id)).length;
    const um=/^\s*[\d,.]+\s+([a-z]+)/i.exec(String(ATLAS.stats||''));J.unit=synth.size&&um?um[1].toUpperCase():'NODES';
    for(const id in sunLbl){const s=sysBySun[id];if(s)sunLbl[id].dataset.an=String(J.cnt(s));}
    // HUD data that only changes with a rebuild
    const D=J.dom;let ext=0;RAW_EDGES.forEach(e=>{if(e.confidence==='EXTRACTED')ext++;});J.verified=RAW_EDGES.length?Math.round(ext*100/RAW_EDGES.length)+'%':'—';
    let ex=1;vis.forEach(s=>{ex=Math.max(ex,Math.hypot(s.c.x,s.c.y)+s.r);});
    D.blips.innerHTML=vis.slice(0,80).map(s=>`<circle data-cid="${s.cid}" cx="${(s.c.x/ex*56).toFixed(1)}" cy="${(-s.c.y/ex*56).toFixed(1)}" r="${(1.2+2.6*Math.sqrt(s.n/maxN)).toFixed(1)}"/>`).join('');
    D.lock.classList.remove('on');D.nk.textContent=J.unit;D.txt={};D.roB=-1;D.ro.style.bottom='';
    return J;
  }
  function jvFocus(J){   // focus changed: cache the system and redraw the data that depends on it (never per frame)
    J.fc=focused;J.fs=focused!=null?systems.find(x=>x.cid===focused)||null:null;const D=J.dom,s=J.fs;
    if(s)document.body.dataset.jvFocus='1';else delete document.body.dataset.jvFocus;
    if(s){J.sysLinks=0;for(const e of edgeList)if(sysOf[e.from]===s.cid||sysOf[e.to]===s.cid)J.sysLinks++;}
    let vals,cap;if(s){vals=s.ids.slice(0,24).map(id=>base[id].degree);cap='LINK DEGREE';}else{vals=systems.slice(0,24).map(x=>J.cnt(x));cap='GROUP SIZE';}
    const mx=Math.max(1,...vals);D.bars.innerHTML=vals.map((v,i)=>`<i style="height:${(8+92*v/mx).toFixed(0)}%"${s&&i===0?' class="on"':''}></i>`).join('');
    D.bars.title=cap.toLowerCase()+' · max '+mx;
    D.blips.querySelectorAll('circle').forEach(c=>c.classList.toggle('on',s!=null&&+c.dataset.cid===s.cid));}
  function jvText(D,k,v){if(D.txt[k]!==v){D.txt[k]=v;D[k].textContent=v;}}
  function jvStep(dt,now){
    const J=JV,D=J.dom;if(!J.RM)J.t+=dt;const t=J.t;
    const fl=J.RM?1:0.965+0.035*Math.sin(t*41.0)*Math.sin(t*2.3);
    const sc=(renderer.domElement.height/2)/Math.tan(camera.fov*Math.PI/360);
    for(let i=0;i<J.timed.length;i++){const u=J.timed[i];u.uTime.value=t;u.uFlick.value=fl;u.uPx.value=sc;}
    if(J.halo)J.halo.uScale.value=sc;if(J.ring)J.ring.uTime.value=t;
    // links keep normal blending (additive lost sparse links and blew dense bundles out to white); instead the colour is
    // lifted, so a lone link inside a system reads clearly. buildEdges() alone (inferred toggle) makes a fresh material.
    if(lines&&!lines.material.userData.jv){lines.material.userData.jv=1;lines.material.color.setScalar((SKIN.holo&&SKIN.holo.lineGain||1)*(edgeList.length<400?1.8:1));}   // small graphs: brighter still
    if(J.fc!==focused)jvFocus(J);
    const s=J.fs,rd=J.radar;rd.material.uniforms.uTime.value=t;const ro=rd.material.uniforms.uOp;ro.value+=((s?0.05:0.42)-ro.value)*(1-Math.exp(-dt*3));
    const ret=J.ret;J.retOp+=((s?0.75:0)-J.retOp)*(1-Math.exp(-dt*3));ret.visible=J.retOp>0.01;
    if(ret.visible){ret.material.uniforms.uOp.value=J.retOp;ret.material.uniforms.uTime.value=t;if(s){ret.position.copy(s.c);ret.scale.setScalar(s.r*1.28);}ret.quaternion.copy(camera.quaternion);}
    if(J.pk){J.pk.uScale.value=sc;J.pk.uTime.value=t;}
    if(lines&&edgeList.length<400&&J.lg!==lines.geometry){J.lg=lines.geometry;   // (re)attach after buildEdges()
      if(!J.thick)J.thick=[[1,0],[0,1]].map(o=>{const l=new THREE.LineSegments(lines.geometry,new THREE.ShaderMaterial({vertexShader:JV_THICK_VS,fragmentShader:JV_THICK_FS,vertexColors:true,transparent:true,depthWrite:false,
        uniforms:jvU({uOff:new THREE.Vector2(o[0],o[1]),uRes:new THREE.Vector2(1,1),uOp:0.5,uGain:1,uFog:SKIN.fog})}));l.frustumCulled=false;extras.add(l);return l;});
      else J.thick.forEach(l=>{l.geometry=lines.geometry;});}
    if(J.thick){const m=lines&&lines.material;for(const l of J.thick){const u=l.material.uniforms;l.visible=!!m&&J.lg===lines.geometry;if(m){renderer.getSize(u.uRes.value);u.uOp.value=m.opacity*0.62;u.uGain.value=m.color.r;}}}
    // heading tape, elevation and range arcs: only touch the DOM when the value moved
    const tg=controls.target,cp=camera.position,dx=tg.x-cp.x,dy=tg.y-cp.y,dz=cp.z-tg.z,dist=Math.max(1e-3,Math.hypot(dx,dy,dz));
    const az=((Math.atan2(dx,dy)*180/Math.PI)+360)%360;
    if(Math.abs(az-J.az)>0.15){J.az=az;D.tape.style.transform=`translateX(${(190-(az+360)*3).toFixed(1)}px)`;jvText(D,'hdg','HDG '+String(Math.round(az)%360).padStart(3,'0'));D.fov.setAttribute('transform','rotate('+az.toFixed(1)+')');}
    const el=Math.asin(Math.max(-1,Math.min(1,dz/dist)))*180/Math.PI;
    if(Math.abs(el-J.el)>0.2){J.el=el;D.elv.setAttribute('transform',`rotate(${(el*20/90).toFixed(2)} 440 160)`);D.elvT.textContent=(el>=0?'+':'')+Math.round(el)+'°';}
    const rg=Math.max(-20,Math.min(20,(Math.log10(dist)-2.5)*20/1.5));
    if(Math.abs(rg-J.rg)>0.1){J.rg=rg;D.rng.setAttribute('transform',`rotate(${(-rg).toFixed(2)} -370 160)`);D.rngT.textContent=dist<1000?Math.round(dist)+'':(dist/1000).toFixed(1)+'K';}
    // lock-on brackets on whatever the pointer is over
    const lid=hover&&pos[hover]?hover:null;
    if(lid){_jv.copy(pos[lid]).project(camera);const W=window.innerWidth,Hh=window.innerHeight,x=(_jv.x+1)/2*W,y=(1-_jv.y)/2*Hh;
      const sl=slotOf[lid],r=sl&&sl.mesh==='s'?rSun(sysBySun[lid]):rPlanet(lid),sz=Math.max(32,Math.min(160,2.7*r*pxPer()/Math.max(1,cp.distanceTo(pos[lid]))+18))|0;
      if(sz!==J.lockSz){J.lockSz=sz;D.lock.style.width=D.lock.style.height=sz+'px';}
      D.lock.style.transform=`translate(${(x-sz/2).toFixed(1)}px,${(y-sz/2).toFixed(1)}px)`;
      if(J.lockId!==lid){J.lockId=lid;const b=base[lid];D.lockT.innerHTML=`LOCKED · SYS-${String((sysRank[sunOf[sysOf[lid]]]||0)+1).padStart(2,'0')}<small>${esc(b.cname||'')} · DEG ${b.degree}</small>`;D.lock.classList.remove('on');void D.lock.offsetWidth;D.lock.classList.add('on');}}
    else if(J.lockId){J.lockId=null;D.lock.classList.remove('on');}
    // readouts at 4 Hz
    if(now-J.hudT<250)return;J.hudT=now;
    // phones: the readout sits just above the stats line, however many lines that wraps to
    if(D.fit==='sm'){const st=D.stats,top=st&&st.offsetParent?st.getBoundingClientRect().top:window.innerHeight-10,b=Math.max(14,Math.round(window.innerHeight-top+8));
      if(b!==D.roB){D.roB=b;D.ro.style.bottom=b+'px';}}else if(D.roB!==-1){D.roB=-1;D.ro.style.bottom='';}
    let name='GALAXY',nn=J.nAll,ng=sunIds.length;
    if(s){name=s.label;nn=J.cnt(s);}else if(focusedRealm!=null&&multi()){const R=realmList.find(x=>x.name===focusedRealm);if(R){name=R.name;nn=0;for(let i=0;i<R.systems.length;i++)nn+=J.cnt(R.systems[i]);ng=R.systems.length;}}
    jvText(D,'sys',String(name).toUpperCase());jvText(D,'n',String(nn));jvText(D,'l',String(s?J.sysLinks:edgeList.length));
    jvText(D,'g',String(ng));jvText(D,'sum',String(name).toUpperCase()+' · '+nn+' '+J.unit);
    // labels keep clear of the readout and the brand block: their boxes go in first when labels are laid out (re-measured at 1 Hz)
    if(now-(D.boxT||0)>1000){D.boxT=now;D.box.length=0;for(const e of [D.ro,D.brand]){if(!e||!e.offsetParent)continue;const r=e.getBoundingClientRect();if(r.width)D.box.push({x:r.left-6,y:r.top-6,w:r.width+12,h:r.height+12});}}
  }
  function buildExtras(){
    while(extras.children.length){const o=extras.children.pop();if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}}
    JV=SKIN.extras==='hud'?jvBuild():null;
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
      // The sky pass always renders at the canvas's full resolution: every edge in it (sun, bands, ridge line, grid) is
      // anti-aliased per pixel with fwidth, which a half-size target stretched over the screen smears. LITE keeps it
      // affordable with a lighter shader (major grid lines only, solid mountains), never with fewer pixels.
      extras.add(dome);
      const own=dome;
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
        if(!own.parent){extras.userData.step=null;return;}   // the skin changed and buildExtras cleared us (and disposed the dome)
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
      };
    }
    if(SKIN.extras==='monarch')deepSky();
    if(SKIN.extras==='tron')tronBuild();
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
  // ── TRON: the Grid ──
  // A black void, a cyan light-grid floor under the galaxy that melts into the dark at the horizon (world-space lines on a plane that
  // follows the camera, anti-aliased per pixel, cells under a few pixels fade out so there's no moiré), a faint horizon glow,
  // light-trail links (an additive copy of the link geometry with a light racing along each), a neon ring round every sun, a soft
  // glow behind every node, and light cycles racing the floor grid on crisp 90° turns, each laying a light wall.
  // Per frame the CPU moves a handful of bikes and rewrites their few trail vertices; everything else is one time uniform.
  const TRON_COLS=[0x00e5ff,0xff8a1f,0xff2bd6,0xffe23a,0x39ff9f];
  let tronBikes=[],tronCell=1,tronZ0=0;
  function tronBuild(){
    const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
    const R=Math.max(60,galaxyR),z0=-R*1.02,cell=R*0.095,T={t:0};tronCell=cell;tronZ0=z0;
    const add=o=>{o.frustumCulled=false;extras.add(o);return o;};
    // horizon: a dome at infinity, black with a thin cyan haze where the floor meets the sky
    const dome=add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,
      vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec3 vDir;void main(){float e=normalize(vDir).z;vec3 c=vec3(0.0,0.62,0.78)*exp(-abs(e+0.02)*36.0)*0.15+vec3(0.0,0.18,0.26)*exp(-abs(e)*7.0)*0.06;
 gl_FragColor=vec4(c*(e<-0.02?0.5:1.0),1.0);}`})));dome.renderOrder=-10;
    const U={uCell:{value:cell},uR:{value:R}};
    const floor=add(new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({uniforms:U,defines:LITE?{LITE:1}:{},extensions:{derivatives:true},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader:`uniform float uCell,uR;varying vec3 vW;
float gline(vec2 g,vec2 fw,float w,out float glow){vec2 l=abs(fract(g+0.5)-0.5)/max(fw,1e-4);float px=min(l.x,l.y);float fade=1.0-smoothstep(0.16,0.45,max(fw.x,fw.y));
  glow=exp(-px*0.32)*fade;return (1.0-smoothstep(w,w+1.0,px))*fade;}
void main(){vec2 P=vW.xy/uCell,fw=fwidth(P);float g1,g2;
  float mi=gline(P,fw,0.2,g1),mj=gline(P*0.25,fw*0.25,0.55,g2);
  float d=length(vW.xy-cameraPosition.xy)/uR;
  vec3 cy=vec3(0.0,0.86,1.0);
  vec3 c=cy*(mi*0.16+mj*0.44+g2*0.12);
#ifndef LITE
  c+=cy*g1*0.05;
  c+=vec3(0.0,0.3,0.4)*exp(-dot(vW.xy,vW.xy)/(uR*uR*1.8))*0.07;   // a faint pool of light under the galaxy
#endif
  c*=mix(0.5,1.0,smoothstep(0.45,1.25,length(vW.xy)/uR));   // dimmer under the galaxy, so the links read over it
  gl_FragColor=vec4(c*exp(-d*d*0.04),1.0);}`})));floor.position.z=z0;floor.renderOrder=-9;
    // light-trail links: same position + colour buffers as the real links (hover highlights and focus dimming land), additive,
    // neon, with a light racing from each link's source to its target
    let neon=null,neonOf=null,few=false;
    const LU={uOp:{value:0.6},uT:{value:0},uFog:{value:SKIN.fog}};
    const attach=()=>{
      if(neon){extras.remove(neon);neon.geometry.dispose();neon.material.dispose();neon=null;}
      neonOf=lines;if(!lines||!edgeGeom)return;
      const n=edgeGeom.attributes.position.count;few=n<800;const A=new Float32Array(n),S=new Float32Array(n);for(let i=0;i<n;i+=2){A[i+1]=1;S[i]=S[i+1]=((i>>1)*0.6180339)%1;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',edgeGeom.attributes.position);g.setAttribute('color',edgeColor);g.setAttribute('aT',new THREE.BufferAttribute(A,1));g.setAttribute('aS',new THREE.BufferAttribute(S,1));
      neon=add(new THREE.LineSegments(g,new THREE.ShaderMaterial({uniforms:LU,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
        vertexShader:`attribute float aT,aS;varying vec3 vC;varying float vT,vS,vD;void main(){vC=color;vT=aT;vS=aS;vec4 mv=modelViewMatrix*vec4(position,1.0);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
        fragmentShader:`uniform float uOp,uT,uFog;varying vec3 vC;varying float vT,vS,vD;
void main(){float x=fract(vS+uT*(0.16+vS*0.12));float d=fract(x-vT);float p=exp(-d*7.0)*step(0.0,x-vT+1.0);
 vec3 c=vC*(1.9+2.2*p)+vec3(1.0)*p*p*0.45;gl_FragColor=vec4(c,min(1.0,uOp*(0.62+0.9*p)*exp(-uFog*uFog*vD*vD)));}`})));
      lines.visible=false;};
    // a neon ring round every sun, in its group colour
    const vis=sunIds.filter(id=>sysBySun[id]);
    if(vis.length){const rg=new THREE.RingGeometry(0.9,1,72);const im=new THREE.InstancedMesh(rg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}),vis.length);
      const q=new THREE.Quaternion(),sc=new THREE.Vector3();
      vis.forEach((id,i)=>{const s=sysBySun[id],r=rSun(s)*1.8;_m.compose(pos[id],q.setFromEuler(s.tilt),sc.set(r,r,r));im.setMatrixAt(i,_m);im.setColorAt(i,skinCol(_c,s.color));});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;add(im);
      for(const id of vis)if(sunLbl[id])sunLbl[id].style.setProperty('--sys','#'+skinCol(_c,sysBySun[id].color).getHexString());}
    glows.forEach(g=>{if(g.isSprite&&g.material.opacity>0.5)g.material.opacity=0.42;});
    // soft glow behind every node (one draw)
    let halo=null;const ids=planetIds.concat(sunIds);
    if(!LITE&&ids.length){const P=new Float32Array(ids.length*3),C=new Float32Array(ids.length*3),S=new Float32Array(ids.length);
      ids.forEach((id,i)=>{const p=pos[id],sun=i>=planetIds.length;P[i*3]=p.x;P[i*3+1]=p.y;P[i*3+2]=p.z;skinCol(_c,base[id].color);C[i*3]=_c.r;C[i*3+1]=_c.g;C[i*3+2]=_c.b;S[i]=sun?rSun(sysBySun[id])*4.4:rPlanet(id)*4;});
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('aColor',new THREE.BufferAttribute(C,3));g.setAttribute('aSize',new THREE.BufferAttribute(S,1));
      const m=new THREE.ShaderMaterial({vertexShader:JV_HALO_VS,fragmentShader:JV_HALO_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:jvU({uScale:1,uI:0.28,uFog:SKIN.fog,uFade:420,uBoost:1.2})});
      add(new THREE.Points(g,m));halo=m.uniforms;}
    // light cycles on the floor grid: they ride grid lines inside an arena under the galaxy (sized to what the home view shows),
    // go straight or turn a crisp 90° at an intersection, and always turn back in at the arena's edge
    tronBikes.forEach(b=>{b.bike.dispose();});tronBikes=[];
    const rng=seeded(2001),nB=LITE?2:4,Lb=cell*1.1,AX=Math.round(R*Math.min(1.4,Math.max(0.5,1.05*camera.aspect))/cell),Y0=Math.round(-R*0.6/cell),Y1=Math.round(R*0.45/cell);
    const DIR=[[1,0],[0,1],[-1,0],[0,-1]],inside=(x,y)=>x>=-AX&&x<=AX&&y>=Y0&&y<=Y1;
    for(let i=0;i<nB;i++){const col=new THREE.Color(TRON_COLS[i%TRON_COLS.length]),bike=makeCycle(col);bike.g.scale.setScalar(Lb);add(bike.g);
      const rb=makeRibbon(LITE?16:32,col,Lb*0.5,cell*(RM?2.6:LITE?7:14),Lb*0.5);add(rb.m);
      const gx=Math.round((rng()*2-1)*AX*0.8),gy=Math.round(Y0+(Y1-Y0)*(0.15+rng()*0.7)),d=Math.floor(rng()*4);
      const b={bike,rb,gx,gy,d,u:0,spd:(2.2+rng()*0.9),yaw:Math.atan2(DIR[d][1],DIR[d][0]),p:new THREE.Vector3()};
      const back=RM?2.4:1;rb.pts.push({p:new THREE.Vector3((gx-DIR[d][0]*back)*cell,(gy-DIR[d][1]*back)*cell,z0),n:_UPZ});   // where the wall starts (parked under reduced motion: a short one)
      tronBikes.push(b);}
    const bikeStep=dt=>{
      for(const b of tronBikes){
        if(!RM){b.u+=b.spd*dt;
          while(b.u>=1){b.u-=1;b.gx+=DIR[b.d][0];b.gy+=DIR[b.d][1];   // at an intersection
            const nx=b.gx+DIR[b.d][0],ny=b.gy+DIR[b.d][1];
            if(!inside(nx,ny)||rng()<0.16){const L=(b.d+1)%4,Rt=(b.d+3)%4,opts=[L,Rt].filter(k=>inside(b.gx+DIR[k][0],b.gy+DIR[k][1]));
              const nd=opts.length?opts[Math.floor(rng()*opts.length)]:(b.d+2)%4;if(nd!==b.d){b.d=nd;b.rb.pts.unshift({p:new THREE.Vector3(b.gx*cell,b.gy*cell,z0),n:_UPZ});if(b.rb.pts.length>b.rb.cap)b.rb.pts.length=b.rb.cap;}}}}
        const dx=DIR[b.d][0],dy=DIR[b.d][1];b.p.set((b.gx+dx*b.u)*cell,(b.gy+dy*b.u)*cell,z0);
        let dy2=Math.atan2(dy,dx)-b.yaw;dy2-=Math.round(dy2/(Math.PI*2))*Math.PI*2;b.yaw+=dy2*Math.min(1,dt*28);   // a crisp turn, not a snap
        // from far off a bike (and its wall) grows up to 2.2× so it stays a readable ~26 px; up close it's true to the grid
        const k=Math.min(2.2,Math.max(1,(26*camera.position.distanceTo(b.p)/pxPer())/Lb));b.rb.h=Lb*0.5*k;b.rb.m.material.uniforms.uGap.value=Lb*0.5*k;
        b.bike.g.position.copy(b.p);b.bike.g.rotation.set(0,0,b.yaw);b.bike.g.scale.setScalar(Lb*k);ribbonWrite(b.rb,b.p,_UPZ);}};
    bikeStep(0);
    const own=dome,sc=()=>(renderer.domElement.height/2)/Math.tan(camera.fov*Math.PI/360);
    extras.userData.step=(dt)=>{
      if(!own.parent){extras.userData.step=null;tronBikes.forEach(b=>b.bike.dispose());tronBikes=[];return;}   // the skin changed and buildExtras cleared us
      if(lines!==neonOf)attach();
      if(neon&&lines)LU.uOp.value=lines.material.opacity*(few?1.25:0.7);
      if(!RM){T.t+=dt;LU.uT.value=T.t;}
      if(suns&&suns.material.uniforms&&suns.material.uniforms.uT)suns.material.uniforms.uT.value=T.t;
      if(halo)halo.uScale.value=sc();
      const cp=camera.position;dome.position.copy(cp);const h=Math.max(1,cp.z-z0),fs=Math.max(h*80,R*40);floor.position.set(cp.x,cp.y,z0);floor.scale.set(fs,fs,1);
      bikeStep(dt);};
  }
  function extrasStep(dt,now){
    if(extras.userData.step)extras.userData.step(dt,now);
    if(JV)jvStep(dt,now);
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
    followSince=now;followUntil=now+(useW?25000:40000)+seedRng()*25000;idleEl.innerHTML=useW?(SKIN.cycles?ICO.cycle+'Riding along with a light cycle — move the mouse to take over':ICO.kinesin+'Watching a kinesin at work — move the mouse to take over'):ICO.butterfly+'Riding along with a monarch — move the mouse to take over';}
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
    relabel(){if(focused!=null)showSystemLabels(focused);},lite:LITE,
    monarchScreen(i){const m=monarchs[i||0];if(!m)return null;_v.copy(m.g.position).project(camera);return [(_v.x+1)/2*window.innerWidth,(1-_v.y)/2*window.innerHeight];},
    bikes(){return tronBikes.map(b=>[b.gx,b.gy,b.d,+b.u.toFixed(2),b.rb.pts.length]);},
    bikeCam(i){const b=tronBikes[i||0];if(!b)return;tw=null;controls.autoRotate=false;const c=tronCell,f=new THREE.Vector3(Math.cos(b.yaw),Math.sin(b.yaw),0);
      const sd=c*3.4*Math.min(1,camera.aspect);controls.target.copy(b.p).addScaledVector(f,c*(camera.aspect<1?1:3));camera.position.copy(b.p).addScaledVector(f,-c*6).add(new THREE.Vector3(-f.y*sd,f.x*sd,c*2.6));controls.update();},
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
// JARVIS picker card: a miniature of the tactical display (holo systems, ring stacks, radar table, HUD chrome)
function jarvisPreview(s){
  const W=240,H=135,A=s.css.accent,I='#bffbff',C2=s.css['accent-2'];let _r=7;const rng=()=>{_r=(_r*9301+49297)%233280;return _r/233280;};const f=n=>n.toFixed(1);
  let o=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="jv-bg" cx=".42" cy=".46" r=".75"><stop offset="0" stop-color="#083440"/><stop offset=".55" stop-color="#03141b"/><stop offset="1" stop-color="${s.css.sky}"/></radialGradient>`+
    `<radialGradient id="jv-core"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${I}" stop-opacity=".8"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></radialGradient>`+
    `<radialGradient id="jv-orb" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="${A}" stop-opacity=".06"/><stop offset=".92" stop-color="${I}" stop-opacity=".55"/><stop offset="1" stop-color="${I}" stop-opacity=".9"/></radialGradient>`+
    `<linearGradient id="jv-sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${A}" stop-opacity="0"/><stop offset="1" stop-color="${A}" stop-opacity=".45"/></linearGradient>`+
    `<pattern id="jv-scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" opacity=".28"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#jv-bg)"/>`;
  for(let i=0;i<46;i++)o+=`<circle cx="${f(rng()*W)}" cy="${f(rng()*H)}" r=".45" fill="${I}" opacity="${(0.2+rng()*0.5).toFixed(2)}"/>`;
  // radar table under the scene
  o+=`<g transform="translate(118 114) scale(1 .24)" fill="none" stroke="${A}"><circle r="104" stroke-opacity=".55"/><circle r="72" stroke-opacity=".3"/><circle r="40" stroke-opacity=".3"/><path d="M-104 0H104M0 -104V104" stroke-opacity=".18"/><path d="M0 0L104 0A104 104 0 0 0 74 -73Z" fill="url(#jv-sw)" stroke="none"/></g>`;
  const sys=[[84,60,1],[182,40,0.62],[160,98,0.5]],hue=['#6fd6e8','#8fe0c0','#d9dc9a','#86b8f0','#c9aef0'];
  o+=`<g stroke="${A}" stroke-opacity=".4" stroke-width=".7"><line x1="84" y1="60" x2="182" y2="40"/><line x1="84" y1="60" x2="160" y2="98"/><line x1="182" y1="40" x2="160" y2="98"/><line x1="60" y1="72" x2="182" y2="40" stroke-opacity=".18"/></g>`;
  sys.forEach(([cx,cy,k],si)=>{const orb=34*k,n=si?6:8;
    o+=`<circle cx="${cx}" cy="${cy}" r="${f(22*k)}" fill="url(#jv-core)" opacity=".35"/>`;
    o+=`<ellipse cx="${cx}" cy="${cy}" rx="${f(orb)}" ry="${f(orb*0.56)}" fill="none" stroke="${A}" stroke-opacity=".35" stroke-dasharray="2.2 1.2"/>`;
    o+=`<g fill="none" stroke="${C2}"><circle cx="${cx}" cy="${cy}" r="${f(12*k)}" stroke-dasharray="2 1.4" stroke-opacity=".85" stroke-width=".7"/><circle cx="${cx}" cy="${cy}" r="${f(14.5*k)}" stroke-opacity=".4" stroke-width=".4"/>`+
      `<circle cx="${cx}" cy="${cy}" r="${f(17*k)}" stroke-dasharray=".45 1.4" stroke-width="2.4" stroke-opacity=".45"/><circle cx="${cx}" cy="${cy}" r="${f(20.5*k)}" stroke-dasharray="${f(9*k)} ${f(12.5*k)}" stroke-width="1.6" stroke-opacity=".8"/></g>`;
    for(let q=0;q<n;q++){const a=q/n*6.283+si*0.7,x=cx+Math.cos(a)*orb,y=cy+Math.sin(a)*orb*0.56,r=(1.8+((q*5)%3)*0.6)*(0.6+0.4*k),c=hue[(q+si)%hue.length];
      o+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r*2.2)}" fill="url(#jv-core)" opacity=".18"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width=".7"/>`;
      if(q%3===0)o+=`<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="${A}" stroke-opacity=".3" stroke-width=".5"/>`;}
    const R=6.5*k+1.5;o+=`<circle cx="${cx}" cy="${cy}" r="${f(R)}" fill="url(#jv-orb)" stroke="${I}" stroke-width=".7"/><ellipse cx="${cx}" cy="${cy}" rx="${f(R)}" ry="${f(R*0.38)}" fill="none" stroke="${I}" stroke-opacity=".5" stroke-width=".4"/><ellipse cx="${cx}" cy="${cy}" rx="${f(R*0.38)}" ry="${f(R)}" fill="none" stroke="${I}" stroke-opacity=".5" stroke-width=".4"/>`;});
  // lock-on brackets on a planet, with its callout
  const lx=118,ly=67;o+=`<g fill="none" stroke="#dffcff" stroke-width=".9"><path d="M${lx-7} ${ly-3}v-4h4M${lx+3} ${ly-7}h4v4M${lx-7} ${ly+3}v4h4M${lx+3} ${ly+7}h4v-4"/></g><path d="M${lx+7} ${ly-7}l6 -6h22" fill="none" stroke="${A}" stroke-opacity=".7" stroke-width=".6"/><rect x="${lx+13}" y="${ly-19}" width="30" height="5" fill="#04323c" fill-opacity=".8"/><rect x="${lx+15}" y="${ly-17.5}" width="18" height="2" fill="${C2}" opacity=".9"/>`;
  // HUD chrome: corner brackets, readout block, heading tape, edge arc
  o+=`<g stroke="${A}" fill="none" stroke-width="1.1" opacity=".9"><path d="M5 15V5h10M235 15V5h-10M5 120v10h10M235 120v10h-10"/></g>`;
  o+=`<path d="M9 22h40l4 4v22H13l-4 -4z" fill="#04323c" fill-opacity=".5" stroke="${A}" stroke-opacity=".5" stroke-width=".6"/><rect x="12" y="25" width="16" height="2" fill="${A}"/><circle cx="48" cy="26" r="1" fill="#ff6b78"/>`+[0,1,2].map(i=>`<rect x="12" y="${30+i*4.2}" width="10" height="1.6" fill="${C2}" opacity=".5"/><rect x="${36+((i*5)%7)}" y="${30+i*4.2}" width="${12-((i*5)%7)}" height="1.6" fill="#dffcff" opacity=".85"/>`).join('')+
    [0,1,2,3,4,5,6,7,8,9].map(i=>`<rect x="${12+i*3.6}" y="${46-(2+((i*7)%5)*0.9)}" width="2.4" height="${f(2+((i*7)%5)*0.9)}" fill="${A}" opacity=".75"/>`).join('');
  for(let i=0;i<=20;i++){const x=96+i*2.4;o+=`<line x1="${f(x)}" y1="${i%5?8:6}" x2="${f(x)}" y2="11" stroke="${A}" stroke-opacity="${i%5?.35:.8}" stroke-width=".6"/>`;}
  o+=`<path d="M120 12.5l-2 2.6h4z" fill="#dffcff"/><path d="M14 44A240 240 0 0 0 14 104" fill="none" stroke="${A}" stroke-opacity=".45" stroke-width=".6"/>`+[0,1,2,3,4,5,6,7,8].map(i=>{const y=50+i*6.5;return `<line x1="${i%4?11.5:9.5}" y1="${f(y)}" x2="13.4" y2="${f(y)}" stroke="${A}" stroke-opacity=".6" stroke-width=".6"/>`;}).join('');
  return o+`<rect width="${W}" height="${H}" fill="url(#jv-scan)"/></svg>`;
}
// TRON picker card: the Grid in miniature — a black void, a cyan light-grid floor running to a glowing horizon, identity-disc
// systems joined by light trails, and two light cycles laying their walls on the floor
function tronPreview(s){
  const W=240,H=135,HY=64,VX=120,A=s.css.accent;const f=n=>n.toFixed(1);let _r=5;const rng=()=>{_r=(_r*9301+49297)%233280;return _r/233280;};
  let o=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tr-hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A}" stop-opacity="0"/><stop offset=".78" stop-color="${A}" stop-opacity=".22"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="tr-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#001419"/></linearGradient><radialGradient id="tr-gl"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".3" stop-color="${A}" stop-opacity=".45"/><stop offset="1" stop-color="${A}" stop-opacity="0"/></radialGradient>`+
    `<filter id="tr-bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter></defs><rect width="${W}" height="${H}" fill="#000"/><rect y="${HY}" width="${W}" height="${H-HY}" fill="url(#tr-fl)"/><rect y="${HY-16}" width="${W}" height="20" fill="url(#tr-hz)"/>`;
  // floor grid in perspective: rays from the vanishing point, rows closing up toward the horizon
  const row=j=>HY+Math.pow(j/9,2.2)*(H-HY),X=(gx,y)=>VX+gx*(y-HY)*0.3;
  let g='';for(let i=-22;i<=22;i++)g+=`<line x1="${VX}" y1="${HY}" x2="${f(X(i,H+8))}" y2="${H+8}" stroke-opacity="${i%4?0.3:0.7}"/>`;
  for(let j=1;j<=9;j++){const y=row(j);g+=`<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}" stroke-opacity="${(0.12+0.6*j/9).toFixed(2)}"/>`;}
  o+=`<g stroke="${A}" stroke-width=".6">${g}</g><rect y="${HY-0.6}" width="${W}" height="1.2" fill="${A}" opacity=".85"/>`;
  // light cycles: a wall (a thin bright-topped band) along grid lines with a 90° corner, the bike at its head
  const P=(gx,j)=>{const y=row(j);return [X(gx,y),y];},sc=j=>0.35+j/9*0.9;
  const cycle=(pts,col,j,dir)=>{let wall='',top='';for(let k=0;k<pts.length-1;k++){const [a,b]=[P(...pts[k]),P(...pts[k+1])],ha=5.2*sc(pts[k][1]),hb=5.2*sc(pts[k+1][1]);
      wall+=`<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(b[0])} ${f(b[1]-hb)}L${f(a[0])} ${f(a[1]-ha)}Z" fill="${col}" fill-opacity="${(0.2+0.25*k/pts.length).toFixed(2)}"/>`;
      top+=`<path d="M${f(a[0])} ${f(a[1]-ha)}L${f(b[0])} ${f(b[1]-hb)}" stroke="${col}" stroke-width="${f(0.6+0.5*k/pts.length)}" stroke-opacity="${(0.4+0.6*k/pts.length).toFixed(2)}"/>`;}
    const [hx,hy]=P(...pts[pts.length-1]),k=sc(j);
    return wall+top+`<circle cx="${f(hx)}" cy="${f(hy-2*k)}" r="${f(9*k)}" fill="url(#tr-gl)" opacity=".55"/><g transform="translate(${f(hx)} ${f(hy)}) scale(${f(k*dir)} ${f(k)})"><path d="M-9 -3.2C-8 -6.4 -5 -7.4 -2 -6.8L1 -5.4L4 -7C7 -7.4 10 -6.2 11 -3.6L10 -2.4H-8.2Z" fill="#02080a" stroke="${col}" stroke-width=".8"/>`+
      `<circle cx="-5.4" cy="-3" r="3" fill="#000" stroke="${col}" stroke-width="1.3"/><circle cx="6.4" cy="-3" r="3" fill="#000" stroke="${col}" stroke-width="1.3"/></g>`;};
  o+=cycle([[-7,3.2],[-7,6.4],[-2,6.4],[-2,8.4]],'#ff8a1f',8.4,1)+cycle([[8,2.4],[8,5.2],[3.5,5.2],[3.5,7.4]],A,7.4,-1);
  // the graph above the floor: identity-disc systems joined by light trails
  const sys=[[68,34,1.25],[170,26,0.9],[128,52,0.7]],cols=['#00e5ff','#ff2bd6','#ffe23a','#39ff9f','#ff8a1f'];
  o+=`<g stroke="${A}" stroke-width=".7"><line x1="68" y1="34" x2="170" y2="26" stroke-opacity=".75"/><line x1="68" y1="34" x2="128" y2="52" stroke-opacity=".5"/><line x1="170" y1="26" x2="128" y2="52" stroke-opacity=".5"/></g><circle cx="${f(68+102*0.62)}" cy="${f(34-8*0.62)}" r="1.3" fill="#fff"/>`;
  sys.forEach(([cx,cy,k],si)=>{const c=cols[si],n=si?5:7;
    for(let q=0;q<n;q++){const a=q/n*6.283+si,rr=(15+((q*7)%3)*4)*k,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*0.5,pc=cols[(q+si+1)%cols.length];
      o+=`<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="${pc}" stroke-opacity=".3" stroke-width=".5"/><circle cx="${f(x)}" cy="${f(y)}" r="2.1" fill="#001014" stroke="${pc}" stroke-width=".9"/><circle cx="${f(x)}" cy="${f(y)}" r=".7" fill="${pc}"/>`;}
    o+=`<ellipse cx="${cx}" cy="${cy}" rx="${f(11*k+3)}" ry="${f((11*k+3)*0.5)}" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width=".8"/><circle cx="${cx}" cy="${cy}" r="${f(9*k)}" fill="url(#tr-gl)" opacity=".5"/>`+
      `<circle cx="${cx}" cy="${cy}" r="${f(5*k+1.5)}" fill="#001014" stroke="${c}" stroke-width="1.1"/><circle cx="${cx}" cy="${cy}" r="${f(3*k+0.8)}" fill="none" stroke="${c}" stroke-width=".5" stroke-dasharray="1.6 .8"/><circle cx="${cx}" cy="${cy}" r="${f(1.6*k+0.6)}" fill="#fff"/>`;});
  for(let i=0;i<14;i++)o+=`<circle cx="${f(rng()*W)}" cy="${f(rng()*(HY-22))}" r=".35" fill="${A}" opacity="${(0.15+rng()*0.3).toFixed(2)}"/>`;
  return o+`<path d="M4 12V4h8M236 12V4h-8M4 123v8h8M236 123v8h-8" fill="none" stroke="${A}" stroke-opacity=".7" stroke-width=".8"/></svg>`;
}
function previewSVG(s){
  if(s.pv&&s.pv.holo)return jarvisPreview(s);
  if(s.pv&&s.pv.tron)return tronPreview(s);
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
  if(pv.sun){const k='sw-'+s.name.replace(/\W/g,'');   // outrun sunset: haze, a banded sun and a neon mountain line on the horizon (y=74)
    o+=`<defs><linearGradient id="${k}-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0b52" stop-opacity="0"/><stop offset=".55" stop-color="#3a0b52" stop-opacity=".75"/><stop offset="1" stop-color="#c02a92"/></linearGradient><linearGradient id="${k}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe86b"/><stop offset=".55" stop-color="#ff5ea8"/><stop offset="1" stop-color="#b02ee0"/></linearGradient><radialGradient id="${k}-g"><stop offset=".5" stop-color="#ff3fd0" stop-opacity=".5"/><stop offset="1" stop-color="#ff3fd0" stop-opacity="0"/></radialGradient><mask id="${k}-m"><rect width="${W}" height="${H}" fill="#fff"/>${[[56,.9],[61,1.4],[65.5,1.9],[69.5,2.4],[73,2.9]].map(([y,h])=>`<rect y="${y}" width="${W}" height="${h}" fill="#000"/>`).join('')}</mask></defs>`
      +`<rect y="20" width="${W}" height="54" fill="url(#${k}-h)"/><circle cx="120" cy="52" r="46" fill="url(#${k}-g)"/><circle cx="120" cy="52" r="26" fill="url(#${k}-s)" mask="url(#${k}-m)"/>`
      +`<path d="M0 74 L14 69 L24 72 L40 62 L52 70 L64 66 L78 74 Z M150 74 L166 67 L176 71 L192 60 L206 70 L220 65 L240 72 L240 74 Z" fill="#12042a" stroke="#ff5fd6" stroke-width=".7" stroke-linejoin="round"/>`;}
  if(pv.grid){o+=`<rect y="74" width="${W}" height="${H-74}" fill="#0d0322"/><rect y="73.4" width="${W}" height="1.2" fill="#ff7ae0" opacity=".9"/>`;
    for(let i=-12;i<=12;i++){const x=120+i*26;o+=`<line x1="${x}" y1="${H}" x2="${(120+i*2.2).toFixed(1)}" y2="74" stroke="#ff3fd0" stroke-opacity=".5" stroke-width=".7"/>`;}
    for(let j=1;j<9;j++){const y=74+Math.pow(j/8,2.1)*(H-74);o+=`<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="#ff3fd0" stroke-opacity="${(0.15+0.5*j/8).toFixed(2)}" stroke-width=".7"/>`;}}
  const sys=[[74,64,24],[158,48,17],[128,102,13]],cols=pv.cols;
  o+=`<g stroke="${s.css.accent}" stroke-opacity=".45"><line x1="74" y1="64" x2="158" y2="48"/><line x1="74" y1="64" x2="128" y2="102"/><line x1="158" y1="48" x2="128" y2="102"/></g>`;
  sys.forEach(([cx,cy,r],si)=>{o+=`<circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="${cols[si%cols.length]}" opacity=".14"/>`;
    for(let k=0;k<9;k++){const a=k/9*6.28+si,rr=r*(0.55+0.45*((k*7)%3)/2),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr*0.7,c=cols[(k+si)%cols.length];
      o+=pv.wire?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="none" stroke="${c}" stroke-width=".8"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${c}"/>`;
      if(k%3===0)o+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-opacity=".35"/>`;}
    o+=`<circle cx="${cx}" cy="${cy}" r="4.2" fill="${pv.wire?s.css.accent:'#fff'}"/>`;});
  if(pv.rings)o+=`<g fill="none" stroke="${s.css.accent}"><circle cx="74" cy="64" r="30" stroke-dasharray="7 4" opacity=".8"/><circle cx="74" cy="64" r="36" stroke-dasharray="1 5" opacity=".55"/><circle cx="74" cy="64" r="42" stroke-dasharray="14 8" opacity=".35"/></g><g stroke="${s.css.accent}" opacity=".6"><path d="M6 6h14M6 6v14M234 6h-14M234 6v14M6 129h14M6 129v-14M234 129h-14M234 129v-14" fill="none" stroke-width="1.5"/></g>`;
  if(pv.butterfly){const bf=(x,y,k,a)=>`<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})" fill="#ff5fd6" stroke="#2a0648" stroke-width=".7" stroke-linejoin="round"><path d="M0 0C-2-7-11-12-15-8C-17-4-11 0 0 0ZM0 0C2-7 11-12 15-8C17-4 11 0 0 0Z"/><path d="M0 0C-1 3-7 9-10 6C-12 3-7 0 0 0ZM0 0C1 3 7 9 10 6C12 3 7 0 0 0Z" fill="#c43cf0"/><path d="M0-3.5V5" stroke-width="1.4" stroke-linecap="round"/></g>`;
    o+=bf(194,106,0.8,-14)+bf(42,114,0.5,12);}
  if(pv.deep){const bf=(x,y,k,a)=>`<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})" stroke="#140c06" stroke-width=".9" stroke-linejoin="round"><path d="M0 0C-2-7-11-12-15-8C-17-4-11 0 0 0ZM0 0C2-7 11-12 15-8C17-4 11 0 0 0Z" fill="#ec8a1e"/><path d="M0 0C-1 3-7 9-10 6C-12 3-7 0 0 0ZM0 0C1 3 7 9 10 6C12 3 7 0 0 0Z" fill="#c9640f"/><path d="M0-3.5V5" stroke-width="1.6" stroke-linecap="round"/><g fill="#fff4e6" stroke="none"><circle cx="-13.2" cy="-8.4" r=".8"/><circle cx="13.2" cy="-8.4" r=".8"/><circle cx="-14.8" cy="-5.6" r=".6"/><circle cx="14.8" cy="-5.6" r=".6"/></g></g>`;
    o+=bf(192,106,0.95,-14)+bf(38,114,0.6,12);}
  if(pv.scan)o+=`<rect width="${W}" height="${H}" fill="url(#scan-${s.name})"/>`;
  return o+'</svg>';
}
function applySkin(key,first){
  key=skinOf(key);if(!key)return;skinKey=key;SKIN=SKINS[key];
  const r=document.documentElement.style;Object.entries(SKIN.css).forEach(([k,v])=>r.setProperty('--'+k,v));if(!SKIN.css.font)r.removeProperty('--font');
  document.body.dataset.skin=key;const bm=document.getElementById('brand-mark');if(SKIN.icon)bm.innerHTML=SKIN.icon;else bm.textContent=SKIN.mark;document.getElementById('skin-name').textContent=SKIN.name;
  // the link riders are kinesins everywhere but TRON, where they're light cycles
  const cyc=!!SKIN.cycles,tx=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  tx('walkers-t',cyc?'Light cycles':'Kinesins');tx('walkers-s',cyc?'Light cycles riding some links, laying light walls — zoom in to watch them, click one to ride it':'Tiny carriers walking data along some links — zoom in to watch them, click one to walk it');
  tx('idle-s',cyc?'Left alone for 10 s, the camera rides a monarch or chases a light cycle':'Left alone for 10 s, the camera rides a monarch or watches a kinesin work');
  document.querySelectorAll('.skin').forEach(el=>el.classList.toggle('on',el.dataset.skin===key));
  try{localStorage.setItem('atlas.skin',key);}catch(e){}
  if(!first&&V3)V3.reskin();
}
const skinsEl=document.getElementById('skins'),skinsGrid=document.getElementById('skins-grid');
Object.entries(SKINS).forEach(([k,s])=>{const d=document.createElement('div');d.className='skin'+(k===skinKey?' on':'');d.dataset.skin=k;
  d.innerHTML=`${previewSVG(s)}<div class="meta"><b>${s.icon?`<span style="color:${s.css.accent};display:inline-flex">${s.icon}</span>`:s.mark} ${esc(s.name)}${k===DEFAULT_SKIN?'<em>default</em>':''}</b><p>${esc(s.tag)}</p><div class="chips">${s.features.map(f=>`<i>${esc(f)}</i>`).join('')}</div></div>`;
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
