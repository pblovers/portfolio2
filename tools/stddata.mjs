// 표준 상세 전체 데이터 추출 → tools/stddata-<slug>.json
// 좌측 메타(제목/카테고리/연도/설명) + 우측 콘텐츠 블록(풀 URL) + Tools 텍스트 + see-more
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';
const slug = process.argv[2] || 'overbloom';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4500);
await p.evaluate(async () => { for (let y=0;y<document.documentElement.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,document.documentElement.scrollHeight); await new Promise(r=>setTimeout(r,1500)); window.scrollTo(0,0); });
await p.evaluate(async () => { const ok=()=>[...document.querySelectorAll('img')].filter(i=>/framerusercontent/.test(i.currentSrc||i.src)).every(i=>i.complete&&i.naturalWidth>0); for(let t=0;t<100&&!ok();t++) await new Promise(r=>setTimeout(r,100)); });
await p.waitForTimeout(400);
await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });

const data = await p.evaluate(() => {
  const abs = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y+scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const out = { docH: document.documentElement.scrollHeight, meta: {}, blocks: [], seemore: [] };
  // 좌측 메타
  const h1 = document.querySelector('h1');
  out.meta.title = h1 ? h1.textContent.trim() : null;
  // 좌측(x<350) 텍스트 y순
  const lt = [];
  for (const el of document.querySelectorAll('h1,h2,p,span,a')) {
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (!txt) continue; const r = abs(el); if (r.x>=350||r.w<10||r.y<100||r.y>700) continue;
    lt.push({ y:r.y, x:r.x, txt, fs:getComputedStyle(el).fontSize });
  }
  lt.sort((a,b)=>a.y-b.y);
  out.meta.lines = lt;
  // 우측 콘텐츠 미디어 (see-more 앵커 제외, 메뉴 썸네일(y<700 & 정사각) 제외)
  for (const el of document.querySelectorAll('img, video')) {
    const a = el.closest('a'); const href = a ? (a.getAttribute('href')||'') : '';
    const r = abs(el);
    let src = el.currentSrc || el.src || ''; if (el.tagName==='VIDEO'&&!src){const s=el.querySelector('source');src=s?s.src:'';}
    if (/^\.\/[a-z0-9-]+$/.test(href)) { out.seemore.push({ slug: href.slice(2), y:r.y, x:r.x, w:r.w, h:r.h }); continue; }
    if (r.w<200 || r.h<80 || r.x<350) continue;   // 좌측/메뉴/작은 것 제외
    out.blocks.push({ t: el.tagName.toLowerCase(), ...r, src });
  }
  out.blocks.sort((a,b)=>a.y-b.y);
  // 우측 텍스트 블록 (Tools, 캡션 등: x>=350)
  out.rtext = [];
  for (const el of document.querySelectorAll('h2,h3,h4,p,span')) {
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (!txt || txt.length>200) continue; const r = abs(el);
    if (r.x<350 || r.w<20 || r.y<300 || r.y>out.docH-1500) continue;
    out.rtext.push({ y:r.y, x:r.x, w:r.w, txt, fs:getComputedStyle(el).fontSize });
  }
  out.rtext.sort((a,b)=>a.y-b.y);
  // see-more 텍스트(제목들)
  out.smText = [];
  for (const el of document.querySelectorAll('h2,h3,span,a')) {
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (!txt) continue; const r = abs(el); if (r.y < out.docH-1600) continue;
    if (/see more/i.test(txt) || r.h>25) out.smText.push({ y:r.y, x:r.x, txt: txt.slice(0,50), fs:getComputedStyle(el).fontSize });
  }
  return out;
});
writeFileSync(join(ROOT,'tools',`stddata-${slug}.json`), JSON.stringify(data, null, 2));
console.log(`${slug} docH=${data.docH}`);
console.log('META:', data.meta.title, '| lines:', data.meta.lines.map(l=>`[${l.y} ${l.fs} ${l.txt.slice(0,30)}]`).join(' '));
console.log('\nBLOCKS:');
let prev=null;
for (const bl of data.blocks) { console.log(`  y=${bl.y} x=${bl.x} ${bl.w}x${bl.h} [${bl.t}] gap${prev?bl.y-prev:'-'}  ${bl.src.slice(0,70)}`); prev=bl.y+bl.h; }
console.log('\nRIGHT TEXT:'); for (const t of data.rtext) console.log(`  y=${t.y} x=${t.x} w=${t.w} ${t.fs} "${t.txt.slice(0,60)}"`);
console.log('\nSEE-MORE:', JSON.stringify(data.seemore));
console.log('SM TEXT:', data.smText.map(t=>`[${t.y} ${t.txt}]`).join(' '));
await b.close();
