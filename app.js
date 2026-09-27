/* =====================================================================
   能量场测猫 · 纯前端 Demo（手帐治愈画风）
   - 上传手背照 → Canvas 曝光 -100 / 饱和 +100 显影
   - 取手边缘的光晕（而非墙体/全手平均）→ 按 HSL 判定 9 种能量光
   - 能量 → 猫性格 → 品种 PNG 图 + 手帐风分享卡
   - 全部本地运行，零依赖，可直接托管 GitHub Pages
   ===================================================================== */

/* ---------- 处理参数（对应修图滑杆：曝光 -100 · 饱和 +100） ---------- */
const EXPOSURE = -100;   // 曝光 -100 ≈ 减一档，亮度 ×0.5
const SATURATION = 100;  // 饱和 +100 = 拉满（s→1）

/* ---------- 九色能量场表（含文化溯源，仅供参考/娱乐向） ---------- */
const ENERGY = {
  gray:  { name:'灰光', color:'#9aa0a8', meaning:'情绪差、身体不佳',
    ref:'西医 aura 研究称灰/浊色代表能量耗竭、疲惫（colorwithleo）。',
    cat:{ breed:'英短', img:'cats/british.png',
          personality:'沉稳治愈，像一位不说话却一直在的陪伴者。' } },
  black: { name:'黑光', color:'#2b2b30', meaning:'身处混沌',
    ref:'中医五色「黑属水、主肾虚/混沌」；西方 aura 黑=负面能量堆积。',
    cat:{ breed:'黑猫', img:'cats/black.png',
          personality:'神秘而护主，在混沌里替你守住一处光。' } },
  blue:  { name:'蓝光', color:'#5b8fd6', meaning:'心平气和、定力十足',
    ref:'aura 蓝=宁静、直觉、深度（colorwithleo / easternalignment）。',
    cat:{ breed:'蓝猫', img:'cats/blue.png',
          personality:'清冷自持，定力如山，陪你安静地待着。' } },
  pink:  { name:'粉光', color:'#f3a6c0', meaning:'幸福感强',
    ref:'aura 粉=爱、温暖、柔软、治愈（easternalignment）。',
    cat:{ breed:'布偶', img:'cats/ragdoll.png',
          personality:'黏人爱撒娇，把幸福感直接蹭到你脸上。' } },
  red:   { name:'红光', color:'#e8503f', meaning:'正直、行大运中',
    ref:'aura 红=活力、勇气、行动力（搜狗百科·人体辉光）。',
    cat:{ breed:'橘猫', img:'cats/orange.png',
          personality:'招财又率真，正直的人自带红运气场。' } },
  green: { name:'绿光', color:'#5fae6b', meaning:'身心健康',
    ref:'中医青/肝主疏泄；aura 绿=疗愈、成长、平衡（easternalignment）。',
    cat:{ breed:'缅因', img:'cats/maine.png',
          personality:'温和的巨人，身心稳稳当当，给你踏实感。' } },
  white: { name:'白光', color:'#eef0f3', meaning:'善良',
    ref:'中医白属金/肺、主纯净；aura 白=纯净、本真（colorwithleo）。',
    cat:{ breed:'白色波斯', img:'cats/persian.png',
          personality:'温润纯善，像一束不刺眼的光。' } },
  gold:  { name:'金光', color:'#e8c24a', meaning:'得道、智慧',
    ref:'aura 金=高灵性、智慧（easternalignment）；五行「黄为土、在色为黄」。',
    cat:{ breed:'金渐层', img:'cats/golden.png',
          personality:'通透沉静，自带智慧气场，不争而全。' } },
  purple:{ name:'紫光', color:'#9b6fd6', meaning:'灵性高、洞察力强',
    ref:'aura 紫=灵性、超感、转化（colorwithleo / 搜狗百科·人体辉光）。',
    cat:{ breed:'暹罗', img:'cats/siamese.png',
          personality:'敏锐善察，灵性十足，像能看透你心思的伙伴。' } },
};

