/* Archive 캐러셀 인터랙션 검수: 호버(들림+프리뷰) / 드래그 / 휠 / 더블클릭 줌 */
import { chromium } from 'playwright';
const w = Number(process.argv[2] || 1440), h = Number(process.argv[3] || 900);
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errors = [];
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', e => errors.push(String(e)));

await p.goto('http://localhost:8080/index.html', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, document.querySelector('#archive').getBoundingClientRect().top + scrollY));
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.settle());
await p.waitForTimeout(1500);

const R = {};

/* --- 카드 하나의 화면 좌표를 구해 그 위로 마우스를 옮긴다 --- */
const pt = await p.evaluate(() => {
  const a = document.querySelector('.js-carousel3d').__arc;
  const card = a.ring.children[0];
  card.updateMatrixWorld(true);
  const v = new card.position.constructor(0, 0, 0);
  v.setFromMatrixPosition(card.matrixWorld);
  v.project(a.camera);
  const r = document.querySelector('.arc-stage').getBoundingClientRect();
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - (v.y + 1) / 2) * r.height };
});
await p.mouse.move(pt.x, pt.y);
await p.waitForTimeout(1200);
R.hover = await p.evaluate(() => {
  const a = document.querySelector('.js-carousel3d').__arc;
  const pv = document.querySelector('.arc-preview');
  const scales = a.ring.children.map(c => Math.round(c.scale.x * 1000) / 1000);
  return { maxScale: Math.max(...scales), maxY: Math.max(...a.ring.children.map(c => Math.round(c.position.y*1000)/1000)),
           previewOpacity: pv ? pv.style.opacity : null, previewSrc: pv && pv.getAttribute('src') ? pv.getAttribute('src').split('/').pop() : null };
});

/* --- 드래그로 링 회전 --- */
const before = await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.state.targetRotation);
await p.mouse.move(pt.x, pt.y);
await p.mouse.down();
await p.mouse.move(pt.x + 300, pt.y, { steps: 10 });
await p.mouse.up();
await p.waitForTimeout(300);
const after = await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.state.targetRotation);
R.drag = { before: +before.toFixed(4), after: +after.toFixed(4), changed: Math.abs(after - before) > 1e-4 };

/* --- 휠 소유권: 카드 위에서는 링만 돌고, 바깥에서는 페이지가 스크롤돼야 한다 --- */
const wheelAt = async (x, y, label) => {
  await p.evaluate(() => window.scrollTo(0, document.querySelector('#archive').getBoundingClientRect().top + scrollY));
  await p.waitForTimeout(700);
  const s0 = await p.evaluate(() => window.scrollY);
  const r0 = await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.state.targetRotation);
  await p.mouse.move(x, y);
  await p.mouse.wheel(0, 400);
  await p.waitForTimeout(900);
  const out = await p.evaluate(([s, r]) => ({
    pageScrolled: Math.round(window.scrollY - s),
    ringTurnedDeg: Math.round((document.querySelector('.js-carousel3d').__arc.state.targetRotation - r) * 180 / Math.PI * 10) / 10
  }), [s0, r0]);
  return { at: label, ...out };
};
const rect = await p.evaluate(() => {
  const a = document.querySelector('.js-carousel3d').__arc;
  return a.cardsRect ? a.cardsRect() : null;
});
R.cardsRect = rect && { left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom) };
R.wheelOnCards = await wheelAt(w / 2, h / 2, 'cards');
R.wheelOffCards = await wheelAt(60, 60, 'empty');

/* --- 더블클릭 줌 --- */
await p.evaluate(() => window.scrollTo(0, document.querySelector('#archive').getBoundingClientRect().top + scrollY));
await p.waitForTimeout(600);
const dBefore = await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.state.targetDistance);
await p.mouse.dblclick(w / 2, h / 2);
await p.waitForTimeout(400);
const dAfter = await p.evaluate(() => document.querySelector('.js-carousel3d').__arc.state.targetDistance);
R.dblclick = { before: +dBefore.toFixed(2), after: +dAfter.toFixed(2), ratio: +(dAfter / dBefore).toFixed(3) };

R.errors = errors;
console.log(JSON.stringify(R, null, 1));
await b.close();
