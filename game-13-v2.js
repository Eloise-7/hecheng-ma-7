/* 合成🐎＋7：固定逻辑棋盘 + PBD 多次约束物理 */
(()=>{
  'use strict';

  const W=420,H=700,WALL=10,DROP_Y=74,DANGER_Y=142;
  const GRAVITY=2600,SUBSTEPS=3,ITERATIONS=6,DROP_DELAY=.36;
  const RESTITUTION=.38,WALL_RESTITUTION=.45,REST_THRESHOLD=55,FRICTION=.955;
  const OVER_LIMIT=.6,OVER_REST_SPEED=220,OVER_REST_SPEED2=OVER_REST_SPEED**2;
  const MAX_TIER=12,MAX_BONUS=500,REVIVE_STEP=2000,MERGE_PAD=.8,SPRITE_FILL=.92;
  const ASSET_VERSION='20261011-pbd5';
  const LEVELS=[
    {name:'图标 1',base:18,scale:1,file:'mobile-icon-01.png',color:'#d3a759'},
    {name:'图标 2',base:24,scale:1,file:'mobile-icon-02.png',color:'#bd8a61'},
    {name:'图标 3',base:31,scale:1,file:'mobile-icon-03.png',color:'#f2cf42'},
    {name:'图标 4',base:39,scale:1,file:'mobile-icon-04.png',color:'#e8a968'},
    {name:'图标 5',base:48,scale:1,file:'mobile-icon-05.png',color:'#df8292'},
    {name:'图标 6',base:58,scale:1,file:'mobile-icon-06.png',color:'#6fb8ad'},
    {name:'图标 7',base:80,scale:.8,file:'mobile-icon-07.png',color:'#e8b645'},
    {name:'图标 8',base:82,scale:1,file:'mobile-icon-08.png',color:'#e2a84e'},
    {name:'图标 9',base:96,scale:1,file:'mobile-icon-09.png',color:'#7295c9'},
    {name:'图标 10',base:110,scale:1,file:'mobile-icon-10.png',color:'#8798cc'},
    {name:'图标 11',base:125,scale:1,file:'mobile-icon-11.png',color:'#bca388'},
    {name:'图标 12',base:140,scale:1,file:'mobile-icon-12.png',color:'#3156b8'},
    {name:'图标 13',base:155,scale:1,file:'mobile-icon-13.png',color:'#b8876c'}
  ];
  const MERGE_SCORE=[0,1,3,6,10,15,21,28,36,45,55,66,78];

  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const board=document.getElementById('board'),nextCanvas=document.getElementById('nextIcon'),nextCtx=nextCanvas.getContext('2d');
  const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best');
  const loadMask=document.getElementById('loadMask'),loadText=document.getElementById('loadText'),loadRetry=document.getElementById('loadRetry');
  const reviveBadge=document.getElementById('reviveBadge'),reviveCount=document.getElementById('reviveCount');
  const storage={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
  const sprites=new Array(LEVELS.length),shapes=new Array(LEVELS.length);

  const state={balls:[],particles:[],floats:[],score:0,best:storage.get('merge-pbd-best',storage.get('merge-bounce-best',0)),pending:0,next:0,aimX:W/2,ready:false,cooldown:0,over:false,danger:false,revives:0,reviveGiven:0,flash:0,muted:false,loaded:false};
  let last=0,acc=0,touchAiming=false,touchId=null,audioCtx=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const radius=tier=>LEVELS[tier].base*LEVELS[tier].scale;
  const assetRoot=(location.protocol==='file:'||location.hostname==='127.0.0.1'||location.hostname==='localhost')?'assets/':'';
  const assetUrl=(file,attempt=0)=>assetRoot+file+(location.protocol==='file:'?'':`?v=${ASSET_VERSION}${attempt?'-'+attempt:''}`);
  const spawnTier=()=>Math.floor(Math.random()*5);

  function setupCanvases(){
    const d=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);
    nextCanvas.width=Math.round(64*d);nextCanvas.height=Math.round(64*d);nextCtx.setTransform(d,0,0,d,0,0);
    drawNext();render(0);
  }

  function imagePromise(img,url,timeoutMs=8000){
    return new Promise((resolve,reject)=>{
      let finished=false;
      const finish=(ok,value)=>{if(finished)return;finished=true;clearTimeout(timer);img.onload=null;img.onerror=null;ok?resolve(img):reject(value)};
      const timer=setTimeout(()=>finish(false,new Error('image timeout')),timeoutMs);
      img.onload=()=>finish(true);
      img.onerror=()=>finish(false,new Error('image request failed'));
      img.src=url;
    })
  }
  async function loadOne(tier){
    let lastError;
    for(let attempt=0;attempt<4;attempt++){
      try{
        const img=new Image();img.decoding='async';img.fetchPriority=tier<5?'high':'auto';
        await imagePromise(img,assetUrl(LEVELS[tier].file,attempt));
        if(!img.naturalWidth)throw new Error('empty image');
        prepareAsset(img,tier);return;
      }catch(err){lastError=err;await new Promise(r=>setTimeout(r,350*(attempt+1)))}
    }
    throw lastError||new Error('image load failed');
  }

  function prepareAsset(img,tier){
    const raw=document.createElement('canvas');raw.width=img.naturalWidth;raw.height=img.naturalHeight;
    const rg=raw.getContext('2d',{willReadFrequently:true});rg.drawImage(img,0,0);
    const rd=rg.getImageData(0,0,raw.width,raw.height).data;
    let minX=raw.width,minY=raw.height,maxX=-1,maxY=-1;
    for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(rd[(y*raw.width+x)*4+3]>20){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
    if(maxX<minX||maxY<minY)throw new Error('transparent icon');
    const sw=maxX-minX+1,sh=maxY-minY+1,size=256,usable=size*SPRITE_FILL;
    const scale=Math.min(usable/sw,usable/sh),dw=sw*scale,dh=sh*scale;
    const sprite=document.createElement('canvas');sprite.width=sprite.height=size;
    const sg=sprite.getContext('2d');sg.imageSmoothingEnabled=true;sg.imageSmoothingQuality='high';
    sg.drawImage(raw,minX,minY,sw,sh,(size-dw)/2,(size-dh)/2,dw,dh);
    sprites[tier]=sprite;shapes[tier]=buildShape(sprite);
  }

  function buildShape(sprite){
    const n=96,c=document.createElement('canvas');c.width=c.height=n;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sprite,0,0,n,n);
    const data=g.getImageData(0,0,n,n).data,on=new Uint8Array(n*n),dist=new Float32Array(n*n);
    for(let i=0;i<on.length;i++){on[i]=data[i*4+3]>28?1:0;dist[i]=on[i]?999:0}
    const rt=Math.SQRT2;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(!on[i])continue;let v=dist[i];if(x>0)v=Math.min(v,dist[i-1]+1);if(y>0)v=Math.min(v,dist[i-n]+1);if(x>0&&y>0)v=Math.min(v,dist[i-n-1]+rt);if(x<n-1&&y>0)v=Math.min(v,dist[i-n+1]+rt);dist[i]=v}
    for(let y=n-1;y>=0;y--)for(let x=n-1;x>=0;x--){const i=y*n+x;if(!on[i])continue;let v=dist[i];if(x<n-1)v=Math.min(v,dist[i+1]+1);if(y<n-1)v=Math.min(v,dist[i+n]+1);if(x<n-1&&y<n-1)v=Math.min(v,dist[i+n+1]+rt);if(x>0&&y<n-1)v=Math.min(v,dist[i+n-1]+rt);dist[i]=v}
    const left=on.slice(),parts=[],unit=n*SPRITE_FILL/2;
    // A compact chain of overlapping circles follows the opaque pixels.  The
    // smaller removal radius keeps thin coloured edges represented, so pieces
    // meet at the artwork boundary instead of at an invisible outer box.
    for(let p=0;p<22;p++){
      let best=-1,bestD=-1;
      for(let i=0;i<left.length;i++)if(left[i]&&dist[i]>bestD){bestD=dist[i];best=i}
      if(best<0)break;
      const x=best%n,y=(best/n)|0,pr=Math.max(2.15,bestD*1.03),cover=Math.max(2.35,pr*.96);
      parts.push([(x+.5-n/2)/unit,(y+.5-n/2)/unit,pr/unit]);
      const rr=cover*cover,x0=Math.max(0,Math.floor(x-cover)),x1=Math.min(n-1,Math.ceil(x+cover)),y0=Math.max(0,Math.floor(y-cover)),y1=Math.min(n-1,Math.ceil(y+cover));
      for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++)if((xx-x)**2+(yy-y)**2<=rr)left[yy*n+xx]=0;
    }
    if(!parts.length)parts.push([0,0,1]);
    let rb=0;for(const p of parts)rb=Math.max(rb,Math.hypot(p[0],p[1])+p[2]);
    return{parts,rb:Math.max(.72,rb)};
  }

  async function loadBatches(indices,size=2){
    const errors=[];
    for(let i=0;i<indices.length;i+=size){
      const results=await Promise.allSettled(indices.slice(i,i+size).map(loadOne));
      for(const result of results)if(result.status==='rejected')errors.push(result.reason);
    }
    if(errors.length)throw errors[0];
  }

  async function loadAssets(){
    state.loaded=false;state.ready=false;loadMask.hidden=false;loadRetry.hidden=true;loadText.textContent='正在加载基础图标…';
    try{
      // The five directly droppable tiers are enough to start.  Loading the
      // large later tiers in the background avoids an iOS/WebKit blank-screen
      // stall when one of many simultaneous image decodes is delayed.
      await loadBatches([0,1,2,3,4],2);
      state.loaded=true;loadMask.hidden=true;buildGallery();reset();
      loadBatches(LEVELS.map((_,i)=>i).slice(5),2).then(()=>{buildGallery();drawNext()}).catch(err=>{
        console.error('background icon load failed',err);
        setTimeout(()=>loadBatches(LEVELS.map((_,i)=>i).filter(i=>!sprites[i]),1).then(()=>buildGallery()).catch(console.error),2500);
      });
    }catch(err){loadText.textContent=`基础图标加载失败：${err&&err.message?err.message:'未知错误'}`;loadRetry.hidden=false;console.error(err)}
  }

  function shapeOf(tier){return shapes[tier]||{parts:[[0,0,1]],rb:1}}
  function makeBall(x,y,tier,vx=0,vy=0){
    const r=radius(tier),shape=shapeOf(tier),count=shape.parts.length,mass=r*r;
    const b={x,y,px:x,py:y,vx,vy,pvx:vx,pvy:vy,r,tier,angle:0,mass,invMass:1/mass,bornAt:performance.now(),overTime:0,landed:false,dead:false,contacts:0,parts:shape.parts,rb:shape.rb*r,wx:new Float32Array(count),wy:new Float32Array(count),ws:new Float32Array(count),sq:0,sqA:0};
    syncParts(b);return b;
  }
  function syncParts(b){const c=Math.cos(b.angle),s=Math.sin(b.angle);for(let i=0;i<b.parts.length;i++){const p=b.parts[i],ox=p[0]*b.r,oy=p[1]*b.r;b.wx[i]=b.x+ox*c-oy*s;b.wy[i]=b.y+ox*s+oy*c;b.ws[i]=p[2]*b.r}}
  function topEdge(b){let top=Infinity;for(let i=0;i<b.parts.length;i++)top=Math.min(top,b.wy[i]-b.ws[i]);return top}

  function stepPhysics(dt){
    const balls=state.balls,contacts=[],merges=[];
    for(const b of balls){if(b.dead)continue;b.px=b.x;b.py=b.y;b.vy+=GRAVITY*dt;b.pvx=b.vx;b.pvy=b.vy;b.x+=b.vx*dt;b.y+=b.vy*dt;b.contacts=0;syncParts(b)}
    for(let iter=0;iter<ITERATIONS;iter++){
      for(const b of balls){
        if(b.dead)continue;let pushL=0,pushR=0,pushFloor=0,pushCeil=0;
        for(let k=0;k<b.parts.length;k++){const x=b.wx[k],y=b.wy[k],r=b.ws[k];pushL=Math.max(pushL,WALL-(x-r));pushR=Math.max(pushR,(x+r)-(W-WALL));pushFloor=Math.max(pushFloor,(y+r)-(H-WALL));pushCeil=Math.max(pushCeil,-(y-r))}
        if(pushL>0||pushR>0||pushFloor>0||pushCeil>0){b.x+=Math.max(0,pushL)-Math.max(0,pushR);b.y+=Math.max(0,pushCeil)-Math.max(0,pushFloor);b.contacts++;if(iter===0){if(pushL>0)contacts.push({ball:b,nx:1,ny:0});if(pushR>0)contacts.push({ball:b,nx:-1,ny:0});if(pushFloor>0)contacts.push({ball:b,nx:0,ny:-1});if(pushCeil>0)contacts.push({ball:b,nx:0,ny:1})}syncParts(b)}
      }
      for(let i=0;i<balls.length;i++){
        const a=balls[i];if(a.dead)continue;
        for(let j=i+1;j<balls.length;j++){
          const b=balls[j];if(a.dead||b.dead)continue;const cdx=b.x-a.x,cdy=b.y-a.y,sumRb=a.rb+b.rb;if(cdx*cdx+cdy*cdy>=sumRb*sumRb)continue;
          let gap=Infinity,nx=1,ny=0;
          for(let m=0;m<a.parts.length;m++)for(let k=0;k<b.parts.length;k++){const dx=b.wx[k]-a.wx[m],dy=b.wy[k]-a.wy[m],sum=a.ws[m]+b.ws[k],d2=dx*dx+dy*dy;if(d2>=sum*sum)continue;const d=Math.sqrt(d2),g=d-sum;if(g<gap){gap=g;if(d>.0001){nx=dx/d;ny=dy/d}else{nx=1;ny=0}}}
          if(gap===Infinity||gap>MERGE_PAD)continue;
          if(a.tier===b.tier&&iter===0){a.dead=b.dead=true;merges.push([a,b]);continue}
          if(gap>=0)continue;if(iter===0)contacts.push({a,b,nx,ny});
          const correction=Math.min(-gap+.04,6)*.92,inv=a.invMass+b.invMass,wa=a.invMass/inv,wb=b.invMass/inv;
          a.x-=nx*correction*wa;a.y-=ny*correction*wa;b.x+=nx*correction*wb;b.y+=ny*correction*wb;a.contacts++;b.contacts++;syncParts(a);syncParts(b);
        }
      }
    }
    for(const b of balls){
      if(b.dead)continue;let pushL=0,pushR=0,pushFloor=0,pushCeil=0;
      for(let k=0;k<b.parts.length;k++){const x=b.wx[k],y=b.wy[k],r=b.ws[k];pushL=Math.max(pushL,WALL-(x-r));pushR=Math.max(pushR,(x+r)-(W-WALL));pushFloor=Math.max(pushFloor,(y+r)-(H-WALL));pushCeil=Math.max(pushCeil,-(y-r))}
      if(pushL>0||pushR>0||pushFloor>0||pushCeil>0){b.x+=Math.max(0,pushL)-Math.max(0,pushR);b.y+=Math.max(0,pushCeil)-Math.max(0,pushFloor);b.contacts++;syncParts(b)}
      let vx=(b.x-b.px)/dt,vy=(b.y-b.py)/dt;if(b.contacts){vx*=FRICTION;if(Math.abs(vx)<3)vx=0;if(Math.abs(vy)<7)vy=0}b.vx=vx;b.vy=vy;b.angle+=(b.x-b.px)/Math.max(1,b.r)*.78;if(!b.landed&&(b.contacts||performance.now()-b.bornAt>900))b.landed=true;
    }
    for(const ct of contacts){
      if(ct.ball){const b=ct.ball;if(b.dead)continue;const pre=b.pvx*ct.nx+b.pvy*ct.ny;if(pre<-REST_THRESHOLD){const post=b.vx*ct.nx+b.vy*ct.ny,target=-WALL_RESTITUTION*pre,j=target-post;if(j>0){b.vx+=j*ct.nx;b.vy+=j*ct.ny;squash(b,ct.nx,ct.ny,-pre)}}}
      else{const a=ct.a,b=ct.b;if(a.dead||b.dead)continue;const pre=(a.pvx-b.pvx)*ct.nx+(a.pvy-b.pvy)*ct.ny;if(pre>REST_THRESHOLD){const post=(a.vx-b.vx)*ct.nx+(a.vy-b.vy)*ct.ny,target=-RESTITUTION*pre,j=(post-target)/(a.invMass+b.invMass);if(j>0){a.vx-=j*a.invMass*ct.nx;a.vy-=j*a.invMass*ct.ny;b.vx+=j*b.invMass*ct.nx;b.vy+=j*b.invMass*ct.ny;squash(a,-ct.nx,-ct.ny,pre);squash(b,ct.nx,ct.ny,pre)}}}
    }
    if(merges.length)processMerges(merges);
  }

  function squash(b,nx,ny,speed){const amount=Math.min(.22,speed/1700);if(amount>b.sq){b.sq=amount;b.sqA=Math.atan2(ny,nx)}}
  function processMerges(merges){
    for(const [a,b] of merges){const x=(a.x+b.x)/2,y=(a.y+b.y)/2,t=a.tier;if(t>=MAX_TIER){addScore(MAX_BONUS,x,y,'+500');state.revives++;paintRevives();burst(x,y,t,30);tone(880,.12);state.flash=1}else{const nt=t+1,n=makeBall(x,y,nt,(a.vx+b.vx)/2,(a.vy+b.vy)/2-60);n.x=clamp(n.x,WALL+n.rb,W-WALL-n.rb);n.y=Math.min(n.y,H-WALL-n.rb);n.px=n.x;n.py=n.y;n.landed=true;state.balls.push(n);addScore(MERGE_SCORE[nt],x,y,'+'+MERGE_SCORE[nt]);burst(x,y,nt,8+nt);tone(520+nt*38,.07);if(nt===MAX_TIER)state.flash=1}}
    state.balls=state.balls.filter(b=>!b.dead);
  }

  function burst(x,y,tier,count){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*160;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-45,r:2+Math.random()*3,life:1,color:LEVELS[tier].color})}if(state.particles.length>260)state.particles.splice(0,state.particles.length-260)}
  function addScore(points,x,y,text){state.score+=points;scoreEl.textContent=state.score;if(state.score>state.best){state.best=state.score;bestEl.textContent=state.best;storage.set('merge-pbd-best',state.best)}if(x!==undefined)state.floats.push({x,y,text,life:1});const earned=Math.floor(state.score/REVIVE_STEP);if(earned>state.reviveGiven){state.revives+=earned-state.reviveGiven;state.reviveGiven=earned;paintRevives();state.floats.push({x:W/2,y:205,text:'+1 复活币',life:1.4,big:true})}}
  function paintRevives(){reviveCount.textContent=state.revives;reviveBadge.hidden=state.revives<=0}

  function aimBounds(tier){const r=radius(tier)*shapeOf(tier).rb;return[WALL+r+.5,W-WALL-r-.5]}
  function moveAim(x){const [lo,hi]=aimBounds(state.pending);state.aimX=clamp(x,lo,hi)}
  function drop(){if(!state.loaded||state.over||!state.ready)return;const tier=state.pending,[lo,hi]=aimBounds(tier),x=clamp(state.aimX,lo,hi);state.balls.push(makeBall(x,DROP_Y,tier,0,130));state.ready=false;state.cooldown=DROP_DELAY;state.pending=state.next;state.next=spawnTier();moveAim(state.aimX);drawNext();tone(190,.05)}

  function checkGameOver(dt){let danger=false;for(const b of state.balls){if(b.dead||!b.landed)continue;const top=topEdge(b);if(top<DANGER_Y){danger=true;if(b.vx*b.vx+b.vy*b.vy<OVER_REST_SPEED2){b.overTime+=dt;if(b.overTime>OVER_LIMIT){gameOver();return}}else b.overTime=Math.max(0,b.overTime-dt*2)}else{b.overTime=Math.max(0,b.overTime-dt*2);if(b.overTime>0)danger=true}}state.danger=danger}
  function gameOver(){if(state.over)return;state.over=true;state.ready=false;state.danger=true;tone(110,.3);if(state.revives>0){document.getElementById('reviveScore').textContent=state.score;document.getElementById('coinCount').textContent=`还剩 ${state.revives} 枚`;document.getElementById('reviveModal').classList.add('open')}else settle()}
  function settle(){document.getElementById('reviveModal').classList.remove('open');document.getElementById('finalScore').textContent=state.score;document.getElementById('finalBest').textContent=state.best;document.getElementById('nickLabel').textContent=storage.get('merge-bounce-name','玩家');const rows=storage.get('merge-bounce-scores',[]);rows.unshift({name:storage.get('merge-bounce-name','玩家'),score:state.score,time:Date.now()});storage.set('merge-bounce-scores',rows.slice(0,20));document.getElementById('overModal').classList.add('open')}
  function revive(){if(!state.over||state.revives<=0)return;let topIndex=-1,edge=Infinity;for(let i=0;i<state.balls.length;i++){const e=topEdge(state.balls[i]);if(e<edge){edge=e;topIndex=i}}if(topIndex>=0)state.balls.splice(topIndex,1);state.balls=state.balls.filter(b=>!b.dead&&topEdge(b)>=DANGER_Y+6);for(const b of state.balls)b.overTime=0;state.revives--;state.over=false;state.ready=true;state.cooldown=0;state.danger=false;state.flash=.6;paintRevives();document.getElementById('reviveModal').classList.remove('open');tone(540,.08)}
  function reset(){state.balls=[];state.particles=[];state.floats=[];state.score=0;state.pending=spawnTier();state.next=spawnTier();state.aimX=W/2;state.ready=state.loaded;state.cooldown=0;state.over=false;state.danger=false;state.revives=0;state.reviveGiven=0;state.flash=0;scoreEl.textContent='0';bestEl.textContent=state.best;paintRevives();document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));drawNext();render(0)}

  function update(dt){if(state.over)return;if(!state.ready){state.cooldown-=dt;if(state.cooldown<=0)state.ready=true}const sub=dt/SUBSTEPS;for(let i=0;i<SUBSTEPS;i++)stepPhysics(sub);checkGameOver(dt);for(const b of state.balls)b.sq=Math.max(0,b.sq-b.sq*9*dt);state.flash=Math.max(0,state.flash-dt*2.2)}
  function drawSprite(g,tier,x,y,r,angle=0,sq=0,sqA=0,alpha=1){const sprite=sprites[tier];if(!sprite)return;const size=2*r/SPRITE_FILL;g.save();g.globalAlpha=alpha;g.translate(x,y);g.rotate(angle);if(sq>0){g.rotate(sqA-angle);g.scale(1+sq*.45,1-sq);g.rotate(-(sqA-angle))}g.drawImage(sprite,-size/2,-size/2,size,size);g.restore()}
  function drawBoard(){ctx.save();ctx.strokeStyle='#d8c8aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(WALL,0);ctx.lineTo(WALL,H-WALL);ctx.lineTo(W-WALL,H-WALL);ctx.lineTo(W-WALL,0);ctx.stroke();ctx.setLineDash([8,9]);ctx.strokeStyle=state.danger?'#ec655d':'#d8c9aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(WALL,DANGER_Y);ctx.lineTo(W-WALL,DANGER_Y);ctx.stroke();ctx.restore()}
  function drawAim(){if(state.over||!state.loaded)return;const r=radius(state.pending);ctx.save();ctx.setLineDash([6,8]);ctx.strokeStyle='#d1c1a4aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(state.aimX,DROP_Y+r*.6);ctx.lineTo(state.aimX,H-WALL);ctx.stroke();ctx.restore();drawSprite(ctx,state.pending,state.aimX,DROP_Y,r,0,0,0,state.ready?1:.55)}
  function drawEffects(dt){for(const p of state.particles){p.vy+=720*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*1.7;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;state.particles=state.particles.filter(p=>p.life>0);for(const f of state.floats){f.y-=28*dt;f.life-=dt;ctx.globalAlpha=Math.max(0,Math.min(1,f.life*1.5));ctx.textAlign='center';ctx.font=`800 ${f.big?22:15}px system-ui`;ctx.fillStyle='#674d36';ctx.fillText(f.text,f.x,f.y)}ctx.globalAlpha=1;state.floats=state.floats.filter(f=>f.life>0)}
  function render(dt){ctx.clearRect(0,0,W,H);drawBoard();for(const b of state.balls)if(!b.dead)drawSprite(ctx,b.tier,b.x,b.y,b.r,b.angle,b.sq,b.sqA);drawAim();drawEffects(dt);if(state.flash>0){ctx.globalAlpha=state.flash*.25;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}if(state.danger&&!state.over){ctx.globalAlpha=.06;ctx.fillStyle='#ef6058';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}
  function drawNext(){nextCtx.clearRect(0,0,64,64);if(!state.loaded)return;const r=Math.min(22,radius(state.next));drawSprite(nextCtx,state.next,32,32,r)}
  function buildGallery(){const grid=document.getElementById('mergeGrid');grid.innerHTML='';LEVELS.forEach((level,i)=>{const item=document.createElement('div');item.className='merge-item';const c=document.createElement('canvas'),d=Math.min(devicePixelRatio||1,2);c.width=72*d;c.height=72*d;const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);drawSprite(g,i,36,36,Math.min(27,radius(i)));const label=document.createElement('span');label.textContent=level.name;item.append(c,label);grid.appendChild(item)})}

  function frame(t){if(!last)last=t;const dt=Math.min((t-last)/1000,.033);last=t;acc+=dt;while(acc>=1/60){update(1/60);acc-=1/60}render(dt);requestAnimationFrame(frame)}
  function pointerX(e){const rect=canvas.getBoundingClientRect();return(e.clientX-rect.left)*W/rect.width}
  board.addEventListener('pointermove',e=>{if(state.over)return;if(e.pointerType==='touch'&&!touchAiming)return;moveAim(pointerX(e))});
  board.addEventListener('pointerdown',e=>{if(state.over)return;ensureAudio();moveAim(pointerX(e));if(e.pointerType==='touch'){touchAiming=true;touchId=e.pointerId;try{board.setPointerCapture(e.pointerId)}catch{}}else drop()});
  board.addEventListener('pointerup',e=>{if(e.pointerType!=='touch'||!touchAiming||e.pointerId!==touchId)return;touchAiming=false;touchId=null;if(state.over)return;moveAim(pointerX(e));drop()});
  board.addEventListener('pointercancel',()=>{touchAiming=false;touchId=null});board.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')moveAim(state.aimX-14);if(e.key==='ArrowRight')moveAim(state.aimX+14);if(e.key===' ')drop();if(e.key.toLowerCase()==='r')reset()});

  function ensureAudio(){if(state.muted)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch{}}
  function tone(freq,dur){if(state.muted)return;ensureAudio();if(!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.03,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}
  function showBoard(){const list=storage.get('merge-bounce-scores',[]),el=document.getElementById('leaderList');el.innerHTML='';if(!list.length){const li=document.createElement('li');li.style.gridTemplateColumns='1fr';li.textContent='还没有成绩';el.appendChild(li)}else list.forEach((r,i)=>{const li=document.createElement('li');li.innerHTML=`<span class="rank">${['🥇','🥈','🥉'][i]||i+1}</span><span></span><strong></strong>`;li.children[1].textContent=r.name;li.children[2].textContent=r.score;el.appendChild(li)});document.getElementById('boardModal').classList.add('open')}
  document.getElementById('restartBtn').onclick=reset;document.getElementById('restartBtn2').onclick=reset;document.getElementById('againBtn').onclick=reset;document.getElementById('declineRevive').onclick=settle;document.getElementById('useRevive').onclick=revive;
  document.getElementById('boardBtn').onclick=showBoard;document.getElementById('boardBtn2').onclick=showBoard;document.getElementById('boardBtn3').onclick=showBoard;document.getElementById('boardClose').onclick=()=>document.getElementById('boardModal').classList.remove('open');document.getElementById('boardRefresh').onclick=showBoard;
  document.getElementById('soundBtn').onclick=e=>{state.muted=!state.muted;e.currentTarget.textContent=state.muted?'🔇':'🔊';e.currentTarget.setAttribute('aria-pressed',String(!state.muted));if(!state.muted)tone(520,.06)};
  document.getElementById('helpBtn').onclick=()=>alert('触屏：按住拖动瞄准，松手投放。\n两个相同图标接触会合成。\n图标稳定越过红线约 0.6 秒后结束。');
  document.getElementById('editName').onclick=()=>{const input=document.getElementById('nameInput'),save=document.getElementById('saveName');input.value=storage.get('merge-bounce-name','玩家');input.style.display='block';save.style.display='inline-block';input.focus()};
  document.getElementById('saveName').onclick=()=>{const input=document.getElementById('nameInput'),name=input.value.trim().slice(0,12)||'玩家';storage.set('merge-bounce-name',name);document.getElementById('nickLabel').textContent=name;input.style.display='none';document.getElementById('saveName').style.display='none'};
  loadRetry.onclick=loadAssets;window.addEventListener('resize',setupCanvases);

  bestEl.textContent=state.best;setupCanvases();loadAssets();requestAnimationFrame(frame);
  window.__MA7__={state,reset,drop,revive,LEVELS,shapes,topEdge};
})();
