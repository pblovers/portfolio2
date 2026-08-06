// 상세 페이지 스크롤 QA:
//  (1) 템플릿 B — back(SEE ALL … WORKS) 이 스크롤해도 좌측 sticky 컬럼에서 y80 고정인지
//  (2) 영상이 뷰포트 밖에서는 멈추고 안에서만 재생되는지 (버벅임 방지)
//  (3) 가로스크롤·콘솔오류 없음
// Lenis 는 destroy 하고 네이티브 스크롤로 잰다 (sticky·IntersectionObserver 는 CSS/IO 라 그대로 동작).
import { chromium } from 'playwright';
import { mine } from './root.mjs';

const file = process.argv[2] || 'project/project-aquaplanet.html';
const b = await chromium.launch();

async function run(W, H, label) {
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 60)); });
  p.on('pageerror', e => errs.push('PAGEERR ' + String(e).slice(0, 60)));
  await p.goto(mine(file), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(800);
  // Lenis 를 죽이고 참조까지 null 로 — rafLoop 이 scroll 을 0 으로 되돌리지 못하게.
  await p.evaluate(() => { try { if (window.WR && WR.lenis) { WR.lenis.destroy(); WR.lenis = null; } } catch (e) {} });
  await p.waitForTimeout(150);

  // back 위치를 스크롤 오프셋마다 측정 (hero 가 실제로 밀려났는지 함께 확인해야
  // back 의 자연 위치 y80 과 sticky y80 을 구분할 수 있다).
  const backTest = await p.evaluate(async () => {
    const se = document.scrollingElement;
    const maxY = se.scrollHeight - se.clientHeight;
    const pts = [0, 1500, 4000, Math.min(7000, maxY - 200)].filter(y => y >= 0 && y <= maxY);
    const out = [];
    for (const y of pts) {
      se.scrollTop = y;
      await new Promise(r => setTimeout(r, 220));
      const back = document.querySelector('.wd-back');
      const hero = document.querySelector('.std-hero');
      out.push({ req: y, actual: Math.round(se.scrollTop),
        backY: back ? Math.round(back.getBoundingClientRect().y) : null,
        heroY: hero ? Math.round(hero.getBoundingClientRect().y) : null });
    }
    se.scrollTop = 0;
    return { maxY: Math.round(maxY), pts: out };
  });

  // 영상 재생 상태: 맨 위(영상 다 밖) vs 영상 위치로 스크롤했을 때
  const videoTest = await p.evaluate(async () => {
    const vids = [...document.querySelectorAll('.std-content video')];
    if (!vids.length) return { count: 0 };
    const se = document.scrollingElement;
    // 맨 위: 영상들이 화면 밖 → 전부 멈춰야
    se.scrollTop = 0;
    await new Promise(r => setTimeout(r, 400));
    const topPaused = vids.filter(v => v.paused).length;
    // 첫 영상 위치로 스크롤 → 그 영상은 재생돼야
    const first = vids[0];
    const targetY = se.scrollTop + first.getBoundingClientRect().top - 300;
    se.scrollTop = Math.max(0, targetY);
    await new Promise(r => setTimeout(r, 600));
    const firstPlaying = !vids[0].paused;
    // 다시 맨 위로 → 첫 영상 멈춰야
    se.scrollTop = 0;
    await new Promise(r => setTimeout(r, 500));
    const firstPausedAgain = vids[0].paused;
    se.scrollTop = 0;
    return { count: vids.length, topPaused, firstPlaying, firstPausedAgain };
  });

  const geom = await p.evaluate(() => {
    const de = document.documentElement;
    const hScroll = de.scrollWidth - de.clientWidth;
    const broken = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length;
    return { hScroll, broken };
  });

  // 판정
  const desktop = W >= 1280;
  // 페이지가 실제로 스크롤된 지점(hero 가 위로 밀려난 지점)만 근거로 삼는다.
  const scrolled = backTest.pts.filter(o => o.heroY !== null && o.heroY < 0);
  const stickyOK = desktop
    ? scrolled.length > 0 && scrolled.every(o => o.backY === 80)   // 데스크톱: 스크롤해도 back y80 고정
    : scrolled.length > 0 && scrolled.every(o => o.backY < 0);     // 모바일: back 이 함께 사라져야
  const vt = videoTest;
  const videoOK = vt.count === 0 || (vt.topPaused === vt.count && vt.firstPlaying && vt.firstPausedAgain);

  console.log(`\n[${label} ${W}x${H}] ${file}`);
  console.log(`  back @scroll: ${JSON.stringify(backTest.pts.map(o => ({ s: o.actual, back: o.backY, hero: o.heroY })))}`);
  console.log(`  sticky=${stickyOK ? 'OK' : 'FAIL'} (scrolled pts=${scrolled.length})`);
  if (vt.count) console.log(`  video: n=${vt.count} topPaused=${vt.topPaused} firstPlaysInView=${vt.firstPlaying} pausedAgain=${vt.firstPausedAgain}  ${videoOK ? 'OK' : 'FAIL'}`);
  console.log(`  hScroll=${geom.hScroll} broken=${geom.broken} errs=${errs.length} ${(geom.hScroll === 0 && geom.broken === 0 && !errs.length) ? 'OK' : 'ISSUE'}`);
  if (errs.length) console.log('   errs:', errs.join(' | '));
  await ctx.close();
}

await run(1440, 900, 'desktop');
await run(375, 812, 'mobile');
await b.close();
