/**
 * 같은 좌표를 호버한 뒤 전체 화면을 대조한다 (폴더 호버처럼 화면 전체가
 * 반응하는 인터랙션용).
 *   node hovfull.mjs <index|works|motion> <x> <y> [width] [height] [wait]
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const PAGES = {
  index: ['https://www.wildyriftian.com/', 'index.html'],
  works: ['https://www.wildyriftian.com/works', 'works.html'],
  motion: ['https://www.wildyriftian.com/works-motion', 'works-motion.html'],
};
const key = process.argv[2] || 'works';
const X = Number(process.argv[3]);
const Y = Number(process.argv[4]);
const W = Number(process.argv[5] || 1440);
const H = Number(process.argv[6] || 900);
const WAIT = Number(process.argv[7] || 1200);
const [origUrl, mineFile] = PAGES[key];
mkdirSync('./diff', { recursive: true });

const browser = await chromium.launch();
const shots = {};
for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
    if (document.getAnimations) document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
  });
  await p.mouse.move(X, Y);
  await p.waitForTimeout(WAIT);
  const file = `./diff/hf-${key}-${X}x${Y}-${tag}.png`;
  await p.screenshot({ path: file });
  shots[tag] = file;
  await ctx.close();
}
await browser.close();

const a = PNG.sync.read(readFileSync(shots.orig));
const b = PNG.sync.read(readFileSync(shots.mine));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
const out = new PNG({ width: w, height: h });
let diff = 0;
const rowDiff = new Array(h).fill(0);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2, io = (w * y + x) << 2;
  const d = Math.max(Math.abs(a.data[ia] - b.data[ib]), Math.abs(a.data[ia + 1] - b.data[ib + 1]),
                     Math.abs(a.data[ia + 2] - b.data[ib + 2]));
  if (d > 12) { diff++; rowDiff[y]++; out.data[io] = 255; out.data[io + 3] = 255; }
  else {
    const g = Math.round((a.data[ia] * 0.3 + a.data[ia + 1] * 0.6 + a.data[ia + 2] * 0.1) * 0.35 + 160);
    out.data[io] = out.data[io + 1] = out.data[io + 2] = g; out.data[io + 3] = 255;
  }
}
writeFileSync(`./diff/hf-${key}-${X}x${Y}-diff.png`, PNG.sync.write(out));
console.log(`${key} (${X},${Y}) 호버  다른 픽셀 ${diff} / ${w * h} (${(diff / (w * h) * 100).toFixed(2)}%)`);
const bands = [];
let s = -1;
for (let y = 0; y < h; y++) {
  const on = rowDiff[y] > w * 0.01;
  if (on && s < 0) s = y;
  if (!on && s >= 0) { bands.push([s, y - 1, Math.max(...rowDiff.slice(s, y))]); s = -1; }
}
if (s >= 0) bands.push([s, h - 1, Math.max(...rowDiff.slice(s))]);
bands.slice(0, 10).forEach(([a1, b1, m]) => console.log(`   y ${String(a1).padStart(4)} ~ ${String(b1).padStart(4)}  최대 ${m}px/행`));
