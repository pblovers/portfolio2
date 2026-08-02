# 작업물 상세 페이지 — 인수인계

카테고리 페이지(works-motion 등)에서 카드를 누르면 나오는 **작업물 상세 페이지**를 만드는 작업.
다른 로컬에서 이 파일만 읽고 이어서 할 수 있게 정리했다.

> 프로젝트 전체 상태는 [HANDOFF.md](HANDOFF.md)·[NEXT.md](NEXT.md) 참고.
> 이 파일은 **상세 페이지 작업**만 다룬다.

원본: https://www.wildyriftian.com/works/<slug> (예: /works/flat-earther)

---

## 0. 지금 상태 (미커밋, 2026-07-24 갱신)

**6개 카테고리 전부 대표 상세 1개씩 완성** (템플릿 A 1 + 템플릿 B 5). 전부 원본과 docH 픽셀 일치.

```
work-flat-earther.html                            템플릿 A(photoworks)  docH 4508 ✓
work-overbloom.html                               템플릿 B / motion      docH 8661 ✓
work-dipsco-brand-identity.html                   템플릿 B / branding    docH 8151 ✓
work-wldr-a-photo-archive-photobook.html          템플릿 B / editorial   docH 12006 ✓
work-a-trip-for-a-better-earth-...-book.html      템플릿 B / illustration docH 11692 ✓
work-venturi-3d-sneaker-product-visualization.html 템플릿 B / 3d-tech     docH 9900 ✓ (YouTube 히어로)

css/work-detail.css       A 셸(헤더반전·흰커버리빌·고정푸터·wd-back·wd-seemore) + photoworks 갤러리
css/work-detail-std.css   B 레이아웃 (A 셸 재사용). 좌 sticky 메타 + 우 콘텐츠 블록. std-center 변형.
js/work-detail.js         photoworks masonry (round-robin + data-col, 4절)
images/works/, videos/works/   각 상세의 이미지·영상
tools/pw*.mjs             photoworks 파이프라인 (pwscrape/pwgen/pwcmp/pwinspect/pwdom)
tools/std*.mjs, stdgen.mjs, ob*.mjs   표준(B) 파이프라인 (아래 5절)
tools/wdqa.mjs            상세 QA (가로스크롤·깨짐·콘솔, 8폭)
tools/pwdata.json, stddata-*.json     원본 실측 데이터(재생성용 보존)
```

**카드 링크**: 각 카테고리 페이지의 **첫 작품 행/카드만** 상세로 연결됨, 나머지는 자리표시자.
- works-photoworks.html 카드1 → flat-earther, works-motion.html 카드1 → overbloom
- works-branding/editorial/illustration/3d-tech.html 첫 cat-row → 각 대표

> **한 번 만들었다가 대표만 남긴 이유**: photoworks 18개를 전부 만들었으나, 사용자가
> "카테고리마다 하나씩"을 원해서 대표 1개(flat-earther)만 남기고 정리했다.
> 나머지 17개는 `node tools/pwgen.mjs` 로 즉시 재생성된다(데이터가 pwdata.json 에 있음).

**⚠️ 미완 see-more 링크** (전부 원본에 충실한 타깃이나 형제 상세가 아직 없음 → 404):
각 대표의 see-more 는 원본대로 이웃 작품 `work-<slug>.html` 을 가리키는데 그 상세들은 아직 없다.
(flat-earther→a-deeper, overbloom→in-between, dipsco→comotion·scad, wldr→hues·trybreathing,
a-trip→flavors·earthbound, venturi→hong-kong.) 형제 상세를 만들거나 카테고리 페이지로 돌리면 해소.

**주의 — 올리기 전 저장소가 Private 인지 확인.** 원작자 이미지·영상이 계속 늘어난다.

---

## 0-B. 스크롤 버벅임·back 고정 수정 (2026-08-01)

사용자 지적 두 가지를 원본 실측으로 바로잡았다. **원본 대조 근거 있음.**

### (000) 메인홈(index) 모바일 featured-works 이미지 크기가 원본과 달랐다 (2026-08-02)
사용자 지적: "메인홈 모바일 레이아웃이 원본과 다르다." 원본 대조(Playwright 375·430 캡처+실측):
- **hero·about 티켓은 원본과 일치.** 차이는 **featured works(3개) 이미지 크기**였다.
- 원본 featured 이미지 윈도우는 **폭 구간별로 다르다**(단일 aspect 불가). 실측:
  - 375: work1 343×236 / work2·3 343×320~284  → 데스크 설명 offset work1 tab+468, work2·3 +516
  - 430: work1 398×380 / work2 398×440 / work3 398×428 → 설명 offset 612/636/660
