/* ============================================================
   Wildy Riftian — clone
   index.js — home page only (hero parallax, about ticket)
   Requires common.js.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Hero scroll parallax (keychain zoom) ---------- */
  var heroLayers = document.querySelectorAll('.hero .kc-layer');
  var layerFx = {
    'kc-padlock':      { s: 0,    tx: 0 },
    'kc-illustration': { s: 0.12, tx: 20 },
    'kc-photoworks':   { s: 0.12, tx: 20 },
    'kc-editorial':    { s: 0.07, tx: -11 },
    'kc-branding':     { s: 0.12, tx: -21 },
    'kc-motion':       { s: 0.12, tx: -21 }
  };
  function heroParallax() {
    var vh = window.innerHeight;
    var p = Math.min(Math.max(window.scrollY / vh, 0), 1.2);
    var ty = -0.103 * vh * p;
    heroLayers.forEach(function (layer) {
      var fx;
      for (var k in layerFx) {
        if (layer.classList.contains(k)) { fx = layerFx[k]; break; }
      }
      if (!fx) return;
      layer.style.transform =
        'translate(' + (fx.tx * p) + 'px,' + ty + 'px) scale(' + (1 + fx.s * p) + ')';
    });
  }
  if (heroLayers.length) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { heroParallax(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    heroParallax();
  }

  /* ---------- About ticket cycle (typewriter) ---------- */
  var disciplines = [
    { num: '01', name: 'MOTION DESIGN',    word: 'motion design' },
    { num: '02', name: 'BRANDING',         word: 'branding' },
    { num: '03', name: 'EDITORIAL DESIGN', word: 'editorial design' },
    { num: '04', name: 'PHOTOGRAPHY',      word: 'photography' },
    { num: '05', name: 'ILLUSTRATION',     word: 'illustration' },
    { num: '06', name: '3D TECH',          word: '3D tech' }
  ];
  var idx = 0;
  var tpNum = document.querySelector('.tp-num');
  var tpName = document.querySelector('.tp-name');
  var tpCounter = document.querySelector('.tp-counter');
  var tpImg = document.querySelector('.tp-img');
  var wordEl = document.querySelector('.word-script');
  var cycleTimer = null;

  function renderWord(word) {
    wordEl.textContent = '';
    var chars = word.split('');
    chars.forEach(function (ch, i) {
      if (ch === ' ') {
        wordEl.appendChild(document.createTextNode(' '));
        return;
      }
      var s = document.createElement('span');
      s.className = 'ltr';
      s.textContent = ch;
      s.style.animationDelay = (i * 0.045) + 's';
      wordEl.appendChild(s);
    });
  }

  function applyIndex(i) {
    idx = (i + disciplines.length) % disciplines.length;
    var d = disciplines[idx];
    tpNum.textContent = d.num;
    tpName.textContent = d.name;
    tpCounter.textContent = d.num + ' / 06';
    tpImg.classList.add('switching');
    var next = 'assets/images/about-obj-' + (idx + 1) + '.png';
    setTimeout(function () {
      tpImg.src = next;
      tpImg.classList.remove('switching');
    }, 180);
    renderWord(d.word);
  }

  function startCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(function () { applyIndex(idx + 1); }, 1600);
  }

  if (tpNum && tpName && tpCounter && tpImg && wordEl) {
    document.querySelector('.word-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      applyIndex(idx - 1);
      startCycle();
    });
    document.querySelector('.word-next').addEventListener('click', function (e) {
      e.stopPropagation();
      applyIndex(idx + 1);
      startCycle();
    });
    applyIndex(0);
    startCycle();
  }

  /* ---------- Ticket flip on touch devices ---------- */
  var ticket = document.getElementById('ticket');
  if (ticket) {
    ticket.addEventListener('click', function () {
      if (window.matchMedia('(hover: none)').matches && window.innerWidth >= 1280) {
        ticket.classList.toggle('flipped');
      }
    });
  }

  /* ---------- Work window (works 섹션 폴더탭) ----------
     ① .work-window-body 를 정확히 16:9 로 만든다. 창 전체가 아니라 화면 영역이
        16:9 여야 하는데, 타이틀바(27px)를 뺀 역산은 CSS 로 안 돼서 여기서 px 로
        넣는다.
     ② 그 안의 사이트는 "화면만 줄어든" 게 아니라 사이트 자체가 프레임에 들어가야
        하므로, iframe 을 1920x1080 데스크톱 뷰포트로 렌더한 뒤 프레임 폭 비율로
        축소한다. (프레임이 좁아져도 안쪽이 모바일 레이아웃으로 안 바뀐다) */
  var WW_TITLEBAR = 27;   /* .work-window-titlebar height */
  var WW_BORDER = 2;      /* .work-window 좌우/상하 1px 테두리 (border-box) */

  /* iframe 안 사이트가 렌더될 기준 뷰포트 폭 — 화면 크기에 따라 다르게 준다.
     이 폭이 곧 "저 사이트가 자기를 얼마짜리 화면으로 아는가" 라, 데스크톱 전용
     3D·영상이 켜질지 말지와 그 해상도까지 여기서 갈린다.
     실측: 아쿠아플라넷을 1920 으로 렌더시키면 WebGL 버퍼가 8.55M 픽셀까지
     올라가고(1280 이면 4.22M), 좁은 폭에서는 3D 가 아예 생성되지 않는다.
       데스크톱  1920 — 원래 의도(데스크톱 화면 통째로)
       태블릿    1024 — 태블릿 기준으로 보여준다. 픽셀 부담이 절반 이하로 준다
       모바일       0 — iframe 을 아예 안 쓴다(.work-window-link 로 대체) */
  function wwSiteWidth() {
    if (window.matchMedia('(max-width: 809.98px)').matches) return 0;
    if (window.matchMedia('(max-width: 1279.98px)').matches) return 1024;
    return 1920;
  }

  var workWindows = document.querySelectorAll('.work-window');

  function layoutWorkWindow(win) {
    var outer = win.parentElement;
    var body = win.querySelector('.work-window-body');
    var frame = win.querySelector('.work-window-frame');
    if (!outer || !body || !frame) return;

    var cs = getComputedStyle(outer);
    var availW = outer.clientWidth -
      parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var availH = outer.clientHeight -
      parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    /* 화면(body)이 16:9 가 되는 최대 크기 — 가로/세로 여유 중 좁은 쪽에 맞춘다 */
    var bodyW = Math.min(availW - WW_BORDER, (availH - WW_BORDER - WW_TITLEBAR) * 16 / 9);
    if (!(bodyW > 0)) return;
    var bodyH = bodyW * 9 / 16;

    win.style.width = (bodyW + WW_BORDER) + 'px';
    win.style.height = (bodyH + WW_BORDER + WW_TITLEBAR) + 'px';

    /* 축소 배율은 계산값이 아니라 **실제로 그려진** body 크기에서 뽑는다 —
       브라우저가 flex 잔여 높이를 서브픽셀에서 반올림해 16:9 가 0.1px 쯤
       어긋나는데, 계산값을 쓰면 그만큼 사이트가 프레임에 안 맞고 틈이 생긴다.
       0.5px 는 덤 — scale() 결과가 픽셀에 딱 안 떨어질 때 프레임 오른쪽·아래에
       머리카락만 한 흰 줄이 남는 걸 덮는다(사이트는 그만큼만 잘린다). */
    var siteW = wwSiteWidth();
    if (!siteW) {
      /* 모바일 — iframe 을 안 쓰므로 억지로 키워둘 필요가 없다. 되돌려 놓지
         않으면 화면을 넓혔다 좁혔을 때 1920 짜리 설정이 남는다. */
      frame.style.width = '';
      frame.style.height = '';
      frame.style.transform = '';
      return;
    }
    var rect = body.getBoundingClientRect();
    var scale = (rect.width + 0.5) / siteW;
    frame.style.width = siteW + 'px';
    frame.style.height = ((rect.height + 0.5) / scale) + 'px';
    frame.style.transform = 'scale(' + scale + ')';
  }

  function layoutWorkWindows() {
    workWindows.forEach(layoutWorkWindow);
  }

  if (workWindows.length) {
    layoutWorkWindows();
    window.addEventListener('resize', layoutWorkWindows);
    if (window.ResizeObserver) {
      /* 창(자식)은 부모가 절대/flex 로 크기가 정해져 있어 부모를 되밀지 않는다 —
         관측 루프는 생기지 않는다. */
      var wwRO = new ResizeObserver(layoutWorkWindows);
      workWindows.forEach(function (win) {
        if (win.parentElement) wwRO.observe(win.parentElement);
      });
    }
  }

  /* ---------- Appear-on-scroll targets ---------- */
  WR.appear('.ticket, .work-title, .work-meta, .work-desc, .work-view, .wm-main, .wm-side');
})();
