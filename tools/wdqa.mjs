// work-detail 페이지 QA: 가로스크롤·콘솔오류·깨진이미지·see more 크기
import { chromium } from 'playwright';
import { mine } from './root.mjs';
const b = await chromium.launch();
const file = process.argv[2] || 'works/work-flat-earther.html';
for (const [W, H] of [[1920,1080],[1440,900],[1280,800],[1024,768],[810,1080],[768,1024],[430,932],[375,812]]) {
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,80)); });
  p.on('pageerror', e => errs.push('PAGEERR '+String(e).slice(0,80)));
  await p.goto(mine(file), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(700);
  await p.evaluate(() => { try { window.lenis && window.lenis.destroy(); } catch (e) {} });
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    const hScroll = de.scrollWidth - de.clientWidth;
    const broken = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length;
    const prevImg = document.querySelector('.wd-seemore-item img');
    const pr = prevImg ? prevImg.getBoundingClientRect() : null;
    return { hScroll, broken, docH: de.scrollHeight, prev: pr ? {w: Math.round(pr.width), h: Math.round(pr.height)} : null };
  });
  const flag = (r.hScroll > 0 || r.broken > 0 || errs.length) ? '  <-- ISSUE' : '';
  console.log(`${W}x${H}: hScroll=${r.hScroll} broken=${r.broken} docH=${r.docH} prev=${JSON.stringify(r.prev)} errs=${errs.length}${flag}`);
  if (errs.length) console.log('   ', errs.join(' | '));
  await ctx.close();
}
await b.close();
