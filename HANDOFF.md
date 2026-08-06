# wildyriftian.com 클론 — 인수인계

원본: https://www.wildyriftian.com (Framer 제작)

> 새 PC 에서 이어받는다면 [NEXT.md](NEXT.md) 를 먼저 읽을 것.

수치는 전부 **원본을 실측한 값**이다. 감으로 넣은 값이 아니므로
바꾸기 전에 반드시 원본을 다시 재고 근거를 확인할 것.

---

## 1. 현재 상태

| 페이지 | 상태 | 1440 픽셀차 | 비고 |
|---|---|---|---|
| `index.html` | 완료 | **2.66%** | |
| `works.html` | 완료 | **0.25%** | 폴더 진입 애니메이션·고정 푸터 리빌 포함 |
| `works-motion.html` | 완료 | **1.37%** | 카드 3열 |
| `works-branding.html` | 완료 | **0.71%** | 표 레이아웃 (12절) |
| `works-editorial.html` | 완료 | **0.93%** | 표 레이아웃 |
| `works-illustration.html` | 완료 | **2.30%** | 표 레이아웃 |
| `works-3d-tech.html` | 완료 | **1.05%** | 표 레이아웃 |
| `works-photoworks.html` | 완료 | **7.00%** | 다크 테마 카드 18장. 잔차=리샘플링. 호버·스크롤 대조 끝 |

`mobqa.mjs` 104개 조합(8페이지 × 13뷰포트) **문제 0개**
— 가로스크롤·넘침·깨진이미지·콘솔오류·메뉴동작 전부 정상.

works 페이지에서 **6개 카테고리 전부 링크 연결됨** (푸터 services 6개도).
원본은 motion 하나만 링크하지만 요청에 따라 전부 연결했다.

### works-motion 폭별 픽셀차 (스크롤 0)

```
1920  1.82%    (이전 8.18%)
1440  1.38%    (이전 4.08%)
1280  1.16%    (이전 5.09%)
1024  2.42%    (이전 11.68%)
 768  3.56%
 430  1.38%
 375  5.91%   ← 이 중 95.8% 가 카드 사진 내부다. 사진 밖은 753px = 0.25%
```

### 푸터 (스크롤 끝 대조 — `footdiff.mjs`)

3페이지 모두 약 3.1%. 그중 **72% 가 흔들리는 키체인**이고,
키체인을 뺀 나머지는 **0.89%** 다. 키체인은 원본이 Framer Motion(JS)으로
흔들어서 프레임을 맞출 수 없다 (아래 9절).

### 남은 일

0. 🔨 **작업물 상세 페이지 (2026-07-23~24)** — 카테고리 카드 → 개별 상세.
   **6개 카테고리 대표 상세 전부 완성**(템플릿 A 1 + B 5, docH 전부 원본 일치):
   flat-earther(photoworks) · overbloom(motion) · dipsco(branding) · wldr(editorial) ·
   a-trip(illustration) · venturi(3d-tech). 각 카테고리 첫 카드/행만 링크됨.
   **이어서 하려면 반드시 → [DETAIL-PAGES.md](DETAIL-PAGES.md) 를 먼저 읽을 것.**
   (남음: 표준 나머지 14개, photoworks 17개 재생성, 미완 see-more 형제 상세 9개.)
1. **photoworks** — [NEXT.md](NEXT.md) 3절에 조사·수정 결과 기록 (2026-07-23).
   - ✅ 모바일 카드 8px 위 → `.pw-page .m-divider{margin-top:23px}` 로 수정 (30.89%→9.61%)
   - ✅ 사진 크롭: **크롭 버그 아님** (크롭 이미 일치). 7.00% 는 리샘플링 잔차이고
     srcset 으로도 안 줄어든다 (실측). 두면 된다.
   - ✅ 호버 구현 — 고정 창 안에서 이미지 scale(1.15), 400ms ease-in-out (NEXT 3-3)
   - ✅ 스크롤 대조 — 데스크톱 sticky 제목판 흰 배경 추가로 카드 비침 제거 (NEXT 3-4)
   - ✅ (별건) 태블릿 1024 푸터 워드마크 y 34px 차 — **fitWordmark 문제가 아니었다.**
     태블릿 고정 푸터 박스를 뷰포트 위(top:0)에 붙여 놓은 게 원인이고,
     원본처럼 아래(bottom:0)에 붙이니 저절로 맞았다 (orig 810 / mine 811).
     2026-08-05 수정, 아래 "태블릿 고정 푸터" 절 참고.
2. 카드 링크가 대부분 `#works-motion` 자리표시자다. 원본은 `./works/overbloom` 등
   개별 상세로 간다. **motion 카드1·photoworks 카드1 은 상세로 연결됨**(위 0번), 나머지는 미제작.
3. 카드 사진은 원본이 CDN 축소본(데스크톱 322x242)을 쓰고 우리는 2000px
   원본을 브라우저가 줄인다. 소스 파일 자체는 원본과 동일한 크기다
   (2000x1504 / 1870x1120). 맞추려면 srcset 용 축소본을 만들어야 한다.

> **주의 — 이전 인수인계의 틀린 내용을 이번에 바로잡았다.**
> - 워드마크는 `scaleX` 가 아니라 **균일 스케일**이다 (5절).
> - 모바일은 리빌 없는 정상 흐름이 아니라 **모바일도 고정 푸터 리빌**이다 (6절).
> - 데스크톱 수치(탭 폭·영상 크기·흰 커버 높이)는 상수가 아니라 **폭 비례**다 (6절).
> - 뒤로가기 화살표는 유니코드 `←` 가 아니라 ASCII `<-` 두 글자다 (6절).

---

## 2. 파일 구조

