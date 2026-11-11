(()=>{'use strict';
const cv=document.getElementById('art'),ctx=cv.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id),TAU=Math.PI*2,FLOOR=-1.22,HEAD=.22,LOOP=20;
const pools=["1il!;:","rtfjcvxz=+","aeoun0{}[]<>","08B$#&%Q"],chars=" .,:~+*^01|/\\-_#()x"+pools.join("");
const colors=['#46d660','#34c454','#50ce64','#ff2240','#ff7892','#fff','#ffb0cc','#bcdcff','#ffd696','#8c3c4c'];
let cols=112,rows=78,cw=9,ch=14,aspect=1.03,detail=50,paused=false,t=0,last=0,raf=0,trail=null,activeScene=0;
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
 if(activeScene){renderGallery(tt);return}
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
 let visible=0;for(let i=0;i<glyph.length;i++){if(glyph[i]===' ')continue;visible++;let x=i%cols,y=(i/cols)|0,l=bright[i];ctx.fillStyle=colors[tag[i]]||'#fff';ctx.globalAlpha=.25+l*.75;ctx.fillText(glyph[i],(x+.5)*cw,(y+.5)*ch)}
 ctx.globalAlpha=1;
 $('bloom').textContent='BLOOM '+(op*100).toFixed(1)+'% · SWAY '+((yaw*180/Math.PI+360)%360).toFixed(2)+'°';
 $('count').textContent='LETTERS '+String(visible).padStart(5,'0');$('time').textContent='● '+tt.toFixed(2)+'s';
}
function resize(){let dpr=Math.min(devicePixelRatio||1,1.5),w=cv.clientWidth,h=cv.clientHeight,scale=.48+(detail/100)*1.15;cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);cols=Math.max(32,Math.min(190,Math.floor(w/8*scale)));rows=Math.max(24,Math.min(140,Math.floor(h/13*scale)));cw=cv.width/cols;ch=cv.height/rows;aspect=(cols*cw)/(rows*ch);ctx.setTransform(1,0,0,1,0,0)}

