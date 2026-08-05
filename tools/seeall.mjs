/**
 * work-1 이 활성인 상태(탭 02/03 이 아직 안 덮은 상태)에서 SEE ALL 바의
 * 왼쪽 변 프로파일과 글자 위치를 잰다. 이때가 바 자체 모양이 드러나는 유일한 구간이다.
 *   node seeall.mjs <width> <height>
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mine } from './root.mjs';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
for (const [tag, url] of [['orig', 'https://www.wildyriftian.com/'], ['mine', mine('index.html')]]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(1500);
  // FEATURED WORK 01 글자를 y=120 으로 → 카드1 이 막 올라온 상태
  const info = await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80));
    }
    document.querySelectorAll('.appear').forEach(e => e.classList.add('in'));
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
    const find = (re) => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent.trim()));
    let t = find(/^FEATURED WORK 01$/i);
    if (t) t.scrollIntoView({ block: 'start' });
    await new Promise(r => setTimeout(r, 250));
    for (let i = 0; i < 16; i++) {
      t = find(/^FEATURED WORK 01$/i); if (!t) break;
      const d = t.getBoundingClientRect().top - 120;
      if (Math.abs(d) < 0.6) break;
      window.scrollBy({ top: d, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 60));
    }
    const sa = find(/^SEE ALL WORKS$/i);
    const r = sa && sa.getBoundingClientRect();
    return { textX: r ? Math.round(r.x) : null, textY: r ? Math.round(r.y) : null };
  });
  await p.waitForTimeout(500);
  const png = PNG.sync.read(await p.screenshot());
  const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
  const isDark = (x, y) => { const [r, g, b] = at(x, y); return r < 80 && g < 80 && b < 80; };

  console.log(`\n=== ${tag} @ ${W}x${H} ===  SEE ALL 글자 x=${info.textX} y=${info.textY}`);
  const prof = [];
  for (let y = 110; y <= 155; y++) {
    let dl = -1;
    for (let x = Math.round(W * 0.5); x < W; x++) if (isDark(x, y)) { dl = x; break; }
    prof.push(`${y}:${dl}`);
  }
  console.log('  검은바 왼끝: ' + prof.join(' '));
  await ctx.close();
}
await browser.close();