```
portfolio2/
├── index.html            메인
├── works.html            카테고리 목록 (폴더 탭 6개)
├── works-motion.html     카테고리 상세 (외 works-branding/editorial/photoworks/illustration/3d-tech)
├── work-flat-earther.html  작업물 상세 — 템플릿 A(photoworks)  ← DETAIL-PAGES.md
├── work-overbloom.html     작업물 상세 — 템플릿 B(표준 그룹)   ← DETAIL-PAGES.md
├── css/
│   ├── common.css        폰트·토큰·리셋·헤더·메뉴·키체인·푸터·awwwards·appear
│   ├── index.css         히어로·about 티켓·featured works
│   ├── works.css         Works/Archive 탭·폴더 6개
│   ├── works-motion.css  카테고리 상세 (works-category.css·works-photoworks.css 도 있음)
│   ├── work-detail.css      상세 A 셸 + photoworks 갤러리
│   └── work-detail-std.css  상세 B 레이아웃 (A 셸 재사용)
├── js/
│   ├── common.js         메뉴 오버레이, WR.appear(), 워드마크 fit, Lenis, 헤더 hide
│   ├── index.js          히어로 패럴랙스, 티켓 사이클
│   ├── works.js          폴더 호버 커서 드리프트
│   └── work-detail.js    photoworks masonry 분배 (round-robin + data-col)
├── images/               원본에서 받은 이미지 전부
│   └── works/            상세 갤러리 이미지 (flat-earther-*, overbloom-*)
├── videos/motion-tag.mp4 works-motion 좌측 태그 (외 category-tag 들)
│   └── works/            상세 영상 (overbloom-* = Dropbox mp4)
├── fonts/                Lock Serif, Biro Script, JetBrains Mono
└── tools/                검증·조사·생성 스크립트 (README.md, DETAIL-PAGES.md 7절)
```

CSS 로드 순서는 항상 `common.css` → 페이지별 CSS.

### 왜 공통 + 페이지별로 쪼갰나

헤더·푸터·메뉴 오버레이·키체인·roll 링크는 3개 페이지가 **똑같이** 쓴다.
페이지마다 복사해두면 5절의 함정들을 한 곳만 고치고 나머지를 놓친다.
반대로 한 파일에 다 넣으면 `works.css` 의 `.wf:hover` 디밍이 index 티켓에
영향을 주는지 매번 확인해야 한다. 지금 구조는 로드 순서가 고정이라
특정성 사고가 예측 가능하다. **되돌리지 말 것.**

---

## 3. 브레이크포인트 — 810px 이다

원본을 1280~768 사이로 훑어 확인한 값이다. **1280 이 아니다.**
index·works·works-motion 전부 810 에서 전환한다.

```
1280 이상    데스크톱
810 ~ 1279   태블릿   헤더는 데스크톱 4열 nav 유지, 여백 32
809 이하     모바일   헤더 로고+MENU, 여백 16
```

단 **works-motion 의 태그 영상만 1280 기준**이다 (아래 6절).

---

## 4. works 페이지 실측값

### 폴더 배치

```
데스크톱   박스 top = 100% - 388,  높이 148, 행 간격 130
태블릿     박스 top = 100% - 444,  높이 156, 행 간격 148
모바일     박스 top = 100% - 624,  높이 112, 행 간격 104, 1열
           섹션 min-height 856 (375px 에서 문서 높이 1668 = 856 + 812)
```

`100%` 는 `.wsec` 높이. `100vh` 가 아니라 `%` 를 써야 min-height 가 걸려도 따라간다.

### 열 분할

```
데스크톱   1·3행 50/50,  2행 editorial 38% / photoworks 62%
태블릿     1·3행 50/50,  2행 editorial 42.857vw + 9.15px / 나머지 (3:4)
```

### 탭 스트립

```
높이 40, 박스보다 39px 위, 좌상단 radius 6px
계단(::after)  40x40 사다리꼴, clip-path: polygon(0 0, 2px 0, 100% 100%, 0 100%)
               ※ 직각삼각형이 아니다. 원본은 상단이 2px 다.

폭  데스크톱   25vw - 32   / editorial 25.33vw - 42.6 / photoworks 24.8125vw - 25.8
    태블릿     25vw - 16   / editorial 21.43vw - 11.4 / photoworks 28.57vw - 20.6
    모바일     66.686vw - 21.45
```

### 번호 위치 (스트립 기준 오프셋)

```
데스크톱   x 32, y 16 (하단 정렬)
태블릿     x 16, y  8 (중앙),  단 06 만 y 16
모바일     x 16, y  8 (중앙)
```

### 폴더 색

```
              데스크톱   태블릿·모바일
motion        #ffe430    #ffe430
branding      #d9d9d9    #d9d9d9
editorial     #d9d9d9    #f5f5f5   ← 구간마다 다르다
photoworks    #ababab    #ababab
illustration  #ffe430    #ffe430
3D tech       #d9d9d9    #d9d9d9
```

`--own` 에 고유색을 두고 `--wf-bg: var(--own)` 으로 칠한다.
`--wf-bg` 를 직접 덮으면 `.wfolders:hover .wf:hover`(0,4,0) 에 밀린다.

### 그림자

```
데스크톱   스트립 전부 없음 / 1행 본문 없음 / 2·3행 본문 0 -4px 20px rgba(38,34,21,.1)
태블릿·모바일
           1번(motion)   스트립·본문 모두 없음
           2~5번         스트립·본문  0 -1px 2px rgba(0,0,0,.1)
           6번(3D tech)  스트립 없음, 본문 0 -4px 20px rgba(38,34,21,.1)
```

`.wf-tab` 은 `z-index: 2`, `.wf-body` 는 `1`.
같은 값이면 본문 그림자가 자기 스트립을 덮어 어두워진다.

### 호버 (데스크톱 전용)

```
호버한 폴더        12px 상승, 고유색 유지
나머지 폴더 전부   배경 #f5f5f5, 제목·번호 #d9d9d9 로 디밍
썸네일             200x200, -15° / -5° / +6° 회전
                   중심 x 고정, y 만 -177 / -137 / -167 이동
                   중립 상태에서는 opacity 0 (폴더 뒤 z0 에 있어 안 보임)
```

**태블릿·모바일은 호버 효과가 전혀 없다.** 터치 기기는 탭 후 `:hover` 가
남아 폴더가 흐려진 채 고착되므로 반드시 꺼야 한다.

호버 중에는 **모든 폴더의 그림자를 끈다** (원본 실측 `rgba(38,34,21,0) 0 0 0`).
켜둔 채로 두면 디밍된 폴더 경계마다 세로 6px 그라데이션 띠가 남는다.

### 진입 애니메이션 — 새로고침하면 폴더가 올라온다

원본을 rAF 로 프레임마다 재서 얻은 값이다 (`introcurve.mjs`).

```
페이드 없음        opacity 는 처음부터 끝까지 1
곡선               340ms cubic-bezier(0.34, 1, 0.25, 1.06)  ← 1.5% 오버슈트
                   (motion: 880 → 514.6 까지 갔다가 520 으로 안착)
간격               100ms, 아래 행부터 한 장씩
순서               illustration → 3D tech → photoworks → editorial → motion → branding
올라오는 거리       1행 360 / 2행 240 / 3행 360
                   (출발 y 880 / 890 / 1140 → 도착 520 / 650 / 780)
Works·Archive 제목  애니메이션 없음 (첫 프레임부터 제자리)
```