- 우리(전): `@media(max-width:600px)` 하나로 430값(398/380 등)만 둬서 **375 에서 이미지가 너무 컸다**
  (327/379/369). 게다가 `.work-content padding-top:192` 라 **콘텐츠 전체가 원본보다 24px 아래**
  (title offset 72 vs 원본 48)였다.
- 수정(`css/index.css`):
  1. `.work-content` padding-top **192→168** (title 을 tab+48 로, 원본과 일치. 24px 위로).
  2. featured 이미지 비율을 **두 브레이크포인트**로:
     `@media(max-width:600px)` = 398/380·398/440·398/428 (≈430),
     `@media(max-width:400px)` = 343/236·343/320·343/284 (375).
- 검증: 설명 offset 이 **375·430 전부 원본과 Δ=1px** (work1/2/3). 탭 겹침 없음.
  스크린샷(mc-*) 상 콜라주 이미지 크롭·높이가 원본과 일치. `tools/mcompare.mjs <W> <H>` 로 재비교 가능.
- (주의) 600~809 구간(태블릿 폭) featured 이미지는 이번에 안 건드림 — 필요 시 같은 방식으로 실측·보정.

### (000000) 메인홈 featured-works(폴더탭) — 이미지 높이·스크롤 인터랙션 원본 일치 (2026-08-02, 최종)
사용자: 폴더탭(featured works) 웹/태블릿/모바일 이미지 크기가 원본과 다르고 스크롤 인터랙션(탭 스택)도 다름.
**핵심(마침내 규명)**: 원본 featured 이미지 높이 = **`calc(100vh - 450px)`** (뷰포트 높이에 비례).
실측: 615×816→이미지 369, 768×1024→572. 즉 원본은 이미지를 뷰포트에 맞춰 **콘텐츠(고정 ~450 + 이미지)가
정확히 100vh** 가 되게 한다 → `.work{height:100vh}` **sticky 스택(폴더탭 누적)** 을 유지하면서도 설명이 안 잘린다.
- 그간의 삽질: 세로비율(폭비례로 부풀어 잘림) → 고정캡(너무 작음) → flow(스택 인터랙션 깨짐) → **calc(100vh-450) 정답**.
- 최종(`css/index.css` ≤809): `.work` base(sticky 100vh) 유지, `.work-content{absolute;inset:0}`,
  `.wm-main{ height: calc(100vh - 450px); object-fit:cover }`. 폰 ≤460 은 원본 세로비율(398/380 등) 유지.
- 검증: 이미지 375=236(포트레이트)/615=366/768=574 로 원본과 일치. **탭 스택 sticky=true(375·615·768 모두
  tab 144 고정) — 원본과 동일**. 설명 전 폭에서 완전 표시. mobqa 104조합 0. docH 문서값 유지.

### (00000) 메인홈(index) featured-works 중간폭 설명 잘림 (2026-08-02)
사용자 지적(스크린샷): 폴더탭(featured works) 설명이 잘리고 다음 섹션과 겹침. 창 폭 ~590-615px.
- 원인: featured 이미지 `@media(max-width:600px)` 세로비율(398/440 등)이 **폭에 비례해 부풀어**,
  590px 에서 work2 이미지가 617px 까지 커짐 → `.work{height:100vh}` sticky 안에서 설명이 넘쳐 잘림
  (600 경계에서 459→617 급점프). 원본은 이 구간 이미지 높이가 ~고정(desc offset 728→752 거의 불변).
- 수정(`css/index.css`):
  1. `@media(max-width:600px)` → **`@media(max-width:460px)`** 로 축소 + `.wm-main{height:auto}`
     (세로비율은 폰 375·430 에만 적용).
  2. `@media(max-width:809.98px) .wm-main` 을 aspect 대신 **`height: min(500px, calc(100vh - 440px))`**
     + object-fit:cover 로. 폭에 안 커지고 뷰포트 높이에 캡 → 짧은 창에서도 설명이 절대 안 잘림.
     (440 = work1 제목 2줄 최악 케이스 여유).