/* ---------- 颜色工具 ---------- */
function rgb2hsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b); const d=mx-mn;
  let h=0;
  if(d!==0){
    if(mx===r) h=((g-b)/d)%6;
    else if(mx===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60; if(h<0) h+=360;
  }
  const l=(mx+mn)/2;
  const s = d===0 ? 0 : d/(1-Math.abs(2*l-1));
  return {h, s, l};
}
function hsl2rgb(h,s,l){
  const c=(1-Math.abs(2*l-1))*s; const x=c*(1-Math.abs((h/60)%2-1)); const m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;}
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
function shade(hex,amt){ // amt -1..1, 负=变暗
  const c=parseInt(hex.slice(1),16);
  let r=(c>>16)&255,g=(c>>8)&255,b=c&255;
  const f=amt<0?0:255, t=Math.abs(amt);
  r=Math.round((f-r)*t)+r; g=Math.round((f-g)*t)+g; b=Math.round((f-b)*t)+b;
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

/* ---------- 能量判定 ---------- */
function classify(r,g,b){
  const {h,s,l}=rgb2hsl(r,g,b);
  if(l<0.20) return 'black';
  if(s<0.16) return (l>0.82)?'white':'gray';
  if(l>0.88 && s<0.35) return 'white';   // 极浅肤色 → 白光
  if(h<18||h>=352) return 'red';
  if(h<55) return 'gold';      // 橙→金
  if(h<170) return 'green';    // 黄绿→绿→青绿
  if(h<260) return 'blue';     // 青→蓝
  if(h<320) return 'purple';   // 蓝紫→紫
  return 'pink';               // 品红→粉
}

/* ---------- 图片处理：显影 + 取手边缘光晕 ---------- */
function processImage(img){
  const max=1000;
  const scale=Math.min(1, max/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.round(img.naturalWidth*scale), h=Math.round(img.naturalHeight*scale);
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,w,h);
  const d=ctx.getImageData(0,0,w,h); const px=d.data;
  const total=w*h;
  const mask=new Uint8Array(total);       // 1=主体（非白墙/非死黑）
  const expo=Math.pow(2, EXPOSURE/100);   // 曝光 -100 → ×0.5
  const sat=Math.min(1, 1+SATURATION/100);// 饱和 +100 → s=1

  let sr=0,sg=0,sb=0,sn=0;                // 主体平均（回退用）
  for(let i=0;i<px.length;i+=4){
    const idx=i>>2;
    const r=px[i],g=px[i+1],b=px[i+2];
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
    const isWhite=mx>235&&(mx-mn)<18;     // 白墙背景
    const isDark=mx<25;                   // 死黑
    if(!isWhite&&!isDark){
      mask[idx]=1; sr+=r; sg+=g; sb+=b; sn++;
    }
    // 显影：曝光 -100 + 饱和 +100（在 HSL 上做）
    const {h:hh,s:ss,l:ll}=rgb2hsl(r,g,b);
    const nl=Math.max(0,ll*expo);
    const ns=Math.min(1,ss*sat);
    const nr=hsl2rgb(hh,ns,nl);
    px[i]=nr[0]; px[i+1]=nr[1]; px[i+2]=nr[2];
  }
  ctx.putImageData(d,0,0);

  /* 第二遍：在显影后的图上取「手边缘的光晕」——
     只统计主体中靠近背景边界的边缘带像素（不是墙体，也不是全手平均） */
  const R=4;                              // 边缘带厚度（px）
  let er=0,eg=0,eb=0,en=0;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const idx=y*w+x;
      if(!mask[idx]) continue;
      let edge=false;
      for(let dy=-R;dy<=R&&!edge;dy+=2){
        const ny=y+dy; if(ny<0||ny>=h) continue;
        for(let dx=-R;dx<=R&&!edge;dx+=2){
          const nx=x+dx; if(nx<0||nx>=w) continue;
          if(!mask[ny*w+nx]) edge=true;   // 邻域内有背景 → 属于边缘带
        }
      }
      if(edge){
        const p=idx*4; er+=px[p]; eg+=px[p+1]; eb+=px[p+2]; en++;
      }
    }
  }
  let skin;
  if(en >= total*0.001){                  // 边缘带样本充足 → 用光晕色
    skin=[er/en, eg/en, eb/en];
  } else if(sn>0){                        // 回退：全主体平均
    skin=[sr/sn, sg/sn, sb/sn];
  } else {                                // 再回退：中心区域
    const x0=Math.floor(w*0.3),x1=Math.floor(w*0.7),y0=Math.floor(h*0.3),y1=Math.floor(h*0.7);
    let cr=0,cg=0,cb=0,cn=0;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i=(y*w+x)*4; cr+=px[i]; cg+=px[i+1]; cb+=px[i+2]; cn++; }
    skin=[cr/cn, cg/cn, cb/cn];
  }
  return {canvas:cv, skin};
}

