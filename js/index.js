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
    var next = 'images/about-obj-' + (idx + 1) + '.png';
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

  /* ---------- Appear-on-scroll targets ---------- */
  WR.appear('.ticket, .work-title, .work-meta, .work-desc, .work-view, .wm-main, .wm-side');
})();
