import { chromium } from "playwright";
const b = await chromium.launch();
console.log("=== 폴더 호버 효과: 폭별 (디밍 / 상승 / 썸네일) ===");
for (const [W,H] of [[1920,1080],[1440,900],[1280,900],[1279,900],[1024,768],[820,1180],[809,900],[768,1024],[430,932],[375,812]]) {
  const ctx = await b.newContext({ viewport:{width:W,height:H} });
  const p = await ctx.newPage();
  await p.goto("file:///D:/임소현/portfolio2/works.html",{waitUntil:"networkidle"});
  await p.waitForTimeout(1200);
  const base = await p.evaluate(()=>{
    const f=document.querySelector(".wf-branding");
    return {bg:getComputedStyle(f.querySelector(".wf-body")).backgroundColor,
      col:getComputedStyle(f.querySelector(".wf-title")).color};
  });
  await p.hover(".wf-motion");
  await p.waitForTimeout(800);
  const hov = await p.evaluate(()=>{
    const f=document.querySelector(".wf-branding"), m=document.querySelector(".wf-motion");
    return {bg:getComputedStyle(f.querySelector(".wf-body")).backgroundColor,
      col:getComputedStyle(f.querySelector(".wf-title")).color,
      tf:getComputedStyle(m).transform,
      th:getComputedStyle(m.querySelector(".wf-th")).opacity,
      f6:getComputedStyle(document.querySelectorAll(".wf")[5].querySelector(".wf-th")).opacity};
  });
  const dim = base.bg!==hov.bg || base.col!==hov.col;
  const lift = hov.tf!=="none";
  const show = hov.th==="1";
  const desktop = W>=1280;
  const ok = desktop ? (dim&&lift&&show) : (!dim&&!lift&&!show);
  console.log(`${ok?"[정상]":"[문제]"} ${String(W).padStart(4)}px ${desktop?"데스크톱":(W>=810?"태블릿":"모바일")}  디밍=${dim} 상승=${lift} 썸네일노출=${show}  (6번폴더 썸네일 op=${hov.f6})`);
  await ctx.close();
}
await b.close();
