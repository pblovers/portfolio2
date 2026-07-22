/**
 * 원본 푸터 워드마크의 조상 체인 + 푸터 루트 크기를 뜬다.
 *   node fchain.mjs [width] [height]
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2500);

const out = await p.evaluate(() => {
  const leaf = (pred) => [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && pred((e.textContent || '').trim()));
  const wm = leaf(t => t.startsWith('WILDYRIFTIANWORKS'));
  const rows = [];
  let el = wm, i = 0;
  while (el && i < 12) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    rows.push({
      i, tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 30),
      rect: [+r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)],
      pos: cs.position, transform: cs.transform, origin: cs.transformOrigin,
      fs: cs.fontSize, lh: cs.lineHeight, zoom: cs.zoom,
      inset: `${cs.top}/${cs.right}/${cs.bottom}/${cs.left}`,
      minH: cs.minHeight, h: cs.height, overflow: cs.overflow,
      display: cs.display,
    });
    el = el.parentElement; i++;
  }
  return { rows, docH: document.documentElement.scrollHeight, vh: innerHeight };
});

console.log('vh', out.vh, 'docH', out.docH);
for (const r of out.rows) console.log(JSON.stringify(r));
await browser.close();
