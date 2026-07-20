/**
 * 뷰포트별 전체 페이지 캡처
 *   node shoot.mjs <url> <outDir> <prefix> [widths]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , url, outArg, prefix = 'shot', widthsArg] = process.argv;
if (!url) { console.error('usage: node shoot.mjs <url> <outDir> <prefix> [w,w,w]'); process.exit(1); }
const outDir = resolve(outArg || './shots');
mkdirSync(outDir, { recursive: true });

const widths = (widthsArg || '1920,1440,1280,768,430,375').split(',').map(Number);
const heightFor = (w) => (w >= 1920 ? 1080 : w >= 1440 ? 900 : w >= 1280 ? 800 : w >= 768 ? 1024 : w >= 430 ? 932 : 812);

const browser = await chromium.launch();

for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: heightFor(w) },
    deviceScaleFactor: 1,
    isMobile: w <= 430,
    hasTouch: w <= 430
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // lazy-load 유발: 페이지 끝까지 훑고 복귀
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 600));
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => ({
    h: document.body.scrollHeight,
    bg: getComputedStyle(document.body).backgroundColor,
    imgs: document.images.length,
    broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).length,
    hscroll: document.documentElement.scrollWidth > innerWidth
  }));

  const file = resolve(outDir, `${prefix}-${w}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${w}px  h=${info.h}  bg=${info.bg}  img=${info.imgs}(broken ${info.broken})  hscroll=${info.hscroll}  -> ${prefix}-${w}.png`);
  await ctx.close();
}

await browser.close();
