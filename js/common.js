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
})();
