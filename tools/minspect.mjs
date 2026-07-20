/**
 * works-motion 원본 실측
 *   node minspect.mjs [width] [height]
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
mkdirSync('./diff', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/works-motion', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2600);

const rep = {};

// 1) 문서/섹션 기본
rep.base = await p.evaluate(() => ({
  docH: document.documentElement.scrollHeight,
  bodyH: document.body.scrollHeight,
  innerH: innerHeight,
  bodyBg: getComputedStyle(document.body).backgroundColor,
}));

// 2) 푸터 위치 결정 구조 — 스택 전체를 본다
rep.footerChain = await p.evaluate(() => {
  const wm = [...document.querySelectorAll('*')].find(
    e => e.children.length === 0 && (e.innerText || '').trim().startsWith('WILDYRIFTIANWORKS'));
  if (!wm) return null;
  const chain = [];
  let el = wm;
  for (let i = 0; i < 8 && el && el !== document.documentElement; i++) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    chain.push({
      tag: el.tagName,
      name: el.getAttribute('data-framer-name'),
      pos: cs.position,
      top: cs.top, bottom: cs.bottom, left: cs.left,
      z: cs.zIndex,
      transform: cs.transform.slice(0, 40),
      bg: cs.backgroundColor,
      h: Math.round(r.height),
      vy: Math.round(r.y),
      docY: Math.round(r.y + scrollY),
    });
    el = el.parentElement;
  }
  return chain;
});

// 3) 스크롤 0 / 중간 / 끝에서 푸터 요소 위치 추적
rep.scrollTrack = {};
for (const sy of [0, 400, 757, 900]) {
  await p.evaluate(v => window.scrollTo(0, v), sy);
  await p.waitForTimeout(500);
  rep.scrollTrack[sy] = await p.evaluate(() => {
    const g = (pred) => {
      const el = [...document.querySelectorAll('p,a,h1,h2,span,div')]
        .find(e => e.children.length === 0 && pred((e.innerText || '').trim()));
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { vy: Math.round(r.y), x: Math.round(r.x), w: Math.round(r.width) };
    };
    const sec = [...document.querySelectorAll('div')]
      .map(d => ({ d, r: d.getBoundingClientRect(), bg: getComputedStyle(d).backgroundColor }))
      .filter(o => o.bg === 'rgb(245, 245, 245)' && o.r.width > 900)[0];
    return {
      scrollY: Math.round(scrollY),
      wordmark: g(t => t.startsWith('WILDYRIFTIANWORKS')),
      copyright: g(t => t.startsWith('© 2025')),
      motionSvc: g(t => t === 'Motion Design'),
      email: g(t => t === 'EMAIL'),
      seeAll: g(t => t.includes('SEE ALL WORKS')),
      whitePanel: sec ? { vy: Math.round(sec.r.y), h: Math.round(sec.r.height), w: Math.round(sec.r.width), x: Math.round(sec.r.x) } : null,
    };
  });
}
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);

// 4) SEE ALL WORKS 링크 정밀 실측
rep.seeAll = await p.evaluate(() => {
  const a = [...document.querySelectorAll('a')].find(x => (x.innerText || '').includes('SEE ALL WORKS'));
  if (!a) return null;
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  const kids = [...a.querySelectorAll('*')].slice(0, 6).map(k => {
    const kr = k.getBoundingClientRect();
    const kc = getComputedStyle(k);
    return { tag: k.tagName, text: (k.innerText || '').slice(0, 20), x: Math.round(kr.x), y: Math.round(kr.y), w: Math.round(kr.width), h: Math.round(kr.height), fs: kc.fontSize, ff: kc.fontFamily.split(',')[0] };
  });
  return {
    x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    fs: cs.fontSize, lh: cs.lineHeight, ff: cs.fontFamily.split(',')[0], color: cs.color,
    display: cs.display, gap: cs.gap, kids,
  };
});

// 5) 구분선 실측 — 패널 안 가로선
rep.divider = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('div,hr,span')].filter(e => {
    const r = e.getBoundingClientRect();
    return r.height <= 3 && r.width > 500 && r.y > 200 && r.y < 300;
  });
  return cands.slice(0, 4).map(e => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return {
      x: Math.round(r.x), y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: r.height,
      bt: cs.borderTop, bg: cs.backgroundColor, bi: cs.backgroundImage.slice(0, 80),
    };
  });
});

// 6) 패널/탭/카드 기하
rep.geo = await p.evaluate(() => {
  const out = {};
  const white = [...document.querySelectorAll('div')]
    .map(d => ({ d, r: d.getBoundingClientRect(), cs: getComputedStyle(d) }))
    .filter(o => o.cs.backgroundColor === 'rgb(245, 245, 245)' && o.r.width > 300);
  out.whiteBoxes = white.slice(0, 5).map(o => ({
    x: Math.round(o.r.x * 100) / 100, y: Math.round(o.r.y * 100) / 100,
    w: Math.round(o.r.width * 100) / 100, h: Math.round(o.r.height * 100) / 100,
    radius: o.cs.borderRadius,
  }));
  const title = [...document.querySelectorAll('h1,h2,p,span,div')]
    .find(e => e.children.length === 0 && (e.innerText || '').trim() === 'motion');
  if (title) {
    const r = title.getBoundingClientRect(); const cs = getComputedStyle(title);
    out.title = { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width), h: Math.round(r.height), fs: cs.fontSize, lh: cs.lineHeight, ff: cs.fontFamily.split(',')[0], color: cs.color };
  }
  const num = [...document.querySelectorAll('p,span,div')]
    .find(e => e.children.length === 0 && (e.innerText || '').trim() === '01' && e.getBoundingClientRect().y < 130);
  if (num) {
    const r = num.getBoundingClientRect(); const cs = getComputedStyle(num);
    out.num01 = { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, fs: cs.fontSize, lh: cs.lineHeight };
  }
  out.cards = [...document.querySelectorAll('img')].filter(i => {
    const r = i.getBoundingClientRect();
    return r.width > 200 && r.y > 200 && r.y < 600;
  }).map(i => {
    const r = i.getBoundingClientRect();
    return { src: (i.currentSrc || i.src).split('/').pop().split('?')[0].slice(0, 30), x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 };
  });
  const vid = document.querySelector('video');
  if (vid) {
    const r = vid.getBoundingClientRect();
    out.video = { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100, src: vid.currentSrc || vid.src };
  }
  return out;
});

// 7) 카드 번호·제목
rep.cardText = await p.evaluate(() => {
  const pick = (t) => {
    const el = [...document.querySelectorAll('p,span,div,a')]
      .find(e => e.children.length === 0 && (e.innerText || '').trim().toUpperCase().startsWith(t));
    if (!el) return null;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width), fs: cs.fontSize, lh: cs.lineHeight, color: cs.color, ff: cs.fontFamily.split(',')[0] };
  };
  return { overbloom: pick('OVERBLOOM'), inbetween: pick('IN BETWEEN'), scad: pick('SCAD STARTUP') };
});

writeFileSync(`./diff/minspect-${W}.json`, JSON.stringify(rep, null, 1));
console.log(JSON.stringify(rep, null, 1));
await browser.close();
