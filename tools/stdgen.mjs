// 표준 그룹 상세 생성기 (템플릿 B)
// stddata-<slug>.json(블록 URL·기하) + CONFIG(메타·문단·see-more) → work-<slug>.html + 미디어 다운로드
// 사용: node stdgen.mjs <slug>
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';

// works.html 폴더 썸네일(메뉴 오버레이) — 콘텐츠에서 제외할 프레이머 ID
const MENU_IDS = ['kdtaSoSqsA8c0LoPR41LBZhANd0','GBw25Y7waKtBpPp2XCduaT1w','KyoqSAiCkNLT4HUotbCnZyTLgro','4cJcdjNdNSgkSBge2lq4THrz4','fsrZLkxLD4fRbDoXCcY0l7KeyCY','dwm3ehifOvGqOxQmDOF3Al7PuI'];

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const CONFIG = {
  'dipsco-brand-identity': {
    title: 'DIPSCO Brand Identity', category: 'Branding Works', year: '2022',
    back: 'SEE ALL BRANDING WORKS', backHref: 'works-branding.html',
    desc: 'A branding project for a trendy hummus brand celebrated for its natural ingredients and bold retro-inspired design.',
    paras: [
      'Dipsco, the trendy hummus sensation founded in 2022, prides itself on crafting homemade goodness.',
      "Made from 100% natural ingredients and without any artificial preservatives, Dipsco's hummus offers a pure and flavorful indulgence that stands out in the crowded market.",
      "This branding style draws heavy inspiration from vintage retro illustrations, perfectly complementing the brand's trendy, youthful, and approachable vibe.",
      'Vibrant colors are employed to enhance the branding identity, ensuring it stands out boldly. The use of jagged strokes in each design element further reinforces the retro concept, creating a cohesive and visually captivating aesthetic.',
    ],
    credits: null, hero: null,
    seemore: [
      { href: 'work-comotion-2025-branding.html', img: 'images/branding-02-comotion-2025-branding.jpg', title: 'CoMotion 2025 Branding' },
      { href: 'work-scad-startup-2026-motion.html', img: 'images/motion-03-scad-startup-2026.png', title: 'SCAD StartUp 2026 - Design for Human Connection' },
    ],
  },

  'venturi-3d-sneaker-product-visualization': {
    title: 'Venturi: 3D Sneaker Product Visualization', category: '3D Tech Works', year: '2025',
    back: 'SEE ALL 3D TECH WORKS', backHref: 'works-3d-tech.html',
    desc: 'A 3D visualization of the futuristic Venturi sneaker series, created through detailed modeling, texturing, and cinematic product rendering.',
    paras: [
      "The Venturi Series is a conceptual collection of 5 futuristic sneaker designs created for a fashion film project. I was responsible for translating the footwear concepts into detailed 3D models, crafting all textures and materials, and producing high-end product renders showcasing each shoe's unique form and sculptural sole design.",
      'Each model was crafted with attention to material realism and form, emphasizing sleek contours, layered fabrics, and reflective finishes that highlight the shoes’ innovative design language. The goal was to bring the collection’s futuristic aesthetic to life through precise lighting, shading, and cinematic product renders.',
    ],
    credits: ['Sneaker Design by Tomoki Scharber', 'Simulated Sequences by Davis Hardy', 'Fashion Film Directed by Seamus O’Connor', 'Tools: Autodesk Maya, Cinema 4D, Redshift, Adobe Substance Painter'],
    hero: null,   // stddata.hero (YouTube) 자동 사용
    seemore: [
      { href: 'work-hong-kong-eatery-3d-look-development-study.html', img: 'images/3dtech-02-hong-kong-eatery-3d-look-dev.webp', title: 'Hong Kong Eatery: 3D Look Development Study' },
    ],
  },

  'a-trip-for-a-better-earth-interactive-children-s-book': {
    title: "A Trip for a Better Earth Interactive Children's Book", category: 'Illustration Works', year: '2020',
    back: 'SEE ALL ILLUSTRATION WORKS', backHref: 'works-illustration.html',
    desc: 'A children’s interactive e-book following Hana on a summer world journey, tackling environmental issues and animal welfare to inspire the next generation to create a better Earth.',
    paras: [
      'The environmental conditions on Earth are deteriorating, so I worked on a children’s book about the environment with the aim of raising awareness of this issue for the next generation.',
      'The story of this book focuses on a summer world journey with Hana (the protagonist). During the journey, she encounters many environmental issues affecting the lives of animals. At the end of the story, Hana decides to do something for a better Earth.',
      'Information about the environment and animal welfare can be studied through interactive elements installed on the pages. To demonstrate interactive movement, the book was created as an e-book that can be accessed on tablets or computers.',
    ],
    credits: null, hero: null,
    seemore: [
      { href: 'work-flavors-of-indonesia.html', img: 'images/illustration-02-flavors-of-indonesia-illustr.webp', title: 'Flavors of Indonesia Illustrated Cookbook' },
      { href: 'work-earthbound-typeface-design.html', img: 'images/editorial-03-earthbound-typeface-design.webp', title: 'Earthbound Typeface Design' },
    ],
  },

  'wldr-a-photo-archive-photobook': {
    title: 'wldr : a photo archive [photobook]', category: 'Editorial Works', year: '2024',
    back: 'SEE ALL EDITORIAL WORKS', backHref: 'works-editorial.html',
    desc: 'a zine showcasing my journey in portraits and fashion photography, featuring curated editorial works that reflect my artistic vision and growth.',
    paras: [
      "In the realm of visual arts, my photographic journey transitioned from a mere hobby to a professional pursuit. I crafted 'wldr: a photo archive,' a zine spotlighting my works, particularly in portraits and fashion photography—two genres that deeply captivate me. This publication acts as a curated exhibit, chronicling my photographic exploration over the years.",
      'With 18 distinctive sections, the zine features editorial photoshoots from 2017 to my latest works, each embodying a unique thematic concept and aesthetic. Deliberately curated visual narratives within this zine reflect my artistic vision. As both creative director and photographer, I intertwine diverse skills, showcasing technical prowess and conceptual depth.',
      "Through 'wldr: a photo archive,' my goal is to exhibit my varied skills as a photographer, acting as a testament to my dedication and illustrating the evolution of my craft and artistic expression in visual storytelling.",
    ],
    credits: null, hero: null,
    seemore: [
      { href: 'work-hues-of-harmony-love-s-journey-in-rajasthan-photobook.html', img: 'images/editorial-02-hues-of-harmony-love-s-journ.jpg', title: "Hues of Harmony: Love's Journey in Rajasthan Photobook" },
      { href: 'work-trybreathing-brand-identity.html', img: 'images/branding-05-trybreathing-brand-identity.png', title: 'TryBreathing Brand Identity' },
    ],
  },
};

