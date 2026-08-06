/* =============================================================
   Archive — 3D 회전 카드 캐러셀

   원본: https://interesting-studies-473096.framer.app/
   (Framer 코드 컴포넌트. 번들 shared-lib.CoNcq40h.mjs 안의 three.js 구현을
    그대로 이식했다 — 눈대중이 아니라 원본 구현과 인스턴스 프로퍼티 실측값이다.)

   원본 인스턴스 프로퍼티 (번들에서 읽은 값. 컴포넌트 defaultProps 와 다르니
   주의 — camera/carousel 은 이 인스턴스가 전부 덮어쓴다. 실제 원본 페이지의
   three.js 카메라를 가로채 fov 60 / y 1 / z 20 인 것도 확인했다.)
     layout   : numberOfCards 50, radius 8, cardWidth 4, cardHeight 3, imageRadius 0.3
     tilt     : X 0deg, Y 40deg, Z 20deg
     stroke   : #fff, width 0.01
     intro    : gatheringSpeed 0.018
     zoom     : enableZoom true, zoomAmount 0.2
     preview  : 230x150, 좌상단(24,24), radius 0
     camera   : fov 60, cameraDistance 20, cameraHeight 1, parallaxAmount 2
     carousel : scrollSpeed 0.0014, damping 0.01, hoverScale 1.4, hoverYOffset 0.6
     배경     : 컴포넌트 자체는 투명(rgba(0,0,0,0))이고 흰 배경은 감싼 프레임이 낸다

   원본과 다른 점 (단독 데모 페이지가 아니라 스크롤되는 사이트 안이라 불가피한 것만)
     1. 카드 수 50 → 8 (요청). data-cards 로 바꾼다.
     2. 카드가 8장뿐이면 반지름 8 짜리 원이 텅 비므로 원을 줄였다(data-radius).
        카메라도 같은 비율로 당겨(data-distance) 링이 화면에서 차지하는 크기와
        원근감은 원본 그대로 두었다 — 값이 없으면 원본 수치(8 / 20)를 그대로 쓴다.
        장수를 바꿀 때는 이 둘도 같은 비율로 따라가야 간격이 유지된다
        (카드 한 장이 차지하는 호 = 2πr / 장수 가 카드 폭 4 근처여야 한다).
     3. 휠 처리 — 원본은 단독 페이지라 휠을 전부 먹지만, 여기서는 페이지가
        아래 섹션으로 내려가야 한다. 그래서 **카드가 실제로 차지한 영역 안**에서만
        휠을 가져가 링을 돌리고(preventDefault + Lenis 차단), 그 바깥에서는
        건드리지 않아 평소처럼 다음 섹션으로 스크롤된다.
     4. 원본 페이지 좌상단의 데모 버튼(Full view / Black BG)은 옮기지 않았다.
     5. 자동 회전(CFG.autoRotate) 추가. 원본은 조작해야만 도는데, 여기서는 페이지를
        훑고 지나가는 섹션이라 가만 둬도 돌아야 한다.
     6. 인트로 시작 시점(data-intro-when / data-intro-threshold). 원본은 단독
        페이지라 열자마자 펼쳐지지만, 여기서는 캐러셀 영역이 화면에 온전히
        들어왔을 때 시작해야 한다.
   ============================================================= */

import * as THREE from 'three';

const MOUNT_SELECTOR = '.js-carousel3d';

