/**
 * index featured works 스트립 영역을 랜드마크 정렬 후 픽셀 비교
 *   node idxdiff.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
mkdirSync('./diff', { recursive: true });

const browser = await chromium.launch();
const files = {};
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', 'file:///D:/이젠아카데미/portfolio2/index.html']]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 110));
    }
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
  await p.waitForTimeout(700);
  // FEATURED WORK 01 텍스트가 화면 y=200 에 오도록 반복 보정 (sticky 때문에 한 번으로는 안 맞음)
  const info = await p.evaluate(async () => {
    const find = () => [...document.querySelectorAll('*')].find(e => /^FEATURED WORK 01/i.test(e.textContent.trim()) && e.children.length === 0);
    let t = find();
    if (!t) return null;
    for (let i = 0; i < 12; i++) {
      const cur = t.getBoundingClientRect().top;
      const delta = cur - 200;
      if (Math.abs(delta) < 0.6) break;
      window.scrollTo({ top: scrollY + delta, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 60));
      t = find();
    }
    // 마퀴(chips)를 같은 위치로 고정
    document.querySelectorAll('.chips-track, [class*="ticker"], [class*="marquee"]').forEach(e => { e.style.transform = 'none'; });
    return { docY: Math.round(t.getBoundingClientRect().top + scrollY) };
  });
  await p.waitForTimeout(500);
  const y2 = await p.evaluate(() => {
    const t = [...document.querySelectorAll('*')].find(e => /^FEATURED WORK 01/i.test(e.textContent.trim()) && e.children.length === 0);
    return Math.round(t.getBoundingClientRect().top);
  });
  const f = `./diff/idx-${tag}-${W}.png`;
  await p.screenshot({ path: f });
  files[tag] = { f, y2, docY: info?.docY };
  console.log(`${tag}: FEATURED WORK 01 문서y=${info?.docY}  정렬후 화면y=${y2}`);
  await ctx.close();
}
await browser.close();

const a = PNG.sync.read(readFileSync(files.orig.f));
const b = PNG.sync.read(readFileSync(files.mine.f));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
const out = new PNG({ width: w, height: h });
let diff = 0; const rowDiff = new Array(h).fill(0);
const TOL = 12;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2, io = (w * y + x) << 2;
  const d = Math.max(Math.abs(a.data[ia] - b.data[ib]), Math.abs(a.data[ia + 1] - b.data[ib + 1]), Math.abs(a.data[ia + 2] - b.data[ib + 2]));
  if (d > TOL) { diff++; rowDiff[y]++; out.data[io] = 255; out.data[io + 1] = 0; out.data[io + 2] = 0; out.data[io + 3] = 255; }
  else { const g = Math.round(a.data[ia] * 0.35 + 160); out.data[io] = g; out.data[io + 1] = g; out.data[io + 2] = g; out.data[io + 3] = 255; }
}
writeFileSync(`./diff/idxdiff-${W}.png`, PNG.sync.write(out));
console.log(`\n다른 픽셀 ${diff} / ${w * h} (${(diff / (w * h) * 100).toFixed(2)}%)`);
const bands = []; let s = -1;
for (let y = 0; y < h; y++) { const on = rowDiff[y] > w * 0.02; if (on && s < 0) s = y; if (!on && s >= 0) { bands.push([s, y - 1, Math.max(...rowDiff.slice(s, y))]); s = -1; } }
if (s >= 0) bands.push([s, h - 1, Math.max(...rowDiff.slice(s))]);
console.log('차이 구간 (행의 2% 이상):');
bands.slice(0, 12).forEach(([x, y, m]) => console.log(`   y ${String(x).padStart(4)} ~ ${String(y).padStart(4)}  최대 ${m}px/행`));
console.log(`diff: ./diff/idxdiff-${W}.png`);
