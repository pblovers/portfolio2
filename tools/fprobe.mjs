/**
 * 원본 푸터 실측 — 워드마크 폰트/변형, 하단 크레딧 행 배치.
 *   node fprobe.mjs [width] [height]
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(900);

const out = await p.evaluate(() => {
  const leaf = (pred) => [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && pred((e.textContent || '').trim()));
  const D = (el, label) => {
    if (!el) return { label, missing: true };
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      label,
      rect: [+r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)],
      font: cs.fontFamily.split(',')[0], size: cs.fontSize, lh: cs.lineHeight,
      weight: cs.fontWeight, color: cs.color, transform: cs.transform,
      letterSpacing: cs.letterSpacing,
      parentTransform: el.parentElement ? getComputedStyle(el.parentElement).transform : null,
      gpTransform: el.parentElement?.parentElement
        ? getComputedStyle(el.parentElement.parentElement).transform : null,
      parentRect: el.parentElement
        ? [...['x', 'y', 'width', 'height'].map(k => +el.parentElement.getBoundingClientRect()[k].toFixed(2))]
        : null,
    };
  };

  return [
    D(leaf(t => t.startsWith('WILDYRIFTIANWORKS')), 'wordmark'),
    D(leaf(t => t.startsWith('© 2025')), 'copyright'),
    D(leaf(t => t === 'SURD.STUDIO' || /SURD/.test(t)), 'credit'),
    D(leaf(t => t === 'EMAIL'), 'email'),
    D(leaf(t => t === 'RESUME'), 'resume'),
    D(leaf(t => t === 'Motion Design'), 'service1'),
  ];
});

for (const o of out) console.log(JSON.stringify(o));
await browser.close();
