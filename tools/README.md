# 검증 스크립트

원본 사이트와 구현본을 **수치·픽셀 단위로 대조**하는 도구 모음이다.
눈대중 대신 이 스크립트들로 확인한다.

## 설치

```bash
cd tools
npm install
npx playwright install chromium
```

## 경로 주의

스크립트 안에 로컬 절대경로가 하드코딩돼 있다.
다른 PC로 옮기면 아래 경로를 실제 위치로 바꿔야 한다.

```
file:///D:/임소현/portfolio2/works.html
file:///D:/임소현/portfolio2/index.html
D:/임소현/portfolio2/images
```

## 스크립트

| 파일 | 용도 | 실행 |
|---|---|---|
| `cmp.mjs` | works 페이지 기하 대조 (원본 vs 구현, 셀렉터별 좌표·스타일) | `node cmp.mjs 1440` |
| `pixdiff.mjs` | works 픽셀 단위 대조 + diff 이미지 생성 | `node pixdiff.mjs 1440 900` |
| `idxdiff.mjs` | index 픽셀 대조 (랜드마크 정렬 포함) | `node idxdiff.mjs 1440 900` |
| `mobqa.mjs` | 26개 뷰포트 조합 QA (가로스크롤·넘침·깨진이미지·콘솔오류) | `node mobqa.mjs` |
| `hoverall.mjs` | 구간별 폴더 호버 동작 확인 | `node hoverall.mjs` |
| `shoot.mjs` | 뷰포트별 전체 페이지 캡처 | `node shoot.mjs <url> <outDir> <prefix> "1440,768"` |
| `inspect.mjs` | 원본 구조 채집 (섹션·폰트·컬러·이미지) | `node inspect.mjs <url> <outDir>` |

## 중요한 교훈

이 프로젝트에서 **같은 실수를 두 번** 했다. 반드시 지킬 것.

### 1. 수치만 보지 말고 화면을 봐라

`opacity`, `크기`, `좌표`가 다 정상인데 **화면에는 안 보이는** 경우가 있다.
- 원본 썸네일이 `opacity: 1`, 크기 44px 로 측정됐지만 폴더 배경 뒤(z-index)에 가려져 실제로는 안 보였다
- 우리 구현도 `width > 0` 검사만 통과하고 `opacity: 0` 이라 안 보인 적이 있다

→ `pixdiff.mjs` 로 diff 이미지를 만들어 **눈으로 확인**한다.

### 2. 조상만 뒤지지 말고 요소 스택을 봐라

Framer는 색·그림자를 **형제 요소나 투명 래퍼**에 건다.
`closest()` 나 부모 순회로는 못 찾는다.

→ `document.elementsFromPoint(x, y)` 로 그 지점의 전체 스택을 본다.

### 3. 프리뷰 패널로는 애니메이션 검증이 안 된다

인앱 브라우저는 `file://` 로컬 파일에 대해 CSS 애니메이션을 실행하지 않는다
(`document.getAnimations()` 가 0 을 반환).
- **원본 확인** → 인앱 브라우저 (원격 사이트는 정상 렌더)
- **구현본 검증** → Playwright

Playwright 전체 chromium 은 이 PC에서 실행이 차단된다(`spawn UNKNOWN`).
headless shell 로만 동작하며 로컬 정적 파일에는 충분하다.
단 원본 Framer 사이트는 headless shell 에서 헤더·푸터가 렌더되지 않는다.
