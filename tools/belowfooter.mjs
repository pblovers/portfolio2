import { chromium } from 'playwright';
const browser = await chromium.launch();

async function check(url) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    // sample color at a point well below the visible footer content, near viewport bottom
    const el = document.elementFromPoint(500, 850);
    const cs = el ? getComputedStyle(el) : null;
    // walk up to find first non-transparent bg
    let cur = el, bg = null, owner = null;
    while (cur) {
      const c = getComputedStyle(cur).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)') { bg = c; owner = cur.tagName + '.' + cur.className; break; }
      cur = cur.parentElement;
    }
    return { elAtPoint: el ? el.tagName + '.' + el.className : null, effectiveBg: bg, owner };
  });
  await ctx.close();
  return info;
}
console.log('orig:', JSON.stringify(await check('https://www.wildyriftian.com/')));
console.log('local:', JSON.stringify(await check('http://127.0.0.1:5500/index.html')));
await browser.close();
