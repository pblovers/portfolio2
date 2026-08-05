/**
 * 원본 work 카드의 DOM 트리를 들여쓰기로 덤프한다 (텍스트/좌표/포지션).
 *   node workdom.mjs <width> <height>
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
    window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80));
  }
});
await p.waitForTimeout(500);

const dump = await p.evaluate(() => {
  // "VIEW PROJECT" 를 품은 카드를 찾는다
  const view = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^VIEW PROJECT$/i.test(e.textContent.trim()));
  if (!view) return 'VIEW PROJECT 못 찾음';
  let card = view;
  while (card.parentElement && card.getBoundingClientRect().height < window.innerHeight * 0.75) card = card.parentElement;

  const lines = [];
  const walk = (el, d) => {
    if (d > 7) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').slice(0, 34);
    lines.push(`${'  '.repeat(d)}${el.tagName}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''} `
      + `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] ${cs.position}/${cs.display}`
      + (own ? `  "${own}"` : ''));
    [...el.children].forEach(c => walk(c, d + 1));
  };
  walk(card, 0);
  return lines.join('\n');
});
console.log(`=== ${W}x${H} ===\n` + dump);
await browser.close();
