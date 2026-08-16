/**
 * fix-course-punctuation.js — 成长教程标点清洗（沿用仓库 7857b4c 规则）
 *
 * md 文件：
 *   1. h1（# 开头）中的全角冒号 → 逗号
 *   2. 破折号 —— → 逗号（书名号《…——…》内的原题受保护），并清理 ，， / ，。 / ？， / ！，
 * svg 文件：
 *   3. <text class="title"> 中的全角冒号 → 空格（与皮肤系列图题风格一致）
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "医美咨询师成长教程");
const IMG_DIR = path.join(DIR, "images");

let mdChanges = 0, svgChanges = 0;

// ---- md ----
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith(".md"))) {
  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, "utf8");
  let text = src;

  // 保护书名号内含破折号的原题
  const guarded = [];
  text = text.replace(/《[^》]*——[^》]*》/g, m => { guarded.push(m); return `\x00${guarded.length - 1}\x00`; });

  // h1 冒号 → 逗号
  text = text.replace(/^(# [^:\n]*?)：/gm, "$1，");

  // 破折号 → 逗号
  text = text.replace(/——/g, "，");
  // 清理衍生
  text = text.replace(/，，/g, "，").replace(/，。/g, "。").replace(/？，/g, "？").replace(/！，/g, "！").replace(/：，/g, "：");

  // 还原保护
  text = text.replace(/\x00(\d+)\x00/g, (_, i) => guarded[+i]);

  if (text !== src) {
    fs.writeFileSync(p, text, "utf8");
    mdChanges++;
    console.log(`md  ${f}`);
  }
}

// ---- svg 标题 ----
for (const f of fs.readdirSync(IMG_DIR).filter(f => f.endsWith(".svg"))) {
  const p = path.join(IMG_DIR, f);
  const src = fs.readFileSync(p, "utf8");
  let text = src.replace(/(<text[^>]*class="title"[^>]*>)([^<]*)(<\/text>)/g, (m, a, t, z) => {
    const cleaned = t.replace(/：/g, "  ").replace(/  +/g, " ");
    return cleaned !== t ? a + cleaned + z : m;
  });
  if (text !== src) {
    fs.writeFileSync(p, text, "utf8");
    svgChanges++;
    console.log(`svg ${f}`);
  }
}

console.log(`完成：md 修改 ${mdChanges} 个，svg 标题修改 ${svgChanges} 个`);
