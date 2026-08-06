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

const pairs = [
  ['https://www.wildyriftian.com/works', 'http://127.0.0.1:5500/works/works.html'],
  ['https://www.wildyriftian.com/work/overbloom', 'http://127.0.0.1:5500/project/project-aquaplanet.html'],
];
for (const [o, l] of pairs) {
  const oh = await measure(o).catch(e => 'ERR:'+e.message.slice(0,80));
  const lh = await measure(l).catch(e => 'ERR:'+e.message.slice(0,80));
  console.log(o, '->', oh, '|', l, '->', lh);
}
await browser.close();
