// photoworks 상세 페이지 생성기
// - pwdata.json(원본 스크랩: year/desc/gallery/seemore) + META(제목/모델) 사용
// - 갤러리 이미지 다운로드 → images/works/<slug>-NN.<ext>
// - flat-earther 템플릿으로 work-<slug>.html 생성
// 사용: node pwgen.mjs            (flat-earther 제외 17개)
//       node pwgen.mjs speed-limit  (특정 slug만)
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'tools', 'pwdata.json'), 'utf8'));

// 카테고리 페이지에서 확보한 번호·제목·모델·썸네일확장자
const META = {
  'flat-earther':            { n: '01', title: 'Flat Earther',            model: 'KIM DAESEOP',            thumb: 'jpg' },
  'a-deeper-dreamscape':     { n: '02', title: 'A Deeper Dreamscape',     model: 'ADAM ZAKI',              thumb: 'jpg' },
  'speed-limit':             { n: '03', title: 'Speed Limit',             model: 'Cheri',                  thumb: 'jpeg' },
  'faux-leather-safari':     { n: '04', title: 'Faux Leather & Safari',   model: 'Serena',                 thumb: 'jpg' },
  'under-the-radar':         { n: '05', title: 'Under the Radar',         model: 'Park Hyeob',             thumb: 'jpg' },
  'an-escapade-to-sanctuary':{ n: '06', title: 'An Escapade to Sanctuary',model: 'Stanley',                thumb: 'jpg' },
  'under-the-tropic-sun':    { n: '07', title: 'Under The Tropic Sun',    model: 'Keshia Nathania',        thumb: 'jpg' },
  'game-on':                 { n: '08', title: 'GAME ON!',                model: 'Jun Hyeok',              thumb: 'jpg' },
  'bloom':                   { n: '09', title: 'Bloom',                   model: 'Baek So Hyeon',          thumb: 'jpg' },
  'off-the-wall':            { n: '10', title: 'Off the Wall',            model: 'Nathan',                 thumb: 'jpg' },
  'city-life':               { n: '11', title: 'City Life',               model: 'Sergio',                 thumb: 'jpg' },
  'autumn-memories':         { n: '12', title: 'Autumn Memories',         model: 'BOHYEON, YUMI, SEUNGEUN',thumb: 'jpg' },
  'hotel-monopoli':          { n: '13', title: 'Hotel Monopoli',          model: 'Denissa',                thumb: 'jpg' },
  'berlin-1970':             { n: '14', title: 'Berlin 1970',             model: 'Florian',                thumb: 'jpg' },
  'higher-ground':           { n: '15', title: 'Higher Ground',           model: 'Park Hyeob',             thumb: 'jpg' },
  'an-angel-in-black':       { n: '16', title: 'An Angel in Black',       model: 'Perla',                  thumb: 'jpg' },
  'gypsy-heart':             { n: '17', title: 'Gypsy Heart',             model: 'Min Gyeong',             thumb: 'jpg' },
  'harder-than-steel':       { n: '18', title: 'Harder than Steel',       model: 'Glenn',                  thumb: 'jpg' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cleanDesc = (s) => String(s).replace(/\s+/g, ' ').trim()
  .replace(/taste-\s*ful/i, 'tasteful');   // game-on 줄바꿈 하이픈 artifact

async function download(url, dest) {
  if (existsSync(dest)) return 'skip';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return `${(buf.length/1024).toFixed(0)}KB`;
}

function galleryHtml(imgs, slug) {
  return imgs.map((o, i) => {
    const nn = String(i + 1).padStart(2, '0');
    return `      <img src="images/works/${slug}-${nn}.${o.ext}" width="${o.w}" height="${o.h}" data-col="${o.col}" alt="${esc(META[slug].title)} ${nn}">`;
  }).join('\n');
}

function pageHtml(slug) {
  const m = META[slug], d = data[slug];
  const title = esc(m.title);
  const year = d.year || '';
  const desc = esc(cleanDesc(d.desc));
  // see-more: 1~2개 (왼=다음작, 오른=이전작). 각 타깃의 카테고리 썸네일 사용.
  const smItems = d.seemore.map(s => {
    const mm = META[s];
    return `        <a class="wd-seemore-item" href="work-${s}.html">
          <img src="images/photoworks-${mm.n}-${s}.${mm.thumb}" alt="${esc(mm.title)}">
          <span>${esc(mm.title)}</span>
        </a>`;
  }).join('\n');
  const imgs = d.gallery.map(o => {
    const u = o.src;
    const w = +u.match(/[?&]width=(\d+)/)[1];
    const h = +u.match(/[?&]height=(\d+)/)[1];
    const ext = u.split('?')[0].match(/\.(\w+)$/)[1];
    return { url: u, w, h, ext, col: o.col };
  });
  const gallery = galleryHtml(imgs, slug);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - Wildy Riftian</title>
  <meta name="description" content="${title} — photography by Wildy Riftian.">
  <meta property="og:title" content="${title} - Wildy Riftian">
  <meta property="og:image" content="images/og-image.jpg">
  <link rel="icon" href="images/favicon.png">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/work-detail.css">
</head>
<body id="top" class="wd-page">

  <!-- ===== Header ===== -->
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

  <!-- ===== Menu overlay (mobile) ===== -->
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
    <a class="wd-back" href="works-photoworks.html"><span class="arr" aria-hidden="true">&lt;-</span><span class="arr-txt">SEE ALL PHOTOWORKS</span></a>

    <div class="wd-head">
      <h1 class="wd-title">${title}</h1>
      <div class="wd-meta">
        <div class="wd-meta-left">
          <span class="wd-year">${year}</span>
          <span class="wd-model"><span class="wd-model-label">MODEL :&nbsp;</span>${esc(m.model)}</span>
        </div>
        <p class="wd-desc">${desc}</p>
      </div>
    </div>

    <div class="wd-gallery">
${gallery}
    </div>

    <section class="wd-seemore">
      <h2 class="wd-seemore-title">see more.</h2>
      <div class="wd-seemore-list">
${smItems}
      </div>
    </section>
   </div>

    <!-- 스크롤 거리 확보 — 고정 푸터가 드러난다 -->
    <div class="wd-spacer" aria-hidden="true"></div>

    <!-- ===== Footer ===== -->
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
  <script src="js/work-detail.js"></script>
</body>
</html>
`;
}

// ---- 실행 ----
let targets = process.argv.slice(2);
if (!targets.length) targets = Object.keys(META);   // flat-earther 포함 전 18개

for (const slug of targets) {
  if (!META[slug]) { console.error(`no META for ${slug}`); continue; }
  if (!data[slug] || data[slug].error) { console.error(`no scrape data for ${slug}`); continue; }
  const d = data[slug];
  process.stdout.write(`\n== ${slug} (${d.gallery.length} imgs) ==\n`);
  // 이미지 다운로드
  const imgs = d.gallery.map(o => ({ url: o.src, ext: o.src.split('?')[0].match(/\.(\w+)$/)[1] }));
  // 잉여 파일 정리: 현재 갤러리보다 큰 번호(이전 스크랩 잔재) 삭제
  const worksDir = join(ROOT, 'images', 'works');
  for (const f of readdirSync(worksDir)) {
    const mm = f.match(new RegExp(`^${slug}-(\\d+)\\.`));
    if (mm && +mm[1] > imgs.length) { unlinkSync(join(worksDir, f)); process.stdout.write(`  rm stale ${f}\n`); }
  }
  for (let i = 0; i < imgs.length; i++) {
    const nn = String(i + 1).padStart(2, '0');
    const dest = join(ROOT, 'images', 'works', `${slug}-${nn}.${imgs[i].ext}`);
    try {
      const r = await download(imgs[i].url, dest);
      process.stdout.write(`  ${nn}.${imgs[i].ext} ${r}\n`);
    } catch (e) {
      process.stdout.write(`  ${nn} FAIL ${e.message}\n`);
    }
  }
  // HTML 생성
  writeFileSync(join(ROOT, `work-${slug}.html`), pageHtml(slug));
  process.stdout.write(`  -> work-${slug}.html (see more: ${d.seemore.slug})\n`);
}
console.log('\ndone');
