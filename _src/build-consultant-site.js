/**
 * build-consultant-site.js — 医美咨询师成长之路 · 静态站点构建器
 *
 * 用法: node _src/build-consultant-site.js
 * 输入: _src/医美咨询师成长教程/*.md + images/*.svg
 * 输出: consultant/ 目录（index.html 成长之路 + 21 个课文页 + images/ + assets/data/consultant.json）
 *
 * 特性:
 *  - 课程 md 结构化解析（阶段徽标 / 学习目标 / 正文 / 作业 / 通关 / 配套教材）
 *  - 教材 md 链接自动映射到已发布的科普站页面（skin/injection/surgery/aesthetics/types）
 *  - 表格 / 任务清单 / 多行引用 / 图表 figure 全支持
 *  - 纯静态、全相对路径，可直接部署到任意静态服务器
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "_src", "医美咨询师成长教程");
const OUT_DIR = path.join(ROOT, "consultant");
const { headMeta } = require("./site-config");

// ============ 阶段配置 ============
const STAGES = [
  { key: "s0", num: 0, name: "引擎自检", time: "第 0-1 周", goal: "看清职业真相与自己的底盘，郑重决定入行与否", pass: "一页纸《入行决策书》" },
  { key: "s1", num: 1, name: "学交规", time: "第 1-2 月", goal: "懂行业结构，懂合规红线，懂消费者视角", pass: "合规情景测试 15 题全对" },
  { key: "s2", num: 2, name: "认识车流", time: "第 2-4 月", goal: "建立皮肤、注射、手术、美学的知识底盘", pass: "“给闺蜜讲明白”测试 10 题" },
  { key: "s3", num: 3, name: "看懂路口", time: "第 4-6 月", goal: "掌握美学评估、面诊技术、期望管理与警讯识别", pass: "3 段模拟面诊录像通过双评" },
  { key: "s4", num: 4, name: "上路", time: "第 6-9 月", goal: "把学习成果兑换成 offer，并在岗位上活过前 90 天", pass: "拿到 offer 并完成转正述职" },
  { key: "s5", num: 5, name: "绿波带", time: "第 9-12 月起", goal: "情绪价值深化，选定三条成长分支之一", pass: "年度复盘 + 分支路线图" },
];

// 课文清单（tagline 与 README 目录一致）
const LESSONS = [
  { slug: "00-课程设计总纲", stage: null, tagline: "教学理念、隐喻系统、五阶段地图与通关标准" },
  { slug: "01-开课词-给交通信号工程师的转行信", stage: 0, tagline: "职业三个真相、新旧咨询师两条车道、课程用法" },
  { slug: "02-引擎自检-要不要入行的红绿灯", stage: 0, tagline: "21 条红绿灯自检、绝不清单、入行决策书" },
  { slug: "03-行业地图-一座叫医美的城市", stage: 1, tagline: "生美/医美资质墙、四类机构、岗位生态" },
  { slug: "04-合规红线-咨询师不是医务人员", stage: 1, tagline: "五不边界、三色区、留痕意识、情景判断" },
  { slug: "05-消费者视角-四层结构与暗访作业", stage: 1, tagline: "四层结构拆解法、暗访作业、阶段 1 考核" },
  { slug: "06-皮肤底盘-21篇精读地图", stage: 2, tagline: "六大分区 21 篇精读、3-2-1 卡片法示范" },
  { slug: "07-注射底盘-三大逻辑与风险重灾区", stage: 2, tagline: "三大逻辑、血管栓塞红线、咨询师三做三不做" },
  { slug: "08-手术底盘-分级资质与最长决策链", stage: 2, tagline: "四级手术与资质、决策链、陪诊者角色" },
  { slug: "09-美学语言-从三庭五眼到骨相皮相", stage: 2, tagline: "三庭五眼、骨相皮相、词汇翻译器、审美底线" },
  { slug: "10-面诊技术-OD访谈与信号配时", stage: 3, tagline: "OD 四问、望闻问切、配时纪律、转诊摘要" },
  { slug: "11-期望管理-效果区间表达法", stage: 3, tagline: "区间表达法、翻译三步、价格答法、语言日检" },
  { slug: "12-警讯系统-红黄绿灯分级", stage: 3, tagline: "红灯四类（含疑似 BDD）、黄灯缓行、转介话术" },
  { slug: "13-情绪价值-AI替代不了的十二种能力", stage: 3, tagline: "12 型轮盘、8 个落地动作、情绪档案" },
  { slug: "14-剧本工作坊-十个经典场景话术", stage: 3, tagline: "十场景话术框架、演练法、阶段 3 考核" },
  { slug: "15-作品集-三十篇科普转写法", stage: 4, tagline: "转写公式、平台差异、合规自检" },
  { slug: "16-求职路线-岗位选择与面试准备", stage: 4, tagline: "四条入口、零经验简历、高频面试题、反问机构" },
  { slug: "17-入职90天-跟诊学习与转正述职", stage: 4, tagline: "30/60/90 节奏、匹配度反馈、转正述职" },
  { slug: "18-指标健康读法-识别病态KPI", stage: 4, tagline: "四指标健康读法、病态 KPI 五信号" },
  { slug: "19-客户经营-潮汐车道与长期主义", stage: 5, tagline: "潮汐经营、生命周期五阶段、客户台账" },
  { slug: "20-三条分支与年度复盘", stage: 5, tagline: "三条分支路线、年度复盘模板、结业自检" },
];

// 教材系列 → 已发布站点的映射（md 文件名 id → slug）
const SERIES_MAP = {
  "皮肤常见病症科普系列": { json: "conditions.json", dir: "skin" },
  "美容注射的艺术科普系列": { json: "injection.json", dir: "injection" },
  "四级与整形美容手术科普系列": { json: "surgery.json", dir: "surgery" },
  "医美亚美学科普系列": { json: "aesthetics.json", dir: "aesthetics" },
  "医美美学三型科普系列": { json: "types.json", dir: "types" },
};
const linkIndex = {}; // "../<系列>/<NN-名>.md" -> "/../<dir>/<slug>.html" | null
for (const [seriesName, cfg] of Object.entries(SERIES_MAP)) {
  const jsonPath = path.join(ROOT, "assets", "data", cfg.json);
  if (!fs.existsSync(jsonPath)) continue;
  const entries = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  for (const e of entries) {
    linkIndex[`../${seriesName}/${String(e.id).padStart(2, "0")}-`] = {
      dir: cfg.dir, slug: e.slug,
      byId: String(e.id),
    };
  }
}

function mapMdLink(url, linkText) {
  // 同目录课程互链
  if (/^[^/]+\.md$/.test(url)) {
    return { html: `<a href="${esc(url.replace(/\.md$/, ".html"))}">${linkText}</a>` };
  }
  // 外部链接
  if (/^https?:/.test(url)) {
    return { html: `<a href="${url}" target="_blank" rel="noopener">${linkText}</a>` };
  }
  // 教材系列链接: ../<系列>/<NN-xxx>.md
  const m = url.match(/^\.\.\/([^/]+)\/(\d+)-[^/]*\.md$/);
  if (m) {
    const seriesName = m[1];
    if (SERIES_MAP[seriesName]) {
      const entries = Object.values(linkIndex).filter(e => e.dir === SERIES_MAP[seriesName].dir);
      const hit = entries.find(e => e.byId === String(parseInt(m[2], 10)));
      if (hit) return { html: `<a href="../${hit.dir}/${hit.slug}.html">${linkText}</a>` };
    }
    // 系列未发布（如腹壁整形）: 渲染为不可点击的教材引用
    return { html: `<span class="doc-ref" title="教材原文位于仓库 _src 目录">${linkText}</span>` };
  }
  return { html: `<a href="${url}">${linkText}</a>` };
}

// ============ 工具 ============
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(text) {
  let t = esc(text);
  // 链接（在加粗之前处理；URL 中的 & 已成 &amp;，属性内合法）
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m0, label, url) => {
    const r = mapMdLink(url.replace(/&amp;/g, "&"), label);
    return r.html;
  });
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

// ============ 课程 md 解析 ============
function parseCourseMd(text) {
  const lines = text.split(/\r?\n/);
  let h1 = "";
  const meta = { stage: null, duration: "", prereq: "" };
  const rawSections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("# ") && !h1) { h1 = line.slice(2).trim(); continue; }
    // 阶段徽标行: > **阶段 X · 名称** ｜ 预计用时：… ｜ 前置课程：…
    const mm = line.match(/^>\s*\*\*阶段\s*(\d+)\s*·\s*[^*]+\*\*\s*｜\s*预计用时[:：]?\s*([^｜]+)｜\s*前置课程[:：]?\s*(.*)$/);
    if (mm) { meta.stage = parseInt(mm[1], 10); meta.duration = mm[2].trim(); meta.prereq = mm[3].trim(); continue; }
    if (/^##\s+/.test(line)) {
      if (current) rawSections.push(current);
      current = { title: line.replace(/^##\s+/, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) rawSections.push(current);
  return { h1, meta, sections: rawSections };
}

// ============ 块渲染 ============
function renderBlocks(lines) {
  let html = "";
  let i = 0;
  const closeList = (st) => { if (st.ul) { html += "</ul>\n"; st.ul = false; } if (st.ol) { html += "</ol>\n"; st.ol = false; } };
  const listState = { ul: false, ol: false };

  while (i < lines.length) {
    const line = lines[i];

    // 表格
    if (/^\s*\|/.test(line)) {
      closeList(listState);
      const tbl = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { tbl.push(lines[i].trim()); i++; }
      html += renderTable(tbl);
      continue;
    }
    // 引用块（连续 > 行合为一块）
    if (/^>\s?/.test(line)) {
      closeList(listState);
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i++; }
      html += `<blockquote>${quote.filter(l => l.trim() !== "" || quote.length === 1).map(l => `<p>${inline(l)}</p>`).join("")}</blockquote>\n`;
      continue;
    }
    // 图片
    const im = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (im) {
      closeList(listState);
      html += `<figure><img src="${im[2]}" alt="${esc(im[1])}" loading="lazy" /><figcaption>${esc(im[1])}</figcaption></figure>\n`;
      i++; continue;
    }
    // 分隔线
    if (/^---+\s*$/.test(line)) { closeList(listState); html += "<hr />\n"; i++; continue; }
    // 标题
    if (line.startsWith("### ")) { closeList(listState); html += `<h3>${inline(line.slice(4))}</h3>\n`; i++; continue; }
    if (line.startsWith("## ")) { closeList(listState); html += `<h2>${inline(line.slice(3))}</h2>\n`; i++; continue; }
    // 任务清单
    const task = line.match(/^(\s*)-\s+\[ \]\s+(.*)$/);
    if (task) {
      if (listState.ol) { html += "</ol>\n"; listState.ol = false; }
      if (!listState.ul) { html += "<ul>\n"; listState.ul = true; }
      html += `<li class="task">${inline(task[2])}</li>\n`; i++; continue;
    }
    // 列表
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
    // 空行
    if (line.trim() === "") { closeList(listState); i++; continue; }
    // 段落
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

// ============ 分区渲染 ============
const SECTION_STYLE = {
  "学习目标": { icon: "target", cls: "goal" },
  "正文": { icon: "book", cls: "prose" },
  "本课作业": { icon: "pen", cls: "callout" },
  "通关检验": { icon: "flag", cls: "callout" },
  "配套教材": { icon: "stack", cls: "materials" },
};

function renderSection(section, stageClass) {
  const style = SECTION_STYLE[section.title] || { icon: "book", cls: "prose" };
  const body = renderBlocks(section.lines);
  if (style.cls === "goal") {
    // 学习目标: 列表项 → goal-list
    const items = section.lines.filter(l => /^\s*[-*]\s+/.test(l)).map(l => l.replace(/^\s*[-*]\s+/, ""));
    const goalHtml = items.length
      ? `<ul class="goal-list">${items.map(it => `<li>${inline(it)}</li>`).join("\n")}</ul>`
      : body;
    return `<section class="cs-section ${stageClass}">
      <div class="cs-section__head">${icon(style.icon)}<h2>${esc(section.title)}</h2></div>
      ${goalHtml}
    </section>\n`;
  }
  if (style.cls === "callout") {
    return `<section class="cs-section ${stageClass}">
      <div class="cs-section__head">${icon(style.icon)}<h2>${esc(section.title)}</h2></div>
      <div class="callout">${body}</div>
    </section>\n`;
  }
  if (style.cls === "materials") {
    return `<section class="cs-section ${stageClass} materials">
      <div class="cs-section__head">${icon(style.icon)}<h2>${esc(section.title)}</h2></div>
      ${body}
    </section>\n`;
  }
  return `<section class="cs-section ${stageClass}">
    <div class="cs-section__head">${icon(style.icon)}<h2>${esc(section.title)}</h2></div>
    <div class="prose">${body}</div>
  </section>\n`;
}

// ============ 细线图标系统（24 viewBox · stroke 1.5 · 无填充） ============
const ICON_PATHS = {
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
  book: '<path d="M12 6.5c-1.8-1.4-4.2-1.8-7-1.8v13c2.8 0 5.2.4 7 1.8 1.8-1.4 4.2-1.8 7-1.8v-13c-2.8 0-5.2.4-7 1.8z"/><path d="M12 6.5v13"/>',
  pen: '<path d="M4 20l1-4L16.5 4.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L8 19l-4 1z"/><path d="M14.5 6.5l3 3"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',
  stack: '<path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12.5l8 4.5 8-4.5"/><path d="M4 16.5l8 4.5 8-4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  arrowRight: '<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  share: '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  chat: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V6z"/><path d="M8.5 10h.01M12 10h.01M15.5 10h.01"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  map: '<path d="M9 4L4 9l5 5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>',
  light: '<path d="M12 3a7 7 0 0 1 4 12.7c-.8.6-1.3 1.4-1.5 2.3h-5c-.2-.9-.7-1.7-1.5-2.3A7 7 0 0 1 12 3z"/><path d="M10 21h4"/>',
};
function icon(name, size = 20) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
}

// ============ 共用页头/页脚 ============
function pageHeader(activeNav) {
  const navCls = (key) => activeNav === key ? ' class="is-active"' : "";
  return `<header class="site-header" id="siteHeader">
  <div class="site-header__inner">
    <a href="index.html" class="brand" style="gap:10px;">
      <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" />
      <span class="brand__name"><b>一路绿灯</b> <span>医美咨询师成长站</span></span>
    </a>
    <div class="header-right">
      <nav class="main-nav" id="mainNav">
        <a href="index.html#method"${navCls("method")}>学习方法</a>
        <a href="00-课程设计总纲.html"${navCls("plan")}>课程蓝图</a>
        <a href="../index.html">医美科普主站</a>
      </nav>
      <button class="share-btn" id="shareBtn" type="button" aria-label="分享本页到微信">${icon("share", 16)}<span class="share-btn__label">分享</span></button>
      <button class="nav-toggle" id="navToggle" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>`;
}

function pageFooter() {
  const routeLinks = STAGES.map(st =>
    `<a href="index.html#stage-${st.num}">${st.num} ${st.name}</a>`).join("\n        ");
  return `<footer class="site-footer cp-footer">
  <div class="container cp-footer__grid">
    <div class="cp-footer__brand">
      <img class="brand__logo" src="../assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" style="width:36px;height:36px;" />
      <div>
        <p class="cp-footer__name"><b>一路绿灯</b> · 医美咨询师成长站</p>
        <p class="cp-footer__tagline">从小白到上岗的十二个月 · 五个阶段 · 二十节课</p>
      </div>
    </div>
    <nav class="cp-footer__nav" aria-label="页脚导航">
      <div>
        <p class="cp-footer__col">课程路线</p>
        ${routeLinks}
      </div>
      <div>
        <p class="cp-footer__col">站点</p>
        <a href="00-课程设计总纲.html">课程蓝图</a>
        <a href="01-开课词-给交通信号工程师的转行信.html">从第 01 课开始</a>
        <a href="../index.html">医美科普主站</a>
        <a href="#top" class="cp-backtop">${icon("arrowUp", 14)}回到顶部</a>
      </div>
    </nav>
  </div>
  <div class="container cp-footer__bottom">
    <p>职业教育内容，不构成医疗建议 · 咨询师不诊断、不定方案、不承诺疗效 · 语料观点归属原作者 · © 2026 · <a href="../disclaimer.html">实验内容声明</a></p>
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

    // —— C1 课程进度：标记本课完成（localStorage） ——
    var PK='yldj-progress';
    var prog={};try{prog=JSON.parse(localStorage.getItem(PK)||'{}')}catch(e){}
    Object.keys(prog).forEach(function(k){try{var dk=decodeURIComponent(k);if(dk!==k){prog[dk]=prog[k];delete prog[k]}}catch(e){}});
    var pageKey=decodeURIComponent(location.pathname.split('/').pop());
    var mdBtn=document.getElementById('markDone');
    function syncMd(){if(mdBtn){var d=!!prog[pageKey];mdBtn.classList.toggle('is-done',d);mdBtn.querySelector('.mark-done__label').textContent=d?'已完成，点击取消':'标记本课完成'}}
    if(mdBtn)mdBtn.addEventListener('click',function(){if(prog[pageKey])delete prog[pageKey];else prog[pageKey]=1;try{localStorage.setItem(PK,JSON.stringify(prog))}catch(e){}syncMd()});
    syncMd();

    // —— C1 首页进度点亮 ——
    var cardsEl=document.querySelectorAll('.lesson-card');
    if(cardsEl.length){
      var doneCnt=0;
      cardsEl.forEach(function(c){var f=(c.getAttribute('href')||'').split('/').pop();if(f&&prog[f]){c.classList.add('is-done');doneCnt++}});
      document.querySelectorAll('.stage').forEach(function(st){
        var cs=st.querySelectorAll('.lesson-card');
        var all=cs.length>0;
        for(var ci=0;ci<cs.length;ci++){if(!cs[ci].classList.contains('is-done')){all=false;break}}
        if(all)st.classList.add('stage-done');
      });
      var g1=document.getElementById('gradLink');
      if(g1&&doneCnt>=20)g1.style.display='';
    }

    // —— C3 正文字号 ——
    var fsBtns=document.querySelectorAll('.fs-ctrl button');
    function setFs(v){document.documentElement.setAttribute('data-fs',v);try{localStorage.setItem('yldj-fs',v)}catch(e){}fsBtns.forEach(function(b){b.classList.toggle('is-on',b.getAttribute('data-fs')===v)})}
    var curFs='md';try{curFs=localStorage.getItem('yldj-fs')||'md'}catch(e){}
    if(fsBtns.length){setFs(curFs);fsBtns.forEach(function(b){b.addEventListener('click',function(){setFs(b.getAttribute('data-fs'))})})}

    // —— C3 小节目录（宽屏） ——
    var secs=document.querySelectorAll('.cs-section');
    if(secs.length>2&&matchMedia('(min-width:1100px)').matches){
      var toc=document.createElement('nav');toc.className='mini-toc';toc.setAttribute('aria-label','本页小节');
      secs.forEach(function(sec,i){var h=sec.querySelector('h2');if(!h)return;sec.id='sec-'+i;
        var a=document.createElement('a');a.href='#sec-'+i;a.textContent=h.textContent;toc.appendChild(a)});
      document.body.appendChild(toc);
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.querySelectorAll('a').forEach(function(a){a.classList.toggle('is-on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-40% 0px -55% 0px'});
      secs.forEach(function(sec){io2.observe(sec)});
    }

    // —— C4 边缘滑动翻课（移动端） ——
    var pvS=document.body.getAttribute('data-prev'),nxS=document.body.getAttribute('data-next');
    if((pvS||nxS)&&'ontouchstart' in window){
      var tx0=0,ty0=0;
      addEventListener('touchstart',function(e){if(e.touches.length===1){tx0=e.touches[0].clientX;ty0=e.touches[0].clientY}},{passive:true});
      addEventListener('touchend',function(e){
        var dx=e.changedTouches[0].clientX-tx0,dy=e.changedTouches[0].clientY-ty0;
        if(Math.abs(dx)<64||Math.abs(dy)>44)return;
        var w=innerWidth;
        if(tx0<36&&dx>0&&pvS)location.href=pvS;
        if(tx0>w-36&&dx<0&&nxS)location.href=nxS;
      },{passive:true});
    }

    // —— 阅读进度条（课文页） ——    // —— 阅读进度条（课文页） ——
    var bar=document.getElementById('cpProgress');
    if(bar){
      var b=document.body;
      var upd=function(){var max=b.scrollHeight-innerHeight;bar.style.transform='scaleX('+(max>0?(scrollY/max):0)+')'};
      addEventListener('scroll',upd,{passive:true});upd();
    }

    // —— 键盘翻课：← 上一课 / → 下一课 ——
    var pv=document.body.getAttribute('data-prev'),nx=document.body.getAttribute('data-next');
    if(pv||nx)addEventListener('keydown',function(e){
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.key==='ArrowRight'&&nx)location.href=nx;
      if(e.key==='ArrowLeft'&&pv)location.href=pv;
    });

    // —— 图片灯箱：点击查看大图 · 滚轮/双指缩放 · 拖拽平移 ——
    var lbImgs=document.querySelectorAll('.prose figure img');
    if(lbImgs.length){
      var lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','图片查看器');
      lb.innerHTML='<div class="lb__backdrop"></div><div class="lb__stage"><img class="lb__img" alt="" /></div>'
        +'<button class="lb__close" type="button" aria-label="关闭">✕</button>'
        +'<div class="lb__ctrl"><button type="button" data-a="out" aria-label="缩小">−</button><span class="lb__pct">100%</span><button type="button" data-a="in" aria-label="放大">＋</button><button type="button" data-a="fit" aria-label="复位">复位</button></div>'
        +'<p class="lb__cap"></p>';
      document.body.appendChild(lb);
      var lbImg=lb.querySelector('.lb__img'),lbPct=lb.querySelector('.lb__pct'),lbCap=lb.querySelector('.lb__cap'),lbStage=lb.querySelector('.lb__stage');
      var sc=1,tx=0,ty=0,lastFocus=null;
      function apply(){lbImg.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')';lbPct.textContent=Math.round(sc*100)+'%'}
      function fit(){sc=1;tx=0;ty=0;apply()}
      function zoomAt(px,py,k){
        var ns=Math.min(8,Math.max(0.2,sc*k));k=ns/sc;
        var w=lbStage.clientWidth,h=lbStage.clientHeight;
        tx=(px-w/2)-((px-w/2)-tx)*k;
        ty=(py-h/2)-((py-h/2)-ty)*k;
        sc=ns;apply();
      }
      function openLb(img){
        lbImg.src=img.src;lbImg.alt=img.alt||'';
        var fig=img.closest('figure');
        var cap=fig&&fig.querySelector('figcaption');
        lbCap.textContent=cap?cap.textContent:'';
        lastFocus=document.activeElement;
        lb.classList.add('is-on');document.body.style.overflow='hidden';
        fit();lb.querySelector('.lb__close').focus();
      }
      function closeLb(){lb.classList.remove('is-on');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
      lbImgs.forEach(function(im){im.addEventListener('click',function(){openLb(im)})});
      lb.querySelector('.lb__backdrop').addEventListener('click',closeLb);
      lb.querySelector('.lb__close').addEventListener('click',closeLb);
      lb.querySelector('.lb__ctrl').addEventListener('click',function(e){
        var a=e.target.getAttribute('data-a');if(!a)return;
        var w=lbStage.clientWidth,h=lbStage.clientHeight;
        if(a==='in')zoomAt(w/2,h/2,1.25);
        if(a==='out')zoomAt(w/2,h/2,0.8);
        if(a==='fit')fit();
      });
      // PC：鼠标滚轮缩放（以光标为锚点）
      lb.addEventListener('wheel',function(e){
        if(!lb.classList.contains('is-on'))return;
        e.preventDefault();
        var r=lbStage.getBoundingClientRect();
        zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.15:1/1.15);
      },{passive:false});
      // 拖拽平移
      var drag=null;
      lbImg.addEventListener('pointerdown',function(e){
        if(e.pointerType==='mouse'&&e.button!==0)return;
        drag={x:e.clientX,y:e.clientY,tx:tx,ty:ty};
        try{lbImg.setPointerCapture(e.pointerId)}catch(err){}
        lbImg.classList.add('is-grab');
      });
      lbImg.addEventListener('pointermove',function(e){
        if(!drag)return;tx=drag.tx+(e.clientX-drag.x);ty=drag.ty+(e.clientY-drag.y);apply();
      });
      var endDrag=function(){drag=null;lbImg.classList.remove('is-grab')};
      lbImg.addEventListener('pointerup',endDrag);
      lbImg.addEventListener('pointercancel',endDrag);
      // 双击 / 双触：放大与复位
      lbImg.addEventListener('dblclick',function(e){
        var r=lbStage.getBoundingClientRect();
        if(sc>1.05)fit();else zoomAt(e.clientX-r.left,e.clientY-r.top,2.5);
      });
      // 移动端：双指捏合
      var pd=0,pm={x:0,y:0};
      lbImg.addEventListener('touchstart',function(e){
        if(e.touches.length===2){
          var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
          pd=Math.sqrt(dx*dx+dy*dy);
          pm={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
        }else{pd=0}
      },{passive:true});
      lbImg.addEventListener('touchmove',function(e){
        if(e.touches.length===2&&pd>0){
          e.preventDefault();
          var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
          var d=Math.sqrt(dx*dx+dy*dy);
          var r=lbStage.getBoundingClientRect();
          zoomAt(pm.x-r.left,pm.y-r.top,d/pd);pd=d;
        }
      },{passive:false});
      // Esc 关闭 · +/− 键缩放
      document.addEventListener('keydown',function(e){
        if(!lb.classList.contains('is-on'))return;
        if(e.key==='Escape'){closeLb();return}
        var w=lbStage.clientWidth,h=lbStage.clientHeight;
        if(e.key==='+'||e.key==='=')zoomAt(w/2,h/2,1.25);
        if(e.key==='-')zoomAt(w/2,h/2,0.8);
      });
    }

    // —— 结业任务清单：点击打勾，进度存本地 ——
    var KEY='yldj-checkoff';
    var saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
    document.querySelectorAll('.prose li.task').forEach(function(li,i){
      var id=location.pathname+'#'+i;
      if(saved[id]){li.classList.add('is-done')}
      li.setAttribute('role','checkbox');li.setAttribute('tabindex','0');
      function tg(){li.classList.toggle('is-done');saved[id]=li.classList.contains('is-done');try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}}
      li.addEventListener('click',tg);
      li.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();tg()}});
    });
  })();
</script>`;
}

// ============ 课文页 ============
function lessonPageHtml(lesson, parsed, prev, next) {
  const stageIdx = lesson.stage;
  const stage = stageIdx === null ? null : STAGES[stageIdx];
  const stageClass = stageIdx === null ? "stage-plan" : `stage-s${stageIdx}`;
  const no = parseInt(lesson.slug.split("-")[0], 10);
  const titleShort = parsed.h1.replace(/^\d+\s*·\s*/, "");

  const prereq = parsed.meta.prereq;
  const prereqHtml = /^\d+$/.test(prereq)
    ? `<a href="${LESSONS[parseInt(prereq, 10)].slug}.html" style="color:inherit">第 ${prereq} 课</a>`
    : esc(prereq || "无");

  const sectionsHtml = parsed.sections.map(s => renderSection(s, stageClass)).join("\n");

  const prevHtml = prev ? `<a href="${prev.slug}.html"><span class="nav-label">${icon("arrowRight", 14).replace('class="icon"', 'class="icon icon--flip"')} 上一课</span><span class="nav-title">${esc(prev.title)}</span></a>` : "<a aria-hidden='true'></a>";
  const nextHtml = next ? `<a class="next" href="${next.slug}.html"><span class="nav-label">下一课 ${icon("arrowRight", 14)}</span><span class="nav-title">${esc(next.title)}</span></a>` : "<a aria-hidden='true'></a>";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(parsed.h1)} · 一路绿灯</title>
  <meta name="description" content="${esc(lesson.tagline)}" />
  ${headMeta({ canonicalPath: "consultant/" + lesson.slug + ".html", title: `${esc(titleShort)} · 第 ${no} 课 · 一路绿灯`, desc: lesson.tagline, cardKey: "consultant", siteName: "一路绿灯 · 医美咨询师成长站" })}
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: esc(titleShort), description: lesson.tagline, inLanguage: "zh-CN", position: no, educationalLevel: "零基础转行", provider: { "@type": "Organization", name: "一路绿灯 · 医美咨询师成长站" } })}</script>
  <link rel="icon" type="image/png" href="../assets/logo/amc-logo.png" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/consultant.css" />
  <link rel="stylesheet" href="../assets/css/share.css" />
