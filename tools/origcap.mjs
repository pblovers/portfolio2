/* 원본을 캡처하면서 그 순간의 ring.rotation.y 를 같은 실행에서 함께 읽는다.
   (별도 실행으로 재면 프레임 수가 달라 각도가 어긋난다 — damping 0.01 이라 매우 느리게 수렴) */
import { chromium } from 'playwright';
const w = Number(process.argv[2] || 1440), h = Number(process.argv[3] || 900);
const wait = Number(process.argv[4] || 45000);
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__THREE_DEVTOOLS__ = { dispatchEvent(ev) {
    const r = ev && ev.detail;
    if (r && typeof r.render === 'function' && !r.__probed) {
      r.__probed = true;
      const orig = r.render.bind(r);
      r.render = (s, c) => { window.__scene = s; window.__cam = c; orig(s, c); };
    }
  }};
});
await p.goto('https://interesting-studies-473096.framer.app/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(wait);
// 배지·에디터·데모 버튼(UI)은 대조 대상이 아니다
await p.evaluate(() => {
  ['#__framer-badge-container','#__framer-editorbar-container','#__framer-editorbar',
   '.framer-1828phv-container','.framer-6vk0ay-container']
    .forEach(s => document.querySelectorAll(s).forEach(el => el.style.display = 'none'));
});
await p.screenshot({ path: `./diff/arc/orig-settled-${w}.png`, timeout: 120000 });
const st = await p.evaluate(() => {
  const s = window.__scene; let ring = null;
  s.traverse(o => { if (o.isGroup && o.children.length > 5) ring = o; });
  return { rotYdeg: ring ? ring.rotation.y * 180 / Math.PI : null,
           camZ: window.__cam.position.z, camY: window.__cam.position.y, fov: window.__cam.fov };
});
console.log(JSON.stringify(st));
await b.close();
