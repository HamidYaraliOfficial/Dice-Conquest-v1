import {Engine,MAXS} from "./engine.js";
/* ===== AI ===== */
export const AI=(()=>{
 const erf=x=>{const s=Math.sign(x);x=Math.abs(x);const t=1/(1+.3275911*x);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x))};
 const prob=(a,d)=>1-.5*(1+erf((.5-3.5*(a-d))/Math.sqrt(35/12*(a+d))/Math.SQRT2)); // P(attack total > defense total)
 function pick(G,lvl){const me=G.turn,out=[],terr=G.P.map(p=>G.T.filter(x=>x.owner===p.id).length),lead=terr.indexOf(Math.max(...terr.map((v,i)=>i===me?-1:v)));
  for(const A of G.T){if(A.owner!==me||A.n<2)continue;for(const d of Engine.targets(G,A.id)){const D=G.T[d],p=prob(A.n,D.n);let s=p;
   if(lvl===3){const ct=G.T.filter(x=>x.cont===D.cont),mn=ct.filter(x=>x.owner===me).length;s+=(ct.length-mn===1?.18:0)+(ct.every(x=>x.owner===D.owner)?.2:0)+.04*D.nb.filter(x=>G.T[x].owner===me).length+(D.owner===lead?.05:0)+(terr[D.owner]<=1?.1:0)+(A.n===MAXS?.08:0)-.02*D.nb.filter(x=>G.T[x].owner!==me&&G.T[x].owner!==D.owner&&G.T[x].n>=A.n-1).length}
   out.push({a:A.id,d,p,s})}}
  const th=lvl===1?.62:lvl===2?.5:.52;let c=out.filter(m=>m.p>th);if(lvl===3)c=c.filter(m=>m.p>.6||G.T[m.a].n>=7);if(!c.length)return null;
  if(lvl===1)return c[Math.floor(Math.random()*c.length)];return c.sort((x,y)=>y.s-x.s)[0]}
 const place=(G,l)=>{const me=G.turn,c=G.T.filter(x=>x.owner===me&&x.n<MAXS);if(l===1)return c[Math.floor(Math.random()*c.length)].id;
  const sc=x=>{const en=x.nb.filter(n=>G.T[n].owner!==me);if(!en.length)return -1+Math.random()*.1;const thr=en.reduce((s,n)=>s+G.T[n].n,0),best=Math.max(...en.map(n=>G.T[n].n));return l===2?en.length+x.n*.3+Math.random():x.n*.6+best*.5+thr*.15+en.length*.4+(x.n>=2?.8:0)+Math.random()*.3};return c.sort((p,q)=>sc(q)-sc(p))[0].id};
 return{place,pick,prob,maxAttacks:l=>l===1?2:l===2?6:12}})();