</head>
<body id="top" data-prev="${prev ? prev.slug + ".html" : ""}" data-next="${next ? next.slug + ".html" : ""}" class="${stageClass}">
  <div class="cp-progress" id="cpProgress" aria-hidden="true"></div>
  ${pageHeader(stage ? "road" : "plan")}

  <main class="container lesson-page">
    <nav class="breadcrumb">
      <a href="index.html">一路绿灯</a> ／
      ${stage ? `<a href="index.html#stage-${stage.num}">阶段 ${stage.num} · ${stage.name}</a> ／` : `<a href="index.html#plan">课程蓝图</a> ／`}
      <span>第 ${no} 课</span>
    </nav>

    <header class="lesson-hero ${stageClass}">
      <p class="stage-chip">${stage ? `阶段 ${stage.num} · ${stage.name}` : "课程蓝图"}</p>
      <h1>${esc(titleShort)}</h1>
      <p class="lesson-meta">
        <span>第 <b>${no}</b> / 20 课</span>
        ${parsed.meta.duration ? `<span>${icon("clock", 14)} 预计用时 <b>${esc(parsed.meta.duration)}</b></span>` : ""}
        <span>前置 <b>${prereqHtml}</b></span>
        <span class="lesson-meta__hint">←/→ 键翻课</span>
        <span class="fs-ctrl" role="group" aria-label="正文字号"><button type="button" data-fs="sm" aria-label="小字号">A-</button><button type="button" data-fs="md" aria-label="标准字号">A</button><button type="button" data-fs="lg" aria-label="大字号">A+</button></span>
      </p>
    </header>

