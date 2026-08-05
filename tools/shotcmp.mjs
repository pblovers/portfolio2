import { chromium } from 'playwright';
import { mine } from './root.mjs';
const W = Number(process.argv[2] || 390);
const H = Number(process.argv[3] || 844);
const browser = await chromium.launch();
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 90));
    }
    const t = [...document.querySelectorAll('*')].find(e => e.children.length===0 && /^FEATURED WORK 02$/i.test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'start' });
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
  });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `./diff/shot-${tag}-${W}.png` });
  await ctx.close();
}
await browser.close();
