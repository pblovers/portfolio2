/**
 * 태블릿 / 모바일 오류 검증
 *   node mobqa.mjs
 */
import { chromium } from 'playwright';

const PAGES = [
  ['index', 'file:///D:/이젠아카데미/portfolio2/index.html'],
  ['works', 'file:///D:/이젠아카데미/portfolio2/works.html'],
  ['motion', 'file:///D:/이젠아카데미/portfolio2/works-motion.html']
];
// 경계값 포함 (1280 은 데스크톱, 1279 부터 적층 레이아웃)
const SIZES = [
  [1279, 800], [1024, 768], [900, 1200], [820, 1180], [810, 1080],
  [768, 1024], [600, 900], [430, 932], [414, 896], [390, 844],
  [375, 812], [360, 740], [320, 568]
];

const browser = await chromium.launch();
let problems = 0;

for (const [name, url] of PAGES) {
  console.log(`\n############ ${name} ############`);
  for (const [W, H] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      isMobile: W <= 430, hasTouch: W <= 430,
      deviceScaleFactor: 1
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('JS:' + e.message.slice(0, 60)));
    page.on('console', m => { if (m.type() === 'error') errs.push('CON:' + m.text().slice(0, 60)); });
    page.on('requestfailed', r => errs.push('REQ:' + r.url().split('/').pop()));

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1400);
    // 스크롤로 lazy/appear 유발
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 90));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    });
    await page.waitForTimeout(500);

    const r = await page.evaluate(() => {
      const vw = innerWidth;
      const out = { hscroll: document.documentElement.scrollWidth > vw + 1, over: [], broken: [], tiny: [], docH: document.body.scrollHeight };

      // 뷰포트 밖으로 삐져나온 "보이는" 요소
      document.querySelectorAll('body *').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
        // 의도적으로 잘리는 컨테이너 안은 제외
        let p = el.parentElement, clipped = false;
        while (p) { const pc = getComputedStyle(p); if (pc.overflow !== 'visible') { clipped = true; break; } p = p.parentElement; }
        if (clipped) return;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        if (b.right > vw + 1 || b.left < -1) {
          out.over.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] || '-'} [${Math.round(b.left)}..${Math.round(b.right)}]`);
        }
      });

      // 깨진 이미지
      [...document.images].forEach(i => {
        if (!i.complete || i.naturalWidth === 0) out.broken.push(i.getAttribute('src'));
      });

      // 터치 타깃이 너무 작은 링크/버튼 (24px 미만)
      document.querySelectorAll('a,button').forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) return;
        if (b.height < 20 || b.width < 20) out.tiny.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 12)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
      });
      return out;
    });

    // 메뉴 오버레이 동작 (모바일 헤더)
    let menu = 'n/a';
    if (W <= 1279) {
      menu = await page.evaluate(() => {
        const btn = document.querySelector('.menu-btn'), ov = document.getElementById('menuOverlay');
        if (!btn || !ov) return '요소없음';
        btn.click();
        const opened = ov.classList.contains('open');
        const close = document.querySelector('.menu-close');
        close.click();
        const closed = !ov.classList.contains('open') && document.body.style.overflow === '';
        return (opened && closed) ? 'OK' : `열림${opened}/닫힘${closed}`;
      });
    }

    const bad = r.hscroll || r.over.length || r.broken.length || errs.length || (menu !== 'OK' && menu !== 'n/a');
    if (bad) problems++;
    const mark = bad ? '[문제]' : '[정상]';
    console.log(`${mark} ${String(W).padStart(4)}x${H}  h=${String(r.docH).padStart(5)}  가로스크롤=${r.hscroll}  넘침=${r.over.length}  깨짐=${r.broken.length}  메뉴=${menu}  오류=${errs.length}`);
    if (r.over.length) r.over.slice(0, 4).forEach(s => console.log('        넘침: ' + s));
    if (r.broken.length) console.log('        깨짐: ' + r.broken.slice(0, 3).join(', '));
    if (errs.length) errs.slice(0, 3).forEach(s => console.log('        ' + s));
    if (r.tiny.length) console.log('        작은 타깃 ' + r.tiny.length + '개: ' + r.tiny.slice(0, 3).join(' | '));

    await ctx.close();
  }
}
console.log(`\n===== 문제 있는 조합: ${problems}개 =====`);
await browser.close();
