/* ============================================================
   Wildy Riftian — clone
   works.js — /works page only
   Requires common.js.

   커서 드리프트는 없다. 원본을 커서 x=120 / x=300 에서 각각 재봤는데
   호버한 폴더의 썸네일 좌표가 완전히 동일했다 (works.css 참고).
   드리프트를 주면 커서 위치에 따라 최대 25px 어긋난다.
   ============================================================ */
(function () {
  'use strict';

  var folders = document.querySelectorAll('.wf');
  if (!folders.length) return;

  /* 터치 기기에는 확장 동작을 두지 않는다 — 원본도 모바일에서는
     폴더를 눌러 펼치지 않고 바로 이동한다.
     (이전 구현은 .wf-open 만 옮기고 썸네일은 display:none 이라
      화면상 아무 변화 없이 preventDefault 로 링크만 막고 있었다) */

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

  /* 진입 애니메이션은 CSS(@keyframes wfRise)가 담당한다.
     원본은 폴더가 **페이드 없이** 아래에서 올라오고, 상단 Works·Archive
     제목은 아예 움직이지 않는다. WR.appear 는 opacity 0 → 1 이라
     둘 다 원본과 다르다. */
})();
