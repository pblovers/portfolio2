/**
 * 호버 인터랙션 전수 대조 — 원본 vs 구현.
 * 글자로 요소를 찾아 호버 전/후의 위치·색·투명도·변형을 나란히 찍는다.
 *   node hovaudit.mjs <index|works|motion> [width] [height]
 */
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const PAGES = {
  index: ['https://www.wildyriftian.com/', 'index.html'],
  works: ['https://www.wildyriftian.com/works', 'works.html'],
  motion: ['https://www.wildyriftian.com/works-motion', 'works-motion.html'],
};
// 페이지별로 호버해 볼 글자
const TARGETS = {
  index: ['HOME', 'WORKS', 'ABOUT', 'CONTACT', 'VIEW PROJECT', 'SEE ALL WORKS', 'EMAIL', 'INSTAGRAM', 'Motion Design', 'SURD.STUDIO'],
  works: ['HOME', 'WORKS', 'ABOUT', 'CONTACT', 'EMAIL', 'RESUME', 'Motion Design', 'SURD.STUDIO'],
  motion: ['HOME', 'WORKS', 'ABOUT', 'CONTACT', 'SEE ALL WORKS', 'EMAIL', 'LINKEDIN', 'Illustration', 'SURD.STUDIO'],
};

const key = process.argv[2] || 'motion';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const [origUrl, mineFile] = PAGES[key];

const probe = (label) => {
  const norm = (s) => {
    let t = (s || '').replace(/\s+/g, ' ').trim().replace(/^0\d/, '');
    // roll 링크는 글자 복사본이 하나 더 있어 "HOMEHOME" 처럼 잡힌다
    const h = t.length / 2;
    if (t.length % 2 === 0 && t.slice(0, h) === t.slice(h)) t = t.slice(0, h);
    return t;
  };
  const cands = [...document.querySelectorAll('a,button')].filter(e => norm(e.textContent) === label);
  // 같은 글자가 여러 개면 가장 안쪽(글자만 감싼) 것을 쓴다
  const a = cands.sort((x, y) => x.textContent.length - y.textContent.length)[0];
  if (!a) return null;
  const r = a.getBoundingClientRect(), cs = getComputedStyle(a);
  // 글자를 실제로 그리는 최말단 노드
  const leaf = [...a.querySelectorAll('*')].find(e => !e.children.length && norm(e.textContent)) || a;
  const lr = leaf.getBoundingClientRect(), lcs = getComputedStyle(leaf);
  // 배경이 차오르는 요소(::before)는 못 잡으므로 앵커 중앙의 실제 픽셀색을 따로 본다
  return {
    box: [+r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)],
    leaf: [+lr.x.toFixed(1), +lr.y.toFixed(1), +lr.width.toFixed(1)],
    color: lcs.color, opacity: cs.opacity, tf: cs.transform,
    leafTf: lcs.transform, deco: lcs.textDecorationLine, style: lcs.fontStyle,
  };
};

const browser = await chromium.launch();
const results = {};
for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.evaluate(() => document.querySelectorAll('.appear').forEach(e => e.classList.add('in')));
  // 푸터 요소도 만지려면 끝까지 내려야 한다
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(300);
  }
  results[tag] = {};
  for (const label of TARGETS[key]) {
    const before = await p.evaluate(probe, label);
    if (!before) { results[tag][label] = null; continue; }
    await p.mouse.move(before.box[0] + Math.min(20, before.box[2] / 2), before.box[1] + before.box[3] / 2);
    await p.waitForTimeout(800);
    const after = await p.evaluate(probe, label);
    await p.mouse.move(2, 2);
    await p.waitForTimeout(400);
    results[tag][label] = { before, after };
  }
  await ctx.close();
}
await browser.close();

const fmt = (s) => s ? `x${s.leaf[0]} w${s.leaf[2]} ${s.color} op${s.opacity} ${s.tf === 'none' ? '' : s.tf} ${s.deco === 'none' ? '' : s.deco} ${s.style === 'normal' ? '' : s.style}`.trim() : '—';
console.log(`=== ${key} ${W}x${H} 호버 대조 ===`);
for (const label of TARGETS[key]) {
  const o = results.orig[label], m = results.mine[label];
  if (!o && !m) { console.log(`\n[${label}] 양쪽 다 없음`); continue; }
  const changed = (r) => r && JSON.stringify(r.before) !== JSON.stringify(r.after);
  console.log(`\n[${label}]  원본 변화=${changed(o) ? 'O' : 'X'}  구현 변화=${changed(m) ? 'O' : 'X'}`);
  console.log(`  원본 평상 ${fmt(o?.before)}`);
  console.log(`  원본 호버 ${fmt(o?.after)}`);
  console.log(`  구현 평상 ${fmt(m?.before)}`);
  console.log(`  구현 호버 ${fmt(m?.after)}`);
}
