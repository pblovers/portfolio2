/**
 * works-motion 원본 스크롤 구간 캡처 + 섹션/푸터 스택 구조 채집
 *   node mscroll.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('./diff/mscroll', { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2600);
await p.evaluate(() => {
  document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
});

for (const sy of [0, 220, 400, 600, 760]) {
  await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), sy);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `./diff/mscroll/orig-${String(sy).padStart(3, '0')}.png` });
}

// 흰 섹션 요소의 실제 CSS 구조를 스택으로 확인
await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await p.waitForTimeout(700);
const struct = await p.evaluate(() => {
  // 흰 섹션: 'SEE ALL WORKS' 를 포함하는 조상 중 흰 배경 큰 박스
  const a = [...document.querySelectorAll('a')].find(x => (x.innerText || '').includes('SEE ALL WORKS'));
  const chain = [];
  let el = a;
  for (let i = 0; i < 10 && el && el !== document.documentElement; i++) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    chain.push({
      i, tag: el.tagName, name: el.getAttribute('data-framer-name'),
      pos: cs.position, top: cs.top, z: cs.zIndex,
      bg: cs.backgroundColor, overflow: cs.overflow,
      transform: cs.transform.slice(0, 46),
      w: Math.round(r.width), h: Math.round(r.height),
      vy: Math.round(r.y * 10) / 10,
    });
    el = el.parentElement;
  }
  // body 직계 자식 전부
  const kids = [...document.body.children].map(c => {
    const cs = getComputedStyle(c);
    const r = c.getBoundingClientRect();
    return {
      tag: c.tagName, id: c.id || null, name: c.getAttribute('data-framer-name'),
      pos: cs.position, z: cs.zIndex, h: Math.round(r.height), vy: Math.round(r.y),
      bg: cs.backgroundColor,
    };
  });
  return { chain, kids };
});
writeFileSync('./diff/mscroll/struct.json', JSON.stringify(struct, null, 1));
console.log(JSON.stringify(struct, null, 1));
await browser.close();
