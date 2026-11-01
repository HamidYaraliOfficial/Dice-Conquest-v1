/* ===== ENGINE ===== */
export const COLORS=["#ff4d5a","#3da5ff","#3ddc84","#ffc233","#b57bff","#ff8a3d","#2ee6d6","#ff6bd6"];export const MAXS=8;
export const CONT=[{b:3,c:"#26456b"},{b:2,c:"#2d5a47"},{b:3,c:"#4a3d6b"},{b:6,c:"#6b4a2d"},{b:3,c:"#6b5a2d"},{b:2,c:"#2d5a5a"}];
export const Engine=(()=>{
 let rnd=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296};
 const setRandom=f=>{rnd=f};
 const roll=n=>Array.from({length:n},()=>1+Math.floor(rnd()*6)); // DiceEngine: exactly n dice
 const sum=a=>a.reduce((x,y)=>x+y,0);
 function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 function genMap(){ // world graph: territories on stylised continents; links = 3 nearest on same landmass + sea bridges
  const W=[["Alaska",-152,64,0],["Canada West",-120,57,0],["Canada East",-80,52,0],["Pacific NW",-122,45,0],["California",-118,36,0],["Great Plains",-100,40,0],["Midwest",-88,41,0],["East Coast",-76,40,0],["Texas",-98,31,0],["Mexico",-102,22,0],["Central America",-86,14,0],["Greenland",-42,72,5],["Colombia",-74,5,1],["Venezuela",-64,8,1],["Amazon",-62,-4,1],["Peru",-76,-10,1],["Brazil East",-46,-10,1],["Chile",-71,-30,1],["Argentina",-61,-36,1],["Iceland",-19,65,6],["UK",-4,56,7],["Iberia",-6,39,2],["France",2,47,2],["Germany",13,52,2],["Scandinavia",16,63,2],["Italy",13,41,2],["Eastern Europe",28,50,2],["Russia West",44,58,2],["Siberia",90,62,2],["Far East",135,62,2],["Kazakhstan",64,47,2],["Mongolia",103,47,2],["China",112,34,2],["Japan",139,37,8],["India",79,22,2],["Southeast Asia",103,15,2],["Turkey",34,39,2],["Middle East",46,27,2],["Indonesia",115,-3,9],["North Africa",8,29,3],["Egypt",30,27,3],["West Africa",-6,11,3],["Central Africa",20,0,3],["East Africa",38,6,3],["South Africa",24,-27,3],["Madagascar",47,-20,10],["West Australia",122,-25,4],["East Australia",146,-26,4],["New Zealand",172,-42,11]],T=W.map((w,i)=>({id:i,name:w[0],x:Math.round((w[1]+180)*2.78),y:Math.round((78-w[2])*3.9),land:w[3],nb:[],owner:0,n:1,S:15})),ix=new Map(T.map(x=>[x.name,x.id])),link=(a,b)=>{if(a!==b&&!T[a].nb.includes(b)){T[a].nb.push(b);T[b].nb.push(a)}};
  T.forEach(a=>T.filter(b=>b.land===a.land&&b!==a).map(b=>[Math.hypot(a.x-b.x,a.y-b.y),b.id]).sort((p,q)=>p[0]-q[0]).slice(0,3).forEach(([d,b])=>{if(d<115)link(a.id,b)}));
  "Greenland|Canada East,Greenland|Iceland,Iceland|UK,UK|France,UK|Scandinavia,Japan|Far East,Japan|China,Indonesia|Southeast Asia,Indonesia|West Australia,New Zealand|East Australia,Madagascar|East Africa,Central America|Colombia,Alaska|Far East,North Africa|Iberia,Egypt|Middle East,Italy|North Africa,Turkey|Egypt,East Africa|Middle East,Mexico|Central America,Turkey|Eastern Europe".split(",").forEach(s=>{const[a,b]=s.split("|");link(ix.get(a),ix.get(b))});
  const CN=[["Alaska","Canada West","Canada East","Pacific NW","California","Great Plains","Midwest","East Coast","Texas","Mexico","Central America","Greenland"],["Colombia","Venezuela","Amazon","Peru","Brazil East","Chile","Argentina"],["Iceland","UK","Iberia","France","Germany","Scandinavia","Italy","Eastern Europe"],["Russia West","Siberia","Far East","Kazakhstan","Mongolia","China","Japan","India","Southeast Asia","Turkey","Middle East","Indonesia"],["North Africa","Egypt","West Africa","Central Africa","East Africa","South Africa","Madagascar"],["West Australia","East Australia","New Zealand"]].forEach((l,c)=>l.forEach(n=>T[ix.get(n)].cont=c));
  return T}
 function newGame(o){const seed=o.seed||String(Math.floor(Math.random()*1e9)),T=genMap(),R=mulberry(hash(seed+"o"));
  const P=Array.from({length:o.players},(_,i)=>({id:i,name:(i<o.humans?(o.names&&o.names.you||"Human"):(o.names&&o.names.ai||"AI"))+" "+(i+1),color:COLORS[i],ai:i<o.humans?0:o.diff,alive:true,atk:0,w:0,l:0}));
  const order=T.map((_,i)=>i).sort(()=>R()-.5);order.forEach((ti,k)=>{T[ti].owner=k%o.players;T[ti].n=1+Math.floor(R()*3)});
  return{v:2,seed,size:"world",T,P,turn:0,round:1,phase:"attack",pool:0,auto:false,hist:[],over:false,winner:-1,elapsed:0}}
 const canAttack=(G,a,d)=>{const A=G.T[a],D=G.T[d];return A.owner!==D.owner&&A.n>=2&&A.nb.includes(d)};
 const targets=(G,a)=>G.T[a].n<2?[]:G.T[a].nb.filter(d=>G.T[d].owner!==G.T[a].owner);
 function resolve(G,a,d){if(!canAttack(G,a,d))throw new Error("illegal");const A=G.T[a],D=G.T[d],ad=roll(A.n),dd=roll(D.n),as=sum(ad),ds=sum(dd);return{a,d,ad,dd,as,ds,win:as>ds,ao:A.owner,do:D.owner,round:G.round}}
 function apply(G,r){const A=G.T[r.a],D=G.T[r.d];G.P[r.ao].atk++;
  if(r.win){D.owner=A.owner;D.n=A.n-1;A.n=1;G.P[r.ao].w++;G.P[r.do].l+=0}else{A.n=1;G.P[r.ao].l++}
  G.hist.push({a:A.name,d:D.name,ao:r.ao,do:r.do,as:r.as,ds:r.ds,win:r.win,ad:r.ad.length,dd:r.dd.length});if(G.hist.length>200)G.hist.shift();
  refreshAlive(G);return G}
 function refreshAlive(G){G.P.forEach(p=>p.alive=G.T.some(x=>x.owner===p.id));const al=G.P.filter(p=>p.alive);if(al.length===1){G.over=true;G.winner=al[0].id}}
 function largest(G,pid){const own=new Set(G.T.filter(x=>x.owner===pid).map(x=>x.id)),seen=new Set();let best=0;
  for(const s of own){if(seen.has(s))continue;let c=0;const st=[s];seen.add(s);while(st.length){const x=st.pop();c++;for(const y of G.T[x].nb)if(own.has(y)&&!seen.has(y)){seen.add(y);st.push(y)}}best=Math.max(best,c)}return best}
 function reinforce(G,pid){let k=largest(G,pid),placed=0;while(k>0){const c=G.T.filter(x=>x.owner===pid&&x.n<MAXS);if(!c.length)break;c[Math.floor(rnd()*c.length)].n++;k--;placed++}return placed}
 function nextTurn(G){const prev=G.turn;let i=prev;do{i=(i+1)%G.P.length}while(!G.P[i].alive);if(i<=prev)G.round++;G.turn=i}
 const frontier=(G,pid)=>G.T.reduce((s,x)=>x.owner===pid?s+x.nb.filter(n=>G.T[n].owner!==pid).length:s,0);
 const capacity=(G,pid)=>G.T.reduce((s,x)=>x.owner===pid?s+(MAXS-x.n):s,0);
 const bonus=(G,pid)=>CONT.reduce((s,c,i)=>{const ts=G.T.filter(x=>x.cont===i);return ts.length&&ts.every(x=>x.owner===pid)?s+c.b:s},0);
 const poolFor=(G,pid)=>Math.min(Math.max(1,Math.ceil(frontier(G,pid)/2))+bonus(G,pid),capacity(G,pid)); // half of the border length, placed freely
 function place(G,pid,id){const T=G.T[id];if(!T||T.owner!==pid||T.n>=MAXS)throw new Error("illegal");T.n++}
 function placeRandom(G,pid,k){while(k-->0){const c=G.T.filter(x=>x.owner===pid&&x.n<MAXS);if(!c.length)break;c[Math.floor(rnd()*c.length)].n++}G.pool=0}
 return{bonus,poolFor,frontier,capacity,place,placeRandom,newGame,genMap,canAttack,targets,resolve,apply,largest,reinforce,nextTurn,roll,sum,setRandom,refreshAlive}})();
