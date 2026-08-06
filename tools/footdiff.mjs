/**
 * 스크롤 끝(푸터가 보이는 상태)에서 원본 vs 구현 픽셀 대조.
 * pixdiff/idxdiff/mdiff 는 스크롤 0 만 찍어 푸터를 한 번도 비교하지 않는다
 * (HANDOFF 8절 교훈 3 — 워드마크 버그가 그래서 오래 안 잡혔다).
 *   node footdiff.mjs <index|works|motion> [width] [height]
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const PAGES = {
  index: ['https://www.wildyriftian.com/', 'index.html'],
  works: ['https://www.wildyriftian.com/works', 'works/works.html'],
  motion: ['https://www.wildyriftian.com/works-motion', 'works/works-uiux.html'],
};

const key = process.argv[2] || 'motion';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
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
    // 원본 키체인은 Framer Motion(JS)이 흔든다 — CSS animation:none 으로는 안 멈춘다.
    // Web Animations API 를 0초에 고정해야 양쪽이 같은 프레임이 된다.
    if (document.getAnimations) {
      document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
    }
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
  // 원본은 lenis 스무스 스크롤이라 한 번에 안 간다 — 여러 번 밀어붙인다
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(350);
  }
  await p.waitForTimeout(900);
  const y = await p.evaluate(() => Math.round(window.scrollY));
  const file = `./diff/f-${key}-${tag}-${W}.png`;
  await p.screenshot({ path: file });
  shots[tag] = file;
  console.log(`${tag} scrollY=${y}`);
  await ctx.close();
}
await browser.close();

const a = PNG.sync.read(readFileSync(shots.orig));
const b = PNG.sync.read(readFileSync(shots.mine));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
const out = new PNG({ width: w, height: h });
let diff = 0;
const rowDiff = new Array(h).fill(0);
const TOL = 12;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2, io = (w * y + x) << 2;
    const d = Math.max(Math.abs(a.data[ia] - b.data[ib]),
                       Math.abs(a.data[ia + 1] - b.data[ib + 1]),
                       Math.abs(a.data[ia + 2] - b.data[ib + 2]));
    if (d > TOL) {
      diff++; rowDiff[y]++;
      out.data[io] = 255; out.data[io + 1] = 0; out.data[io + 2] = 0; out.data[io + 3] = 255;
    } else {
      const g = Math.round((a.data[ia] * 0.3 + a.data[ia + 1] * 0.6 + a.data[ia + 2] * 0.1) * 0.35 + 160);
      out.data[io] = g; out.data[io + 1] = g; out.data[io + 2] = g; out.data[io + 3] = 255;
    }
  }
}
writeFileSync(`./diff/f-${key}-diff-${W}.png`, PNG.sync.write(out));
console.log(`${key} ${W}x${H}  다른 픽셀 ${diff} / ${w * h}  (${(diff / (w * h) * 100).toFixed(2)}%)`);

const bands = [];
let start = -1;
for (let y = 0; y < h; y++) {
  const on = rowDiff[y] > w * 0.01;
  if (on && start < 0) start = y;
  if (!on && start >= 0) { bands.push([start, y - 1, Math.max(...rowDiff.slice(start, y))]); start = -1; }
}
if (start >= 0) bands.push([start, h - 1, Math.max(...rowDiff.slice(start))]);
console.log('세로 차이 구간:');
bands.slice(0, 14).forEach(([s, e, m]) => console.log(`   y ${String(s).padStart(4)} ~ ${String(e).padStart(4)}   최대 ${m}px/행`));
if (!bands.length) console.log('   없음');
