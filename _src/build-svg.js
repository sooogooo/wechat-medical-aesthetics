/* =========================================================================
   55 张病症 SVG 插画生成器（v2 · 具象可识别）
   每张 = 清晰可识别的身体部位(线稿) + 病症特征(色块/标记)。
   细线笔触，留白，禅意，但一眼能看出"这是什么部位、什么病"。
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const DATA = require("../assets/data/conditions.json");

const OUT = path.join(__dirname, "..", "assets", "img", "conditions");
fs.mkdirSync(OUT, { recursive: true });

const C = {
  ink: "#2B2A28",
  sage: "#7A8B6F",
  ochre: "#C9A876",
  clay: "#B5654A",
  gray: "#A8A39D"
};
const FONT = "font-family='-apple-system,PingFang SC,Hiragino Sans GB,sans-serif'";

function wrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round" text-rendering="geometricPrecision" ${FONT}>\n${inner}\n</svg>`;
}

// ===== 可复用身体部位构件（可识别的解剖线稿） =====

// 正脸（含五官，可识别为"脸"）
const faceFront = (sw = 2) => `
  <path d="M60 22c-14 0-24 10-24 26 0 20 10 38 24 42 14-4 24-22 24-42 0-16-10-26-24-26z" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M50 50c-2-1-5-1-7 0M70 50c2-1 5-1 7 0" stroke="${C.ink}" stroke-width="1.5"/>
  <path d="M56 62c2 3 6 3 8 0" stroke="${C.ink}" stroke-width="1.5" fill="none"/>`;

// 侧头（含耳朵轮廓，用于脱发）
const headProfile = (sw = 2) => `
  <path d="M40 34c0-10 8-18 22-18s22 10 22 22c0 6-2 12-6 16l-2 18c0 6-4 10-8 10H48c-4 0-6-4-6-8l-2-12c-4-2-6-6-6-12 0-6 2-12 6-16z" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M40 44c-6 0-8 4-6 8 2 2 6 2 8 0" stroke="${C.ink}" stroke-width="1.5" fill="none"/>
  <path d="M50 40c2-1 4-1 6 0M62 36c1-1 3-1 4 0" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;

// 头顶俯视（用于脱发分布）
const scalpTop = (sw = 2) => `
  <ellipse cx="60" cy="60" rx="34" ry="32" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M40 40c4-2 10-2 14 0M66 40c4-2 10-2 14 0" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;

// 手背（五指轮廓）
const handBack = (sw = 2) => `
  <path d="M40 40c0-6 4-10 8-10s6 4 6 10v10c4-4 8-4 10 0 0-6 4-10 8-10s6 4 6 10v14c0 12-6 22-18 22s-20-10-20-22V40z" stroke="${C.ink}" stroke-width="${sw}"/>`;

// 足底（脚掌轮廓，含脚趾）
const footSole = (sw = 2) => `
  <path d="M44 28c-4 0-8 4-8 14 0 8 2 14 2 24 0 12 4 22 16 22s16-10 16-22c0-10 2-16 2-24 0-10-4-14-8-14-3 0-5 2-10 2s-7-2-10-2z" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M40 36c2-2 4-2 6 0M50 34c2-2 4-2 6 0M58 34c2-2 4-2 6 0" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;

// 嘴唇
const lips = (sw = 2) => `
  <path d="M30 58c8-6 14-6 18-3 3-3 13-3 18 1 5-4 11-4 18 1-3 8-11 14-27 14S33 66 30 58z" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M48 55c4-2 20-2 24 0" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;

// 指甲（单片，带甲床）
const nail = (sw = 2) => `
  <path d="M44 30h32c0 4 0 10-2 18-2 8-6 14-14 14s-12-6-14-14c-2-8-2-14-2-18z" stroke="${C.ink}" stroke-width="${sw}"/>
  <path d="M46 36h28" stroke="${C.ink}" stroke-width="1.3" fill="none"/>`;

// 手臂（含手掌）
const arm = (sw = 2) => `
  <path d="M50 24c-4 0-8 4-8 12v36c0 8 4 14 10 14h16c6 0 10-6 10-14V36c0-8-4-12-8-12-3 0-5 2-10 2s-7-2-10-2z" stroke="${C.ink}" stroke-width="${sw}"/>`;

// 躯干正面（胸背，简化）
const torsoFront = (sw = 2) => `
  <path d="M40 28c-4 0-8 4-8 14v36c0 8 4 14 12 14h32c8 0 12-6 12-14V42c0-10-4-14-8-14-4 0-8 2-20 2s-16-2-20-2z" stroke="${C.ink}" stroke-width="${sw}"/>`;

// 小腿
const lowerLeg = (sw = 2) => `
  <path d="M48 22c-4 0-8 4-8 14v44c0 8 4 14 10 14h20c6 0 10-6 10-14V36c0-10-4-14-8-14-3 0-7 2-12 2s-9-2-12-2z" stroke="${C.ink}" stroke-width="${sw}"/>`;

// ===== 病症特征构件（色块/标记，叠加在部位上） =====
// 炎症红点
const dot = (x, y, r, color, op = 0.45) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${op}" stroke="${color}" stroke-width="1"/>`;
// 色素斑
const patch = (d, color, op = 0.3, sw = 1.3) =>
  `<path d="${d}" fill="${color}" fill-opacity="${op}" stroke="${color}" stroke-width="${sw}"/>`;

// ===== 逐病种 SVG =====
const ART = {
  // ===== 痤疮与玫瑰（脸 + 点位）=====
  "00-acne": wrap(faceFront(2) + `
    ${dot(50, 58, 4, C.sage)}
    ${dot(70, 56, 4, C.sage)}
    <circle cx="60" cy="70" r="3.5" fill="#fff" stroke="${C.sage}" stroke-width="1.2"/>
    <circle cx="60" cy="70" r="1" fill="${C.sage}"/>
    ${dot(45, 48, 1.6, C.ochre, 0.6)}${dot(75, 50, 1.6, C.ochre, 0.6)}
    ${dot(54, 46, 1.3, C.ochre, 0.6)}${dot(56, 82, 4, C.sage, 0.15)}`),

  "01-rosacea": wrap(faceFront(2) + `
    <path d="M38 60c8-4 16-4 22 0s16 4 22 0" stroke="${C.clay}" stroke-width="2.5" fill="${C.clay}" fill-opacity="0.14"/>
    <path d="M34 52c10-3 20-3 26 0s16 3 26 0" stroke="${C.clay}" stroke-width="1.8" fill="${C.clay}" fill-opacity="0.1"/>
    ${dot(50, 66, 1.3, C.clay, 0.7)}${dot(70, 64, 1.3, C.clay, 0.7)}
    <line x1="42" y1="64" x2="46" y2="62" stroke="${C.clay}" stroke-width="1"/>
    <line x1="74" y1="62" x2="78" y2="64" stroke="${C.clay}" stroke-width="1"/>`),

  "02-topical-steroid-dermatitis": wrap(faceFront(2) + `
    <path d="M36 56c8-3 16-3 24 0s16 3 24 0" stroke="${C.clay}" stroke-width="2" fill="${C.clay}" fill-opacity="0.12"/>
    <path d="M46 50l3 4M70 50l3 4M56 64l3 4M64 64l3 4" stroke="${C.ink}" stroke-width="1.2"/>
    ${dot(60, 80, 3, C.ochre, 0.25)}`),

  // ===== 色素类（脸/部位 + 色斑）=====
  "04-melasma": wrap(faceFront(1.8) + `
    ${patch("M40 58c6-6 16-8 22-4s14 4 18-4c2 8-2 16-12 20-10 4-22 2-28-8z", C.ochre, 0.3, 1.4)}`),

  "05-postinflammatory-hyperpigmentation": wrap(`
    ${faceFront(1.6)}
    ${dot(50, 56, 6, C.ochre, 0.32)}${dot(70, 60, 5, C.ochre, 0.32)}${dot(58, 72, 4, C.ochre, 0.32)}`),

  "06-solar-lentigo": wrap(faceFront(1.8) + `
    ${dot(52, 56, 2.5, C.ochre, 0.55)}${dot(64, 60, 2.2, C.ochre, 0.55)}
    ${dot(58, 66, 2, C.ochre, 0.55)}${dot(68, 52, 1.8, C.ochre, 0.55)}`),

  "07-acquired-dermal-melanocytosis": wrap(faceFront(1.6) + `
    <g fill="${C.ochre}" fill-opacity="0.5" stroke="${C.ochre}" stroke-width="1">
      <circle cx="48" cy="58" r="2.6"/><circle cx="54" cy="54" r="2.2"/>
      <circle cx="62" cy="56" r="2.4"/><circle cx="70" cy="58" r="2.2"/>
      <circle cx="52" cy="64" r="2"/><circle cx="66" cy="64" r="2"/>
      <circle cx="58" cy="60" r="1.8"/><circle cx="74" cy="54" r="1.8"/>
    </g>`),

  "08-freckles": wrap(faceFront(1.8) + `
    <g fill="${C.ochre}" fill-opacity="0.65">
      <circle cx="46" cy="54" r="1.5"/><circle cx="50" cy="50" r="1.3"/>
      <circle cx="54" cy="56" r="1.4"/><circle cx="66" cy="50" r="1.3"/>
      <circle cx="70" cy="54" r="1.5"/><circle cx="74" cy="50" r="1.2"/>
      <circle cx="48" cy="60" r="1.2"/><circle cx="72" cy="60" r="1.2"/>
    </g>`),

  "09-seborrheic-keratosis": wrap(faceFront(1.8) + `
    ${patch("M48 56c4-4 14-4 16 0 2 4-2 8-8 8s-10-4-8-8z", C.ochre, 0.35, 1.4)}
    <path d="M52 58c2-1 4-1 6 0M58 62c2-1 4-1 6 0" stroke="${C.ink}" stroke-width="0.8" fill="none"/>`),

  "41-photoaging": wrap(faceFront(1.8) + `
    <g stroke="${C.ink}" stroke-width="1.1" fill="none">
      <path d="M44 56c2 1 4 1 6 0M54 58c2 1 4 1 6 0M64 56c2 1 4 1 6 0"/>
      <path d="M46 70c3-2 6-2 9 0M66 70c3-2 6-2 9 0"/>
      <path d="M48 84c4-2 8-2 12 0"/>
    </g>
    ${dot(54, 50, 2, C.ochre, 0.4)}${dot(70, 52, 1.8, C.ochre, 0.4)}`),

  // ===== 胎记痣类（脸/部位 + 色块）=====
  "10-nevus-of-ota": wrap(faceFront(1.6) + `
    ${patch("M38 54c4-8 18-10 26-6 4 2 6 6 4 12-4 8-20 8-28 2-4-3-4-6-2-8z", C.ink, 0.2, 1.4)}
    ${dot(46, 50, 3, C.ink, 0.35)}
    <circle cx="44" cy="46" r="3.5" fill="none" stroke="${C.clay}" stroke-width="1" stroke-dasharray="1.5 1.5"/>`),

  "11-nevus-of-ito": wrap(`
    ${patch("M30 50c10-6 26-6 36 0 4 2 6 6 6 12-2 10-14 16-28 14-12-2-20-12-14-26z", C.ink, 0.2, 1.4)}
    <path d="M44 38c8-4 16-4 24 0" stroke="${C.ink}" stroke-width="1.3" fill="none" opacity="0.5"/>
    <path d="M40 40l-4-6M64 38l4-6" stroke="${C.ink}" stroke-width="1" fill="none" opacity="0.5"/>`),

  "12-cafe-au-lait": wrap(`
    ${torsoFront(1.6)}
    ${patch("M44 46c4-8 14-10 22-6 8 4 8 14 2 20-6 6-18 6-24-2-4-6-4-9 0-12z", C.ochre, 0.32, 1.4)}`),

  "13-becker-nevus": wrap(`
    ${torsoFront(1.6)}
    ${patch("M40 44c8-6 24-6 32 0 4 4 4 12 0 20-8 12-28 12-36 0-4-8-4-16 4-20z", C.ochre, 0.25, 1.3)}
    <g stroke="${C.ink}" stroke-width="1.2"><line x1="48" y1="54" x2="48" y2="64"/><line x1="54" y1="52" x2="54" y2="66"/><line x1="60" y1="54" x2="60" y2="62"/></g>`),

  "14-congenital-dermal-melanocytosis": wrap(`
    <ellipse cx="60" cy="64" rx="30" ry="22" stroke="${C.ink}" stroke-width="1.6" fill="none"/>
    ${patch("M34 60c8-12 24-16 38-10 8 4 12 12 8 20-6 10-26 12-40 4-8-5-10-9-6-14z", C.ink, 0.22, 1.3)}`),

  // ===== 角化异常（手臂 + 颗粒）=====
  "15-keratosis-pilaris": wrap(`
    ${arm(1.8)}
    <g fill="${C.ochre}" fill-opacity="0.55" stroke="${C.ochre}" stroke-width="0.9">
      <circle cx="52" cy="42" r="1.8"/><circle cx="58" cy="40" r="1.8"/><circle cx="64" cy="42" r="1.8"/>
      <circle cx="54" cy="52" r="1.8"/><circle cx="60" cy="50" r="1.8"/><circle cx="66" cy="52" r="1.8"/>
      <circle cx="52" cy="62" r="1.8"/><circle cx="58" cy="60" r="1.8"/><circle cx="64" cy="62" r="1.8"/>
      <circle cx="54" cy="72" r="1.8"/><circle cx="60" cy="70" r="1.8"/><circle cx="66" cy="72" r="1.8"/>
    </g>`),

  "42-atrophic-acne-scars": wrap(faceFront(1.8) + `
    <g fill="${C.ink}" fill-opacity="0.32">
      <ellipse cx="50" cy="58" rx="2.5" ry="3.5"/><ellipse cx="62" cy="60" rx="3" ry="4.5"/>
      <ellipse cx="72" cy="58" rx="2.5" ry="3.5"/>
    </g>`),

  "43-subcutaneous-atrophy": wrap(`
    ${arm(1.8)}
    <ellipse cx="60" cy="56" rx="14" ry="7" fill="${C.gray}" fill-opacity="0.22" stroke="${C.gray}" stroke-width="1.2" stroke-dasharray="2 2"/>`),

  "51-callus": wrap(footSole(2) + `
    <ellipse cx="52" cy="68" rx="11" ry="9" fill="${C.gray}" fill-opacity="0.28" stroke="${C.gray}" stroke-width="1.3"/>
    <path d="M46 64c2 2 8 2 12 0M50 72c2 2 6 2 8 0" stroke="${C.gray}" stroke-width="0.9" fill="none"/>`),

  "52-corn": wrap(footSole(2) + `
    <path d="M52 54l-4 8 4 16 4-16-4-8z" fill="${C.gray}" fill-opacity="0.32" stroke="${C.ink}" stroke-width="1.3"/>
    <circle cx="52" cy="62" r="1.5" fill="${C.ink}"/>`),

  // ===== 湿疹皮炎（部位 + 炎症）=====
  "03-urticaria": wrap(`
    ${torsoFront(1.6)}
    <path d="M44 50c4-3 8-3 12 0s8 3 12 0M48 64c4-3 8-3 12 0s8 3 12 0M44 78c4-3 8-3 12 0" stroke="${C.clay}" stroke-width="2" fill="${C.clay}" fill-opacity="0.16"/>`),

  "16-chronic-eczema": wrap(`
    ${arm(1.8)}
    <g stroke="${C.sage}" stroke-width="1.2" fill="none">
      <path d="M48 42c4 2 8 2 12 0M54 52c4 2 8 2 12 0M48 62c4 2 8 2 12 0M54 72c4 2 8 2 12 0"/>
    </g>
    ${patch("M46 80c4 2 12 2 16 0 2 4-2 8-8 8s-10-4-8-8z", C.sage, 0.18, 1.2)}`),

  "17-neurodermatitis": wrap(`
    ${arm(1.8)}
    ${patch("M48 44c4-2 16-2 18 4 2 8-4 18-12 16-8-2-10-14-6-20z", C.ink, 0.16, 1.4)}
    <path d="M52 48c-2 4-2 8 0 12M58 50c-2 4-2 8 0 12" stroke="${C.ink}" stroke-width="0.9" fill="none"/>
    <path d="M70 38c2 6 0 12-4 16" stroke="${C.sage}" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>`),

  "18-prurigo-nodularis": wrap(`
    ${lowerLeg(1.8)}
    <g fill="${C.sage}" fill-opacity="0.45" stroke="${C.ink}" stroke-width="1.2">
      <circle cx="50" cy="40" r="4.5"/><circle cx="62" cy="44" r="4.5"/><circle cx="72" cy="40" r="4.5"/>
      <circle cx="52" cy="60" r="4.5"/><circle cx="68" cy="64" r="4.5"/>
      <circle cx="50" cy="80" r="4.5"/><circle cx="64" cy="82" r="4.5"/>
    </g>`),

  "38-perioral-dermatitis": wrap(faceFront(1.8) + `
    <ellipse cx="60" cy="80" rx="15" ry="6" fill="none" stroke="${C.sage}" stroke-width="1.3" stroke-dasharray="2 2"/>
    <g fill="${C.sage}" fill-opacity="0.55">
      <circle cx="50" cy="78" r="1.8"/><circle cx="56" cy="76" r="1.6"/>
      <circle cx="64" cy="76" r="1.6"/><circle cx="70" cy="78" r="1.8"/>
      <circle cx="54" cy="82" r="1.4"/><circle cx="66" cy="82" r="1.4"/>
    </g>`),

  "39-contact-cheilitis": wrap(lips(2) + `
    <path d="M44 58c4 0 32 0 32 0" stroke="${C.clay}" stroke-width="2.5" fill="${C.clay}" fill-opacity="0.18"/>
    <path d="M48 64c2-1 4-1 6 0M66 64c2-1 4-1 6 0" stroke="${C.clay}" stroke-width="1" fill="none"/>`),

  "40-exfoliative-cheilitis": wrap(lips(2) + `
    <g stroke="${C.gray}" stroke-width="1" fill="none">
      <path d="M44 60l4-3 4 3M56 60l4-3 4 3M68 60l4-3 4 3"/>
      <path d="M48 66l3 3 3-3M60 66l3 3 3-3"/>
    </g>`),

  "45-cutaneous-amyloidosis": wrap(`
    ${lowerLeg(1.8)}
    <g fill="${C.ochre}" fill-opacity="0.45" stroke="${C.ink}" stroke-width="1.1">
      <circle cx="52" cy="42" r="3"/><circle cx="64" cy="44" r="3"/><circle cx="56" cy="52" r="3"/>
      <circle cx="68" cy="56" r="3"/><circle cx="52" cy="64" r="3"/><circle cx="62" cy="66" r="3"/>
      <circle cx="56" cy="76" r="3"/><circle cx="66" cy="78" r="3"/>
    </g>`),

  "46-lichen-sclerosus": wrap(`
    <ellipse cx="60" cy="60" rx="28" ry="20" stroke="${C.ink}" stroke-width="1.8" fill="none"/>
    ${patch("M40 54c8-6 32-6 40 0 2 8-6 16-20 16s-22-8-20-16z", C.gray, 0.22, 1.3)}
    <path d="M48 58c2-1 4-1 6 0M66 58c2-1 4-1 6 0" stroke="${C.gray}" stroke-width="1" fill="none"/>
    ${dot(54, 64, 1.5, C.clay, 0.6)}${dot(66, 64, 1.5, C.clay, 0.6)}`),

  "47-prurigo-pigmentosa": wrap(`
    ${torsoFront(1.6)}
    <g stroke="${C.clay}" stroke-width="1.2" fill="${C.clay}" fill-opacity="0.16">
      <rect x="44" y="44" width="8" height="8"/><rect x="56" y="44" width="8" height="8"/><rect x="68" y="44" width="8" height="8"/>
      <rect x="50" y="52" width="8" height="8"/><rect x="62" y="52" width="8" height="8"/>
      <rect x="44" y="62" width="8" height="8"/><rect x="56" y="62" width="8" height="8"/><rect x="68" y="62" width="8" height="8"/>
      <rect x="50" y="72" width="8" height="8"/><rect x="62" y="72" width="8" height="8"/>
    </g>`),

  // ===== 真菌感染（手/足/甲 + 环形/脱屑）=====
  "19-folliculitis": wrap(`
    ${torsoFront(1.6)}
    <g stroke="${C.ink}" stroke-width="0.9" fill="none" opacity="0.4">
      <line x1="48" y1="42" x2="48" y2="48"/><line x1="58" y1="40" x2="58" y2="46"/><line x1="68" y1="42" x2="68" y2="48"/>
      <line x1="50" y1="58" x2="50" y2="64"/><line x1="62" y1="56" x2="62" y2="62"/><line x1="72" y1="58" x2="72" y2="64"/>
      <line x1="48" y1="76" x2="48" y2="82"/><line x1="60" y1="74" x2="60" y2="80"/><line x1="70" y1="76" x2="70" y2="82"/>
    </g>
    <g fill="${C.sage}" fill-opacity="0.55" stroke="${C.sage}" stroke-width="1.1">
      <circle cx="48" cy="48" r="2.6"/><circle cx="58" cy="46" r="2.6"/><circle cx="68" cy="48" r="2.6"/>
      <circle cx="50" cy="64" r="2.6"/><circle cx="62" cy="62" r="2.6"/><circle cx="72" cy="64" r="2.6"/>
      <circle cx="48" cy="82" r="2.6"/><circle cx="60" cy="80" r="2.6"/><circle cx="70" cy="82" r="2.6"/>
    </g>`),

  "20-onychomycosis": wrap(nail(2) + `
    ${patch("M46 34h28c0 6 0 12-2 18-2 6-6 10-12 10s-10-4-12-10c-2-6-2-12-2-18z", C.ochre, 0.3, 1.3)}
    <path d="M50 40l3 30M60 40l3 30M70 40l3 30" stroke="${C.ink}" stroke-width="0.8" fill="none" opacity="0.5"/>`),

  "21-tinea-manuum-pedis": wrap(footSole(2) + `
    <circle cx="52" cy="64" r="10" stroke="${C.sage}" stroke-width="1.6" fill="${C.sage}" fill-opacity="0.14" stroke-dasharray="3 2"/>
    <circle cx="52" cy="64" r="5" stroke="${C.sage}" stroke-width="1.2" fill="none"/>
    <g fill="${C.sage}"><circle cx="46" cy="78" r="1.2"/><circle cx="52" cy="82" r="1.2"/><circle cx="58" cy="78" r="1.2"/></g>`),

  "22-tinea-corporis-cruis": wrap(`
    ${arm(1.8)}
    <circle cx="60" cy="50" r="12" stroke="${C.sage}" stroke-width="1.6" fill="${C.sage}" fill-opacity="0.12" stroke-dasharray="3 2"/>
    <circle cx="60" cy="50" r="7" stroke="${C.sage}" stroke-width="1.2" fill="none"/>
    <circle cx="60" cy="50" r="3" stroke="${C.sage}" stroke-width="1" fill="none"/>`),

  "23-pityriasis-versicolor": wrap(`
    ${torsoFront(1.6)}
    <g fill="${C.ochre}" fill-opacity="0.32" stroke="${C.ochre}" stroke-width="1.1">
      <ellipse cx="50" cy="48" rx="6" ry="4"/><ellipse cx="66" cy="50" rx="7" ry="5"/>
      <ellipse cx="56" cy="62" rx="6" ry="4"/><ellipse cx="70" cy="68" rx="6" ry="4"/>
      <ellipse cx="50" cy="76" rx="5" ry="4"/>
    </g>`),

  // ===== 疣类（手/足 + 突起）=====
  "28-filiform-wart": wrap(faceFront(1.6) + `
    <g stroke="${C.ink}" stroke-width="1.4" fill="none">
      <path d="M72 60c0-8 4-14 8-18"/>
      <path d="M74 56c-2-1-4-1-6 0M78 50c-2-1-4-1-6 0"/>
    </g>
    ${dot(80, 42, 2.5, C.sage, 0.4)}`),

  "29-flat-wart": wrap(faceFront(1.6) + `
    <g fill="${C.ochre}" fill-opacity="0.32" stroke="${C.ochre}" stroke-width="1.1">
      <ellipse cx="50" cy="52" rx="4" ry="2.5"/><ellipse cx="60" cy="48" rx="4" ry="2.5"/>
      <ellipse cx="70" cy="54" rx="4" ry="2.5"/><ellipse cx="56" cy="60" rx="4" ry="2.5"/>
    </g>`),

  "30-common-wart": wrap(handBack(2) + `
    <circle cx="60" cy="54" r="7" stroke="${C.ink}" stroke-width="1.6" fill="${C.sage}" fill-opacity="0.16"/>
    <g stroke="${C.ink}" stroke-width="1" fill="none">
      <circle cx="57" cy="52" r="1.5"/><circle cx="63" cy="52" r="1.5"/><circle cx="60" cy="56" r="1.5"/>
    </g>`),

  "31-plantar-wart": wrap(footSole(2) + `
    <circle cx="52" cy="64" r="9" fill="${C.sage}" fill-opacity="0.18" stroke="${C.sage}" stroke-width="1.6" stroke-dasharray="2 2"/>
    <g stroke="${C.sage}" stroke-width="1" fill="none">
      <circle cx="48" cy="61" r="1.5"/><circle cx="56" cy="61" r="1.5"/><circle cx="52" cy="67" r="1.5"/>
    </g>`),

  // ===== 脱发（头皮 + 发际线）=====
  "32-androgenetic-alopecia": wrap(scalpTop(2) + `
    <ellipse cx="60" cy="56" rx="16" ry="14" fill="none" stroke="${C.ochre}" stroke-width="1.4" stroke-dasharray="3 2.5"/>
    <g stroke="${C.ink}" stroke-width="1" fill="none" opacity="0.5">
      <line x1="40" y1="48" x2="40" y2="54"/><line x1="46" y1="44" x2="46" y2="52"/>
      <line x1="74" y1="44" x2="74" y2="52"/><line x1="80" y1="48" x2="80" y2="54"/>
    </g>
    <ellipse cx="60" cy="56" rx="10" ry="9" fill="#fff" opacity="0.7"/>`),

  "33-alopecia-areata": wrap(scalpTop(2) + `
    <g stroke="${C.ink}" stroke-width="1" fill="none" opacity="0.4">
      <line x1="38" y1="46" x2="38" y2="54"/><line x1="46" y1="42" x2="46" y2="52"/>
      <line x1="54" y1="40" x2="54" y2="50"/><line x1="66" y1="40" x2="66" y2="50"/>
      <line x1="74" y1="42" x2="74" y2="52"/><line x1="82" y1="46" x2="82" y2="54"/>
      <line x1="40" y1="68" x2="40" y2="76"/><line x1="80" y1="68" x2="80" y2="76"/>
    </g>
    <circle cx="60" cy="60" r="10" fill="#fff" stroke="${C.clay}" stroke-width="1.6" stroke-dasharray="2 2"/>
    <text x="60" y="63" font-size="7" fill="${C.clay}" text-anchor="middle">!</text>`),

  "34-cicatricial-alopecia": wrap(scalpTop(2) + `
    <g fill="${C.clay}" fill-opacity="0.3" stroke="${C.clay}" stroke-width="1.2">
      <circle cx="46" cy="52" r="5"/><circle cx="64" cy="48" r="6"/><circle cx="76" cy="56" r="5"/>
    </g>`),

  "35-postpartum-telogen-effluvium": wrap(scalpTop(2) + `
    <g stroke="${C.ink}" stroke-width="0.9" fill="none" opacity="0.45">
      <line x1="36" y1="44" x2="36" y2="52"/><line x1="44" y1="40" x2="44" y2="50"/>
      <line x1="52" y1="38" x2="52" y2="48"/><line x1="60" y1="36" x2="60" y2="46"/>
      <line x1="68" y1="38" x2="68" y2="48"/><line x1="76" y1="40" x2="76" y2="50"/>
      <line x1="84" y1="44" x2="84" y2="52"/>
    </g>
    <g stroke="${C.gray}" stroke-width="0.9" fill="none">
      <path d="M34 42l6 3M82 42l-6 3M34 78l6-3M82 78l-6-3"/>
    </g>`),

  // ===== 其他 =====
  "36-focal-hyperhidrosis": wrap(handBack(2) + `
    <g fill="${C.sage}" fill-opacity="0.5">
      <path d="M52 50c-1 4-2 8-1 12 1 2 2 3 3 2 1-1 1-3 0-5-1-3-1-6-2-9z"/>
      <path d="M62 52c-1 3-1 6 0 9"/>
    </g>
    ${dot(46, 56, 1.5, C.sage, 0.55)}${dot(72, 56, 1.5, C.sage, 0.55)}
    ${dot(50, 70, 1.5, C.sage, 0.55)}${dot(68, 70, 1.5, C.sage, 0.55)}`),

  "37-tattoo-removal": wrap(`
    ${arm(1.8)}
    <g stroke="${C.ink}" stroke-width="1.2" fill="none">
      <path d="M50 40c4-3 8-3 12 0M52 50c4-3 8-3 12 0M50 60c4-3 8-3 12 0M52 70c4-3 8-3 12 0"/>
    </g>
    <g stroke="${C.clay}" stroke-width="1" fill="none">
      <path d="M44 36l-4-4M72 36l4-4M44 82l-4 4M72 82l4 4"/>
    </g>`),

  // ===== 血管（放射/血丝）=====
  "48-spider-nevus": wrap(faceFront(1.6) + `
    <g stroke="${C.clay}" stroke-width="1.2" fill="none">
      <path d="M58 60c-4-6-8-10-12-12M62 60c4-6 8-10 12-12"/>
      <path d="M58 62c-6 2-10 4-12 8M62 62c6 2 10 4 12 8"/>
      <path d="M60 56c0-4 0-8-2-12M60 64c0 4 0 8-2 12"/>
    </g>
    ${dot(60, 60, 3.5, C.clay, 0.9)}`),

  "49-facial-telangiectasia": wrap(faceFront(1.8) + `
    <g stroke="${C.clay}" stroke-width="1.1" fill="none">
      <path d="M46 54c-2 4-2 8 0 12M52 52c-2 4-2 10 0 14"/>
      <path d="M68 52c2 4 2 10 0 14M74 54c2 4 2 8 0 12"/>
      <path d="M58 60c-1 3-1 6 0 9"/>
    </g>`),

  // ===== 良性肿物（脸 + 丘疹）=====
  "24-syringoma": wrap(faceFront(1.6) + `
    <ellipse cx="60" cy="74" rx="20" ry="8" fill="none" stroke="${C.gray}" stroke-width="0.9" stroke-dasharray="2 2" opacity="0.5"/>
    <g fill="${C.ochre}" fill-opacity="0.4" stroke="${C.ochre}" stroke-width="1">
      <ellipse cx="50" cy="72" rx="3" ry="2"/><ellipse cx="56" cy="70" rx="3" ry="2"/>
      <ellipse cx="64" cy="70" rx="3" ry="2"/><ellipse cx="70" cy="72" rx="3" ry="2"/>
    </g>`),

  "25-milia": wrap(faceFront(1.6) + `
    <g fill="#fff" stroke="${C.ochre}" stroke-width="1.2">
      <circle cx="50" cy="70" r="2.5"/><circle cx="58" cy="68" r="2.5"/>
      <circle cx="66" cy="70" r="2.5"/><circle cx="54" cy="76" r="2.5"/><circle cx="64" cy="76" r="2.5"/>
    </g>`),

  "26-sebaceous-hyperplasia": wrap(faceFront(1.6) + `
    <g stroke="${C.ochre}" stroke-width="1.3" fill="${C.ochre}" fill-opacity="0.3">
      <circle cx="50" cy="60" r="4"/><circle cx="66" cy="56" r="4"/><circle cx="74" cy="62" r="4"/>
    </g>
    <g fill="none" stroke="${C.ink}" stroke-width="1">
      <circle cx="50" cy="60" r="1.2"/><circle cx="66" cy="56" r="1.2"/><circle cx="74" cy="62" r="1.2"/>
    </g>`),

  "27-fordyce-spots": wrap(lips(2) + `
    <g fill="${C.ochre}" fill-opacity="0.55" stroke="${C.ochre}" stroke-width="0.9">
      <circle cx="38" cy="58" r="1.8"/><circle cx="44" cy="56" r="1.8"/><circle cx="78" cy="56" r="1.8"/>
      <circle cx="84" cy="58" r="1.8"/><circle cx="42" cy="62" r="1.6"/><circle cx="80" cy="62" r="1.6"/>
    </g>`),

  // ===== 医美相关 =====
  "50-filler-nodules": wrap(faceFront(1.6) + `
    <g fill="${C.clay}" fill-opacity="0.32" stroke="${C.clay}" stroke-width="1.2">
      <circle cx="50" cy="58" r="4"/><circle cx="70" cy="56" r="4"/><circle cx="60" cy="70" r="4.5"/>
    </g>`),

  // ===== 感染性（唇 + 水疱）=====
  "53-recurrent-herpes-simplex": wrap(lips(2) + `
    <g stroke="${C.clay}" stroke-width="1.2" fill="${C.clay}" fill-opacity="0.32">
      <circle cx="46" cy="52" r="2.5"/><circle cx="52" cy="50" r="2.5"/>
      <circle cx="58" cy="50" r="2.5"/><circle cx="64" cy="52" r="2.5"/>
    </g>
    <path d="M44 46c4-2 28-2 32 0" stroke="${C.clay}" stroke-width="1" fill="none" opacity="0.5"/>`),

  "54-postherpetic-pigmentation": wrap(`
    ${torsoFront(1.6)}
    ${patch("M44 40c4-4 12-4 16 0l4 36c-8 4-16 4-24 0l4-36z", C.ochre, 0.3, 1.4)}
    <g stroke="${C.clay}" stroke-width="1.1" fill="none">
      <path d="M48 50c2-2 6-2 8 0M52 64c2-2 6-2 8 0"/>
    </g>`),

  // ===== 白癜风 =====
  "44-stable-vitiligo": wrap(`
    ${handBack(2)}
    <path d="M48 48c4-4 10-4 14 0 2 4-2 8-6 8s-10-4-8-8z" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>
    <path d="M62 62c3-3 8-3 11 0 2 3-1 7-4 7s-9-3-7-7z" fill="#fff" stroke="${C.ink}" stroke-width="1.4"/>`)
};

function fallback(cond) {
  return wrap(`
    <circle cx="60" cy="60" r="30" stroke="${C.gray}" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>
    <text x="60" y="68" font-size="28" fill="${C.gray}" fill-opacity="0.4" text-anchor="middle">${cond.glyph || "·"}</text>`);
}

let made = 0, used = 0;
DATA.forEach(cond => {
  const svg = ART[cond.slug] || (used++, fallback(cond));
  fs.writeFileSync(path.join(OUT, cond.slug + ".svg"), svg);
  made++;
});

const missing = DATA.filter(c => !ART[c.slug]).map(c => c.slug);
console.log("Generated " + made + " SVGs (" + (made - used) + " bespoke, " + used + " fallback).");
if (missing.length) console.log("Fallback:\n  " + missing.join("\n  "));
