import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';
const map = [
  ['works-3d-tech.html', 'Venturi: 3D Sneaker Product Visualization', 'work-venturi-3d-sneaker-product-visualization.html', '#3d-tech'],
  ['works-illustration.html', "A Trip for a Better Earth Interactive Children's Book", 'work-a-trip-for-a-better-earth-interactive-children-s-book.html', '#illustration'],
  ['works-editorial.html', 'wldr : a photo archive [photobook]', 'work-wldr-a-photo-archive-photobook.html', '#editorial'],
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const [file, title, href, ph] of map) {
  const path = join(ROOT, file);
  let s = readFileSync(path, 'utf8');
  const re = new RegExp('(<a class="cat-row" href=")' + esc(ph) + '("\\s*>\\s*<span class="cat-row-inner">\\s*<span class="cat-row-title">' + esc(title) + ')');
  const before = s;
  s = s.replace(re, `$1${href}$2`);
  writeFileSync(path, s);
  console.log(file, s !== before ? `linked → ${href}` : 'NO MATCH (check ph/title)');
}
