/**
 * gen-career-assets.js — 实然指南独立站品牌资产
 * 输出: career-site/assets/ 下 logo.svg / favicon.svg / apple-touch-icon.png / og-card.png
 * PNG 由 @resvg/resvg-js 渲染（node_modules 已装）。
 *
 * 品牌概念：实然指南。方印之「实」+ 缺口圆环与金点（指南针意象）——
 * 实心的事实为体，指南的方向为用。
 */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "career-site", "assets");
fs.mkdirSync(path.join(OUT, "img"), { recursive: true });

const INK = "#2f4858";     // 墨青蓝（主）
const GOLD = "#c9a876";    // 金点（指南）
const PAPER = "#faf8f4";   // 暖纸底
const INK_TEXT = "#2b2a28";
const HAIR = "#e4ddd2";
const SOFT = "#6b6864";
const FONT = "Microsoft YaHei, PingFang SC, sans-serif";
const SERIF = "SimSun, Songti SC, serif";

// ============ 标志（mark）：方印「实」+ 缺口圆环 + 金点 ============
function markSvg(size = 64) {
  const r = 0.22 * size; // 圆角
  const cx = size / 2, cy = size / 2;
  const ring = 0.36 * size; // 圆环半径
  // 缺口朝右上 45°：pathLength 100，虚线 84/16，起点旋转到西南
  const gx = cx + ring * Math.cos(-Math.PI / 4);
  const gy = cy + ring * Math.sin(-Math.PI / 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${r}" fill="${INK}"/>
  <circle cx="${cx}" cy="${cy}" r="${ring}" fill="none" stroke="#faf8f4" stroke-opacity="0.42" stroke-width="${Math.max(1.4, size * 0.026)}" pathLength="100" stroke-dasharray="82 18" stroke-dashoffset="-40" transform="rotate(28 ${cx} ${cy})"/>
  <circle cx="${gx}" cy="${gy}" r="${Math.max(2.2, size * 0.055)}" fill="${GOLD}"/>
  <text x="${cx}" y="${cy + size * 0.115}" font-family="${SERIF}" font-size="${size * 0.42}" font-weight="700" fill="#faf8f4" text-anchor="middle">实</text>
</svg>`;
}

// ============ 横版 logo（mark + 字标），供关于页/外发使用 ============
function logoSvg() {
  const w = 560, h = 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <g transform="translate(4,16)">${""}</g>
  <g transform="translate(0,16) scale(1)">
    <g transform="translate(0,0)">
      <rect x="1" y="1" width="62" height="62" rx="14" fill="${INK}"/>
      <circle cx="32" cy="32" r="23" fill="none" stroke="#faf8f4" stroke-opacity="0.42" stroke-width="1.8" pathLength="100" stroke-dasharray="82 18" stroke-dashoffset="-40" transform="rotate(28 32 32)"/>
      <circle cx="48.3" cy="15.7" r="3.4" fill="${GOLD}"/>
      <text x="32" y="40" font-family="${SERIF}" font-size="27" font-weight="700" fill="#faf8f4" text-anchor="middle">实</text>
    </g>
    <text x="82" y="36" font-family="${SERIF}" font-size="30" font-weight="700" fill="${INK_TEXT}" letter-spacing="6">实然指南</text>
    <text x="84" y="62" font-family="${FONT}" font-size="14" fill="${SOFT}" letter-spacing="3">大厂人转行医美 · 十六篇读本</text>
  </g>
</svg>`;
}

// ============ OG 分享卡 1200×630 ============
function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="40" y="40" width="1120" height="550" rx="10" fill="#ffffff" stroke="${HAIR}"/>
  <rect x="40" y="40" width="1120" height="6" rx="3" fill="${INK}"/>
  <g transform="translate(120,150)">
    <rect x="1" y="1" width="96" height="96" rx="21" fill="${INK}"/>
    <circle cx="48" cy="48" r="34.5" fill="none" stroke="#faf8f4" stroke-opacity="0.42" stroke-width="2.4" pathLength="100" stroke-dasharray="82 18" stroke-dashoffset="-40" transform="rotate(28 48 48)"/>
    <circle cx="72.4" cy="23.6" r="5" fill="${GOLD}"/>
    <text x="48" y="62" font-family="${SERIF}" font-size="41" font-weight="700" fill="#faf8f4" text-anchor="middle">实</text>
  </g>
  <text x="260" y="196" font-family="${SERIF}" font-size="64" font-weight="700" fill="${INK_TEXT}" letter-spacing="10">实然指南</text>
  <text x="264" y="248" font-family="${FONT}" font-size="26" fill="${SOFT}" letter-spacing="5">大厂人转行医美 · 十六篇读本</text>
  <line x1="260" y1="292" x2="980" y2="292" stroke="${HAIR}"/>
  <text x="260" y="348" font-family="${FONT}" font-size="25" fill="${INK_TEXT}">这是个什么行业，钱怎么分，谁说了算；怎么进，进来会经历什么。</text>
  <text x="260" y="392" font-family="${FONT}" font-size="25" fill="${INK_TEXT}">名校生的机会与代价，与一页纸决策清单。</text>
  <text x="260" y="470" font-family="${FONT}" font-size="22" fill="${INK}">不劝进 · 不劝退 · 只把实况摆全</text>
  <text x="260" y="540" font-family="${FONT}" font-size="16" fill="${SOFT}" letter-spacing="2">SHIRAN GUIDE · FROM TECH TO MEDICAL AESTHETICS</text>
</svg>`;
}

// ============ 渲染与写出 ============
function writeSvg(name, svg) {
  fs.writeFileSync(path.join(OUT, name.replace("assets/", "")), svg);
}
fs.writeFileSync(path.join(OUT, "favicon.svg"), markSvg(64));
fs.writeFileSync(path.join(OUT, "img", "logo.svg"), logoSvg());
fs.writeFileSync(path.join(OUT, "img", "logo-mark.svg"), markSvg(160));

const og = new Resvg(ogSvg(), { fitTo: { mode: "width", value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: "Microsoft YaHei" } });
fs.writeFileSync(path.join(OUT, "img", "og-card.png"), og.render().asPng());

const apple = new Resvg(markSvg(180), { fitTo: { mode: "width", value: 180 }, font: { loadSystemFonts: true, defaultFontFamily: "SimSun" } });
fs.writeFileSync(path.join(OUT, "img", "apple-touch-icon.png"), apple.render().asPng());

console.log("品牌资产已生成：favicon.svg / img/logo.svg / img/logo-mark.svg / img/og-card.png / img/apple-touch-icon.png");
