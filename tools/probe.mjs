import { chromium } from 'playwright';
import { mine } from './root.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(mine('index.html'), { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
console.log(await p.evaluate(() => {
  const d = document.querySelector('.work-2 .work-divider');
  const cs = getComputedStyle(d);
  const r = d.getBoundingClientRect();
  return JSON.stringify({
    rectTop: r.top, height: r.height,
    bg: cs.backgroundImage, border: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
    ink: getComputedStyle(document.documentElement).getPropertyValue('--ink'),
    opacity: cs.opacity, filter: cs.filter,
    parentFilter: getComputedStyle(d.parentElement).filter,
  }, null, 1);
}));
await b.close();
