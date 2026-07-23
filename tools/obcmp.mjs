// overbloom 구현 vs 원본 블록 위치 대조
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, mine } from './root.mjs';
const orig = JSON.parse(readFileSync(join(ROOT,'tools','stddata-overbloom.json'),'utf8'));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(mine('work-overbloom.html'), { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(1200);
await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
await p.waitForTimeout(400);
const m = await p.evaluate(() => {
  const abs = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const out = { docH: document.documentElement.scrollHeight, blocks: [], title:null, cat:null, year:null, desc:null, para:null, tools:null, sm:null };
  out.title = abs(document.querySelector('.std-title'));
  out.cat = abs(document.querySelector('.std-cat'));
  out.year = abs(document.querySelector('.std-year'));
  out.desc = abs(document.querySelector('.std-desc'));
  out.para = abs(document.querySelector('.std-para'));
  out.tools = abs(document.querySelector('.std-credit'));
  out.sm = abs(document.querySelector('.wd-seemore-title'));
  for (const el of document.querySelectorAll('.std-content > .std-block')) out.blocks.push(abs(el));
  return out;
});
await b.close();

console.log('=== META (mine vs orig) ===');
const ol = orig.meta.lines;
console.log(`title  mine y${m.title.y} x${m.title.x} w${m.title.w}  | orig y128 x32 w312`);
console.log(`cat    mine y${m.cat.y}  | orig y208`);
console.log(`year   mine y${m.year.y}  | orig y232`);
console.log(`desc   mine y${m.desc.y}  | orig y280`);
console.log(`para   mine y${m.para.y} x${m.para.x} w${m.para.w}  | orig y2221 x720 w688`);
console.log(`tools  mine y${m.tools.y} x${m.tools.x}  | orig y2337 x720`);
console.log('\n=== BLOCKS (mine) vs orig content ===');
const oc = orig.blocks.filter(x=>x.x<400);
console.log(`mine docH ${m.docH} | orig docH ${orig.docH}`);
m.blocks.forEach((bl,i)=>{
  const o = i===0 ? {y:128,h:581,note:'hero'} : (oc[i-1]||{});
  console.log(`  block${i} mine y${bl.y} x${bl.x} ${bl.w}x${bl.h}  | orig y${o.y||'?'} ${o.w||''}x${o.h||''}`);
});
console.log(`seemore mine y${m.sm.y} | orig y5997`);
