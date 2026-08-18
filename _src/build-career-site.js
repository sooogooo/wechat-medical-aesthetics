/**
 * build-career-site.js — 大厂人转行医美系列 · 静态站点构建器
 *
 * 用法: node _src/build-career-site.js
 * 输入: _src/大厂人转行医美系列/*.md（00 总纲 + 01-16 正文）
 * 输出: career/ 目录（index.html 系列总览 + 17 个文章页 + assets/data/career.json）
 *
 * 特性:
 *  - 系列 md 结构化解析（部分徽标 / 定位引言行 / 正文 / 引用与核验收尾块）
 *  - 样式复用 consultant.css（career.css 仅 @import + 系列专属卡片覆盖），同一设计家族
 *  - 键盘 ←→ / 移动端边缘滑动翻篇、小节目录、阅读进度条
 *  - 纯静态、全相对路径，可直接部署到任意静态服务器
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "_src", "大厂人转行医美系列");
const OUT_DIR = path.join(ROOT, "career");
const { headMeta } = require("./site-config");

// ============ 部分配置（cls 复用 consultant.css 的 stage-sN 阶段色系） ============
const PARTS = [
  { no: 0, name: "开篇", cls: "stage-s0", goal: "立规矩、给地图：实然优先，不劝进也不劝退", pass: "读懂系列的三级标注" },
  { no: 1, name: "认识医美", cls: "stage-s1", goal: "看懂行业的底层结构、钱的流向、权力结构与周期位置", pass: "决策清单事实区可全勾" },
  { no: 2, name: "怎么进", cls: "stage-s2", goal: "五条入口、能力资产负债表、跨界死法与活法、落地尽调", pass: "完成 offer 前五查" },
  { no: 3, name: "会经历什么", cls: "stage-s3", goal: "180 天的五次冲击、与医生共事、灰色地带的日常与去留", pass: "写下五条绝不清单" },
  { no: 4, name: "名校生专题", cls: "stage-s4", goal: "机会逐条标价、代价复利计息、12 个月动作序列", pass: "三个硬指标复盘" },
  { no: 5, name: "收尾", cls: "stage-s5", goal: "把十六篇收敛成一页纸决策工具", pass: "三区清单填写完成" },
];

// 篇目清单（tagline 与 README 目录一致）
const ARTICLES = [
  { slug: "01-开篇-写给正在刷招聘软件的大厂人", part: 0, tagline: "系列立场、实然纪律、素材边界声明" },
  { slug: "02-医美是个什么生意-医疗的交付消费的获客", part: 1, tagline: "消费的嘴/医疗的手、三个悖论、三种模式" },
  { slug: "03-这个行业的钱是怎么分的", part: 1, tagline: "四层利润表、营业额崇拜、收银与划扣" },
  { slug: "04-谁说了算-医生老板经营院长咨询师", part: 1, tagline: "医生不可管理、经营院长实况、咨询师三篇" },
  { slug: "05-乱象是真的机会也是真的", part: 1, tagline: "乱象清单、五条结构变化、谷底三种活法" },
  { slug: "06-五条入口的实况", part: 2, tagline: "平台/机构/上游/医生IP/咨询师逐一拆解" },
  { slug: "07-大厂能力清单-可迁移资产与负资产", part: 2, tagline: "四项资产、四项负资产、自查表" },
  { slug: "08-跨界者的四种死法与三个活法", part: 2, tagline: "四种死法的大厂变体、三个活法的可行组合" },
  { slug: "09-谈offer之前-薪酬组织与试用期", part: 2, tagline: "薪酬结构、五查尽调、病态 KPI 五信号" },
  { slug: "10-入职180天的五次冲击", part: 3, tagline: "数据/会议/身份/指标/价值观五次冲击" },
  { slug: "11-和医生共事是一门手艺", part: 3, tagline: "医生行为逻辑六条、合作方法五条、底线条款" },
  { slug: "12-指标与良心的日常拉扯", part: 3, tagline: "五类灰色决定四栏对照、三道个人防线" },
  { slug: "13-谁留下了谁离开了", part: 3, tagline: "五个人物原型（待采访验证）、模式假设" },
  { slug: "14-名校生进医美-被高估的机会与被低估的代价", part: 4, tagline: "机会四条逐条标价、代价四条复利计息" },
  { slug: "15-名校生进来之后怎么做", part: 4, tagline: "12 个月四动作：学语言、选杠杆、定站位、硬复盘" },
  { slug: "16-去或不去-一页纸决策清单", part: 5, tagline: "三区清单、条件判断十条、引用总表、核验清单" },
];
const BLUEPRINT = { slug: "00-系列设计总纲", tagline: "写作纪律、翻译器装置、篇目设计与事实底座" };

// 预读全部标题（md 的 H1 去掉 "NN · " 前缀），供翻篇器与总览卡片使用
const TITLE_MAP = {};
for (const a of [...ARTICLES, { slug: BLUEPRINT.slug }]) {
  const md = fs.readFileSync(path.join(SRC_DIR, `${a.slug}.md`), "utf8");
  const m = md.match(/^#\s+(?:\d+\s*·\s*)?(.+)$/m);
  TITLE_MAP[a.slug] = m ? m[1].trim() : a.slug;
}

// ============ 工具 ============
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(text) {
  let t = esc(text);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m0, label, url) => {
    if (/^https?:/.test(url)) return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
    if (/^[^/]+\.md$/.test(url)) return `<a href="${esc(url.replace(/\.md$/, ".html"))}">${label}</a>`;
    return `<a href="${url}">${label}</a>`;
  });
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

// ============ 系列 md 解析 ============
// 结构：# NN · 标题 → > **部分名** ｜ 定位行 → ## 小节（含表格/引用/列表/###子标题） → 尾部 **本篇事实底座** 等三段
const SOURCE_LABELS = ["本篇事实底座", "跨文归纳", "需另行核验"];

function parseArticleMd(text) {
  const lines = text.split(/\r?\n/);
  let h1 = "";
  const meta = { partLabel: "", position: "" };
  const sections = [];
  const sourceLines = [];
  let current = null;
  let seenH1 = false;

  for (const line of lines) {
    if (line.startsWith("# ") && !seenH1) { h1 = line.slice(2).trim(); seenH1 = true; continue; }
    // 定位引言行: > **部分 · X** ｜ 定位文本（仅首个块引用行）
    if (!meta.partLabel && /^>\s*\*\*[^*]+\*\*\s*｜/.test(line)) {
      const m = line.match(/^>\s*\*\*([^*]+)\*\*\s*｜\s*(.*)$/);
      meta.partLabel = m[1].trim(); meta.position = m[2].trim(); continue;
    }
    if (/^##\s+/.test(line)) {
      if (current) sections.push(current);
      current = { title: line.replace(/^##\s+/, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  // 抽离尾部"引用与核验"三段（本篇事实底座/跨文归纳/需另行核验开头的段落）
  for (const sec of sections) {
    sec.lines = sec.lines.filter((l) => {
      if (SOURCE_LABELS.some((lb) => l.startsWith(`**${lb}**`) || l.startsWith(lb))) {
        sourceLines.push(l);
        return false;
      }
      return true;
    });
  }
  return { h1, meta, sections: sections.filter((s) => s.lines.some((l) => l.trim() !== "")), sourceLines };
}

// ============ 块渲染 ============
function renderBlocks(lines) {
  let html = "";
  let i = 0;
  const closeList = (st) => { if (st.ul) { html += "</ul>\n"; st.ul = false; } if (st.ol) { html += "</ol>\n"; st.ol = false; } };
  const listState = { ul: false, ol: false };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*\|/.test(line)) {
      closeList(listState);
      const tbl = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { tbl.push(lines[i].trim()); i++; }
      html += renderTable(tbl);
      continue;
    }
    if (/^>\s?/.test(line)) {
      closeList(listState);
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += `<blockquote>${quote.filter(l => l.trim() !== "" || quote.length === 1).map(l => `<p>${inline(l)}</p>`).join("")}</blockquote>\n`;
      continue;
    }
    if (/^---+\s*$/.test(line)) { closeList(listState); html += "<hr />\n"; i++; continue; }
    if (line.startsWith("### ")) { closeList(listState); html += `<h3>${inline(line.slice(4))}</h3>\n`; i++; continue; }
    if (line.startsWith("## ")) { closeList(listState); html += `<h2>${inline(line.slice(3))}</h2>\n`; i++; continue; }
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      const sub = li[1].length >= 2;
      const ordered = /\d+\./.test(li[2]);
      if (ordered && listState.ul) { html += "</ul>\n"; listState.ul = false; }
      if (!ordered && listState.ol) { html += "</ol>\n"; listState.ol = false; }
      if (ordered && !listState.ol) { html += "<ol>\n"; listState.ol = true; }
      if (!ordered && !listState.ul) { html += "<ul>\n"; listState.ul = true; }
      html += `<li${sub ? ' class="sub"' : ""}>${inline(li[3])}</li>\n`; i++; continue;
    }
    if (line.trim() === "") { closeList(listState); i++; continue; }
    closeList(listState);
    html += `<p>${inline(line)}</p>\n`;
    i++;
  }
  closeList(listState);
  return html;
}

function renderTable(rows) {
  const parseCells = (r) => r.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
  if (rows.length < 2) return "";
  const head = parseCells(rows[0]);
  const bodyRows = rows.slice(1).filter(r => !/^\|[\s:|-]+\|?$/.test(r));
  let html = `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>`;
  for (const r of bodyRows) {
    const cells = parseCells(r);
    html += `<tr>${cells.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`;
  }
  html += `</tbody></table></div>\n`;
  return html;
}

// ============ 细线图标（与 consultant 站同源） ============
const ICON_PATHS = {
  book: '<path d="M12 6.5c-1.8-1.4-4.2-1.8-7-1.8v13c2.8 0 5.2.4 7 1.8 1.8-1.4 4.2-1.8 7-1.8v-13c-2.8 0-5.2.4-7 1.8z"/><path d="M12 6.5v13"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',
  stack: '<path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12.5l8 4.5 8-4.5"/><path d="M4 16.5l8 4.5 8-4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  arrowRight: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  share: '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  map: '<path d="M9 4L4 9l5 5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  light: '<path d="M12 3a7 7 0 0 1 4 12.7c-.8.6-1.3 1.4-1.5 2.3h-5c-.2-.9-.7-1.7-1.5-2.3A7 7 0 0 1 12 3z"/><path d="M10 21h4"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
};
function icon(name, size = 20) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}

// ============ 页头 / 页脚 ============
function pageHeader(activeNav) {
  const navCls = (key) => activeNav === key ? ' class="is-active"' : "";
  return `<header class="site-header" id="siteHeader">
  <div class="site-header__inner">
    <a href="index.html" class="brand" style="gap:10px;">
      <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" />
      <span class="brand__name"><b>大厂人转行医美</b> <span>实然指南</span></span>
    </a>
    <div class="header-right">
      <nav class="main-nav" id="mainNav">
        <a href="index.html#parts"${navCls("parts")}>系列总览</a>
        <a href="00-系列设计总纲.html"${navCls("plan")}>系列蓝图</a>
        <a href="../consultant/index.html">一路绿灯</a>
        <a href="../index.html">医美科普主站</a>
      </nav>
      <button class="share-btn" id="shareBtn" type="button" aria-label="分享本页到微信">${icon("share", 16)}<span class="share-btn__label">分享</span></button>
      <button class="nav-toggle" id="navToggle" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>`;
}

function pageFooter() {
  const partLinks = PARTS.map(p =>
    `<a href="index.html#part-${p.no}">${p.no === 0 ? "开" : p.no} ${p.name}</a>`).join("\n        ");
  return `<footer class="site-footer cp-footer">
  <div class="container cp-footer__grid">
    <div class="cp-footer__brand">
      <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" style="width:36px;height:36px;" />
      <div>
        <p class="cp-footer__name"><b>大厂人转行医美</b> · 实然指南</p>
        <p class="cp-footer__tagline">16 篇 · 四个部分回答四个问题 · 从事实出发，不劝进也不劝退</p>
      </div>
    </div>
    <nav class="cp-footer__nav" aria-label="页脚导航">
      <div>
        <p class="cp-footer__col">系列路线</p>
        ${partLinks}
      </div>
      <div>
        <p class="cp-footer__col">站点</p>
        <a href="00-系列设计总纲.html">系列蓝图</a>
        <a href="01-开篇-写给正在刷招聘软件的大厂人.html">从第 01 篇开始</a>
        <a href="16-去或不去-一页纸决策清单.html">一页纸决策清单</a>
        <a href="../consultant/index.html">一路绿灯 · 成长站</a>
        <a href="../index.html">医美科普主站</a>
        <a href="#top" class="cp-backtop">${icon("arrowUp", 14)}回到顶部</a>
      </div>
    </nav>
  </div>
  <div class="container cp-footer__bottom">
    <p>职业叙事与决策参考，不构成医疗建议，不构成投资建议 · 语料观点归属原作者并标注日期 · © 2026 · <a href="../disclaimer.html">实验内容声明</a></p>
  </div>
</footer>`;
}

function pageScript() {
  return `<script>
  (function(){
    var h=document.getElementById('siteHeader');
    window.addEventListener('scroll',function(){h.classList.toggle('is-scrolled',window.scrollY>4)},{passive:true});
    var t=document.getElementById('navToggle'),n=document.getElementById('mainNav');
    if(t)t.addEventListener('click',function(){var o=n.classList.toggle('is-open');t.setAttribute('aria-expanded',o)});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:0.08});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

    // —— 小节目录（宽屏） ——
    var secs=document.querySelectorAll('.cs-section');
    if(secs.length>2&&matchMedia('(min-width:1100px)').matches){
      var toc=document.createElement('nav');toc.className='mini-toc';toc.setAttribute('aria-label','本页小节');
      secs.forEach(function(sec,i){var h2=sec.querySelector('h2');if(!h2)return;sec.id='sec-'+i;
        var a=document.createElement('a');a.href='#sec-'+i;a.textContent=h2.textContent;toc.appendChild(a)});
      document.body.appendChild(toc);
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.querySelectorAll('a').forEach(function(a){a.classList.toggle('is-on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-40% 0px -55% 0px'});
      secs.forEach(function(sec){io2.observe(sec)});
    }

    // —— 阅读进度条 ——
    var bar=document.getElementById('cpProgress');
    if(bar){
      var b=document.body;
      var upd=function(){var max=b.scrollHeight-innerHeight;bar.style.transform='scaleX('+(max>0?(scrollY/max):0)+')'};
      addEventListener('scroll',upd,{passive:true});upd();
    }

    // —— 键盘翻篇：← 上一篇 / → 下一篇 ——
    var pv=document.body.getAttribute('data-prev'),nx=document.body.getAttribute('data-next');
    if(pv||nx)addEventListener('keydown',function(e){
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.key==='ArrowRight'&&nx)location.href=nx;
      if(e.key==='ArrowLeft'&&pv)location.href=pv;
    });

    // —— 移动端边缘滑动翻篇 ——
    var pvS=pv,nxS=nx,tx0=0,ty0=0;
    addEventListener('touchstart',function(e){if(e.touches.length!==1)return;tx0=e.touches[0].clientX;ty0=e.touches[0].clientY},{passive:true});
    addEventListener('touchend',function(e){
      if(!pvS&&!nxS)return;
      var dx=e.changedTouches[0].clientX-tx0,dy=e.changedTouches[0].clientY-ty0;
      if(Math.abs(dx)<64||Math.abs(dy)>44)return;
      var w=innerWidth;
      if(tx0<36&&dx>0&&pvS)location.href=pvS;
      if(tx0>w-36&&dx<0&&nxS)location.href=nxS;
    },{passive:true});
  })();
  </script>`;
}

// ============ 文章页 ============
function articlePage(a, idx) {
  const md = fs.readFileSync(path.join(SRC_DIR, `${a.slug}.md`), "utf8");
  const { h1, meta, sections, sourceLines } = parseArticleMd(md);
  const part = PARTS[a.part];
  const title = TITLE_MAP[a.slug] || h1.replace(/^\d+\s*·\s*/, "");
  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;
  const pageNo = String(idx + 1).padStart(2, "0");
  const desc = (meta.position || a.tagline).replace(/[*｜|]/g, " ").slice(0, 110);

  const sectionHtml = sections.map((sec) => `
    <section class="cs-section ${part.cls}">
      <div class="cs-section__head">${icon("book")}<h2>${esc(sec.title)}</h2></div>
      <div class="prose">${renderBlocks(sec.lines)}</div>
    </section>`).join("\n");

  const sourcesHtml = sourceLines.length ? `
    <section class="cs-section ${part.cls} materials">
      <div class="cs-section__head">${icon("stack")}<h2>本篇引用与核验</h2></div>
      <div class="callout">${sourceLines.map((l) => `<p>${inline(l)}</p>`).join("\n")}</div>
    </section>` : "";

  const pagerHtml = `
    <nav class="lesson-nav ${part.cls}">
      ${prev ? `<a href="${prev.slug}.html"><span class="nav-label">${icon("arrowRight", 14)} 上一篇</span><span class="nav-title">${esc(TITLE_MAP[prev.slug])}</span></a>` : `<a href="index.html"><span class="nav-label">${icon("map", 14)} 系列总览</span><span class="nav-title">大厂人转行医美 · 实然指南</span></a>`}
      ${next ? `<a class="next" href="${next.slug}.html"><span class="nav-label">下一篇 ${icon("arrowRight", 14)}</span><span class="nav-title">${esc(TITLE_MAP[next.slug])}</span></a>` : `<a class="back-path" href="index.html#parts">${icon("map", 14)} 读完了，回到系列总览</a>`}
      <a class="back-path" href="index.html#part-${part.no}">${icon("map", 14)} 回到本部分</a>
    </nav>`;

  return `<!doctype html>
<html lang="zh-CN" id="top">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} · 大厂人转行医美</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/career.css" />
  <link rel="stylesheet" href="../assets/css/share.css" />
${headMeta({ canonicalPath: `career/${a.slug}.html`, title: `${title} · 大厂人转行医美`, desc, cardKey: "career" })}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":${JSON.stringify(title)},"description":${JSON.stringify(desc)},"inLanguage":"zh-CN","isPartOf":{"@type":"CollectionPage","name":"大厂人转行医美系列"},"publisher":{"@type":"Organization","name":"重庆西区医院整形外科医疗美容中心"}}</script>
</head>
<body class="${part.cls}" data-prev="${prev ? prev.slug + ".html" : ""}" data-next="${next ? next.slug + ".html" : ""}">
  <div class="cp-progress" id="cpProgress" aria-hidden="true"></div>
${pageHeader()}

  <main class="container lesson-page">
    <header class="lesson-hero ${part.cls}">
      <span class="stage-chip">${part.no === 0 ? "开" : part.no} · ${esc(part.name)}</span>
      <h1>${esc(title)}</h1>
      ${meta.position ? `<p class="lesson-meta">${esc(meta.position)}</p>` : `<p class="lesson-meta">${esc(a.tagline)}</p>`}
      <p class="lesson-meta__hint">第 ${pageNo} 篇 · 共 ${ARTICLES.length} 篇 ${meta.partLabel && meta.partLabel !== part.name ? "· " + esc(meta.partLabel) : ""}</p>
    </header>
${sectionHtml}
${sourcesHtml}
${pagerHtml}
  </main>

${pageFooter()}
<script src="../assets/js/share.js"></script>
${pageScript()}
</body>
</html>
`;
}

