// 원본 갤러리의 실제 DOM(querySelectorAll) 순서 + 위치 — 소스순서 판별용
import { chromium } from 'playwright';
const slug = process.argv[2] || 'speed-limit';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4200);
await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=300){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,110));} window.scrollTo(0,document.documentElement.scrollHeight); await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); });
await p.evaluate(async () => { const ok=()=>[...document.querySelectorAll('img')].filter(i=>/framerusercontent/.test(i.currentSrc||i.src)).every(i=>i.complete&&i.naturalWidth>0); for(let t=0;t<100&&!ok();t++) await new Promise(r=>setTimeout(r,100)); });
await p.waitForTimeout(400);
const out = await p.evaluate(() => {
  // DOM 순서 그대로 (querySelectorAll)
  return [...document.querySelectorAll('img')].filter(i=>{
    const a=i.closest('a'); if(a&&/^\.\/[a-z0-9-]+$/.test(a.getAttribute('href')||'')) return false;
    const r=i.getBoundingClientRect(); return /framerusercontent/.test(i.currentSrc||i.src)&&r.width>150&&r.height>100&&(r.y+scrollY)>250;
  }).map((i,idx)=>{const r=i.getBoundingClientRect();const c=Math.round(r.x)===32?0:(Math.round(r.x)<600?1:2);
    return {dom:idx, col:c, y:Math.round(r.y+scrollY), x:Math.round(r.x), h:Math.round(r.height), id:(i.currentSrc||'').split('/').pop().slice(0,10)};});
});
console.log(`${slug} — DOM order (col = 실제 배치 열):`);
for(const o of out) console.log(`  dom${o.dom} col${o.col} y=${o.y} h=${o.h} ${o.id}`);
// round-robin 예측과 비교
console.log('round-robin(i%3) 예측 col:', out.map(o=>o.dom%3).join(''));
console.log('실제 col:                  ', out.map(o=>o.col).join(''));
await b.close();