${sectionsHtml}

    <div class="mark-done-row"><button class="mark-done" id="markDone" type="button"><span class="mark-done__label">标记本课完成</span></button></div>

    <nav class="lesson-nav ${stageClass}">
      ${prevHtml}
      ${nextHtml}
      <a class="back-path" href="index.html#stage-${stage ? stage.num : "plan"}">${icon("map", 14)} 回到主路</a>
    </nav>
  </main>

  ${pageFooter()}
  ${pageScript()}
  <script src="../assets/js/share.js" defer></script>
</body>
</html>`;
}

// ============ 课程总览时间线（type-timeline：按月诚实分布 · 可点击） ============
function journeyMap(lessons) {
  const X = m => 60 + m * 60; // 0-12 月 → 60-780
  const base = 96;
  const nodes = STAGES.map((st, i) => {
    const m = [0, 0.25, 2, 4, 6, 9][i];
    const x = X(m);
    const n = lessons.filter(l => l.stage === st.num).length;
    const row = i % 2 === 0 ? 36 : 60; // 上下交错防碰撞
    return `<a href="#stage-${st.num}" class="jm-node">
      <line x1="${x}" y1="${base - 6}" x2="${x}" y2="${row + 12}" class="jm-drop" />
      <circle cx="${x}" cy="${base}" r="4" />
      <text x="${x}" y="${row}" class="jm-name">${st.name}</text>
      <text x="${x}" y="${row + 13}" class="jm-sub">${st.time} · ${n} 课</text>
      <title>阶段 ${st.num} · ${esc(st.name)}：${esc(st.goal)}</title>
    </a>`;
  }).join("\n    ");
  const ticks = [0, 0.25, 2, 4, 6, 9, 12].map(m => `
    <line x1="${X(m)}" y1="${base + 6}" x2="${X(m)}" y2="${base + 12}" class="jm-tick" />
    <text x="${X(m)}" y="${base + 26}" class="jm-date">${m === 0 ? "第 0 周" : m === 12 ? "第 12 月" : "第 " + m + " 月"}</text>`).join("");
  return `<figure class="journey reveal" role="img" aria-labelledby="jmTitle">
  <figcaption class="sr-only" id="jmTitle">课程时间线：五个阶段按月份诚实分布，从第 0 周的引擎自检到第 12 月的结业，点击任意阶段跳转到对应课程列表</figcaption>
  <div class="journey__scroll">
  <svg viewBox="0 0 840 150" xmlns="http://www.w3.org/2000/svg">
    <line x1="52" y1="${base}" x2="788" y2="${base}" class="jm-line" />
    <line x1="780" y1="${base - 5}" x2="788" y2="${base}" class="jm-line" />
    <line x1="780" y1="${base + 5}" x2="788" y2="${base}" class="jm-line" />
    ${nodes}
    <a href="20-三条分支与年度复盘.html" class="jm-node jm-milestone">
      <circle cx="${X(12)}" cy="${base}" r="6" />
      <text x="${X(12)}" y="36" class="jm-name">结业</text>
      <text x="${X(12)}" y="49" class="jm-sub">五条绿波带点亮</text>
      <title>第 12 月：结业自检与年度复盘（第 20 课）</title>
    </a>
    ${ticks}
  </svg>
  </div>
