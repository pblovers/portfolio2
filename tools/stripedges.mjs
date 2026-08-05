/**
 * 상단 스트립(work-tab / see-all)의 색 경계를 픽셀 스캔으로 찾는다.
 *   node stripedges.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

function edgesAtRow(png, y) {
  const w = png.width;
  const edges = [];
  let prev = null;
  for (let x = 0; x < w; x++) {
    const i = (w * y + x) << 2;
    const c = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if (prev && (Math.abs(c[0] - prev[0]) + Math.abs(c[1] - prev[1]) + Math.abs(c[2] - prev[2]) > 30)) {
      edges.push(x);
    }
    prev = c;
  }
  return edges;
}

const { PNG } = await import('pngjs');
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
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^FEATURED WORK 02$/i.test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'center' });
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
  await p.waitForTimeout(500);
  // align FEATURED WORK 01 text to a known screen y so strip rows compare
  await p.evaluate(async () => {
    const find = () => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^FEATURED WORK 01$/i.test(e.textContent.trim()));
    let t = find();
    for (let i = 0; i < 12 && t; i++) {
      const cur = t.getBoundingClientRect().top;
      const delta = cur - 76;
      if (Math.abs(delta) < 0.6) break;
      window.scrollTo({ top: scrollY + delta, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 60));
      t = find();
    }
  });
  await p.waitForTimeout(300);
  const buf = await p.screenshot();
  const png = PNG.sync.read(buf);
  console.log(`\n=== ${tag} @ ${W}x${H} ===`);
  for (const y of [76, 130, 228]) {
    console.log(`y=${y}: edges = ${edgesAtRow(png, y).join(', ')}`);
  }
  await ctx.close();
}
await browser.close();
