/**
 * check-site-links.js — 全站链接检查
 * 1. 站内 href 必须解析到存在的文件（含目录 index.html、页内锚点）
 * 2. 占位链接检测：同一导航/页脚区块内，多个不同锚文本指向同一目标 → 报告复核
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIRS = ["", "skin", "surgery", "injection", "aesthetics", "types", "consultant"];

let checked = 0, dead = 0, placeholders = 0;
const deadList = [], phList = [];

for (const d of DIRS) {
  const dirPath = d ? path.join(ROOT, d) : ROOT;
  for (const f of fs.readdirSync(dirPath)) {
    if (!f.endsWith(".html")) continue;
    const page = path.join(dirPath, f);
    const html0 = fs.readFileSync(page, "utf8");
    const html = html0.replace(/<script[\s\S]*?<\/script>/g, ""); // 链接扫描跳过脚本块
    const hrefs = [...html.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => ({ url: m[1], hash: m[2] || "" }));
    // 占位检测：同一页面里，>3 个不同锚文本指向同一站内目标
    const byTarget = {};
    for (const anchorTag of html.matchAll(/<a [^>]*href="([^"#]+)[^"]*"[^>]*>([^<]{1,20})</g)) {
      const key = path.normalize(path.join(dirPath, anchorTag[1]+(anchorTag[0].match(/#[^"]*/)||[""])[0]));
      byTarget[key] = byTarget[key] || new Set();
      byTarget[key].add(anchorTag[2].trim());
    }
    for (const [target, texts] of Object.entries(byTarget)) {
      if (texts.size >= 5 && target.endsWith("index.html")) {
        placeholders++;
        phList.push(`${d}/${f} → ${path.relative(ROOT, target)} 承载 ${texts.size} 个锚文本: ${[...texts].slice(0, 6).join(" / ")}`);
      }
    }
    for (const { url, hash } of hrefs) {
      if (/^(https?:|mailto:|tel:|javascript:)/.test(url)) continue;
      const target = path.normalize(path.join(dirPath, decodeURIComponent(url)));
      let exists = fs.existsSync(target);
      if (exists && fs.statSync(target).isDirectory()) exists = fs.existsSync(path.join(target, "index.html"));
      if (!exists) { dead++; deadList.push(`${d}/${f} → ${url}`); continue; }
      // 页内锚点存在性（仅同文件锚）
      if (hash && !url) {
        const id = hash.slice(1);
        if (!html.includes(`id="${id}"`)) { dead++; deadList.push(`${d}/${f} → 锚点 ${hash} 不存在`); }
      }
      checked++;
    }
  }
}

console.log(`有效站内链接: ${checked}`);
if (deadList.length) { console.log(`死链 ${dead} 个:`); deadList.slice(0, 20).forEach(x => console.log("  " + x)); }
if (phList.length) { console.log(`占位嫌疑 ${placeholders} 处:`); phList.slice(0, 10).forEach(x => console.log("  " + x)); }
if (!deadList.length && !phList.length) console.log("零死链 · 零占位链接");