// ============ 蓝图页（系列设计总纲） ============
function blueprintPage() {
  const md = fs.readFileSync(path.join(SRC_DIR, `${BLUEPRINT.slug}.md`), "utf8");
  const { h1, sections } = parseArticleMd(md);
  const sectionHtml = sections.map((sec) => `
    <section class="cs-section stage-plan">
      <div class="cs-section__head">${icon("stack")}<h2>${esc(sec.title)}</h2></div>
      <div class="prose">${renderBlocks(sec.lines)}</div>
    </section>`).join("\n");

  return `<!doctype html>
<html lang="zh-CN" id="top">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(h1)} · 大厂人转行医美</title>
  <meta name="description" content="系列设计蓝图：实然写作纪律、翻译器装置、16 篇篇目设计、事实底座与引用总表。" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/career.css" />
  <link rel="stylesheet" href="../assets/css/share.css" />
${headMeta({ canonicalPath: `career/${BLUEPRINT.slug}.html`, title: `${h1} · 大厂人转行医美`, desc: "系列设计蓝图：实然写作纪律、翻译器装置、篇目设计与引用总表", cardKey: "career" })}
</head>
<body class="stage-plan" data-next="01-开篇-写给正在刷招聘软件的大厂人.html">
  <div class="cp-progress" id="cpProgress" aria-hidden="true"></div>
${pageHeader("plan")}

  <main class="container lesson-page">
    <header class="lesson-hero stage-plan">
      <span class="stage-chip">蓝图 · 设计总纲</span>
      <h1>${esc(h1)}</h1>
      <p class="lesson-meta">整套系列的设计蓝图：写作纪律、贯穿装置、篇目设计、事实底座与引用总表。</p>
      <p class="lesson-meta__hint">附属于本系列 · 正式篇目从第 01 篇开始</p>
    </header>
${sectionHtml}
    <nav class="lesson-nav stage-plan">
      <a href="index.html"><span class="nav-label">${icon("map", 14)} 系列总览</span><span class="nav-title">大厂人转行医美 · 实然指南</span></a>
      <a class="next" href="01-开篇-写给正在刷招聘软件的大厂人.html"><span class="nav-label">进入正文 ${icon("arrowRight", 14)}</span><span class="nav-title">开篇——写给正在刷招聘软件的大厂人</span></a>
    </nav>
  </main>

${pageFooter()}
<script src="../assets/js/share.js"></script>
${pageScript()}
</body>
</html>
`;
}

