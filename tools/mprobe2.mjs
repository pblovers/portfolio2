/**
 * 원본 works-motion 의 뒤로가기 링크 / 구분선 / 푸터를 자세히 뜬다.
 *   node mprobe2.mjs [width] [height]
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
  const R = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 34),
      rect: [+r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)],
      text: el.children.length === 0 ? el.textContent.slice(0, 40) : undefined,
      font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(',')[0]} ${cs.fontWeight}`,
      color: cs.color, bg: cs.backgroundColor,
      bgImage: cs.backgroundImage.slice(0, 120),
      border: cs.borderTop + ' | ' + cs.borderBottom,
      html: el.children.length ? undefined : el.innerHTML.slice(0, 60),
    };
  };

  // 뒤로가기 앵커
  const back = [...document.querySelectorAll('a')]
    .find(a => /SEE ALL WORKS/i.test(a.textContent));
  const backTree = back ? [back, ...back.querySelectorAll('*')].slice(0, 10).map(R) : [];

  // y=311 구분선: 그 지점의 스택
  const div311 = document.elementsFromPoint(500, 311).slice(0, 4).map(R);

  return { backTree, backHTML: back ? back.outerHTML.slice(0, 900) : null, div311 };
});

console.log(JSON.stringify(out, null, 1));
await browser.close();
