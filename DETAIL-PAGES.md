# 작업물 상세 페이지 — 인수인계

카테고리 페이지(works-motion 등)에서 카드를 누르면 나오는 **작업물 상세 페이지**를 만드는 작업.
다른 로컬에서 이 파일만 읽고 이어서 할 수 있게 정리했다.

> 프로젝트 전체 상태는 [HANDOFF.md](HANDOFF.md)·[NEXT.md](NEXT.md) 참고.
> 이 파일은 **상세 페이지 작업**만 다룬다.

원본: https://www.wildyriftian.com/works/<slug> (예: /works/flat-earther)

---

## 0. 지금 상태 (미커밋)

새로 만든 것:
```
work-flat-earther.html      photoworks 상세 1호 (거의 완성, 아래 3번 잔여 수정만 남음)
css/work-detail.css         상세 페이지 CSS (photoworks 그룹)
js/work-detail.js           masonry 분배 (짧은 열 우선)
images/works/               flat-earther-01~12.jpg (12장 다운로드 완료)
```
그 외 미커밋 변경(이번 세션 다른 작업들)은 HANDOFF 13절 참고 (Lenis·헤더 hide/show·
카테고리 비침 수정·폴더 box-shadow 등).

**주의 — 올리기 전 저장소가 Private 인지 확인.** 원작자 이미지가 계속 늘어난다.

---

## 1. 템플릿 지도 (조사 완료)

6개 카테고리에서 카드 링크를 수집한 결과 상세 페이지는 **37개**, 템플릿은 **2종**.

### A. photoworks 그룹 (18개) — masonry 갤러리 ← **지금 여기부터**
상단 메타(뒤로가기 / 제목 / 연도 / MODEL / 설명) + **3열 masonry 사진 갤러리** +
see more + **고정 푸터 리빌**. 사진만 다르고 틀은 전부 같다.

### B. 표준 그룹 (19개) — 좌측 메타 컬럼 + 콘텐츠 블록
motion·branding·editorial·illustration·3d-tech 의 상세. 좌측 sticky 메타 컬럼
(← SEE ALL X WORKS / 제목 / 카테고리 / 연도 / 설명) + 우측 콘텐츠(히어로 영상·이미지,
전체폭/다열 이미지, 캡션 그리드, TOOLS/SOFTWARE 크레딧, 스토리보드/프로덕션 등) +
see more + 고정 푸터 리빌. **콘텐츠 블록이 작업마다 다르다** (틀은 공유, 내용 가변).

docH 예시: overbloom 6644 / dipsco 8151 / wldr(editorial) 12006 / flat-earther 4508 /
illustration 11692 / venturi(3dtech) 9900.

---

## 2. 37개 상세 URL (카테고리별)

원본 카드 링크는 `./works/<slug>` 다. 우리는 `work-<slug>.html` (루트, 평면 구조)로 만든다.

```
motion(3):       overbloom · in-between-ending-credits · scad-startup-2026-motion
branding(5):     dipsco-brand-identity · comotion-2025-branding ·
                 outstan-coffee-works-brand-identity · youngdabang-brand-identity ·
                 trybreathing-brand-identity
editorial(3):    wldr-a-photo-archive-photobook ·
                 hues-of-harmony-love-s-journey-in-rajasthan-photobook ·
                 earthbound-typeface-design
photoworks(18):  flat-earther · a-deeper-dreamscape · speed-limit · faux-leather-safari ·
                 under-the-radar · an-escapade-to-sanctuary · under-the-tropic-sun ·
                 game-on · bloom · off-the-wall · city-life · autumn-memories ·
                 hotel-monopoli · berlin-1970 · higher-ground · an-angel-in-black ·
                 gypsy-heart · harder-than-steel
illustration(5): a-trip-for-a-better-earth-interactive-children-s-book ·
                 flavors-of-indonesia · unity-in-diversity-2024-illustrated-calendar ·
                 moone-bakery-mid-autumn-mooncake-packaging · uncommon-kids-eyewear-packaging
3d-tech(3):      venturi-3d-sneaker-product-visualization ·
                 hong-kong-eatery-3d-look-development-study ·
                 a-study-of-3d-environment-look-development
```

카테고리 페이지의 카드 링크는 아직 `#photoworks` 등 자리표시자다. 상세를 만들면
해당 카드 href 를 `work-<slug>.html` 로 바꿔줘야 한다 (works-photoworks.html 등).

---

## 3. flat-earther (photoworks 1호) — 남은 잔여 수정

현재 거의 맞다. 확인된 값:
- 제목 [32,128,1376,56] **원본 정확 일치**
- 워드마크 y743 (고정 푸터 리빌) **원본 정확 일치**
- masonry 열 분배 col 4/4/4, 순서 [1,5,8,11]/[2,6,9,12]/[3,4,7,10] **원본 정확 일치**
- 뒤로가기 "← SEE ALL PHOTOWORKS" 표시됨, 가로스크롤 없음, 콘솔 오류 0

**남은 것:**
1. ✅ **헤더 nav 색** — `work-detail.css` 에 `.wd-page` 헤더 반전 규칙 추가 완료
   (흰 배경 위라 글자 --ink, roll 반전 면 --light). motion-page 와 동일.
2. **see more 세로 여백** — docH 4740 vs 원본 4508 (232 큼). `.wd-seemore`
   margin-top 96/padding-bottom 96 을 원본에 맞춰 줄인다. 원본 실측: 갤러리 끝 → see
   more 제목 y3136, 프리뷰 y3192(672x504), 제목 y3492. 재서 맞출 것.

