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
     1. 카드 수 50 → 5 (요청). data-cards 로 바꾼다.
     2. 카드 5장으로는 반지름 8 짜리 원이 텅 비므로 원을 줄였다(data-radius).
        카메라도 같은 비율로 당겨(data-distance) 화면에서 차지하는 크기와 원근감은
        원본 그대로 두었다 — 값이 없으면 원본 수치(8 / 20)를 그대로 쓴다.
     3. 휠 처리 — 원본은 단독 페이지라 휠을 전부 먹지만, 여기서는 페이지가
        아래 섹션으로 내려가야 한다. 그래서 **카드가 실제로 차지한 영역 안**에서만
        휠을 가져가 링을 돌리고(preventDefault + Lenis 차단), 그 바깥에서는
        건드리지 않아 평소처럼 다음 섹션으로 스크롤된다.
     4. 원본 페이지 좌상단의 데모 버튼(Full view / Black BG)은 옮기지 않았다.
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
  hoverYOffset: 0.6
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

  /* 세로가 긴 박스에서는 거리를 늘려 링이 잘리지 않게 한다 (원본과 동일) */
  const fitDistance = () => {
    const a = w / h;
    return a < 1 ? cfg.cameraDistance / a : cfg.cameraDistance;
  };
  state.targetDistance = state.currentDistance = fitDistance();

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
      const d = fitDistance();
      state.targetDistance = state.isZoomedIn ? d * cfg.zoomAmount : d;
    }
  });
  ro.observe(mount);

  const io = new IntersectionObserver((entries) => {
    state.isIntersecting = entries[0].isIntersecting;
  });
  io.observe(mount);

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
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!state.isIntersecting) return;

    if (!state.introTriggered) {
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
