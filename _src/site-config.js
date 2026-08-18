/**
 * site-config.js — 全站构建共享配置
 * SITE_BASE 用于 canonical / og:image / sitemap <loc> 的绝对化。
 * 默认值即生产域名：忘带环境变量也不会把 localhost 写进产物。
 * 本地预览无需覆盖；确需本地地址时：set SITE_BASE=http://127.0.0.1:8000 后重跑构建。
 */
const SITE_BASE = (process.env.SITE_BASE || "https://sooogooo.github.io/wechat-medical-aesthetics").replace(/\/$/, "");

const SERIES_META = {
  portal:     { key: "portal",     name: "医美科普门户",       tagline: "认识医美，从理解开始",                    color: "#7a8b6f", path: "" },
  skin:       { key: "skin",       name: "皮肤常见病症科普",   tagline: "55 个常见皮肤问题的科学解读",            color: "#7a8b6f", path: "skin/" },
  surgery:    { key: "surgery",    name: "四级与整形美容手术", tagline: "30 个手术主题 · 风险沟通与决策",          color: "#b5654a", path: "surgery/" },
  injection:  { key: "injection",  name: "美容注射的艺术",     tagline: "40 篇注射主题 · 机制、风险与 MD Codes",  color: "#c9a876", path: "injection/" },
  aesthetics: { key: "aesthetics", name: "医美亚美学",         tagline: "10 种审美流派的盘点与反思",              color: "#7d8ba3", path: "aesthetics/" },
  types:      { key: "types",      name: "医美美学三型",       tagline: "高级型 · 技术型 · 庸俗型",                color: "#8a8578", path: "types/" },
  consultant: { key: "consultant", name: "一路绿灯 · 医美咨询师成长站", tagline: "从小白到上岗的十二个月",        color: "#7a8b6f", path: "consultant/" },
  career:     { key: "career",     name: "大厂人转行医美 · 实然指南",   tagline: "16 篇实然指南 · 不劝进不劝退", color: "#2f4858", path: "career/" },
};

/** canonical + og 三件套（og:image 用绝对地址 PNG 分享卡） */
function headMeta({ canonicalPath, title, desc, cardKey, siteName = "重庆西区医院医美科普" }) {
  const m = SERIES_META[cardKey] || SERIES_META.portal;
  return `  <link rel="canonical" href="${SITE_BASE}/${canonicalPath}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${SITE_BASE}/assets/img/share/${m.key}-card.png" />
  <meta property="og:site_name" content="${siteName}" />
  <meta name="twitter:card" content="summary_large_image" />`;
}

module.exports = { SITE_BASE, SERIES_META, headMeta };
