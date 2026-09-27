/* =====================================================================
   能量场测猫 · 纯前端 Demo
   - 上传手背照 → Canvas 曝光↓饱和↑ 显影
   - 检测白墙背景下的手部肤色 → 按 HSL 判定 9 种能量光
   - 能量 → 猫性格 → 品种 → 参数化 SVG 生成
   - 全部本地运行，零依赖，可直接托管 GitHub Pages
   ===================================================================== */

/* ---------- 九色能量场表（含文化溯源，仅供参考/娱乐向） ---------- */
const ENERGY = {
  gray:  { name:'灰光', color:'#9aa0a8', meaning:'情绪差、身体不佳',
    ref:'西医 aura 研究称灰/浊色代表能量耗竭、疲惫（colorwithleo）。',
    cat:{ breed:'英国短毛猫', personality:'沉稳治愈，像一位不说话却一直在的陪伴者。',
          fur:'#9aa0a8', eye:'#5b6470', pattern:'solid', ear:'round' } },
  black: { name:'黑光', color:'#2b2b30', meaning:'身处混沌',
    ref:'中医五色「黑属水、主肾虚/混沌」；西方 aura 黑=负面能量堆积。',
    cat:{ breed:'孟买猫', personality:'神秘而护主，在混沌里替你守住一处光。',
          fur:'#2b2b30', eye:'#f2c84b', pattern:'solid', ear:'round' } },
  blue:  { name:'蓝光', color:'#5b8fd6', meaning:'心平气和、定力十足',
    ref:'aura 蓝=宁静、直觉、深度（colorwithleo / easternalignment）。',
    cat:{ breed:'俄罗斯蓝猫', personality:'清冷自持，定力如山，陪你安静地待着。',
          fur:'#8aa0c8', eye:'#2f6db0', pattern:'solid', ear:'round' } },
  pink:  { name:'粉光', color:'#f3a6c0', meaning:'幸福感强',
    ref:'aura 粉=爱、温暖、柔软、治愈（easternalignment）。',
    cat:{ breed:'布偶猫', personality:'黏人爱撒娇，把幸福感直接蹭到你脸上。',
          fur:'#f3c6cf', eye:'#4f9d7a', pattern:'point', ear:'round' } },
  red:   { name:'红光', color:'#e8503f', meaning:'正直、行大运中',
    ref:'aura 红=活力、勇气、行动力（搜狗百科·人体辉光）。',
    cat:{ breed:'橘猫（黄狸）', personality:'招财又率真，正直的人自带红运气场。',
          fur:'#e8943f', eye:'#3a5a40', pattern:'tabby', ear:'round' } },
  green: { name:'绿光', color:'#5fae6b', meaning:'身心健康',
    ref:'中医青/肝主疏泄；aura 绿=疗愈、成长、平衡（easternalignment）。',
    cat:{ breed:'缅因猫', personality:'温和的巨人，身心稳稳当当，给你踏实感。',
          fur:'#7fae6b', eye:'#caa64a', pattern:'tabby', ear:'tuft' } },
  white: { name:'白光', color:'#eef0f3', meaning:'善良',
    ref:'中医白属金/肺、主纯净；aura 白=纯净、本真（colorwithleo）。',
    cat:{ breed:'白色波斯猫', personality:'温润纯善，像一束不刺眼的光。',
          fur:'#f4f1ea', eye:'#8a8f99', pattern:'solid', ear:'round' } },
  gold:  { name:'金光', color:'#e8c24a', meaning:'得道、智慧',
    ref:'aura 金=高灵性、智慧（easternalignment）；五行「黄为土、在色为黄」。',
    cat:{ breed:'金渐层', personality:'通透沉静，自带智慧气场，不争而全。',
          fur:'#e8c66a', eye:'#7a5a2a', pattern:'solid', ear:'round' } },
  purple:{ name:'紫光', color:'#9b6fd6', meaning:'灵性高、洞察力强',
    ref:'aura 紫=灵性、超感、转化（colorwithleo / 搜狗百科·人体辉光）。',
    cat:{ breed:'暹罗猫', personality:'敏锐善察，灵性十足，像能看透你心思的伙伴。',
          fur:'#b9a7d6', eye:'#3f7d6e', pattern:'point', ear:'point' } },
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

/* ---------- 图片处理：显影 + 取手部肤色 ---------- */
function processImage(img){
  const max=1000;
  const scale=Math.min(1, max/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.round(img.naturalWidth*scale), h=Math.round(img.naturalHeight*scale);
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,w,h);
  const d=ctx.getImageData(0,0,w,h); const px=d.data;

  let sr=0,sg=0,sb=0,sn=0, total=px.length/4;
  for(let i=0;i<px.length;i+=4){
    let r=px[i],g=px[i+1],b=px[i+2];
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
    const isWhite=mx>235&&(mx-mn)<18;     // 白墙背景
    const isDark=mx<25;
    if(!isWhite&&!isDark){ sr+=r; sg+=g; sb+=b; sn++; }
    // 显影：曝光↓（压暗）+ 饱和↑（拉满）
    const {h,s,l}=rgb2hsl(r,g,b);
    const nr=hsl2rgb(h,1.0,Math.max(0,l*0.42));
    px[i]=nr[0]; px[i+1]=nr[1]; px[i+2]=nr[2];
  }
  ctx.putImageData(d,0,0);

  // 手部肤色不足则回退到中心区域
  let skin;
  if(sn < total*0.02){
    const x0=Math.floor(w*0.3),x1=Math.floor(w*0.7),y0=Math.floor(h*0.3),y1=Math.floor(h*0.7);
    let cr=0,cg=0,cb=0,cn=0;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i=(y*w+x)*4; cr+=px[i]; cg+=px[i+1]; cb+=px[i+2]; cn++; }
    skin=[cr/cn, cg/cn, cb/cn];
  } else {
    skin=[sr/sn, sg/sn, sb/sn];
  }
  return {canvas:cv, skin};
}

