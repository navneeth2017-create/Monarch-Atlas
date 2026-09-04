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
    --font:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif; }
  html,body{height:100%} body{margin:0;background:#0c0c11;color:var(--text);font-family:var(--font);font-size:13px;line-height:1.45;overflow:hidden}
  #graph,#graph3d{position:absolute;inset:0} #graph{background:var(--bg)} #graph3d canvas{display:block}
  body[data-view="3d"] #graph{display:none} body[data-view="2d"] #graph3d{display:none} body[data-view="2d"] #labels{display:none}
  #labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .lbl{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-size:11px;color:#c9c9d0;text-shadow:0 1px 2px #000,0 0 6px #000;opacity:0;transition:opacity .15s;will-change:transform;pointer-events:none}
  .lbl.on{opacity:1;pointer-events:auto;cursor:pointer} .lbl.on:hover{color:#fff} .lbl.dim{opacity:.3}
  .lbl.sun{font-weight:500;font-size:11.5px;color:#e6e6ea}
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
const state={labels:true,monarchs:true,nsize:1,lw:1,inferred:true,hidden:new Set(),rotate:true,speed:0.5,spacing:1,live:false,repel:2600,center:0.35,dist:80};
const edgeVisible=e=>state.inferred||e.confidence==='EXTRACTED';
const nodeVisible=id=>!state.hidden.has(base[id].community);

// ══════════════════════════════════════════ 3D — galaxy of solar systems ══
const V3=(()=>{
  if(!window.THREE)return null;
  const el=document.getElementById('graph3d'),lblLayer=document.getElementById('labels'),tip=document.getElementById('tip');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(window.innerWidth,window.innerHeight);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0c0c11);scene.fog=new THREE.FogExp2(0x0c0c11,0.00038);
  const camera=new THREE.PerspectiveCamera(55,window.innerWidth/window.innerHeight,0.5,40000);camera.up.set(0,0,1);
  const controls=new THREE.OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=0.07;controls.rotateSpeed=0.6;controls.zoomSpeed=0.9;controls.autoRotate=state.rotate;controls.autoRotateSpeed=state.speed;controls.maxDistance=30000;
  scene.add(new THREE.AmbientLight(0xffffff,0.55));
  const key=new THREE.DirectionalLight(0xffffff,0.75);key.position.set(0.4,0.8,1);scene.add(key);
  const rim=new THREE.DirectionalLight(0xE8873B,0.25);rim.position.set(-1,-0.4,-0.6);scene.add(rim);
  // stars
  (()=>{const N=3200,p=new Float32Array(N*3);for(let i=0;i<N;i++){const r=9000+Math.random()*9000,t=Math.random()*Math.PI*2,u=Math.random()*2-1,s=Math.sqrt(1-u*u);p[i*3]=r*s*Math.cos(t);p[i*3+1]=r*s*Math.sin(t);p[i*3+2]=r*u;}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x8a8aa0,size:14,sizeAttenuation:true,transparent:true,opacity:0.55,fog:false})));})();
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.55)');g.addColorStop(0.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);return t;})();
  const seeded=seed=>{let s=(seed*9301+49297)%233280;return()=>{s=(s*9301+49297)%233280;return s/233280;};};
  // ── layout: solar systems on a galaxy ──
  const systems=[],sysOf={},sysN={},sysRank={},sunRealm={},pos={},sunOf={},radiusOf={};
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
      s.r=(s.n===1?8:R+6);s.tilt=new THREE.Euler((rng()-0.5)*1.3,(rng()-0.5)*1.3,rng()*Math.PI);s.local=local;
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
  const geo=new THREE.SphereGeometry(1,16,12);
  let planets=null,suns=null,lines=null,glows=[],planetIds=[],sunIds=[],slotOf={},edgeSlots={},edgeGeom=null,edgeColor=null,edgeList=[];
  const _m=new THREE.Matrix4(),_c=new THREE.Color(),_s=new THREE.Vector3();
  const rPlanet=id=>(1.1+2.4*Math.sqrt(base[id].degree/maxDeg))*state.nsize;
  const rSun=s=>(3.6+3.2*Math.sqrt(s.n/maxN))*state.nsize;
  function clearMeshes(){[planets,suns,lines].forEach(o=>{if(o){scene.remove(o);if(o.geometry&&o!==planets&&o!==suns)o.geometry.dispose();o.material.dispose();}});glows.forEach(g=>{scene.remove(g);g.material.dispose();});glows=[];lblLayer.innerHTML='';sunLbl={};planetLbl={};realmLbl=[];}
  let sunLbl={},planetLbl={},realmLbl=[];
  function build(){
    clearMeshes();layout();
    planetIds=[];sunIds=[];slotOf={};
    systems.forEach(s=>{if(nodeVisible(s.sun))sunIds.push(s.sun);s.ids.slice(1).forEach(id=>{if(nodeVisible(id))planetIds.push(id);});});
    planets=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:0xffffff}),Math.max(1,planetIds.length));planets.count=planetIds.length;planets.name='planets';
    planetIds.forEach((id,i)=>{slotOf[id]={mesh:'p',i};_m.makeScale(rPlanet(id),rPlanet(id),rPlanet(id)).setPosition(pos[id]);planets.setMatrixAt(i,_m);planets.setColorAt(i,_c.set(base[id].color));});
    planets.instanceMatrix.needsUpdate=true;if(planets.instanceColor)planets.instanceColor.needsUpdate=true;scene.add(planets);
    suns=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x6a6a6a}),Math.max(1,sunIds.length));suns.count=sunIds.length;suns.name='suns';
    sunIds.forEach((id,i)=>{const s=systems.find(x=>x.sun===id);slotOf[id]={mesh:'s',i};const r=rSun(s);_m.makeScale(r,r,r).setPosition(pos[id]);suns.setMatrixAt(i,_m);suns.setColorAt(i,_c.set(s.color).lerp(new THREE.Color(0xffffff),0.2));
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:s.color,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));sp.position.copy(pos[id]);sp.scale.set(r*6,r*6,1);scene.add(sp);glows.push(sp);
      const d=document.createElement('div');d.className='lbl sun';d.textContent=s.label;d.dataset.id=id;d.addEventListener('click',()=>flyToSystem(s.cid));lblLayer.appendChild(d);sunLbl[id]=d;});
    suns.instanceMatrix.needsUpdate=true;if(suns.instanceColor)suns.instanceColor.needsUpdate=true;scene.add(suns);
    if(HAS_REALMS&&realmList.length>1)realmList.forEach(R=>{if(!R.name)return;const d=document.createElement('div');d.className='lbl realm';d.textContent=R.name;d.style.color=R.meta.color||'#fff';d.addEventListener('click',()=>flyToRealm(R.name));lblLayer.appendChild(d);realmLbl.push({d,R});
      const neb=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:R.meta.color||'#888',transparent:true,opacity:0.09,blending:THREE.AdditiveBlending,depthWrite:false}));neb.position.copy(R.c);neb.scale.set(R.r*2.4,R.r*2.4,1);scene.add(neb);glows.push(neb);});
    buildEdges();
    if(focused!=null)showSystemLabels(focused);
  }
  function buildEdges(){
    if(lines){scene.remove(lines);lines.geometry.dispose();lines.material.dispose();lines=null;}
    edgeList=RAW_EDGES.filter(e=>pos[e.from]&&pos[e.to]&&edgeVisible(e)&&nodeVisible(e.from)&&nodeVisible(e.to));
    const P=new Float32Array(edgeList.length*6),C=new Float32Array(edgeList.length*6);edgeSlots={};
    edgeList.forEach((e,i)=>{const a=pos[e.from],b=pos[e.to];P.set([a.x,a.y,a.z,b.x,b.y,b.z],i*6);(edgeSlots[e.from]=edgeSlots[e.from]||[]).push(i);(edgeSlots[e.to]=edgeSlots[e.to]||[]).push(i);paintEdge(C,i,e,false);});
    edgeGeom=new THREE.BufferGeometry();edgeGeom.setAttribute('position',new THREE.BufferAttribute(P,3));edgeColor=new THREE.BufferAttribute(C,3);edgeGeom.setAttribute('color',edgeColor);
    lines=new THREE.LineSegments(edgeGeom,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:Math.min(1,0.55*state.lw),depthWrite:false}));scene.add(lines);
  }
  function paintEdge(C,i,e,hot){
    if(hot){C.set([1,1,1,1,1,1],i*6);return;}
    const cross=sysOf[e.from]!==sysOf[e.to];const inf=e.confidence!=='EXTRACTED';
    _c.set(base[e.from].color).lerp(new THREE.Color(0x0c0c11),inf?0.72:(cross?0.45:0.55));
    if(cross&&!inf)_c.lerp(new THREE.Color(0xffffff),0.12);
    const xr=HAS_REALMS&&base[e.from].realm!==base[e.to].realm;
    if(xr)_c.set(base[e.from].color).lerp(new THREE.Color(0xffffff),0.55);
    if(focused!=null&&sysOf[e.from]!==focused&&sysOf[e.to]!==focused)_c.lerp(new THREE.Color(0x0c0c11),xr?0.5:0.8);
    C.set([_c.r,_c.g,_c.b,_c.r,_c.g,_c.b],i*6);
  }
  function repaintEdges(){if(!edgeColor)return;edgeList.forEach((e,i)=>paintEdge(edgeColor.array,i,e,false));edgeColor.needsUpdate=true;}
  // ── hover / select ──
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(-9,-9);let hover=null,pendingPick=false,selected=null;
  function idAt(hit){if(!hit)return null;return hit.object===planets?planetIds[hit.instanceId]:sunIds[hit.instanceId];}
  function pick(){pendingPick=false;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects([planets,suns].filter(Boolean));const id=idAt(hits[0]);if(id!==hover){setHover(id);}}
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
  renderer.domElement.addEventListener('click',ev=>{if(!downAt||Math.hypot(ev.clientX-downAt[0],ev.clientY-downAt[1])>4)return;pick();if(hover)select(hover);});
  renderer.domElement.addEventListener('dblclick',ev=>{pick();if(hover)flyToSystem(sysOf[hover]);else flyHome();});
  function select(id){selected=id;showCard(id);}
  // ── camera ──
  let tw=null,focused=null;
  function flyTo(p,t,ms){tw={p0:camera.position.clone(),p1:p.clone(),t0:controls.target.clone(),t1:t.clone(),s:performance.now(),ms:ms||1600};controls.autoRotate=false;}
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
    const W=window.innerWidth,H=window.innerHeight,cam=camera.position,taken=[];
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
      _v.copy(p).project(camera);if(_v.z>1){off(sunLbl[id]);continue;}
      cands.push({id,rank:sysRank[id],x:(_v.x+1)/2*W,y:(1-_v.y)/2*H-12});}
    cands.sort((a,b)=>a.rank-b.rank);
    for(const c of cands){const d=sunLbl[c.id];const [w,h]=box(d.textContent,11.5,6);put(d,c.x,c.y,w,h);d.classList.toggle('dim',focused!=null&&sysOf[c.id]!==focused);}
    // member names inside the focused system, best-connected first
    const pl=[];
    for(const id in planetLbl){const p=pos[id];const dist=cam.distanceTo(p);_v.copy(p).project(camera);
      if(_v.z>1||dist>420*state.spacing){off(planetLbl[id]);continue;}pl.push({id,deg:base[id].degree,x:(_v.x+1)/2*W,y:(1-_v.y)/2*H-rPlanet(id)*1.2-9});}
    pl.sort((a,b)=>b.deg-a.deg);
    for(const c of pl){const d=planetLbl[c.id];const [w,h]=box(d.textContent,11,6);put(d,c.x,c.y,w,h);}
  }
  // ── loop ──
  let running=false;
  function frame(){if(!running)return;requestAnimationFrame(frame);
    if(tw){let k=Math.min(1,(performance.now()-tw.s)/tw.ms);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;camera.position.lerpVectors(tw.p0,tw.p1,k);controls.target.lerpVectors(tw.t0,tw.t1,k);if(k>=1){tw=null;controls.autoRotate=state.rotate;}}
    const nowT=performance.now(),dt=Math.min(0.05,(nowT-lastT)/1000);lastT=nowT;updateMonarchs(dt,nowT);
    controls.update();if(pendingPick)pick();projectLabels();renderer.render(scene,camera);}
  function start(){if(running)return;running=true;frame();}
  function stop(){running=false;}
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
  window.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&view==='3d'&&!/INPUT|TEXTAREA/.test(ev.target.tagName))flyHome();});

  // ── monarchs: a few butterflies drifting through the galaxy ──
  // Built from primitives (no model to load): a body, four wings with a
  // hand-drawn monarch pattern, a slow flap with glide pauses, banking on
  // turns. They wander between systems and favour the one you're in.
  const monarchGroup=new THREE.Group();scene.add(monarchGroup);
  const monarchs=[];
  function wingTexture(kind){
    // 512px canvas per wing. Base (where it meets the body) is the left edge;
    // the forewing's tip points to the top-right (forward), the hindwing hangs back.
    const S=512,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
    const path=new Path2D();
    if(kind==='fore'){path.moveTo(10,330);path.bezierCurveTo(40,180,200,20,470,26);path.bezierCurveTo(500,60,478,190,420,290);path.bezierCurveTo(360,380,150,390,10,330);}
    else{path.moveTo(10,200);path.bezierCurveTo(90,80,330,70,450,180);path.bezierCurveTo(500,290,420,460,250,486);path.bezierCurveTo(120,496,10,380,10,200);}
    const base=kind==='fore'?[10,330]:[10,200];
    // orange with a warm gradient: deeper at the base, brighter at the tip
    const grad=x.createLinearGradient(0,0,S,0);grad.addColorStop(0,'#c9640f');grad.addColorStop(.35,'#ec8a1e');grad.addColorStop(1,'#f7a23a');
    x.fillStyle=grad;x.fill(path);
    x.save();x.clip(path);
    // veins: fine dark lines fanning from the base, with a few cross-veins
    x.strokeStyle='rgba(22,12,6,.95)';x.lineCap='round';x.lineWidth=3.2;
    const tips=kind==='fore'?[[470,26],[476,100],[456,190],[420,290],[340,352],[240,380],[130,372]]:[[450,180],[470,120],[478,260],[420,380],[330,450],[220,486],[110,470]];
    tips.forEach(([tx,ty],i)=>{x.beginPath();x.moveTo(base[0],base[1]);const bend=kind==='fore'?-26:14;x.quadraticCurveTo((base[0]+tx)*0.55,(base[1]+ty)*0.5+bend*(i-3)/3,tx,ty);x.stroke();});
    x.lineWidth=2.2;
    const cross=kind==='fore'?[[300,110,330,200],[330,200,300,300],[190,220,200,320]]:[[290,150,330,250],[330,250,280,360],[170,220,190,340]];
    cross.forEach(([a,b,c2,d])=>{x.beginPath();x.moveTo(a,b);x.quadraticCurveTo((a+c2)/2+18,(b+d)/2,c2,d);x.stroke();});
    // veins thicken into the black margin band
    x.lineWidth=46;x.strokeStyle='#120d09';x.stroke(path);
    // forewing apex is black with pale spots
    if(kind==='fore'){x.fillStyle='#120d09';x.beginPath();x.moveTo(330,60);x.bezierCurveTo(400,20,470,26,470,26);x.bezierCurveTo(500,60,478,190,440,250);x.bezierCurveTo(400,190,360,130,330,60);x.fill();}
    // two rows of white spots along the margin
    x.fillStyle='rgba(255,250,240,.96)';
    const outer=kind==='fore'?[[458,60],[470,110],[458,160],[436,214],[402,270],[352,322],[290,356],[220,372],[150,368]]:[[452,150],[468,210],[466,275],[434,350],[380,410],[300,458],[210,478],[120,458]];
    outer.forEach(([px,py],i)=>{x.beginPath();x.arc(px,py,i%2?4.2:6,0,7);x.fill();});
    const inner=kind==='fore'?[[430,120],[416,176],[386,236],[344,286],[290,322]]:[[428,190],[436,260],[402,330],[344,392],[268,432]];
    inner.forEach(([px,py])=>{x.beginPath();x.arc(px,py,3.2,0,7);x.fill();});
    if(kind==='fore'){x.fillStyle='rgba(255,190,110,.9)';[[372,96],[400,140],[352,132]].forEach(([px,py])=>{x.beginPath();x.arc(px,py,9,0,7);x.fill();});}
    // soft dark shading at the base, like real scales
    const sh=x.createRadialGradient(base[0],base[1],10,base[0],base[1],260);sh.addColorStop(0,'rgba(40,16,4,.55)');sh.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sh;x.fillRect(0,0,S,S);
    x.restore();
    const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;
  }
  const WING_TEX={fore:wingTexture('fore'),hind:wingTexture('hind')};
  const WING_GEO=new THREE.PlaneGeometry(1,1,1,1);WING_GEO.translate(0.5,0,0);WING_GEO.rotateX(Math.PI/2);   // x∈[0,1] out from the body, tip forward (+z)
  const BODY_GEO=new THREE.CylinderGeometry(0.045,0.028,1,8);BODY_GEO.rotateX(Math.PI/2);
  const seedRng=seeded(4242);
  function makeMonarch(size){
    const g=new THREE.Group();
    const body=new THREE.Mesh(BODY_GEO,new THREE.MeshLambertMaterial({color:0x17120e}));body.scale.set(size*1.3,size*1.3,size*0.6);g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.05*size,8,8),new THREE.MeshLambertMaterial({color:0x1a1410}));head.position.z=size*0.3;g.add(head);
    const ant=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(-0.09*size,0.06*size,0.22*size),new THREE.Vector3(0,0,0),new THREE.Vector3(0.09*size,0.06*size,0.22*size)]);
    const antL=new THREE.LineSegments(ant,new THREE.LineBasicMaterial({color:0x1a1410}));antL.position.z=size*0.3;g.add(antL);
    const wingMat=k=>new THREE.MeshBasicMaterial({map:WING_TEX[k],transparent:true,alphaTest:0.5,side:THREE.DoubleSide});
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
    const pool=systems.filter(s=>s.n>=2&&nodeVisible(s.sun));
    let s=null;
    if(focused!=null&&seedRng()<0.5)s=systems.find(x=>x.cid===focused);
    if(!s&&pool.length)s=pool[Math.floor(seedRng()*pool.length)];
    const c=s?s.c:new THREE.Vector3(),r=s?s.r:galaxyR*0.5;
    const d=new THREE.Vector3(seedRng()-0.5,seedRng()-0.5,(seedRng()-0.5)*0.7).normalize();
    m.target=c.clone().add(d.multiplyScalar(r*(0.7+seedRng()*0.9)));
    m.tNext=now+6+seedRng()*10;
  }
  function buildMonarchs(){
    monarchs.forEach(m=>monarchGroup.remove(m.g));monarchs.length=0;
    const count=HAS_REALMS&&realmList.length>1?8:5;
    const base=Math.min(26,Math.max(5,galaxyR*0.013));
    for(let i=0;i<count;i++){
      const size=base*(0.8+seedRng()*0.5);
      const {g,pivots}=makeMonarch(size);g.up.set(0,0,1);
      const m={g,pivots,size,pos:new THREE.Vector3((seedRng()-0.5)*galaxyR,(seedRng()-0.5)*galaxyR,(seedRng()-0.5)*galaxyR*0.3),vel:new THREE.Vector3(),
        speed:size*(1.1+seedRng()*0.5),phase:seedRng()*6.28,amp:1,ampT:1,modeAt:0,seed:seedRng()*100,heading:0,bank:0,target:null,tNext:0};
      g.position.copy(m.pos);monarchGroup.add(g);monarchs.push(m);
    }
  }
  const _fwd=new THREE.Vector3(),_look=new THREE.Vector3();
  function updateMonarchs(dt,now){
    if(!monarchGroup.visible)return;
    const t=now/1000;
    for(const m of monarchs){
      if(!m.target||t>m.tNext||m.pos.distanceTo(m.target)<m.size*2.5)monarchTarget(m,t);
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
      if(m.vel.lengthSq()>1e-6){_look.copy(m.g.position).add(m.vel);m.g.lookAt(_look);m.g.rotateZ(m.bank);}
    }
  }
  let lastT=performance.now();
  build();buildMonarchs();camera.position.copy(homeCam());controls.target.set(0,0,0);controls.update();
  return {start,stop,build,buildEdges,repaintEdges,flyToSystem,flyToNode,flyToRealm,flyHome,
    setMonarchs(on){monarchGroup.visible=!!on;},rebuildMonarchs:buildMonarchs,
    peekMonarch(i){const m=monarchs[i||0];if(!m)return;tw=null;controls.autoRotate=false;controls.target.copy(m.g.position);camera.position.copy(m.g.position).add(new THREE.Vector3(m.size*1.6,-m.size*2.6,m.size*1.4));controls.update();},
    setSpeed(v){controls.autoRotateSpeed=v;},setRotate(on){controls.autoRotate=on;},
    setLineOpacity(){if(lines)lines.material.opacity=Math.min(1,0.55*state.lw);},
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
const slider=(id,fmt,fn)=>{const el=document.getElementById(id),v=document.getElementById(id+'-v');el.addEventListener('input',()=>{v.textContent=fmt(parseFloat(el.value));fn(parseFloat(el.value));});};
slider('nsize',x=>x.toFixed(1),x=>{state.nsize=x;if(V3)V3.build();if(network)network.setOptions({nodes:{scaling:{min:4*x,max:36*x}}});});
slider('lw',x=>x.toFixed(1),x=>{state.lw=x;if(V3)V3.setLineOpacity();if(network)window.__lw2D();});
slider('speed',x=>x.toFixed(1),x=>{state.speed=x;if(V3)V3.setSpeed(x);});
slider('spacing',x=>x.toFixed(2),x=>{state.spacing=x;if(V3){V3.build();V3.rebuildMonarchs();}});
document.getElementById('rotate').addEventListener('change',ev=>{state.rotate=ev.target.checked;if(V3)V3.setRotate(state.rotate);});
slider('f-center',x=>x.toFixed(2),x=>{state.center=x;if(network)window.__physics2D();});
slider('f-repel',x=>String(x),x=>{state.repel=x;if(network)window.__physics2D();});
slider('f-dist',x=>String(x),x=>{state.dist=x;if(network)window.__physics2D();});
document.getElementById('live').addEventListener('change',ev=>{state.live=ev.target.checked;if(network)window.__physics2D();});
const panel=document.getElementById('settings'),minBtn=document.getElementById('min');
minBtn.addEventListener('click',()=>{panel.classList.toggle('min');minBtn.textContent=panel.classList.contains('min')?'+':'–';});
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


def build_document(*, title: str, stats: str, nodes_json: str, edges_json: str,
                   legend_json: str, hyperedge_script: str, G=None) -> str:
    """Assemble the Monarch Atlas graph.html."""
    import html as _h
    import os
    realms_json, realm_meta_json = _realms(G)
    title = _h.escape(os.environ.get("GRAPHIFY_ATLAS_TITLE") or "") or title
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
</head>
<body data-view="3d">
<div id="graph3d" role="application" aria-label="Knowledge graph, 3D"></div>
<div id="graph" role="application" aria-label="Knowledge graph, 2D"></div>
<div id="labels"></div>
<div id="tip"></div>
<div id="brand"><div class="mark">🦋</div><div class="name">Monarch Atlas<small>{title}</small></div></div>
<div id="crumb"><i id="crumb-dot"></i><span id="crumb-name"></span><button id="crumb-back">‹ Back to galaxy</button></div>
<div id="stats">{stats} · click a group to fly in · double-click a sun to dive · Esc to zoom out</div>
<div id="settings">
  <div class="bar"><b>Graph</b><span class="seg"><button data-v="3d" class="on">3D</button><button data-v="2d">2D</button></span><button id="home" title="Reset view">⌂</button><button id="min" title="Collapse">–</button></div>
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
    <label class="row"><span>Labels<span class="sub only-3d">Names appear once you fly into a group</span></span><input class="tg" type="checkbox" id="labels" checked></label>
    <label class="row only-3d"><span>Monarchs<span class="sub">A few butterflies drifting between the systems</span></span><input class="tg" type="checkbox" id="monarchs" checked></label>
    <div class="rng"><div class="top"><span>Node size</span><span id="nsize-v">1.0</span></div><input type="range" id="nsize" min="0.4" max="2.5" step="0.1" value="1"></div>
    <div class="rng"><div class="top"><span class="only-3d">Link brightness</span><span class="only-2d">Link thickness</span><span id="lw-v">1.0</span></div><input type="range" id="lw" min="0.2" max="2.5" step="0.1" value="1"></div>
  </div></details>
  <details class="only-3d"><summary>Motion</summary><div class="body">
    <label class="row"><span>Auto-rotate<span class="sub">Slow orbit around the galaxy</span></span><input class="tg" type="checkbox" id="rotate" checked></label>
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
{script}
</body>
</html>"""
