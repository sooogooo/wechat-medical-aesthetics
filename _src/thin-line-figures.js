/**
 * thin-line-figures.js — 课文配图细线化（diagram-design 原则）
 * 1. 删除渐变定义与外层渐变底（图直接落在页面暖白底上）
 * 2. 删除投影 filter 及引用
 * 3. 淡色填充 → 纯白（信息分组改由描边色承担）
 * 4. 圆角 >10 → 10
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "医美咨询师成长教程", "images");
const TINTS = ["#eef3ec", "#f3f7f0", "#f7faf6", "#eef0ea", "#edf0ea", "#faf8f2", "#f4ede0",
  "#f4f4f2", "#f2f2ef", "#f8f2f0", "#f8efec", "#fdf1ee", "#f6e3dd", "#eef0f4", "#faf6ef",
  "#f1f7f8", "#fff6eb", "#f7ece6", "#fdf6f2", "#f0f4f0", "#f5f2ec", "#f6f1e9", "#f8f5ef"];

let n = 0;
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith(".svg"))) {
  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, "utf8");
  let t = src;

  // 1. 渐变定义
  t = t.replace(/<linearGradient[^>]*id="bg[^"]*"[^>]*>[\s\S]*?<\/linearGradient>\s*/g, "");
  // 外层渐变底 rect（width=800 height=500 rx=24 fill=url(#bg...)）
  t = t.replace(/<rect width="800" height="500" rx="24" fill="url\(#bg[^)]*\)"[^/]*\/>\s*/g, "");
  // 内层大卡：去 filter / opacity，描边改发丝线
  t = t.replace(/<rect x="30" y="26" width="740" height="448" rx="20" fill="#ffffff" opacity="0\.96" stroke="#dce8e8"( filter="url\(#sh[^)]*\)")?\/>/,
    '<rect x="30" y="26" width="740" height="448" rx="10" fill="#ffffff" stroke="#e4ddd2"/>');

  // 2. 投影
  t = t.replace(/<filter id="sh[^"]*"[^>]*>[\s\S]*?<\/filter>\s*/g, "");
  t = t.replace(/\s*filter="url\(#sh[^)]*\)"/g, "");

  // 3. 淡填充 → 白
  for (const c of TINTS) t = t.split(`fill="${c}"`).join('fill="#ffffff"');

  // 4. 圆角收敛 ≤10
  t = t.replace(/rx="(\d+)"/g, (m, v) => parseInt(v, 10) > 10 ? 'rx="10"' : m);

  if (t !== src) { fs.writeFileSync(p, t, "utf8"); n++; console.log("细线化", f); }
}
console.log(`完成 ${n} 张`);
