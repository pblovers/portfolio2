import { chromium } from 'playwright';
const browser = await chromium.launch();

async function check(url, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1000);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => {
    const footer = document.getElementById('footer');
    const fr = footer.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      maxScroll: document.body.scrollHeight - innerHeight,
      footerBottom: Math.round(fr.bottom),
      viewportHeight: innerHeight,
      gapBelowFooter: Math.round(innerHeight - fr.bottom),
    };
  });
  await ctx.close();
  return info;
}

for (const [w,h] of [[1024,900],[1280,900],[1440,900],[1728,1000],[1920,1080]]) {
  const r = await check('http://127.0.0.1:5500/index.html', w, h);
  console.log(`w=${w} h=${h}:`, JSON.stringify(r));
}
await browser.close();
