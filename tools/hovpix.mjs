/**
 * 호버 상태를 픽셀로 대조한다. roll 링크처럼 ::before 배경이 차오르는
 * 효과는 computed style 로는 안 보이므로 화면을 찍어서 비교해야 한다.
 *   node hovpix.mjs <index|works|motion> <라벨> [width] [height] [대기ms]
 * 예) node hovpix.mjs motion EMAIL
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
const LABEL = process.argv[3] || 'EMAIL';
const W = Number(process.argv[4] || 1440);
const H = Number(process.argv[5] || 900);
const WAIT = Number(process.argv[6] || 900);
const [origUrl, mineFile] = PAGES[key];
mkdirSync('./diff', { recursive: true });

const find = (label) => {
  const norm = (s) => {
    let t = (s || '').replace(/\s+/g, ' ').trim().replace(/^0\d/, '');
    const h = t.length / 2;
    if (t.length % 2 === 0 && t.slice(0, h) === t.slice(h)) t = t.slice(0, h);
    return t;
  };
  const a = [...document.querySelectorAll('a,button')]
    .filter(e => norm(e.textContent) === label)
    .sort((x, y) => x.textContent.length - y.textContent.length)[0];
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
};

const browser = await chromium.launch();
const shots = {};
let box = null;
for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
  });
  // 7번째 인자에 top 을 주면 스크롤하지 않는다 (헤더처럼 위에 있는 요소용)
  if (process.argv[7] !== 'top') {
    for (let i = 0; i < 5; i++) {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(300);
    }
  }
  const b = await p.evaluate(find, LABEL);
  if (!b) { console.log(`${tag}: "${LABEL}" 없음`); await ctx.close(); continue; }
  box = box || b;
  await p.mouse.move(b.x + Math.min(20, b.w / 2), b.y + b.h / 2);
  await p.waitForTimeout(WAIT);
  const clip = { x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 10), width: b.w + 16, height: b.h + 20 };
  const file = `./diff/h-${key}-${LABEL.replace(/\W+/g, '')}-${tag}.png`;
  await p.screenshot({ path: file, clip });
  shots[tag] = file;
  await ctx.close();
}
await browser.close();

if (shots.orig && shots.mine) {
  const a = PNG.sync.read(readFileSync(shots.orig));
  const b = PNG.sync.read(readFileSync(shots.mine));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  let diff = 0;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2, io = (w * y + x) << 2;
    const d = Math.max(Math.abs(a.data[ia] - b.data[ib]), Math.abs(a.data[ia + 1] - b.data[ib + 1]),
                       Math.abs(a.data[ia + 2] - b.data[ib + 2]));
    if (d > 12) { diff++; out.data[io] = 255; out.data[io + 3] = 255; }
    else { const g = a.data[ia]; out.data[io] = out.data[io + 1] = out.data[io + 2] = g; out.data[io + 3] = 255; }
  }
  writeFileSync(`./diff/h-${key}-${LABEL.replace(/\W+/g, '')}-diff.png`, PNG.sync.write(out));
  console.log(`${key} "${LABEL}" 호버 ${WAIT}ms  다른 픽셀 ${diff} / ${w * h} (${(diff / (w * h) * 100).toFixed(1)}%)`);
}
