/**
 * 원본 사이트 구조 채집기
 *   node inspect.mjs <url> [outDir]
 * 산출물: outDir/report.json  (섹션 트리 + 연산 스타일 + 에셋 목록 + 폰트)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const url = process.argv[2];
const outDir = resolve(process.argv[3] || './out');
if (!url) { console.error('usage: node inspect.mjs <url> [outDir]'); process.exit(1); }
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 네트워크로 실제 내려온 에셋 기록
const assets = [];
page.on('response', async (res) => {
  const u = res.url();
  const ct = res.headers()['content-type'] || '';
  if (/image|font|video/.test(ct) || /\.(png|jpe?g|webp|avif|svg|gif|woff2?|ttf|otf|mp4|webm)(\?|$)/i.test(u)) {
    assets.push({ url: u, type: ct.split(';')[0], status: res.status() });
  }
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500); // 진입 애니메이션 안정화

const report = await page.evaluate(() => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;

  // 1) 문서 개요
  const doc = {
    title: document.title,
    lang: document.documentElement.lang,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyFontSize: getComputedStyle(document.body).fontSize,
    scrollHeight: document.body.scrollHeight,
    meta: [...document.querySelectorAll('meta[name],meta[property]')]
      .map(m => (m.getAttribute('name') || m.getAttribute('property')) + '=' + m.getAttribute('content'))
  };

  // 2) 최상위 섹션 트리 (2단계까지)
  const walk = (el, depth) => {
    if (depth > 2) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 && r.height === 0) return null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || undefined,
      cls: el.className && typeof el.className === 'string' ? el.className : undefined,
      rect: [px(r.x), px(r.y + scrollY), px(r.width), px(r.height)],
      display: cs.display, position: cs.position, bg: cs.backgroundColor,
      text: (el.childElementCount === 0 ? el.textContent.trim().slice(0, 120) : undefined) || undefined,
      kids: [...el.children].map(c => walk(c, depth + 1)).filter(Boolean)
    };
  };
  const root = document.querySelector('main') || document.body;
  const tree = [...root.children].map(c => walk(c, 0)).filter(Boolean);

  // 3) 타이포그래피 인벤토리 — 실제 쓰인 조합 집계
  const typo = {};
  document.querySelectorAll('*').forEach(el => {
    if (!el.textContent.trim() || el.childElementCount > 0) return;
    const cs = getComputedStyle(el);
    const key = [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.lineHeight, cs.letterSpacing, cs.textTransform, cs.color].join(' | ');
    typo[key] = (typo[key] || 0) + 1;
  });

  // 4) 컬러 인벤토리
  const colors = {};
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    [cs.backgroundColor, cs.color].forEach(c => {
      if (c && c !== 'rgba(0, 0, 0, 0)') colors[c] = (colors[c] || 0) + 1;
    });
  });

  // 5) 이미지 (표시 크기 + 원본 해상도 = 비율 검증용)
  const images = [...document.images].map(i => {
    const r = i.getBoundingClientRect();
    return {
      src: i.currentSrc || i.src,
      shown: [px(r.width), px(r.height)],
      natural: [i.naturalWidth, i.naturalHeight],
      ratio: i.naturalWidth ? Math.round(i.naturalWidth / i.naturalHeight * 1000) / 1000 : null,
      objectFit: getComputedStyle(i).objectFit,
      alt: i.alt
    };
  });

  // 6) 링크
  const links = [...document.querySelectorAll('a')].map(a => ({
    text: a.textContent.trim().slice(0, 60), href: a.getAttribute('href')
  }));

  // 7) 폰트 페이스
  const fonts = [...document.fonts].map(f => ({ family: f.family, weight: f.weight, style: f.style, status: f.status }));

  return { doc, tree, typo, colors, images, links, fonts };
});

report.assets = assets;
writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log('=== ' + report.doc.title + ' ===');
console.log('scrollHeight:', report.doc.scrollHeight, '| body bg:', report.doc.bodyBg);
console.log('\n--- 최상위 섹션 ---');
report.tree.forEach(s => console.log(`  <${s.tag}> .${s.cls || ''}  y=${s.rect[1]} h=${s.rect[3]}  bg=${s.bg}`));
console.log('\n--- 폰트 (' + report.fonts.length + ') ---');
report.fonts.forEach(f => console.log(`  ${f.family} ${f.weight} ${f.style} [${f.status}]`));
console.log('\n--- 타이포 조합 상위 12 ---');
Object.entries(report.typo).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([k, v]) => console.log(`  ${v}x  ${k}`));
console.log('\n--- 컬러 상위 10 ---');
Object.entries(report.colors).sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([k, v]) => console.log(`  ${v}x  ${k}`));
console.log('\n--- 이미지 (' + report.images.length + ') ---');
report.images.forEach(i => console.log(`  ${i.shown.join('x')}  natural=${i.natural.join('x')} ratio=${i.ratio} fit=${i.objectFit}\n      ${i.src}`));
console.log('\n--- 에셋 응답 (' + assets.length + ') ---');
assets.forEach(a => console.log(`  [${a.status}] ${a.type}  ${a.url}`));
console.log('\nreport.json ->', resolve(outDir, 'report.json'));

await browser.close();
