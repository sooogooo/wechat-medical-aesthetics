/**
 * gen-share-cards.js — 生成 7 张 1200×630 分享卡 PNG（og:image / 微信分享缩略图）
 * 用法: node _src/gen-share-cards.js   （需 @resvg/resvg-js，见 node_modules）
 */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const { SERIES_META } = require("./site-config");

const OUT = path.join(__dirname, "..", "assets", "img", "share");
fs.mkdirSync(OUT, { recursive: true });

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

function cardSvg({ name, tagline, color, badge }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f4"/>
  <rect x="40" y="40" width="1120" height="550" rx="10" fill="#ffffff" stroke="#e4ddd2"/>
  <rect x="40" y="40" width="1120" height="6" rx="3" fill="${color}"/>
  <rect x="120" y="128" width="64" height="128" rx="32" fill="#2b2a28"/>
  <circle cx="152" cy="164" r="12" fill="#6b6864"/>
  <circle cx="152" cy="192" r="12" fill="#6b6864"/>
  <circle cx="152" cy="220" r="18" fill="${color}" opacity="0.25"/>
  <circle cx="152" cy="220" r="12" fill="${color}"/>
  <text x="220" y="176" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="30" fill="#a8a39d" letter-spacing="6">${esc(badge)}</text>
  <text x="220" y="236" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="52" font-weight="700" fill="#2b2a28">${esc(name)}</text>
  <text x="220" y="288" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="26" fill="#6b6864">${esc(tagline)}</text>
  <line x1="220" y1="336" x2="980" y2="336" stroke="#e4ddd2"/>
  <text x="220" y="384" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#7a8b6f">不推销 · 不承诺 · 不替代面诊</text>
  <text x="220" y="448" font-family="Consolas, monospace" font-size="18" fill="#a8a39d" letter-spacing="2">重庆西区医院 · 整形外科医疗美容中心</text>
  <text x="220" y="480" font-family="Consolas, monospace" font-size="15" fill="#a8a39d">EXPERIMENTAL CONTENT · FOR REFERENCE ONLY</text>
</svg>`;
}

const BADGES = {
  portal: "MEDICAL AESTHETICS PORTAL", skin: "DERMATOLOGY · 55",
  surgery: "SURGERY · 31", injection: "INJECTION · 41",
  aesthetics: "AESTHETICS · 10", types: "THREE TYPES · 10",
  consultant: "CONSULTANT ROAD · 20 LESSONS",
};

let n = 0;
for (const m of Object.values(SERIES_META)) {
  const svg = cardSvg({ name: m.name, tagline: m.tagline, color: m.color, badge: BADGES[m.key] });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: "Microsoft YaHei" } }).render().asPng();
  fs.writeFileSync(path.join(OUT, `${m.key}-card.png`), png);
  n++;
  console.log("share card:", `${m.key}-card.png`, (png.length / 1024).toFixed(0) + "KB");
}
console.log(`完成 ${n} 张 → ${OUT}`);
