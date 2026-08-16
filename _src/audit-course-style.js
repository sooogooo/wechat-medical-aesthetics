/**
 * audit-course-style.js — 成长教程标点与 AI 味核查报告
 *
 * 检查项：
 *  1. 破折号 ——（正文成瘾指标）
 *  2. "不是…而是…" 负向排比
 *  3. CJK 语境中的半角标点 , ; : ! ? ( )
 *  4. 引号配对（" 计数奇偶）
 *  5. 省略号 ... / …
 *  6. 标题行（# / ###）中的全角冒号
 *  7. 加粗开头的列表项密度
 *  8. 箭头 → 出现在句子正文（非表格/代码）
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "医美咨询师成长教程");
const files = fs.readdirSync(DIR).filter(f => f.endsWith(".md")).sort();

let total = { dash: 0, neg: 0, half: 0, quoteOdd: 0, ellipsis: 0, titleColon: 0, boldLi: 0, arrow: 0 };

for (const f of files) {
  const text = fs.readFileSync(path.join(DIR, f), "utf8");
  const lines = text.split(/\r?\n/);
  const r = { dash: 0, neg: 0, half: 0, quoteOdd: 0, ellipsis: 0, titleColon: 0, boldLi: 0, arrow: 0 };
  const dashLines = [], halfLines = [], negLines = [], titleColonLines = [];

  lines.forEach((line, i) => {
    const inCode = line.includes("```");
    const isTable = /^\s*\|/.test(line);
    const isMeta = /^>\s*\*\*阶段/.test(line);
    const no = i + 1;

    // 1. 破折号
    const dashes = (line.match(/——/g) || []).length;
    if (dashes && !inCode) { r.dash += dashes; if (dashLines.length < 3) dashLines.push(`L${no}: ${line.trim().slice(0, 50)}`); }

    // 2. 负向排比
    if (/不是[^，。；]{1,20}[，—]*而是/.test(line)) { r.neg++; if (negLines.length < 2) negLines.push(`L${no}: ${line.trim().slice(0, 50)}`); }

    // 3. CJK 语境半角标点（前后有汉字；跳过链接、代码、表格、meta 分隔行）
    if (!inCode && !isTable && !isMeta) {
      const m = line.match(/[\u4e00-\u9fff][,;:!?()]|[,;:!?()][\u4e00-\u9fff]/g);
      if (m) {
        // 排除链接 ( ) 与数字括号
        const cleaned = line.replace(/\]\([^)]*\)/g, "").replace(/`[^`]*`/g, "").replace(/\([^)]*\)/g, "()");
        const m2 = cleaned.match(/[\u4e00-\u9fff][,;:!?]|[,;:!?][\u4e00-\u9fff]/g);
        const m3 = cleaned.match(/[\u4e00-\u9fff]\(|\)[\u4e00-\u9fff]/g);
        const n = (m2 ? m2.length : 0) + (m3 ? m3.length : 0);
        if (n) { r.half += n; if (halfLines.length < 2) halfLines.push(`L${no}: ${line.trim().slice(0, 50)}`); }
      }
    }

    // 4. 引号配对
    const q = (line.match(/"/g) || []).length;
    if (q % 2 === 1) r.quoteOdd++;

    // 5. 省略号
    if (/\.\.\.|…[^…]/.test(line.replace(/……/g, ""))) r.ellipsis++;
    // 6. 标题冒号
    if (/^#{1,3}\s.*：/.test(line)) { r.titleColon++; titleColonLines.push(`L${no}: ${line.trim().slice(0, 40)}`); }
    // 7. 加粗开头列表
    if (/^\s*[-*]\s+\*\*/.test(line)) r.boldLi++;
    // 8. 正文箭头（非表格非代码）
    if (!inCode && !isTable && /→/.test(line)) r.arrow++;
  });

  for (const k of Object.keys(total)) total[k] += r[k];
  const flag = (r.dash + r.neg * 2 + r.half + r.quoteOdd * 2 + r.titleColon) > 8 ? " ◀" : "";
  console.log(
    `${f.padEnd(38)} ——:${String(r.dash).padStart(3)}  排比:${r.neg}  半角:${String(r.half).padStart(2)}  引号奇:${r.quoteOdd}  标题冒号:${r.titleColon}  加粗li:${String(r.boldLi).padStart(3)}  箭头:${r.arrow}${flag}`
  );
  if (process.argv.includes("-v")) {
    dashLines.forEach(d => console.log("    " + d));
    negLines.forEach(d => console.log("    排比 " + d));
    halfLines.forEach(d => console.log("    半角 " + d));
    titleColonLines.forEach(d => console.log("    冒号 " + d));
  }
}
console.log("─".repeat(80));
console.log(`合计 ——:${total.dash}  排比:${total.neg}  半角:${total.half}  引号奇文件行:${total.quoteOdd}  省略号:${total.ellipsis}  标题冒号:${total.titleColon}  加粗li:${total.boldLi}  箭头:${total.arrow}`);
