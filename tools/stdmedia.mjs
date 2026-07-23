// 표준 상세 우측 콘텐츠 블록: 미디어 풀 URL + 좌측 메타(설명 포함) + 블록 간격
import { chromium } from 'playwright';
const slug = process.argv[2] || 'overbloom';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4500);
await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,document.documentElement.scrollHeight); await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); });
await p.evaluate(async () => { const ok=()=>[...document.querySelectorAll('img')].filter(i=>/framerusercontent/.test(i.currentSrc||i.src)).every(i=>i.complete&&i.naturalWidth>0); for(let t=0;t<100&&!ok();t++) await new Promise(r=>setTimeout(r,100)); });
await p.waitForTimeout(400);
await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });

const out = await p.evaluate(() => {
  const abs = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  // 우측 콘텐츠 미디어 (x>=350, see-more 프리뷰 제외: ./slug 앵커)
  const media = [];
  for (const el of document.querySelectorAll('img, video')) {
    const a = el.closest('a'); if (a && /^\.\/[a-z0-9-]+$/.test(a.getAttribute('href')||'')) continue;
    const r = abs(el); if (r.w < 60 || r.h < 40 || r.x < 300) continue;
    let src = el.currentSrc || el.src || '';
    if (el.tagName === 'VIDEO' && !src) { const s = el.querySelector('source'); src = s ? s.src : ''; }
    media.push({ t: el.tagName.toLowerCase(), ...r, src });
  }
  media.sort((a,b)=>a.y-b.y);
  // 좌측 메타(x<350) 텍스트
  const meta = [];
  for (const el of document.querySelectorAll('h1,h2,p,span,a')) {
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (!txt) continue; const r = abs(el); if (r.x >= 350 || r.w < 10 || r.y < 60 || r.y > 700) continue;
    meta.push({ ...r, fs: getComputedStyle(el).fontSize, txt: txt.slice(0,80) });
  }
  meta.sort((a,b)=>a.y-b.y);
  // 좌측 컬럼 sticky 여부
  const leftCol = document.querySelector('h1')?.closest('div');
  return { docH: document.documentElement.scrollHeight, media, meta };
});
console.log(`${slug} — LEFT META:`);
for (const m of out.meta) console.log(`  y=${m.y} x=${m.x} ${m.w}x${m.h} ${m.fs} "${m.txt}"`);
console.log(`\n${slug} — RIGHT MEDIA (docH ${out.docH}):`);
let prev = null;
for (const m of out.media) {
  const gap = prev ? `  gap↑${m.y - prev}` : '';
  console.log(`  y=${m.y} x=${m.x} ${m.w}x${m.h} [${m.t}]${gap}  ${m.src.slice(0,90)}`);
  prev = m.y + m.h;
}
await b.close();
