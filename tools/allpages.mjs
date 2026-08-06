import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { mine, ROOT } from './root.mjs';
// html 은 루트(index)와 works/ 두 곳에 있다. mine() 이 받는 건 ROOT 기준 상대경로다.
const pages = [
  ...readdirSync(ROOT).filter(f => f.endsWith('.html')),
  ...readdirSync(join(ROOT, 'works')).filter(f => f.endsWith('.html')).map(f => `works/${f}`),
];
const b = await chromium.launch();
for (const f of pages) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  const errs=[];
  p.on('pageerror', e=>errs.push(e.message));
  await p.goto(mine(f), { waitUntil:'domcontentloaded', timeout:30000 });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(async () => {
    await document.fonts.ready;
    const has = (fam)=>[...document.fonts].some(x=>x.family===fam && x.status==='loaded');
    const bodyF = getComputedStyle(document.body).fontFamily.split(',')[0];
    const h = document.querySelector('h1,h2,.work-title,.wd-title,.std-title,.m-title');
    return { mono:has('JetBrains Mono'), serif:has('Cormorant Garamond'), bodyF,
      head: h ? getComputedStyle(h).fontFamily.split(',')[0]+' w'+getComputedStyle(h).fontWeight : '-' };
  });
  console.log(`${f.padEnd(58)} mono=${r.mono?'O':'X'} serif=${r.serif?'O':'X'}  제목:${r.head}${errs.length?'  ERR:'+errs[0].slice(0,60):''}`);
  await ctx.close();
}
await b.close();