</figure>`;
}

// ============ 首页（成长之路） ============
function indexPageHtml(lessons) {
  const stageSections = STAGES.map(st => {
    const stLessons = lessons.filter(l => l.stage === st.num);
    const lights = ["on-r", "on-y", "on-g"];
    const activeLight = ["on-r", "on-y", "on-g"][Math.min(st.num, 2)] || "on-g";
    const cards = stLessons.map(l => `
          <a class="lesson-card reveal stage-s${st.num}" href="${l.slug}.html">
            <div class="lesson-card__thumb"><img src="${l.thumb}" alt="${esc(l.title)}" loading="lazy" /></div>
            <div class="lesson-card__body">
              <span class="lesson-card__no">第 ${l.no} 课</span>
              <p class="lesson-card__title">${esc(l.title)}</p>
              <p class="lesson-card__tag">${esc(l.tagline)}</p>
              <p class="lesson-card__meta"><span>${icon("clock", 13)} ${esc(l.duration || "2 周")}</span><span class="go">进入 ${icon("arrowRight", 13)}</span></p>
            </div>
          </a>`).join("");
    return `
    <section class="stage stage-s${st.num}" id="stage-${st.num}">
      <div class="stage-node" aria-hidden="true"><i class="${st.num === 0 ? "on-r" : ""}"></i><i class="${st.num === 1 || st.num === 3 ? "on" : ""}"></i><i class="${st.num >= 2 && st.num !== 3 ? "on" : ""}"></i></div>
      <div class="stage-head">
        <div>
          <p class="stage-kicker">STAGE ${st.num} · ${st.time}</p>
          <h2><span class="stage-no">0${st.num}</span>${st.name}</h2>
          <p class="stage-goal">${esc(st.goal)}</p>
        </div>
        <span class="stage-pass">${icon("flag", 13)} 通关：<b>${esc(st.pass)}</b></span>
      </div>
      <div class="lesson-grid">
