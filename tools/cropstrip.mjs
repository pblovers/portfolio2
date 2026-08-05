/**
 * 폴더탭 스트립 구간만 잘라 저장한다 (원본/구현본).
 *   node cropstrip.mjs <width> <height> [cropHeight] [alignTab]
 *   alignTab: 화면 맨 위에 붙일 탭 번호 ("01" | "02" | "03"), 기본 02
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1997);
const H = Number(process.argv[3] || 900);
const CROP_H = Number(process.argv[4] || 60);
const TAB = process.argv[5] || '02';

const browser = await chromium.launch();
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async (n) => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80));
    }
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const re = new RegExp(`^FEATURED WORK ${n}$`, 'i');
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'start' });
  }, TAB);
  await p.waitForTimeout(600);
  const png = PNG.sync.read(await p.screenshot());
  const out = new PNG({ width: W, height: CROP_H });
  for (let y = 0; y < CROP_H; y++) for (let x = 0; x < W; x++) {
    const i = (png.width * y + x) << 2, o = (W * y + x) << 2;
    out.data[o] = png.data[i]; out.data[o + 1] = png.data[i + 1];
    out.data[o + 2] = png.data[i + 2]; out.data[o + 3] = 255;
  }
  writeFileSync(`./diff/strip-${tag}-${W}-${TAB}.png`, PNG.sync.write(out));
  await ctx.close();
}
await browser.close();