async function download(url, dest) {
  if (existsSync(dest)) return 'skip';
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return `${(buf.length/1024).toFixed(0)}KB`;
}

const slug = process.argv[2];
if (!slug || !CONFIG[slug]) { console.error('need known slug'); process.exit(1); }
const cfg = CONFIG[slug];
const data = JSON.parse(readFileSync(join(ROOT, 'tools', `stddata-${slug}.json`), 'utf8'));

// 콘텐츠 블록: 메뉴 썸네일 제외, x<720 (좌측 메타 제외는 x>=350)
const idOf = (u) => (u.split('/').pop().split('?')[0].split('.')[0]);
const blocks = data.blocks.filter(b => b.x >= 350 && b.x < 720 && !MENU_IDS.includes(idOf(b.src)));
// 텍스트 섹션 y: 우측 텍스트 중 푸터 문자열 제외한 첫 것 (문단/크레딧 모두 포함)
const FOOTER = /^(INSTAGRAM|LINKEDIN|RESUME|WEBSITE BY|SURD\.STUDIO|EMAIL|©|©)/i;
const textYs = data.rtext.filter(t => t.x >= 350 && !FOOTER.test(t.txt)).map(t => t.y);
const firstParaY = textYs.length ? Math.min(...textYs) : Infinity;
const hasText = (cfg.paras && cfg.paras.length) || (cfg.credits && cfg.credits.length);
const hero = cfg.hero || (data.hero && data.hero.src) || null;

const worksImg = join(ROOT, 'images', 'works');
const worksVid = join(ROOT, 'videos', 'works');
if (!existsSync(worksVid)) mkdirSync(worksVid, { recursive: true });

// 다운로드 + 블록 메타
const items = [];
let n = 0;
console.log(`== ${slug} : ${blocks.length} content blocks, firstParaY=${firstParaY} ==`);
for (const b of blocks) {
  n++;
  const nn = String(n).padStart(2, '0');
  const isVid = b.t === 'video';
  const ext = isVid ? 'mp4' : (b.src.split('?')[0].match(/\.(\w+)$/)?.[1] || 'webp');
  const dest = join(isVid ? worksVid : worksImg, `${slug}-${nn}.${ext}`);
  const rel = `${isVid ? 'videos' : 'images'}/works/${slug}-${nn}.${ext}`;
  try { const r = await download(b.src, dest); console.log(`  ${nn} ${b.t} ${b.w}x${b.h} x${b.x} ${r}`); }
  catch (e) { console.log(`  ${nn} FAIL ${e.message}`); }
  // 소스 원본 크기(비율): URL width/height 우선, 없으면 표시 크기
  const w = +(b.src.match(/[?&]width=(\d+)/)?.[1]) || b.w;
  const h = +(b.src.match(/[?&]height=(\d+)/)?.[1]) || b.h;
  items.push({ t: b.t, rel, w, h, x: b.x, y: b.y, bh: b.h, center: b.x > 500 });
}

