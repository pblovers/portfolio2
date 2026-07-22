/**
 * works-motion 기하 대조 — 원본 vs 구현을 같은 항목으로 측정해 나란히 출력
 *   node mcmp.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
mkdirSync('./diff', { recursive: true });

/** 원본/구현 양쪽에서 동일하게 뽑는 측정 함수 */
const probe = () => {
  const R = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100,
      w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
      fs: cs.fontSize, lh: cs.lineHeight, color: cs.color,
    };
  };
  const leaf = (pred) => [...document.querySelectorAll('p,span,div,a,h1,h2')]
    .find(e => e.children.length === 0 && pred((e.innerText || '').trim()));

  // 흰 박스(탭/본문)는 배경색으로 찾는다
  const whites = [...document.querySelectorAll('div,span')]
    .map(d => ({ d, r: d.getBoundingClientRect(), cs: getComputedStyle(d) }))
    .filter(o => o.cs.backgroundColor === 'rgb(245, 245, 245)' && o.r.width > 200 && o.r.height > 20)
    .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x);

  const imgs = [...document.querySelectorAll('img')]
    .filter(i => { const r = i.getBoundingClientRect(); return r.width > 200 && r.height > 100; })
    .sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);

  const vid = document.querySelector('video');

  // 가로 구분선
  const div1 = [...document.querySelectorAll('div,hr,span')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.height <= 3 && r.width > 500 && r.y > 200 && r.y < 320; })
    .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];

  const seeAllAnchor = [...document.querySelectorAll('a')].find(a => (a.innerText || '').includes('SEE ALL WORKS'));
  const seeAllText = leaf(t => t === 'SEE ALL WORKS');

  return {
    docH: document.documentElement.scrollHeight,
    tab: whites[0] ? R(whites[0].d) : null,
    body: whites[1] ? R(whites[1].d) : null,
    num01: R(leaf(t => t === '01' && (document.querySelector('*') , true) && leaf)),
    title: R(leaf(t => t === 'motion')),
    divider: R(div1),
    card1: imgs[0] ? R(imgs[0]) : null,
    card2: imgs[1] ? R(imgs[1]) : null,
    card3: imgs[2] ? R(imgs[2]) : null,
    cardTitle1: R(leaf(t => t.toUpperCase().startsWith('OVERBLOOM'))),
    cardTitle3: R(leaf(t => t.toUpperCase().startsWith('SCAD STARTUP'))),
    video: R(vid),
    seeAllAnchor: R(seeAllAnchor),
    seeAllText: R(seeAllText),
    // 푸터(고정 레이어 여부 확인용) — 스크롤 0 기준 뷰포트 좌표
    wordmark: R(leaf(t => t.startsWith('WILDYRIFTIANWORKS'))),
    copyright: R(leaf(t => t.startsWith('© 2025'))),
    email: R(leaf(t => t === 'EMAIL')),
    headerHome: R(leaf(t => t === 'HOME')),
  };
};

const browser = await chromium.launch();
const res = {};
for (const [tag, url] of [
  ['orig', 'https://www.wildyriftian.com/works-motion'],
  ['mine', mine('works-motion.html')],
]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    document.querySelectorAll('video').forEach(v => { try { v.pause(); v.currentTime = 0; } catch (e) {} });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForTimeout(400);
  res[tag] = await p.evaluate(probe);

  // 스크롤 후 푸터가 따라오는지(고정 레이어인지) 확인
  await p.evaluate(() => window.scrollTo(0, 400));
  await p.waitForTimeout(500);
  res[tag].afterScroll400 = await p.evaluate(() => {
    const leaf = (pred) => [...document.querySelectorAll('p,span,div,a')]
      .find(e => e.children.length === 0 && pred((e.innerText || '').trim()));
    const g = (el) => el ? Math.round(el.getBoundingClientRect().y) : null;
    return {
      scrollY: Math.round(scrollY),
      wordmarkVY: g(leaf(t => t.startsWith('WILDYRIFTIANWORKS'))),
      emailVY: g(leaf(t => t === 'EMAIL')),
      seeAllVY: g(leaf(t => t === 'SEE ALL WORKS')),
    };
  });
  await ctx.close();
}
await browser.close();

writeFileSync(`./diff/mcmp-${W}.json`, JSON.stringify(res, null, 1));

const fmt = (v) => v === null || v === undefined ? '            —' :
  typeof v === 'object' ? `${String(v.x).padStart(8)},${String(v.y).padStart(8)} ${String(v.w).padStart(8)}x${String(v.h).padStart(7)}` : String(v);

console.log(`\n=== works-motion 기하 대조  ${W}x${H} ===\n`);
const keys = Object.keys(res.orig).filter(k => k !== 'afterScroll400');
for (const k of keys) {
  const o = res.orig[k], m = res.mine[k];
  if (typeof o === 'number' || typeof m === 'number') {
    const bad = o !== m ? '  <<<' : '';
    console.log(`${k.padEnd(14)} 원본 ${String(o).padStart(8)}   구현 ${String(m).padStart(8)}${bad}`);
    continue;
  }
  let bad = '';
  if (o && m) {
    const d = Math.max(Math.abs(o.x - m.x), Math.abs(o.y - m.y), Math.abs(o.w - m.w), Math.abs(o.h - m.h));
    if (d > 1) bad = `  <<< ${d.toFixed(2)}px`;
  } else if (!!o !== !!m) bad = '  <<< 한쪽 없음';
  console.log(`${k.padEnd(14)} 원본 ${fmt(o)}   구현 ${fmt(m)}${bad}`);
  if (o && m && (o.fs !== m.fs || o.lh !== m.lh)) {
    console.log(`${''.padEnd(14)}      폰트 원본 ${o.fs}/${o.lh}  구현 ${m.fs}/${m.lh}   <<<`);
  }
}
console.log('\n--- scrollY 400 이후 (푸터 고정 레이어면 wordmark/email 이 안 움직인다) ---');
console.log(' 원본', JSON.stringify(res.orig.afterScroll400));
console.log(' 구현', JSON.stringify(res.mine.afterScroll400));
