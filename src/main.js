import "./styles.css";
import en from "./i18n/en.json";
import fa from "./i18n/fa.json";
import zh from "./i18n/zh-CN.json";
import {Engine,MAXS,COLORS,CONT} from "./engine.js";
import {AI} from "./ai.js";
const L={en,fa,zh};


const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let lang="en";const t=k=>(L[lang]&&L[lang][k])||L.en[k]||k;
const ls={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
let cfg={snd:1,anim:matchMedia("(prefers-reduced-motion:reduce)").matches?0:1,sp:1};
try{Object.assign(cfg,JSON.parse(ls.g("dc_cfg")||"{}"))}catch(e){}
const saveCfg=()=>ls.s("dc_cfg",JSON.stringify(cfg));
/* ===== UI ===== */
let G=null,busy=false,sel=-1,tgts=[],vb=null,vb0={x:0,y:0,w:1000,h:500},snd=null,gameId=0,els=[],O=null,lastOpt=null,t0=0;
const SVGNS="http://www.w3.org/2000/svg",sleep=ms=>new Promise(r=>setTimeout(r,cfg.anim?ms/cfg.sp:Math.min(ms/cfg.sp,40))),nid=()=>Math.random().toString(36).slice(2,10);
const beep=(f,d=.08)=>{if(!cfg.snd)return;try{snd=snd||new AudioContext();const o=snd.createOscillator(),g=snd.createGain();o.frequency.value=f;o.type="triangle";g.gain.value=.05;o.connect(g);g.connect(snd.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,snd.currentTime+d);o.stop(snd.currentTime+d)}catch(e){}};
const lvl=p=>p.ai||(G&&G.auto&&!O?2:0);
const mine=()=>!!G&&!G.over&&(O?O.seats[G.turn]===O.me:!lvl(G.P[G.turn]));
function applyLang(){document.documentElement.lang=lang==="zh"?"zh-CN":lang;document.documentElement.dir=lang==="fa"?"rtl":"ltr";
 $$("[data-t]").forEach(e=>e.textContent=t(e.dataset.t));$("#howT").innerHTML=t("howT");$("#lang").value=$("#lang2").value=lang;ls.s("dc_lang",lang);if(G)refresh();if(O&&O.host&&!G&&$("#lob").firstChild)lobby()}
function show(id){$$(".scr").forEach(s=>s.classList.toggle("on",s.id===id))}
function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove("on"),1900)}
function buildMap(){const svg=$("#map"),mk=(n,a,p)=>{const e=document.createElementNS(SVGNS,n);for(const k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e};
 svg.innerHTML='<defs><radialGradient id="oc" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#143457"/><stop offset="1" stop-color="#050a14"/></radialGradient></defs>';
 mk("rect",{x:-60,y:-60,width:1120,height:620,fill:"url(#oc)"});
 const gr=mk("g",{stroke:"rgba(120,160,220,.1)","stroke-width":1});for(let i=0;i<=1000;i+=83)mk("line",{x1:i,y1:0,x2:i,y2:500},gr);for(let j=0;j<=500;j+=83)mk("line",{x1:0,y1:j,x2:1000,y2:j},gr);
 const land=mk("g",{fill:"#1e3350",stroke:"#1e3350","stroke-linecap":"round"}),lk=mk("g",{stroke:"rgba(255,255,255,.28)","stroke-width":1.6});
 G.T.forEach(T=>{mk("circle",{cx:T.x,cy:T.y,r:30,fill:CONT[T.cont].c,stroke:CONT[T.cont].c},land);T.nb.forEach(n=>{if(n<T.id)return;const U=G.T[n];if(Math.abs(U.x-T.x)>500)return;const d=Math.hypot(U.x-T.x,U.y-T.y),a={x1:T.x,y1:T.y,x2:U.x,y2:U.y};if(d<70)mk("line",{...a,"stroke-width":34,stroke:CONT[T.cont].c},land);mk("line",{...a,"stroke-dasharray":d<70?"0":"4 5"},lk)})});
 mk("g",{id:"lay"});mk("g",{id:"fx"});els=[];const lay=$("#lay");
 G.T.forEach(T=>{const g=mk("g",{class:"hx"},lay);mk("title",{},g);mk("circle",{cx:T.x,cy:T.y,r:T.S},g);const x=mk("text",{x:T.x,y:T.y},g),nm=mk("text",{x:T.x,y:T.y+T.S+8,class:"nm","font-size":7},g);nm.textContent=T.name;g.onclick=()=>{if(!drag.moved)clickT(T.id)};g.onmouseenter=()=>info(T.id);els.push(g)});
 vb={...vb0};setVB()}
let mus=null;
function music(){if(mus){clearInterval(mus);mus=null}if(!cfg.mus)return;try{snd=snd||new AudioContext();const sc=[0,3,5,7,10,12,15];mus=setInterval(()=>{if(!cfg.mus||snd.state!=="running")return;const o=snd.createOscillator(),g=snd.createGain(),n=snd.currentTime;o.type="sine";o.frequency.value=110*Math.pow(2,sc[Math.floor(Math.random()*sc.length)]/12)*(Math.random()<.3?2:1);g.gain.value=0;o.connect(g);g.connect(snd.destination);g.gain.linearRampToValueAtTime(.035,n+1.2);g.gain.linearRampToValueAtTime(0,n+3.5);o.start();o.stop(n+3.6)},1400)}catch(e){}}
function burst(T){const c=document.createElementNS(SVGNS,"circle");c.setAttribute("cx",T.x);c.setAttribute("cy",T.y);c.setAttribute("r",15);c.setAttribute("class","burst");$("#fx").appendChild(c);setTimeout(()=>c.remove(),900)}
function extra(){$("#map").classList.toggle("nonames",cfg.names===0);
 $("#share").innerHTML='<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;margin:4px 0 8px">'+G.P.map(p=>{const n=G.T.filter(x=>x.owner===p.id).length;return n?`<div style="flex:${n};background:${p.color}"></div>`:""}).join("")+"</div>";
 $("#cl").innerHTML=CONT.map((c,i)=>{const ts=G.T.filter(x=>x.cont===i),o=ts[0].owner,full=ts.every(x=>x.owner===o);return`<div style="font-size:12px;display:flex;gap:6px;align-items:center;margin-top:3px"><span class="dot" style="background:${c.c};color:${c.c}"></span>${t("cont"+i)} +${c.b}${full?` <b style="color:${G.P[o].color}">● ${G.P[o].name}</b>`:""}</div>`}).join("")}
function setVB(){$("#map").setAttribute("viewBox",`${vb.x} ${vb.y} ${vb.w} ${vb.h}`)}
function refresh(){if(!G)return;const cur=G.P[G.turn],m=mine();
 G.T.forEach((T,i)=>{const g=els[i],p=G.P[T.owner];g.querySelector("circle").style.fill=p.color;g.querySelector("text").textContent=T.n;g.querySelector("title").textContent=`${T.name} — ${p.name} — ${T.n} ${t("sold")}`;
  g.setAttribute("class","hx"+(sel===i?" sel":"")+(tgts.includes(i)?" tgt":"")+(sel>=0&&sel!==i&&!tgts.includes(i)?" dim":"")+(G.phase==="place"&&m&&T.owner===G.turn&&T.n<MAXS?" pl":""))});
 const alive=G.P.filter(p=>p.alive).length,you=p=>O&&O.seats[p.id]===O.me?" ★":"";
 $("#hud").innerHTML=`<span><span class="dot" style="color:${cur.color};background:${cur.color}"></span><b>${t("turn")}:</b> ${cur.name}${you(cur)}</span><span><b>${t("round")}:</b> ${G.round}</span><span><b>${t("left")}:</b> ${alive}/${G.P.length}</span>${G.phase==="place"?`<span><b>${t("place")}:</b> ${G.pool}</span>`:""}${G.auto?`<b>${t("autoOn")}</b>`:""}${O?`<span>${t("online")}${O.code?" "+O.code:""}</span>`:""}`;
 $("#pls").innerHTML=G.P.map(p=>{const ts=G.T.filter(x=>x.owner===p.id);return`<div class="pl${p.id===G.turn&&!G.over?" act":""}${p.alive?"":" dead"}"><span class="dot" style="color:${p.color};background:${p.color}"></span>${p.name}${you(p)}${p.alive?"":" ("+t("defeated")+")"}<small>${ts.length} ${t("terr")} · ${ts.reduce((s,x)=>s+x.n,0)} ${t("sold")}</small></div>`}).join("");
 $("#reinf").textContent=G.phase==="place"?`${t("placeLeft")}: ${G.pool}`:`${t("nextReinf")}: +${Engine.poolFor(G,G.turn)}`;
 $("#hist").innerHTML=`<b>${t("hist")}</b><br>`+G.hist.slice($("#hist").classList.contains("big")?-60:-6).reverse().map(h=>`<span style="color:${G.P[h.ao].color}">${h.a}</span> (${h.as}) → <span style="color:${G.P[h.do].color}">${h.d}</span> (${h.ds}) · ${h.win?t("conq"):(h.as===h.ds?t("tie")+"/":"")+t("held")}`).join("<br>");
 $("#bEnd").textContent=G.phase==="place"?t("autoPlace"):t("endturn");$("#bEnd").disabled=busy||!m;
 $("#bAuto").textContent=t("autoplay")+(G.auto?" ✓":"");$("#bAuto").disabled=!!O||G.over;if(sel<0)$("#info").innerHTML="";extra()}
function info(i){if(!G)return;const T=G.T[i],p=G.P[T.owner];$("#info").innerHTML=`<b style="color:${p.color}">${T.name}</b><br>${t("owner")}: ${p.name}<br>${t("sold")}: ${T.n} (${T.n} ${t("dice")})<br>${t("nb")}: ${T.nb.map(n=>G.T[n].name).join(", ")}`}
function clickT(i){if(!G||busy||!mine())return;const T=G.T[i];info(i);
 if(G.phase==="place"){if(T.owner!==G.turn)return toast(t("notYours"));if(T.n>=MAXS)return toast(t("full8"));return request({t:"place",tid:i})}
 if(sel<0){if(T.owner!==G.turn)return toast(t("notYours"));if(T.n<2)return toast(t("needTwo"));pick(i);return}
 if(i===sel){pick(-1);return}
 if(tgts.includes(i)){const a=sel;pick(-1);request({t:"atk",a,d:i});return}
 if(T.owner===G.turn){if(T.n<2)return toast(t("needTwo"));pick(i);return}
 toast(t("notAdj"))}
function pick(i){sel=i;tgts=i<0?[]:Engine.targets(G,i);refresh();if(i>=0)info(i)}
/* actions: run on host/local; guests forward them to the host */
function request(a){if(O&&!O.host)O.r.emit("act",{...a,from:O.me}).catch(()=>{});else exec(a)}
function exec(a){if(busy||!G||G.over)return;
 if(a.t==="atk"&&G.phase==="attack"&&Engine.canAttack(G,a.a,a.d)&&G.T[a.a].owner===G.turn)fight(a.a,a.d);
 else if(a.t==="place"&&G.phase==="place"&&G.T[a.tid]&&G.T[a.tid].owner===G.turn&&G.T[a.tid].n<MAXS)doPlace(a.tid);
 else if(a.t==="end")(G.phase==="place"?placeRest():endTurn())}
function bcast(last){if(!O||!O.host||!G)return;if(last){O.seq++;O.last=last}
 O.r.emit("state",{snap:{seed:G.seed,owners:G.T.map(x=>x.owner),ns:G.T.map(x=>x.n),P:G.P,turn:G.turn,round:G.round,hist:G.hist.slice(-8),phase:G.phase,pool:G.pool,over:G.over,winner:G.winner,seats:O.seats,seq:O.seq,last:O.last||null,elapsed:Date.now()-t0}}).catch(()=>{})}
async function battleUI(r,fast){const A=G.T[r.a],D=G.T[r.d],fx=$("#fx"),ln=document.createElementNS(SVGNS,"line");ln.setAttribute("class","atkline");[["x1",A.x],["y1",A.y],["x2",D.x],["y2",D.y]].forEach(([k,v])=>ln.setAttribute(k,v));fx.appendChild(ln);
 const side=(el,p,T,n)=>{el.innerHTML=`<h4 style="color:${p.color}">${p.name}<br><small>${T.name}</small></h4><div class="dice">${Array.from({length:n},()=>'<div class="die roll">?</div>').join("")}</div><div class="tot">…</div>`};
 side($("#bA"),G.P[r.ao],A,r.ad.length);side($("#bD"),G.P[r.do],D,r.dd.length);$("#bt").classList.add("on");beep(300);const f=fast?.6:1;await sleep(650*f);
 const fill=(el,ds,tot)=>{[...el.querySelectorAll(".die")].forEach((e,i)=>{e.classList.remove("roll");e.textContent=ds[i]});el.querySelector(".tot").textContent=tot};
 fill($("#bA"),r.ad,r.as);fill($("#bD"),r.dd,r.ds);beep(520);await sleep(450*f);
 const res=document.createElement("div");res.className="res";res.style.color=r.win?"#3ddc84":"#ff5a6a";res.textContent=r.win?t("win"):t("lose");(r.win?$("#bA"):$("#bD")).appendChild(res);beep(r.win?780:200,.2);await sleep(750*f);
 $("#bt").classList.remove("on");ln.remove()}
async function fight(a,d,fast){const gid=gameId;busy=true;refresh();const r=Engine.resolve(G,a,d);await battleUI(r,fast);if(gid!==gameId)return;Engine.apply(G,r);if(r.win)burst(G.T[r.d]);busy=false;save();refresh();bcast(r);if(G.over)victory()}
function beginPlace(){G.pool=Engine.poolFor(G,G.turn);G.phase=G.pool>0?"place":"attack";return G.pool}
function endTurn(){pick(-1);if(!beginPlace())finishTurn();else{save();refresh();bcast()}}
function doPlace(id){Engine.place(G,G.turn,id);G.pool--;beep(500,.05);if(G.pool<=0||!G.T.some(x=>x.owner===G.turn&&x.n<MAXS))finishTurn();else{refresh();bcast()}}
function placeRest(){Engine.placeRandom(G,G.turn,G.pool);finishTurn()}
function finishTurn(){G.phase="attack";G.pool=0;Engine.nextTurn(G);sel=-1;tgts=[];busy=false;save();refresh();bcast();beep(440);const p=G.P[G.turn];if(lvl(p)&&(!O||O.host))aiTurn();else if(!O&&G.P.filter(x=>x.alive&&!lvl(x)).length>1)toast(p.name)}
async function aiTurn(){const gid=gameId,ok=()=>gid===gameId&&G&&!G.over&&lvl(G.P[G.turn]);if(!ok())return;busy=true;refresh();await sleep(400);
 let n=AI.maxAttacks(lvl(G.P[G.turn]));
 while(n-->0&&ok()&&G.phase==="attack"){const m=AI.pick(G,lvl(G.P[G.turn]));if(!m)break;sel=m.a;tgts=[m.d];refresh();await sleep(300);if(gid!==gameId)return;sel=-1;tgts=[];await fight(m.a,m.d,true);busy=true;await sleep(120)}
 if(gid!==gameId||G.over)return;if(!lvl(G.P[G.turn])){busy=false;refresh();return}
 const l=lvl(G.P[G.turn]);if(G.phase==="attack")beginPlace();refresh();bcast();
 while(G.phase==="place"&&G.pool>0&&G.T.some(x=>x.owner===G.turn&&x.n<MAXS)&&gid===gameId){Engine.place(G,G.turn,AI.place(G,l));G.pool--;refresh();bcast();beep(500,.04);await sleep(110)}
 if(gid!==gameId)return;finishTurn()}
function victory(){const w=G.P[G.winner],ts=G.T.length,sd=G.T.reduce((s,x)=>s+x.n,0),tm=Math.round((G.elapsed||Date.now()-t0)/1000),mm=Math.floor(tm/60)+":"+String(tm%60).padStart(2,"0");ls.d("dc_save");
 $("#vicC").innerHTML=`<h1 class="logo" style="font-size:44px">${t("win")}</h1><h2 style="color:${w.color}">${t("winner")}: ${w.name}</h2><p>${t("terr")}: ${ts} · ${t("sold")}: ${sd}<br>${t("atks")}: ${w.atk} · ${t("wins")}: ${w.w} · ${t("losses")}: ${w.l}<br>${t("time")}: ${mm}</p><p>${G.P.filter(p=>p.id!==w.id).map(p=>p.name+" — "+t("defeated")).join("<br>")}</p><button class="btn pri" id="vAgain">${t("again")}</button> <button class="btn" id="vMenu">${t("toMenu")}</button>`;
 $("#vic").classList.add("on");$("#vAgain").onclick=()=>{if(O||!lastOpt)return toMenu();$("#vic").classList.remove("on");start(lastOpt)};$("#vMenu").onclick=toMenu;beep(660,.4)}
function leaveOnline(){if(O){clearInterval(O.hb);try{O.r.leave&&O.r.leave()}catch(e){}O=null}}
function toMenu(){gameId++;busy=false;leaveOnline();G=null;$("#vic").classList.remove("on");$("#bt").classList.remove("on");$("#lob").innerHTML="";show("menu");$("#bCont").disabled=!ls.g("dc_save")}
function start(o){music();gameId++;lastOpt=o;G=Engine.newGame({...o,names:{you:t("you"),ai:t("ai")}});{const nm=$("#sName").value.trim();if(nm&&G.P[0].ai===0)G.P[0].name=nm.slice(0,16)}t0=Date.now();sel=-1;tgts=[];busy=false;$("#vic").classList.remove("on");show("game");buildMap();refresh();save();bcast();if(lvl(G.P[G.turn])&&(!O||O.host))aiTurn()}
function save(){if(!G||G.over||O)return;G.elapsed=Date.now()-t0;ls.s("dc_save",JSON.stringify({v:2,seed:G.seed,opt:lastOpt,owners:G.T.map(x=>x.owner),ns:G.T.map(x=>x.n),P:G.P,turn:G.turn,round:G.round,phase:G.phase,pool:G.pool,auto:G.auto,hist:G.hist,elapsed:G.elapsed}))}
function load(){const raw=ls.g("dc_save");if(!raw)return toast(t("noSave"));try{const s=JSON.parse(raw);if(s.v!==2)throw 0;const T=Engine.genMap();
  if(s.owners.length!==T.length||s.ns.some(n=>!(n>=1&&n<=MAXS))||!Array.isArray(s.P)||!(s.turn>=0&&s.turn<s.P.length))throw 0;
  T.forEach((x,i)=>{x.owner=s.owners[i];x.n=s.ns[i];if(!s.P[x.owner])throw 0});
  gameId++;leaveOnline();G={v:2,seed:s.seed,T,P:s.P,turn:s.turn,round:s.round,phase:s.phase==="place"?"place":"attack",pool:s.pool||0,auto:!!s.auto,hist:s.hist||[],over:false,winner:-1,elapsed:s.elapsed||0};lastOpt=s.opt;t0=Date.now()-G.elapsed;sel=-1;tgts=[];busy=false;show("game");buildMap();refresh();if(lvl(G.P[G.turn]))aiTurn()
 }catch(e){ls.d("dc_save");$("#bCont").disabled=true;toast(t("badSave"))}}
/* online (room capability in claude.ai; BroadcastChannel fallback = same-browser tabs) */
async function getRoom(){try{if(window.claude&&claude.use){const r=await claude.use("room");if(r)return r}}catch(e){}
 if(typeof BroadcastChannel==="undefined")return null;
 return{join(n){const bc=new BroadcastChannel(n),hs={};bc.onmessage=e=>{const m=e.data;(hs[m.topic]||[]).forEach(f=>f({topic:m.topic,data:m.data}))};return{emit:async(tp,data)=>bc.postMessage({topic:tp,data}),on:(tp,f)=>{(hs[tp]=hs[tp]||[]).push(f)},leave(){bc.close()}}}}}
function lobby(){const n=Object.keys(O.seats).length;$("#lob").innerHTML=`<p><b>${t("code")}: ${O.code}</b></p><p>${t("lobby")}: ${n}/${O.o.humans} ${t("joined")}</p><button class="btn pri" id="oGo" ${n<2?"disabled":""}>${t("startOnline")}</button>`;$("#oGo").onclick=()=>{const o={...O.o,humans:Object.keys(O.seats).length};O.o=o;start(o);O.hb=setInterval(()=>bcast(),3000)}}
async function hostOnline(){const room=await getRoom();if(!room)return toast(t("noOnline"));leaveOnline();const o=opts();o.humans=Math.max(2,o.humans);o.players=Math.max(o.players,o.humans);
 const code=nid().slice(0,4).toUpperCase(),r=room.join("dc-"+code);O={host:true,r,me:nid(),code,seats:{},o,seq:0,last:null};O.seats[0]=O.me;
 r.on("hello",m=>{const d=m.data;if(!d||d.from===O.me)return;if(!G&&!Object.values(O.seats).includes(d.from)){const free=[...Array(O.o.humans).keys()].find(s=>O.seats[s]===undefined);if(free!==undefined)O.seats[free]=d.from;lobby()}else if(G)bcast()});
 r.on("act",m=>{const d=m.data;if(G&&d&&d.from!==O.me&&O.seats[G.turn]===d.from)exec(d)});lobby()}
async function joinOnline(code){if(!code)return;const room=await getRoom();if(!room)return toast(t("noOnline"));leaveOnline();const r=room.join("dc-"+code);O={host:false,r,me:nid(),seats:{},seq:-1,code,q:Promise.resolve()};
 r.on("state",m=>{const d=m.data;if(d&&d.snap&&O)O.q=O.q.then(()=>onState(d.snap)).catch(()=>{})});
 const hi=()=>r.emit("hello",{from:O.me}).catch(()=>{});hi();O.hb=setInterval(()=>{if(G)clearInterval(O.hb);else hi()},2000);$("#lob").textContent=t("waiting")}
async function onState(s){busy=true;let first=false;
 if(!G||G.seed!==s.seed){gameId++;first=true;G={v:2,seed:s.seed,T:Engine.genMap(),P:s.P,turn:0,round:1,hist:[],phase:"attack",pool:0,auto:false,over:false,winner:-1};t0=Date.now()-(s.elapsed||0);O.seq=s.seq;show("game");buildMap()}
 else if(s.last&&s.seq>O.seq){await battleUI(s.last,true);if(s.last.win)burst(G.T[s.last.d])}
 O.seq=s.seq;O.seats=s.seats;Object.assign(G,{P:s.P,turn:s.turn,round:s.round,hist:s.hist,phase:s.phase,pool:s.pool,over:s.over,winner:s.winner});G.T.forEach((T,i)=>{T.owner=s.owners[i];T.n=s.ns[i]});sel=-1;tgts=[];busy=false;refresh();if(G.over)victory()}
/* pan & zoom */
const drag={on:false,moved:false,x:0,y:0},mapEl=$("#map");
mapEl.addEventListener("pointerdown",e=>{drag.on=true;drag.moved=false;drag.x=e.clientX;drag.y=e.clientY});
addEventListener("pointermove",e=>{if(!drag.on||!vb)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;if(!drag.moved)return;const k=vb.w/mapEl.clientWidth;vb.x-=dx*k;vb.y-=dy*k;drag.x=e.clientX;drag.y=e.clientY;setVB()});
addEventListener("pointerup",()=>{drag.on=false;setTimeout(()=>drag.moved=false,0)});
function zoom(f,cx,cy){if(!vb)return;const r=mapEl.getBoundingClientRect(),px=cx===undefined?.5:(cx-r.left)/r.width,py=cy===undefined?.5:(cy-r.top)/r.height,nw=Math.min(vb0.w*1.5,Math.max(vb0.w/5,vb.w*f)),nh=nw*vb.h/vb.w;vb.x+=(vb.w-nw)*px;vb.y+=(vb.h-nh)*py;vb.w=nw;vb.h=nh;setVB()}
mapEl.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89,e.clientX,e.clientY)},{passive:false});
$("#zi").onclick=()=>zoom(.8);$("#zo").onclick=()=>zoom(1.25);$("#zr").onclick=()=>{vb={...vb0};setVB()};
/* wiring */
const opts=()=>{const p=Math.min(8,Math.max(2,+$("#sP").value||2)),h=Math.min(p,Math.max(0,+$("#sH").value||0));return{players:p,humans:h,diff:+$("#sD").value,size:"world",seed:$("#sSeed").value.trim(),snd:$("#sSnd").checked}};
const ob=document.createElement("div");ob.innerHTML='<hr style="border-color:var(--line)"><h3 data-t="online"></h3><div class="row"><button class="btn" id="oHost" data-t="hostOnline"></button></div><div class="row"><input type="text" id="oCode" size="6" placeholder="CODE"><button class="btn" id="oJoin" data-t="joinOnline"></button></div><div id="lob"></div>';$("#setup .card").appendChild(ob);
const sh=document.createElement("div");sh.id="share";$("#side").insertBefore(sh,$("#pls"));const cl=document.createElement("div");cl.id="cl";$("#side").insertBefore(cl,$("#info"));
$("#hist").onclick=()=>{$("#hist").classList.toggle("big");refresh()};
addEventListener("keydown",e=>{if(!G||!$("#game").classList.contains("on")||/INPUT|SELECT/.test(e.target.tagName))return;const k=e.key;
 if(k==="Enter"||k===" "){e.preventDefault();$("#bEnd").click()}else if(k==="Escape"){$("#hist").classList.remove("big");if(sel>=0)pick(-1)}else if(k==="+"||k==="=")zoom(.8);else if(k==="-")zoom(1.25);else if(k==="0")$("#zr").click();else if(k==="a"||k==="A")$("#bAuto").click()});
