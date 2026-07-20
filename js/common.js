/* ============================================================
   Wildy Riftian — clone
   common.js — shared by every page (menu overlay, appear-on-scroll)
   Must load before any page-specific script.
   ============================================================ */
(function () {
  'use strict';

  window.WR = window.WR || {};

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
      wordmark.style.transformOrigin = 'left bottom';
      wordmark.style.transform = 'scaleX(' + (avail / natural) + ')';
    };
    fitWordmark();
    window.addEventListener('resize', fitWordmark);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWordmark);
  }
})();