- 검증: desc offset 500~768 에서 697 로 일정(부풀림 제거). 짧은 뷰포트(780·800·816·820)에서
  work1/2/3 설명 전부 뷰포트 내 표시. 폰 375/430 Δ1px 유지. 이미지 정상 렌더(빈 화면은 `.appear`
  페이드가 rapid-scroll 캡처에서 미발동한 하네스 아티팩트). mobqa 104조합 0.
  (트레이드오프: 짧은 창에선 이미지가 원본보다 다소 짧아질 수 있으나 "설명 안 잘림"을 우선.)

### (0000) 메인홈(index) 섹션별 순차 QA — Header→Footer 원본 대조 (2026-08-02)
사용자 지시로 index 를 섹션 순서대로 원본과 실측 대조. 결과:
- **1 Header/Nav** ✅ nav x32/376/720/1064 y16, 로고 x16·MENU x325(375), 14px JetBrains Mono, 색 일치.
- **2 Hero** ✅ (**1건 수정**) left/right 문구·키체인(80vh=720, 중심 y90) 일치. **SCROLL DOWN 이 +8/+16px
  아래였음 → `.scroll-down bottom` 20→28(데스크톱)/60→76(≤809). 이제 1440·375 텍스트 하단여백 52/100 정확 일치.**
- **3 About 티켓** ✅ 좌 사진/우 About 2단·구분선·펀치홀·제목·사이클 커서·설명·좌표 일치(데스크톱·모바일).
- **4 Featured Works** ✅ 데스크톱 이미지 위치·크기(사이드 344×274, wm-main 656)·상대간격·탭스택·chips 일치.
  모바일은 (000)에서 Δ1px 로 수정 완료. (제목 폭 688 vs 720 은 체험판 폰트 메트릭 차이, 줄바꿈 동일.)
- **6 Footer** ✅ EMAIL/RESUME/wordmark(1376×108)/copyright/services x 위치 데스크톱 정확 일치, 모바일도 일치.
  (`.credit a` 는 inline 이라 rect h18 로 잡히나 텍스트 baseline 은 원본 h24 와 동일 — 비가시 차이.)
- **7 반응형/10 QA**: `mobqa.mjs` 104조합(8p×13vp) 문제 0(가로스크롤·깨짐·콘솔·메뉴). 375·430·768·1024·1440 대조.
- 원본이 Framer 라 hidden SSR 폴백(12px sans-serif blue)이 셀렉터에 잡히는 함정 있음 — 실측 시 폰트/가시성 필터 필요.

### (00) 메인홈(index) 푸터가 일반 스크롤이었다 → 고정 리빌로 통일 (2026-08-01)
사용자 지적: "푸터가 나타날 때 다른 페이지는 리빌인데 메인홈만 일반 스크롤. 동일하게, 푸터가
자꾸 달라지지 않게." 원본 대조 결과 **원본 홈도 고정 푸터 리빌**(servicesY 24 고정,
hero 가 마지막 ~900px 에서 -900 으로 걷힘)인데 **우리 index 만 푸터가 일반 흐름**이었다
(`<body>` 에 페이지 클래스·spacer 없음 → common.css `.footer{position:relative}` 그대로 스크롤).

원인 구조: 우리 index 는 `.hero`(sticky) + `.work`(sticky) **스택**이고 `.page-content{z-index:2}`
가 hero 위를 덮는다. hero 의 sticky 컨테이너가 `.page`(전체 5480) 라 **끝까지 y0 고정**돼
푸터가 드러날 자리가 없었다.

수정(**index 전용**, 다른 페이지 셸은 그대로):
- `index.html`: 스크롤 콘텐츠(hero+page-content)를 **`.reveal` 래퍼**로 감싸고, `footer` 를
  `.reveal` 밖으로 빼고, 그 사이에 `.page-spacer`(100vh) 추가. `<body class="home-page">`.
- `index.css`: `body.home-page{background:var(--footer-bg)}` / `.reveal{position:relative;z-index:1}`
  / `.home-page .footer{position:fixed;inset:0;z-index:0;height:100vh}` / `.page-spacer{height:100vh}`.
- 효과: hero 의 sticky 컨테이너가 `.reveal`(=콘텐츠 4580) 이 돼 **콘텐츠 끝(sy 3680)에서 해제**,
  마지막 900px 에서 hero 가 걷히고 spacer 구간에서 fixed 푸터가 드러난다 → 원본과 동일.