const sceneLabels=['Rosa','Buquê','Aliança','Máscara','Coração','Borboleta','Lírio','Dois cisnes','Casal dançando','Estrelas'];
function renderGallery(tt){
 const W=cv.width,H=cv.height,U=Math.min(W,H)*.34,cx=W/2,cy=H*.50,P=[];
 const p=(x,y,c='·',a=.9)=>P.push({x:cx+x*U,y:cy+y*U,c,a});
 const ln=(f,n=70,c='·',a=.9)=>{for(let i=0;i<=n;i++){let q=f(i/n);p(q[0],q[1],c,a)}};
 const el=(x,y,rx,ry,c='o',n=90)=>ln(u=>[x+rx*Math.cos(u*6.283),y+ry*Math.sin(u*6.283)],n,c,1);
 const bloom=(x,y,r)=>{for(let k=0;k<8;k++){let a=k* Math.PI/4;ln(u=>[x+Math.cos(a)*r*u,y+Math.sin(a)*r*u+Math.sin(u*Math.PI)*.06],24,'*')}el(x,y,.05,.05,'@',20)};
 if(activeScene===1){for(let i=0;i<5;i++){let x=(i-2)*.14,y=-.3-Math.abs(i-2)*.06;ln(u=>[x*u,y*u+.55*u],40,'|');bloom(x,y,.17)}ln(u=>[-.34+.68*u,.34+.4*u],40,'/');ln(u=>[.34-.68*u,.34+.4*u],40,'\\');el(0,.55,.13,.06,'=',40)}
 if(activeScene===2){el(0,.04,.52,.4);el(0,.04,.4,.3,'.');ln(u=>[-.13+.26*u,-.42-.22*Math.sin(Math.PI*u)],30,'*');el(0,-.62,.11,.09,'✧',40)}
 if(activeScene===3){ln(u=>[-.7+1.4*u,-.05-.16*Math.sin(Math.PI*u)],100,'~');ln(u=>[-.7+1.4*u,-.05+.3*Math.sin(Math.PI*u)],100,'*');for(let s of [-1,1]){el(s*.32,.04,.22,.12,'-');ln(u=>[s*.1+s*.4*u,.04+.13*Math.sin(Math.PI*u)],30,'/')}ln(u=>[0,.1+u*.38],30,'|')}
 if(activeScene===4){let z=1+.07*Math.sin(tt*3);ln(u=>{let a=u*6.283,x=16*Math.sin(a)**3,y=13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a);return[x/19*z,-y/19*z]},220,'♥')}
 if(activeScene===5){let f=.55+.45*Math.abs(Math.sin(tt*4));for(let s of [-1,1])for(let k=0;k<3;k++)el(s*(.12+.14*k),-.05,.17*f,.28,k?'*':'@',60);ln(u=>[0,-.3+.6*u],35,'|');ln(u=>[-.03-u*.2,-.3-u*.16],25,'/');ln(u=>[.03+u*.2,-.3-u*.16],25,'\\')}
 if(activeScene===6){for(let k=0;k<6;k++){let a=k*Math.PI/3;ln(u=>[Math.cos(a)*(.05+.55*u)+Math.cos(a+1.57)*.1*Math.sin(Math.PI*u),Math.sin(a)*(.05+.55*u)+Math.sin(a+1.57)*.1*Math.sin(Math.PI*u)],60,'*')}el(0,0,.07,.07,'@',30);ln(u=>[0,.05+.7*u],45,'|')}
 if(activeScene===7){for(let s of [-1,1]){el(s*.32,.34,.3,.15,'~');ln(u=>[s*.32+s*.12*u,.28-.65*u],65,'S');ln(u=>[s*.32+s*.12,-.37],15,'>')}ln(u=>[-.12+.24*u,-.38-.05*Math.sin(Math.PI*u)],30,'~')}
 if(activeScene===8){let sw=Math.sin(tt*2)*.16;for(let s of [-1,1]){let x=s*.23+sw;el(x,-.35,.09,.09,'@',30);ln(u=>[x,-.25+.4*u],35,'|');ln(u=>[x,.0+u*.22],25,'/');ln(u=>[x,.0+u*.22],25,'\\');ln(u=>[x,.15+u*.32],30,s>0?'/':'\\')}}
 if(activeScene===9){for(let i=0;i<100;i++){let x=((i*73)%199)/100-1,y=((i*127)%197)/100-1;p(x,y,i%9===0?'✦':'.',.3+.7*Math.abs(Math.sin(tt*1.5+i)))}let u=(tt*.22)%1;ln(v=>[-.9+u*1.8+v*.22,-.65+u*.9+v*.16],30,'*')}
 for(let i=0;i<22;i++)p(Math.sin(i*91.7+tt*.1)*.95,Math.cos(i*47.3+tt*.1)*.85,'.',.2);
 ctx.fillStyle='#050308';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.max(9,Math.floor(Math.min(cw,ch)*.92))+'px ui-monospace,monospace';
 for(let q of P){ctx.globalAlpha=.2+q.a*.8;ctx.fillStyle=q.a>.8?'#f4b4d0':'#b88ba6';ctx.fillText(q.c,q.x,q.y)}ctx.globalAlpha=1;
 ctx.font='11px ui-monospace,monospace';ctx.fillStyle='#d6a8c0';ctx.fillText(sceneLabels[activeScene].toUpperCase()+' · ASCII ANIMATION',W/2,H*.91);
 $('bloom').textContent='ANIMAÇÃO '+activeScene+' / 09';$('count').textContent='LETTERS '+String(P.length).padStart(5,'0');$('time').textContent='● '+tt.toFixed(2)+'s';
}
const gp=$('galleryPanel'),gt=$('galleryToggle');
function chooseScene(n){activeScene=n;t=0;last=0;gp.hidden=true;gt.setAttribute('aria-expanded','false');gt.textContent=n?'▦ '+sceneLabels[n]:'▦ Galeria';document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scene===n)))}
gt.addEventListener('click',()=>{gp.hidden=!gp.hidden;gt.setAttribute('aria-expanded',String(!gp.hidden))});
$('galleryClose').addEventListener('click',()=>{gp.hidden=true;gt.setAttribute('aria-expanded','false')});
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>chooseScene(+b.dataset.scene)));
\nfunction loop(now){if(!last)last=now;let dt=Math.min((now-last)/1000,.05);last=now;if(!paused){t+=dt;if(t>LOOP)t=0}render(t,dt);raf=requestAnimationFrame(loop)}
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar'};
$('restart').onclick=()=>{t=0;last=0};
$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.getElementById('stage').requestFullscreen?.();else document.exitFullscreen?.()};
const detailSlider=$('detail');detailSlider.addEventListener('input',()=>{detail=Number(detailSlider.value);$('detailValue').textContent=detail+'%';resize()});
const detailToggle=$('detailToggle'),detailPanel=$('detailPanel');detailToggle.addEventListener('click',()=>{const opening=detailPanel.hidden;detailPanel.hidden=!opening;detailToggle.setAttribute('aria-expanded',String(opening))});
addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('pause').click()}if(e.key.toLowerCase()==='r')$('restart').click();if(e.key.toLowerCase()==='f')$('fullscreen').click();if(e.key==='Escape'&&!gp.hidden){gp.hidden=true;gt.setAttribute('aria-expanded','false')}});
resize();raf=requestAnimationFrame(loop);
})();