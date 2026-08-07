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

  /* ---------- About ticket cycle (typewriter) ----------
     원래 있던 6개(motion/branding/editorial/photography/illustration/3D tech)는
     레퍼런스 사이트 에셋(about-obj-1~6.png)이라 걷어내고, 실제 작업물로 하나씩
     채우는 중이다. 지금은 UI/UX(아쿠아플라넷) 하나뿐.
     여기에 항목을 추가하면 카운터('01 / 0N')·자동순환·좌우 화살표가 전부
     따라온다 — 아래 코드가 개수를 이 배열에서만 읽는다. */
  var disciplines = [
    { num: '01', name: 'UI/UX', word: 'UI/UX' }
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
    /* 총 개수는 배열에서 읽는다 — '/ 06' 로 박아두면 항목을 늘리거나 줄일 때마다
       카운터만 거짓말을 한다. 두 자리로 맞춘다(01 / 01). */
    var total = disciplines.length < 10 ? '0' + disciplines.length : '' + disciplines.length;
    tpCounter.textContent = d.num + ' / ' + total;
    /* 오브젝트가 이미지인 항목만 갈아끼운다 — UI/UX 는 이미지가 아니라
       3D 유리 로고(.js-logo3d)를 그 자리에 상시로 띄우고 있어서 tpImg 가 없다. */
    if (tpImg) {
      tpImg.classList.add('switching');
      var next = 'assets/images/about-obj-' + (idx + 1) + '.png';
      setTimeout(function () {
        tpImg.src = next;
        tpImg.classList.remove('switching');
      }, 180);
    }
    renderWord(d.word);
  }

  function startCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(function () { applyIndex(idx + 1); }, 1600);
  }

  /* tpImg 는 이제 필수가 아니다 — 3D 로고를 쓰는 항목에는 <img> 자체가 없다.
     여기에 넣어두면 그 경우 티켓 전체가 초기화되지 않는다. */
  if (tpNum && tpName && tpCounter && wordEl) {
    var prevBtn = document.querySelector('.word-prev');
    var nextBtn = document.querySelector('.word-next');
    applyIndex(0);
    if (disciplines.length > 1) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        applyIndex(idx - 1);
        startCycle();
      });
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        applyIndex(idx + 1);
        startCycle();
      });
      startCycle();
    } else {
      /* 항목이 하나면 넘길 데가 없다 — 화살표를 숨기고 자동순환도 안 건다.
         안 그러면 1.6초마다 같은 단어의 타자 애니메이션만 반복돼 산만하고,
         누를 수 없는 화살표만 남는다. 항목이 늘면 저절로 되살아난다. */
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  }

  /* ---------- Ticket flip on touch devices ----------
     [임시 잠금] 티켓 앞면을 수정하는 동안 뒤집히면 불편해서 꺼둔 상태다.
     css/index.css 의 .ticket:hover 규칙도 같은 이유로 주석 처리돼 있으니,
     되살릴 때 둘 다 함께 풀어야 한다(여기만 풀면 .flipped 가 붙어도 CSS 가
     없어서 아무 일도 안 일어난다). */
  // var ticket = document.getElementById('ticket');
  // if (ticket) {
  //   ticket.addEventListener('click', function () {
  //     if (window.matchMedia('(hover: none)').matches && window.innerWidth >= 1280) {
  //       ticket.classList.toggle('flipped');
  //     }
  //   });
  // }

  /* ---------- Work window (works 섹션 폴더탭) ----------
     ① .work-window-body 를 안에 담을 화면과 정확히 같은 비율로 만든다(데스크톱
        16:9, 태블릿은 세로 태블릿 820x1180). 창 전체가 아니라 화면 영역이 그
        비율이어야 하는데, 타이틀바(27px)를 뺀 역산은 CSS 로 안 돼서 여기서 px 로
        넣는다.
     ② 그 안의 사이트는 "화면만 줄어든" 게 아니라 사이트 자체가 프레임에 들어가야
        하므로, iframe 을 1920x1080 데스크톱 뷰포트로 렌더한 뒤 프레임 폭 비율로
        축소한다. (프레임이 좁아져도 안쪽이 모바일 레이아웃으로 안 바뀐다) */
  var WW_TITLEBAR = 27;   /* .work-window-titlebar height (브라우저 창일 때만) */
  var WW_BORDER = 2;      /* .work-window 좌우/상하 1px 테두리 (border-box) */
  /* 아이폰 목업(태블릿의 work-2/3)은 이제 실사 PNG(assets/images/iPhone-16-Plus.png,
     980x1980) 를 그대로 쓴다 — .work-window 자체가 그 이미지의 바운딩박스가
     되고(베젤·타이틀바 몫으로 따로 뺄 px 가 없다, 이미지 안에 이미 다 그려져
     있다), 화면(.work-window-body)은 css 가 %로 이미지의 "화면 구멍" 자리에
     앉힌다. 여기 필요한 건 그 화면 구멍이 원(정원) 모서리로 보이도록 실제
     렌더 폭 기준으로 border-radius 를 px 로 계산해 넣는 것뿐이다 — %
     border-radius 는 가로/세로 폭이 다르면 타원이 돼버린다. */
  var WW_PHONE_SCREEN_RADIUS_FRAC = 0.12;   /* 화면 폭 대비 모서리 반지름 비율(실측) */

  /* iframe 안 사이트가 렌더될 기준 뷰포트 폭 — 화면 크기에 따라 다르게 준다.
     이 폭이 곧 "저 사이트가 자기를 얼마짜리 화면으로 아는가" 라, 데스크톱 전용
     3D·영상이 켜질지 말지와 그 해상도까지 여기서 갈린다.
     실측: 아쿠아플라넷을 1920 으로 렌더시키면 WebGL 버퍼가 8.55M 픽셀까지
     올라가고(1280 이면 4.22M), 좁은 폭에서는 3D 가 아예 생성되지 않는다.
       데스크톱  1920 — 원래 의도(데스크톱 화면 통째로)
       태블릿     900 — 세로 태블릿(900x1200) 화면 그대로. 창도 그 비율로 선다
       모바일       0 — iframe 을 아예 안 쓴다(.work-window-link 로 대체)

     태블릿 폭이 820 이 아니라 900 인 이유: 아쿠아플라넷이 `@media (max-width:820px)`
     에서 히어로 3D 로고(.logo3d-wrap)를 아예 숨긴다. 820 으로 렌더하면 눌러야 할
     표지(로고 있는 히어로 이미지)와 눌러서 열리는 화면(로고 없는 히어로)이 서로
     달라진다. 900x1200 은 이 파일 CSS 주석의 태블릿 실측 목록에도 있는 크기다. */
  var WW_TABLET = { w: 900, h: 1200 };
  /* work-2(Layer)·work-3(Hanne)는 모바일 앱이라, 태블릿에서는 데스크톱 브라우저
     창이 아니라 아이폰 정면 목업 안에 담는다 — 실제 배포 사이트도 목업과 같은
     기종(아이폰 16 Plus, 논리 해상도 430x932)의 뷰포트 폭으로 렌더해야 그
     기종에 맞춰 반응형이 잡힌 실제 화면이 나온다. 390(표준 아이폰 폭)으로
     렌더했더니 Layer 사이트가 그 폭 기준 레이아웃으로 잡히고, 그걸 화면
     비율(430:932 에 가까운 목업 화면 구멍)에 늘려 넣다 보니 안 맞아 보였다.
     이건 "사이트를 몇 px 뷰포트로 렌더할까" 이지, 목업 이미지 크기와는 다른
     숫자다(이미지 비율은 WW_PHONE_IMAGE). */
  var WW_PHONE = { w: 430, h: 932 };
  /* iPhone-16-Plus.png 원본 픽셀 비율 — .work-window 자체를 이 비율로 맞춰야
     프레임이 찌그러지지 않는다. css/index.css 의 aspect-ratio:980/1980 과
     같은 값이어야 한다. */
  var WW_PHONE_IMAGE = { w: 980, h: 1980 };

  function wwIsTablet() {
    return window.matchMedia('(min-width: 810px) and (max-width: 1279.98px)').matches;
  }

  /* 이 브라우저의 "자리를 차지하는" 스크롤바 폭. 윈도우 크롬은 15px,
     맥/모바일의 오버레이 스크롤바는 0 이다(콘텐츠 위에 겹쳐 그려서 레이아웃
     폭을 안 먹는다). iframe 안쪽도 같은 규칙이라 부모 문서에서 한 번 재두고
     쓴다 — cross-origin 이라 안쪽을 직접 물어볼 수가 없다. */
  var wwSbwCache = null;
  function wwScrollbarWidth() {
    if (wwSbwCache !== null) return wwSbwCache;
    var probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
    document.body.appendChild(probe);
    wwSbwCache = probe.offsetWidth - probe.clientWidth;
    probe.parentNode.removeChild(probe);
    return wwSbwCache;
  }

  /* 태블릿에서 아이폰 목업으로 바뀌는 카드인지 — work-2/work-3 만 해당 */
  function wwIsPhoneCard(win) {
    return wwIsTablet() && !!win.closest('.work-2, .work-3');
  }

  function wwSiteWidth(win) {
    if (window.matchMedia('(max-width: 809.98px)').matches) return 0;
    if (wwIsPhoneCard(win)) return WW_PHONE.w;
    if (wwIsTablet()) return WW_TABLET.w;
    return 1920;
  }

  /* 창(.work-window) 전체의 가로:세로. 브라우저 창은 "화면" 자체가 곧
     .work-window-body 라 안에 담기는 화면 비율을 그대로 쓰지만, 아이폰
     목업은 .work-window 가 목업 이미지 전체(테두리 포함) 박스이므로
     이미지 원본 비율을 쓴다 — 화면 구멍 비율이 아니다(그건 css %가 안다). */
  function wwRatio(win) {
    if (wwIsPhoneCard(win)) return WW_PHONE_IMAGE.w / WW_PHONE_IMAGE.h;
    return wwIsTablet() ? WW_TABLET.w / WW_TABLET.h : 16 / 9;
  }

  var workWindows = document.querySelectorAll('.work-window');

  function layoutWorkWindow(win) {
    var outer = win.parentElement;
    var body = win.querySelector('.work-window-body');
    var frame = win.querySelector('.work-window-frame');
    if (!outer || !body || !frame) return;

    var isPhone = wwIsPhoneCard(win);
    /* 아이폰 목업은 .work-window 자체가 곧 목업 이미지 전체 박스라(베젤도
       그 안에 이미 그려져 있다) 따로 빼줄 타이틀바·테두리 몫이 없다 —
       0 이면 아래 계산에서 bodyW/bodyH 가 그대로 창 크기가 된다. 브라우저
       창만 타이틀바가 위에 붙고 테두리는 1px 로 무시할 만하다. */
    var titlebarH = isPhone ? 0 : WW_TITLEBAR;
    var borderW = isPhone ? 0 : WW_BORDER;

    var cs = getComputedStyle(outer);
    var availW = outer.clientWidth -
      parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var availH = outer.clientHeight -
      parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

    /* 화면(body)이 제 비율을 지키는 최대 크기 — 가로/세로 여유 중 좁은 쪽에 맞춘다.
       태블릿은 세로로 긴 화면이라 거의 항상 세로 여유가 먼저 걸린다(= 남는 폭이
       생기고, .wm-main 이 그 안에서 창을 가운데로 잡는다). */
    var ratio = wwRatio(win);
    var bodyW = Math.min(availW - borderW, (availH - borderW - titlebarH) * ratio);
    if (!(bodyW > 0)) return;
    var bodyH = bodyW / ratio;

    var winH = bodyH + borderW + titlebarH;
    win.style.width = (bodyW + borderW) + 'px';
    win.style.height = winH + 'px';
    /* CLICK ME 가 창 높이의 한가운데에 오도록 창 높이를 CSS 로 넘긴다 — 창이
       박스 위쪽에 붙어 있어서(align-items:flex-start) 박스 50% 로는 안 맞는다. */
    outer.style.setProperty('--win-h', winH + 'px');

    /* 축소 배율은 계산값이 아니라 **실제로 그려진** body 크기에서 뽑는다 —
       브라우저가 flex 잔여 높이를 서브픽셀에서 반올림해 16:9 가 0.1px 쯤
       어긋나는데, 계산값을 쓰면 그만큼 사이트가 프레임에 안 맞고 틈이 생긴다.
       0.5px 는 덤 — scale() 결과가 픽셀에 딱 안 떨어질 때 프레임 오른쪽·아래에
       머리카락만 한 흰 줄이 남는 걸 덮는다(사이트는 그만큼만 잘린다). */
    var siteW = wwSiteWidth(win);
    if (!siteW) {
      /* 모바일 — iframe 을 안 쓰므로 억지로 키워둘 필요가 없다. 되돌려 놓지
         않으면 화면을 넓혔다 좁혔을 때 1920 짜리 설정이 남는다. */
      frame.style.width = '';
      frame.style.height = '';
      frame.style.transform = '';
      return;
    }
    var rect = body.getBoundingClientRect();
    /* 화면 모서리를 정원으로 — %  border-radius 는 가로/세로 각각 다른 %가
       적용돼(화면이 세로로 길어서) 타원이 된다. 실제 렌더 폭 기준 px 로
       계산해야 목업 이미지 모서리 곡률과 맞는 원이 된다.
       isPhone 이 아닐 때 반드시 빈 문자열로 되돌려야 한다 — 인라인 스타일은
       resize 만으로는 안 지워져서, 태블릿 폭에서 한 번이라도 세팅된 뒤 창을
       넓혀 데스크톱(웹버전)으로 가면 이 px 값이 그대로 남아 work-2/3 브라우저
       창에도 둥근 모서리가 새어 들어갔었다. */
    body.style.borderRadius = isPhone ? (rect.width * WW_PHONE_SCREEN_RADIUS_FRAC) + 'px' : '';

    /* 세로로 넘치는 사이트(data-site-scrolls)는 iframe 안에 스크롤바가 생겨
       레이아웃 폭을 그만큼 먹는다 — 그러면 사이트가 siteW 가 아니라
       (siteW - 스크롤바) 로 배치돼 화면 오른쪽에 빈 띠가 남는다.
       실측(430x932 iframe 에 빨간 배경): Layer 는 15px 띠가 남고, 세로로
       안 넘치는 Hanne 은 안 남았다 — "Layer 만 안 맞는다" 의 정체가 이거다.
       iframe 을 스크롤바 폭만큼 더 넓게 잡으면 안쪽 레이아웃 폭이 정확히
       siteW 로 돌아온다. 배율은 siteW 기준 그대로라, 늘어난 스크롤바 몫은
       화면 구멍 오른쪽 바깥으로 밀려 .work-window-body 의 overflow:hidden
       에 잘린다. 오버레이 스크롤바(맥)면 폭이 0 이라 아무 일도 안 일어난다. */
    var gutter = frame.hasAttribute('data-site-scrolls') ? wwScrollbarWidth() : 0;
    var scale = (rect.width + 0.5) / siteW;
    frame.style.width = (siteW + gutter) + 'px';
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

  /* ---------- 클릭 전 표지 (work-1 아쿠아플라넷) ----------
     표지를 누르기 전까지는 창 안이 히어로 이미지고, iframe 은 pointer-events 가
     꺼져 있어 스크롤·클릭이 그 사이트로 들어가지 않는다. 누르면 is-live 를 붙여
     표지를 걷어내고 그때부터 사이트를 직접 쓴다.
     (다시 잠그는 건 js/works-intro.js — 카드가 화면에서 벗어나 iframe 을 떼면
     빈 창이 남으므로 표지를 되돌려 놓는다.) */
  document.querySelectorAll('.work-window-poster').forEach(function (poster) {
    poster.addEventListener('click', function () {
      var body = poster.closest('.work-window-body');
      if (!body) return;
      body.classList.add('is-live');
      var frame = body.querySelector('.work-window-frame');
      if (frame) frame.focus();
    });
  });

  /* ---------- Appear-on-scroll targets ---------- */
  WR.appear('.ticket, .work-title, .work-meta, .work-desc, .work-view, .wm-main, .wm-side');
})();