- 검증: docH 5480·maxY 4580 **불변**. servicesY 데스크톱 24 / 모바일·태블릿 8 로 **전 스크롤 고정**.
  스크린샷: 상단(hero)·중단(featured works)·리빌 전환·하단(푸터 완전 리빌) 모두 정상,
  1440·768·375 가로스크롤 0. sy 0~3680 구간은 이전과 픽셀 동일(hero 여전히 y0 고정).

### (0) 전역 스크롤 끊김 — Lenis 설정·body overflow 가 원본과 달랐다 (모든 페이지)
사용자가 "스크롤이 모든 페이지에서 뚝뚝 끊긴다"고 재지적. 원본 대조로 **전역 원인 3가지**를 찾음
(common.css/js 라 index·works·상세 전부에 적용). 원본 실측값과 나란히:

| 속성 | 원본 | 우리(전) | 수정 |
|---|---|---|---|
| body overflow | `visible/visible` | `hidden`→computed `hidden/auto` | **`overflow-x: clip`** (→ `clip/visible`) |
| html scroll-behavior | `auto` | `smooth` | Lenis 활성 시 `auto` 로 (아래 CSS) |
| Lenis 필수 CSS | 있음(`lenis-smooth`) | **없음** | 공식 CSS 추가 |

- **`body{overflow-x:hidden}`** 이 제일 컸다. hidden 은 `overflow-y` 를 auto 로 강제해 **body 가
  스크롤 컨테이너**가 되고, 고정 푸터가 있는 페이지에서 컴포지터(GPU) 스크롤 대신 **메인스레드
  스크롤**을 유발 → 끊김. `overflow-x: clip` 은 가로 오버플로는 그대로 막되 스크롤 컨테이너를
  안 만든다(→ `clip/visible`, 원본의 visible 과 동일하게 body 가 스크롤러가 아님). Lenis 는
  `rootElement.scrollTop` 에 쓰므로 스크롤러가 html 이어야 매끄럽다.
- **Lenis 필수 CSS 누락**. `common.css` 에 `html { scroll-behavior: smooth }` 만 있고 Lenis
  권장 CSS 가 없었다. Lenis 활성 시 `<html>` 에 `lenis` 클래스가 붙는다(우리 빌드는
  `lenis-smooth` 는 안 붙음) → `html.lenis { scroll-behavior:auto !important }` + `.lenis iframe
  { pointer-events:none }`(hero 영상 위에서 휠이 iframe 에 갇혀 멈칫하는 것 방지) 등 추가.
- **이미지 동기 디코딩**. 대형 원본이 스크롤 중 뷰포트에 들어올 때 메인스레드 디코딩으로 프레임
  드랍 → `common.js` 가 모든 `img` 에 `decoding="async"` 부여.
- 검증: `mobqa.mjs` 104조합 무회귀(가로스크롤·깨짐·오류 0). computed 확인: 3페이지 전부
  `body=clip/visible, scroller=HTML, scroll-behavior=auto`(원본과 동일 상태).
  **주의 — 이 환경은 headed(디스플레이) Playwright 가 안 떠 FPS 직접 측정은 못 했다.**
  구조 속성을 원본과 일치시키는 방식으로 맞췄다. 실제 체감은 사용자 브라우저에서 확인 필요.

### (1) 스크롤 버벅임 — 영상이 화면 밖에서도 전부 autoplay 였다
- **원본**: 상세의 `<video>` 는 `preload="none"` 이고 **뷰포트에 들어올 때만 재생**된다
  (measured: overbloom 영상 5개 전부 `paused=true, readyState=0` at top).
- **우리(전)**: 5개 전부 `autoplay loop muted` → 동시 디코딩으로 스크롤이 버벅였다.
- **수정**: HTML 영상에서 `autoplay` 제거 + `preload="none"`. `common.js` 에
  IntersectionObserver(`.wd-page .std-content video`, rootMargin 200px)로 **보이는 것만
  재생, 벗어나면 pause**. 로컬 영상은 overbloom(motion)만 있다(다른 B 는 이미지/임베드).
  `stdgen.mjs` 영상 템플릿도 갱신.

