/**
 * build-series.js — 为 4 个新系列生成文章 HTML + 系列列表页 + JSON 数据
 *
 * 用法: node _src/build-series.js
 * 输出: surgery/ injection/ aesthetics/ types/ 目录下的 HTML 文件 + assets/data/*.json
 *
 * 沿用现有皮肤系列的莫兰迪禅意风设计系统（design-tokens.css + base.css + article.css）
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// ============ 系列配置 ============
const SERIES = [
  {
    key: "surgery",
    name: "四级与整形美容手术",
    tagline: "30 个手术主题 · 风险沟通与决策",
    desc: "颌面四级手术、躯干轮廓、鼻部整形、面部年轻化、安全管理——风险最高的医美决策,需要最审慎的科普。",
    srcDir: path.join(ROOT, "_src", "四级与整形美容手术科普系列"),
    outDir: path.join(ROOT, "surgery"),
    imgDir: "images-poster",
    imgPrefix: "images-poster/",
    jsonPath: path.join(ROOT, "assets", "data", "surgery.json"),
    seriesNum: "四级与整形美容手术 30 讲",
  },
  {
    key: "injection",
    name: "美容注射的艺术",
    tagline: "40 篇注射主题 · 机制、风险与 MD Codes",
    desc: "填充、肉毒、再生材料的机制与风险,MD Codes 编码注射方法,以及长期管理的智慧。",
    srcDir: path.join(ROOT, "_src", "美容注射的艺术科普系列"),
    outDir: path.join(ROOT, "injection"),
    imgDir: "images",
    imgPrefix: "images/",
    jsonPath: path.join(ROOT, "assets", "data", "injection.json"),
    seriesNum: "美容注射的艺术 40 篇",
  },
  {
    key: "aesthetics",
    name: "医美亚美学",
    tagline: "10 种审美流派的盘点与反思",
    desc: "幼态脸、高级脸、妈生款、抗老美学、容貌焦虑——看清欲望来源,才能自主选择。",
    srcDir: path.join(ROOT, "_src", "医美亚美学科普系列"),
    outDir: path.join(ROOT, "aesthetics"),
    imgDir: "images",
    imgPrefix: "images/",
    jsonPath: path.join(ROOT, "assets", "data", "aesthetics.json"),
    seriesNum: "医美亚美学 10 篇",
  },
  {
    key: "types",
    name: "医美美学三型",
    tagline: "高级型 · 技术型 · 庸俗型",
    desc: "医美审美的三种境界分类。倡导克制与整体,警示趋同与过度,一份审美升级指南。",
    srcDir: path.join(ROOT, "_src", "医美美学三型科普系列"),
    outDir: path.join(ROOT, "types"),
    imgDir: "images",
    imgPrefix: "images/",
    jsonPath: path.join(ROOT, "assets", "data", "types.json"),
    seriesNum: "医美美学三型 10 篇",
  },
];

// ============ Markdown 解析 ============
function parseMd(text) {
  const lines = text.split("\n");
  let h1 = "", cover = "", bodyStart = 0, bodyEnd = lines.length;
  let alts = [], refs = [];
  let inBody = false, inRefs = false, inCover = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ") && !h1) h1 = line.slice(2).trim();
    else if (line.startsWith("## 三个备选标题")) { inCover = false; }
    else if (/^\d+\.\s/.test(line) && alts.length < 3 && !inBody) alts.push(line.replace(/^\d+\.\s*/, "").trim());
    else if (line.startsWith("## 封面介绍")) inCover = true;
    else if (line.startsWith("## 正文")) { inCover = false; inBody = true; bodyStart = i + 1; }
    else if (line.startsWith("## 参考资料")) { inBody = false; inRefs = true; bodyEnd = i; }
    else if (line.startsWith("## ")) { inCover = false; }
    else if (inCover && line.trim()) cover += (cover ? "\n" : "") + line.trim();
    else if (inRefs && line.startsWith("- ")) refs.push(line.slice(2).trim());
    else if (inRefs && line.startsWith("  ") && refs.length > 0) refs[refs.length-1] += " " + line.trim();
  }

  const body = lines.slice(bodyStart, bodyEnd).join("\n").trim();
  const disclaimer = (body.match(/^>\s*(.+)$/m) || [])[1] || "";

  return { h1, alts, cover: cover.trim(), body, disclaimer, refs };
}

