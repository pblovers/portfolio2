/**
 * 스크롤 끝 화면에서 세로로 색을 훑어 '이음매(seam)'가 있는지 본다.
 * 원본은 푸터 위아래가 한 색이라 이음매가 없어야 한다.
 *   node footcol.mjs <index|works|motion|branding|detail> <w>x<h> ...
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mine } from './root.mjs';

const PAGES = {
  index:    ['https://www.wildyriftian.com/',               'index.html'],
  works:    ['https://www.wildyriftian.com/works',          'works.html'],
  motion:   ['https://www.wildyriftian.com/works-motion',   'works-motion.html'],
  branding: ['https://www.wildyriftian.com/works-branding', 'works-branding.html'],
  detail:   ['https://www.wildyriftian.com/works/overbloom','work-overbloom.html'],
};
const key = process.argv[2] || 'index';
const vps = (process.argv.slice(3).length ? process.argv.slice(3) : ['1024x900'])
  .map(s => s.split('x').map(Number));
const [origUrl, mineFile] = PAGES[key];

const browser = await chromium.launch();
for (const [W, H] of vps) {
  console.log(`\n===== ${key} ${W}x${H} =====`);
  for (const [tag, url] of [['orig', origUrl], ['mine', mine(mineFile)]]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await p.waitForTimeout(1800);
    for (let i = 0; i < 6; i++) {
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(300);
    }
    await p.waitForTimeout(600);
    const buf = await p.screenshot();
    const png = PNG.sync.read(buf);
    // 좌측 8px(글자 없는 여백)에서 세로로 훑는다
    const x = 8;
    const col = [];
    for (let y = 0; y < png.height; y++) {
      const i = (png.width * y + x) << 2;
      col.push(`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`);
    }
    // 색이 바뀌는 지점만 출력
    const runs = [];
    let s = 0;
    for (let y = 1; y <= col.length; y++) {
      if (y === col.length || col[y] !== col[s]) { runs.push(`y${s}-${y - 1}:${col[s]}`); s = y; }
    }
    console.log(`${tag}: ${runs.join('  ')}`);
    await ctx.close();
  }
}
await browser.close();