### (2) "SEE ALL … WORKS" back 이 스크롤하면 사라졌다 (템플릿 B)
- **원본**: 템플릿 B 는 **back 을 포함한 좌측 컬럼 전체가 sticky**(framer 컨테이너
  `position:sticky; top:0`). back 은 x32 **y80 에 고정**, 제목 y128, hero y128.
  스크롤해도 back·제목·메타가 안 움직인다(measured: scrollY 0/400/1200 전부 backY 80).
  **태블릿·모바일(≤1279)은 sticky 아님** — back 이 함께 스크롤(원본 실측 768: backY 80→-820).
- **템플릿 A(flat-earther/photoworks)는 원본도 back 이 스크롤과 함께 사라진다** → 그대로 둠.
- **수정**(work-detail-std.css + 5개 B HTML): `.wd-back` 을 `.std-meta`(sticky) **안으로**
  옮기고 `position:absolute; top:-48px`(메타 top 128 - 48 = **y80**)로 흐름에서 빼
  제목이 컬럼 top(y128)에 놓이게 했다. `.std-layout` 은 `padding-top:128px`
  (**margin 이면 부모 `.wd-scroll` 과 상쇄돼 흰 커버가 y128 부터 시작→상단 128px 에
  고정 푸터가 비친다**; padding 은 상쇄 안 됨 — 스크린샷으로 잡아낸 함정). ≤1279 에선
  back 을 `position:static` 으로 되돌려 원본처럼 스크롤되게 한다.
- **검증**: docH 전부 이전과 동일(1440 overbloom **8661** 유지, 8폭 가로스크롤·깨짐 0).
  `wdscroll.mjs` 로 데스크톱 back y80 고정(hero 가 -772 로 밀려도)·모바일 스크롤·영상
  lazy 재생 확인. 스크린샷(top vs scrolled)으로 좌측 컬럼 정지·상단 갭 없음 눈으로 확인.
  콘솔 오류는 Vimeo 401/유튜브 compute-pressure(임베드 기존 사항)뿐.

### 새 QA 도구
```bash
cd tools
node wdscroll.mjs work-<slug>.html   # back sticky(스크롤해도 y80) + 영상 lazy 재생 + 가로스크롤/오류
node wdshot.mjs   work-<slug>.html   # 스크롤 전/후 스크린샷 (diff/wd-top.png, diff/wd-scrolled.png)
```

---

## 1. 템플릿 지도 (조사 완료)

6개 카테고리에서 카드 링크를 수집한 결과 상세 페이지는 **37개**, 템플릿은 **2종**.

### A. photoworks 그룹 (18개) — masonry 갤러리 ✅ 틀 확립 (대표 flat-earther)
상단 메타(뒤로가기 / 제목 / 연도 / MODEL / 설명) + **3열 masonry 사진 갤러리** +
see more + **고정 푸터 리빌**. 사진만 다르고 틀은 전부 같다. → 3·4절.

### B. 표준 그룹 (19개) — 좌측 메타 컬럼 + 콘텐츠 블록 ✅ 틀 확립 (대표 overbloom)
motion·branding·editorial·illustration·3d-tech 의 상세. 좌측 sticky 메타 컬럼
(← SEE ALL X WORKS / 제목 / 카테고리 / 연도 / 설명) + 우측 풀폭 콘텐츠 블록 스택
(히어로 영상 임베드 · 이미지 · 텍스트 섹션). **콘텐츠 블록이 작업마다 다르다** (틀은 공유,
내용 가변). "그리드·스토리보드·프로덕션"처럼 보이는 건 대부분 **이미지·영상 안에 그려진 것**. → 5절.

> **docH 는 영상 lazy 로딩 탓에 처음엔 작게 잡힌다** (overbloom 이 7369→8661 로 커졌다).
> 실제: flat-earther 4508 / overbloom **8661**. 다른 것도 완전 로딩 후 재야 정확하다(5절 함정2).

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

## 3. flat-earther (photoworks 1호) — ✅ 완료 (2026-07-24)

확인된 값:
- 제목 [32,128,1376,56] **원본 정확 일치**
- 워드마크 y743 (고정 푸터 리빌) **원본 정확 일치**
- masonry 열 분배·순서 **원본 정확 일치** (아래 4절의 data-col 방식)
- 뒤로가기 "← SEE ALL PHOTOWORKS" 표시됨, 가로스크롤 없음, 콘솔 오류 0

