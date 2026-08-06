/* =============================================================
   works-intro — "RESENT / WORK" 화면 (피그마 node 1102:548)

   포트폴리오수업 레퍼런스의 .con02 .title 애니메이션(js/script.js)을 그대로
   가져온다: 두 줄이 좌우 화면 밖(-100%/100%)에서 가운데(0%)로 모였다가,
   나중에 다시 좌우로 흩어진다.

   레퍼런스와 같은 지점: 텍스트가 다 모이면(들어오기 완료) position:fixed 로
   바꿔 화면에 그대로 고정해 두고, 그 위로 다음 콘텐츠가 스크롤되며 덮게
   놔둔다 — 레퍼런스는 그 위로 workList 가 지나가고, 여기서는 work-1→2→3
   폴더탭이 차례로 스택되며 지나간다(전부 z-index:auto 라 DOM 순서상 뒤에
   오는 폴더탭이 자동으로 위에 그려져 텍스트를 가린다, 별도 z-index 불필요).
   마지막 폴더탭(work-3)이 자기 차례를 마치고 화면 밖으로 완전히 사라지는
   구간에 맞춰서만 다시 흩어지는 애니메이션을 재생한다 — 그 전까지는(work-1,
   work-2 가 지나가는 동안) 텍스트는 고정된 채 그대로 있고 카드에 가려져
   안 보일 뿐이다. */
(function () {
  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var section = document.querySelector('.js-works-intro');
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);

    /* Lenis 가 스크롤을 부드럽게 대신 처리하므로, ScrollTrigger 가 매 프레임
       Lenis 의 스크롤값과 어긋나지 않도록 Lenis 의 'scroll' 이벤트마다
       ScrollTrigger 를 갱신시킨다(js/common.js 가 WR.lenis 로 인스턴스를 공개). */
    if (window.WR && WR.lenis) {
      WR.lenis.on('scroll', ScrollTrigger.update);
    }

    /* 이 섹션 텍스트가 196px 웹폰트(Cormorant Garamond)라 로드가 늦게 끝나면
       그 사이에 캐시된 start/end(스크롤 트리거는 등록 시점의 레이아웃을
       기준으로 삼는다) 가 실제 폰트 적용 후 레이아웃과 어긋난다 — 특히
       work-3 의 흩어지기 구간처럼 문서 맨 끝에 걸린 트리거는 그 오차만큼
       끝까지 못 가고 중간에 멈춰 보일 수 있다. 폰트 로드가 끝나면 다시 재본다. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });

    var inner = section.querySelector('.wi-inner');
    var lineA = section.querySelector('.wi-line-a');
    var lineB = section.querySelector('.wi-line-b');
    var lastWork = document.querySelector('.work-3') || document.querySelector('.work:last-of-type');
    if (!lastWork) return;

    /* 좌우로 뺄 때 xPercent(자기 폭 기준 이동)를 쓰면, 이 텍스트처럼 뷰포트
       폭에 거의 맞먹는 큰 글자는 "-100%" 만큼 옮겨도 반대쪽 끝이 여전히
       화면 안에 남는다(자기 폭만큼만 움직이지, 화면을 벗어나는 거리만큼
       움직이는 게 아니라서). 화면 폭 기준(vw)으로 넉넉히 옮겨서 글자 크기와
       무관하게 항상 뷰포트 밖으로 완전히 나가도록 한다. */
    var OFFSCREEN_VW = 120;

    /* 들어오기 — works-intro 자신이 화면 아래에서 올라와 자리 잡는 구간
       (top:뷰포트 바닥 → top:뷰포트 꼭대기) 동안 좌우에서 가운데로 모인다. */
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 1,
      },
    })
      .fromTo(lineA, { x: -OFFSCREEN_VW + 'vw' }, { x: 0, ease: 'none' }, 0)
      .fromTo(lineB, { x: OFFSCREEN_VW + 'vw' }, { x: 0, ease: 'none' }, 0);

    /* works-intro 가 정확히 그 순간(top top) 완전히 자리 잡으면(=work-1 폴더탭이
       바로 뒤이어 밑에서 올라오기 시작하는 시점과 정확히 같은 스크롤 위치),
       텍스트를 position:fixed 로 바꿔 화면 정중앙에 그대로 고정해 둔다.
       works-intro 자신은 그 직후 곧바로 sticky 예산이 끝나 화면 밖으로
       스크롤돼 사라지지만(원래 있던 자리가 아니라 화면 자체에 고정됐으니
       상관없다), 텍스트는 이후 work-1/2/3 이 차례로 위를 지나가는 동안
       계속 같은 자리에 고정된 채 그 카드들에 가려져 있는다.
       고정 직전(sticky 로 이미 뷰포트 전체를 차지한 상태)과 고정 직후(뷰포트
       정중앙)가 정확히 같은 화면 좌표라 전환 시 시각적으로 튀지 않는다. */
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      onEnter: function () {
        gsap.set(inner, { position: 'fixed', left: '50%', top: '50%', xPercent: -50, yPercent: -50 });
      },
      onLeaveBack: function () {
        gsap.set(inner, { clearProps: 'position,left,top,xPercent,yPercent' });
      },
    });

    /* 흩어지기 — 마지막 폴더탭(work-3)이 완전히 고정된 뒤 그 높이의 2/3 만큼
       더 스크롤될 때까지는(= work-3 가 3분의 2 지나가 3분의 1만 남을 때까지)
       그냥 모여있는 채로 두고, 남은 마지막 1/3 구간(66.66% → bottom, 즉
       work-3 가 화면 밖으로 완전히 사라지는 지점까지)에서만 흩어진다.
       그 전(work-1, work-2 가 지나가는 동안 + work-3 의 앞 2/3)에는 이
       트리거 범위 밖이라 텍스트가 고정된 채 가만히 있는다. */
    gsap.timeline({
      scrollTrigger: {
        trigger: lastWork,
        start: '66.66% top',
        end: 'bottom top',
        scrub: 1,
      },
    })
      .to(lineA, { x: -OFFSCREEN_VW + 'vw', ease: 'none' }, 0)
      .to(lineB, { x: OFFSCREEN_VW + 'vw', ease: 'none' }, 0);

    /* ---------------------------------------------------------------
       각 폴더탭의 iframe(work-1 아쿠아플라넷 / work-2,3 임시 Layer) — 전부
       pointer-events:auto 라(css/index.css, 클릭·호버·자기 스크롤이 되도록)
       다음 카드가 스택되어 덮어도 스크롤·클릭이 화면 자리에 그대로 남아있는
       "가려진" 카드의 iframe으로 새어 들어간다. 각 카드가 실제로 화면에
       보일 때만(=다음 카드가 덮기 전까지만) 그 카드의 iframe 인터랙션을 켠다. */
    var workEls = Array.prototype.slice.call(document.querySelectorAll('.work'));
    workEls.forEach(function (workEl, i) {
      var frame = workEl.querySelector('.work-window-frame');
      var nextWorkEl = workEls[i + 1];
      if (!frame || !nextWorkEl) return;
      ScrollTrigger.create({
        trigger: nextWorkEl,
        start: 'top bottom',
        onEnter: function () { frame.style.pointerEvents = 'none'; },
        onLeaveBack: function () { frame.style.pointerEvents = ''; },
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