/* ---- 원본 실측 파라미터 ---- */
const CFG = {
  numberOfCards: 50,
  radius: 8,
  cardWidth: 4,
  cardHeight: 3,
  imageRadius: 0.3,
  tiltX: 0,
  tiltY: 40,
  tiltZ: 20,
  strokeColor: 'rgb(255, 255, 255)',
  strokeWidth: 0.01,
  gatheringSpeed: 0.018,
  enableZoom: true,
  zoomAmount: 0.2,
  enableHoverPreview: true,
  fov: 60,
  cameraDistance: 20,
  cameraHeight: 1,
  parallaxAmount: 2,
  scrollSpeed: 0.0032,
  damping: 0.025,
  hoverScale: 1.4,
  hoverYOffset: 0.6,
  /* 자동 회전 속도(초당 각도). 원본에는 없다 — 원본은 단독 데모 페이지라
     방문자가 반드시 휠을 굴려보지만, 여기서는 페이지를 훑고 지나가는 중에
     지나칠 수 있어서 가만 둬도 링이 돌게 한다.
     음수 = 휠을 아래로 굴렸을 때와 같은 방향. data-autorotate 로 바꾼다(0 이면 끔). */
  autoRotate: -26,
  /* 링이 프레임(.arc-stage 박스)에서 차지할 비율. 원본은 단독 페이지라 카메라
     거리가 고정이고 링이 화면 가운데 작게 돌지만, 여기서는 프레임이 레이아웃
     상자(1370x611)라 그대로 두면 프레임의 3분의 1도 못 채우고 나머지가 빈다.
     링이 한 바퀴 도는 동안 차지하는 최대 사각형을 재서 거리를 역산한다.
     data-fit 으로 바꾼다(0 이면 끄고 원본 고정 거리를 쓴다).
     이 비율은 **가장 크게 보이는 순간** 기준이다 — 호버로 카드가 1.4배가 되고
     (FIT_MODES) 마우스 패럴랙스로 보는 각도까지 최악인 경우(FIT_CAMS)를 다 친
     값이라 1 에 가깝게 둬도 잘리지 않는다. 평소 상태는 그만큼 작게 놓인다. */
  fit: 0.95
};

/* 원본의 딜링(카드가 한 장씩 링에 놓이는 인트로) 상수 */
const DEAL_STEP = 0.08;          // 카드 간 지연
const LERP = 0.15;               // 호버 스케일·Y 보간
const INTRO_CAM_EASE = 0.025;


/* 마스크/스트로크 캔버스 해상도 — 원본: min(100, 512/max(w,h)) */
function texScale(w, h) {
  return Math.min(100, 512 / Math.max(w, h));
}

/* 라운드 사각형 경로 (원본은 quadraticCurveTo 로 그린다) */
function roundedRectPath(ctx, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}

