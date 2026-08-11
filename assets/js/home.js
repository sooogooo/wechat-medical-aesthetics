/* =========================================================================
   系列列表页交互：分类筛选 / 搜索 / 卡片渲染
   数据源：通过 script[data-src] 配置，默认 assets/data/conditions.json
   ========================================================================= */
(function () {
  "use strict";

  // 从当前 script 标签读取配置（支持多系列复用）
  var scripts = document.querySelectorAll("script[data-series-js]");
  var cfgScript = scripts.length > 0 ? scripts[scripts.length - 1] : document.currentScript;
  var DATA_URL = (cfgScript && cfgScript.getAttribute("data-src")) || "assets/data/conditions.json";
  var CARD_HREF_PREFIX = (cfgScript && cfgScript.getAttribute("data-href-prefix")) || "";
  var IMG_PREFIX = (cfgScript && cfgScript.getAttribute("data-img-prefix")) || "assets/img/conditions/";
  var CTA_EVERY = 18; // 每 N 张卡片插入一次转化分隔条

  var grid = document.getElementById("grid");
  var categoryBar = document.getElementById("categoryBar");
  var resultsCount = document.getElementById("resultsCount");
  var resultsHint = document.getElementById("resultsHint");
  var searchInput = document.getElementById("searchInput");
  var symptomNav = document.getElementById("symptomNav");
  var ctaStrip = document.getElementById("ctaStrip");

  var allData = [];
  var activeCategory = "all";
  var activeSymptom = null;
  var searchTerm = "";

  // 分类中文名映射（与 JSON 的 category 字段对齐）
  var CATEGORY_LABELS = {
    "acne-rosacea": "痤疮与玫瑰",
    "pigment": "色素问题",
    "birthmark": "胎记痣类",
    "keratinization": "角化异常",
    "eczema-dermatitis": "湿疹皮炎",
    "fungal": "真菌感染",
    "warts": "疣类",
    "hair-loss": "脱发问题",
    "vascular": "血管问题",
    "benign-tumor": "良性肿物",
    "infection": "感染性",
    "aesthetic-complication": "医美相关",
    "sweat-misc": "其他"
  };

  // 症状 → category 集合 映射
  var SYMPTOM_MAP = {
    face: ["acne-rosacea", "eczema-dermatitis", "vascular"],
    spot: ["pigment", "birthmark"],
    hair: ["hair-loss"],
    itch: ["eczema-dermatitis", "fungal", "infection"],
    foot: ["keratinization", "fungal", "warts"],
    nail: ["fungal"],
    birthmark: ["birthmark", "pigment"],
    postprocedural: ["aesthetic-complication", "keratinization"]
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // —— 加载数据 ——
  fetch(DATA_URL)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      allData = data;
      renderCategories();
      applyFilters();
    })
    .catch(function () {
      grid.innerHTML =
        '<div class="empty-state"><h3>数据加载失败</h3>' +
        '<p>请通过本地服务器预览（例如在项目目录运行 <code>python -m http.server</code>）。</p></div>';
    });

  // —— 渲染分类筛选条 ——
  function renderCategories() {
    var counts = { all: allData.length };
    allData.forEach(function (c) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });

    var html =
      '<button class="cat-btn is-active" data-cat="all" role="tab" aria-selected="true">' +
      "全部<span class=\"count\">" + counts.all + "</span></button>";

    Object.keys(CATEGORY_LABELS).forEach(function (key) {
      if (!counts[key]) return; // 跳过无内容的分类
      html +=
        '<button class="cat-btn" data-cat="' + key + '" role="tab" aria-selected="false">' +
        CATEGORY_LABELS[key] + "<span class=\"count\">" + counts[key] + "</span></button>";
    });
    categoryBar.innerHTML = html;

    categoryBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".cat-btn");
      if (!btn) return;
      activeSymptom = null; // 选分类时清空症状
      updateSymptomChips();
      setActiveCategory(btn.dataset.cat);
    });
  }

  function setActiveCategory(cat) {
    activeCategory = cat;
    Array.prototype.forEach.call(
      categoryBar.querySelectorAll(".cat-btn"),
      function (b) {
        var on = b.dataset.cat === cat;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      }
    );
    applyFilters();
  }

  // —— 症状入口 ——
  symptomNav.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var sym = chip.dataset.symptom;
    // 再次点击同一个 → 取消
    if (activeSymptom === sym) {
      activeSymptom = null;
    } else {
      activeSymptom = sym;
      activeCategory = "all";
      Array.prototype.forEach.call(
        categoryBar.querySelectorAll(".cat-btn"),
        function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); }
      );
      var allBtn = categoryBar.querySelector('[data-cat="all"]');
      if (allBtn) { allBtn.classList.add("is-active"); allBtn.setAttribute("aria-selected", "true"); }
    }
    updateSymptomChips();
    applyFilters();
  });

  function updateSymptomChips() {
    Array.prototype.forEach.call(
      symptomNav.querySelectorAll(".chip"),
      function (c) {
        c.classList.toggle("is-active", c.dataset.symptom === activeSymptom);
      }
    );
  }

  // —— 搜索 ——
  var searchTimer = null;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      searchTerm = searchInput.value.trim().toLowerCase();
      applyFilters();
    }, 120);
  });

  // —— 筛选主逻辑 ——
  function applyFilters() {
    var list = allData.slice();

    // 分类
    if (activeCategory !== "all") {
      list = list.filter(function (c) { return c.category === activeCategory; });
    }
    // 症状
    if (activeSymptom && SYMPTOM_MAP[activeSymptom]) {
      var cats = SYMPTOM_MAP[activeSymptom];
      list = list.filter(function (c) { return cats.indexOf(c.category) !== -1; });
    }
    // 搜索（命中 标题/备选标题/摘要/关键词）
    if (searchTerm) {
      list = list.filter(function (c) {
        var haystack = (
          c.title + " " + (c.alts || []).join(" ") + " " +
          c.summary + " " + (c.keywords || []).join(" ")
        ).toLowerCase();
        return haystack.indexOf(searchTerm) !== -1;
      });
    }

    // 排序：紧急在前，常见次之
    list.sort(function (a, b) {
      var sa = (a.urgent ? 2 : 0) + (a.common ? 1 : 0);
      var sb = (b.urgent ? 2 : 0) + (b.common ? 1 : 0);
      if (sb !== sa) return sb - sa;
      return a.id - b.id;
    });

    renderCards(list);
    updateMeta(list);
  }

  // —— 渲染卡片 ——
  function renderCards(list) {
    if (!list.length) {
      grid.innerHTML =
        '<div class="empty-state">' +
        "<h3>没有匹配的病症</h3>" +
        "<p>换个关键词，或直接咨询皮肤科医生。</p>" +
        '<a href="/contact.html" class="btn btn--primary">在线咨询</a>' +
        "</div>";
      ctaStrip.hidden = true;
      return;
    }

    var html = "";
    list.forEach(function (c, i) {
      var badges = "";
      if (c.urgent) {
        badges += '<span class="badge badge--urgent">⚠ 需警惕急症</span>';
      }
      if (c.common) {
        badges += '<span class="badge badge--common">常见</span>';
      }

      html +=
        '<a class="card" href="' + CARD_HREF_PREFIX + c.slug + ".html\">" +
        '<div class="card__thumb">' +
        '<img class="card__thumb-img" src="' + IMG_PREFIX + c.slug + '.svg" alt="" loading="lazy" />' +
        '<div class="card__badges">' + badges + "</div>" +
        "</div>" +
        '<div class="card__body">' +
        '<p class="card__category">' + escapeHtml(CATEGORY_LABELS[c.category] || c.category) + "</p>" +
        '<h3 class="card__title">' + escapeHtml(c.title) + "</h3>" +
        '<p class="card__summary">' + escapeHtml(c.summary) + "</p>" +
        '<span class="card__cta">查看科普 ' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</span>" +
        "</div>" +
        "</a>";

      // 每 CTA_EVERY 张后插入转化分隔条（非末尾）
      if ((i + 1) % CTA_EVERY === 0 && i !== list.length - 1) {
        html +=
          '<div class="cta-strip" style="grid-column:1/-1">' +
          '<div class="cta-strip__inner">' +
          '<div class="cta-strip__text"><h3>有这类问题？</h3>' +
          "<p>科普帮你看懂，确诊请面诊。</p></div>" +
          '<a href="/contact.html" class="btn btn--primary">预约面诊</a>' +
          "</div></div>";
      }
    });

    grid.innerHTML = html;
    ctaStrip.hidden = list.length <= CTA_EVERY;

    // 滚动渐入
    observeReveal();
  }

  function updateMeta(list) {
    var total = allData.length;
    resultsCount.textContent = "显示 " + list.length + " / " + total + " 篇";
    var hints = [];
    if (activeSymptom) hints.push("症状：" + symptomLabel(activeSymptom));
    if (activeCategory !== "all") hints.push("分类：" + CATEGORY_LABELS[activeCategory]);
    if (searchTerm) hints.push("搜索：“" + searchTerm + "”");
    resultsHint.textContent = hints.join(" · ");
  }

  function symptomLabel(s) {
    var el = symptomNav.querySelector('[data-symptom="' + s + '"]');
    return el ? el.textContent.trim() : s;
  }

  // —— 滚动渐入 ——
  var revealObserver = null;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              revealObserver.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
      );
    }
    Array.prototype.forEach.call(grid.querySelectorAll(".card"), function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 30, 240) + "ms";
      revealObserver.observe(el);
    });
  }

  // —— Header 滚动状态 + 移动菜单 ——
  var header = document.getElementById("siteHeader");
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 4);
  }, { passive: true });

  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