- `fill-mode` 는 반드시 **backwards** 다. `forwards` 면 끝난 뒤에도
  `translateY(0)` 이 남아 호버 상승(-12px)을 덮어버린다.
- `WR.appear` (opacity 0 → 1) 를 쓰면 안 된다 — 원본에는 페이드가 없다.

### 스크롤 — works 도 고정 푸터 리빌이다

```
푸터        position: fixed; inset: 0; z-index: 0
흰 섹션     z-index: 1, 100vh — 위로 밀려 올라가며 푸터를 드러낸다
스페이서    100vh (.wsec-spacer)
docH        흰 섹션 + 100vh   (1440x900 → 1800, 375x812 → 1668)
body 배경   var(--footer-bg)  ← #fff 로 두면 걷힌 자리가 하얗게 남는다
```

근거: 스크롤을 아무리 내려도 원본 워드마크가 뷰포트 y743(1440x900) /
y705(375x812) 에 **고정**돼 있다. 모바일도 같다.

### 폴더 링크

원본에서 실제로 연결된 폴더는 **motion 하나뿐**이다 (`href="./works-motion"`).
나머지 5개는 원본도 아직 링크가 아니다.

---

## 5. 공통 컴포넌트

### roll 링크 호버

글자는 제자리, **배경만 아래에서 위로 차오르며** 글자색이 반전된다.

```
.roll-box::before  translateY(100%) → 0
어두운 면  bg #f5f5f5 / 글자 #212121
흰 면      bg #212121 / 글자 #f5f5f5   (works·motion 헤더)
```

### 화살표

```
글자 + 6px + 화살표
VIEW PROJECT   100.8 + 6 + 16.8 = 123.6
SEE ALL WORKS  109.2 + 6 + 16.8 = 132
```

마크업에 공백 문자를 넣지 말고 `.arr { margin-left: 6px }` 로 띄운다.
works-motion 의 `SEE ALL WORKS` 만 **화살표가 글자 앞**에 온다.

> **원본 화살표는 유니코드 `←` 가 아니라 ASCII `<-` 두 글자다.**
> JetBrains Mono 가 `<-` 를 긴 화살표 합자로 그린다. 자연폭이 8.4x2 = 16.81 이라
> 폭 고정(`width:16.8px`)도 필요 없다. `←` 한 글자는 advance 가 8.4 뿐이라
> 앵커 총폭이 132 → 123.6 으로 줄고 글리프 모양도 짧아 전혀 다르다.

> **뒤로가기 호버**: 화살표는 제자리, **글자가 6px 밀려난다** (앵커 132.02 → 138.02).
> `.arr-back { margin-right: 6px → 12px }` 로 낸다. 화살표를 옮기면 폭이 안 변한다.
> `.arr` 클래스를 같이 갖고 있으므로 `transform: none` 으로
> common.css 의 `a:hover .arr { translateX(5px) }` 를 반드시 취소해야 한다.

### 푸터 워드마크 — **균일 스케일**이다 (이전 문서의 scaleX 는 틀렸다)

원본은 워드마크를 `<svg viewBox>` + `<foreignObject>` 로 감싼다.
안쪽 `<p>` 는 고정 119.539px / line-height 95.6315px 이고, **뷰박스가 가용폭에
맞춰 늘어나므로 가로·세로가 같은 비율로 커진다.**

```
높이 = 96 x (가용폭 / 자연폭 1216.11)
  1440 → 1376/1216.11 = 1.1314 → 108.63
  1024 →  960/1216.11 = 0.7894 →  75.78
   768 →  736/1216.11 = 0.6052 →  58.09
```

- `scaleX` 만 주면 폭은 맞지만 높이가 95.63 에 고정돼 자모 비율이 틀어진다.
- `common.js` 의 `fitWordmark()` 가 자연폭을 재서 `scale()` 을 직접 준다.
  동시에 `--wm-h`(= 96 x 배율)와 `--wm-slack`(= 0.3685 x 배율)을 넘긴다.
  - `--wm-h`: 워드마크 위의 링크 행 위치가 여기에 딸려 온다
    (`.footer-links { bottom: calc(56px + var(--wm-h)) }`). 165px 고정은 1440 전용.
  - `--wm-slack`: `<p>`(95.6315)가 96 짜리 foreignObject 안에 위쪽 정렬이라
    글자 상자 하단이 svg 하단보다 그만큼 위다. 안 빼면 y 가 0.42~0.56 어긋난다.
- **`opacity: .5` 필수.** 원본은 svg 에 걸어둔다. `#ababab`(171)를 푸터
  `#202020`(32) 위에 반투명으로 얹어 102 로 보인다. 없으면 눈에 띄게 밝다.
- `scaleX(calc(길이 / 길이))` 는 **유효하지 않다.** scaleX 는 무단위 수를
  받는데 CSS calc 는 길이÷길이를 수로 못 만든다. 무시되고 transform:none 이 된다.

### 푸터 하단 밴드 — 아래에서부터 쌓인다

```
데스크톱·태블릿   padding16 + copyright24 + 간격8 + 워드마크 + 간격8 + 링크행
모바일            padding16 + copyright/credit 2행 48 + 간격16 + 워드마크 + 간격16 + 링크 4행 96
```

- `.footer-bottom` 은 **`.footer-links` 와 같은 4열 그리드**다.
  copyright 가 1열, credit 이 4열(`grid-column: 4`).
  `space-between` 으로 두면 credit 이 오른쪽 끝까지 밀려 152px 어긋난다.
  (1440 실측: 셀폭 344, credit 셀 x1064, `SURD.STUDIO` 리프 x1156)
- `.services` 열 간격 **30**(40 아님), 행 간격 5, 번호와 글자 사이 **8**(6 아님).
  6 이면 항목마다 2px 좁아져 행 전체가 밀린다.
- `.footer-keychain` 상단 = **`calc(13vh + 4px)`**. 4개 높이에서 정확히 맞는다
  (700→95 / 800→108 / 900→121 / 1200→160). 120px 고정은 900 전용이었다.

**이런 버그가 오래 안 잡힌 이유**: `pixdiff`/`idxdiff`/`mdiff` 는 **스크롤 0 만**
찍는다. index·works 는 그 시점에 푸터가 화면 밖이라 비교 대상에 아예 없었다.
0.25% 통과는 푸터를 본 적이 없다는 뜻이다.
→ **푸터를 건드렸으면 `footdiff.mjs` 로 스크롤 끝에서 반드시 대조할 것.**

