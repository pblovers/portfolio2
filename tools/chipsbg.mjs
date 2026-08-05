/**
 * works 전 구간을 훑으며, 같은 y 에서 (왼쪽 시트색 ≠ 메타칼럼색) 인 행을 chips 밴드로 보고
 * (시트색 → 밴드색) 쌍을 모은다. 카드 3개를 스크롤 위치 조준 없이 모두 잡는다.
 *   node chipsbg.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const modeRow = (png, x0, x1, y) => {
  const counts = new Map();
  for (let x = x0; x < x1; x++) {
    if (x < 0 || x >= png.width || y < 0 || y >= png.height) continue;
    const i = (png.width * y + x) << 2;
    const k = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const t = [...counts].sort((a, b) => b[1] - a[1])[0];
  return t ? { c: t[0], n: t[1] } : null;
};
const hex = (s) => s ? '#' + s.split(',').map(n => (+n).toString(16).padStart(2, '0')).join('') : 'n/a';

const browser = await chromium.launch();
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  console.log(`\n=== ${tag} @ ${W}x${H} ===`);
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
  });

  const total = await p.evaluate(() => document.body.scrollHeight);
  const pairs = new Map();
  const mx0 = Math.round(W * 0.75) + 10, mx1 = W - 40;
  for (let sy = 0; sy < total; sy += 100) {
    await p.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), sy);
    await p.waitForTimeout(60);
    const png = PNG.sync.read(await p.screenshot());
    for (let y = 120; y < 420; y++) {
      const sheet = modeRow(png, 40, 300, y);
      const meta = modeRow(png, mx0, mx1, y);
      if (!sheet || !meta) continue;
      if (sheet.c === meta.c) continue;
      if (meta.n < (mx1 - mx0) * 0.45) continue;         // 텍스트가 아니라 넓은 단색 밴드만
      const k = `${hex(sheet.c)} → ${hex(meta.c)}`;
      pairs.set(k, (pairs.get(k) || 0) + 1);
    }
  }
  [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => console.log(`  ${k}   (${n}행)`));
  await ctx.close();
}
await browser.close();
