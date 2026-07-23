// 표준 그룹 상세(예: works/overbloom) 원본 구조 조사
// 좌측 메타 컬럼 + 우측 콘텐츠 블록 카탈로그
import { chromium } from 'playwright';
const slug = process.argv[2] || 'overbloom';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4500);
// 전체 스크롤로 lazy 로드
await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,document.documentElement.scrollHeight); await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); });
await p.evaluate(async () => { const ok=()=>[...document.querySelectorAll('img')].filter(i=>/framerusercontent/.test(i.currentSrc||i.src)).every(i=>i.complete&&i.naturalWidth>0); for(let t=0;t<100&&!ok();t++) await new Promise(r=>setTimeout(r,100)); });
await p.waitForTimeout(500);
await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
await p.waitForTimeout(300);

const out = await p.evaluate(() => {
  const docH = document.documentElement.scrollHeight;
  // 모든 유의미한 요소(img, video, 텍스트 블록)를 위→아래로
  const items = [];
  // 미디어
  for (const el of document.querySelectorAll('img, video')) {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 30) continue;
    const tag = el.tagName.toLowerCase();
    items.push({ t: tag, x: Math.round(r.x), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height),
      src: ((el.currentSrc||el.src||'')+'').split('/').pop().split('?')[0].slice(0,24) });
  }
  // 텍스트 (leaf 텍스트 노드 보유 요소)
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,span,a,li')) {
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (!txt || txt.length>120) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 10 || r.height < 8) continue;
    const cs = getComputedStyle(el);
    items.push({ t: 'txt', x: Math.round(r.x), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height),
      fs: cs.fontSize, ff: cs.fontFamily.split(',')[0].replace(/["']/g,'').slice(0,14), txt: txt.slice(0,50) });
  }
  items.sort((a,b)=> a.y-b.y || a.x-b.x);
  return { docH, W: innerWidth, items };
});
console.log(`${slug} @ ${W}x${H}  docH=${out.docH}`);
for (const o of out.items) {
  if (o.t === 'txt') console.log(`  y=${String(o.y).padStart(5)} x=${String(o.x).padStart(4)} ${String(o.w).padStart(4)}x${String(o.h).padStart(3)} [txt ${o.fs} ${o.ff}] "${o.txt}"`);
  else console.log(`  y=${String(o.y).padStart(5)} x=${String(o.x).padStart(4)} ${String(o.w).padStart(4)}x${String(o.h).padStart(3)} [${o.t}] ${o.src}`);
}
await b.close();