### 인터랙션 — 원본을 실측해서 맞춘 값

호버는 계산된 스타일만 보면 안 된다. roll 은 ::before 로 움직여서
computed style 에 안 잡히므로 **호버 상태를 픽셀로 찍어 비교**해야 한다
(`hovpix.mjs`). 애니메이션 곡선은 화면 캡처 지연이 커서 못 믿는다 —
페이지 안에서 rAF 로 프레임마다 읽어야 한다 (`rollcurve.mjs`).

| 대상 | 원본 동작 | 틀렸던 구현 |
|---|---|---|
| roll 링크(헤더·푸터) | 어두운 상자가 올라오며 **반전 글자를 아래에서 위로 와이프**. 글자는 제자리 | 배경만 올리고 글자색을 페이드 → 전환 중간이 회색으로 섞임 |
| roll 곡선 | 475ms `cubic-bezier(.2,.2,.1,1)` (실측 33ms 0.117 / 100ms 0.519 / 300ms 0.934) | 0.4s ease-in-out (앞이 느림) |
| 화살표 링크 | 글자·화살표 간격이 **6 → 12** 로 벌어져 앵커 폭이 6px 늘어난다 | `translateX(5px)` — 화살표만 움직이고 폭이 안 변함 |
| 카드 호버(motion) | 틀(overflow:hidden) 안에서 이미지 `scale(1.15)` | 이미지·제목 디밍 |
| 폴더 호버(works) | 썸네일은 **완전히 정지** (3.5초 재봐도 소수점까지 고정) | 커서 드리프트 + 유휴 부유 → 최대 25px 어긋남 |
| 폴더 호버 그림자 | 호버 중에는 **모든 폴더 그림자를 끈다** | 켜둔 채로 둬서 경계마다 그라데이션 띠 |
| Archive 탭 | `rgb(217,217,217)` → `rgba(217,217,217,.5)` = **밝아진다** | `#ababab` 로 어두워짐 |
| services 링크 | opacity 0.5 | 0.55 |
| SURD.STUDIO | 아무 변화 없음 | 밑줄 |
| 메뉴 오버레이 | 항목 묶음이 **뷰포트 세로 중앙**, 피치 80, 구분선 2px+2px | 22vh 고정, 피치 81, 1px dotted |

스크롤:

| 대상 | 원본 |
|---|---|
| 좌측 열(뒤로가기·영상) | sticky 60vh → 220px 버팀 |
| 제목 블록 | sticky, **scrollY 271.7 까지** (데스크톱만) |
| 푸터 | 전 폭에서 fixed — 흰 커버가 걷히며 드러난다 |
| 진입 애니메이션 | 없음 (원본도 opacity 1 로 그냥 있다) |

### 안티에일리어싱 — 원본과 모드를 맞춰야 하는 곳이 있다

원본은 **헤더 글자만 그레이스케일 AA**(컬러 프린지 0)이고 나머지(SEE ALL,
카드 제목 등)는 서브픽셀이다. 우리도 그 둘은 프린지 개수까지 이미 일치한다.
헤더만 어긋났는데, 원본 헤더가 합성 레이어에 올라가 있기 때문이다.

- `-webkit-font-smoothing` 은 **macOS 전용**이라 Windows/Linux Chromium 에선
  아무 효과가 없다. `body` 에 걸려 있어도 소용없다.
- 그래서 `.site-header`(그리고 `.footer-links`, `.footer-bottom`)에
  `transform: translateZ(0)` 로 레이어를 만들어 맞췄다.

### 함정

- `.wordmark` 는 `pointer-events: none` 필수.
  글리프 상자가 line-height 보다 커서 위로 넘쳐 푸터 링크 호버를 가로챈다.
- `.footer-links a { justify-self: start }` — 그리드 셀 전체로 늘리면
  빈 여백에서도 호버가 걸린다.
- `#awwwards a { display: block }` — inline 이면 줄상자 18px 만 클릭된다.

---

## 6. works-motion 실측값

### 구조 — 흰 커버가 걷히며 고정 푸터가 드러난다

원본 조상 체인을 떠서 확인한 결과다.

```
푸터        position: fixed; inset: 0; z-index: 0     ← 뷰포트에 고정
흰 섹션     display: flex; align-items: flex-start; padding: 0 32px; z-index: 1
  좌열 1/4  position: sticky; top: 0; height: 60vh    ← 뒤로가기 + 태그 영상
  우열 3/4  섹션 높이를 정한다 (아래 여백 216)
스페이서    height: 100vh   ← 이 구간에서 고정 푸터가 드러난다
문서 높이 = 흰 커버 + 100vh
```

**리빌은 데스크톱·태블릿·모바일 전부에서 유지된다.** (이전 문서에 "모바일은
리빌 없음"이라고 적혀 있었는데 틀렸다. scrollY 400 에서도 원본 워드마크가
뷰포트 y705(375) / y886(768) 에 그대로 있다 = 고정 푸터.)

`.motion-page` 스코프를 벗어나면 index·works 푸터가 깨진다. 반드시 스코프 유지.

### 데스크톱 수치는 **상수가 아니라 폭 비례**다

1440 한 점만 재면 상수인지 비례인지 알 수 없다. 6개 폭(1280·1366·1440·1600·
1728·1920)에서 재서 얻은 식이며 전부 오차 0.1px 이내다.

```
좌열 폭      (100vw - 64) / 4          1280:304  1440:344  1920:464
탭 스트립    25vw - 32                 1280:288  1440:328  1920:448
             = 패널 기준 (100% - 16)/3 - 32   ← 스크롤바 영향 없음
태그 영상    31.25vw - 60              1280:340  1440:390  1920:540
             = 좌열 기준 125% - 40
태그 좌표    left 32px + translateX(-16.4%)
sticky 높이  60vh                      900:540  1080:648  800:480  700:420
흰 커버      우열 콘텐츠 + 216
```

`.m-back` 은 `z-index: 2` 필수. 안 주면 뒤에 오는 태그 영상 박스가
글자 아래쪽을 덮어 위 몇 px 만 보인다.

### 데스크톱 1440 기준 좌표

