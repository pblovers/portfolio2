/**
 * 원본 works-motion 을 여러 폭에서 재서 데스크톱 수치가 폭에 따라
 * 어떻게 변하는지 본다 (1440 한 점만 재면 상수인지 비례인지 알 수 없다).
 *   node msweep.mjs
 */
import { chromium } from 'playwright';

const WIDTHS = [1280, 1366, 1440, 1600, 1728, 1920];
const H = 900;

const browser = await chromium.launch();
for (const W of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2200);

  const m = await p.evaluate(() => {
    const R = (el) => el ? [...['x', 'y', 'width', 'height'].map(k => +el.getBoundingClientRect()[k].toFixed(2))] : null;
    const leaf = (pred) => [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && pred((e.textContent || '').trim()));

    // 탭 스트립: 번호 01(패널 위쪽) 을 담은 회색 상자
    const num = leaf(t => t === '01');
    let tab = null;
    if (num) {
      // 번호 위 지점의 스택에서 배경이 f5f5f5 인 첫 상자
      const r = num.getBoundingClientRect();
      tab = document.elementsFromPoint(r.x + 2, r.y + 2)
        .find(e => getComputedStyle(e).backgroundColor === 'rgb(245, 245, 245)');
    }
    const video = document.querySelector('video');
    // 흰 커버: 배경이 흰색이고 뷰포트 폭 전체인 가장 큰 상자
    const white = [...document.querySelectorAll('div')]
      .filter(e => getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)')
      .map(e => ({ e, r: e.getBoundingClientRect() }))
      .filter(o => o.r.width >= innerWidth - 1 && o.r.height > 300)
      .sort((a, b) => a.r.height - b.r.height)[0];

    return {
      tab: R(tab), video: R(video), white: white ? R(white.e) : null,
      docH: document.documentElement.scrollHeight, vw: innerWidth, vh: innerHeight,
    };
  });
  console.log(JSON.stringify({ W, ...m }));
  await ctx.close();
}
await browser.close();
