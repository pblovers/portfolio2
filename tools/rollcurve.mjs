/**
 * roll 호버 곡선을 프레임 단위로 잰다 (화면 캡처 지연 없음).
 * 원본은 어두운 상자가 아래에서 올라오고, 구현은 ::before 가 올라온다.
 *   node rollcurve.mjs [mine|orig|both]
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const which = process.argv[2] || 'both';
const browser = await chromium.launch();

const measure = async (tag, url) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2500);
  await p.evaluate((isOrig) => {
    const a = [...document.querySelectorAll('a')].find(x => /^(HOME)+$/.test(x.textContent.replace(/\s/g, '')));
    let read;
    if (isOrig) {
      const box = [...a.querySelectorAll('div')].find(e => getComputedStyle(e).backgroundColor === 'rgb(33, 33, 33)');
      const rest = box.getBoundingClientRect().y;
      read = () => (rest - box.getBoundingClientRect().y) / 24;   // 24px 올라오면 1
    } else {
      const rb = a.querySelector('.roll-box');
      read = () => {
        // clip-path: inset(100% 0 0 0) → inset(0 0 0 0)
        const cp = getComputedStyle(rb, '::before').clipPath;
        const m = /inset\(([\d.]+)%/.exec(cp);
        return m ? 1 - Number(m[1]) / 100 : 0;
      };
    }
    window.__s = []; window.__t0 = null;
    const tick = (t) => {
      if (window.__t0 === null) window.__t0 = t;
      window.__s.push([Math.round(t - window.__t0), +read().toFixed(3)]);
      if (t - window.__t0 < 800) requestAnimationFrame(tick);
    };
    window.__start = () => requestAnimationFrame(tick);
  }, tag === 'orig');
  await p.evaluate(() => window.__start());
  await p.mouse.move(45, 28);
  await p.waitForTimeout(1100);
  const s = await p.evaluate(() => window.__s);
  await ctx.close();
  // 움직이기 시작한 프레임을 0 으로 맞춘다
  const i0 = s.findIndex(([, v]) => v > 0.01);
  const t0 = i0 > 0 ? s[i0 - 1][0] : 0;
  return s.filter(([t]) => t >= t0).map(([t, v]) => [t - t0, v]);
};

const out = {};
if (which !== 'mine') out.orig = await measure('orig', 'https://www.wildyriftian.com/works-motion');
if (which !== 'orig') out.mine = await measure('mine', mine('works-motion.html'));
await browser.close();

const GRID = [33, 67, 100, 133, 167, 200, 250, 300, 400, 500];
const at = (s, t) => {
  const r = s.reduce((best, cur) => Math.abs(cur[0] - t) < Math.abs(best[0] - t) ? cur : best, s[0]);
  return r[1];
};
console.log('  ms   ' + GRID.map(t => String(t).padStart(6)).join(''));
for (const [tag, s] of Object.entries(out)) {
  console.log(`  ${tag.padEnd(5)}` + GRID.map(t => at(s, t).toFixed(3).padStart(6)).join(''));
}
