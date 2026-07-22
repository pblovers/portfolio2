/**
 * PNG 의 한 구간을 잘라 확대 저장한다 (눈으로 대조하기 위한 도구).
 *   node crop.mjs <입력png> <x> <y> <w> <h> [배율] [출력png]
 */
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';

const [inp, X, Y, W, H, S = 4, out] = process.argv.slice(2);
const x = +X, y = +Y, w = +W, h = +H, s = +S;
const src = PNG.sync.read(readFileSync(inp));
const dst = new PNG({ width: w * s, height: h * s });

for (let j = 0; j < h * s; j++) {
  for (let i = 0; i < w * s; i++) {
    const sx = x + Math.floor(i / s), sy = y + Math.floor(j / s);
    const si = (src.width * sy + sx) << 2, di = (dst.width * j + i) << 2;
    if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) {
      dst.data[di] = dst.data[di + 1] = dst.data[di + 2] = 0; dst.data[di + 3] = 255;
    } else {
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = 255;
    }
  }
}
const file = out || inp.replace(/\.png$/, `-crop.png`);
writeFileSync(file, PNG.sync.write(dst));
console.log(file);
