import { chromium } from 'playwright';
import { mine } from './root.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
const failed=[];
p.on('requestfailed', r => failed.push(r.url()));
await p.goto(mine('index.html'), { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(2500);
const r = await p.evaluate(async () => {
  await document.fonts.ready;
  const loaded = [...document.fonts].map(f=>`${f.family} ${f.weight} ${f.status}`);
  const pick = (sel) => { const e=document.querySelector(sel); if(!e) return sel+': 없음';
    const cs=getComputedStyle(e); return `${sel}  family=${cs.fontFamily}  weight=${cs.fontWeight}  optical=${cs.fontOpticalSizing}`; };
  return { loaded:[...new Set(loaded)],
    el:[pick('.work-title'), pick('.tb-title'), pick('.word-script'), pick('.work-desc')] };
});
console.log('로드된 폰트:'); r.loaded.forEach(x=>console.log('  '+x));
console.log('\n요소별 적용:'); r.el.forEach(x=>console.log('  '+x));
if(failed.length){console.log('\n실패한 요청:'); failed.forEach(u=>console.log('  '+u));}
await b.close();