```
섹션        0 ~ 759.7 흰 배경
탭 스트립   344,80  328x40  #f5f5f5  radius 6px 0 0 0
번호 01     376,96   14px/24px  (탭 하단 정렬)
제목        376,136  72px/80px  Lock Serif Light
구분선      y247
카드        376 / 730.65 / 1085.33,  322.66x181.48 (16:9), 간격 32
카드 제목   이미지 x, y=471.7, 14px/24px
태그 영상   -31.97,88  390x390  autoplay loop muted
뒤로가기    32,80  총폭 132 (화살표16.81 + 6 + 글자109.2)
```

회색 패널은 우열 밖으로 좌우 32 씩 넘친다 (`.m-panel { margin: 0 -32px }`).
콘텐츠는 `.m-body` 의 padding 32 로 다시 376~1408 에 놓인다.

### 회색 패널은 상자가 **3개**다 (제목판 + 카드판이 겹친다)

```
        탭            제목판                카드판              겹침  아래여백
1440   344,80 328x40  344,120 1096x128   344,232 1096x319.7    16    32
1024     0,144 304x40   0,184 1024x128     0,296 1024x702.59   16    32
 375     0,144 155.5x40 0,184  375x88      0,264  375x819.47    8    32
```

- 카드판이 제목판보다 **위로 올라와 겹친다.** 제목판이 sticky 로 떠 있는 동안
  그 아래가 흰색으로 비지 않게 하기 위한 구조다.
- **위 여백을 `.m-grid { margin-top }` 으로 주면 안 된다.** 카드판의
  padding-top 이 0 이면 마진 상쇄로 빠져나가 카드판 자체가 아래에서 시작하고
  제목판과의 사이에 흰 띠가 생긴다. `#f5f5f5` 와 `#fff` 는 차이가 10 이라
  **허용오차 12 짜리 픽셀 대조에 안 잡힌다** — 반드시 눈으로 확인할 것.
- 태블릿·모바일에서는 `.m-head` 를 `position: relative; z-index: 2` 로 둬야
  한다. `static` 이면 z-index 가 안 먹어서 **겹쳐 올라온 카드판이 점선
  구분선을 덮어버린다.** (모바일에서 구분선이 통째로 사라져 있었다.)
- 모바일 탭 폭도 폭 비례다: **50vw - 32** (375→155.5 / 430→183 / 768→352).

### 제목 블록 sticky — 데스크톱 전용

```
블록        빈 80 + 탭 40 + 제목판 128 = 248
동작        scrollY 271.7 까지 상단에 붙어 있다가 이후 카드와 1:1
근거        271.7 = 카드 제목 하단 519.7 - 블록 248
태블릿·모바일  붙지 않는다 (scrollY 100 → 제목 y100, 1:1)
```

`.m-panel { padding-bottom: 24 }` + `.m-body-cards { margin-bottom: -24 }` 짝이
sticky 제한 상자를 519.7 에서 끝나게 한다. 이 24 가 없으면 295.7 에서 풀린다.

### 카드 번호 배지 — 사진 위 글자가 아니라 노치다

```
배지        24x24  #f5f5f5(패널색)  z-index 1,  안쪽 번호 +6,+4  10px/16px
오프셋      데스크톱·태블릿 -12,-12   /   모바일 -4,-4
```

### 구분선 — border 가 아니라 SVG 점선

```
1px 점 + 3px 공백 = 4px 주기, 불투명 #212121
```

`border: 1px dotted` 는 2px 주기에 색이 149 회색으로 흐려져 전혀 다르다.
`repeating-linear-gradient(to right, var(--ink) 0 1px, transparent 1px 4px)`.

### 카드 호버 — 디밍이 아니라 확대

```
이미지      scale(1.15) 중심 기준   322.66x181.48 → 371.05x208.70
틀          부모가 overflow:hidden 이라 카드 상자 크기는 그대로
제목·번호   전혀 변하지 않는다
```

### 태블릿 (810~1279), 1024 기준

```
태그 영상   없음 (display:none)   ← 1280 미만에서 사라진다
패널        풀블리드 left 0, 탭 y144   (뒤로가기 y80 아래로 내려온다)
탭 스트립   304x40
제목        72px/80px
카드        2열, 464x260.98, 간격 32, row-gap 32.15
흰 커버     1086.59  (우열 아래 여백 96)
스페이서    50vh      문서 높이 1537
```

### 모바일 (≤809)

```
태그 영상   없음
패널        풀블리드, 탭 y144
탭 스트립   352x40
제목        48px/56px   ← 태블릿·데스크톱의 72/80 이 아니다
카드        1열 전체폭 16:9 (768 에서 736x414, 375 에서 343x192.92)
행 피치     375 기준 249.15 = 이미지192.92 + 제목여백16 + 제목24 + row-gap 16.23
제목 하단(256) → 구분선 271 → 카드 296.12   (divider 15, grid 24)
우열 아래 여백 54    스페이서 100vh
문서 높이   375:1959  430:2148  768:2811
```

> **grid row-gap 함정.** 카드 제목이 셀 **안**에 있으므로 row-gap 은
> 이미지+제목 **뒤에** 붙는다. 원본의 "이미지 사이 간격"을 row-gap 에
> 그대로 넣으면 행마다 그만큼 밀린다. 피치로 역산해서 넣을 것.
> 태블릿에서 66.32 를 그대로 넣어 2행이 33.8px 밀려 있었다
> (row-gap = 66.32 - 제목여백10.17 - 제목24 = 32.15).

---

## 7. 검증 스크립트

`tools/` 안. **경로는 이제 하드코딩이 아니다.** 각 스크립트가
`import.meta.url` 로 저장소 루트(`ROOT`)를 스스로 계산한다. PC 를 옮겨도
경로를 손댈 필요 없다 — 어느 OS·어느 위치에서든 그대로 돈다.

```bash
cd tools && npm install && npx playwright install chromium-headless-shell
```

