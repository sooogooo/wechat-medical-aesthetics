/**
 * gen-course-refs.js — 生成科普文章 ← 课程的反向引用索引
 * 输出 assets/data/course-refs.json: { "skin/00-acne.html": { no, title, url }, ... }
 * 供科普文章构建器注入"本篇是第 N 课精读教材"回链。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "_src", "医美咨询师成长教程");

const SERIES_MAP = {
  "皮肤常见病症科普系列": { json: "conditions.json", dir: "skin" },
  "美容注射的艺术科普系列": { json: "injection.json", dir: "injection" },
  "四级与整形美容手术科普系列": { json: "surgery.json", dir: "surgery" },
  "医美亚美学科普系列": { json: "aesthetics.json", dir: "aesthetics" },
  "医美美学三型科普系列": { json: "types.json", dir: "types" },
};
// md 篇号 → 已发布 slug
const idToSlug = {};
for (const cfg of Object.values(SERIES_MAP)) {
  const entries = JSON.parse(fs.readFileSync(path.join(ROOT, "assets", "data", cfg.json), "utf8"));
  for (const e of entries) idToSlug[`${cfg.dir}#${e.id}`] = `${cfg.dir}/${e.slug}.html`;
}

const LESSON_TITLES = {};
const refs = {};
for (const f of fs.readdirSync(SRC).filter(f => /^\d+-.*\.md$/.test(f))) {
  const no = parseInt(f, 10);
  const text = fs.readFileSync(path.join(SRC, f), "utf8");
  const h1 = (text.match(/^# (.+)$/m) || [])[1] || f;
  LESSON_TITLES[no] = h1.replace(/^\d+\s*·\s*/, "");
  for (const m of text.matchAll(/\]\(\.\.\/([^/]+)\/(\d+)-[^)]*\.md\)/g)) {
    const series = SERIES_MAP[m[1]];
    if (!series) continue;
    const target = idToSlug[`${series.dir}#${parseInt(m[2], 10)}`];
    if (target && !refs[target]) {
      refs[target] = { no, title: LESSON_TITLES[no], url: `consultant/${f.replace(/\.md$/, ".html")}` };
    }
  }
}

fs.writeFileSync(path.join(ROOT, "assets", "data", "course-refs.json"), JSON.stringify(refs, null, 1), "utf8");
console.log(`course-refs.json: ${Object.keys(refs).length} 篇科普有课程回链`);
