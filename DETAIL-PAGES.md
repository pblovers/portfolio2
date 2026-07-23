# 작업물 상세 페이지 — 인수인계

카테고리 페이지(works-motion 등)에서 카드를 누르면 나오는 **작업물 상세 페이지**를 만드는 작업.
다른 로컬에서 이 파일만 읽고 이어서 할 수 있게 정리했다.

> 프로젝트 전체 상태는 [HANDOFF.md](HANDOFF.md)·[NEXT.md](NEXT.md) 참고.
> 이 파일은 **상세 페이지 작업**만 다룬다.

원본: https://www.wildyriftian.com/works/<slug> (예: /works/flat-earther)

---

## 0. 지금 상태 (미커밋, 2026-07-24 갱신)

**두 템플릿의 대표 1개씩 완성.** 원본과 픽셀 대조 완료.

```
work-flat-earther.html       템플릿 A(photoworks) 대표 — 완성 (docH 4508 원본 일치)
work-overbloom.html          템플릿 B(표준=motion 등) 대표 — 완성 (docH 8661 원본 일치)
css/work-detail.css          A 셸 + photoworks 갤러리 CSS
css/work-detail-std.css      B 레이아웃 CSS (A 셸 재사용)
js/work-detail.js            masonry 분배 (round-robin + data-col, 3절·4절)
images/works/flat-earther-*  12장
images/works/overbloom-*     이미지 5장 (webp/png)
videos/works/overbloom-*     Dropbox 영상 5개 (mp4)
tools/pw*.mjs, std*.mjs, ob*.mjs, wdqa.mjs   조사·생성·대조 파이프라인
tools/pwdata.json            photoworks 18개 원본 데이터(대표만 남겼어도 재생성용으로 보존)
```

카드 링크: `works-photoworks.html` 카드1 → work-flat-earther.html (나머지 17개 #photoworks),
`works-motion.html` 카드1 → work-overbloom.html (나머지 2개 #works-motion).

> **한 번 만들었다가 대표만 남긴 이유**: photoworks 18개를 전부 만들었으나, 사용자가
> "카테고리마다 틀 하나씩"을 원해서 대표 1개(flat-earther)만 남기고 정리했다.
> 나머지 17개는 `node tools/pwgen.mjs` 로 즉시 재생성된다(데이터·이미지 URL 이 pwdata.json 에 있음).

**⚠️ 미완 링크 2개** (원본에 충실한 타깃이나 형제 상세가 아직 없음 → 404):
- work-flat-earther.html see-more → `work-a-deeper-dreamscape.html` (미제작)
- work-overbloom.html see-more → `work-in-between-ending-credits.html` (미제작)
데모용으로 카테고리 페이지로 돌리거나, 형제 상세를 만들면 해소된다.

**주의 — 올리기 전 저장소가 Private 인지 확인.** 원작자 이미지·영상이 계속 늘어난다.

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
- [x] **템플릿 B(표준 그룹) — motion(overbloom) 1개 완료** (2026-07-24). docH·블록 전부 원본 일치.
- [ ] 표준 그룹 나머지 (원할 때 카테고리별 대표 또는 전체) — **다음 작업**

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

**조사·대조 도구:** `tools/stdinspect.mjs` `stdmedia.mjs` `stddata.mjs`(원본 구조),
`obfetch.mjs`(미디어 다운로드), `obcmp.mjs`(블록 대조), `wdqa.mjs`(QA).

**표준 그룹 나머지 4개(branding/editorial/illustration/3d-tech)를 할 때:**
- 같은 셸·좌측 메타·레이아웃 공식을 그대로 쓴다. 카테고리명·연도·설명·뒤로가기 텍스트만 바뀐다.
- 우측 콘텐츠 블록은 **작업마다 완전히 다르다**(위 함정1처럼 이미지/영상에 다 들어있음).
  각 작업을 stddata 로 실측해 풀폭 블록 순서·크기·텍스트 섹션 위치만 뜨면 된다.
- see-more 는 인접작 2개 구조 재확인(overbloom 은 첫 작품이라 1개였다).
