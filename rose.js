(()=>{'use strict';
const cv=document.getElementById('art'),ctx=cv.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id),TAU=Math.PI*2,FLOOR=-1.22,HEAD=.22,LOOP=20;
const pools=["1il!;:","rtfjcvxz=+","aeoun0{}[]<>","08B$#&%Q"],chars=" .,:~+*^01|/\\-_#()x"+pools.join("");
const colors=['#46d660','#34c454','#50ce64','#ff2240','#ff7892','#fff','#ffb0cc','#bcdcff','#ffd696','#8c3c4c'];
let cols=112,rows=78,cw=9,ch=14,aspect=1.03,paused=false,t=0,last=0,raf=0,trail=null;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function curve(s){return [.045*Math.sin(s*3.1+.4)-.02,-1.15+s*(HEAD+1.15),.02*Math.sin(s*2)]}
const pts=[],parts=[],norms=[],orders=[];
function add(p,n,k,o){pts.push(p);norms.push(n);parts.push(k);orders.push(o)}
// Stem mesh
for(let i=0;i<260;i++){let s=i/259,c=curve(s);for(let j=0;j<14;j++){let a=j*TAU/14,n=[Math.cos(a),0,Math.sin(a)],r=.026+.006*(1-s);add([c[0]+n[0]*r,c[1],c[2]+n[2]*r],n,0,s)}}
// Leaves, folded pointed surfaces
for(const cfg of [[.32,-1,.42,.35,1],[.55,1,.36,.45,-1]]){let [at,side,len,lift,tw]=cfg,b=curve(at),d=[side*Math.cos(lift),Math.sin(lift),.25*tw],dn=Math.hypot(...d);d=d.map(x=>x/dn);let w=[d[1],-d[0],0],wn=Math.hypot(...w);w=w.map(x=>x/wn);let up=[w[1]*d[2]-w[2]*d[1],w[2]*d[0]-w[0]*d[2],w[0]*d[1]-w[1]*d[0]];
for(let i=0;i<70;i++){let s=i/69,hw=.15*Math.pow(Math.sin(Math.PI*s),.75)*len/.42;for(let j=0;j<25;j++){let v=-1+2*j/24,p=b.map((x,k)=>x+d[k]*(.07+s*len)+w[k]*v*hw+up[k]*(.05*Math.abs(v)-.10*s*s));add(p,up,1,at+.05+s*.25)}}}
// Petal parameters, 52k surface samples
const NT=1300,NX=40,THMIN=2.2*Math.PI,THMAX=20*Math.PI,pet=[];
for(let j=0;j<NX;j++)for(let i=0;i<NT;i++){let th=THMIN+(THMAX-THMIN)*i/(NT-1),x=j/(NX-1),thn=(th-THMIN)/(THMAX-THMIN),pid=Math.floor(3.6*th/TAU)-Math.floor(3.6*THMIN/TAU);pet.push({th,x,thn,pid,order:1.10+x*.42+(1-thn)*.10})}
function bloom(tt){let u=Math.max(0,Math.min(1,(tt-5.5)/9));return u*(2-u)*.55+u*u*(3-2*u)*.45}
function rotate(p,a){let c=Math.cos(a),s=Math.sin(a);return [c*p[0]+s*p[2],p[1],-s*p[0]+c*p[2]]}
function camera(p){let eye=[0,1.75,4],target=[0,-.05,0],f=target.map((x,i)=>x-eye[i]),fl=Math.hypot(...f);f=f.map(x=>x/fl);let right=[-f[2],0,f[0]],rl=Math.hypot(...right);right=right.map(x=>x/rl);let up=[right[1]*f[2]-right[2]*f[1],right[2]*f[0]-right[0]*f[2],right[0]*f[1]-right[1]*f[0]],r=p.map((x,i)=>x-eye[i]);return [r.reduce((a,x,i)=>a+x*right[i],0),r.reduce((a,x,i)=>a+x*up[i],0),r.reduce((a,x,i)=>a+x*f[i],0)]}
function render(tt,dt){
 const op=bloom(tt),yaw=.22*Math.sin(Math.max(tt-7,0)*.35)*smooth((tt-7)/4);let key=[-.35,.85,.65];const kl=Math.hypot(...key);key=key.map(x=>x/kl);
 const cloud=[];
 // static body base
 for(let i=0;i<pts.length;i++){let p=rotate(pts[i],yaw),n=rotate(norms[i],yaw),o=orders[i];if(parts[i]===1){const src=pts[i],leafBase=src[1]<-.55?curve(.32):curve(.55),phase=src[1]<-.55?.4:2.1,reach=Math.max(0,Math.min(1,Math.hypot(src[0]-leafBase[0],src[1]-leafBase[1],src[2]-leafBase[2])/.48)),wave=Math.sin(tt*1.65+phase);p[0]+=wave*.055*reach;p[2]+=Math.cos(tt*1.35+phase)*.035*reach;p[1]+=Math.sin(tt*1.1+phase)*.012*reach;}let reveal=smooth(((tt-.3)/5.1*1.66-o)/(o>=1?.09:.05));if(reveal<.02)continue;
 let diff=Math.max(0,n[0]*key[0]+n[1]*key[1]+n[2]*key[2]),lum=.62+.6*diff;
 cloud.push({p,lum:lum*reveal,k:parts[i],z:0})}
 // Five sepals: full folded leaf surfaces matching the original Python geometry
 for(let q=0;q<5;q++)for(let wi=0;wi<9;wi++)for(let si=0;si<34;si++){
  let s=si/33,w=-1+2*wi/8,beta=(1.05+.35*op)+(.55+.75*op)*s,L=.36-.06*op,a=TAU*q/5+.3;
  let r=.045+L*s*Math.sin(beta),ang=a+w*.10*Math.pow(1-s,1.3)/Math.max(r/.2,.25);
  let y=HEAD+.02+L*s*Math.cos(beta),p=[Math.cos(ang)*r,y,Math.sin(ang)*r];
  let n=[Math.cos(ang)*Math.cos(beta),-Math.sin(beta),Math.sin(ang)*Math.cos(beta)];
  let reveal=smooth(((tt-.3)/5.1*1.66-(1+.10*s))/.09);
  if(reveal>.01)cloud.push({p:rotate(p,yaw),lum:(.62+.35*Math.max(0,n[1]))*reveal,k:2});
 }
 // Rose spiral interpolated from closed bud to bloom
 const stride=2;
 for(let z=0;z<pet.length;z+=stride){let q=pet[z],{th,x,thn,pid}=q,A=1.6+4*op,phi=Math.PI/2*Math.exp(-th/(A*Math.PI)),X=1-.5*Math.pow(1.25*(1-((3.6*th/TAU)%1)*2)**2-.25,2),yy=1.95653*x*x*Math.pow(1.27689*x-1,2)*Math.sin(phi),r=X*(x*Math.sin(phi)+yy*Math.cos(phi)),px=r*Math.sin(th)*.8*(1.05-.05*op),pz=r*Math.cos(th)*.8*(1.05-.05*op),py=X*(x*Math.cos(phi)-yy*Math.sin(phi))*.8*(.84+.16*op)+HEAD;
 let br=.170*Math.pow(x,.70)*Math.pow(1-x,.75)/.367*(1-.30*thn)+.003,bud=[br*Math.sin(th),HEAD+.03+.52*x*(1-.06*thn),br*Math.cos(th)],w=smooth(op/.6),p=[bud[0]*(1-w)+px*w,bud[1]*(1-w)+py*w,bud[2]*(1-w)+pz*w],reveal=smooth(((tt-.3)/5.1*1.66-q.order)/.09);if(reveal<.03)continue;
 let radial=Math.hypot(p[0],p[2]),lum=.55+.30*(.5+.5*Math.sin(th*1.7+x*4))+.18*Math.max(0,Math.cos(th+tt*.3));if(x>.93)lum=Math.max(lum,.85);if(x<.2)lum*=.78;
 cloud.push({p:rotate(p,yaw),lum:lum*reveal,k:x>.93?4:3,petal:true,depth:pid})}
 // Ambient glitter, sparks and water glints
 for(let i=0;i<230;i++){let a=(i*2.39996)+tt*(.05+(i%7)*.012),r=.55+1.6*((i*37%101)/101)**.7,y=-1.1+2.3*((i*61%97)/97)+.05*Math.sin(tt*.6+i);let tw=Math.max(0,Math.sin(tt*(1.2+i%5*.4)+i*1.7))**8;cloud.push({p:[Math.cos(a)*r,y,Math.sin(a)*r*.6-.35],lum:.10+.85*tw,k:5})}
 // Perspective projection with a per-cell z buffer
 const depth=new Float32Array(cols*rows);depth.fill(99);const glyph=new Array(cols*rows).fill(' '),bright=new Float32Array(cols*rows),tag=new Uint8Array(cols*rows);
 for(const o of cloud){let [x,y,z]=camera(o.p);if(z<=.2)continue;let sx=(.5+x/z*1.45)*cols,sy=(.5-y/z*1.45*aspect)*rows,ix=sx|0,iy=sy|0;if(ix<0||ix>=cols||iy<0||iy>=rows)continue;let id=iy*cols+ix;if(z<depth[id]){depth[id]=z;let l=Math.max(0,Math.min(1,o.lum)),pool=pools[Math.min(3,Math.floor(l*4))],seed=(iy*7919+ix*104729+Math.floor(tt*4))%pool.length;glyph[id]=l>.93?'*':pool[seed];bright[id]=l;tag[id]=o.k}}
 // Render crisp character cells, subtle colored glow
 ctx.fillStyle='#050308';ctx.fillRect(0,0,cv.width,cv.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.max(8,Math.floor(ch*.88))+'px ui-monospace,monospace';
 for(let i=0;i<glyph.length;i++){if(glyph[i]===' ')continue;let x=i%cols,y=(i/cols)|0,l=bright[i];ctx.fillStyle=colors[tag[i]]||'#fff';ctx.globalAlpha=.25+l*.75;ctx.fillText(glyph[i],(x+.5)*cw,(y+.5)*ch)}
 ctx.globalAlpha=1;
 $('bloom').textContent='BLOOM '+(op*100).toFixed(1)+'% · SWAY '+((yaw*180/Math.PI+360)%360).toFixed(2)+'°';
 $('count').textContent='LETTERS '+String(cloud.length).padStart(5,'0');$('time').textContent='● '+tt.toFixed(2)+'s';
}
function resize(){let dpr=Math.min(devicePixelRatio||1,1.5),w=cv.clientWidth,h=cv.clientHeight;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cols=Math.max(58,Math.min(126,Math.floor(w/8)));rows=Math.max(48,Math.floor(h/13));cw=cv.width/cols;ch=cv.height/rows;aspect=(cols*cw)/(rows*ch);ctx.setTransform(1,0,0,1,0,0)}
function loop(now){if(!last)last=now;let dt=Math.min((now-last)/1000,.05);last=now;if(!paused){t+=dt;if(t>LOOP)t=0}render(t,dt);raf=requestAnimationFrame(loop)}
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar'};
$('restart').onclick=()=>{t=0;last=0};
$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.getElementById('stage').requestFullscreen?.();else document.exitFullscreen?.()};
addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('pause').click()}if(e.key.toLowerCase()==='r')$('restart').click();if(e.key.toLowerCase()==='f')$('fullscreen').click()});
resize();raf=requestAnimationFrame(loop);
})();