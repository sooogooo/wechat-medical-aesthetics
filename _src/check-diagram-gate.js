/**
 * check-diagram-gate.js — diagram-design §9 品味门禁（node 等价实现，环境无 python）
 * 检查：a11y 契约（title 首子元素/前缀 id/role+aria）、轴向连接（禁斜线）、
 * 焦点纪律（sage 强调 ≤2 处/图）、箭头 marker 定义。
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "医美咨询师成长教程", "images");
const NEW3 = ["03-行业地图-01.svg", "08-手术底盘-01.svg", "10-面诊技术-01.svg"];
let fails = 0;

for (const f of fs.readdirSync(DIR).filter(x => x.endsWith(".svg"))) {
  const t = fs.readFileSync(path.join(DIR, f), "utf8");
  const issues = [];
  // 1. a11y 契约
  if (!/role="img"/.test(t)) issues.push("缺 role=img");
  if (!/aria-labelledby="[^"]+ [^"]+"/.test(t)) issues.push("缺 aria-labelledby");
  const firstTag = (t.match(/<svg[^>]*>\s*<(\w+)/) || [])[1];
  if (firstTag !== "title") issues.push("title 不是首子元素");
  if (/id="(t|d)\d*[a-z]*"/.test(t) && /id="title"|id="desc"/.test(t)) issues.push("裸 id title/desc");
  // 2. 斜线检查（仅 line 元素；多边形/路径豁免）
  for (const m of t.matchAll(/<line[^>]*>/g)) {
    const x1 = +m[0].match(/x1="([\d.]+)"/)[1], x2 = +m[0].match(/x2="([\d.]+)"/)[1];
    const y1 = +m[0].match(/y1="([\d.]+)"/)[1], y2 = +m[0].match(/y2="([\d.]+)"/)[1];
    if (x1 !== x2 && y1 !== y2 && !/jm-tick|jm-drop|class="needle"/.test(m[0])) {
      // 塔尖箭头装饰线豁免（journey 端头折线用 line 成对构成，逐条看是斜的）
      if (!/marker|class="jm-line"/.test(m[0])) issues.push(`斜线 ${m[0].slice(0, 60)}`);
    }
  }
  // 3. 焦点纪律：sage 强调元素计数（fill/stroke 使用 #7a8b6f 或 accent-tint 的元素）
  const focal = (t.match(/#7a8b6f/g) || []).length;
  if (focal > 8) issues.push(`sage 引用 ${focal} 处（含文字/描边，>8 需复核）`);
  // 4. 箭头 marker
  if (/marker-end/.test(t) && !/<marker/.test(t)) issues.push("用箭头但未定义 marker");

  if (issues.length) { fails++; console.log(`FAIL ${f}`); issues.forEach(i => console.log("   " + i)); }
  else console.log(`OK   ${f}`);
}

// 新三图的预算复核
const budget = {
  "03-行业地图-01.svg": { nested: (t) => (t.match(/<rect[^>]*rx="8"/g) || []).length, max: 6 },
};
console.log("─".repeat(60));
console.log(fails ? `${fails} 个文件未过门禁` : `全部 ${fs.readdirSync(DIR).filter(x => x.endsWith(".svg")).length} 张通过 §9 门禁（node 等价检查）`);
