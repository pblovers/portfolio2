/**
 * SEE ALL 바의 좌/우 경계를 행마다 스캔한다 (work-01 상태 크롭 기준).
 *   node seeallbox.mjs <width>
 */
import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';

const W = process.argv[2] || 1440;
for (const tag of ['orig', 'mine']) {
  const png = PNG.sync.read(readFileSync(`./diff/strip-${tag}-${W}-01.png`));
  const at = (x, y) => { const i = (png.width * y + x) << 2; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
  const key = (x, y) => at(x, y).join(',');
  console.log(`\n=== ${tag} @ ${W} ===`);
  for (const y of [0, 4, 8, 12, 16, 20, 24, 28, 31]) {
    // 오른쪽 절반에서 색이 바뀌는 지점을 전부 찍는다
    const edges = [];
    let prev = key(Math.round(W * 0.6), y);
    for (let x = Math.round(W * 0.6) + 1; x < W; x++) {
      const c = key(x, y);
      const [a1, b1, c1] = prev.split(',').map(Number), [a2, b2, c2] = c.split(',').map(Number);
      if (Math.abs(a1 - a2) + Math.abs(b1 - b2) + Math.abs(c1 - c2) > 8) edges.push(`${x}(${c})`);
      prev = c;
    }
    // 글자 경계 제거: 인접 14px 안에 다른 경계가 없는 것만
    const xs = edges.map(e => Number(e.split('(')[0]));
    const big = edges.filter((e, i) => (i === 0 || xs[i] - xs[i - 1] > 14) && (i === edges.length - 1 || xs[i + 1] - xs[i] > 14));
    console.log(`  y=${String(y).padStart(2)}  ${big.join('  ')}`);
  }
}