${cards}
      </div>
    </section>`;
  }).join("\n");

  const planLesson = lessons.find(l => l.no === 0);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>一路绿灯 · 医美咨询师成长站，从小白到上岗的十二个月</title>
  <meta name="description" content="一路绿灯 · 医美咨询师成长站。为交通信号专业毕业的零基础转行者定制的十二个月课程：五个阶段、20 节课，以道路与红绿灯为母题，先看清职业真相，再学交规、认识车流、看懂路口、上路、驶入绿波带。" />
  ${headMeta({ canonicalPath: "consultant/index.html", title: "一路绿灯 · 医美咨询师成长站，从小白到上岗的十二个月", desc: "为交通信号专业毕业的零基础转行者定制的十二个月课程：五个阶段、20 节课，以道路与红绿灯为母题", cardKey: "consultant", siteName: "一路绿灯 · 医美咨询师成长站" })}
  <link rel="icon" type="image/png" href="../assets/logo/amc-logo.png" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/consultant.css" />
  <link rel="stylesheet" href="../assets/css/share.css" />
</head>
<body id="top">
  ${pageHeader("road")}

  <section class="cp-hero">
    <div class="container">
      <span class="tl" aria-hidden="true"><i class="on-r"></i><i class="on-y"></i><i class="on-g"></i></span>
      <p class="eyebrow" style="margin-top:var(--sp-5);">医美咨询师成长站 · MEDICAL AESTHETICS CONSULTANT ROAD</p>
      <h1>一路绿灯</h1>
      <p class="lead">先看清职业真相，再学交规、认识车流、看懂路口、上路实习，最终驶入属于自己的绿波带。五个阶段，二十节课，每一步都有作业、有通关、有奖励自己的灯。</p>
      <div class="stats">
        <span><b>5</b>个阶段</span>
        <span><b>20</b>节课</span>
        <span><b>160+</b>篇配套教材</span>
        <span><b>20</b>张信息图</span>
      </div>
      <div class="cta-row">
        <a class="btn btn--primary" href="01-开课词-给交通信号工程师的转行信.html">从第 01 课开始 ${icon("arrowRight", 15)}</a>
        <a class="btn btn--ghost" href="00-课程设计总纲.html">先看课程蓝图</a>
        <a class="btn btn--ghost" id="gradLink" href="graduation.html" style="display:none">结业卡</a>
      </div>
    </div>
  </section>

  <div class="container">
    ${journeyMap(lessons)}
  </div>

  <main>
    <div class="container">
      <div class="section-head reveal" id="road">
        <p class="eyebrow">THE ROAD</p>
        <h2>成长之路 · 五个阶段</h2>
      </div>
      <div class="road">
${stageSections}
      </div>
    </div>

    <section id="method" style="padding:var(--sp-8) 0;border-top:1px solid var(--hairline);scroll-margin-top:80px;">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">METHOD</p>
          <h2>学习方法三件套</h2>
        </div>
        <div class="method-grid">
          <div class="method-card reveal">
            <div class="mc-icon">${icon("stack", 22)}</div>
            <h3>3-2-1 卡片法</h3>
            <p>每读一篇教材产出一张卡片：3 个知识点、2 个求美者常问答法、1 个绝不能踩的坑。卡片就是错题本和话术库的原料。</p>
          </div>
          <div class="method-card reveal">
            <div class="mc-icon">${icon("mic", 22)}</div>
            <h3>费曼录音</h3>
            <p>每周挑一个主题，对着手机给"想象中的闺蜜"讲 5 分钟。讲不下去的地方，就是没学会的地方。</p>
          </div>
          <div class="method-card reveal">
            <div class="mc-icon">${icon("light", 22)}</div>
            <h3>集灯打卡</h3>
            <p>每完成一个模块亮一盏灯，一个阶段全亮就是一条"绿波带"，给自己一个约定好的奖励。通关制代替打卡焦虑。</p>
          </div>
        </div>
        <div class="rhythm-strip reveal">
          <span>${icon("clock", 15)} <b>每日节奏（在职版）</b></span>
          <span>工作日 1 小时：40 分钟新知识 + 20 分钟卡片整理</span>
          <span>周末 3 小时：作业 + 录音 + 红绿灯复盘</span>
        </div>
      </div>
    </section>

    <section id="plan" style="padding:var(--sp-8) 0;scroll-margin-top:80px;">
      <div class="container">
        <div class="section-head reveal">
          <p class="eyebrow">GUIDE</p>
          <h2>使用指南与课程蓝图</h2>
        </div>
        <div class="guide-grid">
          <div class="guide-card reveal">
            <h3>怎么用这套课程</h3>
            <ol>
              <li><b>顺序学习</b>：课程有严格前置依赖（每课头部标注），不建议跳课</li>
              <li><b>通关制</b>：每课有通关检验，五个阶段各有一条"绿波带"；结业标准见第 20 课自检清单</li>
              <li><b>教材依赖</b>：阶段 2 依托本站六大科普系列（皮肤、注射、手术、亚美学、三型、腹壁），课文内链接直达</li>
              <li><b>产出导向</b>：卡片库、错题本、模拟录像、30 篇作品集，它们同时是学习证据与求职作品</li>
            </ol>
          </div>
          <div class="guide-card reveal">
            <h3>课程蓝图（第 00 课）</h3>
            <p style="font-size:var(--fs-small);color:var(--ink-soft);line-height:var(--lh-relaxed);margin-bottom:var(--sp-4);">
              ${esc(planLesson ? planLesson.tagline : "")}。蓝图全文涵盖教学理念、交通隐喻系统、五阶段课程地图与通关标准。
            </p>
            <a class="btn btn--primary" href="00-课程设计总纲.html">阅读课程蓝图 ${icon("arrowRight", 15)}</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  ${pageFooter()}
  ${pageScript()}
  <script src="../assets/js/share.js" defer></script>
</body>
</html>`;
}