/* ---------- 工具：加载图片 ---------- */
function loadImg(src){
  return new Promise((res,rej)=>{
    const im=new Image();
    im.onload=()=>res(im); im.onerror=()=>rej(new Error('图片加载失败：'+src));
    im.src=src;
  });
}

/* ---------- 手帐风分享卡（canvas 绘制 → PNG） ---------- */
function drawShareCard(ctx, e, catImg){
  const W=600,H=800;
  // 纸张底
  ctx.fillStyle='#fbf5e9'; ctx.fillRect(0,0,W,H);
  // 点阵纹理
  ctx.fillStyle='rgba(190,160,110,.10)';
  for(let y=40;y<H;y+=36) for(let x=40;x<W;x+=36){ ctx.beginPath(); ctx.arc(x,y,1.4,0,7); ctx.fill(); }
  // 能量色晕
  const glow=ctx.createRadialGradient(W/2,470,40,W/2,470,250);
  glow.addColorStop(0,e.color+'66'); glow.addColorStop(1,e.color+'00');
  ctx.fillStyle=glow; ctx.fillRect(0,220,W,520);
  // 顶部和纸胶带
  ctx.save(); ctx.translate(W/2,34); ctx.rotate(-0.03);
  ctx.fillStyle=e.color+'99'; ctx.fillRect(-70,-14,140,28); ctx.restore();
  // 文案
  ctx.textAlign='center'; ctx.fillStyle='#5b4a3a';
  ctx.font='700 30px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('能量场 · 专属同频猫', W/2, 106);
  ctx.font='15px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle='#8a7660';
  ctx.fillText('测测你的能量场能吸引到哪只猫咪', W/2, 136);
  // 能量圆点 + 名称
  ctx.beginPath(); ctx.arc(W/2,190,26,0,7); ctx.fillStyle=e.color; ctx.fill();
  ctx.lineWidth=3; ctx.strokeStyle='#fffdf6'; ctx.stroke();
  ctx.font='700 30px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle=shade(e.color,-0.25); ctx.fillText(e.name, W/2, 262);
  ctx.font='17px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle='#5b4a3a';
  ctx.fillText(e.meaning, W/2, 294);
  // 猫图（圆角）
  const s=320, x=(W-s)/2, y=330, r=22;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+s,y,x+s,y+s,r); ctx.arcTo(x+s,y+s,x,y+s,r);
  ctx.arcTo(x,y+s,x,y,r); ctx.arcTo(x,y,x+s,y,r); ctx.closePath();
  ctx.clip(); ctx.drawImage(catImg,x,y,s,s); ctx.restore();
  // 品种 & 性格
  ctx.font='700 24px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle='#5b4a3a';
  ctx.fillText(e.cat.breed, W/2, 700);
  ctx.font='14px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle='#8a7660';
  ctx.fillText(e.cat.personality, W/2, 728);
  ctx.font='12px "PingFang SC","Microsoft YaHei",sans-serif'; ctx.fillStyle='#b3a187';
  ctx.fillText('娱乐向测试 · 非科学诊断', W/2, 776);
}

