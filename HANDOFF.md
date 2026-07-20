# wildyriftian.com 클론 — 인수인계

원본: https://www.wildyriftian.com (Framer 제작)

수치는 전부 **원본을 실측한 값**이다. 감으로 넣은 값이 아니므로
바꾸기 전에 반드시 원본을 다시 재고 근거를 확인할 것.

---

## 1. 현재 상태 (마지막 세션 종료 시점)

| 페이지 | 상태 | 1440 픽셀차 | 비고 |
|---|---|---|---|
| `index.html` | 완료 | **2.65%** | 26개 뷰포트 통과 |
| `works.html` | 완료 | **0.33%** (995px: 0.99%) | 26개 뷰포트 통과 |
| `works-motion.html` | 데스크톱·모바일 완료 / **태블릿 미세조정 남음** | **4.08%** | 아래 참고 |

`mobqa.mjs` 26개 조합(3페이지 × 13뷰포트) **문제 0개**
— 가로스크롤·넘침·깨진이미지·콘솔오류·메뉴동작 전부 정상.

### works-motion 폭별 픽셀차

```
1440  4.08%   완료 (구조 일치, 잔차는 영상 프레임·사진 안티에일리어싱)
1279  8.65%   ← 남은 일
1024 11.68%   ← 남은 일 (38.32% → 11.68% 로 줄인 상태에서 중단)
 768  2.73%   완료
 430  4.59%   완료
 375  7.15%   완료 (잔차는 사진 안티에일리어싱)
```

### 여기부터 이어서 할 일

1. **태블릿(810~1279) 미세조정.** `m-panel { top: 144px }` 로 64px 어긋남을
   고쳐 38%→11.7% 까지 왔다. 남은 차이의 원인을 아직 눈으로 확인하지 않았다.
   `node mdiff.mjs 1024 900` 실행 후 `diff/m-mine-1024.png` 와
   `diff/m-orig-1024.png` 를 **나란히 열어서 볼 것.**
   카드 행 피치(모바일에서 그랬듯 제목 여백이 grid row-gap 밖에 있는 문제)를
   먼저 의심할 것.
2. 카드 링크가 `#works-motion` 자리표시자다. 원본은 `./works/overbloom` 등
   개별 상세로 간다.
3. 나머지 5개 카테고리 페이지(`works-branding` 등)는 아직 없다.
   `works-motion` 을 템플릿으로 복제하면 된다.

---

## 2. 파일 구조

```
portfolio2/
├── index.html            메인
├── works.html            카테고리 목록 (폴더 탭 6개)
├── works-motion.html     카테고리 상세
├── css/
│   ├── common.css        폰트·토큰·리셋·헤더·메뉴·키체인·푸터·awwwards·appear
│   ├── index.css         히어로·about 티켓·featured works
│   ├── works.css         Works/Archive 탭·폴더 6개
│   └── works-motion.css  카테고리 상세
├── js/
│   ├── common.js         메뉴 오버레이, WR.appear(), 워드마크 fit
│   ├── index.js          히어로 패럴랙스, 티켓 사이클
│   └── works.js          폴더 호버 커서 드리프트
├── images/               원본에서 받은 이미지 전부
├── videos/motion-tag.mp4 works-motion 좌측 태그
├── fonts/                Lock Serif, Biro Script, JetBrains Mono
└── tools/                검증 스크립트 (README.md 참고)
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

> **화살표 상자는 16.8px 로 고정해야 한다.**
> mono 글리프(←) advance 는 8.4px 뿐이라 그대로 두면 글자가 8px 왼쪽으로
> 밀려 앵커 총폭이 132 → 123.6 이 된다.
> `.arr-back { display:inline-block; width:16.8px }`

### 푸터 워드마크 — 이번 세션에서 고친 실제 버그

원본은 **고정 119.539px / line-height 95.6315px** 폰트를 ancestor 의
`scaleX` 로 **가로만** 늘려 좌우 여백까지 정확히 채운다. 높이는 불변이다.
자연폭은 로컬 폰트에서 1216.11px 로 원본(1216)과 일치한다.

기존 구현은 `font-size: calc((100vw - 64px) / 10.17)` 로 **폰트 크기 자체를**
키웠다. 10.17 은 1280px 에서만 맞는 값이라 1440 에서 135.3px(13% 큼)이 됐다.

- `scaleX(calc(길이 / 길이))` 는 **유효하지 않다.** scaleX 는 무단위 수를
  받는데 CSS calc 는 길이÷길이를 수로 못 만든다. 무시되고 transform:none 이 된다.
- 그래서 `common.js` 의 `fitWordmark()` 가 자연폭을 재서 scaleX 를 직접 준다.
  resize 와 `document.fonts.ready` 에 재실행한다.

**이 버그가 그동안 안 잡힌 이유**: `pixdiff`/`idxdiff` 는 **스크롤 0 뷰포트만**
찍는다. index·works 는 그 시점에 푸터가 화면 밖이라 워드마크가 비교 대상에
아예 없었다. 0.34% 통과는 푸터를 본 적이 없다는 뜻이었다.
→ **푸터를 고쳤으면 스크롤 끝에서도 반드시 대조할 것.**

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
흰 섹션     position: relative; z-index: 1            ← 위를 덮고 스크롤로 걷힌다
좌·우 콘텐츠 position: sticky; top: 0; height: 540    ← 220px 까지 붙었다가 같이 밀림
```

