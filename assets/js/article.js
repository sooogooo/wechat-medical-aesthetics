/* =========================================================================
   详情页交互:参考资料折叠 / 滚动渐入 / header 状态 / 移动菜单
   ========================================================================= */
(function () {
  "use strict";

  // —— 参考资料折叠 ——
  var refs = document.querySelector(".references");
  if (refs) {
    var toggle = refs.querySelector(".references__toggle");
    toggle.addEventListener("click", function () {
      refs.classList.toggle("is-open");
      var expanded = refs.classList.contains("is-open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  // —— 滚动渐入(正文段落与小节) ——
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 }
    );
    var blocks = document.querySelectorAll(
      ".prose > h2, .prose > h3, .action-card, .urgent-callout"
    );
    Array.prototype.forEach.call(blocks, function (el) {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  // —— header 滚动状态 ——
  var header = document.getElementById("siteHeader");
  if (header) {
    window.addEventListener(
      "scroll",
      function () {
        header.classList.toggle("is-scrolled", window.scrollY > 4);
      },
      { passive: true }
    );
  }

  // —— 移动菜单 ——
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
})();