// ============ 主流程 ============
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, "images"), { recursive: true });

// 复制配图
const srcImages = path.join(SRC_DIR, "images");
for (const f of fs.readdirSync(srcImages)) {
  if (f.endsWith(".svg")) fs.copyFileSync(path.join(srcImages, f), path.join(OUT_DIR, "images", f));
}

// 图片 → 课文缩略图映射（每课一张，按篇号前缀匹配）
const thumbByNo = {};
for (const f of fs.readdirSync(path.join(OUT_DIR, "images"))) {
  const m = f.match(/^(\d+)-/);
  if (m && !thumbByNo[m[1]]) thumbByNo[m[1]] = `images/${f}`;
}

// 解析全部课文
const lessons = LESSONS.map(cfg => {
  const mdPath = path.join(SRC_DIR, cfg.slug + ".md");
  const parsed = parseCourseMd(fs.readFileSync(mdPath, "utf8"));
  const no = parseInt(cfg.slug.split("-")[0], 10);
  return {
    ...cfg,
    no,
    title: parsed.h1.replace(/^\d+\s*·\s*/, ""),
    fullTitle: parsed.h1,
    duration: parsed.meta.duration,
    prereq: parsed.meta.prereq,
    thumb: thumbByNo[String(no).padStart(2, "0")] || "",
    parsed,
  };
});

