/**
 * works-motion 원본 vs 구현 픽셀 대조
 *   node mdiff.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const SLUG = process.argv[2] || 'works-branding';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
mkdirSync('./diff', { recursive: true });

const browser = await chromium.launch();
const shots = {};
for (const [tag, url] of [
  ['orig', `https://www.wildyriftian.com/${SLUG}`],
  ['mine', mine(`${SLUG}.html`)],
]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    // 영상은 첫 프레임으로 고정해야 대조가 가능하다
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForTimeout(600);
  const file = `./diff/c-${SLUG}-${tag}-${W}.png`;
  await p.screenshot({ path: file });
  shots[tag] = file;
  await ctx.close();
}
await browser.close();

const a = PNG.sync.read(readFileSync(shots.orig));
const b = PNG.sync.read(readFileSync(shots.mine));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
const out = new PNG({ width: w, height: h });

let diffCount = 0;
const rowDiff = new Array(h).fill(0);
const colDiff = new Array(w).fill(0);
const TOL = 12;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2, io = (w * y + x) << 2;
    const d = Math.max(
      Math.abs(a.data[ia] - b.data[ib]),
      Math.abs(a.data[ia + 1] - b.data[ib + 1]),
      Math.abs(a.data[ia + 2] - b.data[ib + 2]),
    );
    if (d > TOL) {
      diffCount++; rowDiff[y]++; colDiff[x]++;
      out.data[io] = 255; out.data[io + 1] = 0; out.data[io + 2] = 0; out.data[io + 3] = 255;
    } else {
      const g = Math.round((a.data[ia] * 0.3 + a.data[ia + 1] * 0.6 + a.data[ia + 2] * 0.1) * 0.35 + 160);
      out.data[io] = g; out.data[io + 1] = g; out.data[io + 2] = g; out.data[io + 3] = 255;
    }
  }
}
writeFileSync(`./diff/c-diff-${W}.png`, PNG.sync.write(out));

const pct = (diffCount / (w * h) * 100).toFixed(2);
console.log(`뷰포트 ${W}x${H}  비교영역 ${w}x${h}`);
console.log(`다른 픽셀 ${diffCount} / ${w * h}  (${pct}%)   허용오차 ${TOL}`);

const bands = [];
let start = -1;
for (let y = 0; y < h; y++) {
  const on = rowDiff[y] > w * 0.01;
  if (on && start < 0) start = y;
  if (!on && start >= 0) { bands.push([start, y - 1, Math.max(...rowDiff.slice(start, y))]); start = -1; }
}
if (start >= 0) bands.push([start, h - 1, Math.max(...rowDiff.slice(start))]);
console.log('\n세로 차이 구간 (행의 1% 이상):');
if (!bands.length) console.log('   없음');
bands.slice(0, 16).forEach(([s, e, m]) => console.log(`   y ${String(s).padStart(4)} ~ ${String(e).padStart(4)}   최대 ${m}px/행`));

const cb = [];
start = -1;
for (let x = 0; x < w; x++) {
  const on = colDiff[x] > h * 0.01;
  if (on && start < 0) start = x;
  if (!on && start >= 0) { cb.push([start, x - 1]); start = -1; }
}
if (start >= 0) cb.push([start, w - 1]);
console.log('\n가로 차이 구간 (열의 1% 이상):');
if (!cb.length) console.log('   없음');
cb.slice(0, 16).forEach(([s, e]) => console.log(`   x ${String(s).padStart(4)} ~ ${String(e).padStart(4)}`));
console.log(`\ndiff 이미지: ./diff/c-diff-${W}.png (빨강 = 다른 픽셀)`);