// 텍스트 섹션 삽입 위치: 블록 사이 **첫 큰 간격**(>150) 앞. 스크랩 텍스트 y 는
// 긴 문단(>200자)을 놓쳐 못 믿으므로, 텍스트가 들어앉는 큰 공백으로 위치를 잡는다.
let insertAfter = -1;
for (let i = 0; i < items.length - 1; i++) {
  const gap = items[i + 1].y - (items[i].y + items[i].bh);
  if (gap > 150) { insertAfter = i; break; }
}

// center 블록 표시폭% (콘텐츠 1032 대비). 표시 픽셀폭(stddata block.w)으로 계산.
items.forEach(it => {
  const bb = data.blocks.find(b => b.y === it.y && Math.round(b.h) === it.bh);
  it.pct = it.center ? Math.round(((bb ? bb.w : it.w) / 1032) * 1000) / 10 : null;
});

function blockHtml(it) {
  const cls = 'std-block' + (it.center ? ' std-center' : '');
  const st = it.center ? ` style="--w:${it.pct}%"` : '';
  if (it.t === 'video')
    return `        <div class="${cls}"${st}><video src="${it.rel}" width="${it.w}" height="${it.h}" loop muted playsinline preload="none"></video></div>`;
  return `        <div class="${cls}"${st}><img src="${it.rel}" width="${it.w}" height="${it.h}" alt="${esc(cfg.title)}"></div>`;
}

let blocksHtml = '';
if (hero) blocksHtml += `        <div class="std-block std-hero"><iframe src="${hero}" allow="autoplay; fullscreen; picture-in-picture" title="${esc(cfg.title)}"></iframe></div>\n`;
const emitText = () => {
  const paras = (cfg.paras || []).map(p => `          <p class="std-para">${esc(p)}</p>`).join('\n');
  const credits = (cfg.credits && cfg.credits.length) ? `${paras ? '\n' : ''}          <p class="std-credit">${cfg.credits.map(c => `<span>${esc(c)}</span>`).join('')}</p>` : '';
  return `        <div class="std-block std-text">\n${paras}${credits}\n        </div>\n`;
};
items.forEach((it, i) => {
  blocksHtml += blockHtml(it) + '\n';
  if (hasText && i === insertAfter) blocksHtml += emitText();
});

const seemoreHtml = cfg.seemore.map(s =>
  `        <a class="wd-seemore-item" href="${s.href}">\n          <img src="${s.img}" alt="${esc(s.title)}">\n          <span>${esc(s.title)}</span>\n        </a>`
).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(cfg.title)} - Wildy Riftian</title>
  <meta name="description" content="${esc(cfg.title)} — ${esc(cfg.category)} by Wildy Riftian.">
  <meta property="og:title" content="${esc(cfg.title)} - Wildy Riftian">
  <meta property="og:image" content="images/og-image.jpg">
  <link rel="icon" href="images/favicon.png">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/work-detail.css">
  <link rel="stylesheet" href="css/work-detail-std.css">