// ============ Body → HTML ============
function bodyToHtml(body) {
  const lines = body.split("\n");
  let html = "";
  let inUl = false, inOl = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 跳过图片引用（单独处理）
    if (line.match(/^!\[.*\]\(.*\)/)) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
      // 转为 figure
      const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (m) {
        html += `<figure style="margin: var(--sp-5) 0; text-align:center;"><img src="${m[2]}" alt="${m[1]}" style="max-width:100%;border-radius:var(--radius);border:1px solid var(--line);" loading="lazy" /><figcaption style="font-size:var(--fs-xs);color:var(--ink-faint);margin-top:var(--sp-2);">${m[1]}</figcaption></figure>\n`;
      }
      continue;
    }

    // 标题
    if (line.startsWith("### ")) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
      const text = line.slice(4).trim();
      const id = "s" + Math.abs(hashCode(text)).toString(36);
      html += `<h3 id="${id}">${esc(text)}</h3>\n`;
    }
    else if (line.startsWith("## ")) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
      html += `<h2>${esc(line.slice(3).trim())}</h2>\n`;
    }
    // 引用
    else if (line.startsWith("> ")) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
      html += `<blockquote>${inlineFmt(line.slice(2))}</blockquote>\n`;
    }
    // 无序列表
    else if (line.match(/^[-*]\s/)) {
      if (inOl) { html += "</ol>\n"; inOl = false; }
      if (!inUl) { html += "<ul>\n"; inUl = true; }
      html += `<li>${inlineFmt(line.replace(/^[-*]\s/, ""))}</li>\n`;
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (!inOl) { html += "<ol>\n"; inOl = true; }
      html += `<li>${inlineFmt(line.replace(/^\d+\.\s/, ""))}</li>\n`;
    }
    // 空行
    else if (line.trim() === "") {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
    }
    // 段落
    else {
      if (inUl) { html += "</ul>\n"; inUl = false; }
      if (inOl) { html += "</ol>\n"; inOl = false; }
      html += `<p>${inlineFmt(line)}</p>\n`;
    }
  }
  if (inUl) html += "</ul>\n";
  if (inOl) html += "</ol>\n";
  return html;
}

function inlineFmt(text) {
  // **bold**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // [link](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return esc(text, true);
}

