#!/usr/bin/env node
/* 腹壁整形科普系列 · SVG 海报生成器（12 篇 × 2 张）· 极简版
 * 风格：白底、细线（1px 级）、细字重（300/400）、无底色填充，
 * 颜色只用于描边、小色块与重点文字。文案禁用全角冒号。
 * 运行：node _src/build-abdominoplasty-posters.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '腹壁整形科普系列', 'images-poster');

const FONT = "'Microsoft YaHei','Noto Sans CJK SC',sans-serif";

/* 语义色只作描边与强调，不做大面积底色 */
const C = {
  blue:   { main: '#0072B2' },
  sky:    { main: '#56B4E9' },
  amber:  { main: '#D9930D' },
  red:    { main: '#C75B00' },
  dred:   { main: '#A64200' },
  green:  { main: '#0B8A6B' },
  purple: { main: '#B36A98' },
};

const HAIR = '#e3e9ea';   // 发丝线
const ARROW = '#b7c6cb';  // 箭头/轴线
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* 内容节点卡：细描边、空心序号、正文灰阶、底部彩色小字（无底色框） */
function card({ x, y, w, h, c, num, name, lines, tip, note }) {
  const k = C[c];
  let s = `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.main}" stroke-width="1.2"/>`;
  let ty;
  if (num) {
    s += `\n  <circle cx="${x + 40}" cy="${y + 36}" r="17" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
       + `\n  <text x="${x + 40}" y="${y + 42}" font-family="${FONT}" font-size="16" style="fill:${k.main}" text-anchor="middle">${esc(num)}</text>`
       + `\n  <text x="${x + 70}" y="${y + 42}" class="nodeTitle">${esc(name)}</text>`;
    ty = y + 78;
  } else {
    s += `\n  <text x="${x + 22}" y="${y + 38}" class="nodeTitle">${esc(name)}</text>`;
    ty = y + 72;
  }
  (lines || []).forEach((ln) => {
    s += `\n  <text x="${x + 22}" y="${ty}" class="body">${esc(ln)}</text>`;
    ty += 26;
  });
  if (tip) {
    const arr = Array.isArray(tip) ? tip : [tip];
    let q = y + h - 12 - (arr.length - 1) * 20;
    arr.forEach((ln) => {
      s += `\n  <text x="${x + w / 2}" y="${q}" class="small" style="fill:${k.main}" text-anchor="middle">${esc(ln)}</text>`;
      q += 20;
    });
  }
  if (note) {
    s += `\n  <text x="${x + w / 2}" y="${y + h - 12}" class="small" style="fill:${k.main}" text-anchor="middle">${esc(note)}</text>`;
  }
  return s;
}

function svgDoc({ code, desc, no, title, kicker, body, quote, foot }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620" role="img" aria-labelledby="title${code} desc${code}">
  <title id="title${code}">${esc(title)}</title>
  <desc id="desc${code}">${esc(desc)}</desc>
  <defs>
    <marker id="ah${code}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${ARROW}"/>
    </marker>
    <style>
      .series { font: 400 13px ${FONT}; letter-spacing:1.8px; fill:#7d97a4; }
      .title { font: 300 32px ${FONT}; fill:#22333b; }
      .kicker { font: 400 16px ${FONT}; fill:#7a8a90; }
      .nodeTitle { font: 500 18px ${FONT}; fill:#22333b; }
      .midTitle { font: 500 16px ${FONT}; fill:#22333b; }
      .body { font: 400 15px ${FONT}; fill:#4a5a60; }
      .small { font: 400 13px ${FONT}; fill:#7a8a90; }
      .quote { font: 400 18px ${FONT}; fill:#22333b; }
      .footer { font: 400 12px ${FONT}; fill:#93a3a8; }
    </style>
  </defs>
  <rect x="0.5" y="0.5" width="899" height="619" fill="#ffffff" stroke="#dde5e7" stroke-width="1"/>
  <text x="62" y="64" class="series">腹壁整形 12 讲 · ${esc(no)}</text>
  <text x="62" y="112" class="title">${esc(title)}</text>
  <text x="62" y="148" class="kicker">${esc(kicker)}</text>
  <line x1="62" y1="172" x2="838" y2="172" stroke="${HAIR}" stroke-width="1"/>
${body}
  <line x1="62" y1="520" x2="838" y2="520" stroke="${HAIR}" stroke-width="1"/>
  <text x="450" y="548" class="quote" text-anchor="middle">${esc(quote)}</text>
  <text x="62" y="580" class="footer">${esc(foot)}</text>
</svg>
`;
}

function makeG(code) {
  const ah = `url(#ah${code})`;
  return {
    card,
    arrow: (x1, y1, x2, y2) =>
      `\n  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ARROW}" stroke-width="1.2" marker-end="${ah}"/>`,
    txt: (x, y, cls, t, anchor, color) =>
      `\n  <text x="${x}" y="${y}" class="${cls}"${anchor ? ` text-anchor="${anchor}"` : ''}${color ? ` style="fill:${color}"` : ''}>${esc(t)}</text>`,
    rect: (x, y, w, h, fill, o = {}) =>
      `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx != null ? o.rx : 10}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1.2}"` : ''}/>`,
    circle: (cx, cy, r, fill) => `\n  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`,
    ring: (cx, cy, r, color, sw = 1.2) =>
      `\n  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>`,
    line: (x1, y1, x2, y2, stroke, sw = 1) =>
      `\n  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"/>`,
    /* 极简药丸：细描边，无底色 */
    chip: (x, y, w, h, c, t) => {
      const k = C[c];
      return `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
           + `\n  <text x="${x + w / 2}" y="${y + h / 2 + 5}" class="small" text-anchor="middle">${esc(t)}</text>`;
    },
    /* 序号条：空心圈序号 + 文字 */
    numChip: (x, y, w, h, c, num, t) => {
      const k = C[c];
      return `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
           + `\n  <circle cx="${x + 30}" cy="${y + h / 2}" r="13" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
           + `\n  <text x="${x + 30}" y="${y + h / 2 + 5}" font-family="${FONT}" font-size="15" style="fill:${k.main}" text-anchor="middle">${esc(num)}</text>`
           + `\n  <text x="${x + 56}" y="${y + h / 2 + 5}" class="body">${esc(t)}</text>`;
    },
    /* 警示条：空心红圈 × + 文字，无底色 */
    warnChip: (x, y, w, h, t, sub) => {
      const k = C.red;
      let s = `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
            + `\n  <circle cx="${x + 32}" cy="${y + h / 2}" r="12" fill="none" stroke="${k.main}" stroke-width="1.2"/>`
            + `\n  <text x="${x + 32}" y="${y + h / 2 + 6}" font-family="${FONT}" font-size="15" style="fill:${k.main}" text-anchor="middle">×</text>`
            + `\n  <text x="${x + 58}" y="${y + h / 2 + (sub ? 0 : 5)}" class="body">${esc(t)}</text>`;
      if (sub) s += `\n  <text x="${x + 58}" y="${y + h / 2 + 20}" class="small">${esc(sub)}</text>`;
      return s;
    },
    C, HAIR, ARROW,
  };
}

