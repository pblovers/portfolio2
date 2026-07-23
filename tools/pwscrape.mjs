// photoworks 상세 원본 스크래퍼 — 메타 + 갤러리 이미지 + see-more
// 사용: node pwscrape.mjs <slug> [<slug> ...]
import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';

const slugs = process.argv.slice(2);
if (!slugs.length) { console.error('need slug(s)'); process.exit(1); }

const DATA_PATH = join(ROOT, 'tools', 'pwdata.json');
const b = await chromium.launch();
// 기존 데이터에 **병합**한다 (덮어쓰기하면 다른 slug 데이터가 사라진다).
const results = existsSync(DATA_PATH) ? JSON.parse(readFileSync(DATA_PATH, 'utf8')) : {};
for (const slug of slugs) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  try {
    await p.goto(`https://www.wildyriftian.com/works/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(4200);
    // lazy 이미지 로드: 촘촘히 끝까지 스크롤 + 바닥에서 대기
    await p.evaluate(async () => {
      for (let y=0;y<document.documentElement.scrollHeight;y+=300){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,110));}
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(r=>setTimeout(r,1500));
      window.scrollTo(0,0);
    });
    // 모든 framerusercontent 이미지가 로드될 때까지 폴링(최대 ~10s)
    await p.evaluate(async () => {
      const loaded = () => [...document.querySelectorAll('img')]
        .filter(i => /framerusercontent/.test(i.currentSrc||i.src))
        .every(i => i.complete && i.naturalWidth > 0);
      for (let t=0; t<100 && !loaded(); t++) await new Promise(r=>setTimeout(r,100));
    });
    await p.waitForTimeout(500);
    await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
    await p.waitForTimeout(300);

    const data = await p.evaluate(() => {
      const out = { title: null, year: null, model: null, desc: null, gallery: [], seemore: null, docH: document.documentElement.scrollHeight };
      // 제목 = h1
      const h1 = document.querySelector('h1');
      if (h1) out.title = h1.textContent.trim();
      // 텍스트 스캔: 연도(4자리), MODEL, 설명(가장 긴 문단)
      const texts = [];
      for (const el of document.querySelectorAll('p, span, div')) {
        const t = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
        if (t) texts.push({ t, y: Math.round(el.getBoundingClientRect().y + scrollY) });
      }
      for (const {t} of texts) {
        if (!out.year && /^(19|20)\d\d$/.test(t)) out.year = t;
        if (!out.model && /^model\s*:/i.test(t)) out.model = t.replace(/^model\s*:\s*/i,'').trim();
      }
      // 설명 = 상단 500px 내 가장 긴 문단
      const top = texts.filter(o=>o.y<600 && o.t.length>40).sort((a,b)=>b.t.length-a.t.length);
      if (top[0]) out.desc = top[0].t;

      // 갤러리 이미지: framerusercontent, 메타 아래(y>250), w>150 h>100,
      // 단 see-more 프리뷰(./slug 앵커 안)는 제외.
      // 원본 masonry 는 열을 **저자가 수동 배치**한다(단일 알고리즘으로 재현 불가:
      // speed-limit 은 round-robin, harder-than-steel 은 shortest-first 처럼 보임).
      // → 데스크톱(1440) 3열에서 각 이미지의 **실제 열 인덱스**를 그대로 캡처한다.
      // DOM 순서 = 행 인터리브(col0[0],col1[0],col2[0],col0[1],...)로 저장하고 col 도 함께 담는다.
      const gimgs = [...document.querySelectorAll('img')].filter(i => {
        const a = i.closest('a');
        if (a && /^\.\/[a-z0-9-]+$/.test(a.getAttribute('href')||'')) return false; // see-more 프리뷰
        const r = i.getBoundingClientRect();
        return /framerusercontent/.test(i.currentSrc||i.src) && r.width>150 && r.height>100 && (r.y+scrollY)>250;
      }).map(i => { const r = i.getBoundingClientRect(); return { src: i.currentSrc || i.src, y: Math.round(r.y+scrollY), x: Math.round(r.x) }; });
      // x 클러스터링으로 열 구분(간격 100px 초과 = 새 열)
      const xs = [...new Set(gimgs.map(o => o.x))].sort((a,b)=>a-b);
      const colX = []; for (const x of xs) { if (!colX.length || x - colX[colX.length-1] > 100) colX.push(x); }
      const colOf = (x) => { let best=0; for (let c=1;c<colX.length;c++) if (Math.abs(x-colX[c])<Math.abs(x-colX[best])) best=c; return best; };
      const cols = colX.map(()=>[]);
      for (const o of gimgs) cols[colOf(o.x)].push(o);
      cols.forEach(c => c.sort((a,b)=>a.y-b.y));
      const maxRows = Math.max(...cols.map(c=>c.length));
      const order = [];
      for (let r=0;r<maxRows;r++) for (let c=0;c<cols.length;c++) if (cols[c][r]) order.push({ src: cols[c][r].src, col: c });
      out.gallery = order;
      out.ncol = cols.length;

      // see-more: ./slug 앵커들을 x(왼→오)순으로. 왼쪽=다음작, 오른쪽=이전작.
      const sm = [];
      for (const a of document.querySelectorAll('a')) {
        const m = (a.getAttribute('href')||'').match(/^\.\/([a-z0-9-]+)$/);
        if (m && a.querySelector('img')) {
          const r = a.getBoundingClientRect();
          sm.push({ slug: m[1], x: Math.round(r.x) });
        }
      }
      sm.sort((a,b)=> a.x-b.x);
      out.seemore = sm.map(o => o.slug);
      return out;
    });
    results[slug] = data;
    console.log(`\n== ${slug} ==`);
    console.log(`  title: ${data.title}  year: ${data.year}  model: ${data.model}`);
    console.log(`  desc: ${(data.desc||'').slice(0,80)}...`);
    console.log(`  gallery: ${data.gallery.length} imgs`);
    console.log(`  seemore -> [${(data.seemore||[]).join(', ')}]`);
  } catch (e) {
    console.error(`  FAILED ${slug}: ${e.message}`);
    results[slug] = { error: e.message };
  }
  await ctx.close();
}
writeFileSync(DATA_PATH, JSON.stringify(results, null, 2));
console.log('\nwrote tools/pwdata.json');
await b.close();
