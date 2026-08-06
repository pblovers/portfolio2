/* =============================================================
   project-aquaplanet.html — 히어로 글자 등장 인터랙션

   실제 구현(글자 쪼개기 + 블러/페이드/올라오기)은 js/char-reveal.js 로
   빼서 index.html 의 히어로 태그라인·RESENT WORK·(About me) 와 공유한다.
   여기서는 이 페이지의 대상과 타이밍만 정한다.
   ============================================================= */
(function () {
  function init() {
    /* 제목(.aq-hero-title)과 정보(.aq-hero-info 안 분류·연도·설명)를 한 번에
       넘겨 **동시에** 시작시킨다. 글자 크기에 따른 duration·stagger 차이는
       char-reveal.js 가 알아서 주므로, 큰 제목이 더 느긋하게 풀리는 결은
       그대로 남는다. */
    if (window.WR && WR.charReveal) {
      WR.charReveal('.aq-hero-title, .aq-hero-meta p, .aq-hero-desc p', { delay: 0.15 });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