/* ============ 24 张海报（极简版，文案无冒号） ============ */
const posters = [
  /* ---------- A1 ---------- */
  {
    file: 'A1-01.svg', no: 'A1',
    title: '先分清肚子松垮的四种来源',
    kicker: '来源不同，处理完全不同，抽脂解决脂肪，腹壁成形解决皮肤和肌肉',
    desc: '腹部问题四种来源，脂肪堆积、皮肤松弛、腹直肌分离、腹壁疝，处理各不相同',
    quote: '先分清来源再谈方案，选错工具白受罪',
    foot: '医学教育示意 · 判断需面诊与体格检查 · 混合型以主要矛盾定方案',
    body(g) {
      const cards = [
        { x: 62, y: 205, c: 'blue', num: '1', name: '脂肪堆积', lines: ['捏起来厚厚一层，皮肤有弹性', '仰卧时腹部变平'], note: '以抽脂或减脂为主，无需四级手术' },
        { x: 478, y: 205, c: 'amber', num: '2', name: '皮肤松弛', lines: ['皮多、软、下垂，常伴妊娠纹', '捏起来皮多肉少'], note: '需切除多余皮肤（腹壁成形）' },
        { x: 62, y: 357, c: 'red', num: '3', name: '腹直肌分离', lines: ['腹白线变宽，肚子鼓、无力', '运动也收不回'], note: '需手术收紧肌层（四级手术）' },
        { x: 478, y: 357, c: 'purple', num: '4', name: '腹壁疝', lines: ['缺损处突出，平躺可回纳', '可摸到明确的洞边'], note: '需外科修复，另行评估' },
      ];
      return cards.map((o) => g.card({ ...o, w: 380, h: 140 })).join('\n');
    },
  },
  {
    file: 'A1-02.svg', no: 'A1',
    title: '面诊前的两个自测',
    kicker: '捏皮测试看皮肤，抬肩测试看肌分离，自测只是初步参照',
    desc: '捏皮测试与抬肩测试的步骤和判断要点，自测不能替代医生检查',
    quote: '带着初步判断去面诊，而不是自己定方案',
    foot: '医学教育示意 · 自测不能替代医生体格检查与影像评估',
    body(g) {
      let s = g.card({ x: 62, y: 205, w: 380, h: 230, c: 'amber', name: '捏皮测试（看皮肤）', lines: ['站立位，捏起下腹皮肤', '厚而有弹性，偏脂肪型', '松而皮多、下垂，偏皮肤型'], tip: '分不清，多半是混合型' });
      s += '\n' + g.card({ x: 478, y: 205, w: 380, h: 230, c: 'blue', name: '抬肩测试（看肌分离）', lines: ['仰卧屈膝，抬头像半个卷腹', '手指横按肚脐上下的腹白线', '感受中间那条沟的宽度'], tip: '明显宽于两指提示可能分离' });
      s += g.txt(450, 482, 'small', '自测仅供初步判断，不能替代医生体格检查，最终以面诊为准', 'middle', C.red.main);
      return s;
    },
  },

  /* ---------- A2 ---------- */
  {
    file: 'A2-01.svg', no: 'A2',
    title: '腹直肌分离是怎么形成的',
    kicker: '妊娠撑开腹白线，产后有人收得回，有人收不回',
    desc: '腹直肌分离形成机制，孕期腹白线撑开、腹直肌分开、产后部分不能恢复',
    quote: '分开的不是肌肉力量，是筋膜结构',
    foot: '医学教育示意 · 分离程度与处理以面诊评估为准',
    body(g) {
      const nodes = [
        { x: 62, c: 'blue', num: '1', name: '孕期', lines: ['子宫膨大＋激素变化', '腹白线被撑开、变薄'] },
        { x: 317, c: 'amber', num: '2', name: '分离', lines: ['两侧腹直肌向两边分开', '腹壁兜不住内脏'] },
        { x: 572, c: 'red', num: '3', name: '产后', lines: ['部分人能自行恢复', '部分人收不回、有症状'] },
      ];
      let s = nodes.map((o) => g.card({ ...o, y: 205, w: 225, h: 150 })).join('\n');
      s += g.arrow(291, 280, 311, 280) + g.arrow(546, 280, 566, 280);
      s += g.txt(62, 400, 'small', '常见表现（不只影响外观）');
      const chips = ['肚子前突', '腹壁无力', '腰背酸痛', '起身费力'];
      chips.forEach((t, i) => { s += '\n' + g.chip(62 + i * 192, 414, 178, 44, 'sky', t); });
      return s;
    },
  },
  {
    file: 'A2-02.svg', no: 'A2',
    title: '分离到什么程度，才考虑手术',
    kicker: '轻度首选康复训练，重度伴功能障碍才谈手术',
    desc: '腹直肌分离按宽度分度，两指以内观察、2～3 指康复训练、3 指以上面诊评估',
    quote: '把手术留给康复搞不定的情况',
    foot: '医学教育示意 · 是否手术由资质医师评估 · 康复训练需专业指导',
    body(g) {
      const cards = [
        { x: 62, c: 'green', name: '两指以内', lines: ['基本正常', '观察即可，无需特殊处理'], tip: '别盲目做卷腹' },
        { x: 324, c: 'amber', name: '2～3 指', lines: ['轻到中度分离', '首选产后康复训练', '核心训练＋呼吸控制', '需要专业指导'], tip: '训练数月无改善再评估' },
        { x: 586, c: 'red', name: '3 指以上', lines: ['中重度分离', '面诊评估，超声测量', '训练无效伴功能障碍', '才考虑手术收紧'], tip: '收紧肌层属四级手术' },
      ];
      return cards.map((o) => g.card({ ...o, y: 205, w: 250, h: 270 })).join('\n');
    },
  },

  /* ---------- A3 ---------- */
  {
    file: 'A3-01.svg', no: 'A3',
    title: '围裙肚是皮肤过剩，不是脂肪',
    kicker: '脂肪没了，被撑大的皮肤缩不回去',
    desc: '围裙肚形成过程，肥胖撑大皮肤、弹性受损、减重后皮肤过剩垂坠',
    quote: '这是皮肤过剩，抽脂帮不上',
    foot: '医学教育示意 · 症状与程度因人而异 · 需面诊评估',
    body(g) {
      const nodes = [
        { x: 62, c: 'blue', num: '1', name: '长期肥胖', lines: ['皮肤被持续撑大'] },
        { x: 260, c: 'amber', num: '2', name: '弹性受损', lines: ['弹力纤维断裂退化', '妊娠纹即痕迹'] },
        { x: 458, c: 'sky', num: '3', name: '大幅减重', lines: ['脂肪消退', '体积明显缩小'] },
        { x: 656, c: 'red', num: '4', name: '皮肤过剩', lines: ['缩不回、垂坠', '形成围裙状'] },
      ];
      let s = nodes.map((o) => g.card({ ...o, y: 205, w: 172, h: 150 })).join('\n');
      s += g.arrow(238, 280, 256, 280) + g.arrow(436, 280, 454, 280) + g.arrow(634, 280, 652, 280);
      s += g.txt(62, 386, 'small', '带来的常不只是外观问题');
      const chips = ['皱褶反复湿疹感染', '活动与穿衣受限', '清洁困难', '接近功能重建'];
      chips.forEach((t, i) => { s += '\n' + g.chip(62 + i * 192, 400, 178, 44, 'sky', t); });
      return s;
    },
  },
  {
    file: 'A3-02.svg', no: 'A3',
    title: '减重后手术，先看时机再选术式',
    kicker: '体重稳定是前提，术式看松弛的范围和方向',
    desc: '减重后腹壁整形的时机条件与术式对应关系',
    quote: '体重不稳就动刀，等于白切',
    foot: '医学教育示意 · 手术时机与术式以主刀评估为准',
    body(g) {
      let s = g.card({ x: 62, y: 205, w: 380, h: 250, c: 'amber', name: '手术时机（先满足）', lines: ['体重稳定至少 6 个月', '减重术后，稳定 1～2 年', '营养指标达标（蛋白质等）', '心理准备，切口大、恢复长'] });
      s += '\n' + g.card({ x: 478, y: 205, w: 380, h: 250, c: 'blue', name: '术式对应（看松弛范围）', lines: ['环形切口，覆盖整圈松弛', '倒 T 型，横向纵向都过剩', '标准型，仅前腹松弛', '迷你型，此类人群少用'] });
      s += g.txt(450, 488, 'small', '具体时机与术式由面诊评估决定', 'middle');
      return s;
    },
  },

  /* ---------- B1 ---------- */
  {
    file: 'B1-01.svg', no: 'B1',
    title: '五种术式的切口与适用对照',
    kicker: '迷你、标准、延伸、环形、倒 T，按松弛范围分',
    desc: '五种腹壁成形术式的切口位置与适用人群对照',
    quote: '没有最好的术式，只有对应的术式',
    foot: '医学教育示意 · 术式选择以面诊体格检查为准 · 切口设计因人而异',
    body(g) {
      const rows = [
        { c: 'blue', name: '迷你型', cut: '下腹短横切口', fit: '下腹局限松弛、上腹良好' },
        { c: 'green', name: '标准型', cut: '髋到髋横切口', fit: '中度松弛＋腹直肌分离' },
        { c: 'amber', name: '延伸型', cut: '横切口绕到侧腰', fit: '松弛延及侧腰' },
        { c: 'red', name: '环形', cut: '绕躯干一周', fit: '减重后整圈松弛' },
        { c: 'purple', name: '倒 T 型', cut: '横＋正中纵切口', fit: '横向纵向皮肤都过剩' },
      ];
      let s = g.txt(96, 206, 'small', '术式') + g.txt(250, 206, 'small', '切口位置') + g.txt(470, 206, 'small', '适合人群');
      rows.forEach((r, i) => {
        const y = 218 + i * 58;
        const k = C[r.c];
        s += '\n' + g.line(66, y + 6, 66, y + 38, k.main, 2);
        s += g.txt(96, y + 32, 'midTitle', r.name, 'start', k.main);
        s += g.txt(250, y + 32, 'body', r.cut);
        s += g.txt(470, y + 32, 'body', r.fit);
        if (i < rows.length - 1) s += g.line(62, y + 50, 838, y + 50, g.HAIR, 1);
      });
      return s;
    },
  },
  {
    file: 'B1-02.svg', no: 'B1',
    title: '术式不是选出来的，是松出来的',
    kicker: '松弛范围越大，需要的术式越广',
    desc: '按松弛程度递进的术式选择，迷你型到环形、倒 T 型',
    quote: '术式由松弛范围决定，不是想小就能小',
    foot: '医学教育示意 · 术式由松弛范围决定，非个人意愿选择',
    body(g) {
      const steps = [
        { h: 100, c: 'blue', name: '迷你型', lines: ['下腹局限松弛'] },
        { h: 140, c: 'green', name: '标准型', lines: ['全前腹＋肌分离'] },
        { h: 180, c: 'amber', name: '延伸型', lines: ['延及侧腰'] },
        { h: 220, c: 'red', name: '环形／倒 T', lines: ['整圈或两向过剩'] },
      ];
      const base = 478;
      let s = g.line(62, base, 832, base, g.HAIR, 1);
      steps.forEach((st, i) => {
        const x = 62 + i * 196;
        const y = base - st.h;
        const k = C[st.c];
        s += '\n' + g.rect(x, y, 170, st.h, 'none', { stroke: k.main, rx: 8 });
        s += g.txt(x + 85, y - 12, 'midTitle', st.name, 'middle', k.main);
        s += g.txt(x + 85, y + 34, 'body', st.lines[0], 'middle');
        if (i < steps.length - 1) {
          const nx = 62 + (i + 1) * 196;
          s += g.arrow(x + 174, y + 14, nx - 6, base - steps[i + 1].h + 14);
        }
      });
      s += g.txt(450, 506, 'small', '术式由松弛范围决定，不是越大越好，也不是想小就能小', 'middle');
      return s;
    },
  },

  /* ---------- B2 ---------- */
  {
    file: 'B2-01.svg', no: 'B2',
    title: '手术台上的六个步骤',
    kicker: '从切口设计到留置引流，一台四级手术的完整流程',
    desc: '腹壁成形术六个主要步骤，切口设计、掀起皮瓣、收紧腹直肌、切除皮肤、重造脐部、引流缝合',
    quote: '这不是切掉一块皮，是腹壁结构的重建',
    foot: '医学教育示意，非教学图 · 具体操作因术式与个体而异',
    body(g) {
      const steps = [
        { name: '切口设计', lines: ['站立位标记', '切口尽量藏进比基尼线'] },
        { name: '掀起皮瓣', lines: ['皮瓣分离至肋缘', '剥离面大、出血来源'] },
        { name: '收紧腹直肌', lines: ['前鞘折叠缝合', '重建肌层张力'] },
        { name: '切除皮肤', lines: ['拉紧后切除多余部分', '决定疤痕位置长度'] },
        { name: '重造脐部', lines: ['新位置开孔引出', '脐周也会留疤'] },
        { name: '引流缝合', lines: ['留置引流管 1～2 周', '加压包扎'] },
      ];
      let s = '';
      steps.forEach((st, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 62 + col * 270;
        const y = 205 + row * 150;
        s += '\n' + g.card({ x, y, w: 236, h: 130, c: row === 0 ? 'blue' : 'green', num: String(i + 1), name: st.name, lines: st.lines });
        if (col < 2) s += g.arrow(x + 240, y + 65, x + 264, y + 65);
      });
      return s;
    },
  },
  {
    file: 'B2-02.svg', no: 'B2',
    title: '为什么腹壁成形是四级手术',
    kicker: '分级依据是风险，出血、肌层、皮瓣、血栓、麻醉',
    desc: '腹壁成形术被定为四级手术的五个原因',
    quote: '四级，依据的是风险，不是好看程度',
    foot: '医学教育示意 · 四级手术须在有相应资质的医疗机构开展',
    body(g) {
      let s = g.rect(62, 200, 776, 62, 'none', { stroke: C.red.main });
      s += g.txt(450, 226, 'midTitle', '腹壁成形术属四级手术（美容项目最高级别）', 'middle');
      s += g.txt(450, 248, 'small', '分级依据是风险程度，不是效果好坏', 'middle');
      const chips = [
        { name: '剥离面大', lines: ['出血风险高，需备血条件'] },
        { name: '涉及肌层重建', lines: ['腹直肌前鞘折叠缝合'] },
        { name: '皮瓣坏死风险', lines: ['吸烟、糖尿病者更高'] },
        { name: '血栓风险', lines: ['深静脉血栓／肺栓塞需规范预防'] },
        { name: '围术期要求', lines: ['麻醉、监护、住院、血库'] },
      ];
      const pos = [[62, 288], [332, 288], [602, 288], [197, 404], [467, 404]];
      chips.forEach((cp, i) => {
        const [x, y] = pos[i];
        const k = i < 3 ? C.red : C.amber;
        s += '\n' + g.rect(x, y, 236, 96, 'none', { stroke: k.main });
        s += g.txt(x + 118, y + 36, 'midTitle', cp.name, 'middle');
        s += g.txt(x + 118, y + 64, 'small', cp.lines[0], 'middle');
      });
      return s;
    },
  },

  /* ---------- B3 ---------- */
  {
    file: 'B3-01.svg', no: 'B3',
    title: '联合吸脂的利与弊',
    kicker: '一次解决两个问题，代价是皮瓣血供风险',
    desc: '腹壁成形联合吸脂的利益与风险对照',
    quote: '联合不是顺便，是独立的风险决策',
    foot: '医学教育示意 · 联合与抽脂量以主刀血供评估为准',
    body(g) {
      let s = g.card({ x: 62, y: 205, w: 370, h: 250, c: 'green', name: '联合的利', lines: ['一次解决脂肪＋皮肤两个问题', '少一次麻醉与恢复期', '整体轮廓改善更完整'], tip: '前提是血供评估允许' });
      s += '\n' + g.card({ x: 468, y: 205, w: 370, h: 250, c: 'red', name: '联合的弊', lines: ['皮瓣血供进一步受影响', '坏死风险显著上升', '抽脂量必须保守'], tip: '吸烟、糖尿病者风险更高' });
      s += g.txt(450, 340, 'midTitle', 'VS', 'middle', '#93a3a8');
      s += g.txt(450, 488, 'small', '在哪些区域抽、抽多少，由主刀评估皮瓣血供安全边界', 'middle');
      return s;
    },
  },
  {
    file: 'B3-02.svg', no: 'B3',
    title: '联合还是分期，怎么判断',
    kicker: '血供条件和抽脂量，是判断的核心',
    desc: '腹壁成形联合或分期手术的判断条件对照',
    quote: '分期多受一次罪，每次风险更可控',
    foot: '医学教育示意 · 联合或分期由主刀评估决定',
    body(g) {
      let s = g.card({ x: 62, y: 205, w: 370, h: 250, c: 'blue', name: '倾向联合', lines: ['脂肪与松弛都是主要矛盾', '主刀评估血供允许', '抽脂量在安全范围内'], tip: '收益是少受一次恢复的罪' });
      s += '\n' + g.card({ x: 468, y: 205, w: 370, h: 250, c: 'amber', name: '倾向分期', lines: ['需要大量抽脂时', '血供条件差（吸烟、糖尿病）', '两次手术各自风险更可控'], tip: '代价是两次麻醉与恢复' });
      s += g.txt(450, 488, 'small', '分期顺序（先吸脂还是先成形）由主刀决定', 'middle');
      return s;
    },
  },

  /* ---------- C1 ---------- */
  {
    file: 'C1-01.svg', no: 'C1',
    title: '疤痕的位置与长度现实',
    kicker: '术式决定疤的长度，可能增生变宽，可能外露',
    desc: '各术式疤痕相对长度示意，迷你型到环形，倒 T 型另有纵疤',
    quote: '对疤痕的接受度，是决策的核心之一',
    foot: '医学教育示意，非教学图 · 疤痕最终表现因人而异',
    body(g) {
      const bars = [
        { c: 'blue', name: '迷你型', w: 120, note: '下腹短横切口' },
        { c: 'green', name: '标准型', w: 240, note: '髋到髋横切口' },
        { c: 'amber', name: '延伸型', w: 380, note: '延伸绕到侧腰' },
        { c: 'red', name: '环形', w: 540, note: '绕躯干一周' },
        { c: 'purple', name: '倒 T 型', w: 280, note: '横＋正中纵切口' },
      ];
      let s = g.txt(62, 206, 'small', '术式') + g.txt(210, 206, 'small', '相对切口长度（示意）');
      bars.forEach((b, i) => {
        const y = 222 + i * 54;
        const k = C[b.c];
        s += '\n' + g.txt(62, y + 14, 'midTitle', b.name);
        s += g.rect(210, y, b.w, 10, k.main, { rx: 5 });
        if (b.name === '倒 T 型') s += g.rect(210 + b.w / 2 - 3, y - 28, 6, 30, k.main, { rx: 3 });
        s += g.txt(210 + b.w + 14, y + 14, 'small', b.note);
      });
      s += g.txt(62, 492, 'small', '标准型及以上，脐周另有一圈疤，可能增生、变宽，穿低腰裤、泳装时可能显露');
      return s;
    },
  },
  {
    file: 'C1-02.svg', no: 'C1',
    title: '疤痕的成熟过程与管理',
    kicker: '从发红发硬到变淡变软，需要一年以上',
    desc: '疤痕成熟四阶段与可用的管理措施',
    quote: '疤痕管理是改善，不是消除',
    foot: '医学教育示意 · 瘢痕管理方案遵主刀与专科医嘱',
    body(g) {
      const nodes = [
        { c: 'red', num: '1', name: '数周', lines: ['发红、发硬、略隆起', '可能痒、痛'] },
        { c: 'amber', num: '2', name: '数月', lines: ['可能进入增生期', '更红、更厚、更硬'] },
        { c: 'sky', num: '3', name: '半年～1 年', lines: ['颜色逐渐变淡', '变软、变平'] },
        { c: 'blue', num: '4', name: '最终', lines: ['一条淡色的线', '但不会消失'] },
      ];
      let s = '';
      nodes.forEach((o, i) => {
        const x = 62 + i * 198;
        s += '\n' + g.card({ ...o, x, y: 205, w: 172, h: 150 });
        if (i < 3) s += g.arrow(x + 176, 280, x + 194, 280);
      });
      s += g.txt(62, 396, 'small', '能做的事，让疤不那么糟');
      const chips = ['精细缝合与减张', '硅酮凝胶或贴片数月', '防晒至少一年', '必要时注射或激光'];
      chips.forEach((t, i) => { s += '\n' + g.chip(62 + i * 192, 410, 178, 44, 'green', t); });
      return s;
    },
  },

  /* ---------- C2 ---------- */
  {
    file: 'C2-01.svg', no: 'C2',
    title: '并发症分级，从常见到需急症',
    kicker: '不制造恐慌，也不轻描淡写',
    desc: '腹壁成形术并发症按严重程度分三级，常见、较重、需急症处理',
    quote: '发生率不算高，不等于不会发生在你身上',
    foot: '医学教育示意 · 个体风险以术前评估为准',
    body(g) {
      const bands = [
        { c: 'amber', label: '常见', sub: '不致命但影响恢复', items: [['血肿与血清肿（引流的意义）', '伤口愈合不良或裂开'], ['腹部感觉改变（多可恢复）', '轮廓不对称、不平整']] },
        { c: 'red', label: '较重', sub: '可能需二次干预', items: [['皮瓣坏死（吸烟、糖尿病高危）', '感染（合并积液时更高）'], ['明显瘢痕增生或变宽', '坏死区可能需清创、植皮']] },
        { c: 'dred', label: '需急症', sub: '可危及生命', items: [['深静脉血栓／肺栓塞（主要死因之一）'], ['术后大出血（需备血与再手术）']] },
      ];
      let s = '';
      bands.forEach((b, i) => {
        const y = 205 + i * 100;
        const k = C[b.c];
        s += '\n' + g.line(62, y + 6, 62, y + 82, k.main, 2);
        s += g.txt(82, y + 36, 'midTitle', b.label, 'start', k.main);
        s += g.txt(82, y + 62, 'small', b.sub);
        s += g.line(206, y + 6, 206, y + 82, g.HAIR, 1);
        const cols = [230, 530];
        b.items.forEach((pair, ci) => {
          pair.forEach((it, ii) => {
            s += g.txt(cols[ci], y + 36 + ii * 30, 'body', it);
          });
        });
      });
      return s;
    },
  },
  {
    file: 'C2-02.svg', no: 'C2',
    title: '出现这些危险信号就就医',
    kicker: '呼吸困难、胸痛、渗血不止，立即急诊',
    desc: '腹壁成形术后危险信号分级，立即急诊与尽快就医',
    quote: '该急诊就急诊，早处理和晚处理结果完全不同',
    foot: '医学教育示意 · 出现危险信号立即就医，不要观察等待',
    body(g) {
      const item = (x, y, main, sub) => g.txt(x + 22, y, 'body', main) + g.txt(x + 22, y + 24, 'small', sub, 'start', C.dred.main);
      let s = g.rect(62, 205, 380, 268, 'none', { stroke: C.dred.main });
      s += g.txt(252, 238, 'midTitle', '立即急诊', 'middle', C.dred.main);
      s += item(62, 275, '突发呼吸困难、胸痛、咳血、晕厥', '警惕肺栓塞，立即急诊');
      s += item(62, 335, '伤口渗血不止、腹部迅速肿胀剧痛', '警惕活动性出血，立即急诊');
      s += item(62, 395, '心率快、头晕乏力、面色苍白', '警惕失血，立即急诊');
      s += '\n' + g.rect(478, 205, 380, 268, 'none', { stroke: C.amber.main });
      s += g.txt(668, 238, 'midTitle', '尽快就医', 'middle', C.amber.main);
      s += item(478, 275, '一侧小腿肿胀、疼痛、压痛', '警惕深静脉血栓');
      s += item(478, 335, '高热、伤口红肿、脓性渗出', '警惕感染');
      s += item(478, 395, '皮瓣发紫、发黑、起水疱', '警惕皮瓣坏死，联系主刀');
      s += item(478, 452, '剧烈腹痛、腹胀、呕吐', '警惕腹腔内问题');
      return s;
    },
  },

  /* ---------- C3 ---------- */
  {
    file: 'C3-01.svg', no: 'C3',
    title: '恢复时间线，从引流到定型',
    kicker: '数周到数月的限制，一年以上的定型',
    desc: '腹壁成形术后恢复时间线，引流、弯腰行走、限制活动、消肿、定型',
    quote: '把恢复期算进决策，比只算手术费更真实',
    foot: '医学教育示意 · 时间节点因人而异，以主刀方案为准',
    body(g) {
      let s = g.txt(62, 224, 'small', '生活冲击（提前安排）');
      const chips = ['带娃需帮手数周', '请假 2～4 周', '运动停数周至数月', '独居需陪护'];
      chips.forEach((t, i) => { s += '\n' + g.chip(62 + i * 196, 236, 182, 44, 'sky', t); });
      s += g.line(70, 385, 826, 385, g.ARROW, 1.2);
      const nodes = [
        { c: 'blue', t: '0～2 周', l1: '引流管在身上', l2: '弯腰行走，慢慢直起' },
        { c: 'sky', t: '2～6 周', l1: '不能提重物', l2: '弹力衣持续穿戴' },
        { c: 'green', t: '6 周后', l1: '逐渐恢复运动', l2: '循序渐进，别上强度' },
        { c: 'amber', t: '3～6 个月', l1: '肿胀逐渐消退', l2: '轮廓渐趋稳定' },
        { c: 'red', t: '1 年以上', l1: '轮廓与疤痕定型', l2: '感觉部分恢复' },
      ];
      nodes.forEach((n, i) => {
        const x = 110 + i * 155;
        s += g.circle(x, 385, 5, C[n.c].main);
        s += g.txt(x, 420, 'midTitle', n.t, 'middle');
        s += g.txt(x, 442, 'small', n.l1, 'middle');
        s += g.txt(x, 462, 'small', n.l2, 'middle');
      });
      return s;
    },
  },
  {
    file: 'C3-02.svg', no: 'C3',
    title: '恢复期的限制与生活安排',
    kicker: '带娃、工作、运动，都要提前排期',
    desc: '腹壁成形术后限制与生活安排对照',
    quote: '恢复是曲线，好几天、差一天，是正常的',
    foot: '医学教育示意 · 恢复安排以主刀医嘱为准',
    body(g) {
      let s = g.card({ x: 62, y: 205, w: 380, h: 250, c: 'amber', name: '术后限制', lines: ['数周内不能提重物', '带引流管 1～2 周', '弹力衣持续数周至数月', '初期不能开车'] });
      s += '\n' + g.card({ x: 478, y: 205, w: 380, h: 250, c: 'blue', name: '生活安排', lines: ['带娃需要帮手 2～4 周', '办公室工作请假 2～4 周', '运动停数周至数月', '独居需安排陪护'] });
      return s;
    },
  },

  /* ---------- D1 ---------- */
  {
    file: 'D1-01.svg', no: 'D1',
    title: '红线清单，这些情况现在别做',
    kicker: '命中任何一条，先解决它，再谈手术',
    desc: '腹壁成形术七条红线，再生育、体重不稳、吸烟、基础病、疤痕零容忍、预期、变故',
    quote: '等一等不是劝退，是让手术值得做',
    foot: '医学教育示意 · 禁忌与时机判断由资质医师做出',
    body(g) {
      let s = g.rect(62, 200, 776, 56, 'none', { stroke: C.red.main });
      s += g.txt(450, 235, 'midTitle', '命中任何一条，先解决它，再谈手术日期', 'middle', C.red.main);
      const items = [
        '还打算再生育（效果会被抵消）',
        '体重还在大幅变化（先等稳定）',
        '仍在吸烟（皮瓣坏死风险高）',
        '糖尿病等基础病未控稳定',
        '对疤痕完全不能接受（必然留疤）',
        '预期不现实或诉求不稳定',
        '正处重大生活变故期',
      ];
      items.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        s += '\n' + g.warnChip(62 + col * 396, 280 + row * 58, 380, 50, t);
      });
      return s;
    },
  },
  {
    file: 'D1-02.svg', no: 'D1',
    title: '等一等，等到什么时候',
    kicker: '大部分红线是暂时的，条件到位再做',
    desc: '七条红线对应的等待条件，生育完成、体重稳定、戒烟、控病、生活平稳',
    quote: '在对的条件下做，满意度高得多',
    foot: '医学教育示意 · 等待条件达成后再评估手术',
    body(g) {
      let s = g.txt(62, 200, 'small', '现在的情况') + g.txt(460, 200, 'small', '先等到');
      const rows = [
        ['还想生育', '等生育计划完成'],
        ['体重在变', '等稳定至少 6 个月'],
        ['吸烟未戒', '先戒烟 4～6 周'],
        ['基础病未控', '先治疗到稳定'],
        ['情绪不稳、生活变故', '等生活平稳再做决定'],
      ];
      rows.forEach((r, i) => {
        const y = 212 + i * 60;
        s += '\n' + g.rect(62, y, 300, 52, 'none', { stroke: C.red.main });
        s += g.txt(82, y + 32, 'body', r[0]);
        s += g.arrow(372, y + 26, 448, y + 26);
        s += g.rect(460, y, 378, 52, 'none', { stroke: C.green.main });
        s += g.txt(480, y + 32, 'body', r[1]);
      });
      return s;
    },
  },

  /* ---------- D2 ---------- */
  {
    file: 'D2-01.svg', no: 'D2',
    title: '面诊必问的 12 个问题',
    kicker: '按颜色分组，术式、联合与预期、风险与资质、费用',
    desc: '面诊腹壁成形术的 12 个必问问题，按主题分组着色',
    quote: '被回避的问题，往往就是风险所在',
    foot: '医学教育示意 · 资质请通过卫健委官方渠道核验',
    body(g) {
      const groups = [
        { c: 'blue', label: '问题与术式' },
        { c: 'amber', label: '联合与预期' },
        { c: 'red', label: '风险与资质' },
        { c: 'green', label: '费用' },
      ];
      let s = '';
      groups.forEach((gp, i) => {
        const x = 62 + i * 200;
        s += g.ring(x + 5, 204, 5, C[gp.c].main) + g.txt(x + 18, 209, 'small', gp.label);
      });
      const qs = [
        ['blue', '我的问题属于哪类'], ['blue', '建议哪种术式、为何'], ['blue', '切口从哪到哪'],
        ['blue', '肌分离是否收紧'], ['amber', '要不要联合吸脂'], ['amber', '手术时长与住院'],
        ['amber', '效果边界与定型'], ['red', '麻醉、血库、通道'], ['red', '血栓预防方案'],
        ['red', '我的个人风险'], ['red', '主刀资质与经验'], ['green', '总费用包含什么'],
      ];
      qs.forEach((q, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        s += '\n' + g.numChip(62 + col * 262, 238 + row * 62, 250, 52, q[0], String(i + 1), q[1]);
      });
      return s;
    },
  },
  {
    file: 'D2-02.svg', no: 'D2',
    title: '回答含糊时，要警惕的信号',
    kicker: '被回避的话题，往往就是风险所在',
    desc: '面诊时六类需要警惕的含糊回答与话术',
    quote: '回避风险话题的机构，出事时最没准备',
    foot: '医学教育示意 · 机构与医师资质请通过官方渠道核验',
    body(g) {
      const rows = [
        ['回避谈疤痕', '“疤很小，看不出来的”'],
        ['回避谈风险', '“很安全，没什么风险”'],
        ['效果承诺', '“无痕”“终身”“保证满意”'],
        ['资质含糊', '“医生很有经验，你放心”'],
        ['催促决策', '“今天定有优惠、名额有限”'],
        ['急救能力答不上', '血库、麻醉、监护说不清'],
      ];
      let s = '';
      rows.forEach((r, i) => {
        const y = 209 + i * 50;
        s += '\n' + g.rect(62, y, 776, 42, 'none', { stroke: C.red.main });
        s += g.ring(92, y + 21, 11, C.red.main);
        s += `\n  <text x="92" y="${y + 26}" font-family="${FONT}" font-size="14" style="fill:${C.red.main}" text-anchor="middle">×</text>`;
        s += g.txt(116, y + 27, 'midTitle', r[0]);
        s += g.txt(340, y + 27, 'small', r[1]);
      });
      return s;
    },
  },

  /* ---------- D3 ---------- */
  {
    file: 'D3-01.svg', no: 'D3',
    title: '费用构成，钱花在哪里',
    kicker: '七大块，从手术团队到血库保障',
    desc: '腹壁成形费用的七个构成部分，手术、麻醉、耗材、住院、血库、随访、术式加价',
    quote: '资质成本决定下限，术式复杂度决定浮动',
    foot: '医学教育示意 · 不含具体金额 · 以面诊明细为准',
    body(g) {
      const chips = [
        { name: '手术费', line: '主刀＋助手团队' },
        { name: '麻醉费', line: '麻醉医生全程监护' },
        { name: '手术室与耗材', line: '设备、缝线、引流' },
        { name: '住院与监护', line: '床位、护理、复查' },
        { name: '血库与急救保障', line: '用不到时看不出' },
        { name: '评估与随访', line: '术前检查、术后复查' },
        { name: '术式复杂度', line: '迷你＜标准＜环形' },
      ];
      const colors = ['blue', 'green', 'sky', 'amber', 'red', 'purple', 'dred'];
      let s = '';
      chips.forEach((cp, i) => {
        const row = i < 4 ? 0 : 1;
        const col = i < 4 ? i : i - 4;
        const x = row === 0 ? 62 + col * 196 : 160 + col * 216;
        const y = 215 + row * 120;
        const k = C[colors[i]];
        s += '\n' + g.rect(x, y, 188, 104, 'none', { stroke: k.main });
        s += g.txt(x + 94, y + 42, 'midTitle', cp.name, 'middle', k.main);
        s += g.txt(x + 94, y + 72, 'small', cp.line, 'middle');
      });
      s += g.txt(450, 488, 'small', '报价对比要同口径，问清含不含麻醉、住院、耗材、复查', 'middle');
      return s;
    },
  },
  {
    file: 'D3-02.svg', no: 'D3',
    title: '异常低价省掉了什么',
    kicker: '省掉的成本，由你的身体和风险买单',
    desc: '异常低价腹壁成形可能省掉的成本项，血库、麻醉、监护、随访、资质、术式、耗材',
    quote: '异常低价省下的，都在拿安全换',
    foot: '医学教育示意 · 价格以面诊明细为准 · 警惕异常低价',
    body(g) {
      let s = g.rect(62, 200, 776, 56, 'none', { stroke: C.dred.main });
      s += g.txt(450, 235, 'midTitle', '明显低于常规的报价，一定在某些地方省了成本', 'middle', C.dred.main);
      const items = [
        '血库与急救保障',
        '麻醉团队资质',
        '住院与术后监护',
        '术后随访跟进',
        '主刀四级权限',
        '术式缩水（该大做小）',
        '耗材与缝线质量',
      ];
      items.forEach((t, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        s += '\n' + g.warnChip(62 + col * 396, 280 + row * 58, 380, 50, t);
      });
      return s;
    },
  },
];