근거: 스크롤을 내려도 원본 워드마크의 뷰포트 y 가 **743 에서 고정**이다.
그리고 seeAll 은 scrollY 220 까지 y=80 에 머물다 이후 1:1 로 움직인다
(sticky 540 이 부모 760 안에서 760-540=220 만큼 버틴 것).

구현:

```
.msec         relative, z1, height 760, 흰 배경
.msec-sticky  sticky, top 0, height 540
.msec-spacer  height 900   ← 스크롤 거리 확보용 투명 구간
.footer       fixed, inset 0, z0      (.motion-page 스코프로만 덮는다)
문서 높이 = 760 + 900 = 1660 (원본과 동일)
```

`.motion-page` 스코프를 벗어나면 index·works 푸터가 깨진다. 반드시 스코프 유지.

### 데스크톱 (≥1280), 1440 기준

```
섹션        0 ~ 760 흰 배경
패널 left   (100% - 64)/4 = 344    헤더 4열 그리드의 1칸
탭 스트립   344,80  328x40  #f5f5f5  radius 6px 0 0 0
번호 01     376,96   14px/24px  (탭 하단 정렬)
제목        376,136  72px/80px  Lock Serif Light
구분선      y247, 패널 좌우 끝까지 풀블리드 (패딩 뚫고 나감)
카드        376 / 730.65 / 1085.33,  322.66x181.48 (16:9), 간격 32
카드 번호   이미지 x-6, y-8, 10px/16px
카드 제목   이미지 x, y=471.7, 14px/24px
태그 영상   -31.97,88  390x390  autoplay loop muted
뒤로가기    32,80  총폭 132 (화살표16.8 + 6 + 글자109.2)
```

`.m-back` 은 `z-index: 2` 필수. 안 주면 뒤에 오는 태그 영상 박스가
글자 아래쪽을 덮어 위 몇 px 만 보인다.

### 태블릿 (810~1279), 1024 기준

```
태그 영상   없음 (display:none)   ← 1280 미만에서 사라진다
패널        풀블리드 left 0, top 144   (뒤로가기 y80 아래로 내려온다)
탭 스트립   304x40
제목        72px/80px
카드        2열, 464x261, 간격 32
문서 높이   1537 = 흰커버 999 + 스페이서 538
```

### 모바일 (≤809), 768 기준 — 리빌 없음

```
리빌 해제   푸터가 position:relative 로 정상 흐름에 쌓인다 (docH 2687)
태그 영상   없음
패널        풀블리드, padding-top 144
탭 스트립   352x40
제목        48px/56px   ← 태블릿·데스크톱의 72/80 이 아니다
카드        1열 전체폭 16:9 (768 에서 736x414)
카드 행 피치 471 = 이미지414 + 제목여백16 + 제목24 + 간격17
제목 하단(256) → 카드(296) = 40  (divider 20 + grid 19)
```

> **grid row-gap 함정.** 카드 제목이 셀 **안**에 있으므로 row-gap 은
> 이미지+제목 **뒤에** 붙는다. 원본의 "이미지 사이 57px" 를 row-gap 에
> 그대로 넣으면 행마다 34px 씩 밀린다. 피치로 역산해서 넣을 것.
> 이 실수로 375px 가 51% → 3% 로 바뀌었다.

---

## 7. 검증 스크립트

`tools/` 안. 경로가 하드코딩돼 있으니 PC 옮기면 `D:/이젠아카데미/portfolio2`
부분을 바꿀 것.

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
| `mobqa.mjs` | 3페이지 × 13뷰포트 QA | `node mobqa.mjs` |
| `hoverall.mjs` | 폴더 호버 동작 | `node hoverall.mjs` |

`mdiff`/`mcmp` 는 `<video>` 를 `pause(); currentTime=0` 으로 고정한 뒤 찍는다.
안 그러면 프레임이 매번 달라 대조가 안 된다.

### 브라우저 메모

이전 인수인계에 "full chromium 이 이 PC 에서 차단된다(spawn UNKNOWN)" 고
적혀 있었으나 **이번 세션에서는 `chromium.launch()` 가 정상 동작했다.**
원본 Framer 사이트의 헤더·푸터까지 제대로 렌더된다. 그대로 쓰면 된다.

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
| works-motion 태블릿 | 1024 11.7% / 1279 8.7% | **미해결. 1순위 작업** |
| works 375px 스트립 폭 | 0.1px, 6건 | 선형식으로 4개 폭을 동시에 못 맞춤 |
| 오른쪽 열 제목 텍스트 | 약 0.5px | x=529.5 반픽셀 위치의 래스터화 차이 |
| 카드 사진 가장자리 | — | 안티에일리어싱. 구조는 일치 |
| 태그 영상 프레임 | — | 원본은 Dropbox 원본, 우리는 로컬 mp4 |

`SEE ALL WORKS` 앵커 폭이 원본 132 vs 우리 407(works 페이지)인 것은
**구조 차이**다. 원본은 바가 별도 요소이고 앵커는 글자만 감싼다. 화면 결과는 같다.

---

## 10. 환경 메모

- **git 원격 없음.** 로컬 저장소만 있다.
- **Private 저장소를 권한다.** 원작자의 작품 이미지, 체험판 폰트
  (`LockSerifTRIAL`), 원작자 Dropbox 영상이 들어 있어 공개 시 재배포가 된다.
- 이 저장소에만 적용되는 git 사용자 이름을 지정해뒀다 (`git config user.name`).
  전역 설정이 한 번 깨진 적이 있어 그 여파를 막기 위한 것이다.
- 폰트 경로는 `css/` 기준이라 `../fonts/` 다.
