/* =============================================================
   3D 유리 심볼 로고 — Aquaplanet logo_glass.js 이식본

   원본과 다른 점:
     - 심볼만 사용 ('aqua planet' 글자 GLB 제외)
     - 스크롤 연동 제거 → GSAP / ScrollTrigger 불필요
     - 흩어짐(scatter) / 헤엄(swim) 제거, 제자리 부유(bob) + 호버 반응만 유지
     - 풀스크린이 아니라 지정한 컨테이너 박스 안에서 렌더
     - 배경(하늘 영상)은 유리 안쪽에서만 보이도록 클리핑

   사용법: 크기를 가진 요소에 class="logo3d js-logo3d" 만 붙이면 된다.
   컨테이너의 위치·크기·비율이 달라져도 유리 색감과 질감은 그대로 유지된다
   (thickness 와 하늘 프레이밍을 컨테이너가 아니라 로고 크기에 맞춰 매번 역산하기 때문).

   배경은 가벼운 정지 이미지를 먼저 깔고, 영상이 첫 프레임까지 준비되면 텍스처만 교체한다.
   렌더 루프와 영상 재생 모두 컨테이너가 화면에 보일 때만 돈다 (IntersectionObserver).
   ============================================================= */

import * as THREE from 'three';
import { GLTFLoader }     from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MOUNT_SELECTOR = '.js-logo3d';
/* 이 모듈은 index.html(루트)과 works/works-uiux.html(한 단계 아래) 양쪽에서
   로드된다. 'assets/...' 같은 상대 경로는 페이지 URL 기준으로 풀리므로 하위
   경로 페이지에서는 깨진다 — 대신 이 스크립트 자신의 위치(js/)에서 한 단계
   위(사이트 루트)를 기준으로 절대 경로를 만든다. */
const SITE_ROOT       = new URL('..', import.meta.url).href;
const SYMBOL_SRC      = SITE_ROOT + 'assets/models/logo-symbol.glb';
/* 굴절에 비칠 하늘 — 구름이 흐르며 밝기가 변하는 게 원본 인상의 핵심이라 영상을 쓴다.
   자동재생이 막히는 환경(iOS 저전력 모드 등)에서는 정지 이미지로 대체한다. */
const BACKDROP_VIDEO_SRC = SITE_ROOT + 'assets/videos/Aquaplanet/logo3d-backdrop.webm';
const BACKDROP_IMAGE_SRC = SITE_ROOT + 'assets/images/Aquaplanet/logo3d-backdrop.webp';

/* 카메라는 z=10 고정, 배경 평면은 그 앞 z=-2.4 — 원본과 동일한 배치 */
const CAMERA_FOV      = 35;
const CAMERA_Z        = 10;
const BACKDROP_Z      = -2.4;
const FIT_PADDING     = 1.05;   // 원본 1.52 는 흩어진 생물까지 담으려던 여백 — 흩어짐이 없으므로 축소

/* three 의 유리 흡수량은 thickness × 모델 스케일에 지수적으로 비례한다
   (getVolumeTransmissionRay: ray = normalize(refract) * thickness * modelScale).
   컨테이너 크기에 따라 모델 스케일이 달라지므로 thickness 를 고정값으로 두면
   화면 크기마다 유리 색이 달라진다 — 데스크톱에선 진해지고 모바일에선 옅어진다.
   그래서 'thickness × 스케일' 을 상수로 잡고 thickness 를 매번 역산한다.
   Aquaplanet 데스크톱(1280×800) 실측치는 12.18 이다. 다만 원본은 로고 주변까지 하늘이 깔려
   있어 전체가 밝게 읽히는 반면, 여기는 배경을 유리 안쪽으로 클리핑해 흰 카드 위에 유리만 남는다.
   같은 값을 쓰면 대비 때문에 훨씬 진해 보여서 한 단계 낮춰 잡았다.
   → 유리를 더 진하게/연하게 하려면 이 값만 조절하면 된다 (크면 진해진다). */
const GLASS_THICKNESS_WORLD = 8.0;

