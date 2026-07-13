/* ============================================================
   ILHA TECH — interações (vanilla, sem deps)
   ============================================================ */
(function () {
  "use strict";

  /* Nav: sombra ao rolar */
  var nav = document.querySelector(".nav");
  var onScroll = function () {
    if (window.scrollY > 8) nav.classList.add("is-stuck");
    else nav.classList.remove("is-stuck");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Menu mobile */
  var toggle = document.querySelector(".nav__toggle");
  var mobile = document.querySelector(".nav__mobile");
  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = mobile.hasAttribute("hidden");
      if (open) mobile.removeAttribute("hidden");
      else mobile.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", String(open));
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobile.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll reveal — marca alvos e observa */
  var targets = document.querySelectorAll(
    ".sec__head, .pill, .mod, .area, .val, .stat, .contato, .nm__head"
  );
  targets.forEach(function (el, i) {
    el.setAttribute("data-reveal", "");
    el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
