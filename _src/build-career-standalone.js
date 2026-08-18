/**
 * build-career-standalone.js — 大厂人转行医美 · 独立读者站构建器
 *
 * 用法: node _src/build-career-standalone.js
 * 输入: _src/大厂人转行医美系列/01-16 篇 md（00 设计总纲不进站，独立站只面向读者）
 * 输出: career-site/ 自包含静态站（首页 + 16 篇 + 关于 + 404 + sitemap/robots + 自带资源）
 *
 * 读者化处理：
 *  - 去除面向作者的内部表述（本仓库等），外链到公开站点
 *  - 尾部三段标签改写为读者版（引用来源 / 编者综合 / 待核实）
 *  - 正文中"第 NN 篇"自动互链到对应文章页
 *  - 阅读标记（localStorage）、小节目录、阅读进度、键盘与边缘滑动翻篇
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "_src", "大厂人转行医美系列");
const OUT_DIR = path.join(ROOT, "career-site");

// 独立站域名（部署前用 CAREER_SITE_BASE 覆盖后重跑）
const SITE_BASE = (process.env.CAREER_SITE_BASE || "https://sooogooo.github.io/career-site").replace(/\/$/, "");
const SITE_NAME = "实然指南";
const SITE_SUB = "大厂人转行医美";

const PARTS = [
  { no: 0, name: "开篇", cls: "p0", color: "#8a8578", soft: "#f2f2ef", goal: "先立规矩，这个站只讲实然，不劝进也不劝退" },
  { no: 1, name: "认识医美", cls: "p1", color: "#2f4858", soft: "#edf1f4", goal: "看懂行业的底层结构、钱的流向、权力分布与周期位置" },
  { no: 2, name: "怎么进", cls: "p2", color: "#c9a876", soft: "#f4ede0", goal: "五条入口的实况、可迁移与不可迁移的能力、落地尽调" },
  { no: 3, name: "会经历什么", cls: "p3", color: "#b5654a", soft: "#f8f2f0", goal: "入职 180 天的五次冲击、与医生共事、灰色地带与去留" },
  { no: 4, name: "名校生专题", cls: "p4", color: "#5f6e54", soft: "#edf0ea", goal: "机会逐条标价、代价复利计息、进来后的十二个月" },
  { no: 5, name: "收尾", cls: "p5", color: "#7a8b6f", soft: "#eef0ea", goal: "把十六篇收敛成一页纸决策工具" },
];

const ARTICLES = [
  { slug: "01-开篇-写给正在刷招聘软件的大厂人", part: 0, tagline: "系列立场、实然纪律、素材来源的诚实交代" },
  { slug: "02-医美是个什么生意-医疗的交付消费的获客", part: 1, tagline: "消费的嘴、医疗的手，与三个悖论" },
  { slug: "03-这个行业的钱是怎么分的", part: 1, tagline: "四层利润表，与只看营业额不看利润的怪圈" },
  { slug: "04-谁说了算-医生老板经营院长咨询师", part: 1, tagline: "不可管理的稀缺资源，和四种角色的真实生态位" },
  { slug: "05-乱象是真的机会也是真的", part: 1, tagline: "十四部门整治的另一面，是四十年不成熟的想象力" },
  { slug: "06-五条入口的实况", part: 2, tagline: "平台、机构、上游、医生 IP、咨询师，逐一拆解" },
  { slug: "07-大厂能力清单-可迁移资产与负资产", part: 2, tagline: "带得走的四项资产，和以正确感面目出现的四项负资产" },
  { slug: "08-跨界者的四种死法与三个活法", part: 2, tagline: "四种死法的大厂变体，与三个活法的可行组合" },
  { slug: "09-谈offer之前-薪酬组织与试用期", part: 2, tagline: "薪酬结构、五查尽调清单、病态 KPI 的五个信号" },
  { slug: "10-入职180天的五次冲击", part: 3, tagline: "数据、会议、身份、指标、价值观，一张有日期的时间线" },
  { slug: "11-和医生共事是一门手艺", part: 3, tagline: "医生行为逻辑的六个来源，与合作方法的五条守则" },
  { slug: "12-指标与良心的日常拉扯", part: 3, tagline: "五类灰色决定的四栏对照，与个人的三道防线" },
  { slug: "13-谁留下了谁离开了", part: 3, tagline: "五个人物原型，离开的四种触发与留下的三种特征" },
  { slug: "14-名校生进医美-被高估的机会与被低估的代价", part: 4, tagline: "机会四条逐条标价，代价四条全部复利计息" },
  { slug: "15-名校生进来之后怎么做", part: 4, tagline: "十二个月动作序列，学语言、选杠杆、定站位、硬复盘" },
  { slug: "16-去或不去-一页纸决策清单", part: 5, tagline: "事实、个人、条件三区清单，读完自己给答案" },
];

// 读者化文本替换（面向作者的表达 → 面向读者）
const CONSULTANT_URL = "https://sooogooo.github.io/wechat-medical-aesthetics/consultant/";
const PORTAL_URL = "https://sooogooo.github.io/wechat-medical-aesthetics/";
const READER_TRANSFORMS = [
  ["把本仓库那类科普系列当教材读", "把公开的医美科普系列当教材读"],
  ["区间表达法源自本仓库《医美咨询师成长教程》的期望管理设计", "区间表达法源自[《医美咨询师成长教程》](" + CONSULTANT_URL + ")的期望管理设计"],
  ["本仓库的《医美咨询师成长教程》（20 课，为转行者设计的十二个月成长路径）就是现成的自学教材", "[《医美咨询师成长教程》](" + CONSULTANT_URL + ")（20 课，为转行者设计的十二个月成长路径）就是现成的自学教材"],
  ["本仓库的六大科普系列约 160 篇", "[公开的六大医美科普系列](" + PORTAL_URL + ")约 160 篇"],
  ["以及《医美咨询师成长教程》阶段 2 为零基础者排好的精读地图", "以及[《医美咨询师成长教程》](" + CONSULTANT_URL + ")阶段 2 为零基础者排好的精读地图"],
  ["本地语料库 2026-07-10 版", "公众号文章合集，2026 年 7 月存档版"],
];

// 尾部来源块标签的读者版
const LABEL_MAP = { "本篇事实底座": "引用来源", "跨文归纳": "编者综合", "需另行核验": "待核实" };

// 每篇的信息图（figs/NN.svg 主图，figs/NNb.svg 副图，由 gen-career-figs.js 生成）。
// after 为小节标题片段，插图插在该小节之后；null 表示插在篇首导语后。
const FIGURES = {
  "01-开篇-写给正在刷招聘软件的大厂人": [{ after: null, file: "01", alt: "三块拼图拼不出一个行业" }],
  "02-医美是个什么生意-医疗的交付消费的获客": [
    { after: "一、先看三条", file: "02", alt: "消费的嘴与医疗的手结构图" },
    { after: "翻译器", file: "02b", alt: "翻译器，流量思维在医美的失真处" },
  ],
  "03-这个行业的钱是怎么分的": [{ after: "二、四层利润表", file: "03", alt: "四层利润实况条形示意" }],
  "04-谁说了算-医生老板经营院长咨询师": [{ after: "一、先背一句话", file: "04", alt: "以医生为锚的权力同心圆" }],
  "05-乱象是真的机会也是真的": [
    { after: "一、2025 年的乱象清单", file: "05", alt: "2018 至 2025 行业周期时间线" },
    { after: "翻译器", file: "05b", alt: "翻译器，行业早期等于红利窗口的失真处" },
  ],
  "06-五条入口的实况": [{ after: null, file: "06", alt: "五条入口按进行业深度排布" }],
  "07-大厂能力清单-可迁移资产与负资产": [{ after: null, file: "07", alt: "资产与负资产天平" }],
  "08-跨界者的四种死法与三个活法": [{ after: null, file: "08", alt: "四种死法与三个活法对照" }],
  "09-谈offer之前-薪酬组织与试用期": [
    { after: "三、尽调清单", file: "09", alt: "尽调五查流程" },
    { after: "翻译器", file: "09b", alt: "翻译器，总包期权与底薪提成的结构差异" },
  ],
  "10-入职180天的五次冲击": [{ after: null, file: "10", alt: "180 天五次冲击时间线" }],
  "11-和医生共事是一门手艺": [{ after: "一、他们不是难搞", file: "11", alt: "医生行为逻辑六格画像" }],
  "12-指标与良心的日常拉扯": [
    { after: "二、张力的两端", file: "12", alt: "销售导向与医疗导向之间的灰色光谱" },
    { after: "翻译器", file: "12b", alt: "翻译器，伦理审查在这里是一个人当下的决定" },
  ],
  "13-谁留下了谁离开了": [{ after: "三、模式归纳", file: "13", alt: "转行去留流向图" }],
  "14-名校生进医美-被高估的机会与被低估的代价": [{ after: null, file: "14", alt: "机会四条与代价四条对照" }],
  "15-名校生进来之后怎么做": [
    { after: null, file: "15", alt: "十二个月四动作时间轴" },
    { after: "翻译器", file: "15b", alt: "翻译器，这里没有培养体系" },
  ],
  "16-去或不去-一页纸决策清单": [{ after: null, file: "16", alt: "三区决策流程" }],
};

function figureHtml(fig) {
  return `\n      <figure class="fig"><img src="assets/figs/${fig.file}.svg" alt="${esc(fig.alt)}" loading="lazy" /><figcaption>${esc(fig.alt)}</figcaption></figure>`;
}

// ============ 预读标题 ============
const TITLE_MAP = {};
for (const a of ARTICLES) {
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
    const href = url.replace(/&amp;/g, "&");
    const ext = /^https?:/.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  // "第 NN 篇" 自动互链
  t = t.replace(/第\s?(\d{2})\s?篇/g, (m0, n) => {
    const i = parseInt(n, 10) - 1;
    return (i >= 0 && i < ARTICLES.length) ? `<a class="xref" href="${ARTICLES[i].slug}.html">${m0}</a>` : m0;
  });
  // 决策清单的勾选符号 → 可交互元素（仅第 16 篇正文含 ☐）
  t = t.replace(/☐/g, '<span class="ck" role="checkbox" tabindex="0" aria-label="勾选此项">☐</span>');
  return t;
}

// ============ md 解析（与系列一致的骨架） ============
const SOURCE_KEYS = Object.keys(LABEL_MAP);
function parseArticleMd(text) {
  let src = text;
  for (const [from, to] of READER_TRANSFORMS) src = src.split(from).join(to);

  const lines = src.split(/\r?\n/);
  let h1 = "";
  const meta = { partLabel: "", position: "" };
  const sections = [];
  const sourceLines = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("# ") && !h1) { h1 = line.slice(2).trim(); continue; }
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

  for (const sec of sections) {
    sec.lines = sec.lines.filter((l) => {
      const key = SOURCE_KEYS.find((lb) => l.startsWith(`**${lb}**`) || l.startsWith(lb));
      if (key) { sourceLines.push(l); return false; }
      return true;
    });
  }
  return { h1, meta, sections: sections.filter((s) => s.lines.some((l) => l.trim() !== "")), sourceLines };
}

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

// ============ 页面骨架 ============
function head({ title, desc, path, card = "assets/img/og-card.png" }) {
  return `<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png" />
  <link rel="stylesheet" href="assets/css/style.css" />
  <link rel="canonical" href="${SITE_BASE}/${path}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${SITE_BASE}/${card}" />
  <meta property="og:site_name" content="${SITE_NAME} · ${SITE_SUB}" />
  <meta name="twitter:card" content="summary_large_image" />`;
}

function pageHeader(active) {
  const cls = (k) => active === k ? ' class="is-active"' : "";
  return `<header class="site-header" id="siteHeader">
  <div class="wrap">
    <a href="index.html" class="brand" aria-label="${SITE_NAME} 首页">
      <img class="brand-mark" src="assets/img/logo-mark.svg" alt="${SITE_NAME} 标志" />
      <span class="brand-text"><b>${SITE_NAME}</b><span>${SITE_SUB}</span></span>
    </a>
    <nav class="main-nav" id="mainNav" aria-label="主导航">
      <a href="index.html#parts"${cls("parts")}>目录</a>
      <a href="about.html"${cls("about")}>关于</a>
      <a href="16-去或不去-一页纸决策清单.html" class="nav-cta">决策清单</a>
    </nav>
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-label="打开菜单"><span></span></button>
  </div>
</header>`;
}

function pageFooter() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <p class="footer-name"><b>${SITE_NAME}</b> · ${SITE_SUB}</p>
        <p class="footer-desc">十六篇实然指南。行业引用均标注来源与日期，观点归属原作者。</p>
      </div>
      <nav aria-label="页脚导航">
        <a href="index.html#parts">全部目录</a>
        <a href="01-开篇-写给正在刷招聘软件的大厂人.html">从第 01 篇开始</a>
        <a href="16-去或不去-一页纸决策清单.html">一页纸决策清单</a>
        <a href="about.html">关于与声明</a>
      </nav>
    </div>
    <p class="footer-bottom">职业叙事与决策参考，不构成医疗建议，不构成投资建议 · © 2026 ${SITE_NAME} · <a href="about.html#statement">完整声明</a></p>
  </div>
</footer>`;
}

function pageScript() {
  return `<script>
  (function(){
    var h=document.getElementById('siteHeader');
    if(h)addEventListener('scroll',function(){h.classList.toggle('is-scrolled',scrollY>4)},{passive:true});
    var t=document.getElementById('navToggle'),n=document.getElementById('mainNav');
    if(t)t.addEventListener('click',function(){var o=n.classList.toggle('is-open');t.setAttribute('aria-expanded',o)});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:0.08});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

    var bar=document.getElementById('progress');
    if(bar){var upd=function(){var max=document.body.scrollHeight-innerHeight;bar.style.transform='scaleX('+(max>0?(scrollY/max):0)+')'};addEventListener('scroll',upd,{passive:true});upd();}

    // 小节目录（宽屏）
    var secs=document.querySelectorAll('article section');
    if(secs.length>2&&matchMedia('(min-width:1080px)').matches){
      var toc=document.createElement('nav');toc.className='mini-toc';toc.setAttribute('aria-label','本页小节');
      secs.forEach(function(sec,i){var h2=sec.querySelector('h2');if(!h2)return;sec.id='sec-'+i;
        var a=document.createElement('a');a.href='#sec-'+i;a.textContent=h2.textContent;toc.appendChild(a)});
      document.body.appendChild(toc);
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.querySelectorAll('a').forEach(function(a){a.classList.toggle('is-on',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-40% 0px -55% 0px'});
      secs.forEach(function(sec){io2.observe(sec)});
    }

    // 阅读标记
    var KEY='shiran-read';
    var read={};try{read=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
    var page=decodeURIComponent(location.pathname.split('/').pop())||'index.html';
    var mk=document.getElementById('markRead');
    function sync(){if(mk){var d=!!read[page];mk.classList.toggle('is-done',d);mk.querySelector('span').textContent=d?'已读，点击取消':'标记为已读'}}
    if(mk)mk.addEventListener('click',function(){if(read[page])delete read[page];else read[page]=1;try{localStorage.setItem(KEY,JSON.stringify(read))}catch(e){}sync()});
    sync();
    document.querySelectorAll('[data-read]').forEach(function(el){
      var f=el.getAttribute('data-read');
      if(read[f])el.classList.add('is-read');
    });

    // 决策清单勾选（第 16 篇）
    var cks=document.querySelectorAll('.ck');
    if(cks.length){
      var PK2='shiran-check';
      var st2={};try{st2=JSON.parse(localStorage.getItem(PK2)||'{}')}catch(e){}
      function syncCk(){
        var n=0;
        cks.forEach(function(el,i){
          var k=page+'#'+i,on=!!st2[k];
          el.textContent=on?'☑':'☐';el.classList.toggle('on',on);el.setAttribute('aria-checked',on);
          if(on)n++;
        });
        var chip=document.getElementById('ckProgress');
        if(chip)chip.textContent='已核 '+n+' / '+cks.length;
      }
      cks.forEach(function(el,i){
        function tg(){
          var k=page+'#'+i;
          if(st2[k])delete st2[k];else st2[k]=1;
          try{localStorage.setItem(PK2,JSON.stringify(st2))}catch(e){}
          syncCk();
        }
        el.addEventListener('click',tg);
        el.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();tg();}});
      });
      if(mk){
        var chip=document.createElement('span');
        chip.className='ck-progress';chip.id='ckProgress';
        mk.parentNode.appendChild(chip);
      }
      syncCk();
    }

    // 键盘与边缘滑动翻篇
    var pv=document.body.getAttribute('data-prev'),nx=document.body.getAttribute('data-next');
    if(pv||nx)addEventListener('keydown',function(e){
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.key==='ArrowRight'&&nx)location.href=nx;
      if(e.key==='ArrowLeft'&&pv)location.href=pv;
    });
    var tx0=0,ty0=0;
    addEventListener('touchstart',function(e){if(e.touches.length!==1)return;tx0=e.touches[0].clientX;ty0=e.touches[0].clientY},{passive:true});
    addEventListener('touchend',function(e){
      if(!pv&&!nx)return;
      var dx=e.changedTouches[0].clientX-tx0,dy=e.changedTouches[0].clientY-ty0;
      if(Math.abs(dx)<64||Math.abs(dy)>44)return;
      var w=innerWidth;
      if(tx0<36&&dx>0&&pv)location.href=pv;
      if(tx0>w-36&&dx<0&&nx)location.href=nx;
    },{passive:true});
  })();
  </script>`;
}

// ============ 文章页 ============
function articlePage(a, idx) {
  const md = fs.readFileSync(path.join(SRC_DIR, `${a.slug}.md`), "utf8");
  const { meta, sections, sourceLines } = parseArticleMd(md);
  const part = PARTS[a.part];
  const title = TITLE_MAP[a.slug];
  const prev = idx > 0 ? ARTICLES[idx - 1] : null;
  const next = idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : null;
  const no = String(idx + 1).padStart(2, "0");
  const desc = (meta.position || a.tagline).replace(/[*｜|]/g, " ").slice(0, 110);

  const figs = FIGURES[a.slug] || [];
  const sectionHtml = sections.map((sec) => {
    const isTranslator = sec.title.includes("翻译器");
    let html = `
    <section class="block ${part.cls}${isTranslator ? " translator" : ""}">
      <h2>${inline(sec.title)}</h2>
      <div class="prose">${renderBlocks(sec.lines)}</div>
    </section>`;
    // 信息图注入：小节标题匹配时，在该小节后插入对应插图
    for (const fig of figs) {
      if (fig.after && sec.title.includes(fig.after)) html += figureHtml(fig);
    }
    return html;
  }).join("\n");
  // 未指定小节的插图，插在篇首导语后
  const heroFigs = figs.filter((f) => !f.after).map(figureHtml).join("");

  const sourcesHtml = sourceLines.length ? `
    <aside class="sources ${part.cls}">
      <h2>本篇引用与待核实</h2>
      <div>${sourceLines.map((l) => {
        let line = l;
        for (const [k, v] of Object.entries(LABEL_MAP)) line = line.replace(`**${k}**`, `**${v}**`).replace(`**${k}：`, `**${v}：`);
        return `<p>${inline(line)}</p>`;
      }).join("\n")}</div>
    </aside>` : "";

  return `<!doctype html>
<html lang="zh-CN">
<head>
${head({ title: `${title} · ${SITE_NAME}`, desc, path: `${a.slug}.html` })}
</head>
<body class="article ${part.cls}" data-prev="${prev ? prev.slug + ".html" : ""}" data-next="${next ? next.slug + ".html" : ""}">
  <div class="progress" id="progress" aria-hidden="true"></div>
${pageHeader()}
  <main class="wrap">
    <article>
      <header class="article-hero ${part.cls}">
        <p class="part-chip"><span class="chip-no">${part.no === 0 ? "开" : part.no}</span>${part.name}</p>
        <h1>${esc(title)}</h1>
        <p class="lead">${esc(meta.position || a.tagline)}</p>
        <p class="meta">第 ${no} 篇 · 共 ${ARTICLES.length} 篇</p>
        <button class="mark-read" id="markRead" type="button"><span>标记为已读</span></button>
      </header>
${heroFigs}
${sectionHtml}
${sourcesHtml}
      <nav class="pager ${part.cls}">
        ${prev ? `<a class="prev" href="${prev.slug}.html"><span class="pager-label">← 上一篇</span><span class="pager-title">${esc(TITLE_MAP[prev.slug])}</span></a>` : `<a class="prev" href="index.html"><span class="pager-label">← 目录</span><span class="pager-title">回到全部篇目</span></a>`}
        ${next ? `<a class="next" href="${next.slug}.html"><span class="pager-label">下一篇 →</span><span class="pager-title">${esc(TITLE_MAP[next.slug])}</span></a>` : `<a class="next" href="about.html"><span class="pager-label">读完了 →</span><span class="pager-title">关于本站与声明</span></a>`}
      </nav>
      <p class="pager-hint">键盘 ← → 可翻篇，手机屏幕左右边缘滑动同样有效</p>
    </article>
  </main>
${pageFooter()}
${pageScript()}
</body>
</html>
`;
}

// ============ 首页 ============
function indexPage() {
  const partsHtml = PARTS.map((p) => {
    const arts = ARTICLES.filter((a) => a.part === p.no);
    const cards = arts.map((a) => {
      const idx = ARTICLES.indexOf(a);
      const no = String(idx + 1).padStart(2, "0");
      return `<a class="card reveal ${p.cls}" href="${a.slug}.html" data-read="${a.slug}.html">
        <span class="card-no">${no}</span>
        <span class="card-body">
          <span class="card-title">${esc(TITLE_MAP[a.slug])}</span>
          <span class="card-tag">${esc(a.tagline)}</span>
        </span>
        <span class="card-read-badge">已读</span>
      </a>`;
    }).join("\n          ");
    return `
      <section class="part ${p.cls}" id="part-${p.no}">
        <div class="part-head ${p.cls}">
          <span class="part-no">${p.no === 0 ? "开" : p.no}</span>
          <div class="part-info">
            <h2>${esc(p.name)}</h2>
            <p>${esc(p.goal)}</p>
          </div>
        </div>
        <div class="card-grid">
          ${cards}
        </div>
      </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
${head({ title: `${SITE_NAME} · ${SITE_SUB}`, desc: "写给正在考虑转行医美的大厂人与名校毕业生。十六篇实然指南，从行业结构、钱的流向、权力分布，到五条入口、入职 180 天与一页纸决策。不劝进，不劝退。", path: "index.html" })}
</head>
<body class="home">
${pageHeader()}
  <main>
    <section class="hero">
      <div class="wrap">
        <p class="eyebrow">${SITE_SUB} · 独立读本</p>
        <h1>${SITE_NAME}</h1>
        <p class="hero-lead">如果你正在大厂里刷招聘软件，停下来看一条医美岗位，又说不清这个行业到底是什么——这里有一份从事实出发的地图。十六篇，讲清行业的钱怎么分、谁说了算、怎么进、进来会经历什么。</p>
        <p class="hero-sub">不劝进，不劝退，只把实况摆全。所有行业判断都标注来源与日期。</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="${ARTICLES[0].slug}.html">从第 01 篇开始</a>
          <a class="btn btn-ghost" href="16-去或不去-一页纸决策清单.html">直达决策清单</a>
          <a class="btn btn-ghost" href="about.html">关于本站</a>
        </div>
        <div class="hero-stats">
          <span><b>16</b>篇正文</span>
          <span><b>17</b>张信息图</span>
          <span><b>15</b>篇来源文章</span>
          <span><b>73</b>处带日期引用</span>
        </div>
      </div>
    </section>

    <section class="journey-wrap wrap reveal">
      <h2 class="journey-title">十六篇地图</h2>
      <p class="journey-desc">从开篇到决策清单的一条路，点击任意站点直达。</p>
      <div class="journey-scroll">
${fs.readFileSync(path.join(OUT_DIR, "assets", "figs", "journey.svg"), "utf8")}
      </div>
    </section>

    <div class="wrap" id="parts">
${partsHtml}
    </div>
  </main>
${pageFooter()}
${pageScript()}
</body>
</html>
`;
}

// ============ 关于与声明 ============
function aboutPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
${head({ title: `关于本站 · ${SITE_NAME}`, desc: "实然指南是什么、写给谁、怎么读，来源与引用纪律，以及完整声明。", path: "about.html" })}
</head>
<body class="page">
${pageHeader("about")}
  <main class="wrap">
    <article>
      <header class="article-hero p1">
        <img class="about-logo" src="assets/img/logo.svg" alt="实然指南 logo，方印之实加缺口圆环与金点" />
        <p class="part-chip"><span class="chip-no">关</span>关于</p>
        <h1>关于实然指南</h1>
        <p class="lead">一份写给转行决策者的行业读本，只讲实然，不讲应然。</p>
      </header>

      <section class="block p1">
        <h2>这是什么</h2>
        <div class="prose">
          <p>《实然指南》是一套完整的大厂人转行医美读本，共十六篇，面向正在考虑转行医美的互联网从业者与名校毕业生。</p>
          <p>市面上关于医美转行的内容，多半在两个极端之间摇摆。一边是招聘软文，只讲机会不讲代价；一边是猎奇稿，只讲乱象不讲结构。本站尝试第三种写法——把行业的实际状况原样摆出来，钱在谁账上、权力在谁手里、进来的人每一天会遇到什么，然后让读者自己做决定。</p>
          <p>四个部分回答四个问题。认识医美（第 02 至 05 篇）讲这是什么行业；怎么进（第 06 至 09 篇）讲路径与落地；会经历什么（第 10 至 13 篇）讲入职后的真实日常；名校生专题（第 14 至 15 篇）讲高学历背景的机会与代价。第 16 篇是一页纸决策清单，全站的收口。</p>
          <p>时间紧的读者有三篇的最小读法——第 02 篇看懂行业结构，第 08 篇看懂跨界规律，第 16 篇拿走决策工具。</p>
        </div>
      </section>

      <section class="block p1">
        <h2>编辑原则</h2>
        <div class="prose">
          <p>全站只做实然写作。每个核心判断都挂在可查证的事实上，来源与日期随文标注；涉及建议的地方只用条件判断的句式——如果你要的是这个，在现状下你大概率会遇到那个；行业丑处和好处都写在明处；没有可靠出处的内容明确标注待核实，不用想象补齐。</p>
          <p>每篇文末的"本篇引用与待核实"分三类。引用来源是转述行业文章的直接观点，观点归属原作者；编者综合是跨篇归纳的判断；待核实是截至发布仍无法确认的信息，读者引用前请自行查证。</p>
        </div>
        <figure class="fig"><img src="assets/figs/labels.svg" alt="三级标注说明图：引用来源、编者综合、待核实" loading="lazy" /><figcaption>三级标注，全站通用的信息分级</figcaption></figure>
      </section>

      <section class="block p1">
        <h2>来源</h2>
        <div class="prose">
          <p>本站行业事实的主要来源，是消费医疗行业从业者李滨的"医美之滨"公众号文章（2018 至 2026 年），以及行业公开信息。原作者立场属于行业"回归医疗"一派，本站在多篇正文中同时呈现了另一派（销售导向）的实况，不替读者选边。</p>
          <p>姊妹读本《医美咨询师成长教程》（一路绿灯成长站）面向零背景入行者，与本站互相独立、互为补充。</p>
        </div>
      </section>

      <section class="block p1" id="statement">
        <h2>声明</h2>
        <div class="prose">
          <p>本站全部内容为职业叙事与决策参考，不构成医疗建议，不构成投资建议，不用于诊断、治疗或任何项目的推荐。</p>
          <p>第 13 篇的人物为依据行业结构事实与公开自述构建的人物原型，用于呈现转行结果的模式分布，不指向真实个体。</p>
          <p>行业数据与监管政策随时间变化，文中一切涉及当前行情与法规的内容以最新权威原文为准。本站内容按语料引用日期如实呈现，读者使用前请自行核对时效。</p>
          <p>© 2026 实然指南。转载请注明出处并保留来源标注。</p>
        </div>
      </section>

      <nav class="pager p1">
        <a class="prev" href="16-去或不去-一页纸决策清单.html"><span class="pager-label">← 回到</span><span class="pager-title">一页纸决策清单</span></a>
        <a class="next" href="01-开篇-写给正在刷招聘软件的大厂人.html"><span class="pager-label">开始阅读 →</span><span class="pager-title">开篇 · 写给正在刷招聘软件的大厂人</span></a>
      </nav>
    </article>
  </main>
${pageFooter()}
${pageScript()}
</body>
</html>
`;
}

// ============ 404 ============
function notFoundPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>页面不存在 · ${SITE_NAME}</title>
<meta name="robots" content="noindex" />
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body class="page">
${pageHeader()}
  <main class="wrap nf">
    <p class="nf-code">404</p>
    <h1>这一页不在地图上</h1>
    <p>页面不存在或已被移动。你可以回到目录，或直接去拿那份决策清单。</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="index.html">回到目录</a>
      <a class="btn btn-ghost" href="16-去或不去-一页纸决策清单.html">决策清单</a>
    </div>
  </main>
${pageFooter()}
</body>
</html>
`;
}

// ============ 主流程 ============
fs.mkdirSync(path.join(OUT_DIR, "assets", "css"), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, "assets", "img"), { recursive: true });

for (let i = 0; i < ARTICLES.length; i++) {
  fs.writeFileSync(path.join(OUT_DIR, `${ARTICLES[i].slug}.html`), articlePage(ARTICLES[i], i));
}
fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexPage());
fs.writeFileSync(path.join(OUT_DIR, "about.html"), aboutPage());
fs.writeFileSync(path.join(OUT_DIR, "404.html"), notFoundPage());

// favicon（站点根目录）
fs.writeFileSync(path.join(OUT_DIR, "favicon.svg"),
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2f4858"/><text x="32" y="42" font-family="serif" font-size="30" fill="#faf8f4" text-anchor="middle">实</text></svg>`);

// 样式（单一来源：_src/career-site-style.css）
fs.copyFileSync(path.join(__dirname, "career-site-style.css"), path.join(OUT_DIR, "assets", "css", "style.css"));

// og 卡复用主站的 career 分享卡
fs.copyFileSync(path.join(ROOT, "assets", "img", "share", "career-card.png"), path.join(OUT_DIR, "assets", "img", "og-card.png"));

// sitemap + robots
const urls = ["index.html", "about.html", ...ARTICLES.map((a) => `${a.slug}.html`)];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_BASE}/${encodeURIComponent(u)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(OUT_DIR, "robots.txt"),
`User-agent: *
Allow: /

Sitemap: ${SITE_BASE}/sitemap.xml
`);

console.log("=== 实然指南 · 独立站构建完成 ===");
console.log(`文章页: ${ARTICLES.length}, 首页 + 关于 + 404: 3, 共 ${ARTICLES.length + 3} 个页面`);
console.log(`输出目录: ${OUT_DIR}`);
console.log(`SITE_BASE = ${SITE_BASE}（部署前可用 CAREER_SITE_BASE 环境变量覆盖后重跑）`);
