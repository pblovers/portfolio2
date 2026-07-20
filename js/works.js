/* ============================================================
   Wildy Riftian — clone
   works.js — /works page only
   커서를 따라 썸네일이 드리프트하는 폴더 호버 인터랙션.
   Requires common.js.
   ============================================================ */
(function () {
  'use strict';

  var folders = document.querySelectorAll('.wf');
  if (!folders.length) return;

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (fine) {
    folders.forEach(function (f) {
      var raf = null;
      var body = f.querySelector('.wf-body');

      function onMove(e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = body.getBoundingClientRect();
          // 폴더 중심 기준 커서 오프셋
          var dx = e.clientX - (r.left + r.width / 2);
          var dy = e.clientY - (r.top + r.height / 2);
          f.style.setProperty('--mx', dx.toFixed(1) + 'px');
          f.style.setProperty('--my', dy.toFixed(1) + 'px');
        });
      }

      function onLeave() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        f.style.setProperty('--mx', '0px');
        f.style.setProperty('--my', '0px');
      }

      f.addEventListener('pointermove', onMove, { passive: true });
      f.addEventListener('pointerleave', onLeave, { passive: true });
    });
  }

  /* 터치 기기: 탭하면 해당 폴더가 열린 상태로 전환 */
  if (!fine) {
    folders.forEach(function (f) {
      f.addEventListener('click', function (e) {
        if (!f.classList.contains('wf-open')) {
          e.preventDefault();
          folders.forEach(function (o) { o.classList.remove('wf-open'); });
          f.classList.add('wf-open');
        }
      });
    });
  }

  /* Archive 탭 — 원본에서도 아직 비어 있는 자리 표시자 */
  var archive = document.getElementById('archive');
  if (archive) {
    archive.addEventListener('click', function () {
      archive.animate(
        [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
        { duration: 420, easing: 'ease' }
      );
    });
  }

  /* 진입 애니메이션 */
  WR.appear('.wtab, .wf');
})();