**완료된 것:**
1. ✅ **헤더 nav 색** — `work-detail.css` `.wd-page` 헤더 반전 규칙 (motion-page 와 동일).
2. ✅ **see more 세로 여백** (2026-07-24) — docH 4740 → **4508 원본 정확 일치**.
   원본 실측으로 아래 수치 확정 (이전 문서의 "프리뷰 672x504" 는 **틀렸다** — 그건
   Framer 스크롤 transform 이 걸린 rect 였다. 실제 흐름 창은 **672x252**):
   - `.wd-seemore` margin-top **120** (갤러리끝 3016 → 제목 y3136)
   - `.wd-seemore-title` margin-bottom **32** (제목하단 3192 → 카드 top 3224)
   - 프리뷰 창 **폭×0.375 (8:3)** — 원본은 4:3 이미지가 parallax 로 스크롤하지만
     정지 기준 8:3 크롭 창(`aspect-ratio: 8/3`). 모든 폭에서 winH=winW×0.375 실측 확인.
   - `.wd-seemore-item span` margin-top **16** (창하단 → 항목제목 y3492)
   - `.wd-seemore` padding-bottom **80** (항목제목하단 3528 → 콘텐츠끝 3608 → docH 4508)

### photoworks 상세 실측값 (flat-earther, 1440)
```
여백 32
뒤로가기  ~32,92   14/24 mono uppercase
제목      32,128   48/56 Lock Serif Light
연도      32,208   14/24 mono / MODEL 32,232
설명      720,208  12/24 mono uppercase (우측 절반, grid 1fr 1fr gap24)
갤러리    3열 masonry 열폭 442.7 gap 24  (32 + 3*442.7 + 2*24 = 1408)
          **저자가 열을 수동 배치** → 각 img 의 data-col 로 재현 (4절)
see more  32,3136  48/56 / 프리뷰 창 672x252(8:3, =절반폭) / 항목제목 y3492 28/36 Lock Serif
푸터      고정 리빌 (워드마크 y743), docH = 콘텐츠 + 100vh
반응형    갤러리 3열(≥1280) / 2열(810~1279) / 1열(≤809)
```

---

## 4. photoworks 나머지 17개 — ✅ 완료 (2026-07-24). 자동 파이프라인

**18개 전부 원본과 masonry 픽셀 일치**(1440: docH·열개수·열바닥 전부 diff 0~1px).
104조합 QA(8폭) 가로스크롤·깨짐·콘솔오류 0. 카드 링크·see-more 링크 전부 유효.

`tools/` 에 파이프라인을 만들어 반복 가능하게 했다:
```bash
cd tools
node pwscrape.mjs <slug ...>   # 원본 스크랩 → pwdata.json 병합 (메타·갤러리·see-more·col)
node pwgen.mjs [<slug ...>]    # pwdata.json + META 로 이미지 다운로드 + work-<slug>.html 생성
node pwcmp.mjs <slug> 1440 900 # 원본 vs 구현 masonry 대조 (docH·열)
node wdqa.mjs work-<slug>.html # 상세 페이지 QA (가로스크롤·깨짐·콘솔, 8폭)
node pwinspect.mjs <slug>      # 원본 갤러리 구조 정밀 조사 (x,y,w,h,앵커)
node pwdom.mjs <slug>          # 원본 DOM 순서 + 실제 열 (알고리즘 판별용)
```

### 반드시 알아야 할 두 가지 (실측으로 밝혀낸 것)

**(1) masonry 는 알고리즘이 아니라 저자가 열을 수동 배치했다.**
- shortest-column-first 도 round-robin 도 **단일 규칙으로는 18개를 다 못 맞춘다**
  (speed-limit 은 round-robin, harder-than-steel 은 shortest-first 처럼 보인다).
- 그래서 데스크톱(1440) 3열에서 각 이미지의 **실제 열 인덱스를 그대로 캡처**해
  `<img data-col="N">` 로 박았다. `js/work-detail.js` 가 3열일 때 data-col 을 그대로 쓰고,
  2열/1열에서는 DOM(행 인터리브) 순서로 round-robin 재배치한다.
- HTML 갤러리 순서 = **행 인터리브**(col0[0],col1[0],col2[0],col0[1],...). 단순 y정렬은
  같은 행이라도 열마다 y가 달라 뒤집힌다(speed-limit 실증). pwscrape 가 열별 y정렬 후 인터리브.
- 원본 DOM 은 **열 우선**(col0 전부, col1 전부, col2 전부)이라 querySelectorAll 순서를
  그대로 쓰면 안 된다.