/* ---------- DOM 流程 ---------- */
const $ = s=>document.querySelector(s);
const drop=$('#drop'), fileInput=$('#fileInput');
const previewWrap=$('#previewWrap'), canvasBox=$('#canvasBox');
const loading=$('#loading'), errorBox=$('#error'), result=$('#result');

drop.addEventListener('click',()=>fileInput.click());
drop.addEventListener('dragover',e=>{e.preventDefault(); drop.style.borderColor='var(--accent)';});
drop.addEventListener('dragleave',()=>{drop.style.borderColor='';});
drop.addEventListener('drop',e=>{e.preventDefault(); drop.style.borderColor=''; if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);});
fileInput.addEventListener('change',e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); });

function showError(msg){ errorBox.textContent=msg; errorBox.hidden=false; }
function hideError(){ errorBox.hidden=true; }

function handleFile(file){
  hideError();
  if(!file.type.startsWith('image/')){ showError('请上传图片文件（手背照）。'); return; }
  loading.hidden=false; result.hidden=true; previewWrap.hidden=true;
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const {canvas,skin}=processImage(img);
        canvasBox.innerHTML=''; canvasBox.appendChild(canvas);
        previewWrap.hidden=false;
        const key=classify(skin[0],skin[1],skin[2]);
        const e=ENERGY[key];
        render(e);
      }catch(err){ showError('处理失败：'+err.message); }
      finally{ loading.hidden=true; }
    };
    img.onerror=()=>{ loading.hidden=true; showError('图片无法加载，请换一张。'); };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}

let _cur=null;
function render(e){
  _cur=e;
  $('#swatch').style.background=e.color; $('#swatch').style.color=e.color;
  $('#energyName').textContent=e.name;
  $('#energyMeaning').textContent=e.meaning;
  $('#energyRef').textContent='溯源：'+e.ref;
  $('#catBox').innerHTML='<img src="'+e.cat.img+'" alt="'+e.cat.breed+'"/>';
  $('#catBreed').textContent=e.cat.breed;
  $('#catPersonality').textContent=e.cat.personality;
  result.hidden=false;
  result.scrollIntoView({behavior:'smooth'});
}

function currentEnergy(){ return _cur; }

/* 完全重置：清空能量光 + 猫咪匹配，回到初始状态 */
$('#restart').addEventListener('click',()=>{
  _cur=null;
  result.hidden=true; previewWrap.hidden=true;
  canvasBox.innerHTML='';
  $('#catBox').innerHTML='';
  $('#catBreed').textContent='';
  $('#catPersonality').textContent='';
  $('#energyName').textContent='';
  $('#energyMeaning').textContent='';
  $('#energyRef').textContent='';
  $('#swatch').style.background='';
  $('#swatch').style.color='';
  hideError();
  fileInput.value='';
  window.scrollTo({top:0, behavior:'smooth'});
});

/* 下载分享卡 PNG（canvas 手绘） */
$('#downloadPng').addEventListener('click', async ()=>{
  const e=currentEnergy(); if(!e) return;
  try{
    const catImg=await loadImg(e.cat.img);
    const c=document.createElement('canvas'); c.width=600; c.height=800;
    drawShareCard(c.getContext('2d'), e, catImg);
    c.toBlob(b=>{
      const a=document.createElement('a');
      a.href=URL.createObjectURL(b);
      a.download='能量猫咪_'+e.name+'.png'; a.click();
    },'image/png');
  }catch(err){ showError('生成分享卡失败：'+err.message); }
});

/* 保存猫咪原图 PNG */
$('#downloadCat').addEventListener('click', ()=>{
  const e=currentEnergy(); if(!e) return;
  const a=document.createElement('a');
  a.href=e.cat.img; a.download=e.cat.breed+'.png'; a.click();
});

/* 渲染能量表 */
(function renderRef(){
  const ul=$('#refList');
  ul.innerHTML=Object.values(ENERGY).map(e=>`
    <li>
      <span class="r-dot" style="background:${e.color}"></span>
      <span class="r-name">${e.name}</span> · ${e.meaning}
      <div class="r-ref">${e.ref} 匹配猫：${e.cat.breed}</div>
    </li>`).join('');
})();
