/**
 * works-motion 원본의 특정 지점 요소 스택을 뜬다.
 * (조상 순회로는 Framer 의 형제/래퍼 스타일을 못 찾는다 — HANDOFF 8절 교훈 2)
 *   node mprobe.mjs [width] [height]
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1024);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2500);

const out = await p.evaluate(() => {
  const info = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 40),
      rect: [Math.round(r.x * 100) / 100, Math.round(r.y * 100) / 100,
             Math.round(r.width * 100) / 100, Math.round(r.height * 100) / 100],
      bg: cs.backgroundColor,
      clip: cs.clipPath,
      radius: cs.borderRadius,
      z: cs.zIndex,
      pos: cs.position,
      overflow: cs.overflow,
    };
  };

  // 첫 카드 이미지를 찾는다
  const imgs = [...document.querySelectorAll('img')]
    .filter(i => { const r = i.getBoundingClientRect(); return r.width > 300 && r.height > 200 && r.y > 300; });
  const img = imgs[0];
  const ir = img ? img.getBoundingClientRect() : null;

  // 카드 번호 텍스트 노드
  const nums = [...document.querySelectorAll('p,span,div')]
    .filter(e => /^0\d$/.test(e.textContent.trim()) && e.children.length === 0)
    .map(e => ({ text: e.textContent.trim(), ...info(e), parent: info(e.parentElement) }));

  // 이미지 좌상단 근처 스택
  const stackAt = (x, y) => document.elementsFromPoint(x, y).slice(0, 6).map(info);

  return {
    img: img ? info(img) : null,
    imgParents: img ? [img.parentElement, img.parentElement.parentElement,
                       img.parentElement.parentElement.parentElement].map(info) : [],
    nums: nums.slice(0, 4),
    stackInsideCorner: ir ? stackAt(ir.x + 3, ir.y + 3) : [],
    stackAboveCorner: ir ? stackAt(ir.x + 3, ir.y - 5) : [],
    stackLeftCorner: ir ? stackAt(ir.x - 5, ir.y + 3) : [],
  };
});

console.log(JSON.stringify(out, null, 1));
await browser.close();
