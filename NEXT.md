# 다른 PC 에서 이어받기

이 파일만 읽고 바로 시작할 수 있게 정리했다.
**수치·구조·인터랙션 실측값은 전부 [HANDOFF.md](HANDOFF.md) 에 있다.**
이 파일은 "새 PC 에서 무엇부터 하나"만 다룬다.

---

## 0. 먼저 — 지금 작업이 커밋되지 않았다 (2026-07-24)

```
마지막 커밋: 656a17e "20260723수정본"
그 이후 미커밋: 수정 15개 + 새 파일 21개
원격: https://github.com/pblovers/portfolio2.git
```

이번 세션(07-24)에서 새로 한 것:
- **작업물 상세 6개 카테고리 대표 전부 완성** (템플릿 A 1 + 템플릿 B 5). docH 전부 원본 픽셀 일치:
  flat-earther(photoworks) · overbloom(motion) · dipsco(branding) · wldr(editorial) ·
  a-trip(illustration) · venturi(3d-tech). 각 카테고리 첫 카드/행 링크 연결.
  자세한 건 [DETAIL-PAGES.md](DETAIL-PAGES.md) (반드시 이걸 읽고 이어갈 것).
- 상세용 미디어(images/works, videos/works), 파이프라인(tools/pw*·std*·ob*·wdqa).

새 PC 로 넘기려면 둘 중 하나를 해야 한다.

**A. 원격에 올려서 clone (권장)**

```bash
git add -A
git commit -m "상세 페이지 템플릿 2종 대표(flat-earther, overbloom) 완성"
git push
```

> **올리기 전에 저장소가 Private 인지 확인할 것.**
> 원작자의 작품 이미지, 체험판 폰트(`LockSerifTRIAL`), 원작자 Dropbox 영상이
> 들어 있다. Public 이면 재배포가 된다.

**B. 폴더째 복사**

`node_modules/` 와 `tools/diff/` 는 빼고 복사해도 된다 (아래 2번에서 다시 만든다).
용량 대부분은 `images/`(약 40MB) 와 `videos/` 다.

---

## 1. 새 PC 준비

```bash
# 1) 저장소 받기
git clone https://github.com/pblovers/portfolio2.git
cd portfolio2

# 2) 검증 스크립트 의존성
cd tools
npm install
npx playwright install chromium

# 3) 확인 — 원본 접속이 되는지
node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch();
const p=await(await b.newContext()).newPage();
await p.goto('https://www.wildyriftian.com/works',{timeout:60000});
console.log('접속 OK', await p.title()); await b.close();})"
```

필요한 것: **Node 18 이상** (여기서는 v24.12.0 / npm 11.6.2 로 작업했다).

`tools/` 스크립트는 `root.mjs` 로 저장소 루트를 스스로 계산한다.
**폴더 이름을 바꾸거나 다른 위치로 옮겨도 경로를 손댈 필요가 없다.**
(현재 폴더명은 `portfolio2-new` 이고 `portfolio2` 로 바꿀 예정이라고 들었다 — 그대로 바꿔도 된다.)

---

## 2. 지금 상태

| 페이지 | 1440 픽셀차 | 상태 |
|---|---|---|
| `index.html` | 2.66% | 완료 |
| `works.html` | 0.25% | 완료 |
| `works-motion.html` | 1.37% | 완료 |
| `works-branding.html` | 0.71% | 완료 |
| `works-editorial.html` | 0.93% | 완료 |
| `works-illustration.html` | 2.30% | 완료 |
| `works-3d-tech.html` | 1.05% | 완료 |
| `works-photoworks.html` | 7.00% | 완료 (호버·스크롤 대조 끝, 잔차=리샘플링). 1024 푸터 워드마크만 별건 |

`mobqa.mjs` 8페이지 × 13뷰포트 = **104조합 문제 0개**
(가로스크롤·넘침·깨진이미지·콘솔오류·메뉴동작 전부 정상)

works 페이지에서 **6개 카테고리 전부 링크 연결됨.** 푸터 services 6개도 연결됨.

---

## 3. photoworks — 2026-07-23 조사·수정 결과

### 3-1. 모바일 카드 8px 위 — **수정 완료** (30.89% → 9.61%)

원본 375 divider y279 / 첫 카드 y304, 우리 divider y271 / 카드 y296 로
**둘 다 정확히 8px 위**였다 (제목판은 y200/h56 로 원본과 이미 일치).
원인: photoworks 모바일 divider 여백이 motion(15)과 다르다.

```
원본 375 실측:  제목 하단 256 → 구분선 279 → 첫 카드 304   (divider mt 23)
motion  375:    제목 하단 256 → 구분선 271 → 첫 카드 296   (divider mt 15)
```

