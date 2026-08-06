/* =============================================================
   char-reveal.js — 글자 단위 리빌 인터랙션 (공용)

   project-aquaplanet.html 히어로(.aq-hero-title)에서 쓰던 것을 그대로 떼어냈다.
   원본은 https://www.asiadsgn.com/ 의 .framer-oxkcw9 안 .framer-1d67ool 텍스트
   리빌 — 글자 하나(span)의 시작/끝 상태를 실측하면:
     시작: opacity:0.001; filter:blur(10px); transform: translateY(10px)
     끝:   opacity:1;     filter:blur(0px);  transform: none
   Framer Motion 이 프레임마다 그리는 값이라 duration/ease/stagger 를 초 단위로
   정확히 재기는 어려웠고, 같은 종류의 블러+페이드+올라오기를 GSAP stagger 로
   재현한다.

   쓰는 법 — HTML 에 표시만 해두면 이 파일이 알아서 건다:
     <p data-char-reveal>...</p>          로드 직후 재생 (첫 화면에 있는 글자)
     <p data-char-reveal="scroll">...</p> 뷰포트에 들어올 때 한 번 재생
     data-char-reveal-delay="0.15"        시작 지연(초)
   직접 제어해야 하면 WR.charReveal(대상, { paused: true }) 로 타임라인을 받는다
   (works-intro.js 가 이 방식으로 쓴다).

   GSAP 이 필요하므로 gsap.min.js 뒤에 실어야 한다.
   ============================================================= */
(function () {
  'use strict';

  window.WR = window.WR || {};

  /* 이 글자들은 대개 <span> 으로 일부만 이탤릭·다른 색을 준 상태다
     ((L)i'm so hyeon, (About me), RESENT/WORK 전부 그렇다) — 예전 구현처럼
     el.textContent 를 통째로 갈아끼우면 그 span 들이 사라져 서체가 무너진다.
     그래서 텍스트 노드만 찾아 들어가 한 글자씩 쪼개고 원래 구조는 그대로 둔다.

     공백은 span 으로 감싸지 않는다 — inline-block 안의 공백은 폭이 0 으로
     무너지고, 줄바꿈 기회도 없어져 긴 줄이 화면을 넘친다. 어차피 공백은
     페이드시켜도 눈에 안 보이니 텍스트 노드 그대로 남긴다. */
  function splitChars(node, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var text = child.textContent;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (/\s/.test(ch)) {
            frag.appendChild(document.createTextNode(ch));
            continue;
          }
          var span = document.createElement('span');
          span.textContent = ch;
          span.style.display = 'inline-block';
          span.style.willChange = 'transform, opacity, filter';
          frag.appendChild(span);
          out.push(span);
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        splitChars(child, out);
      }
    });
    return out;
  }

  /* 애니메이션 없이 쪼개기만 필요한 경우(스크롤 위치에 물려 직접 굴릴 때).
     works-intro.js 의 RESENT / WORK 가 이렇게 쓴다. */
  WR.splitChars = function (el) {
    return el ? splitChars(el, []) : [];
  };

  /* 글자가 클수록(제목 196px) 천천히, 작을수록(설명 16px) 빠르게 — 폰트 크기에
     비례해 duration·stagger 를 정한다. 전부 반응형 clamp() 폰트라 뷰포트가
     바뀌어도 그때그때 실제 렌더 크기 기준으로 다시 계산된다. */
  function tuning(el) {
    var fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
    return {
      duration: Math.min(0.95, Math.max(0.35, fontSize / 220)),
      stagger: Math.min(0.045, Math.max(0.012, fontSize / 4500))
    };
  }

  /* 대상은 셀렉터 문자열 / 엘리먼트 / 엘리먼트 배열 아무거나.
     여러 개를 한 번에 넘기면 전부 **같은 순간에** 시작한다(제목과 설명이
     따로 놀지 않게) — 크기에 따른 duration·stagger 차이만 남는다. */
  WR.charReveal = function (target, opts) {
    if (!window.gsap) return null;
    opts = opts || {};

    var els;
    if (typeof target === 'string') els = document.querySelectorAll(target);
    else if (target && target.nodeType === 1) els = [target];
    else els = target || [];
    els = Array.prototype.slice.call(els);
    if (!els.length) return null;

    var tl = gsap.timeline({ delay: opts.delay || 0, paused: !!opts.paused });
    els.forEach(function (el) {
      var chars = splitChars(el, []);
      if (!chars.length) return;
      var t = tuning(el);
      gsap.set(chars, { opacity: 0.001, filter: 'blur(10px)', y: 10 });
      tl.to(chars, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: t.duration,
        ease: 'power2.out',
        stagger: t.stagger,
        /* will-change 를 계속 켜 두면(합성 레이어가 계속 떠 있으면) 이 글자들의
           조상이 sticky 인 경우(폴더탭·히어로) 뒤 카드에 정상적으로 덮이지 않고
           위에 떠 보이는 렌더링 버그가 브라우저에 따라 생긴다 — 끝나면 바로 꺼서
           일반 페인트 순서로 되돌린다. */
        onComplete: function () {
          chars.forEach(function (c) { c.style.willChange = 'auto'; });
        }
      }, 0);
    });
    return tl;
  };

  /* data-char-reveal 이 달린 것들 자동 처리 */
  function init() {
    if (!window.gsap) return;
    document.querySelectorAll('[data-char-reveal]').forEach(function (el) {
      var delay = parseFloat(el.getAttribute('data-char-reveal-delay')) || 0;
      var onScroll = el.getAttribute('data-char-reveal') === 'scroll';

      if (onScroll && window.ScrollTrigger) {
        /* 미리 숨겨 두고(=paused 타임라인이 gsap.set 까지는 이미 실행했다)
           화면에 들어올 때 한 번만 재생한다. */
        var tl = WR.charReveal(el, { delay: delay, paused: true });
        if (!tl) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: function () { tl.play(); }
        });
        /* 페이지 중간에서 새로고침해 이미 지나쳐 있는 경우 — 트리거가 지난
           구간에 대해 onEnter 를 다시 불러줄지는 보장되지 않는다. 글자가 숨은
           채 영영 안 나오는 일이 없도록 여기서 직접 확인해서 재생한다. */
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) tl.play();
      } else {
        WR.charReveal(el, { delay: delay });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
