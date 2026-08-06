/* 원본(정착 캡처)과 구현본을 같은 회전각으로 맞춰 픽셀 대조 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';

const w = Number(process.argv[2] || 1440), h = Number(process.argv[3] || 900);
const rot = Number(process.argv[4] || 0.2764);   // 원본 캡처 당시 ring.rotation.y
const camZ = process.argv[5] ? Number(process.argv[5]) : undefined;  // 원본 캡처 당시 camera.z
const origPath = `./diff/arc/orig-settled-${w}.png`;

const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://localhost:8080/index.html', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, document.querySelector('#archive').getBoundingClientRect().top + scrollY));
await p.waitForTimeout(4000);
await p.evaluate(([r,z]) => document.querySelector('.js-carousel3d').__arc.settle(r, z), [rot, camZ]);
await p.waitForTimeout(2500);
// awwwards 배지는 원본에 없으니 대조에서 제외
await p.evaluate(() => { const a = document.querySelector('#awwwards'); if (a) a.style.display = 'none'; });
await p.screenshot({ path: `./diff/arc/mine-rot-${w}.png`, timeout: 120000 });
await b.close();

const A = PNG.sync.read(readFileSync(origPath));
const B = PNG.sync.read(readFileSync(`./diff/arc/mine-rot-${w}.png`));
if (A.width !== B.width || A.height !== B.height) { console.log('size mismatch', A.width, A.height, B.width, B.height); process.exit(1); }

const out = new PNG({ width: A.width, height: A.height });
let diff = 0, inkA = 0, inkB = 0;
for (let i = 0; i < A.data.length; i += 4) {
  const d = Math.abs(A.data[i]-B.data[i]) + Math.abs(A.data[i+1]-B.data[i+1]) + Math.abs(A.data[i+2]-B.data[i+2]);
  const aInk = (A.data[i]+A.data[i+1]+A.data[i+2]) < 720;
  const bInk = (B.data[i]+B.data[i+1]+B.data[i+2]) < 720;
  if (aInk) inkA++;
  if (bInk) inkB++;
  if (d > 30) { diff++; out.data[i]=255; out.data[i+1]=0; out.data[i+2]=0; out.data[i+3]=255; }
  else { const g = 255 - Math.round((A.data[i]+A.data[i+1]+A.data[i+2])/3*0.25); out.data[i]=out.data[i+1]=out.data[i+2]=g; out.data[i+3]=255; }
}
writeFileSync(`./diff/arc/diff-${w}.png`, PNG.sync.write(out));
const total = A.width*A.height;
console.log(JSON.stringify({
  width: w, diffPx: diff, diffPct: +(diff/total*100).toFixed(2),
  origInkPct: +(inkA/total*100).toFixed(2), minePct: +(inkB/total*100).toFixed(2)
}));
