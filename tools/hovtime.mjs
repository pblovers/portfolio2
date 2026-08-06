/**
 * roll 호버 애니메이션의 시간 곡선을 잰다.
 * 링크 상자를 일정 간격으로 찍어 "배경이 차오른 비율" 을 뽑는다.
 *   node hovtime.mjs <index|works|motion> <라벨> [width] [height] [top]
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const PAGES = {
  index: ['https://www.wildyriftian.com/', 'index.html'],
  works: ['https://www.wildyriftian.com/works', 'works/works.html'],
  motion: ['https://www.wildyriftian.com/works-motion', 'works/works-uiux.html'],
};
const key = process.argv[2] || 'motion';
const LABEL = process.argv[3] || 'HOME';
const W = Number(process.argv[4] || 1440);
const H = Number(process.argv[5] || 900);
const TOP = process.argv[6] === 'top';
const [origUrl, mineFile] = PAGES[key];
const TIMES = [0, 50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 800];
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
const series = {};
for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => document.querySelectorAll('.appear').forEach(e => e.classList.add('in')));
  if (!TOP) {
    for (let i = 0; i < 5; i++) {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(300);
    }
  }
  const b = await p.evaluate(find, LABEL);
  if (!b) { console.log(`${tag}: 없음`); await ctx.close(); continue; }
  const clip = { x: b.x, y: b.y, width: b.w, height: b.h };

  // 평상 상태의 대표색을 먼저 잡는다 (차오르는 배경색과 구분하기 위해)
  const shot = async () => {
    const buf = await p.screenshot({ clip });
    const png = PNG.sync.read(buf);
    // 각 행이 "채워졌는지" = 그 행의 밝기 중앙값이 평상 배경과 다른지
    const rows = [];
    for (let y = 0; y < png.height; y++) {
      let sum = 0;
      for (let x = 0; x < png.width; x++) sum += png.data[((png.width * y + x) << 2)];
      rows.push(sum / png.width);
    }
    return rows;
  };
  const base = await shot();

  series[tag] = [];
  for (const t of TIMES) {
    // 매번 호버를 새로 걸어야 t 시점을 정확히 잡는다
    await p.mouse.move(2, 2);
    await p.waitForTimeout(700);
    await p.mouse.move(b.x + Math.min(20, b.w / 2), b.y + b.h / 2);
    if (t) await p.waitForTimeout(t);
    const rows = await shot();
    // 평상 대비 바뀐 행의 개수 = 차오른 높이
    const changed = rows.filter((v, i) => Math.abs(v - base[i]) > 6).length;
    series[tag].push([t, +(changed / rows.length).toFixed(2)]);
  }
  await ctx.close();
}
await browser.close();

console.log(`=== ${key} "${LABEL}" roll 진행률 (1 = 완전히 차오름) ===`);
console.log('  ms   ' + TIMES.map(t => String(t).padStart(5)).join(''));
for (const tag of ['orig', 'mine']) {
  if (!series[tag]) continue;
  console.log(`  ${tag.padEnd(5)}` + series[tag].map(([, v]) => v.toFixed(2).padStart(5)).join(''));
}