| 파일 | 용도 | 실행 |
|---|---|---|
| `idxdiff.mjs` | index 픽셀 대조 | `node idxdiff.mjs 1440 900` |
| `pixdiff.mjs` | works 픽셀 대조 | `node pixdiff.mjs 1440 900` |
| `mdiff.mjs` | **works-motion 픽셀 대조** | `node mdiff.mjs 1440 900` |
| `mcmp.mjs` | works-motion 기하 대조(원본 vs 구현 나란히) | `node mcmp.mjs 1440 900` |
| `minspect.mjs` | works-motion 원본 실측 채집 | `node minspect.mjs 1440 900` |
| `mscroll.mjs` | 원본 스크롤 구간 캡처 + 조상 체인 | `node mscroll.mjs` |
| `wmcheck.mjs` | 3페이지 워드마크 크기 + 스크롤 거동 | `node wmcheck.mjs` |
| `cmp.mjs` | works 기하 대조 | `node cmp.mjs 1440` |
| `mobqa.mjs` | 3페이지 × 13뷰포트 QA (원본 불필요) | `node mobqa.mjs` |
| `hoverall.mjs` | 폴더 호버 동작 | `node hoverall.mjs` |
| **`hovpix.mjs`** | **호버 상태 픽셀 대조** (roll 처럼 computed 로 안 보이는 것) | `node hovpix.mjs motion HOME 1440 900 900 top` |
| `hovfull.mjs` | 좌표를 호버한 뒤 전체 화면 대조 | `node hovfull.mjs works 300 560` |
| `hovaudit.mjs` | 링크별 호버 전/후 계산값 나열 | `node hovaudit.mjs motion 1440 900` |
| `rollcurve.mjs` | roll 애니메이션 곡선 (rAF, 캡처 지연 없음) | `node rollcurve.mjs both` |
| `introcurve.mjs` | works 폴더 진입 애니메이션 곡선 | `node introcurve.mjs orig 1440 900` |
| `panelcmp.mjs` | works-motion 회색 패널만 실측 + 잘라 캡처 | `node panelcmp.mjs 1440 900` |
| **`footdiff.mjs`** | **스크롤 끝(푸터) 픽셀 대조** | `node footdiff.mjs motion 1440 900` |
| `mdiffs.mjs` | 특정 스크롤 위치에서 대조 | `node mdiffs.mjs 1440 900 300` |
| `crop.mjs` | PNG 구간을 잘라 확대 (눈으로 볼 때) | `node crop.mjs diff/m-orig-1440.png 0 750 1440 150 2` |
| `msweep.mjs` | 원본을 6개 데스크톱 폭에서 실측 (상수/비례 판별) | `node msweep.mjs` |
| `mstick.mjs` | 원본 sticky 높이 (뷰포트 높이별) | `node mstick.mjs` |
| `fchain.mjs` | 원본 워드마크 조상 체인 + 푸터 밴드 | `node fchain.mjs 1440 900` |
| `fprobe.mjs` | 원본 푸터 요소 실측 | `node fprobe.mjs 1440 900` |
| `mprobe.mjs` / `mprobe2.mjs` | 원본 카드 모서리 / 뒤로가기·구분선 스택 | `node mprobe.mjs 1024 900` |

`mdiff`/`mcmp`/`footdiff` 는 `<video>` 를 `pause(); currentTime=0` 으로 고정한다.
`footdiff` 는 추가로 **Web Animations API 를 0초에 고정**한다 — 원본 키체인은
Framer Motion(JS)이 흔들어서 CSS `animation:none` 만으로는 안 멈춘다.

### 스크립트 작성 시 주의

- **경로는 `root.mjs` 의 `mine('works-motion.html')` 을 쓸 것.** 저장소 폴더
  이름이 바뀌어도(예: `portfolio2-new` → `portfolio2`) 그대로 돈다.
- CSS/JS 파일은 **CRLF** 다. node 스크립트로 문자열 치환할 때 `\n` 만 쓰면
  매칭이 안 된다 (조용히 실패하고 결과가 안 바뀐다). 편집기로 고칠 것.

---

## 11. 세션 메모

- 지금은 **로컬 Windows PC** 에서 돌고 있고 `www.wildyriftian.com` 에
  접근된다. 원본 대조 스크립트가 전부 동작한다.
  (이전 클라우드 세션은 egress 차단으로 원본을 못 봐서, 원본 없이 잰 값
  일부가 문서에 잘못 남아 있었다 — 1절의 정정 목록 참고.)
- 태그 영상 `videos/motion-tag.mp4` 는 H.264 다. 로컬 full Chromium 은
  디코드하므로 스크린샷에도 정상적으로 나온다. 재인코딩하지 말 것.
- 저장소 폴더 이름을 `portfolio2` 로 바꿀 예정이다. `tools/` 는 `root.mjs`
  로 자기 위치에서 루트를 계산하므로 이름이 바뀌어도 손댈 필요 없다.

---

## 8. 중요한 교훈

### 1. 수치만 보지 말고 화면을 봐라

`opacity`·크기·좌표가 다 정상인데 **화면에는 안 보이는** 경우가 있다.
→ diff 이미지를 만들어 **눈으로 확인**한다.

### 2. 조상만 뒤지지 말고 요소 스택을 봐라

Framer 는 색·그림자·transform 을 **형제 요소나 투명 래퍼**에 건다.
`closest()` 나 부모 순회로는 못 찾는다.
→ `document.elementsFromPoint(x, y)` 로 그 지점의 전체 스택을 본다.
→ 이번에 푸터가 fixed 라는 것도 조상 체인을 8단계 떠서 찾았다.

### 3. "통과"가 "검증됨"이 아니다

워드마크 버그가 그 예다. 스크롤 0 만 찍는 스크립트로 0.34% 를 받았지만
푸터는 **한 번도 비교된 적이 없었다.**
→ 어떤 영역이 실제로 대조됐는지 항상 확인할 것.

### 4. 잔여 차이는 정직하게 남긴다

지금 남은 픽셀차의 대부분은 구조가 아니라
사진 가장자리 안티에일리어싱, 영상 프레임 차이, 얇은 세리프의 서브픽셀
래스터화다. 이건 더 줄이기 어렵고 줄일 필요도 없다.
**구조가 맞는지를 먼저 보라.**

---

## 9. 알려진 잔여 차이

| 항목 | 크기 | 비고 |
|---|---|---|
| **카드 사진 리샘플링** | 375 diff 의 95.8% | 아래 설명. 남은 차이의 대부분이 이것이다 |
| **푸터 키체인** | 푸터 diff 의 72% | 원본이 JS 로 흔들어 프레임을 맞출 수 없다 |
| 워드마크 글리프 위치 | 1856px 중 최대 4px | 오른쪽 끝 글자들. SVG 뷰박스 스케일 vs CSS transform 의 래스터화 차이 |
| works 375px 스트립 폭 | 0.1px, 6건 | 선형식으로 4개 폭을 동시에 못 맞춤 |
| awwwards 배지 | — | 써드파티 위젯 |

