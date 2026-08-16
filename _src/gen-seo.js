/**
 * gen-seo.js — 生成 robots.txt 与 sitemap.xml
 * 用法: node _src/gen-seo.js  （部署时 SITE_BASE=https://域名 node _src/gen-seo.js）
 */
const fs = require("fs");
const path = require("path");
const { SITE_BASE } = require("./site-config");

const ROOT = path.resolve(__dirname, "..");
const DIRS = [
  { dir: "", files: ["index.html", "disclaimer.html", "search.html"] },
  { dir: "skin" }, { dir: "surgery" }, { dir: "injection" },
  { dir: "aesthetics" }, { dir: "types" },
  { dir: "consultant" },
];
const SKIP = new Set(["404.html"]); // noindex 页不入 sitemap

const urls = [];
for (const { dir, files } of DIRS) {
  const list = files || fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith(".html"));
  for (const f of list) {
    if (SKIP.has(f)) continue;
    const rel = dir ? `${dir}/${f}` : f;
    const full = path.join(ROOT, dir, f);
    const mtime = fs.statSync(full).mtime.toISOString().slice(0, 10);
    urls.push({ loc: `${SITE_BASE}/${encodeURI(rel)}`, lastmod: mtime });
  }
}

fs.writeFileSync(path.join(ROOT, "robots.txt"),
`User-agent: *
Allow: /

Sitemap: ${SITE_BASE}/sitemap.xml
`, "utf8");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log(`robots.txt + sitemap.xml 已生成：${urls.length} 个 URL（base=${SITE_BASE}）`);