function init(mount) {
  const cfg = Object.assign({}, CFG);
  const cards = parseInt(mount.dataset.cards, 10);
  if (!isNaN(cards) && cards > 0) cfg.numberOfCards = cards;
  /* 링 반지름·카메라 거리 조정 —
     원본은 카드 50장이 반지름 8 짜리 큰 원을 빽빽하게 채운다. 장수를 줄이면
     같은 반지름에서는 카드끼리 멀어져 원이 텅 빈다. 장수에 맞게 원을 줄이고
     (data-radius), 카메라도 같은 비율로 당기면(data-distance) 화면에서 차지하는
     크기와 원근감은 원본 그대로면서 카드만 커진 "작은 원" 이 된다.
     지름 대비 카드 폭이 커지므로 이웃 카드끼리 살짝 겹쳐 원본과 같은 인상이 난다. */
  const radiusAttr = parseFloat(mount.dataset.radius);
  if (!isNaN(radiusAttr) && radiusAttr > 0) cfg.radius = radiusAttr;
  const distAttr = parseFloat(mount.dataset.distance);
  if (!isNaN(distAttr) && distAttr > 0) cfg.cameraDistance = distAttr;
  const autoAttr = parseFloat(mount.dataset.autorotate);
  if (!isNaN(autoAttr)) cfg.autoRotate = autoAttr;
  const fitAttr = parseFloat(mount.dataset.fit);
  if (!isNaN(fitAttr)) cfg.fit = fitAttr;

  const images = (mount.dataset.images || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  let w = mount.clientWidth || 800;
  let h = mount.clientHeight || 600;

  const state = {
    targetRotation: 0,
    currentRotation: 0,
    isIntersecting: false,
    mouseX: 0,
    mouseY: 0,
    pointer: new THREE.Vector2(-9999, -9999),
    targetDistance: cfg.cameraDistance,
    currentDistance: cfg.cameraDistance,
    isZoomedIn: false,
    introTriggered: false,
    introCamZ: 0,
    introCamY: 0,
    spreadAngle: 0,
    forceMatrix: false
  };

  /* 실제 카메라 거리는 씬(기울기 그룹·카드)이 다 만들어진 뒤 fitDistance() 로
     정한다 — 링을 프레임에 맞추려면 카드 배치를 알아야 하기 때문이다.
     여기서는 그 전까지 쓸 임시값만 넣어둔다. */
  state.targetDistance = state.currentDistance = cfg.cameraDistance;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cfg.fov, w / h, 0.1, 1000);
  camera.position.set(0, cfg.cameraHeight, state.currentDistance);
  camera.lookAt(0, -0.5, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  mount.appendChild(renderer.domElement);

  /* ---- 라운드 사각형 알파 마스크 ---- */
  const g = texScale(cfg.cardWidth, cfg.cardHeight);
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = cfg.cardWidth * g;
  maskCanvas.height = cfg.cardHeight * g;
  const mctx = maskCanvas.getContext('2d');
  mctx.fillStyle = '#000000';
  mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  const r = Math.min(cfg.imageRadius * g, maskCanvas.width / 2, maskCanvas.height / 2);
  roundedRectPath(mctx, maskCanvas.width, maskCanvas.height, r);
  mctx.fillStyle = '#ffffff';
  mctx.fill();
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  /* ---- 테두리(양면에 z ±0.002 로 덧대는 별도 메시) ---- */
  let strokeMat = null;
  if (cfg.strokeWidth > 0) {
    const sc = document.createElement('canvas');
    sc.width = maskCanvas.width;
    sc.height = maskCanvas.height;
    const sctx = sc.getContext('2d');
    sctx.clearRect(0, 0, sc.width, sc.height);
    roundedRectPath(sctx, sc.width, sc.height, r);
    sctx.lineWidth = cfg.strokeWidth * g * 2;
    sctx.strokeStyle = cfg.strokeColor;
    sctx.stroke();
    const strokeTex = new THREE.CanvasTexture(sc);
    strokeTex.colorSpace = THREE.SRGBColorSpace;
    strokeTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    strokeMat = new THREE.MeshBasicMaterial({
      map: strokeTex,
      alphaMap: maskTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  /* ---- 기울기 그룹 > 링 그룹 ---- */
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.x = cfg.tiltX * (Math.PI / 180);
  tiltGroup.rotation.y = cfg.tiltY * (Math.PI / 180);
  tiltGroup.rotation.z = cfg.tiltZ * (Math.PI / 180);
  scene.add(tiltGroup);

  const ring = new THREE.Group();
  tiltGroup.add(ring);

  const geo = new THREE.PlaneGeometry(cfg.cardWidth, cfg.cardHeight);
  const loader = new THREE.TextureLoader();
  const mats = [];

  const renderOnce = () => renderer.render(scene, camera);

  if (images.length > 0) {
    for (const src of images) {
      const tex = loader.load(src, renderOnce);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      mats.push(new THREE.MeshBasicMaterial({
        map: tex,
        alphaMap: maskTex,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
    }
  } else {
    for (let i = 0; i < 6; i++) {
      mats.push(new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL((i * 60) / 360, 0.6, 0.5),
        alphaMap: maskTex,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      }));
    }
  }

  const n = cfg.numberOfCards;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const mesh = new THREE.Mesh(geo, mats[i % mats.length]);
    if (strokeMat) {
      const front = new THREE.Mesh(geo, strokeMat);
      front.position.z = 0.002;
      front.raycast = () => {};
      mesh.add(front);
      const back = new THREE.Mesh(geo, strokeMat);
      back.position.z = -0.002;
      back.raycast = () => {};
      mesh.add(back);
    }
    /* 인트로 시작 위치 — 전부 한 자리(정면)에 겹쳐 있다가 한 장씩 링으로 딜링된다 */
    mesh.position.set(0, 0, cfg.radius);
    mesh.rotation.set(0, Math.PI / 2, 0);
    mesh.scale.setScalar(1);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.userData = {
      baseY: 0,
      baseScale: 1,
      src: images.length > 0 ? images[i % images.length] : null,
      targetAngle: angle
    };
    ring.add(mesh);
  }

  /* ---- 호버 프리뷰 ---- */
  let preview = null;
  if (cfg.enableHoverPreview) {
    preview = document.createElement('img');
    preview.className = 'arc-preview';
    preview.alt = '';
    preview.decoding = 'async';
    /* 원본은 src 없는 img 를 두지만, src 가 비면 "깨진 이미지" 로 잡힌다
       (tools/mobqa.mjs). 첫 호버 전까지는 투명 1x1 을 물려둔다 — 어차피 opacity 0. */
    preview.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    mount.appendChild(preview);
  }

  /* ---- 인터랙션 ---- */
  const raycaster = new THREE.Raycaster();

  /* 카드가 화면에서 실제로 차지한 사각형(클라이언트 좌표).
     카드 네 귀퉁이를 투영해 합집합을 잡는다 — 카드가 모여 있으면 그만큼 작아지고
     남는 여백은 페이지 스크롤 몫이 된다. */
  const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
  const _v = new THREE.Vector3();
  const CARD_PAD = 8;   // 가장자리 여유. 크게 잡으면 페이지를 스크롤할 빈 자리가 줄어든다
  function cardsRect() {
    const r = mount.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const card of ring.children) {
      card.updateMatrixWorld();
      for (const [cx, cy] of CORNERS) {
        _v.set(cx * cfg.cardWidth, cy * cfg.cardHeight, 0)
          .applyMatrix4(card.matrixWorld)
          .project(camera);
        const x = r.left + ((_v.x + 1) / 2) * r.width;
        const y = r.top + (1 - (_v.y + 1) / 2) * r.height;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return { left: minX - CARD_PAD, top: minY - CARD_PAD, right: maxX + CARD_PAD, bottom: maxY + CARD_PAD };
  }
  function overCards(x, y) {
    const b = cardsRect();
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  }

  /* ---- 프레임에 링 맞추기 ----
     거리 d 에 카메라를 뒀을 때 링이 화면에서 차지하는 최대 폭·높이를 정규화
     좌표로 잰다(1 = 화면 가장자리). 링은 기울어져 있어(tilt X0/Y40/Z20) 회전
     각도마다 투영 크기가 달라지므로 한 바퀴를 여러 각도로 나눠 재고 그중 최대를
     쓴다 — 한 각도에만 맞추면 돌다가 프레임 밖으로 삐져나온다.
     실제 메시를 건드리지 않고 행렬만 따로 계산한다(인트로 중에도 부를 수 있게). */
  /* 카드가 n 장 고르게 놓여 있으므로 링 배치는 2π/n 마다 똑같이 되풀이된다 —
     한 바퀴가 아니라 그 한 칸만 훑으면 모든 경우를 다 본 것이다(8장이면 45°). */
  const FIT_SAMPLES = 8;
  /* 마우스 패럴랙스로 카메라가 최대 ±parallaxAmount(2) 만큼 움직인다. lookAt 이
     링 중심을 다시 겨누므로 화면 밖으로 밀려나가진 않지만, 기울어진 링을 보는
     각도가 달라져 투영 크기가 8% 쯤 커진다 — 그 극단(화면 네 귀퉁이)도 같이 잰다. */
  const FIT_CAMS = [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  /* 카드는 두 상태를 오간다 — 평소(1배, y 0)와 호버(1.4배, y +0.6).
     호버 상태를 안 재면 커진 카드가 카메라 시야 밖으로 나가 잘린다(프레임의
     overflow 문제가 아니라 캔버스 자체가 거기서 끝난다 — CSS 로는 못 고친다).
     한 번에 한 장만 호버되지만 어느 장이든 될 수 있으므로, 전부 커진 경우의
     최대치를 잡으면 그게 곧 안전한 경계다. */
  const FIT_MODES = [
    { s: 1, y: 0 },
    { s: cfg.hoverScale, y: cfg.hoverYOffset }
  ];
  const _tiltM = new THREE.Matrix4();
  const _ringM = new THREE.Matrix4();
  const _cardM = new THREE.Matrix4();
  const _worldM = new THREE.Matrix4();
  const _fitPos = new THREE.Vector3();
  const _fitQuat = new THREE.Quaternion();
  const _fitEul = new THREE.Euler();
  const _fitOne = new THREE.Vector3(1, 1, 1);
  const _fitPt = new THREE.Vector3();
  const _fitWorldPt = new THREE.Vector3();
  const _fitCams = FIT_CAMS.map(() => new THREE.PerspectiveCamera(cfg.fov, 1, 0.1, 1000));

  function ringExtent(d) {
    for (let c = 0; c < _fitCams.length; c++) {
      const cam = _fitCams[c];
      cam.aspect = w / h;
      cam.position.set(
        FIT_CAMS[c][0] * cfg.parallaxAmount,
        cfg.cameraHeight + FIT_CAMS[c][1] * cfg.parallaxAmount,
        d
      );
      cam.lookAt(0, -0.5, 0);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
    }
    _tiltM.makeRotationFromEuler(tiltGroup.rotation);

    let e = 0;
    for (const mode of FIT_MODES) {
      for (let s = 0; s < FIT_SAMPLES; s++) {
        _ringM.makeRotationY((s / FIT_SAMPLES) * (Math.PI * 2 / cfg.numberOfCards));
        for (let i = 0; i < cfg.numberOfCards; i++) {
          const a = (i / cfg.numberOfCards) * Math.PI * 2;
          _fitPos.set(Math.sin(a) * cfg.radius, mode.y, Math.cos(a) * cfg.radius);
          _fitQuat.setFromEuler(_fitEul.set(0, a + Math.PI / 2, 0));
          _cardM.compose(_fitPos, _fitQuat, _fitOne);
          _worldM.multiplyMatrices(_tiltM, _ringM).multiply(_cardM);
          for (const [cx, cy] of CORNERS) {
            /* 월드 좌표는 한 번만 구하고 카메라 5대에 각각 투영한다 */
            _fitWorldPt
              .set(cx * cfg.cardWidth * mode.s, cy * cfg.cardHeight * mode.s, 0)
              .applyMatrix4(_worldM);
            for (let c = 0; c < _fitCams.length; c++) {
              _fitPt.copy(_fitWorldPt).project(_fitCams[c]);
              const ax = Math.abs(_fitPt.x), ay = Math.abs(_fitPt.y);
              if (ax > e) e = ax;
              if (ay > e) e = ay;
            }
          }
        }
      }
    }
    return e;
  }

  /* extent(d) 는 거리가 멀수록 단조 감소하지만 "겉보기 크기 ∝ 1/d" 는 여기서
     성립하지 않는다 — 링 반지름(5.12)이 카메라 거리와 맞먹어서 앞쪽 카드는
     카메라 코앞이고 뒤쪽은 두 배 넘게 멀다. 비례식으로 한 번에 고치려 들면
     값이 위아래로 튀며 수렴하지 않는다(그래서 호버 카드가 잘렸다).
     구간을 잡아 이분법으로 찾는다. 결과는 캐시해서 박스 크기가 바뀔 때만
     (ResizeObserver) 다시 잰다 — 매 휠 이벤트마다 다시 재면 낭비다. */
  let fitCache = null;
  function fitDistance() {
    if (fitCache !== null) return fitCache;
    /* 세로가 긴 박스에서는 거리를 늘려 링이 잘리지 않게 한다 (원본과 동일) */
    const a = w / h;
    const base = a < 1 ? cfg.cameraDistance / a : cfg.cameraDistance;
    if (!(cfg.fit > 0)) {
      fitCache = base;
      return base;
    }
    const limit = cfg.fit;
    /* lo = 너무 가까워 프레임을 넘치는 거리, hi = 넉넉히 들어오는 거리 */
    let lo = base, hi = base;
    while (lo > 0.5 && ringExtent(lo) < limit) lo *= 0.7;
    while (hi < 2000 && ringExtent(hi) > limit) hi *= 1.4;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (ringExtent(mid) > limit) lo = mid;
      else hi = mid;
    }
    /* hi 쪽을 쓴다 — 여기서는 extent ≤ limit 이 보장돼 절대 안 잘린다 */
    fitCache = hi;
    return hi;
  }

  /* 박스 크기를 다시 재고 필요하면 카메라를 다시 맞춘다.
     init 시점의 clientWidth/Height 는 레이아웃이 아직 안 끝났으면 0 이거나 옛
     값이라(특히 .arc-stage 는 inset 이 부모 크기에 걸려 있다) 그대로 두면 fit 이
     엉뚱한 거리로 잡힌다 — 실제로 같은 페이지에서 22.3 과 11.8 이 번갈아 나왔다.
     ResizeObserver 가 있지만 첫 프레임을 놓칠 수 있어 직접 한 번 더 확인한다. */
  function remeasure() {
    const cw = mount.clientWidth, ch = mount.clientHeight;
    if (!cw || !ch || (cw === w && ch === h)) return;
    w = cw;
    h = ch;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    fitCache = null;
    const d = fitDistance();
    state.targetDistance = state.currentDistance = state.isZoomedIn ? d * cfg.zoomAmount : d;
  }

  state.targetDistance = state.currentDistance = fitDistance();
  remeasure();
  window.addEventListener('load', remeasure);

  /* 이 페이지는 Lenis(smoothWheel)로 스크롤한다. preventDefault 만으로는 Lenis 가
     자체 wheel 리스너로 계속 스크롤하므로, 카드 영역 위에서는 data-lenis-prevent-wheel
     을 걸어 Lenis 가 이 휠을 건너뛰게 한다. (Lenis 는 composedPath 를 훑어 확인하고,
     이 리스너는 stage 의 버블 단계라 window 의 Lenis 리스너보다 먼저 돈다.)
     touch 는 걸지 않는다 — 모바일에서 세로 스크롤은 페이지 몫이어야 한다. */
  const setWheelOwner = (own) => {
    if (own) mount.setAttribute('data-lenis-prevent-wheel', '');
    else mount.removeAttribute('data-lenis-prevent-wheel');
    mount.classList.toggle('arc-over', own);
  };

  const onWheel = (e) => {
    const d = fitDistance();
    if (cfg.enableZoom && e.ctrlKey) {
      e.preventDefault();          // 브라우저 확대 대신 카메라 줌 (원본과 동일)
      state.targetDistance += e.deltaY * 0.05;
      state.targetDistance = Math.max(d * 0.3, Math.min(state.targetDistance, d * 3));
      return;
    }
    /* 카드 영역 밖이면 아무것도 하지 않는다 — 평소처럼 다음 섹션으로 스크롤된다. */
    if (!overCards(e.clientX, e.clientY)) { setWheelOwner(false); return; }
    setWheelOwner(true);           // 카드 영역 안 → 휠은 링 회전에만 쓴다
    e.preventDefault();
    state.targetRotation -= e.deltaY * cfg.scrollSpeed;
  };

  let dragging = false;
  let lastX = 0;
  const onPointerDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    mount.classList.add('arc-drag');
  };
  const onPointerMove = (e) => {
    const rect = mount.getBoundingClientRect();
    state.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    /* 커서가 카드 위에 있으면 미리 휠 소유권을 넘겨두고 커서도 바꿔 알린다 */
    setWheelOwner(overCards(e.clientX, e.clientY));
    if (dragging) {
      state.targetRotation += (e.clientX - lastX) * (cfg.scrollSpeed * 2);
      lastX = e.clientX;
    }
  };
  const onPointerUp = () => {
    dragging = false;
    mount.classList.remove('arc-drag');
  };
  const onPointerLeave = () => {
    dragging = false;
    mount.classList.remove('arc-drag');
    setWheelOwner(false);          // 섹션을 벗어나면 스크롤은 다시 페이지 몫
    state.pointer.x = -9999;
    state.pointer.y = -9999;
    if (preview) preview.style.opacity = '0';
  };
  const onDoubleClick = () => {
    if (!cfg.enableZoom) return;
    state.isZoomedIn = !state.isZoomedIn;
    const d = fitDistance();
    state.targetDistance = state.isZoomedIn ? d * cfg.zoomAmount : d;
  };

  mount.addEventListener('wheel', onWheel, { passive: false });
  mount.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  mount.addEventListener('pointerleave', onPointerLeave);
  mount.addEventListener('dblclick', onDoubleClick);

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cw = entry.contentRect.width;
      const ch = entry.contentRect.height;
      if (cw === 0 || ch === 0) continue;
      w = cw;
      h = ch;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      fitCache = null;              // 박스가 바뀌었으니 맞춘 거리를 다시 잰다
      const d = fitDistance();
      state.targetDistance = state.isZoomedIn ? d * cfg.zoomAmount : d;
    }
  });
  ro.observe(mount);

  const io = new IntersectionObserver((entries) => {
    state.isIntersecting = entries[0].isIntersecting;
  });
  io.observe(mount);

  /* 인트로를 언제 시작할지 —
     기본은 "이 캔버스가 화면에 걸릴 때" 지만, 캔버스는 자리 박스보다 2.4배 커서
     섹션이 아직 한참 아래에 있을 때 이미 걸린다(카드가 너무 일찍 들어온다).
     data-intro-when 에 셀렉터를, data-intro-threshold 에 그 요소가 얼마나
     보여야 하는지를 준다(1 = 온전히 다 들어왔을 때). */
  state.introReady = true;
  let introIO = null;
  const introWhen = mount.dataset.introWhen
    ? document.querySelector(mount.dataset.introWhen)
    : null;
  if (introWhen) {
    state.introReady = false;
    let threshold = parseFloat(mount.dataset.introThreshold);
    if (isNaN(threshold)) threshold = 0;
    /* 대상이 화면보다 크면 "1(전부 보임)" 은 영영 오지 않아 인트로가 시작조차
       못 한다 — 그 화면에서 최대로 보일 수 있는 비율 안쪽으로 낮춰 잡는다. */
    const reachable = Math.min(1, window.innerHeight / Math.max(introWhen.offsetHeight, 1)) * 0.98;
    threshold = Math.max(0, Math.min(threshold, reachable));
    introIO = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= threshold)) {
        state.introReady = true;
        introIO.disconnect();
        introIO = null;
      }
    }, { threshold: [0, threshold] });
    introIO.observe(introWhen);
  }

  /* ---- 루프 ---- */
  const dealEnd = Math.PI * 2.1 + ring.children.length * DEAL_STEP;

  /* QA 훅 — 인트로/감쇠는 전부 프레임 단위 보간이라(원본 그대로) 느린 기기에서는
     같은 시간에 다른 상태가 된다. 원본과 픽셀 대조를 하려면 "다 끝난 상태"를
     양쪽 다 만들어야 하므로 즉시 종료시킬 수 있는 손잡이를 남겨둔다.
     (tools/arcshot.mjs 가 쓴다. 일반 사용자 동작에는 영향 없음) */
  mount.__arc = {
    state, cfg, camera, ring, cardsRect,
    settle(rotDeg, camZ) {
      state.introTriggered = true;
      state.introCamZ = 0;
      state.introCamY = 0;
      state.spreadAngle = dealEnd;
      if (typeof rotDeg === 'number') state.targetRotation = rotDeg * Math.PI / 180;
      state.currentRotation = state.targetRotation;
      state.currentDistance = state.targetDistance;
      // 원본 캡처 시점의 카메라 거리(아직 수렴 중이던 값)에 맞추기 위한 대조용 옵션
      if (typeof camZ === 'number') state.introCamZ = camZ - state.currentDistance;
      camera.position.x = state.mouseX * cfg.parallaxAmount;
      camera.position.y = cfg.cameraHeight + state.mouseY * cfg.parallaxAmount;
      /* 카드는 matrixAutoUpdate=false 라 "변화 없음" 이면 행렬을 안 고친다.
         상태만 바꾸면 인트로 중간 행렬이 그대로 남으므로 한 프레임 강제한다. */
      state.forceMatrix = true;
    }
  };
  let raf;
  let lastTime = performance.now();
  const tick = () => {
    raf = requestAnimationFrame(tick);

    /* 자동 회전은 프레임 수가 아니라 경과 시간 기준이라 120Hz 화면에서도 같은
       속도로 돈다. 화면 밖으로 나가 루프가 쉬는 동안(아래 isIntersecting) 이나
       탭을 갔다 오는 동안 쌓인 시간이 한 프레임에 터지지 않게 상한을 둔다. */
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!state.isIntersecting) return;

    if (!state.introTriggered) {
      /* 아직 시작할 때가 아니면 출발 위치(화면 왼쪽 밖)에 그대로 둔다 */
      if (!state.introReady) return;
      /* 화면에 처음 들어온 이 순간이 레이아웃이 확실히 끝난 시점이다 */
      remeasure();
      state.introTriggered = true;
      state.introCamZ = -fitDistance() * 0.4;
      state.introCamY = 0;
      state.currentRotation = Math.PI * 1.5;
      state.targetRotation = 0;
      state.spreadAngle = 0;
    }
    if (Math.abs(state.introCamZ) > 0.1) {
      state.introCamZ += (0 - state.introCamZ) * INTRO_CAM_EASE;
    }
    if (state.spreadAngle < dealEnd) {
      state.spreadAngle += (dealEnd - state.spreadAngle) * cfg.gatheringSpeed;
    }

    /* 목표 각도를 시간에 비례해 계속 밀어준다 — 아래 감쇠(damping)가 그대로
       따라오므로 휠·드래그와 자연스럽게 섞인다(사용자가 돌린 만큼 더해지고,
       손을 떼면 다시 이 속도로 흐른다). 드래그 중에는 손이 잡고 있는 값이
       제멋대로 흐르지 않도록 잠시 멈춘다. */
    if (cfg.autoRotate && !dragging) {
      state.targetRotation += cfg.autoRotate * (Math.PI / 180) * dt;
    }

    state.currentRotation += (state.targetRotation - state.currentRotation) * cfg.damping;
    ring.rotation.y = state.currentRotation;
    state.currentDistance += (state.targetDistance - state.currentDistance) * cfg.damping;

    const camX = state.mouseX * cfg.parallaxAmount;
    const camY = cfg.cameraHeight + state.mouseY * cfg.parallaxAmount + state.introCamY;
    camera.position.x += (camX - camera.position.x) * cfg.damping;
    camera.position.y += (camY - camera.position.y) * cfg.damping;
    camera.position.z = state.currentDistance + state.introCamZ;
    camera.lookAt(0, -0.5, 0);
    camera.updateMatrixWorld();
    tiltGroup.updateMatrixWorld();

    raycaster.setFromCamera(state.pointer, camera);
    const hits = raycaster.intersectObjects(ring.children);
    const hovered = hits.length > 0 ? hits[0].object : null;

    if (preview) {
      if (hovered && hovered.userData.src) {
        const src = hovered.userData.src;
        if (preview.getAttribute('src') !== src) preview.src = src;
        preview.style.opacity = '1';
      } else {
        preview.style.opacity = '0';
      }
    }

    for (let i = 0; i < ring.children.length; i++) {
      const card = ring.children[i];
      const target = card.userData.targetAngle;
      let a = Math.max(0, state.spreadAngle - i * DEAL_STEP);
      const landed = a >= target;
      if (landed) a = target;

      const isHover = card === hovered;
      card.position.x = Math.sin(a) * cfg.radius;
      card.position.z = Math.cos(a) * cfg.radius;
      card.rotation.y = a + Math.PI / 2;
      card.rotation.x = 0;

      const wantY = isHover && landed ? cfg.hoverYOffset : card.userData.baseY;
      const wantS = isHover && landed ? cfg.hoverScale : card.userData.baseScale;
      let dirty = false;
      if (Math.abs(card.scale.x - wantS) > 0.001) {
        card.scale.setScalar(card.scale.x + (wantS - card.scale.x) * LERP);
        dirty = true;
      } else if (card.scale.x !== wantS) {
        card.scale.setScalar(wantS);
        dirty = true;
      }
      if (Math.abs(card.position.y - wantY) > 0.001) {
        card.position.y += (wantY - card.position.y) * LERP;
        dirty = true;
      } else if (card.position.y !== wantY) {
        card.position.y = wantY;
        dirty = true;
      }
      if (dirty || !landed || state.forceMatrix || Math.abs(state.introCamZ) > 0.1 ||
          Math.abs(state.spreadAngle - dealEnd) > 0.01) {
        card.updateMatrix();
      }
    }
    state.forceMatrix = false;

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    mount.removeEventListener('wheel', onWheel);
    mount.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    mount.removeEventListener('pointerleave', onPointerLeave);
    mount.removeEventListener('dblclick', onDoubleClick);
    ro.disconnect();
    io.disconnect();
    if (introIO) introIO.disconnect();
    cancelAnimationFrame(raf);
    renderer.dispose();
    geo.dispose();
    maskTex.dispose();
    mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
    if (strokeMat) { if (strokeMat.map) strokeMat.map.dispose(); strokeMat.dispose(); }
    if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
  };
}

document.querySelectorAll(MOUNT_SELECTOR).forEach(init);