/* ---------- 猫 SVG（参数化） ---------- */
function catInner(e){
  const c=e.cat, fur=c.fur;
  const dark=shade(fur,-0.28), light=shade(fur,0.4);
  const earFill=(c.pattern==='point')?dark:fur;
  const earInner=shade((c.pattern==='point')?dark:fur,0.3);
  let stripes='';
  if(c.pattern==='tabby'){
    stripes=`<path d="M120 74 L115 104 M103 78 L98 106 M137 78 L142 106" stroke="${dark}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.55"/>`;
  }
  let mask='';
  if(c.pattern==='point'){
    mask=`<path d="M52 82 L42 28 L102 70 Z" fill="${dark}"/><path d="M188 82 L198 28 L138 70 Z" fill="${dark}"/>
          <ellipse cx="120" cy="152" rx="36" ry="28" fill="${dark}" opacity="0.85"/>`;
  }
  const tuft=(c.ear==='tuft')?`<path d="M58 70 L52 50 L66 64 Z" fill="${dark}"/><path d="M182 70 L188 50 L174 64 Z" fill="${dark}"/>`:'';
  return `
    <defs>
      <radialGradient id="glow" cx="50%" cy="46%" r="56%">
        <stop offset="0%" stop-color="${e.color}" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="${e.color}" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="${e.color}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="120" cy="120" r="116" fill="url(#glow)"/>
    <path d="M52 82 L42 28 L102 70 Z" fill="${earFill}"/>
    <path d="M188 82 L198 28 L138 70 Z" fill="${earFill}"/>
    <path d="M60 76 L54 44 L92 68 Z" fill="${earInner}"/>
    <path d="M180 76 L186 44 L148 68 Z" fill="${earInner}"/>
    ${tuft}
    ${mask}
    <ellipse cx="120" cy="132" rx="80" ry="72" fill="${fur}"/>
    ${stripes}
    <ellipse cx="92" cy="128" rx="15" ry="19" fill="${light}" opacity="0.5"/>
    <ellipse cx="148" cy="128" rx="15" ry="19" fill="${light}" opacity="0.5"/>
    <ellipse cx="92" cy="128" rx="15" ry="19" fill="#fff"/>
    <ellipse cx="148" cy="128" rx="15" ry="19" fill="#fff"/>
    <ellipse cx="92" cy="128" rx="6" ry="14" fill="#15151a"/>
    <ellipse cx="148" cy="128" rx="6" ry="14" fill="#15151a"/>
    <circle cx="88" cy="122" r="3.5" fill="#fff"/>
    <circle cx="144" cy="122" r="3.5" fill="#fff"/>
    <ellipse cx="92" cy="128" rx="15" ry="19" fill="${c.eye}" opacity="0.28"/>
    <ellipse cx="148" cy="128" rx="15" ry="19" fill="${c.eye}" opacity="0.28"/>
    <path d="M114 150 L126 150 L120 158 Z" fill="#3a2a2a" opacity="0.7"/>
    <path d="M120 158 Q112 168 104 162 M120 158 Q128 168 136 162" stroke="#3a3a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M70 140 L30 132 M70 150 L32 152 M170 140 L210 132 M170 150 L208 152" stroke="#d8d8d8" stroke-width="2" stroke-linecap="round"/>
  `;
}
function buildCat(e){
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" width="240" height="240">${catInner(e)}</svg>`;
}