**(2) see-more 는 인접작 2개다 (이전 문서의 "다음작 1개" 는 불완전).**
- 중간 작업: **[왼쪽 x32 = 다음작, 오른쪽 x736 = 이전작]** 2개 나란히.
- 첫 작업(flat-earther): 다음작 1개만. 마지막(harder-than-steel): 이전작 1개만.
- 프리뷰 이미지는 대상작의 카테고리 썸네일(`images/photoworks-NN-<slug>.jpg`) 재사용.
- flat-earther 원본 see-more 는 매 로드마다 달라진다(랜덤). 첫 작업이라 다음작(a-deeper)로 고정.

### 각 페이지에 채운 것 (전부 원본 실측)
1. `<title>`·제목·연도·MODEL·설명 (설명은 CSS 로 대문자 표시)
2. 갤러리 `<img>` (width/height = 소스 원본 크기, data-col = 데스크톱 열)
3. see-more 1~2개 (다음작/이전작)
4. 뒤로가기 href = works-photoworks.html (전부 동일)

> 참고 — 아래는 초기 수동 조사용 스크립트 패턴이다. 지금은 위 파이프라인이 대신한다.

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
- [x] flat-earther.html — 완료 (헤더색·see more 여백 ✅, 2026-07-24) — **템플릿 A 대표**
- [x] **템플릿 A(photoworks) 검증** — 18개 전부 masonry 픽셀 일치(data-col), 메타·see-more(1~2개)
  원본 실측 후, **대표 1개(flat-earther)만 유지**하기로 결정(2026-07-24). 나머지 17개는
  `pwgen.mjs` 로 언제든 재생성(데이터는 `tools/pwdata.json` 에 18개 전부 보존).
- [x] photoworks 카드 링크 — flat-earther 만 work-flat-earther.html, 나머지 17개는 #photoworks 자리표시자
- [x] **템플릿 B(표준 그룹) — 5개 카테고리 대표 전부 완료** (2026-07-24). docH 전부 원본 일치.
  overbloom(motion) · dipsco(branding) · wldr(editorial) · a-trip(illustration) · venturi(3d-tech).
  `stdgen.mjs` 파이프라인으로 생성. 각 카테고리 첫 cat-row/카드 링크 연결.
- [ ] (선택) 표준 그룹 나머지 14개, photoworks 17개(pwgen), 미완 see-more 형제 상세.

### 템플릿 B: 표준 그룹 상세 (works/overbloom) — ✅ 완료
파일: `work-overbloom.html` / `css/work-detail-std.css` (work-detail.css 셸 재사용).
works-motion.html 카드 01 → work-overbloom.html 연결.

**구조 (원본 실측 1440, docH 8661 정확 일치):**
- 레이아웃 grid: `calc(25% - 32px) / 1fr`, column-gap 32, 여백 32
  (좌 = 25%(100vw-64)-32, 우 = 75%(100vw-64) — 3폭 실측: 1280:272 / 1440:312 / 1920:432)
- **좌측 메타 sticky** (top:128 → 제목이 viewport y128 고정): 제목 48/56 serif y128 /
  카테고리 14/24 mono y208(mt24) / 연도 14/24 mono y232 / 설명 12/24 mono y280(mt24)
- **우측 콘텐츠 = 풀폭 블록 세로 스택(gap 32)**, 총 11블록:
  히어로(Vimeo iframe 16:9) → 이미지2 → **텍스트 섹션** → 이미지 → 영상 → 이미지 →
  영상 → 이미지 → 영상3 → (see-more)
- **텍스트 섹션**: 우측 2/3(`margin-left:33.333%`). 문단2개(24/32 Lock Serif Light,
  문단간 mt32) + 크레딧(Tools/Guidance, 12/24 mono mt20).
- see-more: 672x252 창(photoworks 와 동일, `.wd-seemore` 재사용). 1개(첫 작품→다음작).
- 고정 푸터 리빌·헤더 반전·뒤로가기 = work-detail.css 셸 그대로.

**함정·교훈 (반드시 숙지):**
1. **"MOODBOARD / STORYBOARD / PRODUCTION / 스타일프레임 그리드"는 별도 섹션이 아니라
   이미지·영상 안에 그리드·캡션이 그려진 것**이다. 블록은 풀폭 이미지/영상 10개 + 텍스트뿐.
   (처음에 별도 섹션으로 오해했다 — 실제로는 overbloom-07.webp 가 PRODUCTION 그리드 이미지.)