/* 배경 프레이밍 — 캔버스가 아니라 '로고'에 고정한다.
   Aquaplanet 은 하늘을 화면 전체에 깔고 그 위에 로고를 얹는 구조라, 캔버스 기준으로 맞추면
   우리 박스 크기·비율이 바뀔 때마다 유리에 비치는 하늘 부분이 달라진다.
   그래서 '하늘 높이 = 로고 높이 × SKY_SPAN' 으로 잡아 로고에 앵커링한다.
   Aquaplanet 히어로 스크린샷에서 실측한 값이다. 거기서 로고는 영상 높이의 84%(y 6~90%)를
   덮고 중심은 (x 0.505, y 0.484) 에 있다 — 위로는 하늘, 아래로는 수평선까지 걸친다.
   CENTER_Y 는 uv 기준이라 아래에서부터 잰다 (0.516 = 이미지 위에서 48.4%). */
const SKY_SPAN     = 1.25;
const SKY_CENTER_X = 0.505;
const SKY_CENTER_Y = 0.516;

/* 유리 재질 — 원본 PHYSICAL_SYMBOL_GLASS 그대로 */
const SYMBOL_GLASS = {
  color: 0xf2fcff,
  roughness: 0.08,
  transmission: 1.1,
  thickness: 13,
  /* three 에서 reflectivity 와 ior 은 같은 값의 두 표현이다 (reflectivity 는 ior 의 파생 접근자).
     원본은 ior 1.62 와 reflectivity 0.7 을 같이 넘기는데, 뒤에 오는 reflectivity 가 ior 을
     1.778 로 덮어써서 1.62 는 실제로 쓰이지 않는다. 원본이 눈으로 맞춘 결과물은 1.778 쪽이므로
     그 값을 그대로 쓰되, 죽은 설정을 남겨두지 않도록 ior 하나로만 적는다.
     (이 값이면 material.reflectivity 는 자동으로 0.7 이 된다) */
  ior: 1.7778,
  attenuationColor: 0xbfeeff,
  attenuationDistance: 2.4,
  envMapIntensity: 1.45,
  clearcoat: 1.0,
  clearcoatRoughness: 0.025,
  opacity: 0.8,
};

/* 제자리 부유 — 원본 값 유지 */
const FLOAT_AMPLITUDE   = 0.03;
const FLOAT_SPEED       = 0.85;
const FLOAT_OFFSET_STEP = 0.7;
const FLOAT_ROTATION_Z  = 0.04;

/* 호버 반응 — 원본 값 유지 */
const HOVER_WOBBLE_POS      = 0.035;
const HOVER_WOBBLE_ROT      = 0.055;
const HOVER_WOBBLE_YAW      = 0.12;
const HOVER_WOBBLE_SPEED    = 2.6;
const HOVER_MAGNETIC_STRENGTH = 0.04;  // 커서 방향으로 끌리는 거리 (로고 너비 대비)
const HOVER_MAGNETIC_LERP     = 0.07;
const HOVER_LERP              = 0.12;  // 호버 진입/이탈 감쇠

/* ---------------------------------------------------------------
   환경맵 — 캔버스 그라디언트로 만든 흰 하늘 (외부 파일 없음)
--------------------------------------------------------------- */
function makeCleanSkyEnv(renderer) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');

  const v = ctx.createLinearGradient(0, 0, 0, c.height);
  v.addColorStop(0.00, '#ffffff');
  v.addColorStop(0.45, '#eaf4ff');
  v.addColorStop(0.75, '#dcecff');
  v.addColorStop(1.00, '#c2d8ee');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, c.width, c.height);

  const h = ctx.createLinearGradient(0, 0, c.width, 0);
  h.addColorStop(0.00, 'rgba(210,230,255,0.0)');
  h.addColorStop(0.50, 'rgba(255,255,255,0.18)');
  h.addColorStop(1.00, 'rgba(210,230,255,0.0)');
  ctx.fillStyle = h;
  ctx.fillRect(0, 0, c.width, c.height);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

function setupSceneEnv(scene, renderer) {
  scene.environment = makeCleanSkyEnv(renderer);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffffff, 1.0);
  rim.position.set(-4, 1, -3);
  scene.add(rim);
}

