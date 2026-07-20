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
})();
