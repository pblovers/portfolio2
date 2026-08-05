/**
 * 스크롤 끝에서 "푸터가 뷰포트를 채우는가"를 원본/구현 양쪽에서 실측한다.
 * footdiff 는 픽셀 대조라 '아래 여백'이 생겨도 회색조 배경끼리는 TOL 안에 묻힌다.
 * 여기서는 기하(문서높이·푸터 rect·뷰포트 바닥을 칠하는 요소)를 직접 읽는다.
 *
 *   node footgeo.mjs <index|works|motion|branding|detail> [w] [h]
 *   node footgeo.mjs index 1440x900 1024x900 375x812      (여러 뷰포트 한 번에)
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const PAGES = {
  index:    ['https://www.wildyriftian.com/',              'index.html'],
  works:    ['https://www.wildyriftian.com/works',         'works.html'],
  motion:   ['https://www.wildyriftian.com/works-motion',  'works-motion.html'],
  branding: ['https://www.wildyriftian.com/works-branding','works-branding.html'],
  detail:   ['https://www.wildyriftian.com/works/overbloom','work-overbloom.html'],
  flat:     ['https://www.wildyriftian.com/works/flat-earther','work-flat-earther.html'],
  pw:       ['https://www.wildyriftian.com/works-photoworks','works-photoworks.html'],
};

const key = process.argv[2] || 'index';
const vps = (process.argv.slice(3).length ? process.argv.slice(3) : ['1440x900'])
  .map(s => s.split('x').map(Number));
const [origUrl, mineFile] = PAGES[key];

const probe = () => {
  const H = innerHeight, W = innerWidth, cx = Math.round(W / 2);
  const txt = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ');
  const all = [...document.querySelectorAll('*')];
  const byText = (re, max) => {
    const hits = all.filter(e => re.test(txt(e)) && (!max || txt(e).length <= max));
    return hits.length ? hits[hits.length - 1] : null;
  };
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { t: Math.round(b.top), b: Math.round(b.bottom), h: Math.round(b.height), l: Math.round(b.left) };
  };
  // 뷰포트 바닥(중앙 1px 위)을 실제로 칠하는 요소를 위로 훑는다
  const bottomPaint = () => {
    let el = document.elementFromPoint(cx, H - 2), out = [];
    while (el && out.length < 6) {
      const cs = getComputedStyle(el);
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 40),
        bg: cs.backgroundColor,
        pos: cs.position,
      });
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') break;
      el = el.parentElement;
    }
    return out;
  };
  // 푸터로 볼 만한 요소: 카피라이트를 품은 가장 바깥 블록
  const cr = byText(/^©\s*20\d\d/, 60);
  let foot = cr;
  while (foot && foot.parentElement && foot.parentElement.getBoundingClientRect().height < H * 1.6) {
    foot = foot.parentElement;
    if (foot === document.body) break;
  }
  return {
    W, H,
    docH: Math.round(document.documentElement.scrollHeight),
    scrollY: Math.round(scrollY),
    maxScroll: Math.round(document.documentElement.scrollHeight - H),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    footer: (() => {
      const f = document.querySelector('#footer, footer, [id*="footer" i]');
      return f ? { ...r(f), pos: getComputedStyle(f).position, bg: getComputedStyle(f).backgroundColor } : null;
    })(),
    footBlock: foot && foot !== document.body ? { ...r(foot), pos: getComputedStyle(foot).position } : null,
    services1: r(byText(/^0?1?\s*Motion Design$/i, 30)),
    keychainish: null,
    links: r(byText(/^RESUME$/i, 12)),
    copyright: r(cr),
    credit: r(byText(/^WEBSITE BY/i, 40)),
    bottomPaint: bottomPaint(),
  };
};

const browser = await chromium.launch();
for (const [W, H] of vps) {
  const rows = {};
  for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await p.waitForTimeout(5000);
      for (let i = 0; i < 6; i++) {
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await p.waitForTimeout(300);
      }
      await p.waitForTimeout(700);
      rows[tag] = await p.evaluate(probe);
    } catch (e) { rows[tag] = { err: String(e).slice(0, 90) }; }
    await ctx.close();
  }
  console.log(`\n===== ${key}  ${W}x${H} =====`);
  for (const tag of ['orig', 'mine']) {
    const d = rows[tag];
    if (d.err) { console.log(`${tag}: ERROR ${d.err}`); continue; }
    console.log(`${tag}: docH=${d.docH} scrollY=${d.scrollY}/${d.maxScroll} bodyBg=${d.bodyBg}`);
    console.log(`  footer  ${JSON.stringify(d.footer)}`);
    console.log(`  block   ${JSON.stringify(d.footBlock)}`);
    console.log(`  svc1=${JSON.stringify(d.services1)} links=${JSON.stringify(d.links)}`);
    console.log(`  copy=${JSON.stringify(d.copyright)} credit=${JSON.stringify(d.credit)}`);
    console.log(`  bottomPaint: ${d.bottomPaint.map(b => `${b.tag}${b.id ? '#' + b.id : ''}.${b.cls}[${b.pos}] ${b.bg}`).join(' <- ')}`);
  }
}
await browser.close();