function esc(text, allowTags = false) {
  if (!allowTags) {
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  } else {
    // 只转义非标签的 < >
    text = text.replace(/<(?!\/?(strong|a|figure|img|figcaption|b|i|em|span|br)\b)/g, "&lt;");
  }
  return text;
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ============ 文章 HTML 模板 ============
function articleHtml(series, article, bodyHtml) {
  const dir = series.outDir.split(path.sep).pop(); // e.g. "surgery"
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${article.title} · ${series.name}</title>
  <meta name="description" content="${article.summary.slice(0, 120)}" />
  <link rel="icon" type="image/png" href="../assets/logo/amc-logo.png" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/article.css" />
  <style>figure img{max-width:100%;height:auto;border-radius:var(--radius);border:1px solid var(--line);margin:var(--sp-4) 0}.prose h2{margin-top:var(--sp-6)}</style>
</head>
<body>
  <header class="site-header" id="siteHeader">
    <div class="site-header__inner">
      <a href="../index.html" class="brand">
        <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" />
        <span class="brand__name"><b>重庆西区医院</b> <span>整形外科医疗美容中心</span></span>
      </a>
      <nav class="main-nav" id="mainNav">
        <a href="../index.html">首页</a>
        <a href="../skin/">皮肤病症</a>
        <a href="../surgery/">四级手术</a>
        <a href="../injection/">美容注射</a>
        <a href="../aesthetics/">亚美学</a>
        <a href="../types/">美学三型</a>
      </nav>
      <button class="nav-toggle" id="navToggle"><span></span></button>
    </div>
  </header>

  <div class="urgent-bar">
    <div class="container">
      <span class="urgent-bar__icon">⚠</span>
      <span>本站内容用于健康教育,不替代面诊。出现紧急情况请立即拨打 120。</span>
    </div>
  </div>

  <main class="article">
    <div class="container">
      <nav class="breadcrumb">
        <a href="../index.html">首页</a> ／
        <a href="../${dir}/index.html">${series.name}</a> ／
        <span>${article.title.slice(0, 12)}…</span>
      </nav>

      <header class="article__head">
        <p class="article__category"><span class="cat-tag">${series.name}</span></p>
        <h1 class="article__title">${article.title}</h1>
        <p class="article__lead">${article.summary}</p>
        <p class="article__meta">用于公众健康教育 · 不替代面诊 · 经临床审校</p>
      </header>

      <div class="article__body">
        <article class="prose">
${bodyHtml}
        </article>
      </div>

      ${article.refs.length > 0 ? `
      <section class="references">
        <button class="references__toggle" aria-expanded="false">参考资料 <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>
        <ul class="references__list">
          ${article.refs.map(r => `<li>${r}</li>`).join("\n          ")}
        </ul>
      </section>` : ""}

      <p class="disclaimer">${article.disclaimer || "本文用于健康教育,不能替代面诊和个体化评估。"}</p>

      <div class="article-foot">
        <div class="cta-strip">
          <p>想进一步确认?</p>
          <a href="../index.html" class="btn btn--primary">返回系列首页</a>
        </div>
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p class="brand__name"><b>重庆西区医院</b> <span>整形外科医疗美容中心</span></p>
      <p style="font-size:var(--fs-xs);color:var(--ink-faint);margin-top:var(--sp-2);">${series.name} · ${article.id >= 0 ? "第 " + (article.id + 1) + " 篇" : ""}</p>
    </div>
  </footer>

  <script>
    (function(){
      var h=document.getElementById('siteHeader');
      window.addEventListener('scroll',function(){h.classList.toggle('is-scrolled',window.scrollY>4)},{passive:true});
      var t=document.getElementById('navToggle'),n=document.getElementById('mainNav');
      if(t)t.addEventListener('click',function(){var o=n.classList.toggle('is-open');t.setAttribute('aria-expanded',o)});
      var rt=document.querySelector('.references__toggle');
      if(rt)rt.addEventListener('click',function(){var o=rt.parentElement.classList.toggle('is-open');rt.setAttribute('aria-expanded',o)});
    })();
  </script>
</body>
</html>`;
}

// ============ 系列列表页 HTML ============
function seriesIndexHtml(series, articles) {
  const dir = series.outDir.split(path.sep).pop();
  const count = articles.length;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${series.name} · 医美科普</title>
  <meta name="description" content="${series.desc}" />
  <link rel="icon" type="image/png" href="../assets/logo/amc-logo.png" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/home.css" />
  <style>
    .hero{padding:var(--sp-7) 0 var(--sp-5);text-align:center}
    .hero h1{font-size:var(--fs-display);margin-bottom:var(--sp-3)}
    .hero .hero__sub{font-size:var(--fs-lead);color:var(--ink-soft);max-width:560px;margin:0 auto}
  </style>
</head>
<body>
  <header class="site-header" id="siteHeader">
    <div class="site-header__inner">
      <a href="../index.html" class="brand">
        <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" />
        <span class="brand__name"><b>重庆西区医院</b> <span>整形外科医疗美容中心</span></span>
      </a>
      <nav class="main-nav" id="mainNav">
        <a href="../index.html">首页</a>
        <a href="../skin/">皮肤病症</a>
        <a href="../surgery/">四级手术</a>
        <a href="../injection/">美容注射</a>
        <a href="../aesthetics/">亚美学</a>
        <a href="../types/">美学三型</a>
      </nav>
      <button class="nav-toggle" id="navToggle"><span></span></button>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <p class="eyebrow hero__eyebrow">${series.tagline}</p>
        <h1>${series.name}</h1>
        <p class="hero__sub">${series.desc}</p>
      </div>
    </section>

    <section id="explore" class="explore">
      <div class="container">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 16 16" width="16" height="16"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5"/></svg>
          <input type="search" id="searchInput" placeholder="搜索本系列文章…" autocomplete="off">
          <span id="resultsCount" class="search-count">${count} 篇文章</span>
        </div>
      </div>
    </section>

    <section style="padding-bottom:var(--sp-9)">
      <div class="container">
        <div class="grid" id="grid">
          ${articles.map(a => `
          <a class="card reveal" href="${a.slug}.html">
            ${a.thumb ? `<div class="card__thumb"><img class="card__thumb-img" src="${a.thumb}" alt="${a.title}" loading="lazy" /></div>` : ''}
            <div class="card__body">
              <p class="card__category">${a.tag || series.name}</p>
              <p class="card__title">${a.title}</p>
              <p class="card__summary">${a.summary}</p>
              <span class="card__cta">阅读全文 <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6h7M6 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>
            </div>
          </a>`).join("")}
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p class="brand__name"><b>重庆西区医院</b> <span>整形外科医疗美容中心</span></p>
      <p style="font-size:var(--fs-xs);color:var(--ink-faint);margin-top:var(--sp-2);">${series.name} · ${count} 篇</p>
    </div>
  </footer>

  <script>
    (function(){
      var h=document.getElementById('siteHeader');
      window.addEventListener('scroll',function(){h.classList.toggle('is-scrolled',window.scrollY>4)},{passive:true});
      var t=document.getElementById('navToggle'),n=document.getElementById('mainNav');
      if(t)t.addEventListener('click',function(){var o=n.classList.toggle('is-open');t.setAttribute('aria-expanded',o)});

      // 搜索
      var input=document.getElementById('searchInput');
      var cards=document.querySelectorAll('#grid .card');
      var count=document.getElementById('resultsCount');
      input.addEventListener('input',function(){
        var q=input.value.toLowerCase().trim();
        var visible=0;
        cards.forEach(function(c){
          var text=c.innerText.toLowerCase();
          var show=!q||text.indexOf(q)>=0;
          c.style.display=show?'':'none';
          if(show)visible++;
        });
        count.textContent=visible+' 篇文章';
      });

      // Reveal
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e,i){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})
      },{threshold:0.1});
      document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
    })();
  </script>
</body>
</html>`;
}

// ============ 主流程 ============
let totalArticles = 0, totalFiles = 0;

for (const series of SERIES) {
  console.log("\n=== " + series.name + " ===");

  // 创建输出目录
  fs.mkdirSync(series.outDir, { recursive: true });

  // 读取 md 文件
  const mdFiles = fs.readdirSync(series.srcDir)
    .filter(f => f.endsWith(".md") && f !== "README.md")
    .sort();

  const articles = [];

  for (const mdFile of mdFiles) {
    const mdPath = path.join(series.srcDir, mdFile);
    const text = fs.readFileSync(mdPath, "utf8");
    const parsed = parseMd(text);

    const slug = mdFile.replace(/\.md$/, "");
    const id = parseInt(slug.split("-")[0]);

    // 处理 body 里的图片路径：把 images/ 或 images-poster/ 前缀加上（已在 md 里了，不需要改）
    // md 里的 ![](images/xxx.svg) 保持不变，因为文章 HTML 和 images/ 在同一目录
    let bodyHtml = bodyToHtml(parsed.body);

    // 查找该篇的缩略图（第一张 SVG）
    const imgDirPath = path.join(series.outDir, series.imgDir);
    let thumb = "";
    if (fs.existsSync(imgDirPath)) {
      const idPrefix = slug.split("-")[0]; // 篇号，如 "06"
      const imgs = fs.readdirSync(imgDirPath)
        .filter(f => f.endsWith(".svg") && f.startsWith(idPrefix + "-"))
        .sort();
      if (imgs.length > 0) thumb = series.imgPrefix + imgs[0];
    }

    // 写文章 HTML
    const article = {
      id,
      slug,
      title: parsed.h1,
      summary: parsed.cover || "",
      tag: series.key,
      refs: parsed.refs,
      disclaimer: parsed.disclaimer,
      thumb,
    };
    const html = articleHtml(series, article, bodyHtml);
    fs.writeFileSync(path.join(series.outDir, slug + ".html"), html, "utf8");
    totalFiles++;

    // 收集元信息用于 JSON
    articles.push({
      id,
      slug,
      title: parsed.h1,
      summary: parsed.cover || "",
      keywords: parsed.alts || [],
      thumb,
    });

    totalArticles++;
  }

  // 写 JSON
  fs.mkdirSync(path.dirname(series.jsonPath), { recursive: true });
  fs.writeFileSync(series.jsonPath, JSON.stringify(articles, null, 2), "utf8");
  totalFiles++;

  // 写系列列表页
  const indexHtml = seriesIndexHtml(series, articles);
  fs.writeFileSync(path.join(series.outDir, "index.html"), indexHtml, "utf8");
  totalFiles++;

  console.log("  文章: " + articles.length + " 篇, JSON + 列表页已生成");
}

console.log("\n=== 完成 ===");
console.log("总文章: " + totalArticles + ", 总文件: " + totalFiles);
