/**
 * 카테고리 4페이지의 행 데이터를 **행마다 호버해서** 완전히 뽑는다.
 * 연도·태그는 평상 상태에서는 DOM 에 없고 호버 시 렌더된다.
 *   node catrows.mjs > cat-rows.json
 */
import { chromium } from 'playwright';

const SLUGS = ['works-branding', 'works-editorial', 'works-illustration', 'works-3d-tech'];
const browser = await chromium.launch();
const out = {};

for (const slug of SLUGS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(`https://www.wildyriftian.com/${slug}`, { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(2400);

  const meta = await p.evaluate(() => {
    const t = [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && parseFloat(getComputedStyle(e).fontSize) > 40);
    const num = [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && /^0\d$/.test(e.textContent.trim()) &&
                 e.getBoundingClientRect().y < 200);
    const v = document.querySelector('video');
    const r = t.getBoundingClientRect();
    const panel = document.elementsFromPoint(r.x + 5, r.y + 40)
      .map(e => getComputedStyle(e).backgroundColor).find(c => c !== 'rgba(0, 0, 0, 0)');
    return { num: num && num.textContent.trim(), title: t.textContent.trim(), panel,
             video: v && v.currentSrc };
  });

  // 프리뷰 이미지를 가진 행만 고른다 (푸터 등 제외)
  const count = await p.evaluate(() => [...document.querySelectorAll('div')]
    .map(e => ({ e, r: e.getBoundingClientRect(), c: getComputedStyle(e) }))
    .filter(o => o.c.overflow === 'hidden' && o.r.width > 900 && o.r.y > 250 &&
                 o.r.height > 50 && o.e.querySelector('img')).length);

  const rows = [];
  for (let i = 0; i < count; i++) {
    // 매번 위치가 바뀌므로(펼쳐지며 아래가 밀림) 그때그때 다시 찾는다
    const box = await p.evaluate((idx) => {
      const el = [...document.querySelectorAll('div')]
        .map(e => ({ e, r: e.getBoundingClientRect(), c: getComputedStyle(e) }))
        .filter(o => o.c.overflow === 'hidden' && o.r.width > 900 && o.r.y > 250 &&
                     o.r.height > 50 && o.e.querySelector('img'))
        .sort((a, b) => a.r.y - b.r.y)[idx];
      if (!el) return null;
      el.e.scrollIntoView({ block: 'center' });
      const r = el.e.getBoundingClientRect();
      return { x: r.x + 100, y: r.y + 20 };
    }, i);
    if (!box) continue;
    await p.mouse.move(box.x, box.y);
    await p.waitForTimeout(900);

    rows.push(await p.evaluate((idx) => {
      const el = [...document.querySelectorAll('div')]
        .map(e => ({ e, r: e.getBoundingClientRect(), c: getComputedStyle(e) }))
        .filter(o => o.c.overflow === 'hidden' && o.r.width > 900 && o.r.y > 200 &&
                     o.e.querySelector('img'))
        .sort((a, b) => a.r.y - b.r.y)[idx];
      if (!el) return null;
      const leaves = [...el.e.querySelectorAll('*')]
        .filter(x => x.children.length === 0 && x.textContent.trim().length > 0);
      const serif = leaves.filter(x => getComputedStyle(x).fontFamily.includes('Lock Serif'));
      const mono = leaves.filter(x => getComputedStyle(x).fontFamily.includes('JetBrains'));
      const img = el.e.querySelector('img');
      const year = mono.map(x => x.textContent.trim()).find(x => /^(19|20)\d\d$/.test(x));
      return {
        title: serif.length ? serif[0].textContent.trim() : null,
        year: year || null,
        tags: mono.map(x => x.textContent.trim()).filter(x => !/^(19|20)\d\d$/.test(x)),
        img: img ? img.currentSrc : null,
        href: el.e.closest('a') ? el.e.closest('a').getAttribute('href') : null,
        h: +el.r.height.toFixed(1),
      };
    }, i));
    await p.mouse.move(5, 5);
    await p.waitForTimeout(500);
  }
  out[slug] = { ...meta, rows };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
