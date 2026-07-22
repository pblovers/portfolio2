# 다른 PC 에서 이어받기

이 파일만 읽고 바로 시작할 수 있게 정리했다.
**수치·구조·인터랙션 실측값은 전부 [HANDOFF.md](HANDOFF.md) 에 있다.**
이 파일은 "새 PC 에서 무엇부터 하나"만 다룬다.

---

## 0. 먼저 — 지금 작업이 커밋되지 않았다

```
수정 16개 + 새 파일 72개 = 88개가 미커밋 상태다
원격: https://github.com/pblovers/portfolio2.git
```

새 PC 로 넘기려면 둘 중 하나를 해야 한다.

**A. 원격에 올려서 clone (권장)**

```bash
git add -A
git commit -m "카테고리 5페이지 추가 + 인터랙션 원본 대조"
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
| `works-photoworks.html` | 7.00% | **미완 — 아래 3번** |

`mobqa.mjs` 8페이지 × 13뷰포트 = **104조합 문제 0개**
(가로스크롤·넘침·깨진이미지·콘솔오류·메뉴동작 전부 정상)

works 페이지에서 **6개 카테고리 전부 링크 연결됨.** 푸터 services 6개도 연결됨.

---

## 3. 바로 이어서 할 일 — photoworks 2건

### 3-1. 모바일에서 카드가 16px 위에 있다 (30.89%)

```
원본 375   이미지창 y = 304
구현 375   이미지창 y = 288
```

`works-motion.css` 의 모바일 `.m-body-cards`(겹침 -8 / padding-top 32)를
photoworks 가 그대로 물려받는데 맞지 않는다.
`css/works-photoworks.css` 에 모바일 오버라이드를 넣어야 한다.

```bash
cd tools
node catprobe.mjs works-photoworks 375 812     # 원본 제목판·카드판 겹침/패딩 실측
node catdiff.mjs works-photoworks 375 812      # 고친 뒤 재대조
```

### 3-2. 사진 크롭이 원본과 다르다 (1440 7.00% / 1024 7.82%)

소스가 **세로 2:3**(2000×3000)인데 창은 **4:3**(380×285)다.
같은 `object-fit: cover` 인데 크롭 위치가 다르다 —
원본 CDN 이 표시 비율에 맞춰 **미리 잘라낸 변형**을 주는 것으로 보인다.

확인 방법:

```bash
# 원본 카드 이미지의 naturalWidth/Height 를 재서 우리 것(2000x3000)과 비교
node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1440,height:900}})).newPage();
await p.goto('https://www.wildyriftian.com/works-photoworks',{waitUntil:'networkidle',timeout:90000});
await p.waitForTimeout(2400);
console.log(await p.evaluate(()=>[...document.querySelectorAll('img')]
 .filter(i=>i.getBoundingClientRect().width>300&&i.getBoundingClientRect().y>200)
 .slice(0,3).map(i=>[i.naturalWidth,i.naturalHeight,i.currentSrc.slice(-70)])));
await b.close();})"
```

같은 함정을 카테고리 4페이지에서 이미 한 번 겪었다 —
**원본은 소스를 먼저 4:3 으로 자른 뒤 창에 맞춰 덮는다.**
`min-width/min-height:100% + aspect-ratio:4/3 + object-fit:cover` 로 해결했다
(`css/works-category.css` 의 `.cat-row-preview img` 참고).
photoworks 는 창이 이미 4:3 이라 이 방법이 안 통했으니 다른 단계가 있을 것이다.

### 3-3. 아직 안 잰 것

- photoworks **호버 인터랙션** — `.pw-shot img` 에 transform 전환만 넣어뒀고
  원본 호버는 측정하지 않았다. `hovfull.mjs` 로 재면 된다.

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

- photoworks 마무리 (3번)
- 카드 링크가 `#works-motion` / `#branding` 등 자리표시자다.
  원본은 `./works/overbloom` 처럼 개별 상세로 간다 — 상세 페이지는 아직 없다.
- 카드 사진 리샘플링: 원본은 CDN 축소본을 쓰고 우리는 원본 크기를 브라우저가 줄인다.
  맞추려면 폭별 축소본을 만들어 `srcset` 을 붙여야 한다 (HANDOFF 9절).
