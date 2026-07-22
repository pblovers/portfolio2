/**
 * 원본과 구현을 같은 뷰포트로 캡처해 픽셀 단위로 비교
 *   node pixdiff.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 995);
const H = Number(process.argv[3] || 1005);
mkdirSync('./diff', { recursive: true });

const browser = await chromium.launch();
const shots = {};
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/works'], ['mine', mine('works.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  // 애니메이션 정지 + appear 강제
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForTimeout(500);
  const file = `./diff/${tag}-${W}.png`;
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
    const dr = Math.abs(a.data[ia] - b.data[ib]);
    const dg = Math.abs(a.data[ia + 1] - b.data[ib + 1]);
    const db = Math.abs(a.data[ia + 2] - b.data[ib + 2]);
    const d = Math.max(dr, dg, db);
    if (d > TOL) {
      diffCount++; rowDiff[y]++; colDiff[x]++;
      out.data[io] = 255; out.data[io + 1] = 0; out.data[io + 2] = 0; out.data[io + 3] = 255;
    } else {
      const g = Math.round((a.data[ia] * 0.3 + a.data[ia + 1] * 0.6 + a.data[ia + 2] * 0.1) * 0.35 + 160);
      out.data[io] = g; out.data[io + 1] = g; out.data[io + 2] = g; out.data[io + 3] = 255;
    }
  }
}
writeFileSync(`./diff/diff-${W}.png`, PNG.sync.write(out));

const pct = (diffCount / (w * h) * 100).toFixed(2);
console.log(`뷰포트 ${W}x${H}  비교영역 ${w}x${h}`);
console.log(`다른 픽셀 ${diffCount} / ${w * h}  (${pct}%)   허용오차 ${TOL}`);

// 차이가 몰린 구간 보고
const bands = [];
let start = -1;
for (let y = 0; y < h; y++) {
  const on = rowDiff[y] > w * 0.01;
  if (on && start < 0) start = y;
  if (!on && start >= 0) { bands.push([start, y - 1, Math.max(...rowDiff.slice(start, y))]); start = -1; }
}
if (start >= 0) bands.push([start, h - 1, Math.max(...rowDiff.slice(start))]);
console.log('\n세로 위치별 차이 구간 (행의 1% 이상):');
if (!bands.length) console.log('   없음');
bands.slice(0, 14).forEach(([s, e, m]) => console.log(`   y ${String(s).padStart(4)} ~ ${String(e).padStart(4)}   최대 ${m}px/행`));

const cb = [];
start = -1;
for (let x = 0; x < w; x++) {
  const on = colDiff[x] > h * 0.01;
  if (on && start < 0) start = x;
  if (!on && start >= 0) { cb.push([start, x - 1]); start = -1; }
}
if (start >= 0) cb.push([start, w - 1]);
console.log('\n가로 위치별 차이 구간 (열의 1% 이상):');
if (!cb.length) console.log('   없음');
cb.slice(0, 14).forEach(([s, e]) => console.log(`   x ${String(s).padStart(4)} ~ ${String(e).padStart(4)}`));
console.log(`\ndiff 이미지: ./diff/diff-${W}.png (빨강 = 다른 픽셀)`);
