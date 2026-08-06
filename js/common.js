/* ============================================================
   Wildy Riftian — clone
   common.js — shared by every page (menu overlay, appear-on-scroll)
   Must load before any page-specific script.
   ============================================================ */
(function () {
  'use strict';

  window.WR = window.WR || {};

  /* ---------- Smooth scroll (Lenis) ----------
     원본은 Lenis(lenis lenis-smooth)로 스크롤을 부드럽게 감속시킨다.
     네이티브 스크롤은 딱딱하고 느리게 느껴진다. 라이브러리는 js/lenis.min.js
     로 로컬 벤더링했다 (globalThis.Lenis). reduced-motion 이면 켜지 않는다. */
  var lenis = null;
  if (window.Lenis && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    var rafLoop = function (time) { lenis.raf(time); requestAnimationFrame(rafLoop); };
    requestAnimationFrame(rafLoop);
    WR.lenis = lenis;
  }

  /* ---------- 이미지 디코딩을 메인스레드에서 분리 ----------
     대형 원본 이미지가 스크롤 중 뷰포트에 들어올 때 동기 디코딩되면 그 프레임이
     끊긴다(뚝뚝). decoding=async 로 디코딩을 메인스레드에서 빼 스크롤을 매끄럽게 한다. */
  document.querySelectorAll('img').forEach(function (img) {
    if (!img.getAttribute('decoding')) img.decoding = 'async';
  });

  /* ---------- Detail page: 뷰포트 안에서만 영상 재생 ----------
     원본 상세(works/overbloom 등)의 영상은 preload="none" 이고 뷰포트에
     들어올 때만 재생된다. 우리는 5개 영상을 전부 autoplay 로 동시에 재생해
     스크롤이 버벅였다. IntersectionObserver 로 화면에 보이는 것만 재생하고
     벗어나면 멈춰 동시 디코딩 부하를 없앤다. */
  var detailVideos = document.querySelectorAll('.wd-page .std-content video');
  if (detailVideos.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    detailVideos.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Menu overlay ---------- */
  var overlay = document.getElementById('menuOverlay');
  var menuBtn = document.querySelector('.menu-btn');
  var menuClose = document.querySelector('.menu-close');

  if (overlay && menuBtn && menuClose) {
    var setMenu = function (open) {
      overlay.classList.toggle('open', open);
      overlay.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
      /* 곰 아이콘이 커지는 애니메이션(css/common.css .menu-btn.is-opening) */
      menuBtn.classList.toggle('is-opening', open);
      document.body.style.overflow = open ? 'hidden' : '';
      /* 메뉴가 열려 있는 동안은 Lenis 를 멈춰 뒤 페이지가 스크롤되지 않게 한다. */
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    };
    menuBtn.addEventListener('click', function () { setMenu(true); });
    menuClose.addEventListener('click', function () { setMenu(false); });
    overlay.querySelectorAll('.menu-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) setMenu(false);
    });
  }

  /* ---------- Header hide-on-scroll ----------
     원본 헤더는 fixed 로, 스크롤을 내리면 위로 사라지고(translateY -100%)
     올리면 다시 내려온다. 맨 위(≤56px)에서는 항상 보인다. ±2 데드존으로
     떨림을 막는다. Lenis 가 있으면 그 scroll 이벤트를, 없으면 네이티브를 쓴다. */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastY = (lenis ? lenis.scroll : window.scrollY) || 0;
    var updateHeader = function (y) {
      if (y <= 56) header.classList.remove('is-hidden');
      else if (y > lastY + 2) header.classList.add('is-hidden');
      else if (y < lastY - 2) header.classList.remove('is-hidden');
      lastY = y;
    };
    if (lenis) lenis.on('scroll', function (e) { updateHeader(e.scroll); });
    else window.addEventListener('scroll', function () { updateHeader(window.scrollY); }, { passive: true });
  }

  /* ---------- Appear-on-scroll ----------
     WR.appear('.sel-a, .sel-b') — fades elements in as they enter view.
     Each page calls this with its own targets. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  WR.appear = function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.add('appear');
      io.observe(el);
    });
  };

  /* footer disciplines exist on every page */
  WR.appear('.services a');

  /* ---------- Footer wordmark fit ----------
     원본은 고정 119.539px 폰트를 가로로만 scaleX 늘려 좌우 여백까지
     정확히 채운다(높이 불변). CSS 로는 length/length 비율을 못 구하므로
     자연폭을 재서 scaleX 를 직접 준다. 모든 페이지 공통. */
  var wordmark = document.querySelector('.wordmark');
  if (wordmark) {
    var fitWordmark = function () {
      wordmark.style.transform = 'none';
      var natural = wordmark.getBoundingClientRect().width;   // scaleX 해제 상태의 자연폭
      if (!natural) return;
      var cs = getComputedStyle(wordmark);
      var avail = wordmark.parentElement.clientWidth
        - parseFloat(cs.left || 0)
        - (parseFloat(getComputedStyle(wordmark.parentElement).paddingRight) || 0)
        - parseFloat(cs.right && cs.right !== 'auto' ? cs.right : 0);
      // 좌우 여백(--margin)만 뺀 가용폭
      var margin = parseFloat(cs.left) || 0;
      avail = wordmark.parentElement.clientWidth - margin * 2;
      // 원본은 <svg viewBox> + <foreignObject> 로 워드마크를 감싸 폭에 맞춰
      // 뷰박스를 늘린다 → 가로만이 아니라 세로도 같은 비율로 커진다.
      // 실측: 높이 = 96 x (가용폭 / 자연폭 1216.11)
      //   1440 → 1376/1216.11 = 1.1314, 높이 108.63
      //   1024 →  960/1216.11 = 0.7894, 높이  75.78
      //    768 →  736/1216.11 = 0.6052, 높이  58.09
      // scaleX 만 주면 높이가 95.63 에 고정돼 폭마다 자모 비율이 틀어진다.
      var s = avail / natural;
      wordmark.style.transformOrigin = 'left bottom';
      wordmark.style.transform = 'scale(' + s + ')';
      // 워드마크 위에 놓이는 링크 행이 이 높이만큼 밀린다.
      // transform 은 레이아웃에 영향이 없으므로 CSS 가 알 방법이 없다.
      document.documentElement.style.setProperty('--wm-h', (96 * s) + 'px');
      // 원본은 <p>(line-height 95.6315) 가 96 짜리 foreignObject 안에 위쪽
      // 정렬로 들어간다 → 글자 상자 하단이 svg 하단보다 (96-95.6315)*s 만큼 위다.
      // 1440 에서 0.42, 1920 에서 0.56. 이걸 빼야 원본과 y 가 맞는다.
      document.documentElement.style.setProperty('--wm-slack', (0.3685 * s) + 'px');
    };
    fitWordmark();
    window.addEventListener('resize', fitWordmark);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWordmark);
  }

  /* ---------- Custom cursor ----------
     기본은 핑크 블롭, 배경이 핑크인 요소 위에서는(안 그러면 핑크 위에 핑크라
     안 보인다) 화이트로 바뀐다. 마우스 버튼을 누르고 있는 동안 살짝 작아진다.
     마우스가 있는 기기에서만 켠다(CSS 의 hover:hover/pointer:fine 미디어쿼리와
     짝) — 터치 기기에서 mousemove 가 아예 안 오면 커서가 화면 구석에 뜬 채
     고정돼 있는 것처럼 보일 수 있어 JS 도 같은 조건으로 막는다.

     라이브러리 없이 rAF 로 직접 구현했다 — GSAP 같은 트윈 라이브러리를
     새로 불러올 만큼 무거운 작업이 아니고(transform·opacity 두 속성만
     건드리는 CSS transition이면 충분), 매 프레임 하는 일도 座표 대입 하나뿐이라
     추가 의존성을 들일 이유가 없다. cursor:none 자체도 렌더링 비용이 없다
     (아이콘을 안 그릴 뿐 컴포지팅에 영향 없음) — 실제로 무거워질 수 있는
     지점은 "마우스가 움직일 때마다 hit-test 하는 부분" 뿐이라 그 부분만
     rAF 로 1프레임에 1번으로 묶었다(옮기는 것 자체는 이벤트마다 바로 반영). */
  if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cursor = document.createElement('div');
    cursor.id = 'customCursor';
    document.body.appendChild(cursor);
    document.body.classList.add('has-custom-cursor');

    /* elementFromPoint 로 히트테스트하면 SEE ALL WORKS 클릭 통과를 위해
       pointer-events:none 을 걸어둔 .work/.work-content/.work-strip 같은
       요소들이 히트테스트에서 아예 빠져 핑크 카드 위인데도 그 뒤의 요소가
       잡힌다. pointer-events 와 무관하게 항상 맞는 결과를 내도록, 배경이
       핑크인 요소들을 로드 시 한 번만 스캔해 두고 매번은 좌표 포함 여부만
       (getBoundingClientRect, 히트테스트 아님) 확인한다. */
    var PINK = 'rgb(255, 74, 138)';
    var pinkEls = Array.prototype.filter.call(document.querySelectorAll('*'), function (el) {
      return getComputedStyle(el).backgroundColor === PINK;
    });
    /* .work-1~3 는 폴더처럼 쌓이는 구조라(각자 position:sticky) 스크롤이
       지나간 카드도 화면에서 안 사라지고 계속 같은 자리(top:0, 100vh)에
       남아 있다 — 나중 카드가 시각적으로만 위에 덮일 뿐, 이전 카드의
       .work-bg 도 여전히 같은 사각형을 차지한다. 그래서 3번째(회색) 카드
       위인데도 2번째(핑크) 카드의 배경 사각형이 좌표상 겹쳐 있어 핑크로
       오판했다. 어느 work 카드가 지금 실제로 맨 위인지(=DOM 순서상 가장
       나중이면서 이 좌표를 덮는 카드) 먼저 찾고, 다른 카드에 속한 후보는
       가려진 것으로 보고 무시한다. */
    var workCards = Array.prototype.slice.call(document.querySelectorAll('.work'));
    var topWorkAt = function (x, y) {
      for (var w = workCards.length - 1; w >= 0; w--) {
        var wr = workCards[w].getBoundingClientRect();
        if (x >= wr.left && x < wr.right && y >= wr.top && y < wr.bottom) return workCards[w];
      }
      return null;
    };
    var isOverPink = function (x, y) {
      var topWork = topWorkAt(x, y);
      for (var i = 0; i < pinkEls.length; i++) {
        var el = pinkEls[i];
        var owner = el.closest('.work');
        if (owner && owner !== topWork) continue; // 가려진 이전 카드 소속이면 건너뛴다
        /* .menu-overlay 는 닫혀 있어도(clip-path 로만 숨김) getBoundingClientRect 가
           여전히 뷰포트 전체를 돌려준다 — transform 기반이던 예전과 달리 박스 자체가
           화면 밖으로 안 나가기 때문. 닫힌 상태의 그 박스를 실제로 보이는 핑크로
           오판하지 않도록 열려 있을 때만 판정에 포함시킨다. */
        var menu = el.closest('.menu-overlay');
        if (menu && !menu.classList.contains('open')) continue;
        var r = el.getBoundingClientRect();
        if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) return true;
      }
      return false;
    };

    /* cursorX/cursorY 라는 이름을 쓴다 — 파일 위쪽 "Header hide-on-scroll" 도
       var lastY 를 쓰는데, var 는 블록이 아니라 함수(이 IIFE) 전체 스코프라
       이름이 같으면 실제로 같은 변수다. 전에 여기서도 lastX/lastY 를 썼더니
       스크롤할 때마다 헤더 쪽 코드가 그 변수에 "페이지 스크롤 위치"(예:
       3040)를 덮어써서, 커서가 마우스 Y 좌표 대신 스크롤 위치로 순간이동
       했었다 — 스크롤 중 커서가 깜빡이고 마음대로 움직이던 진짜 원인이 이거였다. */
    var rafId = null, cursorX = 0, cursorY = 0, hasPosition = false;
    var scheduleUpdate = function () {
      if (rafId || !hasPosition) return;
      rafId = requestAnimationFrame(function () {
        rafId = null;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        cursor.classList.toggle('is-white', isOverPink(cursorX, cursorY));
      });
    };
    /* 스크롤 중엔 마우스 자체는 화면 좌표상 그대로다(고정 커서니까 위치는
       안 바뀐다) — 다만 그 자리 밑에 있던 내용이 바뀌므로 핑크 판정은
       다시 해야 한다(스크롤해서 핑크 카드가 지나가는데 흰 커서로 남는 문제). */
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    if (lenis) lenis.on('scroll', scheduleUpdate);

    /* mousemove 대신 pointermove 를 쓴다 — pointerType 검사는 하이브리드
       기기(터치스크린 노트북)에서 터치를 마우스로 오인하지 않기 위한
       안전장치다(hover:hover 미디어쿼리만으로는 못 거른다). 좌표가 뷰포트
       밖이면(실제 포인터는 절대 그런 값을 보고하지 않는다) 버린다 —
       위 변수 충돌처럼 다른 곳에서 잘못 흘러든 값을 한 번 더 막아준다. */
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (e.clientX < 0 || e.clientY < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight) return;
      /* iframe(예: work-1 의 Aquaplanet 미리보기) 경계에 닿는 마지막 한 번은
         target 이 그 iframe 엘리먼트인 pointermove 가 부모 문서에도 찍힌다 —
         이걸 그대로 처리하면 바로 아래 mouseenter 핸들러가 숨긴 커서를 여기서
         다시 보여버려서(is-visible 재추가) 숨김이 무효화된다. iframe 이 타깃인
         이벤트는 위치 갱신·표시 모두 건너뛴다. */
      if (e.target && e.target.tagName === 'IFRAME') return;
      cursorX = e.clientX; cursorY = e.clientY;
      hasPosition = true;
      cursor.classList.add('is-visible');
      scheduleUpdate();
    });

    window.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') cursor.classList.add('is-down'); });
    window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') cursor.classList.remove('is-down'); });
    /* "뷰포트를 벗어났다" 는 relatedTarget 유무가 아니라 좌표로 판단한다 —
       relatedTarget 없는 pointerout 은 스크롤로 인한 내부 재계산에서도
       나올 수 있어 못 믿는다. 포인터 좌표가 뷰포트 경계에 닿았을 때만
       진짜로 나간 것이다. */
    document.addEventListener('pointerout', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        cursor.classList.remove('is-visible');
      }
    });

    /* iframe(예: work-1 의 Aquaplanet 미리보기) 위로 들어가면 그 안에서
       일어나는 pointermove 는 별도 문서라 부모로 안 올라온다 — 그대로 두면
       우리 커스텀 커서가 진입 직전 위치에 멈춰 iframe 내용 위에 겹쳐 보인다.
       iframe 경계에서 숨겼다가, 다시 나오면(mouseover 로 복귀 감지) 보여준다. */
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function (frame) {
      frame.addEventListener('mouseenter', function () {
        cursor.classList.remove('is-visible');
      });
    });
    document.addEventListener('mouseover', function (e) {
      if (e.target.tagName !== 'IFRAME' && hasPosition) {
        cursor.classList.add('is-visible');
      }
    });
  }
})();
