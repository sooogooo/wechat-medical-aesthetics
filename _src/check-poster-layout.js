#!/usr/bin/env node
/* 海报静态布局核查：按字宽模型估算每个 <text> 的渲染宽度，
 * 检查 (1) 超出白卡边界 (2) 溢出所在容器矩形。只报问题，不改文件。 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '腹壁整形科普系列', 'images-poster');

const CLASS_SIZE = { series: 13, title: 32, kicker: 16, nodeTitle: 18, midTitle: 16, body: 15, small: 13, num: 28, quote: 18, footer: 12 };

function charW(ch, em) {
  const cp = ch.codePointAt(0);
  if (ch === ' ') return 0.3 * em;
  if (ch === '·' || ch === '．') return 0.4 * em;
  if (cp >= 0x2e80 && cp <= 0x9fff) return em;            // CJK
  if (cp >= 0x3000 && cp <= 0x303f) return em;            // CJK 标点
  if (cp >= 0xff00 && cp <= 0xffef) return em;            // 全角标点
  if (/[A-Z0-9]/.test(ch)) return 0.62 * em;
  return 0.5 * em;
}

function textWidth(s, em) {
  let w = 0;
  for (const ch of s) w += charW(ch, em);
  return w;
}

const files = fs.readdirSync(DIR).filter((f) => /^[A-D]\d-0[12]\.svg$/.test(f));
let issues = 0;
for (const f of files) {
  const svg = fs.readFileSync(path.join(DIR, f), 'utf8');
  const texts = [...svg.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map((m) => {
    const attrs = m[1];
    const cls = (attrs.match(/class="([^"]+)"/) || [])[1] || '';
    const inline = (attrs.match(/font-size="(\d+)"/) || [])[1];
    const em = inline ? +inline : CLASS_SIZE[cls] || 15;
    const x = +((attrs.match(/x="([-\d.]+)"/) || [])[1]);
    const y = +((attrs.match(/y="([-\d.]+)"/) || [])[1]);
    const anchor = (attrs.match(/text-anchor="(\w+)"/) || [])[1] || 'start';
    return { t: m[2], em, x, y, anchor, w: textWidth(m[2], em) };
  });
  const rects = [...svg.matchAll(/<rect ([^>]*)\/?>/g)].map((m) => {
    const a = m[1];
    return {
      x: +((a.match(/x="([-\d.]+)"/) || [])[1] || 0),
      y: +((a.match(/y="([-\d.]+)"/) || [])[1] || 0),
      w: +((a.match(/width="([-\d.]+)"/) || [])[1] || 0),
      h: +((a.match(/height="([-\d.]+)"/) || [])[1] || 0),
    };
  });
  const bad = [];
  for (const tx of texts) {
    let x0, x1;
    if (tx.anchor === 'middle') { x0 = tx.x - tx.w / 2; x1 = tx.x + tx.w / 2; }
    else if (tx.anchor === 'end') { x0 = tx.x - tx.w; x1 = tx.x; }
    else { x0 = tx.x; x1 = tx.x + tx.w; }
    if (x0 < 38 || x1 > 862) bad.push(`  超出白卡: "${tx.t}" 占位[${Math.round(x0)},${Math.round(x1)}]`);
    let box = null;
    for (const r of rects) {
      if (r.w >= 830) continue;
      if (r.x <= x0 + 2 && r.x + r.w >= x0 && r.y <= tx.y - 4 && r.y + r.h >= tx.y - Math.max(16, tx.em)) {
        if (!box || r.w * r.h < box.w * box.h) box = r;
      }
    }
    if (box && x1 > box.x + box.w + 2) bad.push(`  溢出容器(宽${box.w}): "${tx.t}" 右缘 ${Math.round(x1)} > ${box.x + box.w}`);
  }
  if (bad.length) { issues += bad.length; console.log(`${f}：`); console.log(bad.join('\n')); }
}
console.log(issues ? `共 ${issues} 处待复核` : `全部 ${files.length} 张：未发现横向溢出`);