`.m-body-head` 는 auto 높이라 divider 를 8px 내리면 제목판이 88→96 이 되고,
카드판(`.m-body-cards` 겹침 -8 / pt 32)이 물려 296→304 로 함께 내려온다.
`css/works-photoworks.css` 모바일 블록에 한 줄:

```css
.pw-page .m-divider { margin-top: 23px; }   /* motion 은 15 */
```

375·430·768 전부 divider 279 / 카드 304 로 원본 일치. 흰 띠 seam 없음(다크 테마).

### 3-2. 사진 크롭 — **크롭 버그가 아니다** (원래 문서의 가설이 틀렸다)

원본 CDN 카드의 natural 비율은 소스와 **같다** (실측: card1 380×570 = 0.667,
소스 2000×3000 = 0.667). fit·object-position(50% 50%)·창(380×285)도 우리와 동일.
카드1 크롭을 세로로 밀어 정렬 오차를 재보면 **최적이 dy 0~1px** = 크롭이 이미 일치.
→ 4:3 재크롭 같은 건 필요 없다. (branding 표 프리뷰의 4:3 재크롭과는 다른 문제다.)

남은 7.00%(1440)/9.61%(375) 는 **리샘플링 잔차**다. 원본은 CDN 이 380px 급으로
줄인 변형을 받고 우리는 2000px 원본을 브라우저가 줄인다.

> **srcset 축소본을 만들어도 안 줄어든다 (실측).** card1 을 canvas 로 380·760px 로
> 미리 줄여 렌더해도 원본 대비 meanAbsDiff 가 full 35.89 / w760 35.75 / w380 36.91 —
> 사실상 개선 없음. 원본도 결국 브라우저가 570→285 로 한 번 더 줄이므로 3000 에서
> 줄이나 760 에서 줄이나 최종 285px 결과가 거의 같다. HANDOFF 9절이 "srcset 으로
> 맞춘다"고 한 것도 이 실측으로 반증됐다. **구조는 맞고 잔차는 못 줄인다 — 두면 된다.**

### 3-3. 호버 인터랙션 — **구현 완료**

원본 실측(1440): 호버 시 이미지가 **1.15배**로 커진다 (380×285 → 437×327.9).
motion 카드와 마찬가지로 **고정 창(380×285, overflow:hidden) 안에서 중심 기준 확대**다
(내가 처음에 "셀 밖으로 넘친다"고 본 건 잘못된 부모를 본 것 — 실제 클립 창은
`framer-s4kytg` 로 창은 그대로다). 곡선은 Framer Motion(JS) tween 이라 CSS 에 안 잡히지만
rAF 로 재보니 **약 400ms ease-in-out** (25% 0.106 / 50% 0.473 / 75% 0.858).

```css
.pw-shot img { transition: transform 0.4s ease-in-out; }
.pw-card:hover .pw-shot img { transform: scale(1.15); }
```

호버 스크린샷 대조(카드1): scale·중심·클립 일치. 남은 잔차는 유휴 리샘플링과 같은 수준
(정렬 후 meanAbsDiff 23, 유휴 19.5). 원본이 창 중심에서 ~4px 좌·3px 상을 기준으로
확대하는 미세 오프셋이 있으나 뷰포트/카드마다 흔들리는 Framer 노이즈라 origin 은
center 유지. `제목·번호·이웃 카드는 안 변한다.

### 3-4. 스크롤 거동 — **확인·수정 완료** (스크린샷 대조)

works-motion.css 구조를 물려받아 대부분 이미 맞았다. 실측/대조 결과:

```
제목 sticky   데스크톱(≥1280): titleY 136 유지 scrollY~2000 → 이후 해제. 원본 일치.
              태블릿·모바일: sticky 아님, 1:1 (sy0 t200 / sy300 t-100 / sy900 t-700). 일치.
