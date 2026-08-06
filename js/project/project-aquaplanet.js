/* =============================================================
   히어로 글자 등장 인터랙션 — https://www.asiadsgn.com/ 의
   .framer-oxkcw9 안 .framer-1d67ool 텍스트 리빌을 그대로 옮겼다.

   그 사이트에서 실측한 글자 하나(span)의 시작/끝 상태:
     시작: opacity:0.001; filter:blur(10px);
           transform: translateY(10px) (scale/rotate/skew 는 중립)
     끝:   opacity:1;     filter:blur(0px);  transform:none
   트랜지션이 CSS 가 아니라 JS(Framer Motion)로 프레임마다 그려지는 값이라
   duration/ease/stagger 를 초 단위로 정확히 재기는 어려웠다 — 같은 종류의
   글자 단위 블러+페이드+올라오기 리빌을 GSAP stagger 로 재현한다
   (이 프로젝트가 이미 GSAP 을 쓰고 있어 index.html 과 동일한 방식). */
(function () {
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? ' ' : ch;
      span.style.display = 'inline-block';
      span.style.willChange = 'transform, opacity, filter';
      el.appendChild(span);
      chars.push(span);
    }
    return chars;
  }

  function init() {
    if (!window.gsap) return;
    var targets = document.querySelectorAll('.aq-hero-title, .aq-hero-meta p, .aq-hero-desc p');
    if (!targets.length) return;

    var tl = gsap.timeline({ delay: 0.15 });
    targets.forEach(function (el, i) {
      /* 글자가 클수록(제목 200px) 천천히, 작을수록(메타·설명 16px) 빠르게 —
         폰트 크기에 비례해서 duration·stagger 를 정한다(반응형 clamp() 폰트라
         뷰포트가 바뀌어도 그때그때 실제 렌더 크기 기준으로 다시 계산된다). */
      var fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
      var duration = Math.min(0.95, Math.max(0.35, fontSize / 220));
      var stagger = Math.min(0.045, Math.max(0.012, fontSize / 4500));

      var chars = splitChars(el);
      gsap.set(chars, { opacity: 0.001, filter: 'blur(10px)', y: 10 });
      tl.to(chars, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: duration,
        ease: 'power2.out',
        stagger: stagger,
        /* will-change 를 계속 켜 두면(합성 레이어가 계속 떠 있으면) 이 글자들의
           조상인 .aq-hero(position:sticky)가 뒤이어 오는 .wd-scroll 에 정상적으로
           덮이지 않고 그 위에 계속 떠 보이는 렌더링 버그가 브라우저에 따라
           생길 수 있다 — 애니메이션이 끝나면 바로 꺼서 원래(sticky 스택) 처럼
           일반 페인트 순서로 되돌린다. */
        onComplete: function () {
          chars.forEach(function (c) { c.style.willChange = 'auto'; });
        },
      }, i * 0.12); // 줄(제목→연도/분류→설명)마다 살짝 늦게 시작
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
