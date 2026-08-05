/**
 * work-tab / work-seeall / work-meta / work-chips 좌표 비교 (원본은 텍스트로 탐색)
 *   node worktabdiff.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();

async function measureOrig(p) {
  return p.evaluate(() => {
    const leaf = (re) => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent.trim()));
    const rectOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; };
    // tab backgrounds: climb from text node to the ancestor whose own width stops changing much (the tab block itself)
    const hasBg = (el) => {
      const c = getComputedStyle(el).backgroundColor;
      return c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent';
    };
    const tabBlock = (textEl) => {
      let el = textEl;
      // walk up until we find an element with its own background color (the tab chip), capped at height 60
      for (let i = 0; i < 10 && el.parentElement; i++) {
        const parent = el.parentElement;
        const r = parent.getBoundingClientRect();
        if (r.height > 60 || r.width > 500) break;
        el = parent;
        if (hasBg(el)) break;
      }
      return el;
    };
    const t1 = leaf(/^FEATURED WORK 01$/i);
    const t2 = leaf(/^FEATURED WORK 02$/i);
    const t3 = leaf(/^FEATURED WORK 03$/i);
    const seeall = leaf(/^SEE ALL WORKS/i);
    const yearMeta = leaf(/^2026$/);
    const chips = leaf(/GRAPHIC/i);
    const imgs = [...document.querySelectorAll('img')].map(img => ({ src: img.currentSrc.split('/').pop(), ...rectOf(img) })).filter(r => r.w > 50 && r.y > -50 && r.y < window.innerHeight);
    return {
      tab1: rectOf(t1 && tabBlock(t1)),
      tab2: rectOf(t2 && tabBlock(t2)),
      tab3: rectOf(t3 && tabBlock(t3)),
      seeall: rectOf(seeall && seeall.closest('a')),
      metaText: rectOf(yearMeta && yearMeta.parentElement),
      chips: rectOf(chips && chips.parentElement),
      imgs,
    };
  });
}

async function measureMine(p) {
  return p.evaluate(() => {
    const rectOf = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; };
    return {
      tab1: rectOf('.work-1 .work-tab'),
      tab2: rectOf('.work-2 .work-tab'),
      tab3: rectOf('.work-3 .work-tab'),
      seeall: rectOf('.work-seeall'),
      metaText: rectOf('.work-2 .work-meta'),
      chips: rectOf('.work-2 .work-chips'),
      imgs: [...document.querySelectorAll('.work-2 img, .work-2 .wm-main')].map(img => { const r = img.getBoundingClientRect(); return { src: (img.getAttribute('src')||'').split('/').pop(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; }),
    };
  });
}

for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 90));
    }
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^FEATURED WORK 02$/i.test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'center' });
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
  });
  await p.waitForTimeout(500);
  const data = tag === 'orig' ? await measureOrig(p) : await measureMine(p);
  console.log(`\n=== ${tag} @ ${W}x${H} ===`);
  console.log(JSON.stringify(data, null, 1));
  await ctx.close();
}
await browser.close();