</head>
<body id="top" class="wd-page">

  <header class="site-header">
    <nav class="header-nav" aria-label="Main">
      <a class="nav-link roll" href="index.html"><span class="roll-box"><span>HOME</span><span aria-hidden="true">HOME</span></span></a>
      <a class="nav-link roll" href="works.html"><span class="roll-box"><span>WORKS</span><span aria-hidden="true">WORKS</span></span></a>
      <a class="nav-link roll" href="index.html#about"><span class="roll-box"><span>ABOUT</span><span aria-hidden="true">ABOUT</span></span></a>
      <a class="nav-link roll nav-right" href="index.html#footer"><span class="roll-box"><span>CONTACT</span><span aria-hidden="true">CONTACT</span></span></a>
    </nav>
    <div class="header-mobile">
      <a class="header-logo" href="index.html">WILDYRIFTIAN</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menuOverlay">MENU</button>
    </div>
  </header>

  <div class="menu-overlay" id="menuOverlay" aria-hidden="true">
    <div class="menu-head">
      <a class="header-logo" href="index.html">WILDYRIFTIAN</a>
      <button class="menu-close" type="button">CLOSE</button>
    </div>
    <nav class="menu-nav" aria-label="Menu">
      <a href="index.html">Home</a>
      <a href="works.html">Works</a>
      <a href="works.html#archive">Archive</a>
      <a href="index.html#about">About</a>
      <a href="index.html#footer">Contact</a>
    </nav>
    <p class="menu-foot">MENU</p>
  </div>

  <main class="wd-main">
   <div class="wd-scroll">
    <div class="std-layout">
      <!-- 좌측 sticky 메타 (back 포함 — 전체가 sticky, 스크롤해도 고정) -->
      <aside class="std-meta">
        <a class="wd-back" href="${cfg.backHref}"><span class="arr" aria-hidden="true">&lt;-</span><span class="arr-txt">${esc(cfg.back)}</span></a>
        <h1 class="std-title">${esc(cfg.title)}</h1>
        <p class="std-cat">${esc(cfg.category)}</p>
        <p class="std-year">${esc(cfg.year)}</p>
        <p class="std-desc">${esc(cfg.desc)}</p>
      </aside>

      <div class="std-content">
${blocksHtml.replace(/\n$/, '')}
      </div>
    </div>

    <section class="wd-seemore">
      <h2 class="wd-seemore-title">see more.</h2>
      <div class="wd-seemore-list">
${seemoreHtml}
      </div>
    </section>
   </div>

    <div class="wd-spacer" aria-hidden="true"></div>

    <footer class="footer" id="footer">
      <nav class="services" aria-label="Disciplines">
        <a href="works-motion.html"><sup>01</sup>Motion Design</a>
        <a href="works-branding.html"><sup>02</sup>Brand Design</a>
        <a href="works-editorial.html"><sup>03</sup>Editorial Design</a>
        <a href="works-photoworks.html"><sup>04</sup>Photography</a>
        <a href="works-illustration.html"><sup>05</sup>Illustration</a>
        <a href="works-3d-tech.html"><sup>06</sup>3D Tech</a>
      </nav>

      <div class="keychain footer-keychain" aria-hidden="true">
        <div class="kc-layer kc-padlock"><img src="images/keychain-00-padlock.png" alt=""></div>
        <div class="kc-layer kc-illustration"><img src="images/keychain-05-illustration.png" alt=""></div>
        <div class="kc-layer kc-photoworks"><img src="images/keychain-04-photoworks.png" alt=""></div>
        <div class="kc-layer kc-editorial"><img src="images/keychain-03-editorial.png" alt=""></div>
        <div class="kc-layer kc-branding"><img src="images/keychain-02-branding.png" alt=""></div>
        <div class="kc-layer kc-motion"><img src="images/keychain-01-motion.png" alt=""></div>
      </div>

      <div class="footer-links">
        <a class="roll" href="mailto:wildyriftian@gmail.com"><span class="roll-box"><span>EMAIL</span><span aria-hidden="true">EMAIL</span></span></a>
        <a class="roll" href="https://www.instagram.com/wildyriftian/" target="_blank" rel="noopener"><span class="roll-box"><span>INSTAGRAM</span><span aria-hidden="true">INSTAGRAM</span></span></a>
        <a class="roll" href="https://www.linkedin.com/in/wildy-riftian" target="_blank" rel="noopener"><span class="roll-box"><span>LINKEDIN</span><span aria-hidden="true">LINKEDIN</span></span></a>
        <a class="roll" href="https://drive.google.com/file/d/1HiKpidWsvFJH0V6Rod-6GuOZczbI0Phj/view?usp=drive_link" target="_blank" rel="noopener"><span class="roll-box"><span>RESUME</span><span aria-hidden="true">RESUME</span></span></a>
      </div>

      <p class="wordmark" aria-hidden="true">WILDYRIFTIANWORKS</p>

      <div class="footer-bottom">
        <p class="copyright">&copy; 2025 WILDY RIFTIAN</p>
        <p class="credit">WEBSITE BY <a href="https://surd.studio/" target="_blank" rel="noopener">SURD.STUDIO</a></p>
      </div>
    </footer>
  </main>

  <script src="js/lenis.min.js"></script>
  <script src="js/common.js"></script>
</body>
</html>
`;
writeFileSync(join(ROOT, `work-${slug}.html`), html);
console.log(`-> work-${slug}.html (blocks ${items.length}${cfg.hero?'+hero':''}, text after #${insertAfter+1}, see-more ${cfg.seemore.length})`);