/* ---------------------------------------------------------------
   굴절이 샘플링할 배경 평면 — 카메라 프러스텀을 꽉 채우고 cover 로 맞춘다
--------------------------------------------------------------- */
function makeBackdrop(texture) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uMap:         { value: texture },
      uCanvasAspect:{ value: 1 },
      uImageAspect: { value: 16 / 9 },
      /* 영상 전체 높이가 캔버스 높이의 몇 배를 차지하는지 — 로고 크기에서 매번 역산 */
      uSkyHeight:   { value: 1 },
      uCenter:      { value: new THREE.Vector2(SKY_CENTER_X, SKY_CENTER_Y) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uCanvasAspect;
      uniform float uImageAspect;
      uniform float uSkyHeight;
      uniform vec2  uCenter;
      varying vec2 vUv;

      void main() {
        /* 캔버스 중심(=로고 중심)에서의 거리를 '영상 높이' 단위로 환산해 샘플링한다.
           uSkyHeight 가 로고 크기에서 나오므로 박스가 커지든 작아지든 같은 하늘이 뒤에 온다. */
        vec2 uv;
        uv.y = (vUv.y - 0.5) / uSkyHeight + uCenter.y;
        uv.x = (vUv.x - 0.5) * uCanvasAspect / (uSkyHeight * uImageAspect) + uCenter.x;
        gl_FragColor = vec4(texture2D(uMap, uv).rgb, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.renderOrder = -100;
  mesh.position.z = BACKDROP_Z;

  /* 배경을 '굴절 버퍼에만' 그리고 화면에는 그리지 않는다 → 유리 안쪽에서만 하늘이 보인다.
     three 는 transmission 재질을 위해 별도 렌더 타깃에 한 번 그린 뒤 화면에 다시 그리는데,
     그 두 패스는 renderer.getRenderTarget() 값으로 구분된다 (굴절 패스에서만 non-null).
     onBeforeRender 는 state.setMaterial() 보다 먼저 불리므로 여기서 colorWrite 를 바꾸면 먹는다. */
  mesh.onBeforeRender = (renderer) => {
    mat.colorWrite = renderer.getRenderTarget() !== null;
  };

  return mesh;
}

function fitBackdrop(plane, camera) {
  if (!plane) return;
  const dist = Math.max(0.01, camera.position.z - BACKDROP_Z);
  const height = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * dist;
  plane.scale.set(height * camera.aspect, height, 1);
  plane.material.uniforms.uCanvasAspect.value = camera.aspect;
}

/* ---------------------------------------------------------------
   부유 + 호버 데이터 (원본 createFloatAnimation 에서 scatter/swim 항 제거)
--------------------------------------------------------------- */
function createFloatAnimation(root) {
  const meshes = [];
  const baseX = [], baseY = [], baseZ = [];
  const baseRotX = [], baseRotY = [], baseRotZ = [];
  const amplitudes = [], speeds = [], offsets = [], phases = [];

  root.traverse((object) => {
    if (!object.isMesh) return;
    const i = meshes.length;
    meshes.push(object);
    baseX.push(object.position.x);
    baseY.push(object.position.y);
    baseZ.push(object.position.z);
    baseRotX.push(object.rotation.x);
    baseRotY.push(object.rotation.y);
    baseRotZ.push(object.rotation.z);
    amplitudes.push(FLOAT_AMPLITUDE * (0.75 + (i % 5) * 0.1));
    speeds.push(FLOAT_SPEED * (0.88 + (i % 7) * 0.04));
    offsets.push(i * FLOAT_OFFSET_STEP);
    // 생물별 위상차 — 원본 seededRandom(i, 11) 과 동일한 난수열
    const r = Math.sin(i * 127.1 + 11 * 311.7) * 43758.5453123;
    phases.push((r - Math.floor(r)) * Math.PI * 2);
  });

  return { meshes, baseX, baseY, baseZ, baseRotX, baseRotY, baseRotZ, amplitudes, speeds, offsets, phases };
}

function applyFloatAnimation(f, elapsed, hoverPower) {
  const { meshes, baseX, baseY, baseZ, baseRotX, baseRotY, baseRotZ,
          amplitudes, speeds, offsets, phases } = f;

  for (let i = 0; i < meshes.length; i += 1) {
    const mesh = meshes[i];
    const wave = elapsed * speeds[i] + offsets[i];
    const bob  = Math.sin(wave) * amplitudes[i];

    const hoverWave = elapsed * HOVER_WOBBLE_SPEED + offsets[i] * 1.7;
    const hoverX   = Math.sin(hoverWave)                        * HOVER_WOBBLE_POS * hoverPower;
    const hoverY   = Math.cos(hoverWave * 1.23)                 * HOVER_WOBBLE_POS * 0.75 * hoverPower;
    const hoverZ   = Math.sin(hoverWave * 0.83 + phases[i])     * HOVER_WOBBLE_POS * 0.45 * hoverPower;
    const hoverRot = Math.sin(hoverWave * 1.15 + phases[i])     * HOVER_WOBBLE_ROT * hoverPower;
    const hoverYaw = Math.sin(hoverWave * 0.92 + offsets[i] * 0.5) * HOVER_WOBBLE_YAW * hoverPower;

    mesh.position.x = baseX[i] + hoverX;
    mesh.position.y = baseY[i] + bob + hoverY;
    mesh.position.z = baseZ[i] + hoverZ;
    mesh.rotation.x = baseRotX[i] + hoverRot * 0.55;
    mesh.rotation.y = baseRotY[i] + hoverYaw;
    mesh.rotation.z = baseRotZ[i]
      + Math.sin(elapsed * speeds[i] * 0.5 + offsets[i]) * FLOAT_ROTATION_Z
      + hoverRot;
  }
}

/* ---------------------------------------------------------------
   디바이스별 픽셀 비율 상한
--------------------------------------------------------------- */
function pixelRatioCap() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 810;
  const lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
  if (coarse || narrow) return lowMem ? 1 : 1.5;   // 모바일 / 태블릿
  /* transmission 재질은 화면을 두 번(굴절 패스 + 최종 패스) 그려서 픽셀 수에
     특히 민감하다. 2배 → 1.5배로 낮추면 실제로 그리는 픽셀이 (1.5/2)²≈56%
     로 줄어(44% 절감) 고해상도(레티나 등) 모니터에서 렌더 비용이 크게
     빠진다. 일반(1배) 모니터는 Math.min(devicePixelRatio, cap) 이라 애초에
     영향이 없다. 곡면 유리라 픽셀비율을 낮춰도 화질 저하는 거의 안 보인다. */
  return lowMem ? 1.25 : 1.5;                      // 데스크톱
}

/* =============================================================
   초기화
============================================================= */
function initLogo3D(mount) {
  if (!mount) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // 원본은 NeutralToneMapping 을 쓰지만 three r160 에는 없는 상수라 undefined 가 되고,
  // three 가 Linear 로 폴백하며 경고를 낸다. 결과가 같은 Linear 를 명시해 경고만 없앤다.
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  mount.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);
  camera.lookAt(0, 0, 0);
  setupSceneEnv(scene, renderer);

  const symGroup = new THREE.Group();
  scene.add(symGroup);

  let backdrop  = null;
  let floatAnim = null;
  let symbolSize = null;
  let modelReady = false;       // GLB 로드 완료
  let backdropSettled = false;  // 배경 준비 완료(또는 최종 실패)

  /* --- 렌더 루프 상태 --- */
  let onScreen = false;      // IntersectionObserver
  let rafId    = null;
  let needsOnce = false;     // 정적 1회 렌더 요청

  /* --- 호버 상태 --- */
  let hoverTarget = 0, hoverPower = 0;
  let hoverDirX = 0, hoverDirY = 0;
  let magX = 0, magY = 0;

  function schedule() {
    if (rafId === null && onScreen && !document.hidden) {
      rafId = requestAnimationFrame(tick);
    }
  }
  function requestOnce() {
    needsOnce = true;
    schedule();
  }

  function resize() {
    const w = Math.max(1, mount.clientWidth);
    const h = Math.max(1, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitBackdrop(backdrop, camera);
    fitSymbol();
    requestOnce();
  }

  /* 모델을 컨테이너 안에 꽉 차게 스케일 — 카메라는 고정 */
  function fitSymbol() {
    if (!symbolSize) return;
    const vh = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * CAMERA_Z;
    const vw = vh * camera.aspect;
    const s = Math.min(vh / Math.max(symbolSize.y, 0.0001), vw / Math.max(symbolSize.x, 0.0001)) / FIT_PADDING;
    symGroup.scale.setScalar(s);

    // 하늘 프레이밍을 로고 높이에 고정 — 박스 크기가 바뀌어도 같은 하늘이 뒤에 온다
    if (backdrop) {
      backdrop.material.uniforms.uSkyHeight.value = SKY_SPAN * (symbolSize.y * s) / vh;
    }

    // 스케일이 바뀌면 thickness 를 역산해 유리 농도를 일정하게 유지
    const thickness = GLASS_THICKNESS_WORLD / Math.max(s, 0.0001);
    symGroup.traverse((o) => {
      if (o.isMesh && o.material) o.material.thickness = thickness;
    });
  }

  /* --- 배경(하늘) ---
     모델과 배경이 '둘 다' 준비된 뒤에 캔버스를 페이드인한다.
     하나라도 먼저 보이면 굴절시킬 대상이 없어 유리가 검게 보인다. */
  function reveal() {
    if (modelReady && backdropSettled) mount.classList.add('is-ready');
  }

  /* 배경 텍스처를 넣는다. 처음이면 평면을 만들고, 이미 있으면 텍스처만 갈아끼운다.
     정지 이미지 → 영상 승격이 이 경로로 이뤄진다 (평면을 다시 만들지 않으므로 끊김이 없다). */
  function setBackdropTexture(texture, aspect) {
    if (!backdrop) {
      backdrop = makeBackdrop(texture);
      scene.add(backdrop);
    } else {
      backdrop.material.uniforms.uMap.value = texture;
    }
    backdrop.material.uniforms.uImageAspect.value = aspect;
    fitBackdrop(backdrop, camera);
    fitSymbol();
    backdropSettled = true;
    reveal();
    requestOnce();
  }

  /* ① 가벼운 정지 이미지를 먼저 깔아 곧바로 보여준다 (영상은 그 뒤에 얹는다) */
  new THREE.TextureLoader().load(BACKDROP_IMAGE_SRC, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    setBackdropTexture(tex, tex.image.width / tex.image.height);
  }, undefined, () => {
    console.warn('[logo3d] 배경 이미지 로드 실패:', BACKDROP_IMAGE_SRC);
    // 이미지가 실패해도 로고 자체는 보여준다 (영상이 오면 그때 배경이 붙는다)
    backdropSettled = true;
    reveal();
  });

  const video = document.createElement('video');
  video.src = BACKDROP_VIDEO_SRC;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  // DOM 에 붙지 않은 video 는 브라우저가 디코딩을 보류할 수 있다 → 숨겨서 붙인다
  video.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
  mount.appendChild(video);

  let videoReady = false;

  /* 재생 상태를 한 곳에서 맞춘다.
     '보이는가 × 준비됐는가' 를 매번 다시 평가하므로 IntersectionObserver 와 loadeddata 중
     어느 쪽이 먼저 오든 결과가 같다. 예전에는 IO 가 loadeddata 보다 먼저 발화하면
     (videoReady 가 아직 false) 재생 호출이 영영 누락돼 영상이 첫 프레임에 멈춰 있었다. */
  function syncVideoPlayback() {
    if (!videoReady) return;
    const shouldPlay = onScreen && !document.hidden;
    if (shouldPlay && video.paused) video.play().catch(() => {});
    else if (!shouldPlay && !video.paused) video.pause();
  }

  /* ② 영상이 '첫 프레임까지' 준비되면 배경을 영상으로 승격한다.
     loadedmetadata 가 아니라 loadeddata 를 기다리는 이유: loadedmetadata 는 해상도만 확정된
     시점(readyState 1)이라 디코딩된 프레임이 없고, 그 상태의 VideoTexture 는 검게 읽힌다.
     정지 이미지가 영상의 실제 프레임이라 교체 순간이 눈에 띄지 않는다.
     영상이 끝내 안 오면(자동재생 차단, 네트워크 실패) 정지 이미지가 그대로 남는다. */
  video.addEventListener('loadeddata', () => {
    if (!video.videoWidth) return;
    videoReady = true;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    setBackdropTexture(tex, video.videoWidth / video.videoHeight);
    syncVideoPlayback();
  }, { once: true });

  video.play().catch(() => {});

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(SYMBOL_SRC, (gltf) => {
    const symbol = gltf.scene;
    symGroup.add(symbol);

    symbol.traverse((o) => {
      if (!o.isMesh) return;
      o.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(SYMBOL_GLASS.color),
        roughness: SYMBOL_GLASS.roughness,
        metalness: 0,
        transparent: true,
        opacity: SYMBOL_GLASS.opacity,
        transmission: SYMBOL_GLASS.transmission,
        thickness: SYMBOL_GLASS.thickness,
        ior: SYMBOL_GLASS.ior,
        attenuationColor: new THREE.Color(SYMBOL_GLASS.attenuationColor),
        attenuationDistance: SYMBOL_GLASS.attenuationDistance,
        envMapIntensity: SYMBOL_GLASS.envMapIntensity,
        clearcoat: SYMBOL_GLASS.clearcoat,
        clearcoatRoughness: SYMBOL_GLASS.clearcoatRoughness,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      // GLB 에 노멀이 없다 (용량 절감) — 로드 시 계산
      o.geometry.computeVertexNormals();
    });

    // 모델을 그룹 중앙으로
    const box = new THREE.Box3().setFromObject(symbol);
    symbolSize = box.getSize(new THREE.Vector3());
    symbol.position.sub(box.getCenter(new THREE.Vector3()));

    floatAnim = createFloatAnimation(symbol);
    modelReady = true;
    reveal();
    resize();
  }, undefined, (e) => console.warn('[logo3d] 로고 로드 실패:', e));

  /* --- 호버 --- */
  function onPointerMove(event) {
    if (reduceMotion) return;
    const r = mount.getBoundingClientRect();
    const inside =
      event.clientX >= r.left && event.clientX <= r.right &&
      event.clientY >= r.top  && event.clientY <= r.bottom;
    hoverTarget = inside ? 1 : 0;
    if (inside) {
      // 컨테이너 중심 기준 -1..1 방향
      hoverDirX = Math.max(-1, Math.min(1, (event.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      hoverDirY = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - event.clientY) / (r.height / 2)));
    }
    schedule();
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', () => { hoverTarget = 0; }, { passive: true });

  /* --- 화면에 보일 때만 렌더 --- */
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    syncVideoPlayback();
    if (onScreen) requestOnce();
  }, { rootMargin: '100px' });
  io.observe(mount);

  document.addEventListener('visibilitychange', () => {
    syncVideoPlayback();
    if (!document.hidden) requestOnce();
  });

  let resizeRAF = null;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(resize);
  });

  /* --- 루프 --- */
  function tick() {
    rafId = null;
    if (!onScreen || document.hidden) return;   // 화면 밖이면 여기서 멈춘다

    hoverPower += (hoverTarget - hoverPower) * HOVER_LERP;
    if (hoverPower < 0.001) hoverPower = 0;

    // 자기장 오프셋 — 커서 방향으로 로고 전체를 부드럽게 당김
    const unit = symbolSize ? symGroup.scale.x * symbolSize.x : 0;
    const targetMagX = hoverDirX * unit * HOVER_MAGNETIC_STRENGTH * hoverPower;
    const targetMagY = hoverDirY * unit * HOVER_MAGNETIC_STRENGTH * hoverPower;
    magX += (targetMagX - magX) * HOVER_MAGNETIC_LERP;
    magY += (targetMagY - magY) * HOVER_MAGNETIC_LERP;
    symGroup.position.set(magX, magY, 0);

    if (floatAnim && !reduceMotion) {
      applyFloatAnimation(floatAnim, performance.now() * 0.001, hoverPower);
    }

    renderer.render(scene, camera);
    needsOnce = false;

    // 모션이 살아있으면 계속, 아니면 여기서 자연히 멈춘다
    if (!reduceMotion) schedule();
  }

  resize();
}

/* .js-logo3d 를 가진 요소면 어디든, 몇 개든 마운트한다.
   위치·크기가 바뀌어도 색감과 질감이 유지되는 이유는 아래 두 가지가 컨테이너가 아니라
   '로고 자체'에 맞춰 매번 다시 계산되기 때문이다 (GLASS_THICKNESS_WORLD / SKY_SPAN 주석 참고).
     - 유리 농도: thickness 를 모델 스케일로 나눠 흡수량을 일정하게 유지
     - 하늘 프레이밍: 하늘 높이를 로고 높이에 비례시켜 같은 하늘이 뒤에 오도록 고정 */
function initAll() {
  document.querySelectorAll(MOUNT_SELECTOR).forEach(initLogo3D);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
