/**
 * 카테고리 4페이지의 행 데이터(제목·연도·태그·프리뷰 이미지)를 뽑는다.
 * 행 내용은 잘려 있어도 DOM 에는 있으므로 호버 없이 읽을 수 있다.
 *   node catdata.mjs > cat-data.json
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

  out[slug] = await p.evaluate(() => {
    const t = [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && parseFloat(getComputedStyle(e).fontSize) > 40);
    const num = [...document.querySelectorAll('*')]
      .find(e => e.children.length === 0 && /^0\d$/.test(e.textContent.trim()) &&
                 e.getBoundingClientRect().y < 200);
    const v = document.querySelector('video');
    const panel = document.elementsFromPoint(t.getBoundingClientRect().x + 5,
                                             t.getBoundingClientRect().y + 40)
      .map(e => getComputedStyle(e).backgroundColor).find(c => c !== 'rgba(0, 0, 0, 0)');

    // 행 상자: overflow hidden, 폭 > 900
    const rowEls = [...document.querySelectorAll('div')]
      .map(e => ({ e, r: e.getBoundingClientRect(), c: getComputedStyle(e) }))
      .filter(o => o.c.overflow === 'hidden' && o.r.width > 900 && o.r.y > 250 && o.r.height > 50)
      .sort((a, b) => a.r.y - b.r.y);

    const rows = rowEls.map(({ e }) => {
      const leaves = [...e.querySelectorAll('*')].filter(x => x.children.length === 0 &&
        x.textContent.trim().length > 0);
      const serif = leaves.filter(x => getComputedStyle(x).fontFamily.includes('Lock Serif'));
      const mono = leaves.filter(x => getComputedStyle(x).fontFamily.includes('JetBrains'));
      const img = e.querySelector('img');
      const year = mono.map(x => x.textContent.trim()).find(x => /^(19|20)\d\d$/.test(x));
      const tags = mono.map(x => x.textContent.trim())
        .filter(x => !/^(19|20)\d\d$/.test(x) && x.length > 2);
      return {
        title: serif.length ? serif[0].textContent.trim() : null,
        year: year || null,
        tags,
        img: img ? img.currentSrc : null,
        href: e.closest('a') ? e.closest('a').getAttribute('href') : null,
      };
    });

    return {
      num: num ? num.textContent.trim() : null,
      title: t.textContent.trim(),
      panel,
      video: v ? v.currentSrc : null,
      rows,
    };
  });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
