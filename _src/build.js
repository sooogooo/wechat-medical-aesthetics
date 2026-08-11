/* =========================================================================
   文章生成器：把 55 篇 Markdown 源文转成结构化详情页 HTML
   - 应用标点规范（GB/T 15834 + 数字单位半角空格）
   - 抽取急救 callout（仅 urgent 病种）
   - 正文 H2/H3/列表/blockquote 转换
   - 相关阅读互链
   ========================================================================= */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "皮肤常见病症科普系列");
const OUT_DIR = path.join(__dirname, "..", "condition");
const DATA = require(path.join(__dirname, "..", "assets", "data", "conditions.json"));

const CAT_LABELS = {
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

// 急救 callout 内容映射（仅 urgent 病种）
const URGENT_CALLOUTS = {
  3: { title: "出现这些情况，立即拨打 120 或前往急诊", text: "风团同时出现 <em>舌头或喉咙肿、声音嘶哑、喘憋、吞咽困难、头晕要晕倒、心跳很快</em>，可能是严重过敏反应，应立即呼叫急救，不要只吃抗过敏药等。曾配肾上腺素自动注射器者，按既定急救计划使用。" },
  34: { title: "尽早就医，别等毛囊永久破坏", text: "头皮出现 <em>红、痛、灼热、脓疱、结痂或毛囊口消失</em>，应尽早皮肤科评估。瘢痕性脱发一旦毛囊被破坏，脱发往往是永久的——拖越久，可挽回的毛囊越少。" },
  46: { title: "规范治疗能降低并发风险", text: "硬化性苔藓若长期不规范管理，可能出现 <em>结构变形、排尿困难、性交痛</em>，并有癌变监测需求。出现裂口、出血、新发结节时，应及时复诊评估。" },
  50: { title: "出现这些情况，立即急诊", text: "注射后立即或短时间出现 <em>剧烈疼痛、皮肤发白、网状青紫、冰凉</em>，或 <em>视力模糊、眼痛、头痛、肢体神经症状</em>，要警惕血管栓塞，必须立即联系有救治能力的医疗团队或急诊，不要等待“正常消肿”。" },
  54: { title: "先确认病毒已停，再处理色沉", text: "若仍有 <em>新发水疱、疼痛加剧或继发感染</em>，应先处理活动期带状疱疹和神经痛。色沉的淡化要等炎症和病毒控制之后再开始，否则二次刺激可能让色差更持久。" }
};

// 相关阅读映射（id → [ids]）
const RELATED = {
  0: [5, 42, 1],
  1: [49, 2, 0],
  2: [38, 1, 49],
  3: [47, 18, 16],
  4: [7, 6, 41],
  5: [0, 42, 9],
  6: [4, 9, 8],
  7: [4, 8, 10],
  8: [7, 4, 6],
  9: [6, 4, 26],
  10: [11, 7, 14],
  11: [10, 14, 7],
  12: [13, 14, 8],
  13: [12, 8, 4],
  14: [10, 12, 11],
  15: [9, 16, 42],
  16: [17, 39, 2],
  17: [16, 18, 40],
  18: [17, 45, 16],
  19: [0, 23, 21],
  20: [21, 22, 23],
  21: [20, 22, 31],
  22: [21, 23, 20],
  23: [22, 44, 21],
  24: [25, 26, 49],
  25: [24, 26, 27],
  26: [27, 9, 25],
  27: [26, 24, 40],
  28: [29, 30, 49],
  29: [28, 30, 0],
  30: [31, 29, 28],
  31: [52, 51, 21],
  32: [33, 35, 34],
  33: [34, 32, 35],
  34: [33, 32, 35],
  35: [32, 33, 34],
  36: [21, 23, 19],
  37: [50, 42, 7],
  38: [2, 1, 0],
  39: [40, 38, 16],
  40: [39, 38, 16],
  41: [4, 6, 9],
  42: [0, 5, 43],
  43: [42, 50, 5],
  44: [23, 5, 41],
  45: [18, 17, 16],
  46: [45, 44, 16],
  47: [3, 18, 5],
  48: [49, 1, 41],
  49: [1, 48, 24],
  50: [37, 43, 42],
  51: [52, 31, 36],
  52: [51, 31, 21],
  53: [54, 38, 40],
  54: [5, 53, 41]
};

// —— 标点规范化 ——
function normalizePunctuation(text) {
  let t = text;
  // 英文标点 → 中文全角（仅中文语境下的常见错误，不动 URL/英文术语）
  // 不做全局暴力替换，避免破坏 URL；这里主要处理正文里的省略号和连字符
  // 三点省略号 → 中文六点
  t = t.replace(/\.\.\./g, "……");
  // 数字与中文单位之间的半角空格规范化（已有空格的不动，无空格的补）
  // 仅在数字与常见中文单位/字符之间补半角空格
  t = t.replace(/(\d)(小时|天|周|个月|月|年|次|颗|块|片|粒|篇|岁|人|名|位|种|类|次|期|型|度|成|倍|档|圈|簇|层|处|个|套|阶段|周期|疗程|次\/)/g, "$1 $2");
  // 数字+%/mg/ml/cm/mm 等西文单位前不加空格（百分号惯例），此处保留原样
  return t;
}

// —— 标题去冒号（H1 / H3）——
// 按用户要求：标题里尽量不用冒号，逐句酌情改写。
// 常见模式「主题：解释」→「主题 解释」（用空格分隔，最简洁，适合症状钩子式标题）
// 其它位置的冒号 → 逗号
function removeColon(title) {
  let t = title;
  // 仅处理第一个全角冒号（标题里通常只有一个）：前半 + 空格 + 后半
  if (t.includes("：")) {
    const idx = t.indexOf("：");
    t = t.slice(0, idx) + " " + t.slice(idx + 1);
  }
  // 半角冒号同理（少见）
  if (t.includes(":")) {
    const idx = t.indexOf(":");
    t = t.slice(0, idx) + " " + t.slice(idx + 1);
  }
  return t;
}

// —— 解析一篇 Markdown，返回结构化内容 ——
function parseMd(md) {
  const lines = md.split(/\r?\n/);
  const result = {
    h1: "",
    alts: [],
    cover: "",
    bodyHtml: "",
    references: [],
    disclaimer: ""
  };

  let i = 0;
  // H1
  while (i < lines.length && !lines[i].startsWith("# ")) i++;
  result.h1 = removeColon((lines[i] || "").replace(/^# /, "").trim());

  // 备选标题
  let altsIdx = lines.findIndex(l => l.trim() === "## 三个备选标题");
  if (altsIdx > -1) {
    for (let j = altsIdx + 1; j < lines.length; j++) {
      if (lines[j].startsWith("## ")) break;
      const m = lines[j].match(/^\d+\.\s*(.+)/);
      if (m) result.alts.push(m[1].trim());
    }
  }

  // 封面介绍
  let coverIdx = lines.findIndex(l => l.includes("## 封面介绍"));
  if (coverIdx > -1) {
    for (let j = coverIdx + 1; j < lines.length; j++) {
      if (lines[j].startsWith("## ")) break;
      const s = lines[j].trim();
      if (s && !s.startsWith("（")) result.cover += s;
    }
    result.cover = result.cover.trim();
  }

  // 正文：从 ## 正文 到 第一个 > 引用
  let bodyStart = lines.findIndex(l => l.trim() === "## 正文");
  let bodyEnd = lines.length;
  if (bodyStart > -1) {
    for (let j = bodyStart + 1; j < lines.length; j++) {
      if (/^>\s/.test(lines[j])) { bodyEnd = j; break; }
    }
    const bodyLines = lines.slice(bodyStart + 1, bodyEnd);
    result.bodyHtml = bodyToHtml(bodyLines);
  }

  // 引用（免责声明）
  for (let j = 0; j < lines.length; j++) {
    if (/^>\s/.test(lines[j])) {
      result.disclaimer = lines[j].replace(/^>\s/, "").trim();
      break;
    }
  }

  // 参考资料
  let refIdx = lines.findIndex(l => l.includes("## 参考资料"));
  if (refIdx > -1) {
    let cur = null;
    for (let j = refIdx + 1; j < lines.length; j++) {
      const s = lines[j].trim();
      if (!s) continue;
      const urlMatch = s.match(/(https?:\/\/\S+)/);
      if (urlMatch) {
        if (cur) { cur.url = urlMatch[1]; result.references.push(cur); cur = null; }
      } else if (s.startsWith("- ")) {
        cur = { text: s.replace(/^-\s*/, "").trim(), url: "" };
      }
    }
    if (cur) result.references.push(cur);
  }

  return result;
}

// —— 正文 Markdown → HTML（轻量转换，不依赖外部库）——
function bodyToHtml(bodyLines) {
  const blocks = [];
  let para = [];
  let list = [];
  let listType = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push("<p>" + inline(para.join(" ")) + "</p>");
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const tag = listType === "ol" ? "ol" : "ul";
      blocks.push("<" + tag + ">" + list.map(li => "<li>" + inline(li) + "</li>").join("") + "</" + tag + ">");
      list = [];
      listType = null;
    }
  };

  for (const raw of bodyLines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) { flushPara(); flushList(); continue; }

    // H3 (###)
    if (t.startsWith("### ")) {
      flushPara(); flushList();
      const h3text = removeColon(t.slice(4));
      blocks.push('<h3 id="' + slugify(h3text) + '">' + esc(h3text) + "</h3>");
      continue;
    }
    // 加粗行作为小节标题(无 # 但独立成行且整行加粗)→ 不做，按段处理
    // 列表
    if (/^[-*]\s+/.test(t)) {
      flushPara();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      list.push(t.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      flushPara();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      list.push(t.replace(/^\d+\.\s+/, ""));
      continue;
    }
    // blockquote
    if (/^>\s?/.test(t)) {
      flushPara(); flushList();
      blocks.push("<blockquote>" + inline(t.replace(/^>\s?/, "")) + "</blockquote>");
      continue;
    }
    // 普通段落
    flushList();
    para.push(t);
  }
  flushPara(); flushList();

  return blocks.join("\n");
}

function inline(s) {
  // 加粗 **text**
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return t;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function slugify(s) {
  return "s" + Math.abs(hash(s)).toString(36);
}
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

// —— 生成一个详情页 HTML ——
function buildHtml(cond, parsed) {
  const catLabel = CAT_LABELS[cond.category] || cond.category;
  const urgent = URGENT_CALLOUTS[cond.id];

  const urgentBlock = urgent ? `
    <div class="urgent-callout">
      <div class="urgent-callout__inner">
        <span class="urgent-callout__icon" aria-hidden="true">⚠</span>
        <div>
          <p class="urgent-callout__title">${esc(urgent.title)}</p>
          <p class="urgent-callout__text">${urgent.text}</p>
        </div>
      </div>
    </div>` : "";

  // 参考资料
  const refItems = parsed.references.map(r =>
    `<li>${esc(r.text)}<br /><a href="${esc(r.url)}">${esc(r.url)}</a></li>`
  ).join("\n      ");

  // 相关阅读
  const relIds = RELATED[cond.id] || [];
  const relatedCards = relIds.map(rid => {
    const r = DATA.find(d => d.id === rid);
    if (!r) return "";
    return `<a class="related-card" href="${r.slug}.html">
            <p class="related-card__cat">${esc(CAT_LABELS[r.category] || r.category)}</p>
            <p class="related-card__title">${esc(r.title)}</p>
          </a>`;
  }).join("\n          ");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(parsed.h1)} · 皮肤科普</title>
  <meta name="description" content="${esc(cond.summary)}" />
  <link rel="icon" type="image/png" href="/assets/logo/amc-logo.png" />
  <link rel="apple-touch-icon" href="/assets/logo/amc-logo.png" />
  <link rel="stylesheet" href="../assets/css/design-tokens.css" />
  <link rel="stylesheet" href="../assets/css/base.css" />
  <link rel="stylesheet" href="../assets/css/article.css" />
</head>
<body>
  <header class="site-header" id="siteHeader">
    <div class="site-header__inner">
      <a href="../index.html" class="brand" aria-label="重庆西区医院整形外科医疗美容中心 首页">
        <img class="brand__logo" src="/assets/logo/amc-logo.png" alt="重庆西区医院整形外科医疗美容中心" />
        <span class="brand__name"><b>重庆西区医院</b> <span>整形外科医疗美容中心</span></span>
      </a>
      <nav class="main-nav" id="mainNav" aria-label="主导航">
        <a href="../index.html">首页</a>
        <a href="../index.html">整形外科</a>
        <a href="../index.html">非手术中心</a>
        <a href="../index.html">特色专科</a>
        <a href="../index.html" aria-current="page">皮肤病症</a>
        <a href="../index.html">医疗团队</a>
        <a href="../index.html" class="btn btn--primary">预约面诊</a>
      </nav>
      <button class="nav-toggle" id="navToggle" aria-label="打开菜单" aria-expanded="false"><span></span></button>
    </div>
  </header>

  <main class="article">
    <nav class="breadcrumb" aria-label="路径">
      <a href="../index.html">皮肤病症</a><span>／</span>
      <a href="../index.html">${esc(catLabel)}</a><span>／</span>${esc(parsed.h1.split(" ")[0].slice(0,8))}
    </nav>

    <div class="article__hero">
      <img src="../assets/img/conditions/${cond.slug}.svg" alt="" />
    </div>

    <header class="article__head">
      <p class="article__category">
        <span class="cat-tag">${esc(catLabel)}</span>
        ${cond.common ? '<span class="badge--common" style="display:none"></span>' : ""}
      </p>
      <h1 class="article__title">${esc(parsed.h1)}</h1>
      <p class="article__lead">${esc(cond.summary)}</p>
      <p class="article__meta">用于公众健康教育 · 不替代面诊 · 经临床审校</p>
    </header>

    ${urgentBlock}

    <div class="article__body">
      <article class="prose">
${parsed.bodyHtml}
      </article>
    </div>

    <section class="references">
      <button class="references__toggle" aria-expanded="false">
        参考资料与权威来源
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <ul class="references__list">
      ${refItems}
      </ul>
    </section>

    <p class="disclaimer">${esc(parsed.disclaimer || "本文用于健康教育，不能替代皮肤科面诊。")} 遇到紧急情况请立即拨打 120 或前往急诊。</p>

    <div class="article-foot">
      <div class="related">
        <p class="related__title">相关阅读</p>
        <div class="related__grid">
          ${relatedCards}
        </div>
      </div>
      <div class="cta-strip">
        <div class="cta-strip__inner">
          <div class="cta-strip__text">
            <h3>想进一步确认？</h3>
            <p>科普帮你看懂，具体方案需要面诊。皮肤科医生可以帮你判断。</p>
          </div>
          <a href="../index.html" class="btn btn--primary">预约皮肤科面诊</a>
        </div>
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__grid">
        <div class="footer-about">
          <h4>关于我们</h4>
          <p>重庆西区医院整形外科医疗美容中心（AMC）依托三级综合医院，提供整形外科、美容外科、微整注射、美容皮肤科等医疗服务。</p>
          <p class="footer-about__disclaimer">本网站内容不代表任何诊疗建议和就医指导，诊疗活动请到正规医疗机构找有资质的医生进行。</p>
        </div>
        <div>
          <h4>快速链接</h4>
          <ul>
            <li><a href="../index.html">首页</a></li>
            <li><a href="../index.html">整形外科</a></li>
            <li><a href="../index.html">非手术中心</a></li>
            <li><a href="../index.html">特色专科</a></li>
            <li><a href="../index.html">皮肤病症</a></li>
          </ul>
        </div>
        <div>
          <h4>更多</h4>
          <ul>
            <li><a href="../index.html">医疗团队</a></li>
            <li><a href="../index.html">服务项目</a></li>
            <li><a href="../index.html">联系我们</a></li>
          </ul>
        </div>
        <div>
          <h4>联系方式</h4>
          <ul>
            <li>门诊电话：（+86）023-81913691</li>
            <li>医院地址：重庆市九龙坡区华福大道北段 301 号</li>
            <li>交通：轻轨 5 号线华岩站旁（向南约 500 米）</li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        渝ICP备 16053114 号-2 · 渝B2-20180032 · 渝公网安备 31011502400137 号 · © 2026 重庆西区医院整形外科医疗美容中心 版权所有
      </div>
    </div>
  </footer>

  <script src="../assets/js/article.js"></script>
</body>
</html>
`;
}

// —— 主流程 ——
function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0, fail = 0;
  DATA.forEach(cond => {
    // 找到对应源文件（按 id 前缀）
    const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith(String(cond.id).padStart(2, "0") + "-") && f.endsWith(".md"));
    if (!files.length) { console.warn("  [skip] no source for id " + cond.id); fail++; return; }
    const md = fs.readFileSync(path.join(SRC_DIR, files[0]), "utf8");
    const parsed = parseMd(md);
    parsed.bodyHtml = normalizePunctuation(parsed.bodyHtml);
    parsed.summary = cond.summary;
    const html = buildHtml(cond, parsed);
    fs.writeFileSync(path.join(OUT_DIR, cond.slug + ".html"), html, "utf8");
    ok++;
  });
  console.log("Generated " + ok + " articles, " + fail + " skipped.");
}
main();
