/**
 * 카피라이트에서 위로 훑어 '진짜 고정 푸터 박스'(position:fixed 조상)를 찾아
 * 그 rect 와 top/bottom/height 계산값을 찍는다. 페이지·뷰포트별로 비교한다.
 *   node footfix.mjs <key...> -- <w>x<h>...
 */
import { chromium } from 'playwright';

const PAGES = {
  index:    'https://www.wildyriftian.com/',
  works:    'https://www.wildyriftian.com/works',
  motion:   'https://www.wildyriftian.com/works-motion',
  branding: 'https://www.wildyriftian.com/works-branding',
  detail:   'https://www.wildyriftian.com/works/overbloom',
  flat:     'https://www.wildyriftian.com/works/flat-earther',
  pw:       'https://www.wildyriftian.com/works-photoworks',
};
const args = process.argv.slice(2);
const i = args.indexOf('--');
const keys = i < 0 ? ['index'] : args.slice(0, i);
const vps = (i < 0 ? ['1024x900'] : args.slice(i + 1)).map(s => s.split('x').map(Number));

const probe = () => {
  const txt = e => (e.textContent || '').trim().replace(/\s+/g, ' ');
  const all = [...document.querySelectorAll('*')];
  const last = re => { const h = all.filter(e => re.test(txt(e)) && txt(e).length < 60); return h[h.length - 1] || null; };
  const R = e => { const b = e.getBoundingClientRect();
    return { t: Math.round(b.top), b: Math.round(b.bottom), h: Math.round(b.height),
             l: Math.round(b.left), w: Math.round(b.width) }; };
  const cr = last(/^©\s*20\d\d/);
  const chain = [];
  let el = cr;
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().split(' ')[0].slice(0, 22),
      pos: cs.position, top: cs.top, bottom: cs.bottom, height: cs.height,
      bg: cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '-' : cs.backgroundColor,
      ...R(el),
    });
    el = el.parentElement;
  }
  const wm = all.filter(e => /^[A-Z]{10,}$/.test(txt(e)) && e.children.length === 0).pop();
  // 키링: 뷰포트 하단부에 있는 가장 큰 정사각형에 가까운 이미지
  const kc = [...document.images]
    .map(im => ({ im, r: im.getBoundingClientRect() }))
    .filter(o => o.r.width > 80 && Math.abs(o.r.width - o.r.height) < o.r.width * 0.5
                 && o.r.top > 0 && o.r.bottom < innerHeight + 300)
    .sort((a, b) => b.r.width - a.r.width)[0];
  return {
    H: innerHeight,
    chain: chain.slice(0, 8),
    svc1: (() => { const e = last(/^0?1?\s*Motion Design$/i); return e ? R(e) : null; })(),
    links: (() => { const e = last(/^RESUME$/i); return e ? R(e) : null; })(),
    wordmark: wm ? R(wm) : null,
    copy: cr ? R(cr) : null,
    keychain: kc ? R(kc.im) : null,
  };
};

const browser = await chromium.launch();
for (const [W, H] of vps) {
  for (const key of keys) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    // 상세 페이지는 영상 때문에 networkidle 이 안 온다 — domcontentloaded + 대기
    await p.goto(PAGES[key], { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForTimeout(4000);
    for (let k = 0; k < 6; k++) {
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(280);
    }
    await p.waitForTimeout(600);
    const d = await p.evaluate(probe);
    console.log(`\n===== ${key} ${W}x${H} =====`);
    console.log(`  svc1=${JSON.stringify(d.svc1)} links=${JSON.stringify(d.links)}`);
    console.log(`  wordmark=${JSON.stringify(d.wordmark)} copy=${JSON.stringify(d.copy)}`);
    console.log(`  keychain=${JSON.stringify(d.keychain)}`);
    for (const c of d.chain) {
      console.log(`  ${c.tag}.${c.cls.padEnd(22)} ${c.pos.padEnd(8)} top=${String(c.top).padEnd(8)} bot=${String(c.bottom).padEnd(8)} h=${String(c.height).padEnd(9)} rect(${c.t},${c.b}) bg=${c.bg}`);
    }
    await ctx.close();
  }
}
await browser.close();