const ab=document.createElement("button");ab.className="btn";ab.id="bAuto";ab.style.minWidth="110px";$("#bar").insertBefore(ab,$("#bEnd"));
$("#bNew").onclick=()=>show("setup");$("#sBack").onclick=toMenu;$("#sGo").onclick=()=>{const o=opts();cfg.snd=o.snd?1:0;saveCfg();leaveOnline();start(o)};
$("#bQuick").onclick=()=>{leaveOnline();start({players:4,humans:1,diff:2,size:"world",seed:""})};
$("#oHost").onclick=hostOnline;$("#oJoin").onclick=()=>joinOnline($("#oCode").value.trim().toUpperCase());
$("#bCont").onclick=load;$("#bHow").onclick=()=>show("how");$("#bSet").onclick=()=>{$("#oSnd").checked=!!cfg.snd;$("#oMus").checked=!!cfg.mus;$("#oNames").checked=cfg.names!==0;$("#oAnim").value=cfg.anim;$("#oSp").value=cfg.sp;show("sett")};$("#bAbout").onclick=()=>show("about");
$$("[data-back]").forEach(b=>b.onclick=()=>show("menu"));
$("#oSnd").onchange=e=>{cfg.snd=e.target.checked?1:0;saveCfg()};$("#oMus").onchange=e=>{cfg.mus=e.target.checked?1:0;saveCfg();music()};$("#oNames").onchange=e=>{cfg.names=e.target.checked?1:0;saveCfg();refresh()};$("#oAnim").onchange=e=>{cfg.anim=+e.target.value;saveCfg()};$("#oSp").onchange=e=>{cfg.sp=+e.target.value;saveCfg()};
$("#oReset").onclick=()=>{cfg={snd:1,anim:1,sp:1,mus:0,names:1};saveCfg();lang="en";applyLang();$("#oSnd").checked=true;$("#oAnim").value=1;$("#oSp").value=1};
$("#lang").onchange=$("#lang2").onchange=e=>{lang=e.target.value;applyLang()};
$("#bEnd").onclick=()=>{if(mine()&&!busy)request({t:"end"})};
$("#bAuto").onclick=()=>{if(!G||O||G.over)return;G.auto=!G.auto;refresh();save();if(G.auto&&!busy&&lvl(G.P[G.turn]))aiTurn()};
$("#bMenu").onclick=()=>{save();toMenu()};
addEventListener("beforeunload",()=>save());
lang=ls.g("dc_lang")||"en";if(!L[lang])lang="en";applyLang();$("#bCont").disabled=!ls.g("dc_save");
