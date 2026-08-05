/**
 * 원본 work 카드의 DOM 구조 + 제목/설명 폭 + chips 배경색을 채집한다.
 *   node workstruct.mjs <width> <height>
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://www.wildyriftian.com/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(1500);

for (const n of ['01', '02', '03']) {
  await p.evaluate(async (num) => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80));
    }
    const t = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && new RegExp(`^FEATURED WORK ${num}$`, 'i').test(e.textContent.trim()));
    if (t) t.scrollIntoView({ block: 'start' });
  }, n);
  await p.waitForTimeout(600);

  const info = await p.evaluate((num) => {
    const leaf = (re) => [...document.querySelectorAll('*')].find(e => e.children.length === 0 && re.test(e.textContent.trim()));
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    // the card = the sticky ancestor containing this tab
    const tab = leaf(new RegExp(`^FEATURED WORK ${num}$`, 'i'));
    if (!tab) return null;
    let card = tab;
    while (card.parentElement && card.getBoundingClientRect().height < window.innerHeight * 0.8) card = card.parentElement;

    // title = the largest serif text inside the card
    const all = [...card.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim());
    const title = all.filter(e => parseFloat(getComputedStyle(e).fontSize) > 30)
      .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
    const desc = all.find(e => /^A |^FLAVORS/i.test(e.textContent.trim()) && e.textContent.trim().length > 60);
    const chipTxt = all.find(e => /MODELING|MOTION GRAPHIC|COOKBOOK/i.test(e.textContent.trim()));
    // chips background: walk up from chip text to first element with a background color
    let chipBox = chipTxt, chipBg = null;
    for (let i = 0; chipBox && i < 6; i++) {
      const c = getComputedStyle(chipBox).backgroundColor;
      if (c && c !== 'rgba(0, 0, 0, 0)') { chipBg = c; break; }
      chipBox = chipBox.parentElement;
    }
    const cardBg = getComputedStyle(card).backgroundColor;
    // sheet bg: sample the element behind the title
    const behind = document.elementsFromPoint(20, title ? title.getBoundingClientRect().top + 10 : 200)
      .map(e => getComputedStyle(e).backgroundColor).find(c => c && c !== 'rgba(0, 0, 0, 0)');

    // structure dump: title's ancestor chain, and siblings at each level
    const chain = [];
    let el = title;
    for (let i = 0; el && i < 5; i++) {
      const r = el.getBoundingClientRect();
      chain.push({
        depth: i,
        tag: el.tagName,
        w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y),
        children: [...(el.parentElement?.children || [])].map(c => {
          const cr = c.getBoundingClientRect();
          return `${c.tagName}[${Math.round(cr.x)},${Math.round(cr.y)} ${Math.round(cr.width)}x${Math.round(cr.height)}] "${c.textContent.trim().slice(0, 24)}"`;
        }),
      });
      el = el.parentElement;
    }
    return {
      title: { text: title?.textContent.trim().slice(0, 40), ...rect(title) },
      desc: { text: desc?.textContent.trim().slice(0, 30), ...rect(desc) },
      chips: { ...rect(chipBox), bg: chipBg },
      sheetBg: behind, cardBg,
      chain,
    };
  }, n);

  console.log(`\n########## WORK ${n} @ ${W}x${H} ##########`);
  console.log(JSON.stringify(info, null, 1));
}
await browser.close();
