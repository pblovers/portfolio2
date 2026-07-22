/**
 * 카테고리(표 레이아웃) 페이지 원본 실측.
 *   node catprobe.mjs <slug> [width] [height]
 * 예) node catprobe.mjs works-branding 1440 900
 */
import { chromium } from 'playwright';

const slug = process.argv[2] || 'works-branding';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`https://www.wildyriftian.com/${slug}`, { waitUntil: 'networkidle', timeout: 90000 });
await p.waitForTimeout(2400);

const out = await p.evaluate(() => {
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [+r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)];
  };
  const F = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    return `${c.fontSize}/${c.lineHeight} ${c.fontFamily.split(',')[0].replace(/"/g, '')} ${c.color}`;
  };
  const leaf = (t) => [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && e.textContent.trim() === t);

  // 회색(또는 카테고리색) 패널 상자들
  const panels = [...document.querySelectorAll('div,span,section,a')]
    .map(e => ({ e, r: e.getBoundingClientRect(), c: getComputedStyle(e) }))
    .filter(o => o.c.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                 o.c.backgroundColor !== 'rgb(255, 255, 255)' &&
                 o.r.width > 100 && o.r.height > 20 && o.r.y < 2000)
    .map(o => ({ rect: R(o.e), bg: o.c.backgroundColor, radius: o.c.borderRadius }))
    .sort((a, b) => a.rect[1] - b.rect[1]);

  const title = [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && parseFloat(getComputedStyle(e).fontSize) > 40);
  const num = [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && /^0\d$/.test(e.textContent.trim()) &&
               e.getBoundingClientRect().y < 200);

  // 표 행: x<800 의 28px 세리프 제목 + 프리뷰 이미지
  const rowTitles = [...document.querySelectorAll('*')]
    .filter(e => e.children.length === 0 && e.textContent.trim().length > 2 &&
                 parseFloat(getComputedStyle(e).fontSize) >= 20 &&
                 getComputedStyle(e).fontFamily.includes('Lock Serif') &&
                 e.getBoundingClientRect().y > (title ? title.getBoundingClientRect().bottom : 200))
    .map(e => ({ t: e.textContent.trim(), rect: R(e), font: F(e) }))
    .sort((a, b) => a.rect[1] - b.rect[1]);

  const previews = [...document.querySelectorAll('img')]
    .map(i => ({ i, r: i.getBoundingClientRect() }))
    .filter(o => o.r.width > 100 && o.r.height > 60 && o.r.y > 200)
    .sort((a, b) => a.r.y - b.r.y)
    .map(o => ({ rect: R(o.i), src: o.i.currentSrc, nat: [o.i.naturalWidth, o.i.naturalHeight],
                 fit: getComputedStyle(o.i).objectFit }));

  // 점선 구분선 (높이 1)
  const lines = [...document.querySelectorAll('*')]
    .map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(o => o.r.height <= 1.5 && o.r.width > 200 && o.r.y > 150)
    .sort((a, b) => a.r.y - b.r.y)
    .slice(0, 8)
    .map(o => R(o.e));

  const v = document.querySelector('video');
  return {
    vw: innerWidth, vh: innerHeight, docH: document.documentElement.scrollHeight,
    num: { rect: R(num), font: F(num) },
    title: { t: title && title.textContent.trim(), rect: R(title), font: F(title) },
    head: { pt: R(leaf('PROJECT TITLE')), pv: R(leaf('PREVIEW')), font: F(leaf('PROJECT TITLE')) },
    panels: panels.slice(0, 5),
    lines,
    rowTitles, previews,
    video: v ? { rect: R(v), src: v.currentSrc } : null,
  };
});
await browser.close();

const j = (v) => JSON.stringify(v);
console.log(`=== ${slug}  ${out.vw}x${out.vh}  docH ${out.docH} ===`);
console.log('번호      ', j(out.num.rect), out.num.font);
console.log('제목      ', out.title.t, j(out.title.rect), out.title.font);
console.log('표머리    ', 'PROJECT TITLE', j(out.head.pt), ' PREVIEW', j(out.head.pv), out.head.font);
out.panels.forEach((p, i) => console.log(`패널${i + 1}     `, j(p.rect), p.bg, p.radius));
out.lines.forEach((l, i) => console.log(`구분선${i + 1}   `, j(l)));
console.log('영상      ', out.video ? j(out.video.rect) + ' ' + out.video.src.split('/').pop().split('?')[0] : '없음');
out.rowTitles.forEach((r, i) => console.log(`행제목${i + 1}   `, j(r.rect), r.t));
out.previews.forEach((r, i) => console.log(`프리뷰${i + 1}   `, j(r.rect), 'nat', j(r.nat), r.fit, r.src.split('/').pop().split('?')[0].slice(0, 24)));