**카드 사진.** 원본은 Framer CDN 이 뷰포트에 맞춰 줄인 변형을 받는다
(1440 데스크톱에서 natural 322x242 를 322.7px 로 1:1 표시). 우리는 같은
원본 파일(2000x1504 / 1870x1120 — CDN URL 의 크기와 동일)을 브라우저가
줄인다. 그래서 가장자리 선명도가 다르다. **구조·크기·비율·크롭은 일치**하고,
375 에서 사진 밖 차이는 753px = 화면의 0.25% 뿐이다.
~~맞추려면 폭별 축소본을 만들어 `srcset` 을 붙여야 한다.~~
→ **2026-07-23 실측 정정: srcset 축소본으로도 안 줄어든다.** photoworks card1 을
canvas 로 380·760px 로 미리 줄여 렌더해도 원본 대비 오차가 full 35.89 / w760 35.75 /
w380 36.91 로 사실상 그대로다. 원본도 CDN 변형(예: 380×570)을 브라우저가 다시
285 로 줄이므로, 3000 에서 줄이든 760 에서 줄이든 최종 285px 결과가 거의 같다.
이 잔차는 못 줄인다 — 두면 된다.

**키체인.** 원본은 Framer Motion(JS)으로 태그를 흔든다. `footdiff` 가
Web Animations API 를 0초에 고정해도 원본의 0% 키프레임에는 각 태그마다
2~3° 회전이 들어 있어 우리 CSS 키프레임과 위상이 다르다. 정지 상태 기준
패들락 위치·크기(540 = 60vh, top 13vh+4)는 정확히 맞춰뒀다.
키체인을 뺀 푸터 차이는 0.89% 다.

`SEE ALL WORKS` 앵커 폭이 원본 132 vs 우리 407(works 페이지)인 것은
**구조 차이**다. 원본은 바가 별도 요소이고 앵커는 글자만 감싼다. 화면 결과는 같다.

---

## 10. 환경 메모

- **git 원격이 있다**: `https://github.com/pblovers/portfolio2.git`
  (이전 문서의 "원격 없음"은 틀렸다.)
  새 PC 로 옮기는 절차는 [NEXT.md](NEXT.md) 참고.
- **Private 저장소를 권한다.** 원작자의 작품 이미지, 체험판 폰트
  (`LockSerifTRIAL`), 원작자 Dropbox 영상이 들어 있어 공개 시 재배포가 된다.
- 이 저장소에만 적용되는 git 사용자 이름을 지정해뒀다 (`git config user.name`).
  전역 설정이 한 번 깨진 적이 있어 그 여파를 막기 위한 것이다.
- 폰트 경로는 `css/` 기준이라 `../fonts/` 다.

---

## 12. 카테고리 4페이지 (branding / editorial / illustration / 3D tech)

works-motion 과 **같은 껍데기**(헤더·뒤로가기·태그영상·탭·제목판·고정 푸터
리빌)를 쓰고 카드 그리드 대신 **표 레이아웃**을 쓴다.
`css/works-category.css` 가 `works-motion.css` 뒤에서 표 부분만 덮는다.

원본에 6개 페이지가 **전부 존재한다** (`/works-branding` 등 200 응답).
works 페이지에서 링크가 걸린 건 motion 하나뿐이라 나머지 5개는
주소를 직접 쳐야 들어갈 수 있다 — 원본이 그렇다.

### 페이지별로 다른 것

```
        번호  제목          패널색     행수  태그영상
brand.   02   branding      #d9d9d9    5     branding-tag.mp4
edit.    03   editorial     #d9d9d9    3     editorial-tag.mp4
illust.  05   illustration  #ffe430    5     illustration-tag.mp4
3dtech   06   3D Tech       #d9d9d9    3     3dtech-tag.mp4
```

나머지(레이아웃·간격·타이포)는 4개가 완전히 같다.

### 표 레이아웃 실측 (1440)

```
제목판    344,120 1096x160   ← motion(128)보다 32 크다. 표머리가 안에 있다.
표머리    PROJECT TITLE 376,240 / PREVIEW 1064,240   14px/24px mono
          아래 점선(279)은 **제목판의 아래 테두리**다 (행의 위 테두리가 아니다).
          제목판이 sticky(z2)라 행에 주면 가려져 안 보인다.
표판      344,264 1096xH     (제목판과 16 겹침)
행        376,y 1032x129,  피치 161.04 = 위16 + 내용129 + 아래15 + 선1
          점선은 행 **아래**에 붙는다
행 제목   376,y 656x36  28px/36px Lock Serif Light
프리뷰    행폭의 1/3, 높이는 창을 따라간다
영상      -31.97,104 390x390   ← motion 은 top 88 이다
```

**평상 행높이 = 행폭 x 1/8** (1920:174.1 / 1440:129 / 1280:114).
`container-type: inline-size` + `12.5cqw` 로 낸다.

### 행 호버 — 아코디언

```
행 높이   129 → 320.3 (1280·1440·1920 모두 같은 고정값)
프리뷰    344x129 → 427x320.3 (4:3 유지, 창을 덮는 방향이 가로→세로로 바뀐다)
연도·태그 드러난다 (평상에는 창 아래로 잘려 있다)
문서 높이 2225 → 2416 (아래 행들이 밀린다)
```

> **글자 블록은 언제나 320.3 높이로 배치돼 있고 창이 잘라낸다.**
> 창 안에서 그리드를 짜면 평상에도 연도·태그가 같이 보여 전혀 달라진다.

> **프리뷰는 소스를 먼저 4:3 으로 자른 뒤** 그 4:3 상자를 창에 맞춰 덮는다.
> 16:9 소스(3D tech)를 창에 바로 cover 하면 크롭이 달라진다.
> `min-width/min-height:100% + aspect-ratio:4/3` 이 두 단계를 한 번에 낸다.

### 반응형

```
태블릿(1024)  행이 **항상 펼쳐져 있다** (호버 없음). 프리뷰 행폭의 1/2, 4:3 그대로.
              행 높이 = 폭 x 0.375, 피치 392
모바일(375)   세로로 쌓인다. 표머리 없음.
              이미지(전체폭 4:3) → 제목 24px → 연도 → **가로로 흐르는 태그 마퀴**
              표판 겹침 8 (데스크톱 16), 위 여백 24, 행 피치 405.2
```

### 픽셀차

```
            1920   1440   1280   1024    375
branding    1.12%  0.71%  0.55%  2.18%  5.87%
editorial      -   0.93%     -   1.39%  4.55%
illustration   -   2.30%     -   1.39%  4.50%
3D tech        -   1.05%     -   0.70%  3.23%
```

