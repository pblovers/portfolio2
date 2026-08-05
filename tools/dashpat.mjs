/**
 * divider(점선)의 점/간격 패턴을 픽셀에서 읽는다.
 *   node dashpat.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80));
    }
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^FEATURED WORK 02$/i.test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'start' });
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
  await p.waitForTimeout(600);
  const png = PNG.sync.read(await p.screenshot());

  // 글자가 없는 구간(x 520..980)만 본다. 점선은 저대비라 임계값을 낮춘다.
  const X0 = 520, X1 = 980;
  console.log(`\n=== ${tag} @ ${W}x${H} ===`);
  for (let y = Number(process.argv[4] || 175); y <= Number(process.argv[5] || 205); y++) {
    const sheet = png.data[(png.width * y + X0) << 2];
    let on = 0;
    for (let x = X0; x < X1; x++) if (Math.abs(png.data[(png.width * y + x) << 2] - sheet) > 3) on++;
    if (on < 20) continue;
    const vals = [];
    for (let x = X0; x < X0 + 24; x++) vals.push(png.data[(png.width * y + x) << 2]);
    console.log(`  y=${y} (칠해진 ${on}/${X1 - X0})  시트=${sheet}  화소값: ${vals.join(' ')}`);
  }
  await ctx.close();
}
await browser.close();
