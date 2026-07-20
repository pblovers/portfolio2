/**
 * 원본 /works  vs  로컬 works.html  기하 대조
 *   node cmp.mjs [width]
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = W >= 1920 ? 1080 : W >= 1440 ? 900 : W >= 1280 ? 800 : W >= 768 ? 1024 : W >= 430 ? 932 : 812;

const ORIG = 'https://www.wildyriftian.com/works';
const MINE = 'file:///D:/이젠아카데미/portfolio2/works.html';

const probe = () => {
  const px = v => Math.round(v * 10) / 10;
  const names = ['motion', 'branding', 'editorial', 'photoworks', 'illustration', '3D tech'];
  const out = {};

  // 제목 (원본은 h1, 내 구현은 .wf-title)
  // 색이 실린 최말단 노드끼리 비교 (원본은 h1 > a 구조)
  // 원본은 데스크톱 h1 / 모바일 h2, 색은 안쪽 앵커에 실린다
  const titleEls = [...document.querySelectorAll('h1, h2, h1 a, h1 span, h2 a, h2 span, .wf-title, .wtab, .wtab-link')]
    .filter(el => el.childElementCount === 0 && el.getBoundingClientRect().width > 0);
  titleEls.forEach(el => {
    const t = el.textContent.trim();
    if (!names.includes(t) && t !== 'Works' && t !== 'Archive') return;
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    out['T:' + t] = {
      xy: [px(r.x), px(r.y + scrollY)],
      size: cs.fontSize, lh: cs.lineHeight, color: cs.color,
      font: cs.fontFamily.split(',')[0].replace(/"/g, '')
    };
  });

  // 폴더 색 박스
  const boxes = [...document.querySelectorAll('*')].map(el => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return { bg: cs.backgroundColor, r, radius: cs.borderRadius };
  }).filter(o => o.r.width > 200 && o.r.height > 100 && o.r.height < 220
    && o.bg !== 'rgba(0, 0, 0, 0)'
    && !/^rgb\(2[45][0-9], 2[45][0-9], 2[45][0-9]\)$/.test(o.bg));
  const seen = new Set();
  boxes.sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x).forEach(o => {
    const k = [px(o.r.x), px(o.r.y + scrollY), px(o.r.width), px(o.r.height)].join(',');
    if (seen.has(k + o.bg)) return; seen.add(k + o.bg);
    out['BOX:' + k.split(',').slice(0, 2).join('/')] = { rect: k, bg: o.bg };
  });

  // 번호 스트립 (높이 40)
  const strips = [...document.querySelectorAll('*')].map(el => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return { bg: cs.backgroundColor, r, radius: cs.borderRadius };
  }).filter(o => o.r.height >= 38 && o.r.height <= 42 && o.r.width > 80
    && o.bg !== 'rgba(0, 0, 0, 0)');
  const sseen = new Set();
  strips.sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x).forEach(o => {
    const k = [px(o.r.x), px(o.r.y + scrollY), px(o.r.width)].join(',');
    if (sseen.has(k + o.bg)) return; sseen.add(k + o.bg);
    out['STRIP:' + px(o.r.y + scrollY) + '/' + px(o.r.x)] = { xw: k, bg: o.bg, radius: o.radius };
  });

  // 썸네일
  // 숨겨진(0크기) 썸네일은 제외 — 원본 모바일은 아예 렌더하지 않는다
  const th = [...document.images].filter(i => /works-|width=500/.test(i.src))
    .map(i => { const r = i.getBoundingClientRect(); return [px(r.x), px(r.y + scrollY), px(r.width)]; })
    .filter(t => t[2] > 0)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  out['THUMBS'] = { n: th.length, xyw: th };

  out['DOC'] = { h: document.body.scrollHeight, bg: getComputedStyle(document.body).backgroundColor,
    hscroll: document.documentElement.scrollWidth > innerWidth, vw: innerWidth };
  return out;
};

const browser = await chromium.launch();
const grab = async (url) => {
  const p = await browser.newPage({ viewport: { width: W, height: H } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(() => {
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    // 유휴 부유 애니메이션 정지 — 좌표를 기준 상태로 고정
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  });
  await p.waitForTimeout(400);
  const r = await p.evaluate(probe);
  await p.close();
  return r;
};

const [a, b] = [await grab(ORIG), await grab(MINE)];
const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();

console.log(`\n########## ${W}px ##########`);
let diff = 0, same = 0;
const TOL = 8; // 부유 애니메이션 진폭 허용치(px)
for (const k of keys) {
  if (k === 'THUMBS') {
    const A = a[k]?.xyw || [], B = b[k]?.xyw || [];
    const bad = [];
    if (A.length !== B.length) bad.push(`개수 ${A.length} vs ${B.length}`);
    for (let i = 0; i < Math.min(A.length, B.length); i++) {
      const d = A[i].map((v, j) => Math.abs(v - B[i][j]));
      if (Math.max(...d) > TOL) bad.push(`#${i} 원본[${A[i]}] 구현[${B[i]}] Δ[${d.map(v => v.toFixed(1))}]`);
    }
    if (!bad.length) { same++; console.log(`[=] THUMBS ${A.length}개 모두 ±${TOL}px 이내`); }
    else { diff++; console.log(`\n[≠] THUMBS\n   ` + bad.join('\n   ')); }
    continue;
  }
  const x = JSON.stringify(a[k] ?? null), y = JSON.stringify(b[k] ?? null);
  if (x === y) { same++; continue; }
  diff++;
  console.log(`\n[≠] ${k}`);
  console.log(`   원본: ${x}`);
  console.log(`   구현: ${y}`);
}
console.log(`\n일치 ${same} / 불일치 ${diff}`);
await browser.close();
