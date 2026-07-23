/* ============================================================
   Wildy Riftian — clone
   work-detail.js — photoworks 상세 갤러리 masonry
   원본은 열을 **저자가 수동 배치**한다(단일 알고리즘으로 재현 불가). 그래서 각 이미지에
   데스크톱(3열) 실제 열을 data-col 로 박아뒀다(pwscrape 캡처). HTML 순서는 행 인터리브.
   - 데스크톱(3열): data-col 그대로 → 원본과 정확히 일치.
   - 태블릿(2열)·모바일(1열): 원본 브레이크포인트 레이아웃은 따로 안 재고 DOM(인터리브)
     순서로 round-robin 재배치 (넘침 없이 자연스럽게 흐른다).
   ============================================================ */
(function () {
  'use strict';

  var gallery = document.querySelector('.wd-gallery');
  if (!gallery) return;

  // 원본 이미지 목록(문서순 = 저자 순서)을 한 번만 보관한다.
  var sources = [].slice.call(gallery.querySelectorAll('img'));

  var colCountFor = function () {
    var w = window.innerWidth;
    if (w <= 809) return 1;
    if (w <= 1279) return 2;
    return 3;
  };

  var current = -1;

  var layout = function () {
    var n = colCountFor();
    if (n === current) return;
    current = n;

    // 기존 열 제거, 이미지 회수
    gallery.innerHTML = '';
    var cols = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'wd-col';
      gallery.appendChild(c);
      cols.push(c);
    }
    // 3열: 원본 실제 열(data-col). 그 외: DOM순 round-robin.
    sources.forEach(function (img, idx) {
      var c = idx % n;
      if (n === 3) {
        var dc = parseInt(img.getAttribute('data-col'), 10);
        if (dc >= 0 && dc < 3) c = dc;
      }
      cols[c].appendChild(img);
    });
  };

  layout();
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(layout, 120);
  });
})();
