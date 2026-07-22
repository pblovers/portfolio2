/**
 * works 페이지 로드 직후 폴더가 올라오는 진입 애니메이션을 프레임 단위로 잰다.
 * 스크립트가 실행되기 전에 관찰자를 심어야 하므로 addInitScript 를 쓴다.
 *   node introcurve.mjs [orig|mine] [width] [height]
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const which = process.argv[2] || 'orig';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const url = which === 'orig' ? 'https://www.wildyriftian.com/works' : mine('works.html');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();

// 문서가 만들어지기 전에 관찰자를 심는다
await p.addInitScript(() => {
  window.__samples = [];
  const t0 = performance.now();
  const tick = () => {
    const t = performance.now() - t0;
    // 폴더 제목(72px 세리프)들을 추적한다
    const names = ['motion', 'branding', 'editorial', 'photoworks', 'illustration', '3D tech'];
    const found = [];
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length) continue;
      const txt = (el.textContent || '').trim();
      if (!names.includes(txt)) continue;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) < 40) continue;
      const r = el.getBoundingClientRect();
      // 색이 실린 조상까지 훑어 opacity / transform 을 모은다
      let op = 1, tf = 'none', n = el;
      for (let i = 0; i < 6 && n; i++, n = n.parentElement) {
        const c = getComputedStyle(n);
        op *= parseFloat(c.opacity);
        if (c.transform !== 'none' && tf === 'none') tf = c.transform;
      }
      found.push([txt, +r.y.toFixed(1), +op.toFixed(3), tf === 'none' ? '' : tf.slice(7, 40)]);
    }
    if (found.length) window.__samples.push([Math.round(t), found]);
    if (t < 2600) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3200);
const s = await p.evaluate(() => window.__samples);
await browser.close();

if (!s.length) { console.log('샘플 없음'); process.exit(0); }
// motion 폴더만 시계열로 출력
const rows = s.map(([t, list]) => {
  const m = list.find(x => x[0] === 'motion');
  return m ? [t, m[1], m[2], m[3]] : null;
}).filter(Boolean);

console.log(`=== ${which} ${W}x${H} 폴더 진입 (motion 제목 기준) ===`);
console.log('  ms      y      opacity  transform');
let prev = null;
for (const [t, y, op, tf] of rows) {
  const key = `${y}|${op}|${tf}`;
  if (key === prev) continue;       // 변화가 있을 때만
  prev = key;
  console.log(`${String(t).padStart(5)}  ${String(y).padStart(7)}  ${op.toFixed(3)}   ${tf}`);
}
console.log(`총 ${rows.length} 프레임, 마지막 y=${rows[rows.length - 1][1]}`);
