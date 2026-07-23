// overbloom 미디어 다운로드: 이미지 5 → images/works/, 영상 5 → videos/works/
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './root.mjs';

const imgs = [
  ['overbloom-01', 'https://framerusercontent.com/images/37zV4BfG1EntuF5xwSwkM3drTFY.webp?width=1920&height=1080'],
  ['overbloom-02', 'https://framerusercontent.com/images/tixApSeZG2jOMnAbpeAlf7UGos.webp?width=1920&height=1080'],
  ['overbloom-03', 'https://framerusercontent.com/images/14B3aTmanjLjUORlcmnSH5q0EE.webp?width=1920&height=828'],
  ['overbloom-05', 'https://framerusercontent.com/images/gLhJ82lzRV9o9RHkewONJ78SY.png?width=1920&height=1123'],
  ['overbloom-07', 'https://framerusercontent.com/images/TVFGocsjVwRINezpNwsQDqdKo.webp?width=1920&height=1324'],
];
const vids = [
  ['overbloom-04', 'https://dl.dropboxusercontent.com/scl/fi/feoscqoq2lel6gx1b1lu8/04_Moodboards.mp4?rlkey=i9lsixjhemjxyox99k2zbsxis&dl=1'],
  ['overbloom-06', 'https://dl.dropboxusercontent.com/scl/fi/de1lf7x29lk767ehoqeen/05_StyleframesGrid_Animated.mp4?rlkey=77igxan8bnl4euhpgzs7d0rqq&dl=1'],
  ['overbloom-08', 'https://dl.dropboxusercontent.com/scl/fi/fzhf2ymeng7jo81d0z1t2/OB_SH09.mp4?rlkey=qky17js0ordym5hjizvzq3d4m&dl=1'],
  ['overbloom-09', 'https://dl.dropboxusercontent.com/scl/fi/6tg6esjtwj07pt9snaze0/OB_SH03.mp4?rlkey=t29cu6fir8ycvscipn4bf14yx&dl=1'],
  ['overbloom-10', 'https://dl.dropboxusercontent.com/scl/fi/ukgclxz4ltznurtflx6t2/OB_SH12.mp4?rlkey=tc9lmfoueg2wbfjyl5jp6z8vo&dl=1'],
];

const worksImg = join(ROOT, 'images', 'works');
const worksVid = join(ROOT, 'videos', 'works');
if (!existsSync(worksVid)) mkdirSync(worksVid, { recursive: true });

async function dl(name, url, dir, ext) {
  const dest = join(dir, `${name}.${ext}`);
  if (existsSync(dest)) { console.log(`  skip ${name}.${ext}`); return; }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) { console.log(`  FAIL ${name} HTTP ${res.status}`); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`  ${name}.${ext}  ${(buf.length/1024/1024).toFixed(2)}MB  (${res.headers.get('content-type')})`);
}

console.log('IMAGES:');
for (const [n, u] of imgs) await dl(n, u, worksImg, u.split('?')[0].split('.').pop());
console.log('VIDEOS:');
for (const [n, u] of vids) await dl(n, u, worksVid, 'mp4');
console.log('done');