// 写课文页
let written = 0;
for (let i = 0; i < lessons.length; i++) {
  const l = lessons[i];
  const prev = i > 0 ? lessons[i - 1] : null;
  const next = i < lessons.length - 1 ? lessons[i + 1] : null;
  fs.writeFileSync(path.join(OUT_DIR, l.slug + ".html"), lessonPageHtml(l, l.parsed, prev, next), "utf8");
  written++;
}

// 写首页
fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexPageHtml(lessons), "utf8");
written++;

// 写数据 JSON（供门户或检索集成）
const jsonData = {
  generatedAt: new Date().toISOString(),
  name: "一路绿灯 · 医美咨询师成长站",
  stages: STAGES,
  lessons: lessons.map(({ no, slug, title, stage, tagline, duration, prereq, thumb }) =>
    ({ no, slug, title, stage, tagline, duration, prereq, thumb })),
};
fs.writeFileSync(path.join(ROOT, "assets", "data", "consultant.json"), JSON.stringify(jsonData, null, 2), "utf8");
written++;

console.log("=== 医美咨询师成长之路 构建完成 ===");
console.log(`课文页: ${lessons.length} 个, 首页 + JSON: 2 个, 共 ${written} 个文件`);
console.log(`输出目录: ${OUT_DIR}`);
console.log(`配图: ${Object.keys(thumbByNo).length} 张已复制`);
