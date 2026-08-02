// 메인홈 모바일 원본 vs 구현 비교 캡처. 같은 폭/스크롤에서 나란히 저장.
import { chromium } from 'playwright';
import { mine, ROOT } from './root.mjs';
import { join } from 'node:path';
const b = await chromium.launch();
const W = parseInt(process.argv[2] || '375', 10);
const H = parseInt(process.argv[3] || '812', 10);

async function shoot(url, tag, isOrig) {
  const ctx = await b.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  if (!isOrig) await p.route('**/lenis.min.js', r=>r.abort());
  await p.goto(url, { waitUntil:'domcontentloaded', timeout:60000 });
  await p.waitForTimeout(isOrig ? 4000 : 1000);
  if (isOrig) { try { await p.evaluate(()=>{ try{window.lenis&&window.lenis.destroy()}catch(e){} }); } catch(e){} }
  else { await p.evaluate(()=>{ try{if(window.WR&&WR.lenis){WR.lenis.destroy();WR.lenis=null;}}catch(e){} }); }
  await p.evaluate(()=>{ document.documentElement.style.scrollBehavior='auto'; });
  const maxY = await p.evaluate(()=> document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
  const positions = [0, Math.round(maxY*0.22), Math.round(maxY*0.45), Math.round(maxY*0.7), maxY];
  let i=0;
  for (const y of positions) {
    await p.evaluate((yy)=>{ document.scrollingElement.scrollTop=yy; }, y);
    await p.waitForTimeout(isOrig?900:400);
    await p.screenshot({ path: join(ROOT,'tools','diff', `mc-${tag}-${W}-${i}.png`) });
    i++;
  }
  console.log(`${tag} ${W}: maxY=${Math.round(maxY)} positions=${positions.join(',')}`);
  await ctx.close();
}

await shoot('https://www.wildyriftian.com/', 'orig', true);
await shoot(mine('index.html'), 'mine', false);
await b.close();
