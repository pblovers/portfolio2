/**
 * 우리 구현만 여러 뷰포트에서 스크롤 끝 푸터 기하를 찍는다 (원본 실측값과 대조용).
 *   node footmine.mjs index.html works/works.html -- 810x700 1024x900 ...
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--');
const files = args.slice(0, i);
const vps = args.slice(i + 1).map(s => s.split('x').map(Number));

const probe = () => {
  const t = e => (e.textContent || '').trim().replace(/\s+/g, ' ');
  const R = e => { if (!e) return null; const b = e.getBoundingClientRect();
    return { t: Math.round(b.top), b: Math.round(b.bottom) }; };
  const f = document.getElementById('footer');
  const fr = f.getBoundingClientRect();
  // 뷰포트 바닥을 칠하는 요소 (푸터가 아니면 = 배경 띠가 샌다)
  let el = document.elementFromPoint(Math.round(innerWidth / 2), innerHeight - 2);
  while (el && getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)') el = el.parentElement;
  return {
    docH: document.documentElement.scrollHeight,
    box: { t: Math.round(fr.top), b: Math.round(fr.bottom), h: Math.round(fr.height) },
    svc1: R(document.querySelector('.services a')),
    links: R(document.querySelector('.footer-links a')),
    wm: R(document.querySelector('.wordmark')),
    copy: R(document.querySelector('.footer-bottom')),
    bottomEl: el ? (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + (el.className || '').split(' ')[0]) : '?',
    bottomBg: el ? getComputedStyle(el).backgroundColor : '?',
  };
};

const browser = await chromium.launch();
for (const file of files) {
  for (const [W, H] of vps) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(mine(file), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(3500);
    for (let k = 0; k < 8; k++) {
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(600);
    const d = await p.evaluate(probe);
    console.log(`${file.padEnd(22)} ${String(W).padStart(4)}x${H}  box=${d.box.t}~${d.box.b}(h${d.box.h})  svc1=${d.svc1.t}  links.b=${d.links.b}  wm.b=${d.wm.b}  copy.b=${d.copy.b}  바닥=${d.bottomEl} ${d.bottomBg}`);
    await ctx.close();
  }
}
await browser.close();