### photoworks 상세 실측값 (flat-earther, 1440)
```
여백 32
뒤로가기  ~32,92   14/24 mono uppercase
제목      32,128   48/56 Lock Serif Light
연도      32,208   14/24 mono / MODEL 32,232
설명      720,208  12/24 mono uppercase (우측 절반, grid 1fr 1fr gap24)
갤러리    3열 masonry 열폭 442.7 gap 24  (32 + 3*442.7 + 2*24 = 1408)
          짧은 열 우선 배치 → js/work-detail.js
see more  32,3136  48/56 / 프리뷰 672x504(4:3, =절반폭) / 제목 28/36 Lock Serif
푸터      고정 리빌 (워드마크 y743), docH = 콘텐츠 + 100vh
반응형    갤러리 3열(≥1280) / 2열(810~1279) / 1열(≤809) — **원본에서 폭별 재확인 필요**
```

---

## 4. photoworks 나머지 17개 만드는 법 (틀 동일, 사진만)

flat-earther.html 을 복제하고 아래만 바꾸면 된다:
1. `<title>`, 제목, 연도, MODEL, 설명 텍스트
2. 갤러리 `<img>` 목록 (각 사진의 `width`/`height` 를 소스 원본 크기로 — masonry 비율에 쓰임)
3. see more 의 다음 작업(프리뷰 이미지 + 제목 + href). 원본은 카테고리 순서상 **다음 작업**을 건다.
4. 뒤로가기 href 는 그대로 works-photoworks.html

**사진·메타·see more 는 반드시 원본에서 재서 가져올 것** (감 금지).
아래 스크립트 패턴으로 각 작업의 이미지 URL·크기·메타·see more 를 뽑는다:

```bash
cd tools
# 한 작업의 갤러리 이미지(순서·위치·풀 URL) + 메타 + see more 뽑기
node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('https://www.wildyriftian.com/works/<slug>',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(4500);
await p.evaluate(()=>{try{window.lenis&&window.lenis.destroy()}catch(e){}});
console.log(await p.evaluate(()=>[...document.querySelectorAll('img')]
 .map(i=>({y:Math.round(i.getBoundingClientRect().y),w:Math.round(i.getBoundingClientRect().width),
  h:Math.round(i.getBoundingClientRect().height),src:i.currentSrc}))
 .filter(o=>o.w>150&&o.h>100&&o.y>140).sort((a,b)=>a.y-b.y)));
await b.close();})"
```

이미지 다운로드 (framerusercontent URL → images/works/<slug>-NN.jpg):
```bash
curl -s "https://framerusercontent.com/images/<id>.jpg?width=..&height=.." -o "images/works/<slug>-01.jpg"
```
**`width`/`height` 쿼리는 소스 원본 크기다** — HTML img 의 width/height 속성에 그대로 넣으면
masonry 비율이 맞는다 (js/work-detail.js 가 이 비율로 짧은 열 우선 분배).

---

## 5. 표준 그룹 19개 (아직 안 시작)

좌측 sticky 메타 컬럼 + 우측 콘텐츠 블록. 콘텐츠가 작업마다 달라 **블록 타입을 먼저 카탈로그화**
해야 한다 (전체폭 이미지 / 2열 / 3열 캡션 그리드 / 히어로 영상 / TOOLS·SOFTWARE 크레딧 /
스토리보드 그리드 / PRODUCTION 넘버 스텝 등). 대표 페이지부터 실측:
- motion: works/overbloom (히어로영상+갤러리+STORYBOARD+PRODUCTION+see more)
- branding: works/dipsco-brand-identity (이미지 쇼케이스+타입/컬러 스펙)
- editorial: works/wldr-a-photo-archive-photobook (포토북 스프레드, 매우 긺 12006)
- 3dtech: works/venturi-... (히어로영상+렌더 이미지들, 검은 배경)
- illustration: works/a-trip-for-a-better-earth-...

좌측 메타 컬럼은 category 페이지의 `.msec-left`(sticky) 구조를 참고하면 된다.
공유 셸(헤더·고정 푸터 리빌·see more)은 photoworks 상세와 같으니 work-detail.css 를 확장/분리.

---

## 6. 방법 (원본 대조 루프 — 반드시 지킬 것)

1. 원본을 Playwright 로 직접 재고 근거를 남긴다 (감·개발자도구 스타일만 읽기 금지).
2. 같은 폭(1920·1440·1280·768·430·375)에서 구현을 실행.
3. 원본 vs 구현 스크린샷/실측 대조 → 차이 원인 분석 → 수정 → 재실행 → 재대조.
4. 최소 3회 루프. mobqa 로 회귀(가로스크롤·넘침·깨짐·콘솔오류) 확인.
5. 폰트·이미지는 원본과 동일, 이미지는 반드시 `images/` 로컬 저장.

원본 상세 페이지는 `networkidle` 로는 타임아웃 난다(영상·애니). `domcontentloaded` +
`waitForTimeout(4000~4500)` 후 `window.lenis.destroy()` 로 스크롤 고정하고 재라.

검증 도구: `tools/` (catdiff·mdiff·mobqa·crop 등, README 참고). 새 상세용 스크립트는
`root.mjs` 의 `mine('work-flat-earther.html')` 로 로컬 경로를 얻어 쓴다.

---

## 7. 진행 체크리스트

- [x] 조사·템플릿 지도 (2종, 37 URL)
- [x] photoworks 상세 CSS/JS 틀 (work-detail.css, work-detail.js)
- [~] flat-earther.html — 거의 완성 (헤더색 ✅, 잔여: see more 여백 1건)
- [ ] photoworks 나머지 17개 (4번 방법)
- [ ] photoworks 카드 링크 연결 (works-photoworks.html)
- [ ] 표준 그룹 19개 (5번)
- [ ] 표준 그룹 카드 링크 연결
- [ ] 전체 QA (6폭 × 반응형 × 인터랙션)
