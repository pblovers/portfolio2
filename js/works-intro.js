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

    /* ---------------------------------------------------------------
       RESENT / WORK 의 블러 — 히어로·(About me) 와 같은 글자 단위 리빌인데,
       여기서만 시간이 아니라 **화면에서의 위치**에 물려 있다. 이 줄들은 좌우로
       들어왔다 나가는 게 전부라, 시간 기준으로 한 번 재생하면 들어오는 도중에
       리빌이 끝나버리고 나갈 때는 아무 일도 안 일어난다.
       화면 중앙에서 멀어질수록(=화면 바깥에 가까울수록) 흐려지게 하면, 들어올
       때는 블러에서 선명하게 / 나갈 때는 선명한 데서 블러로 자동으로 이어진다.
       기준을 "화면 중앙까지의 거리 / 화면 반폭" 으로 잡았으므로 변화가 전부
       화면 안에서 일어난다 — 화면 밖에서 이미 다 풀려버리는 일이 없다. */
    var charsA = (window.WR && WR.splitChars) ? WR.splitChars(lineA) : [];
    var charsB = (window.WR && WR.splitChars) ? WR.splitChars(lineB) : [];
    var MAX_BLUR = 26;      // px — 196px 글자 기준
    var lastT = [-1, -1];

    function applyEdgeBlur() {
      [[lineA, charsA, 0], [lineB, charsB, 1]].forEach(function (item) {
        var el = item[0], chars = item[1], slot = item[2];
        if (!chars.length) return;
        var rect = el.getBoundingClientRect();
        var half = window.innerWidth / 2;
        var t = Math.min(1, Math.abs(rect.left + rect.width / 2 - half) / half);
        /* 스크롤이 멈춰 있으면 같은 값을 매 프레임 다시 쓰지 않는다 */
        if (Math.abs(t - lastT[slot]) < 0.002) return;
        lastT[slot] = t;
        for (var i = 0; i < chars.length; i++) {
          /* 뒤쪽 글자일수록 조금 늦게 선명해진다 — aq-hero 리빌의 stagger 를
             시간이 아니라 위치로 옮긴 것 */
          var ct = Math.min(1, t * (1 + i * 0.05));
          var e = ct * ct;   // 가운데 근처에서 빠르게 선명해져 잘 읽힌다
          chars[i].style.filter = 'blur(' + (MAX_BLUR * e).toFixed(2) + 'px)';
          chars[i].style.opacity = (1 - 0.85 * e).toFixed(3);
        }
      });
    }

    /* 스크롤 이벤트가 아니라 매 프레임 돈다 — 위 타임라인이 scrub:1 이라 스크롤을
       멈춘 뒤에도 1초쯤 더 미끄러지는데, 그 구간에서도 블러가 같이 따라와야 한다.
       값이 안 변하면 위에서 바로 빠져나오므로 비용은 rect 두 번이 전부다. */
    applyEdgeBlur();
    gsap.ticker.add(applyEdgeBlur);
    window.addEventListener('resize', applyEdgeBlur);

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
       폴더탭 iframe — 그 카드가 실제로 보일 때만 살려둔다.

       왜 필요한가(실측): work-1 이 고정된 구간에서 커서를 움직이며 프레임 간격을
       재보면, iframe 을 전부 떼면 평균 6.9ms(50ms 넘는 프레임 0회), 지금처럼 셋 다
       살려두면 평균 37.5ms(50ms 초과 327회)다. longtask 는 0건이라 우리 JS 가
       메인스레드를 잡는 게 아니라, 살아있는 사이트들의 표면을 합성하느라 프레임이
       밀리는 것이다. 하나만 살리면 심한 잼이 327 → 196 회로 준다.

       "보인다" 를 화면 안에 있는지로 판단할 수 없다는 게 함정이다 — 카드들이
       sticky 로 같은 자리에 겹쳐 쌓여서, 뒤 카드가 덮고 있으면 앞 카드는 화면
       안에 있어도 안 보인다. 그래서 "화면에 걸쳐 있고, 다음 카드가 아직 화면을
       다 덮지 않았을 때" 를 살아있는 조건으로 쓴다. 두 카드가 겹치는 전환
       구간에서는 둘 다 살아 있는데, 그때는 실제로 둘 다 보이는 게 맞다.

       스크롤 위치에서 직접 계산한다 — 페이지 중간에서 새로고침하든 ScrollTrigger
       가 갱신되든 항상 맞고, 값이 안 바뀌면 바로 빠져나오므로 비용은 rect 몇 번이다. */
    var MOUNT_MARGIN = 300;   // 화면에 닿기 조금 전에 미리 붙여 로딩 시간을 번다
    var workEls = Array.prototype.slice.call(document.querySelectorAll('.work'));
    var frames = workEls.map(function (el) { return el.querySelector('.work-window-frame'); });
    var live = workEls.map(function () { return false; });

    /* 모바일에서는 iframe 을 아예 안 쓴다 — 좁은 화면에서 남의 사이트를 통째로
       띄워봐야 읽히지도 않고, 그 사이트의 데스크톱 3D 까지 켜져 프레임만 잡아먹는다.
       대신 .work-window-link(css 에서 이때만 보인다)로 새 탭에서 열게 한다.
       태블릿은 쓴다 — 단 세로 태블릿 화면(820x1180)으로 렌더한다(js/index.js). */
    function iframeDisabled() {
      return window.matchMedia('(max-width: 809.98px)').matches;
    }

    /* 클릭 전 표지를 다시 씌운다(index.html 의 .work-window-poster / index.js 참고).
       표지가 없는 카드(work-2·3)에서는 아무 일도 안 한다. */
    function relock(frame) {
      var body = frame.parentElement;
      if (body && body.querySelector('.work-window-poster')) {
        body.classList.remove('is-live');
      }
    }

    function syncFrames() {
      var off = iframeDisabled();
      for (var i = 0; i < workEls.length; i++) {
        var frame = frames[i];
        if (!frame || !frame.dataset.src) continue;

        if (off) {
          if (live[i] || frame.getAttribute('src')) {
            live[i] = false;
            frame.removeAttribute('src');
          }
          relock(frame);
          continue;
        }

        var r = workEls[i].getBoundingClientRect();
        var onScreen = r.bottom > 0 && r.top < window.innerHeight + MOUNT_MARGIN;
        /* 다음 카드가 화면 꼭대기까지 올라오면 이 카드는 완전히 가려진다 */
        var next = workEls[i + 1];
        var covered = next ? next.getBoundingClientRect().top <= 0 : false;
        var want = onScreen && !covered;
        if (want === live[i]) continue;
        live[i] = want;

        if (want) {
          if (frame.getAttribute('src') !== frame.dataset.src) {
            frame.setAttribute('src', frame.dataset.src);
          }
          frame.style.pointerEvents = '';
        } else {
          /* about:blank 로 보내야 그 사이트의 타이머·애니메이션까지 정리된다
             (src 를 지우기만 하면 문서가 그대로 살아 있다). */
          if (frame.getAttribute('src') !== 'about:blank') {
            frame.setAttribute('src', 'about:blank');
          }
          frame.style.pointerEvents = 'none';
          /* 클릭해서 살려둔 창이라도 여기서 사이트를 떼면 빈 창만 남는다 —
             표지(히어로 이미지)를 되돌려 놓고 다시 클릭받는다. */
          relock(frame);
        }
      }
    }

    syncFrames();
    gsap.ticker.add(syncFrames);
    window.addEventListener('resize', syncFrames);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
