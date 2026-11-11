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
 const W=cv.width,H=cv.height,scene=activeScene,points=[];
 const palettes={
  1:['#315b38','#55a85c','#8bd47c','#f04465','#ff7897','#ffd6df','#f8c8a0'],
  2:['#72502b','#b58a43','#f4d78c','#fff1bd','#ffffff','#9edfff','#6c9ab9'],
  3:['#432d58','#79518f','#b88acb','#e9c7e8','#f4d5bd','#f0b6ce','#fff0db'],
  4:['#64182d','#a51f42','#e83258','#ff6c83','#ffb2bf','#ffe0e4','#ffffff'],
  5:['#183e75','#246cb4','#48b9d0','#8ce5df','#d6a6f2','#f7c7ff','#fff4cf'],
  6:['#315c45','#57966a','#f2d5e5','#fff0f6','#e8a5c5','#d6b4ff','#ffe7a8'],
  7:['#284e66','#477d98','#8ab8c5','#d9edf0','#fff9e9','#e8c48b','#ffffff'],
  8:['#3e294f','#74436e','#b76c8f','#e7a2b5','#f4d3c5','#f7e8dc','#fff4e9'],
  9:['#182d63','#294c9b','#557ad0','#8ba9f2','#b7b8ff','#f1c8ff','#fff4cf']
 }[scene];
 const add=(x,y,z,nx,ny,nz,m=2,glow=0)=>points.push({x,y,z,nx,ny,nz,m,glow});
 const ell=(cx,cy,cz,rx,ry,rz,m=2,seg=28,rings=16,phase=0)=>{
  for(let j=0;j<=rings;j++){let v=-Math.PI/2+Math.PI*j/rings,cv=Math.cos(v),sv=Math.sin(v);
   for(let i=0;i<seg;i++){let a=TAU*i/seg+phase,ca=Math.cos(a),sa=Math.sin(a),x=rx*cv*ca,y=ry*sv,z=rz*cv*sa;
    add(cx+x,cy+y,cz+z, x/(rx*rx),y/(ry*ry),z/(rz*rz),m,0)}}
 };
 const tube=(fn,steps=80,r=.025,m=1,sides=7)=>{
  for(let i=0;i<=steps;i++){let u=i/steps,q=fn(u),q0=fn(Math.max(0,u-.002)),q1=fn(Math.min(1,u+.002)),dx=q1[0]-q0[0],dy=q1[1]-q0[1],dz=q1[2]-q0[2],l=Math.hypot(dx,dy,dz)||1,ux=dx/l,uy=dy/l,uz=dz/l,ax=-uy,ay=ux,az=0,al=Math.hypot(ax,ay)||1;ax/=al;ay/=al;let bx=uy*az-uz*ay,by=uz*ax-ux*az,bz=ux*ay-uy*ax;
   for(let k=0;k<sides;k++){let a=TAU*k/sides,ca=Math.cos(a),sa=Math.sin(a),nx=ax*ca+bx*sa,ny=ay*ca+by*sa,nz=az*ca+bz*sa;add(q[0]+r*nx,q[1]+r*ny,q[2]+r*nz,nx,ny,nz,m)}}
 };
 const petal=(cx,cy,cz,angle,len,width,depth,m=3,phase=0)=>{
  let ca=Math.cos(angle),sa=Math.sin(angle);
  for(let i=0;i<=24;i++){let u=i/24,ww=width*Math.pow(Math.sin(Math.PI*u),.72)*(0.55+.45*u);
   for(let j=-7;j<=7;j++){let v=j/7,side=v*ww,bulge=depth*Math.sin(Math.PI*u)*(1-v*v);
    let x=len*u*ca-side*sa,y=len*u*sa+side*ca,z=bulge+phase*u;
    add(cx+x,cy+y,cz+z,-v*ca,-v*sa,1,m,0)}}
 };
 const flower=(cx,cy,cz,size,petals=9,base=3,tilt=0)=>{
  tube(u=>[cx,cy-size*1.5*u,cz],35,.012,0);
  for(let k=0;k<petals;k++)petal(cx,cy,cz,(TAU*k/petals)+tilt,size*(.62+.12*Math.sin(k*4)),size*.30,.06,base);
  ell(cx,cy,cz+.025,size*.19,size*.19,.09,4,22,12);
  for(let k=0;k<32;k++){let a=k*2.399,r=size*.14*Math.sqrt((k%17)/17);ell(cx+Math.cos(a)*r,cy+Math.sin(a)*r,cz+.11,.012,.012,.012,6,8,5)}
 };
 const sparkle=(x,y,z,s=1,m=6)=>{for(let k=0;k<8;k++){let a=TAU*k/8; tube(u=>[x+Math.cos(a)*s*u,y+Math.sin(a)*s*u,z+.012],12,.004,m,4)}ell(x,y,z+.02,.018*s,.018*s,.018*s,6,10,6)};
 // Scene-specific 3D constructions. Every object is rebuilt as lit surfaces, not flat text art.
 if(scene===1){ // bouquet
  for(let k=0;k<5;k++){let x=(k-2)*.29,y=.35-Math.abs(k-2)*.06,z=(k%2)*.12; tube(u=>[x*u,y-.12-1.05*u,z],55,.018, k%2?1:0);flower(x,y,z,.30+(k===2?.07:0),10,3,k*.18);
   for(let s of [-1,1])petal(x+s*.12,y-.55,z,s*.8,.35,.13,.035,1)}
  ell(0,-.75,0,.58,.15,.35,2);for(let k=0;k<24;k++){let a=k*TAU/24;ell(Math.cos(a)*.48,-.75+Math.sin(a)*.1,Math.sin(a)*.28,.045,.10,.045,3,10,7)}
 } else if(scene===2){ // gold ring + faceted diamond
  for(let j=0;j<5;j++){let rad=.58-j*.012;for(let i=0;i<180;i++){let a=TAU*i/180;let z=.12*Math.sin(a);add(rad*Math.cos(a),rad*Math.sin(a)-.04,z,Math.cos(a),Math.sin(a),.2, j===0?2:1)}}
  ell(0,.61,.04,.19,.15,.16,4,28,14);
  for(let k=0;k<8;k++){let a=TAU*k/8;petal(0,.70,.08,a,.22,.075,.045,5)}
  sparkle(0,.91,.22,.26,6);for(let k=0;k<12;k++){let a=TAU*k/12;ell(Math.cos(a)*.21,.61+Math.sin(a)*.16,.12,.025,.025,.025,3,8,5)}
 } else if(scene===3){ // ornate masquerade mask
  for(let i=0;i<=44;i++){let x=-.95+1.9*i/44,shape=Math.sqrt(Math.max(0,1-x*x));let top=.28*shape-.05,bottom=-.35*shape-.05;
   for(let j=0;j<=12;j++){let v=j/12,y=top*(1-v)+bottom*v,z=.08+.12*(1-x*x)*(1-v*.4);if(!(Math.abs(x)<.48&&y>-.12&&y<.12))add(x,y,z,.2*x,.15,1,2)}}
  for(let s of [-1,1]){ell(s*.43,.02,.19,.29,.15,.08,4,30,14);ell(s*.43,.02,.26,.19,.075,.045,0,26,12);ell(s*.43,.02,.31,.055,.06,.025,6,18,10);for(let k=0;k<5;k++)petal(s*.83,.28,.08,s*(.25+k*.19),.34,.08,.035,5)}
  for(let k=0;k<13;k++){let x=-.85+k*.14;ell(x,-.43+.05*Math.cos(k),.16,.025,.025,.025,k%2?5:6,8,5)}
  for(let s of [-1,1])for(let k=0;k<5;k++)sparkle(s*(.72+k*.08),.48+k*.08,.12,.08,6);
 } else if(scene===4){ // beating heart
  let beat=1+.07*Math.sin(tt*3.2);
  for(let j=0;j<18;j++){let v=j/17;for(let i=0;i<220;i++){let a=TAU*i/220,x=16*Math.sin(a)**3/18*beat*(.72+.28*v),y=(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/18*beat*(.72+.28*v);add(x,y, (v-.5)*.22,Math.cos(a),Math.sin(a),.4,Math.min(5,2+Math.floor(v*4)),0)}}
  for(let k=0;k<18;k++){let a=TAU*k/18;sparkle(Math.cos(a)*.92,Math.sin(a)*.88,.18,.08,6)}
 } else if(scene===5){ // butterfly wings with veins
  let flap=Math.sin(tt*5.2)*.24;
  ell(0,0,0,.075,.48,.08,1,20,16);
  for(let s of [-1,1])for(let upper=0;upper<2;upper++){
   let angle=s*(upper?-.55:.55)+s*flap;
   let len=upper?.78:.60,w=upper?.52:.40;
   for(let i=0;i<=24;i++){let u=i/24;for(let j=-10;j<=10;j++){let v=j/10,ww=w*Math.sin(Math.PI*u)**.65*(upper?1:.82),x=s*(.04+len*u),y=(upper?.15:-.12)+v*ww+u*.08,z=.06+.10*Math.sin(Math.PI*u)*(1-v*v);add(x,y,z,s*.2,v,1,upper?3:4)}}
   for(let k=1;k<=5;k++){let q=k/6;tube(u=>[s*(.05+len*u), (upper?.15:-.12)+(q-.5)*w*Math.sin(Math.PI*u),.13],30,.008,5)}
   for(let k=0;k<3;k++)ell(s*(.28+k*.16),upper?.28:-.28,.17,.07,.11,.025,k===0?6:5,18,10);
  }
  tube(u=>[-.025+u*.05,.38+u*.36,.02+.08*u],30,.012,5);tube(u=>[.025-u*.05,.38+u*.36,.02+.08*u],30,.012,5);
 } else if(scene===6){ // lily with six curved petals, stamens and leaves
  for(let k=0;k<6;k++){let a=TAU*k/6;petal(0,0,0,a,.98,.30,.12,k%2?3:4);tube(u=>[Math.cos(a)*.18*u,Math.sin(a)*.18*u,.15+.12*u],15,.009,5)}
  ell(0,0,.05,.17,.17,.09,5,24,12);
  for(let k=0;k<7;k++){let a=TAU*k/7; tube(u=>[Math.cos(a)*(.06+.48*u),Math.sin(a)*(.06+.48*u),.16+.08*Math.sin(Math.PI*u)],35,.012,4);ell(Math.cos(a)*.55,Math.sin(a)*.55,.24,.035,.035,.045,6,12,8)}
  tube(u=>[0,-.1-.95*u,-.12],50,.022,1);for(let s of [-1,1])petal(0,-.62,-.1,s*.6,.62,.18,.05,1);
 } else if(scene===7){ // paired swans, curved necks and water rings
  for(let s of [-1,1]){let x=s*.48;
   ell(x,-.35,0,.48,.23,.27,3,36,20,s*.2);
   tube(u=>[x-s*.22*u,-.28+.92*u,.06+.04*Math.sin(u*Math.PI)],65,.075*(1-.35*u),4,9);
   ell(x-s*.22,-.29+.92,.07,.12,.09,.10,4,22,12);
   tube(u=>[x-s*.31,-.28+.96+.08*u,.11],16,.025,5,6);
   ell(x-s*.31,-.28+1.04,.12,.085,.065,.07,6,18,10);
   tube(u=>[x-s*.38,-.28+1.03,.14],10,.025,5,5);
   for(let k=0;k<8;k++)petal(x+s*.1,-.27,.22,TAU*k/8,.32,.08,.025,4);
  }
  for(let k=0;k<4;k++){let r=.38+k*.18;for(let i=0;i<100;i++){let a=TAU*i/100;add(r*Math.cos(a),-.56+.035*Math.sin(a),r*.55*Math.sin(a),Math.cos(a),0,Math.sin(a),1)}}
 } else if(scene===8){ // two articulated dancers
  let beat=tt*2.4,turn=Math.sin(beat)*.24,raise=(.5+.5*Math.sin(beat*1.4));
  for(let s of [-1,1]){let x=s*.32,lean=s*turn,headY=.60+(s>0?.02:0);
   ell(x,headY,.10,.13,.14,.12,s>0?5:4,24,14);
   tube(u=>[x+lean*u*.22,.46-.58*u,.02+.05*Math.sin(u*Math.PI)],38,.065,s>0?4:3,8);
   tube(u=>[x+lean*.2+Math.sin(beat+s)*.16*u,.30-.18*u,.02],22,.035,5,7);
   tube(u=>[x+lean*.2-Math.sin(beat+s)*.17*u,.30-.18*u,.02],22,.035,5,7);
   let armY=.35+raise*.15;
   tube(u=>[x-s*.05*u,armY+.45*u+Math.sin(beat)*.05,.08+.08*u],30,.035,5,7);
   tube(u=>[x+s*.22*u,armY+.15*u,.08],25,.035,5,7);
   for(let k=0;k<5;k++){let a=TAU*k/5;petal(x, -.22,.02,a+lean,.42,.12,.035,s>0?4:3)}
  }
  tube(u=>[-.25+.5*u,.77+.08*Math.sin(Math.PI*u),.12],30,.022,6,7);
 } else if(scene===9){ // layered star field, orbiting constellations and comet
  for(let i=0;i<420;i++){let a=i*2.39996,r=.18+1.25*((i*37%101)/101)**.7,y=-.95+1.9*((i*61%97)/97),z=-.7+1.4*((i*29%89)/89),tw=.5+.5*Math.sin(tt*2+i*1.7);ell(Math.cos(a)*r,y,z,.006+tw*.009,.006+tw*.009,.008,tw>.82?6:3,7,5)}
  for(let k=0;k<5;k++){let a=tt*.35+k*TAU/5,x=Math.cos(a)*(.45+k*.10),y=Math.sin(a)*(.45+k*.10);sparkle(x,y,.45,.11+(k%2)*.05,6)}
  let u=(tt*.17)%1,cx=-1.15+u*2.3,cy=.75-u*1.35;
  for(let k=0;k<70;k++){let q=k/70;ell(cx-q*.55,cy+q*.32,.25-q*.5,.012*(1-q),.012*(1-q),.012, k%4===0?6:4,7,5)}
  sparkle(cx,cy,.3,.18,6);
 }
 // Ambient motes and soft moving glints
 for(let i=0;i<95;i++){let a=i*2.39996+tt*(.12+(i%5)*.025),r=.95+((i*17)%31)/70,y=Math.sin(i*13.7+tt*.22)*.95;add(Math.cos(a)*r,y,Math.sin(a)*.7,.2,.5,.8,6,Math.max(0,Math.sin(tt*2+i))**10)}
 // 3D camera, per-cell depth buffer, normal-based lighting and colored ASCII ramp
 const colsNow=cols,rowsNow=rows,depth=new Float32Array(colsNow*rowsNow);depth.fill(1e9);
 const glyph=new Array(colsNow*rowsNow).fill(' '),light=new Float32Array(colsNow*rowsNow),mat=new Uint8Array(colsNow*rowsNow);
 const eyeY=.20,camZ=4.5,focal=2.75,rot=.10*Math.sin(tt*.35);
 for(const q of points){let x=q.x*Math.cos(rot)+q.z*Math.sin(rot),z=-q.x*Math.sin(rot)+q.z*Math.cos(rot),y=q.y;
  let zz=camZ-z;if(zz<.25)continue;
  let sx=(.5+(x*focal/zz)*.48)*colsNow,sy=(.5-(y-eyeY)*focal/zz*.48*aspect)*rowsNow,ix=sx|0,iy=sy|0;
  if(ix<0||ix>=colsNow||iy<0||iy>=rowsNow)continue;
  let id=iy*colsNow+ix;if(zz>=depth[id])continue;depth[id]=zz;
  let nx=q.nx,ny=q.ny,nz=q.nz,nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
  let diffuse=Math.max(0,nx*(-.35)+ny*.78+nz*.50),spec=Math.max(0,nz*.7+ny*.3)**18;
  let lum=Math.min(1.35,.28+.62*diffuse+.45*spec+q.glow);light[id]=lum;mat[id]=q.m;
  let ramp=' .,:;!|/\\-+*ox%#@$';glyph[id]=ramp[Math.min(ramp.length-1,Math.floor(lum/(1.35)*(ramp.length-1)))];
 }
 ctx.fillStyle='#050308';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.textBaseline='middle';
 const fontSize=Math.max(7,Math.floor(ch*.9));ctx.font='bold '+fontSize+'px ui-monospace,monospace';
 let visible=0;
 for(let i=0;i<glyph.length;i++){if(glyph[i]===' ')continue;visible++;let x=i%colsNow,y=(i/colsNow)|0,l=light[i],color=palettes[Math.min(palettes.length-1,mat[i])];ctx.globalAlpha=Math.min(1,.28+l*.62);ctx.fillStyle=color;ctx.fillText(glyph[i],(x+.5)*cw,(y+.5)*ch)}
 // bright animated stars are rendered as multi-character flares
 if(scene===2||scene===9||scene===3){let pulse=.65+.35*Math.sin(tt*4);ctx.globalAlpha=.75*pulse;ctx.fillStyle=palettes[palettes.length-1];ctx.font='bold '+Math.max(12,Math.floor(ch*1.7))+'px monospace';ctx.fillText(scene===2?'✧':'✦',W/2,H*.31)}
 ctx.globalAlpha=1;
 ctx.font='11px ui-monospace,monospace';ctx.fillStyle=palettes[palettes.length-1];ctx.fillText(sceneLabels[scene].toUpperCase()+' · 3D ASCII ANIMATION',W/2,H*.91);
 $('bloom').textContent='ANIMAÇÃO '+scene+' / 09 · 3D';$('count').textContent='LETTERS '+String(visible).padStart(5,'0');$('time').textContent='● '+tt.toFixed(2)+'s';
}
const gp=$('galleryPanel'),gt=$('galleryToggle');
function chooseScene(n){activeScene=n;t=0;last=0;gp.hidden=true;gt.setAttribute('aria-expanded','false');gt.textContent=n?'▦ '+sceneLabels[n]:'▦ Galeria';document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scene===n)))}
gt.addEventListener('click',()=>{gp.hidden=!gp.hidden;gt.setAttribute('aria-expanded',String(!gp.hidden))});
$('galleryClose').addEventListener('click',()=>chooseScene(0));
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>chooseScene(+b.dataset.scene)));

function loop(now){if(!last)last=now;let dt=Math.min((now-last)/1000,.05);last=now;if(!paused){t+=dt;if(t>LOOP)t=0}render(t,dt);raf=requestAnimationFrame(loop)}
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar'};
$('restart').onclick=()=>{t=0;last=0};
$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.getElementById('stage').requestFullscreen?.();else document.exitFullscreen?.()};
const detailSlider=$('detail');detailSlider.addEventListener('input',()=>{detail=Number(detailSlider.value);$('detailValue').textContent=detail+'%';resize()});
const detailToggle=$('detailToggle'),detailPanel=$('detailPanel');detailToggle.addEventListener('click',()=>{const opening=detailPanel.hidden;detailPanel.hidden=!opening;detailToggle.setAttribute('aria-expanded',String(opening))});
addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('pause').click()}if(e.key.toLowerCase()==='r')$('restart').click();if(e.key.toLowerCase()==='f')$('fullscreen').click();if(e.key==='Escape'&&!gp.hidden){gp.hidden=true;gt.setAttribute('aria-expanded','false')}});
resize();raf=requestAnimationFrame(loop);
})();