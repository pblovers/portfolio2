/**
 * 3개 페이지 원본의 푸터 워드마크 크기 + 섹션 스크롤 거동 실측
 *   node wmcheck.mjs
 */
import { chromium } from 'playwright';

const pages = [
  ['index', 'https://www.wildyriftian.com/'],
  ['works', 'https://www.wildyriftian.com/works'],
  ['motion', 'https://www.wildyriftian.com/works-motion'],
];
const widths = [1920, 1440, 1280, 810, 768, 430, 375];

const browser = await chromium.launch();

console.log('=== 원본 푸터 워드마크 font-size (px) ===\n');
console.log('page      width   fontSize    lineHeight    폭      divisor(=(vw-2*margin)/fs)');
for (const [name, url] of pages) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await p.waitForTimeout(2000);
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1200);
      const r = await p.evaluate(() => {
        const el = [...document.querySelectorAll('*')]
          .find(e => e.children.length === 0 && (e.innerText || '').trim().startsWith('WILDYRIFTIANWORKS'));
        if (!el) return null;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          fs: parseFloat(cs.fontSize), lh: cs.lineHeight,
          w: Math.round(rect.width * 100) / 100, x: Math.round(rect.x * 100) / 100,
          vw: innerWidth,
        };
      });
      if (r) {
        const margin = r.x;
        const div = ((r.vw - margin * 2) / r.fs).toFixed(3);
        console.log(`${name.padEnd(9)} ${String(w).padStart(5)}   ${String(r.fs).padStart(9)}  ${r.lh.padStart(11)}  ${String(r.w).padStart(8)}   ${div}  (margin ${margin})`);
      } else {
        console.log(`${name.padEnd(9)} ${String(w).padStart(5)}   —`);
      }
    } catch (e) {
      console.log(`${name.padEnd(9)} ${String(w).padStart(5)}   ERR ${e.message.slice(0, 40)}`);
    }
    await ctx.close();
  }
  console.log('');
}

// works-motion 섹션 스크롤 거동 — instant 스크롤 + 충분한 대기
console.log('\n=== works-motion 스크롤 거동 (1440x900) ===\n');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  console.log('scrollY  seeAllVY  titleVY  tabVY   wordmarkVY  emailVY   비고');
  for (const sy of [0, 100, 200, 300, 400, 500, 600, 700, 757, 760]) {
    await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), sy);
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const leaf = (pred) => [...document.querySelectorAll('p,span,div,a,h1')]
        .find(e => e.children.length === 0 && pred((e.innerText || '').trim()));
      const g = (el) => el ? Math.round(el.getBoundingClientRect().y * 10) / 10 : null;
      const whiteTab = [...document.querySelectorAll('div,span')]
        .map(d => ({ d, r: d.getBoundingClientRect(), cs: getComputedStyle(d) }))
        .filter(o => o.cs.backgroundColor === 'rgb(245, 245, 245)' && o.r.width > 200 && o.r.width < 400 && o.r.height > 20)[0];
      return {
        sy: Math.round(scrollY),
        seeAll: g(leaf(t => t === 'SEE ALL WORKS')),
        title: g(leaf(t => t === 'motion')),
        tab: whiteTab ? Math.round(whiteTab.r.y * 10) / 10 : null,
        wordmark: g(leaf(t => t.startsWith('WILDYRIFTIANWORKS'))),
        email: g(leaf(t => t === 'EMAIL')),
      };
    });
    console.log(
      String(r.sy).padStart(6),
      String(r.seeAll).padStart(9),
      String(r.title).padStart(8),
      String(r.tab).padStart(7),
      String(r.wordmark).padStart(11),
      String(r.email).padStart(8),
    );
  }
  await ctx.close();
}
await browser.close();