// ============ 系列总览首页 ============
function indexPage() {
  const first = ARTICLES[0];
  const partSections = PARTS.map((p) => {
    const arts = ARTICLES.filter((a) => a.part === p.no);
    const cards = arts.map((a) => {
      const no = String(ARTICLES.indexOf(a) + 1).padStart(2, "0");
      return `<a class="cf-card reveal ${p.cls}" href="${a.slug}.html">
        <span class="cf-card__no">${no}</span>
        <span class="cf-card__body">
          <span class="cf-card__title">${esc(TITLE_MAP[a.slug])}</span>
          <span class="cf-card__tag">${esc(a.tagline)}</span>
        </span>
        <span class="cf-card__go">${icon("arrowRight", 16)}</span>
      </a>`;
    }).join("\n          ");
    return `
      <section class="cf-stage ${p.cls}" id="part-${p.no}">
        <div class="cf-stage__head">
          <span class="cf-stage__no">${p.no === 0 ? "开" : p.no}</span>
          <div>
            <h2 class="cf-stage__name">${esc(p.name)}</h2>
            <p class="cf-stage__goal">${esc(p.goal)}</p>
          </div>
          <span class="cf-stage__pass">${icon("check", 14)} ${esc(p.pass)}</span>
        </div>
        <div class="cf-grid">
          ${cards}
        </div>
      </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN" id="top">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>大厂人转行医美 · 实然指南</title>
  <meta name="description" content="写给考虑转行医美的大厂人与名校毕业生：16 篇实然指南，从行业结构、入口实况、入职经历到名校生专题。不劝进、不劝退，只把实况摆全。" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/career.css" />
  <link rel="stylesheet" href="../assets/css/share.css" />
${headMeta({ canonicalPath: "career/index.html", title: "大厂人转行医美 · 实然指南", desc: "16 篇实然指南：认识行业、入口实况、入职经历、名校生专题。不劝进不劝退，只把实况摆全。", cardKey: "career" })}
</head>
<body class="stage-s1">
  <div class="cp-progress" id="cpProgress" aria-hidden="true"></div>
${pageHeader()}

  <main>
    <section class="cp-hero">
      <div class="container">
        <p class="eyebrow" style="margin-top:var(--sp-5);">大厂人转行医美 · FROM TECH TO MEDICAL AESTHETICS</p>
        <h1>实然指南</h1>
        <p class="lead">医美是个什么行业、钱怎么分、谁说了算；大厂人怎么进、进来会经历什么；名校生的机会与代价。十六篇，从事实出发——不劝进，不劝退，把实况摆全。</p>
        <div class="stats">
          <span><b>16</b>篇正文</span>
          <span><b>4</b>个部分</span>
          <span><b>15</b>篇语料底座</span>
          <span><b>73</b>处带日期引用</span>
        </div>
        <div class="cta-row">
          <a class="btn btn--primary" href="${first.slug}.html">从第 01 篇开始 ${icon("arrowRight", 15)}</a>
          <a class="btn btn--ghost" href="00-系列设计总纲.html">先看系列蓝图</a>
          <a class="btn btn--ghost" href="16-去或不去-一页纸决策清单.html">直达决策清单</a>
        </div>
      </div>
    </section>

    <div class="container" id="parts" style="padding-bottom: var(--sp-9);">
${partSections}
    </div>
  </main>

${pageFooter()}
<script src="../assets/js/share.js"></script>
${pageScript()}
</body>
</html>
`;
}

// ============ 搜索索引 JSON ============
function careerJson() {
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    name: "大厂人转行医美 · 实然指南",
    tagline: "16 篇实然指南：认识行业、入口实况、入职经历、名校生专题",
    parts: PARTS.map((p) => ({ no: p.no, name: p.name, goal: p.goal })),
    articles: ARTICLES.map((a, idx) => {
      const md = fs.readFileSync(path.join(SRC_DIR, `${a.slug}.md`), "utf8");
      const { h1 } = parseArticleMd(md);
      return {
        no: idx + 1,
        slug: a.slug,
        title: h1.replace(/^\d+\s*·\s*/, ""),
        part: a.part,
        partName: PARTS[a.part].name,
        tagline: a.tagline,
      };
    }),
  };
}

// ============ 主流程 ============
fs.mkdirSync(OUT_DIR, { recursive: true });
for (let i = 0; i < ARTICLES.length; i++) {
  fs.writeFileSync(path.join(OUT_DIR, `${ARTICLES[i].slug}.html`), articlePage(ARTICLES[i], i));
}
fs.writeFileSync(path.join(OUT_DIR, `${BLUEPRINT.slug}.html`), blueprintPage());
fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexPage());

const jsonPath = path.join(ROOT, "assets", "data", "career.json");
fs.writeFileSync(jsonPath, JSON.stringify(careerJson(), null, 1));

console.log("=== 大厂人转行医美系列 构建完成 ===");
console.log(`文章页: ${ARTICLES.length} 个, 蓝图 + 首页: 2 个, 共 ${ARTICLES.length + 2} 个文件`);
console.log(`输出目录: ${OUT_DIR}`);
console.log(`搜索索引: ${jsonPath}`);