/* ============ 生成 + 校验 ============ */
function validate(svg) {
  const problems = [];
  if (/：/.test(svg)) problems.push('文本含全角冒号');
  const rawAmp = svg.match(/&(?!amp;|lt;|gt;|quot;|#)/g);
  if (rawAmp) problems.push('未转义的 &');
  ['svg', 'title', 'desc', 'defs', 'style', 'text', 'marker'].forEach((tag) => {
    const open = (svg.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (svg.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) problems.push(`${tag} 开闭不匹配 ${open}/${close}`);
  });
  if (!svg.trim().endsWith('</svg>')) problems.push('文件未以 </svg> 结尾');
  return problems;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let ok = 0;
for (const p of posters) {
  const code = p.file.replace('.svg', '').replace('-', '');
  const g = makeG(code);
  const svg = svgDoc({ code, desc: p.desc, no: p.no, title: p.title, kicker: p.kicker, body: p.body(g), quote: p.quote, foot: p.foot });
  const problems = validate(svg);
  if (problems.length) {
    console.error(`✗ ${p.file}: ${problems.join('；')}`);
    process.exitCode = 1;
  } else {
    ok++;
  }
  fs.writeFileSync(path.join(OUT_DIR, p.file), svg, 'utf8');
}
console.log(`生成 ${posters.length} 张，校验通过 ${ok} 张 → ${OUT_DIR}`);
