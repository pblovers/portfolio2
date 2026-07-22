/**
 * 원본의 sticky 요소 높이 / 흰 커버 높이를 뷰포트 높이를 바꿔가며 잰다.
 *   node mstick.mjs
 */
import { chromium } from 'playwright';

const CASES = [[1440, 900], [1440, 1080], [1920, 1080], [1280, 800], [1600, 700]];

const browser = await chromium.launch();
for (const [W, H] of CASES) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2200);

  const m = await p.evaluate(() => {
    const sticky = [...document.querySelectorAll('*')]
      .filter(e => getComputedStyle(e).position === 'sticky')
      .map(e => {
        const r = e.getBoundingClientRect();
        return {
          cls: (e.className || '').toString().slice(0, 24),
          h: +r.height.toFixed(2), w: +r.width.toFixed(2), y: +r.y.toFixed(2),
          parentH: +e.parentElement.getBoundingClientRect().height.toFixed(2),
          cssH: getComputedStyle(e).height,
        };
      });
    return { sticky, docH: document.documentElement.scrollHeight, vh: innerHeight };
  });
  console.log(JSON.stringify({ W, H, msec: m.docH - m.vh, ...m }));
  await ctx.close();
}
await browser.close();
