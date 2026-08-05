/**
 * 폴더탭 스트립을 행 단위로 스캔해 계단(대각선)과 SEE ALL 바 경계를 뽑는다.
 *   node tabslope.mjs <width> <height>
 * FEATURED WORK 03 글자를 y=120 에 맞춰 두 사이트를 같은 상태로 정렬한다.
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
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
    const find = () => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^FEATURED WORK 03$/i.test(e.textContent.trim()));
    let t = find();
    if (t) t.scrollIntoView({ block: 'start' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 16; i++) {
      t = find(); if (!t) break;
      const d = t.getBoundingClientRect().top - 120;
      if (Math.abs(d) < 0.6) break;
      window.scrollBy({ top: d, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 60));
    }
  });
  await p.waitForTimeout(600);
  const png = PNG.sync.read(await p.screenshot());
  const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
  const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  const isDark = (x, y) => { const [r, g, b] = at(x, y); return r < 80 && g < 80 && b < 80; };
  const isYellow = (x, y) => { const [r, g, b] = at(x, y); return r > 200 && g > 170 && b < 130; };
  console.log(`\n=== ${tag} @ ${W}x${H} ===`);
  console.log('   y   탭02노랑 오른끝 | 검은바 왼끝');
  for (let y = 106; y <= 158; y++) {
    let yr = -1;
    for (let x = Math.round(W * 0.6); x >= 0; x--) if (isYellow(x, y)) { yr = x; break; }
    let dl = -1;
    for (let x = Math.round(W * 0.6); x < W; x++) if (isDark(x, y)) { dl = x; break; }
    console.log(`  ${String(y).padStart(3)}   ${String(yr).padStart(5)}          ${String(dl).padStart(5)}`);
  }
  await ctx.close();
}
await browser.close();
