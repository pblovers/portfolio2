// 원본 갤러리 구조 정밀 조사: 각 이미지 x,y,w,h + 앵커여부
import { chromium } from 'playwright';
const slug = process.argv[2] || 'a-deeper-dreamscape';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4200);
await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));} window.scrollTo(0,0); });
await p.waitForTimeout(1200);
await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
await p.waitForTimeout(400);
const out = await p.evaluate(() => {
  return [...document.querySelectorAll('img')].map(i=>{
    const b=i.getBoundingClientRect(); const a=i.closest('a');
    return { x:Math.round(b.x), y:Math.round(b.y+scrollY), w:Math.round(b.width), h:Math.round(b.height),
      inA: a?(a.getAttribute('href')||'').slice(0,30):null, src:(i.currentSrc||i.src).split('/').pop().split('?')[0] };
  }).filter(o=>o.w>100&&o.h>80&&o.y>200).sort((a,b)=>a.y-b.y||a.x-b.x);
});
console.log(`${slug}: docH gallery imgs`);
for(const o of out) console.log(`  y=${o.y} x=${o.x} ${o.w}x${o.h} ${o.inA?('[A '+o.inA+']'):''} ${o.src}`);
await b.close();