고정 푸터     워드마크 스크롤 무관하게 고정 (1440 y743). 리빌 정상. docH 3674 일치.
```

**수정한 것 — 데스크톱 sticky 제목판 흰 배경.** photoworks 는 카드 18장이라 제목이
오래 붙어 있는데, `.m-head` 상단 80px(padding) 이 투명이라 뒤로 지나가는 카드가
비쳐 올라왔다. 원본은 제목판 bg 가 #fff (섹션색). `@media (min-width:1280px)` 로
`.pw-page .m-head { background:#fff }` 추가 (모바일은 섹션이 다크라 주면 안 됨).
scroll 900 스크린샷: 탭 위 흰색·카드 비침 제거로 원본과 일치.

> **미해결(범위 밖) — 태블릿 1024 푸터 워드마크 y**: orig 810 / mine 776 (34px).
> 호버·스크롤과 무관한 기존 `fitWordmark()`(HANDOFF 5절) 문제. 리빌 자체는 정상.
> `footdiff.mjs works-photoworks 1024 900` 로 따로 볼 것.

---

## 4. 자주 쓰는 검증 명령

```bash
cd tools

# 페이지별 픽셀 대조 (원본 vs 구현, 스크롤 0)
node idxdiff.mjs 1440 900              # index
node pixdiff.mjs 1440 900              # works
node mdiff.mjs   1440 900              # works-motion
node catdiff.mjs works-branding 1440 900   # 카테고리 (slug 를 바꿔서)

# 푸터 (스크롤 끝) — 스크롤 0 대조로는 푸터를 한 번도 안 본다
node footdiff.mjs motion 1440 900

# 전체 QA (원본 불필요) — 8페이지 x 13뷰포트
node mobqa.mjs

# 호버
node hovpix.mjs motion HOME 1440 900 900 top   # 호버 상태 픽셀 대조
node hovfull.mjs works 300 560                 # 좌표 호버 후 전체 화면 대조
node hoverall.mjs                              # 폴더 호버 동작

# 실측
node catprobe.mjs works-branding 1440 900   # 카테고리 표 레이아웃
node panelcmp.mjs 1440 900                  # works-motion 회색 패널
node msweep.mjs                             # 6개 데스크톱 폭에서 원본 실측
node rollcurve.mjs both                     # roll 애니메이션 곡선
node introcurve.mjs orig 1440 900           # works 폴더 진입 곡선
```

`diff/` 에 `*-orig-*.png` / `*-mine-*.png` / `*-diff-*.png` 가 떨어진다.
**숫자만 보지 말고 diff 이미지를 열어서 볼 것** — `#f5f5f5` 와 `#fff` 는
차이가 10 이라 허용오차 12 짜리 대조에 안 잡힌다. 이 함정으로 흰 띠를
두 번 놓쳤다 (HANDOFF 6절).

---

## 5. 작업할 때 지킬 것

1. **감으로 고치지 말 것.** 반드시 원본을 Playwright 로 다시 재고 근거를 남긴다.
   HANDOFF 의 수치는 전부 실측값이다.
2. **한 폭만 보고 상수로 단정하지 말 것.** 데스크톱 값 상당수가 폭 비례였다
   (탭 폭 `25vw-32`, 영상 `31.25vw-60`, 행 높이 `폭/8`). `msweep.mjs` 로 6개 폭을 재라.
3. **고쳤으면 회귀를 돌릴 것.** 공용 CSS(`common.css`)를 건드리면 3페이지가 같이 움직인다.
4. **CSS/JS 파일은 CRLF 다.** node 스크립트로 문자열 치환할 때 `\n` 만 쓰면
   조용히 실패한다. 편집기로 고치는 편이 안전하다.
5. 원본 사이트가 **간헐적으로 타임아웃**난다. 실패하면 재시도하면 된다.

---

## 6. 남은 큰 작업

- 🔨 **작업물 상세 페이지 (진행 중, 2026-07-23~24)** — 카테고리 카드 → 상세 페이지.
  37개, 템플릿 2종. **템플릿 2종 대표 완성**(work-flat-earther.html=A, work-overbloom.html=B).
  **이어서 하려면 → [DETAIL-PAGES.md](DETAIL-PAGES.md) 를 먼저 읽을 것.**
  - 다음 할 일 후보: 표준 그룹 나머지 4개(branding/editorial/illustration/3d-tech 대표),
    또는 photoworks 17개 재생성(`node tools/pwgen.mjs`), 또는 미완 see-more 링크 2개 처리.
- ✅ **스크롤·호버 인터랙션 (2026-07-23 완료)** — Lenis 스무스 스크롤, 헤더
  hide-on-scroll, 카테고리 좌측 열 sticky 65vh, cat-row 호버 프리뷰 4:3.
  전역(common) 을 건드렸으니 회귀는 `mobqa.mjs`. 상세는 HANDOFF 13절.
- 카드 링크: motion 카드1·photoworks 카드1 은 상세로 연결됨. 나머지 카드는 아직
  `#works-motion` / `#photoworks` 자리표시자(해당 상세 미제작). 상세를 만들면 그 카드도 연결.
- 카드 사진 리샘플링: 원본은 CDN 축소본을 쓰고 우리는 원본 크기를 브라우저가 줄인다.
  ~~맞추려면 폭별 축소본을 만들어 `srcset` 을 붙여야 한다~~ →
  **photoworks 로 실측해보니 srcset 축소본으로도 안 줄어든다** (3-2 참고).
  원본도 브라우저가 다시 줄이므로 최종 결과가 거의 같다. motion 카드도 같을 가능성이 높다.
