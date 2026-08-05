/**
 * Archive(3D 캐러셀) 섹션 대조 캡처
 *   node arcshot.mjs [widths]
 *
 * 원본  : https://interesting-studies-473096.framer.app/  (뷰포트 전체가 컴포넌트)
 * 구현본: http://localhost:8080/index.html 의 #archive 섹션 (스크롤해 상단에 맞춘다)
 *
 * 두 쪽 다 인트로(카드 딜링)가 끝나고 회전이 감쇠로 멈출 때까지 기다린 뒤 찍는다.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ORIG = 'https://interesting-studies-473096.framer.app/';
const MINE = 'http://localhost:8080/index.html';

const widths = (process.argv[2] || '1920,1440,1280,768,430,375').split(',').map(Number);
const heightFor = (w) => (w >= 1920 ? 1080 : w >= 1440 ? 900 : w >= 1280 ? 800 : w >= 768 ? 1024 : w >= 430 ? 932 : 812);

const outDir = resolve('./diff/arc');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

const SETTLE = 9000;   // 인트로 딜링 + 감쇠가 멎는 시간

for (const w of widths) {
  const h = heightFor(w);

  /* ---- 원본 ---- */
  if (!process.argv.includes('--mine')) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(ORIG, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(SETTLE);
    // Framer 배지·에디터 버튼은 대조에 방해되므로 숨긴다
    await page.evaluate(() => {
      ['#__framer-badge-container', '#__framer-editorbar-container', '#__framer-editorbar']
        .forEach(s => { const el = document.querySelector(s); if (el) el.style.display = 'none'; });
    });
    await page.screenshot({ path: `${outDir}/orig-${w}.png`, timeout: 120000 });
    await ctx.close();
  }

  /* ---- 구현본 ---- */
  {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: w <= 430,
      hasTouch: w <= 430
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    // networkidle 은 못 쓴다 — logo3d 의 배경 영상이 계속 스트리밍돼 idle 이 안 온다
    await page.goto(MINE, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const top = document.querySelector('#archive').getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top);
    });
    await page.waitForTimeout(SETTLE);
    /* 인트로·감쇠는 프레임 단위라 SwiftShader(소프트웨어 GL)에서는 시간만으로
       같은 상태가 안 된다 — 종료 상태로 맞춘 뒤 몇 프레임 그리고 찍는다. */
    await page.evaluate(() => {
      const m = document.querySelector('.js-carousel3d');
      if (m && m.__arc) m.__arc.settle();
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${outDir}/mine-${w}.png`, timeout: 120000 });
    const info = await page.evaluate(() => {
      const s = document.querySelector('#archive');
      const c = s.querySelector('canvas');
      const m = s.querySelector('.js-carousel3d');
      const cam = m && m.__arc ? m.__arc.camera : null;
      return {
        camZ: cam ? Math.round(cam.position.z * 100) / 100 : null,
        camY: cam ? Math.round(cam.position.y * 100) / 100 : null,
        sectionTop: Math.round(s.getBoundingClientRect().top),
        section: [Math.round(s.getBoundingClientRect().width), Math.round(s.getBoundingClientRect().height)],
        canvas: c ? [c.width, c.height] : null,
        overflowX: document.documentElement.scrollWidth > window.innerWidth
          ? document.documentElement.scrollWidth - window.innerWidth : 0
      };
    });
    console.log(w, JSON.stringify(info), errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no console errors');
    await ctx.close();
  }
}

await browser.close();
console.log('saved →', outDir);
