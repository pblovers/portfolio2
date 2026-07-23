/* ============================================================
   Wildy Riftian — clone
   work-detail.js — photoworks 상세 갤러리 masonry
   원본은 이미지를 **짧은 열 우선**(shortest-column-first)으로 채운다.
   CSS column-count 는 문서순 균형 분배라 순서가 달라진다 → JS 로 분배.
   ============================================================ */
(function () {
  'use strict';

  var gallery = document.querySelector('.wd-gallery');
  if (!gallery) return;

  // 원본 이미지 목록(문서순)을 한 번만 보관한다.
  var sources = [].slice.call(gallery.querySelectorAll('img'));
  sources.forEach(function (img) {
    // width/height 속성으로 비율을 즉시 안다 (로드 전에도).
    var w = parseFloat(img.getAttribute('width')) || img.naturalWidth || 1;
    var h = parseFloat(img.getAttribute('height')) || img.naturalHeight || 1;
    img._ratio = h / w; // 열폭이 같으므로 높이 비율만 필요
  });

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
    var heights = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('div');
      c.className = 'wd-col';
      gallery.appendChild(c);
      cols.push(c);
      heights.push(0);
    }
    // 짧은 열 우선 배치
    sources.forEach(function (img) {
      var min = 0;
      for (var j = 1; j < n; j++) if (heights[j] < heights[min] - 0.001) min = j;
      cols[min].appendChild(img);
      heights[min] += img._ratio + 0.03; // +gap 근사 (열폭 대비)
    });
  };

  layout();
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(layout, 120);
  });
})();
