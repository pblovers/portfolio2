/**
 * 카테고리 4페이지의 에셋(태그 영상 4 + 프리뷰 이미지 16)을 내려받는다.
 * 이미지는 scale-down-to 를 떼고 원본 크기로 받는다 (images/ 의 기존 방식과 동일).
 *   node catassets.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { ROOT } from './root.mjs';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('./cat-rows.json', import.meta.url), 'utf8'));
const CAT = { 'works-branding': 'branding', 'works-editorial': 'editorial',
              'works-illustration': 'illustration', 'works-3d-tech': '3dtech' };

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);

mkdirSync(join(ROOT, 'images'), { recursive: true });
mkdirSync(join(ROOT, 'videos'), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const grab = async (url, dest) => {
  if (existsSync(dest)) { console.log('  건너뜀(이미 있음)', dest.split(/[\\/]/).pop()); return; }
  const res = await page.request.get(url, { timeout: 120000 });
  if (!res.ok()) { console.log('  실패', res.status(), url.slice(0, 60)); return; }
  const buf = await res.body();
  writeFileSync(dest, buf);
  console.log('  받음', dest.split(/[\\/]/).pop(), (buf.length / 1024).toFixed(0) + 'KB');
};

for (const [slug, v] of Object.entries(data)) {
  const cat = CAT[slug];
  console.log('■', slug);
  if (v.video) await grab(v.video, join(ROOT, 'videos', `${cat}-tag.mp4`));
  for (let i = 0; i < v.rows.length; i++) {
    const r = v.rows[i];
    if (!r.img) continue;
    // scale-down-to 를 떼서 원본 크기로
    const u = new URL(r.img);
    u.searchParams.delete('scale-down-to');
    const ext = (u.pathname.match(/\.(\w+)$/) || [, 'jpg'])[1];
    const name = `${cat}-${String(i + 1).padStart(2, '0')}-${slugify(r.title || 'item')}.${ext}`;
    await grab(u.toString(), join(ROOT, 'images', name));
  }
}
await browser.close();
