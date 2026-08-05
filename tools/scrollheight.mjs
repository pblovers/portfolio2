import { chromium } from 'playwright';
const browser = await chromium.launch();

async function measure(url) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1000);
  const h = await p.evaluate(() => document.body.scrollHeight);
  await ctx.close();
  return h;
}
console.log('orig:', await measure('https://www.wildyriftian.com/'));
console.log('local:', await measure('http://127.0.0.1:5500/index.html'));
await browser.close();