2. **영상 lazy 로딩이 docH·블록 높이 측정을 오염**시킨다. 로딩 덜 되면 영상이 150 등으로
   잡혀 docH 가 7369→8230→8661 로 계속 커졌다. **끝까지 여러 번 스크롤 + 바닥 3초 대기 +
   img.complete 폴링** 후 측정할 것. OB_SH 영상은 150 밴드가 아니라 **전부 16:9(1032x581)**.
3. **히어로는 Vimeo 임베드** (`player.vimeo.com/video/1198874178`). 로컬 아님. headless/
   데이터센터 IP 에선 Vimeo 가 401("couldn't verify")로 막는다 — 콘솔 오류 1개는 이것이고
   **실제 브라우저에선 정상 재생**(원본도 동일). 로컬 호스팅하려면 Vimeo 다운로드 필요.
4. 나머지 영상 5개는 **Dropbox mp4** → `videos/works/overbloom-0N.mp4` 로컬 저장(H.264,
   full Chromium 디코드 정상). 이미지 5개는 `images/works/overbloom-0N.webp|png`.
5. 텍스트 섹션 문단이 **2개**다(긴 것 + 짧은 것). 첫 문단(224px)을 놓치면 이후 전부 255px 밀린다.

### 표준 그룹 5개 카테고리 대표 — ✅ 전부 완료 (stdgen 파이프라인)

overbloom(motion, 손빌드) 로 셸을 확립한 뒤, 나머지 4개는 **`stdgen.mjs` 로 반자동 생성**했다.
전부 원본과 docH 픽셀 일치: dipsco 8151 / wldr 12006 / a-trip 11692 / venturi 9900.

```bash
cd tools
node stddata.mjs <slug>   # 원본 실측 → stddata-<slug>.json (히어로·블록URL·기하·좌측메타·rtext)
# stdgen.mjs 의 CONFIG[<slug>] 에 메타·문단·크레딧·see-more 를 손으로 채운다
#   (제목·카테고리·연도·설명·문단은 원본 innerText 로 확인. 긴 문단은 stddata 가 놓치니 innerText 필수)
node stdgen.mjs <slug>    # 미디어 다운로드 + work-<slug>.html 생성
node wdqa.mjs work-<slug>.html   # QA
```

**stdgen 이 자동 처리하는 것:**
- 콘텐츠 블록 = stddata.blocks 에서 **메뉴 썸네일 6개(MENU_IDS) 제외**, x376(풀폭)/x636(중앙) 판별.
- 중앙 축소 블록(dipsco 512폭 등) → `.std-center` + `--w:폭%`.
- 히어로 임베드(Vimeo/YouTube) → `stddata.hero` 자동 사용(venturi=YouTube, overbloom=Vimeo).
- **텍스트 섹션 위치 = 블록 사이 첫 큰 간격(>150px)** 뒤. (스크랩 텍스트 y 는 긴 문단을 놓쳐 못 씀.)
- 텍스트 섹션 = 문단(24/32 serif) + 크레딧(12/24 mono). 둘 다 없으면 생략(wldr 은 문단만, venturi 는 둘 다).

**함정(표준 그룹 공통):**
1. 위 overbloom 함정 1~5 동일 (그리드/무드보드 등은 이미지 안, 영상 lazy 로딩, 히어로 임베드 등).
2. **긴 문단(>200자)을 stddata rtext 가 버린다.** 반드시 원본 `document.body.innerText` 로 문단 전문 확인.
   (venturi 는 문단 2개, wldr·a-trip 은 3개인데 stddata 는 0~1개만 잡았다.)
3. 좌측 메타 세로 리듬은 제목 줄수에 따라 자동(제목 아래 24 → 카테고리, +줄, 연도, +24 → 설명).
   CSS margin 이 처리하므로 제목이 여러 줄 wrap 해도 맞는다(venturi 4줄, dipsco 2줄).
4. see-more 는 인접작(다음/이전) 1~2개. 프리뷰는 대상작의 카테고리 썸네일(`images/<cat>-NN-*.jpg`) 재사용.
5. venturi 크레딧은 원본이 대문자 렌더인데 config 는 title-case 로 뒀다(사소한 차이, 원하면 대문자로).