768 은 사진이 화면의 절반을 차지해 10.36% 지만 **사진 77% + 태그 마퀴 21% +
그 밖 0.15%** 다. 마퀴는 흐르는 애니메이션이라 프레임을 맞출 수 없다.

### 도구

```
node catprobe.mjs works-branding 1440 900   원본 표 레이아웃 실측
node catrows.mjs                            4페이지 행 데이터(제목·연도·태그·이미지)
node catassets.mjs                          영상 4 + 이미지 16 내려받기
node catdiff.mjs works-branding 1440 900    페이지별 픽셀 대조
node scaffold-categories.mjs                works-motion 껍데기로 4페이지 재생성
```

---

## 13. 스크롤·호버 인터랙션 (2026-07-23 원본 대조)

정지 픽셀차만 보던 것에서 빠졌던 **동적 거동** 4가지를 원본 실측·스크린샷으로 맞췄다.

### 13-1. 전역 — Lenis 스무스 스크롤

원본은 `lenis lenis-smooth` (Framer 기본). 네이티브 스크롤은 딱딱·느리게 느껴진다.
`js/lenis.min.js` (globalThis.Lenis, v1.1.18) 를 **로컬 벤더링**하고 `common.js` 에서
`new Lenis({lerp:0.1, smoothWheel:true})` + raf 루프로 초기화. 8개 HTML 전부 common.js
앞에서 로드한다. `WR.lenis` 로 노출. 메뉴 열릴 때 `lenis.stop()`, 닫힐 때 `start()`.
reduced-motion 이면 켜지 않는다. 고정 푸터 리빌·해시 앵커·sticky 전부 정상(실제
scrollTop 을 쓰는 v1 이라 fixed/sticky 안 깨진다).

### 13-2. 전역 — 헤더 hide-on-scroll

원본 헤더는 `position:fixed` 로, 내리면 위로 숨고(translateY -100%) 올리면 내려온다
(맨 위 ≤56px 는 항상 보임). 우리는 `absolute` 라 한 번 사라지면 안 돌아왔다.
`common.css .site-header` 를 fixed + `transition:transform .4s` + `.is-hidden`,
`common.js` 에 방향 감지(±2 데드존, Lenis scroll 이벤트). absolute→fixed 는 둘 다
흐름 밖이라 레이아웃 안 밀린다.

### 13-3. 카테고리 — 좌측 열(msec-left) sticky 65vh

원본 카테고리 좌측 열 sticky 높이는 **65vh** (motion 은 60vh). 실측 vh900→585,
vh800→520. 공유 CSS(60vh=540)를 그대로 물려받아 45px 더 오래 붙어 스크롤 시
좌측 열만 아래로 튀어나왔다. `works-category.css` `.cat-page .msec-left{height:65vh}`.
결과 back 위치 원본과 1px 이내(sy1000 -179 vs -180).

### 13-4. 카테고리 — cat-row 호버 프리뷰 4:3

호버로 행이 129→320.3 으로 열릴 때, 원본 프리뷰 img 는 **427×320.3(4:3 유지)**
인데 우리는 폭 33.333%(344) 고정 + `min-width/min-height:100%+aspect-ratio` 조합이
Chrome 에서 두 min 충돌 시 aspect 를 버려 **344×320 으로 찌그러졌다**. 창을
쿼리 컨테이너로 삼아 `container-type:size` + img `height:max(100cqh,75cqw)` 로
바꿔 평상(폭-기준 344×258)↔호버(높이-기준 427×320.3)를 매끄럽게 전환. 모바일은
프리뷰가 흐름 배치라 `container-type:normal` 로 되돌린다(size 컨테인이 높이 0 유발).
호버 스크린샷 원본과 크롭까지 일치.

### 13-5. 공용 — sticky 제목판 스크롤 비침 (motion·category·photoworks 공통)

`.m-head`(탭+제목, sticky, padding-top 80)의 **상단 80px 가 투명**이라, 스크롤하면
뒤로 지나가는 카드/행(제목·프리뷰)이 그 틈으로 **위로 비쳐 올라온다**. 원본 sticky
컨테이너 bg 는 #fff(섹션 .msec 색). 세 페이지 모두 데스크톱 섹션이 흰색이므로
`works-motion.css` 의 공용 규칙으로 한 번에 덮는다:

```css
@media (min-width: 1280px) { .m-head { background: #fff; } }
```

- sticky 는 데스크톱(≥1280) 전용이라 그 폭으로 스코프한다. 태블릿·모바일은 .m-head 가
  relative 라 비침이 없고, **photoworks 모바일 섹션은 다크(#1d1d1d)** 라 흰 배경을
  주면 흰 띠가 생긴다 — 반드시 데스크톱으로 스코프할 것.
- 처음엔 photoworks·category 에 각각 넣었다가, 근본 원인이 공용 `.m-head` 라
  works-motion.css 로 통합했다(motion 페이지도 같은 버그였다).

### 13-6. 카테고리 — 행 태그 대문자

원본 태그는 대문자(`BRAND IDENTITY DESIGN`), 데이터는 title-case 라 CSS 로 올린다:
`.cat-row-tags { text-transform: uppercase }`. 연도·행 제목은 그대로.

검증: `mobqa.mjs` 104조합 문제 0개. motion·photoworks·branding scroll-0 무회귀
(1.36 / 7.00 / 0.65%). 스크롤 비침·태그 스크린샷 원본 일치.

> **works 폴더 "틈"**: DPR 1.0/1.25/1.5, 줌 0.9/1.1/1.25 **모든 조건에서 photoworks
> 폴더가 원본과 픽셀 일치** — 차이를 재현하지 못했다(원본도 탭 40/본문 top 39 로 1px
> 겹침, 겹침량 동일). 사용자가 계속 틈을 본다고 해서, 분수 배율에서 탭-본문 가장자리가
> 반올림되며 배경(#fff)이 1px 비칠 가능성에 대비해 **방어적으로 봉합**했다:
> `.wf-tab { box-shadow: 0 1px 0 0 var(--wf-bg) }` — 스트립 색과 같은 1px 을 아래로 깔아
> 틈을 폴더색으로 메운다. 레이아웃·번호·계단 위치 불변, 100%/정수 DPR 에선 본문과
> 같은 색이라 안 보인다(DPR1 원본 일치 유지 확인). 계단(::after)은 clip-path 가
> box-shadow 를 잘라 못 메우지만, 주 가로 이음새(스트립 아래)는 이걸로 사라진다.
