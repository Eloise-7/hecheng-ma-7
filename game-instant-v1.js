/* 合成🐎＋7：固定逻辑棋盘 + PBD 多次约束物理 */
(()=>{
  'use strict';

  const W=420,H=700,WALL=10,DROP_Y=74,DANGER_Y=142;
  const GRAVITY=2600,SUBSTEPS=3,ITERATIONS=6,DROP_DELAY=.36;
  const RESTITUTION=.38,WALL_RESTITUTION=.45,REST_THRESHOLD=55,FRICTION=.955;
  const OVER_LIMIT=.6,OVER_REST_SPEED=220,OVER_REST_SPEED2=OVER_REST_SPEED**2;
  const MAX_TIER=12,MAX_BONUS=500,REVIVE_STEP=2000,MERGE_PAD=.8,SPRITE_FILL=.92;
  const ASSET_VERSION='20261011-instant1',ATLAS_FILE='icon-atlas-v2.webp',ATLAS_CELL=256,ATLAS_COLS=4,TINY_CELL=48;
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
  // 与参考游戏相同：首屏使用脚本内嵌的极小真实图标图集，完整图集在后台替换。
  const PLACEHOLDER_ATLAS='data:image/webp;base64,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';
  // 异形碰撞轮廓离线生成，手机启动时不再逐像素扫描和计算距离场。
  const PRECOMPUTED_SHAPES=[{"parts":[[-0.1698,-0.0793,0.4288],[-0.4869,-0.3963,0.3628],[0.1925,0.1245,0.3612],[0.4642,0.351,0.2969],[0.1698,-0.3736,0.2446],[0.5322,-0.3963,0.2429],[0.6907,-0.5774,0.1979],[-0.7812,-0.1925,0.1786],[0.668,0.5548,0.1593],[0.8492,-0.7133,0.1359],[0.2378,-0.6001,0.1166],[-0.8945,-0.0566,0.1166],[0.4189,0.6454,0.1126],[-0.4416,-0.7586,0.0893],[-0.668,-0.7133,0.0893],[0.5548,0.0793,0.0893],[0.3284,-0.668,0.066],[-0.6001,0.2151,0.066],[-0.1925,0.351,0.066],[0.0113,0.4642,0.066],[0.0566,0.5322,0.066],[0.1019,0.6227,0.066]],"rb":1.2449},{"parts":[[0.3963,0.5774,0.4625],[0.3736,0.1245,0.3032],[0.3284,-0.5095,0.2059],[-0.034,0.736,0.1883],[0.3284,-0.7133,0.1729],[0.3963,-0.1698,0.1729],[-0.2151,0.7812,0.1359],[0.668,0.2151,0.0893],[0.2604,-0.8718,0.0796],[-0.7133,0.8039,0.0796],[0.3963,-0.8718,0.07],[0.4642,-0.351,0.07],[0.2831,-0.3057,0.07],[-0.6227,0.7812,0.07],[-0.5548,0.8039,0.07],[-0.4869,0.8039,0.07],[-0.4189,0.8039,0.07],[-0.351,0.8039,0.07],[0.1019,0.2378,0.066],[-0.0566,0.5548,0.0563],[0.2151,-0.9398,0.0487],[0.4416,-0.9398,0.0487]],"rb":1.1628},{"parts":[[0.0113,-0.2831,0.5937],[0.0113,0.3736,0.3965],[0.1925,0.7133,0.1166],[0.2604,0.9171,0.0893],[-0.4416,0.1019,0.0796],[0.2151,0.8265,0.07],[0.0793,-0.8492,0.0563],[-0.2604,0.6454,0.0563],[-0.5548,-0.3736,0.0487],[-0.5548,-0.2151,0.0487],[0.2831,0.6454,0.0487],[0.0793,-0.9171,0.0487],[-0.5322,-0.4642,0.0487],[-0.5322,-0.1019,0.0487],[0.3963,0.351,0.0487],[0.351,0.9398,0.0487],[0.0793,-0.9851,0.0487],[0.1472,-0.9624,0.0487],[-0.1245,-0.8492,0.0487],[-0.0566,-0.8492,0.0487],[0.1472,-0.8492,0.0487],[-0.1925,-0.8265,0.0487]],"rb":1.0519},{"parts":[[0.3057,-0.1472,0.5598],[-0.668,0.1925,0.2992],[0.7586,-0.5548,0.2196],[0.351,0.3963,0.2116],[-0.1472,-0.4416,0.2099],[-0.3963,0.3284,0.1786],[-0.1472,0.1472,0.1593],[0.8492,-0.0566,0.1319],[-0.5548,0.4642,0.1319],[-0.2151,0.3057,0.1263],[-0.8945,0.0113,0.103],[0.2378,0.6227,0.103],[0.4416,0.6001,0.099],[-0.5548,-0.0793,0.0933],[0.5095,0.6907,0.0893],[0.8039,0.0793,0.0796],[0.8265,-0.2831,0.07],[0.8492,-0.2151,0.07],[-0.3963,0.0793,0.07],[-0.3284,0.0793,0.07],[-0.6454,-0.1019,0.066],[0.7586,0.1472,0.066]],"rb":1.1594},{"parts":[[-0.0113,0.0113,0.5791],[-0.0113,0.5774,0.3032],[-0.4642,-0.736,0.1633],[0.4416,-0.668,0.1633],[-0.3963,-0.5774,0.1593],[0.3736,-0.5095,0.1496],[0.5095,-0.8265,0.1319],[-0.5322,-0.8945,0.1166],[0.1698,0.8265,0.1166],[-0.1925,0.8265,0.1126],[0.2831,0.6001,0.099],[-0.3736,-0.4189,0.0893],[-0.3057,0.6001,0.0893],[0.1698,0.9398,0.0796],[-0.2604,0.9171,0.07],[0.2378,0.736,0.066],[-0.1925,0.9398,0.0563],[-0.5774,-0.0113,0.0487],[-0.5774,0.0566,0.0487],[-0.5548,0.1472,0.0487],[-0.5322,0.2151,0.0487],[-0.4189,-0.8945,0.0487]],"rb":1.1574},{"parts":[[-0.1245,-0.0793,0.5631],[0.3963,0.0793,0.4665],[-0.5548,0.2604,0.2526],[-0.668,-0.0793,0.2116],[0.6454,0.4642,0.1689],[0.351,-0.3736,0.1456],[0.1019,0.4189,0.1359],[-0.6454,-0.2831,0.1263],[0.7812,0.5548,0.1263],[-0.0793,0.4642,0.1166],[0.2151,-0.5095,0.1126],[0.8492,0.1019,0.103],[0.8492,0.4416,0.103],[-0.1019,0.5774,0.103],[0.1245,0.5774,0.103],[0.4869,-0.4189,0.099],[-0.7586,0.1245,0.099],[-0.8718,0.3057,0.099],[-0.736,0.4416,0.099],[-0.8492,0.4642,0.099],[-0.8718,-0.0566,0.0933],[0.736,-0.2151,0.0893]],"rb":1.0845},{"parts":[[-0.0113,0.1472,0.5977],[-0.034,-0.4416,0.5398],[0.2151,0.6907,0.2212],[-0.2604,0.668,0.2059],[0.5095,0.3963,0.1496],[-0.5322,0.3963,0.1399],[-0.2831,0.8718,0.1359],[-0.5322,-0.6001,0.1263],[0.4416,-0.6907,0.1223],[0.2604,0.9171,0.1166],[0.1472,0.8945,0.103],[0.5774,0.2378,0.0933],[0.2378,-0.8945,0.0893],[0.3284,-0.8265,0.0893],[-0.4189,-0.8039,0.0893],[-0.4869,-0.7133,0.0893],[-0.5774,0.2604,0.0796],[0.3963,0.5548,0.0796],[0.1245,-0.9398,0.07],[0.5774,0.1245,0.07],[-0.1925,-0.9398,0.066],[-0.2604,-0.9171,0.066]],"rb":1.07},{"parts":[[-0.0113,-0.1472,0.4561],[-0.0113,0.3057,0.2912],[-0.1019,-0.5774,0.2872],[-0.0113,0.6001,0.2099],[0.1925,-0.5548,0.1883],[-0.0113,0.8039,0.1826],[-0.351,-0.4416,0.103],[-0.1925,-0.8492,0.0933],[0.1245,-0.736,0.07],[-0.3963,-0.5322,0.066],[0.351,-0.4642,0.066],[-0.2151,-0.9398,0.0563],[-0.1245,0.9398,0.0563],[0.1925,-0.736,0.0487],[0.351,-0.3963,0.0487],[0.2604,0.2151,0.0487],[-0.034,0.9851,0.0487],[-0.1019,-0.8718,0.0487],[-0.3963,-0.6001,0.0487],[0.3736,-0.5322,0.0487],[-0.2831,0.3736,0.0487],[0.2604,0.3736,0.0487]],"rb":1.0344},{"parts":[[-0.0113,-0.3736,0.4898],[-0.1472,0.4869,0.4095],[0.2378,0.6001,0.3032],[-0.5322,0.6001,0.2872],[-0.1472,0.0793,0.2526],[0.5322,0.6454,0.2486],[-0.8039,0.6907,0.2099],[0.7586,0.736,0.1633],[0.1245,0.0793,0.099],[-0.3736,-0.0566,0.07],[-0.9624,0.8265,0.07],[-0.3736,0.8265,0.07],[0.8945,0.8265,0.07],[-0.1472,-0.8265,0.066],[0.1245,-0.8265,0.066],[-0.2151,-0.8039,0.0563],[0.1925,-0.8039,0.0563],[-0.2831,-0.7586,0.0563],[0.4642,-0.4189,0.0563],[-0.4869,0.2831,0.0563],[0.7586,0.5548,0.0563],[0.2604,-0.7586,0.0487]],"rb":1.3386},{"parts":[[-0.1698,0.4416,0.5841],[-0.1698,-0.4642,0.5598],[0.3736,0.6227,0.4198],[-0.6001,0.8039,0.2196],[0.7133,0.8492,0.1633],[0.351,0.2151,0.099],[0.7812,0.6227,0.0933],[0.1019,0.9398,0.0933],[0.2831,-0.7586,0.0893],[-0.7133,0.6001,0.0893],[-0.4642,-0.9171,0.0796],[-0.6227,-0.7586,0.0796],[-0.668,-0.668,0.0796],[0.3284,-0.668,0.07],[0.351,-0.6001,0.07],[0.8039,0.7133,0.07],[-0.7586,0.9624,0.07],[-0.4416,0.9624,0.07],[0.6001,0.9624,0.07],[-0.5322,-0.8718,0.066],[0.1925,-0.8718,0.066],[-0.5774,-0.8265,0.066]],"rb":1.2954},{"parts":[[-0.0113,-0.3057,0.6064],[-0.0113,0.2831,0.5551],[-0.5322,0.3963,0.1633],[-0.351,-0.8039,0.1399],[-0.4869,0.5548,0.1319],[0.351,-0.7812,0.1263],[-0.1472,-0.8718,0.1126],[0.5322,0.2378,0.103],[-0.3963,0.668,0.099],[-0.034,-0.8945,0.0933],[0.0566,-0.8945,0.0933],[0.1472,-0.8718,0.0893],[-0.1245,0.8039,0.0893],[0.1019,0.8039,0.0893],[-0.4416,-0.9171,0.0796],[0.4416,-0.8718,0.0796],[0.2378,-0.8492,0.0796],[0.4416,-0.6907,0.07],[-0.1019,0.8945,0.07],[0.5095,-0.5774,0.066],[0.5095,0.1245,0.066],[-0.3057,0.736,0.066]],"rb":1.0975},{"parts":[[0.3057,0.6454,0.3925],[0.2378,-0.034,0.3459],[0.3736,-0.736,0.2679],[0.3963,0.2604,0.2292],[0.1245,0.2831,0.1826],[0.3057,-0.4869,0.1553],[-0.0793,-0.1472,0.1496],[-0.2604,-0.1698,0.1263],[0.034,0.9171,0.1166],[-0.4869,-0.2378,0.1126],[0.1925,-0.3736,0.099],[0.0113,-0.2831,0.099],[-0.3963,-0.1698,0.0893],[0.5548,0.9398,0.07],[-0.1925,-0.0566,0.066],[-0.3057,-0.3736,0.0487],[0.0793,-0.351,0.0487],[-0.2831,-0.3057,0.0487],[-0.6227,-0.2831,0.0487],[-0.6001,-0.1925,0.0487],[0.6001,0.3736,0.0487],[0.6227,0.8492,0.0487]],"rb":1.1613},{"parts":[[0.1245,-0.2604,0.7231],[0.034,0.5095,0.5285],[-0.4642,0.6907,0.3499],[0.4869,0.7586,0.2639],[-0.7586,0.8718,0.1633],[0.736,0.8718,0.1553],[-0.2378,0.9398,0.0933],[0.3057,0.9398,0.0933],[-0.5322,-0.034,0.066],[-0.4869,0.0793,0.066],[-0.034,-0.9398,0.0563],[-0.1019,-0.9171,0.0563],[-0.4416,0.1472,0.0563],[-0.8039,0.7133,0.0563],[0.034,-0.9624,0.0487],[0.1019,-0.9624,0.0487],[-0.1698,-0.8945,0.0487],[-0.2831,-0.8265,0.0487],[-0.5322,-0.4869,0.0487],[-0.5548,-0.4189,0.0487],[-0.5548,-0.1019,0.0487],[-0.7812,0.5774,0.0487]],"rb":1.3189}];

  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const board=document.getElementById('board'),nextCanvas=document.getElementById('nextIcon'),nextCtx=nextCanvas.getContext('2d');
  const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best');
  const loadMask=document.getElementById('loadMask'),loadText=document.getElementById('loadText'),loadRetry=document.getElementById('loadRetry');
  const reviveBadge=document.getElementById('reviveBadge'),reviveCount=document.getElementById('reviveCount');
  const storage={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
  const sprites=new Array(LEVELS.length),shapes=PRECOMPUTED_SHAPES;

  const state={balls:[],particles:[],floats:[],score:0,best:storage.get('merge-pbd-best',storage.get('merge-bounce-best',0)),pending:0,next:0,aimX:W/2,ready:false,cooldown:0,over:false,danger:false,revives:0,reviveGiven:0,flash:0,muted:false,loaded:false};
  let last=0,acc=0,touchAiming=false,touchId=null,audioCtx=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const radius=tier=>LEVELS[tier].base*LEVELS[tier].scale;
  const assetRoot=(location.protocol==='file:'||location.hostname==='127.0.0.1'||location.hostname==='localhost')?'assets/':'';
  const assetUrl=(file,attempt=0)=>assetRoot+file+(location.protocol==='file:'?'':`?v=${ASSET_VERSION}${attempt?'-'+attempt:''}`);
  const rootAssetUrl=(file,attempt=0)=>file+(location.protocol==='file:'?'':`?v=${ASSET_VERSION}${attempt?'-'+attempt:''}`);
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

  async function fetchAtlas(){
    let lastError;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const atlas=new Image();atlas.decoding='async';atlas.fetchPriority='high';
        await imagePromise(atlas,rootAssetUrl(ATLAS_FILE,attempt),7000);
        if(!atlas.naturalWidth)throw new Error('empty atlas');
        return atlas;
      }catch(err){lastError=err;await new Promise(r=>setTimeout(r,300*(attempt+1)))}
    }
    throw lastError||new Error('atlas load failed');
  }

  function installAtlas(atlas,cell){
    for(let tier=0;tier<LEVELS.length;tier++){
      const sprite=document.createElement('canvas');sprite.width=sprite.height=256;
      const sg=sprite.getContext('2d');sg.imageSmoothingEnabled=true;sg.imageSmoothingQuality='high';
      sg.drawImage(atlas,(tier%ATLAS_COLS)*cell,Math.floor(tier/ATLAS_COLS)*cell,cell,cell,0,0,256,256);
      sprites[tier]=sprite;
    }
  }

  function prepareAsset(img,tier){
    const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
    const raw=document.createElement('canvas');raw.width=iw;raw.height=ih;
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
    state.loaded=false;state.ready=false;loadMask.hidden=true;loadRetry.hidden=true;
    // 与奶龙相同：高清请求立刻开始，但不阻塞首屏与操作。
    const fullAtlasJob=fetchAtlas();
    try{
      const tiny=new Image();tiny.decoding='async';
      await imagePromise(tiny,PLACEHOLDER_ATLAS,1500);
      installAtlas(tiny,TINY_CELL);
      state.loaded=true;buildGallery();reset();
    }catch(tinyError){
      console.warn('inline placeholder unavailable',tinyError);
      loadMask.hidden=false;loadText.textContent='正在恢复图标…';
    }
    try{
      const atlas=await fullAtlasJob;
      installAtlas(atlas,ATLAS_CELL);
      if(!state.loaded){state.loaded=true;loadMask.hidden=true;buildGallery();reset()}
      else{buildGallery();drawNext()}
    }catch(atlasError){
      console.warn('atlas unavailable, using individual icons',atlasError);
      if(state.loaded)return;
      try{
        const jobs=LEVELS.map((_,i)=>loadOne(i));
        await Promise.all(jobs.slice(0,5));
        state.loaded=true;loadMask.hidden=true;buildGallery();reset();
        Promise.allSettled(jobs.slice(5)).then(()=>{buildGallery();drawNext()});
      }catch(err){loadText.textContent=`基础图标加载失败：${err&&err.message?err.message:'未知错误'}`;loadRetry.hidden=false;console.error(err)}
    }
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
