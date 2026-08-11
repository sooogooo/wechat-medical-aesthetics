/**
 * insert-skin-figures.js — 为皮肤系列文章页插入内文配图
 *
 * 每篇文章在正文的第一个 <h3> 前插入 fig1，第二个 <h3> 前插入 fig2。
 * 图片路径相对于 skin/ 目录：../assets/img/conditions/{slug}-fig1.svg
 */
const fs = require("fs");
const path = require("path");

const SKIN_DIR = path.resolve(__dirname, "..", "skin");
const IMG_DIR = path.resolve(__dirname, "..", "assets", "img", "conditions");

const htmlFiles = fs.readdirSync(SKIN_DIR)
  .filter(f => f.endsWith(".html") && f !== "index.html");

let updated = 0;

for (const htmlFile of htmlFiles) {
  const filePath = path.join(SKIN_DIR, htmlFile);
  let html = fs.readFileSync(filePath, "utf8");
  const slug = htmlFile.replace(/\.html$/, "");

  // 检查 fig1/fig2 是否存在
  const fig1Path = `${slug}-fig1.svg`;
  const fig2Path = `${slug}-fig2.svg`;
  const hasFig1 = fs.existsSync(path.join(IMG_DIR, fig1Path));
  const hasFig2 = fs.existsSync(path.join(IMG_DIR, fig2Path));
  if (!hasFig1 && !hasFig2) continue;

  // 如果已有 figure，跳过
  if (html.includes("-fig1.svg") || html.includes("-fig2.svg")) {
    console.log(`跳过 ${htmlFile}（已有配图）`);
    continue;
  }

  const fig1Html = hasFig1
    ? `\n<figure style="margin:var(--sp-5) 0;text-align:center;"><img src="../assets/img/conditions/${fig1Path}" alt="${slug} 概念图" style="max-width:100%;border-radius:var(--radius);border:1px solid var(--line);" loading="lazy" /></figure>\n`
    : "";
  const fig2Html = hasFig2
    ? `\n<figure style="margin:var(--sp-5) 0;text-align:center;"><img src="../assets/img/conditions/${fig2Path}" alt="${slug} 治疗护理" style="max-width:100%;border-radius:var(--radius);border:1px solid var(--line);" loading="lazy" /></figure>\n`
    : "";

  // 找到正文里的 <h3 标签位置
  const h3Matches = [];
  const h3Regex = /<h3\s/g;
  let m;
  while ((m = h3Regex.exec(html)) !== null) {
    h3Matches.push(m.index);
  }

  if (h3Matches.length >= 1 && fig1Html) {
    // 在第一个 h3 前插入 fig1
    html = html.slice(0, h3Matches[0]) + fig1Html + html.slice(h3Matches[0]);
    updated++;
  }
  if (h3Matches.length >= 2 && fig2Html) {
    // 在第二个 h3 前插入 fig2（注意位置因 fig1 插入而偏移）
    const h3Regex2 = /<h3\s/g;
    const matches2 = [];
    let m2;
    while ((m2 = h3Regex2.exec(html)) !== null) {
      matches2.push(m2.index);
    }
    if (matches2.length >= 2) {
      html = html.slice(0, matches2[1]) + fig2Html + html.slice(matches2[1]);
    }
  }

  fs.writeFileSync(filePath, html, "utf8");
}

console.log(`\n更新了 ${updated} 个文件`);
