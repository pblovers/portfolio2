/**
 * .m-panel(회색 폴더 패널) 영역만 원본 vs 구현으로 실측 + 잘라서 캡처.
 *   node panelcmp.mjs [width] [height]
 * 결과: diff/panel-{orig,mine}-{W}.png (패널 영역만), 콘솔에 요소별 좌표.
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
mkdirSync('./diff', { recursive: true });

/** 원본/구현 양쪽에서 같은 방식으로 뽑는다 — 클래스 이름에 기대지 않는다 */
const probe = () => {
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [+r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2)];
  };
  const leaf = (test) => [...document.querySelectorAll('*')]
    .find(e => e.children.length === 0 && test((e.textContent || '').trim()));

  // 회색(#f5f5f5) 배경 상자를 전부 모은다 — 패널 몸통·탭·배지가 여기 해당
  const grays = [...document.querySelectorAll('div,span,section,a')]
    .map(e => ({ e, r: e.getBoundingClientRect(), cs: getComputedStyle(e) }))
    .filter(o => o.cs.backgroundColor === 'rgb(245, 245, 245)' && o.r.width > 4 && o.r.height > 4)
    .map(o => ({
      rect: R(o.e), radius: o.cs.borderRadius, clip: o.cs.clipPath,
      z: o.cs.zIndex, pos: o.cs.position,
    }))
    .sort((a, b) => a.rect[1] - b.rect[1] || a.rect[0] - b.rect[0]);

  const title = leaf(t => t === 'motion');
  const num = leaf(t => t === '01' && getComputedStyle(t.parentElement || document.body).fontSize !== '10px');
  const cards = [...document.querySelectorAll('img')]
    .map(i => ({ i, r: i.getBoundingClientRect() }))
    .filter(o => o.r.width > 200 && o.r.height > 100 && o.r.height < 300 && o.r.y > 200)
    .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x)
    .map(o => R(o.i));
  const cardTitles = [...document.querySelectorAll('*')]
    .filter(e => e.children.length === 0 && /^(OVERBLOOM|IN BETWEEN|SCAD)/i.test((e.textContent || '').trim()))
    .map(e => R(e));
  // 점선 구분선: 높이 1 이고 폭이 큰 것
  const divider = [...document.querySelectorAll('*')]
    .map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(o => o.r.height <= 1.5 && o.r.width > 300 && o.r.y > 150 && o.r.y < 400)
    .sort((a, b) => a.r.y - b.r.y)[0];

  return {
    grays: grays.slice(0, 6),
    title: R(title), titleFont: title ? getComputedStyle(title).fontSize + '/' + getComputedStyle(title).lineHeight : null,
    num: R(num),
    divider: divider ? R(divider.e) : null,
    cards, cardTitles,
  };
};

const browser = await chromium.launch();
const out = {};
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/works-motion'], ['mine', mine('works-motion.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
    if (document.getAnimations) document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(500);
  out[tag] = await p.evaluate(probe);

  // 패널 영역만 자른다 — 탭 좌상단에서 카드 아래까지
  const g = out[tag].grays;
  const top = g.length ? g[0].rect[1] : 80;
  const left = g.length ? Math.min(...g.map(x => x.rect[0])) : 0;
  const bottom = Math.max(...out[tag].cardTitles.map(c => c[1] + c[3]), top + 400) + 40;
  await p.screenshot({
    path: `./diff/panel-${tag}-${W}.png`,
    clip: { x: left, y: top, width: Math.min(W - left, W), height: Math.min(bottom - top, H - top) },
  });
  await ctx.close();
}
await browser.close();

const fmt = (v) => v ? '[' + v.map(n => String(n).padStart(8)).join(',') + ']' : '없음';
const line = (label, a, b) => {
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${label.padEnd(14)} 원본 ${fmt(a)}\n${''.padEnd(14)} 구현 ${fmt(b)}  ${same ? '일치' : '<<<'}`);
};
console.log(`=== .m-panel 대조  ${W}x${H} ===`);
const n = Math.max(out.orig.grays.length, out.mine.grays.length);
for (let i = 0; i < n; i++) {
  const a = out.orig.grays[i], b = out.mine.grays[i];
  line(`회색상자${i + 1}`, a && a.rect, b && b.rect);
  if (a && b && (a.radius !== b.radius || a.clip !== b.clip)) {
    console.log(`${''.padEnd(14)} radius 원본 ${a.radius} / 구현 ${b.radius}   clip 원본 ${a.clip} / 구현 ${b.clip}`);
  }
}
line('번호01', out.orig.num, out.mine.num);
line('제목', out.orig.title, out.mine.title);
console.log(`${''.padEnd(14)} 폰트 원본 ${out.orig.titleFont} / 구현 ${out.mine.titleFont}`);
line('구분선', out.orig.divider, out.mine.divider);
out.orig.cards.forEach((c, i) => line(`카드${i + 1}`, c, out.mine.cards[i]));
out.orig.cardTitles.forEach((c, i) => line(`카드제목${i + 1}`, c, out.mine.cardTitles[i]));
console.log(`\n캡처: diff/panel-orig-${W}.png / diff/panel-mine-${W}.png`);
