// 원본 vs 구현 masonry 대조 (열 분배·docH) — photoworks 상세
import { chromium } from 'playwright';
import { mine } from './root.mjs';
const slug = process.argv[2] || 'a-deeper-dreamscape';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);

async function grab(url, isOrig) {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(isOrig ? 4200 : 1000);
  await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));} window.scrollTo(0,0); });
  await p.waitForTimeout(isOrig ? 1000 : 400);
  await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
  const r = await p.evaluate(() => {
    // 갤러리만: 메타 아래(y>250), 열폭(150~600), see-more 프리뷰(./slug 앵커) 제외
    const gal = [...document.querySelectorAll('img')].filter(i=>{
      const a=i.closest('a'); if(a && /^\.\/[a-z0-9-]+$/.test(a.getAttribute('href')||'')) return false;
      const b=i.getBoundingClientRect(); return (b.y+scrollY)>250 && b.width>150 && b.width<600 && b.height>100;
    }).map(i=>{const b=i.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y+scrollY),w:Math.round(b.width),h:Math.round(b.height)};});
    // 열 그룹핑 (x 반올림)
    const colsX = [...new Set(gal.map(o=>o.x))].sort((a,b)=>a-b);
    const cols = colsX.map(cx => gal.filter(o=>Math.abs(o.x-cx)<10).sort((a,b)=>a.y-b.y));
    return { docH: document.documentElement.scrollHeight, colsX, colCounts: cols.map(c=>c.length), colBottoms: cols.map(c=> Math.max(...c.map(o=>o.y+o.h))) };
  });
  await b.close();
  return r;
}

const orig = await grab(`https://www.wildyriftian.com/works/${slug}`, true);
const impl = await grab(mine(`work-${slug}.html`), false);
console.log(`${slug} @ ${W}x${H}`);
console.log('ORIG:', JSON.stringify(orig));
console.log('MINE:', JSON.stringify(impl));
console.log('docH diff:', impl.docH - orig.docH);
