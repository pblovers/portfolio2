/**
 * works-motion.html 의 **확정된 껍데기**(head·헤더·메뉴·푸터·awwwards)를 그대로 떠서
 * 카테고리 4페이지를 만든다. 손으로 옮겨 적다 생기는 오차를 막기 위한 1회성 스캐폴드다.
 * 만든 뒤에는 보통의 정적 HTML 이므로 그냥 손으로 고치면 된다.
 *   node scaffold-categories.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';

const src = readFileSync(join(ROOT, 'works-motion.html'), 'utf8');
const data = JSON.parse(readFileSync(new URL('./cat-rows.json', import.meta.url), 'utf8'));

const CAT = {
  'works-branding':    { file: 'works-branding.html',    cls: 'cat-branding',    cat: 'branding' },
  'works-editorial':   { file: 'works-editorial.html',   cls: 'cat-editorial',   cat: 'editorial' },
  'works-illustration':{ file: 'works-illustration.html',cls: 'cat-illustration',cat: 'illustration' },
  'works-3d-tech':     { file: 'works-3d-tech.html',     cls: 'cat-3dtech',      cat: '3dtech' },
};
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 껍데기를 잘라낸다: <section class="msec"> ... </section> 만 갈아끼운다
const secStart = src.indexOf('    <section class="msec">');
const secEnd = src.indexOf('</section>', secStart) + '</section>'.length;
if (secStart < 0 || secEnd < 10) throw new Error('msec 섹션을 찾지 못했다');
const head = src.slice(0, secStart);
const tail = src.slice(secEnd);

for (const [slug, meta] of Object.entries(CAT)) {
  const d = data[slug];
  const rows = d.rows.map((r, i) => {
    const ext = (new URL(r.img).pathname.match(/\.(\w+)$/) || [, 'jpg'])[1];
    const img = `images/${meta.cat}-${String(i + 1).padStart(2, '0')}-${slugify(r.title)}.${ext}`;
    const tags = (r.tags || []).map(t => `                <li>${esc(t)}</li>`).join('\n');
    return `            <a class="cat-row" href="#${meta.cat}">
              <span class="cat-row-inner">
                <span class="cat-row-title">${esc(r.title)}</span>
                <span class="cat-row-year">${esc(r.year || '')}</span>
                <ul class="cat-row-tags">
${tags}
                </ul>
                <span class="cat-row-preview"><img src="${img}" alt="${esc(r.title)}"></span>
              </span>
            </a>`;
  }).join('\n');

  const section = `    <section class="msec">
      <!-- 좌측 1/4 열 — sticky(60vh) -->
      <div class="msec-left">
        <a class="m-back" href="works.html"><span class="arr arr-back">&lt;-</span>SEE ALL WORKS</a>
        <div class="m-tag" aria-hidden="true">
          <video src="videos/${meta.cat}-tag.mp4" autoplay loop muted playsinline></video>
        </div>
      </div>

      <!-- 우측 3/4 열 -->
      <div class="msec-right">
        <div class="m-panel">
          <div class="m-head">
            <span class="m-tab"><span class="m-num">${d.num}</span></span>
            <div class="m-body m-body-head">
              <h1 class="m-title">${esc(d.title)}</h1>
              <div class="cat-thead"><span>PROJECT TITLE</span><span>PREVIEW</span></div>
            </div>
          </div>

          <div class="m-body cat-list">
${rows}
          </div>
        </div>
      </div>
    </section>`;

  let out = head + section + tail;
  // head 안의 페이지별 값 교체
  out = out.replace(/<title>[^<]*<\/title>/,
    `<title>${d.title} — Wildy Riftian</title>`);
  out = out.replace(/<link rel="stylesheet" href="css\/works-motion\.css">/,
    '<link rel="stylesheet" href="css/works-motion.css">\n  <link rel="stylesheet" href="css/works-category.css">');
  out = out.replace(/<body id="top" class="motion-page">/,
    `<body id="top" class="motion-page cat-page ${meta.cls}">`);
  writeFileSync(join(ROOT, meta.file), out);
  console.log('만듦', meta.file, `(${d.rows.length}행)`);
}