/* ---------- 分享卡 SVG（可转 PNG） ---------- */
function buildShareCard(e){
  const inner=catInner(e);
  return `<svg viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg" width="600" height="800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shade(e.color,-0.55)}"/>
        <stop offset="100%" stop-color="#0f1226"/>
      </linearGradient>
    </defs>
    <rect width="600" height="800" fill="url(#bg)"/>
    <text x="300" y="74" text-anchor="middle" fill="#fff" font-size="30" font-weight="700" font-family="PingFang SC,Microsoft YaHei,sans-serif">能量场 · 专属同频猫</text>
    <text x="300" y="106" text-anchor="middle" fill="#cdd2ea" font-size="15" font-family="PingFang SC,Microsoft YaHei,sans-serif">测测你的能量场能吸引到哪只猫咪</text>
    <circle cx="300" cy="190" r="44" fill="${e.color}" stroke="#fff" stroke-opacity="0.3" stroke-width="3"/>
    <text x="300" y="268" text-anchor="middle" fill="${e.color}" font-size="30" font-weight="700" font-family="PingFang SC,Microsoft YaHei,sans-serif">${e.name}</text>
    <text x="300" y="300" text-anchor="middle" fill="#fff" font-size="17" font-family="PingFang SC,Microsoft YaHei,sans-serif">${e.meaning}</text>
    <g transform="translate(180,340)">${inner}</g>
    <text x="300" y="612" text-anchor="middle" fill="#fff" font-size="22" font-weight="700" font-family="PingFang SC,Microsoft YaHei,sans-serif">${e.cat.breed}</text>
    <text x="300" y="646" text-anchor="middle" fill="#cdd2ea" font-size="14" font-family="PingFang SC,Microsoft YaHei,sans-serif">${e.cat.personality}</text>
    <text x="300" y="760" text-anchor="middle" fill="#8b93bd" font-size="12" font-family="PingFang SC,Microsoft YaHei,sans-serif">娱乐向测试 · 非科学诊断</text>
  </svg>`;
}

/* ---------- DOM 流程 ---------- */
const $ = s=>document.querySelector(s);
const drop=$('#drop'), fileInput=$('#fileInput');
const previewWrap=$('#previewWrap'), canvasBox=$('#canvasBox');
const loading=$('#loading'), errorBox=$('#error'), result=$('#result');

drop.addEventListener('click',()=>fileInput.click());
drop.addEventListener('dragover',e=>{e.preventDefault(); drop.style.borderColor='var(--brand)';});
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
  $('#catBox').innerHTML=buildCat(e);
  $('#catBreed').textContent=e.cat.breed;
  $('#catPersonality').textContent=e.cat.personality;
  result.hidden=false;
  result.scrollIntoView({behavior:'smooth'});
}

/* 下载分享卡 PNG */
$('#downloadPng').addEventListener('click',()=>{
  const e=currentEnergy(); if(!e) return;
  const svg=buildShareCard(e);
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const img=new Image();
  img.onload=()=>{
    const c=document.createElement('canvas'); c.width=600; c.height=800;
    c.getContext('2d').drawImage(img,0,0,600,800);
    c.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='能量猫咪_'+e.name+'.png'; a.click(); },'image/png');
  };
  img.src=url;
});
/* 下载猫咪 SVG */
$('#downloadSvg').addEventListener('click',()=>{
  const e=currentEnergy(); if(!e) return;
  const blob=new Blob([buildCat(e)],{type:'image/svg+xml;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='猫咪_'+e.cat.breed+'.svg'; a.click();
});
$('#restart').addEventListener('click',()=>{ result.hidden=true; previewWrap.hidden=true; canvasBox.innerHTML=''; fileInput.value=''; });

/* 记录当前结果供下载使用 */
function currentEnergy(){ return _cur; }

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
