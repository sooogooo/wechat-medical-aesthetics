/**
 * gen-career-figs.js — 实然指南独立站信息图生成器
 * 输出: career-site/assets/figs/01-16.svg（16 篇各一张 800×500 细线信息图）
 *      career-site/assets/figs/journey.svg（首页十六篇地图导览图，含互链）
 * 风格：暖纸底细线图、部分色编码、无填充重色，与全站视觉一致。
 * 生成后用 resvg 逐张试渲染做合法性校验。
 */
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "career-site", "assets", "figs");
fs.mkdirSync(OUT, { recursive: true });

const W = 800, H = 500;
const INK = "#2b2a28", SOFT = "#6b6864", FAINT = "#a8a39d", HAIR = "#e4ddd2", PAPER = "#fffdf9";
const FONT = "Microsoft YaHei, PingFang SC, sans-serif";
const PC = { p0: "#8a8578", p1: "#2f4858", p2: "#c9a876", p3: "#b5654a", p4: "#5f6e54", p5: "#7a8b6f" };
const PCSOFT = { p0: "#f2f2ef", p1: "#edf1f4", p2: "#f4ede0", p3: "#f8f2f0", p4: "#edf0ea", p5: "#eef0ea" };

// ============ 极简 SVG DSL ============
const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size || 14}" fill="${o.fill || INK}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.ls ? ` letter-spacing="${o.ls}"` : ""}${o.op ? ` opacity="${o.op}"` : ""}>${s}</text>`;
const R = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r == null ? 8 : o.r}" fill="${o.fill || "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1.4}"` : ""}${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.op ? ` opacity="${o.op}"` : ""}/>`;
const L = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || HAIR}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.cap ? ` stroke-linecap="${o.cap}"` : ""}/>`;
const C = (cx, cy, r, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1.4}"` : ""}/>`;
const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.sw || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;

const HEAD = (cls, title, sub) => `
  <rect x="0" y="0" width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="12" fill="#ffffff" stroke="${HAIR}"/>
  <rect x="24" y="24" width="4" height="46" rx="2" fill="${PC[cls]}"/>
  ${T(46, 46, title, { size: 20, weight: 600 })}
  ${T(46, 70, sub, { size: 12.5, fill: SOFT })}`;
const FOOT = (note) => T(46, H - 40, note, { size: 11.5, fill: FAINT });

const ARROW = (cls) => `
  <marker id="ah-${cls}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${PC[cls] || INK}"/>
  </marker>`;
const LINE_ARROW = (x1, y1, x2, y2, cls, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${PC[cls]}" stroke-width="${o.sw || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah-${cls})"/>`;

function fig(cls, body, title, sub, note) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
${ARROW(cls)}
${HEAD(cls, title, sub)}
${body}
${note ? FOOT(note) : ""}
</svg>`;
}

// ============ 16 张图 ============
const FIGS = {};

// 01 三块拼图，拼不出一个行业
FIGS["01"] = fig("p0", `
  ${R(70, 120, 230, 54, { fill: PCSOFT.p0, stroke: HAIR })}${T(90, 153, "社会新闻里的乱象", { size: 15 })}
  ${R(70, 196, 230, 54, { fill: PCSOFT.p0, stroke: HAIR })}${T(90, 229, "饭局上的暴利传闻", { size: 15 })}
  ${R(70, 272, 230, 54, { fill: PCSOFT.p0, stroke: HAIR })}${T(90, 305, "招聘软件的高薪急聘", { size: 15 })}
  ${LINE_ARROW(310, 223, 420, 223, "p0")}
  ${R(430, 112, 300, 222, { stroke: PC.p0, sw: 2 })}
  ${T(580, 160, "行业实况地图", { size: 19, weight: 600, anchor: "middle", fill: PC.p0 })}
  ${T(580, 195, "钱怎么分 · 谁说了算", { size: 13.5, fill: SOFT, anchor: "middle" })}
  ${T(580, 222, "怎么进 · 会经历什么", { size: 13.5, fill: SOFT, anchor: "middle" })}
  ${T(580, 249, "名校生的机会与代价", { size: 13.5, fill: SOFT, anchor: "middle" })}
  ${T(580, 276, "一页纸决策清单", { size: 13.5, fill: SOFT, anchor: "middle" })}
  ${T(580, 312, "16 篇 · 引用均带日期", { size: 11.5, fill: FAINT, anchor: "middle" })}
  ${T(185, 372, "三块碎片，各说各话", { size: 12.5, fill: FAINT, anchor: "middle" })}
  ${T(580, 372, "拼成一张完整地图", { size: 12.5, fill: FAINT, anchor: "middle" })}
`, "三块拼图，拼不出一个行业", "对医美的印象通常来自三个互不说话的来源", "这个站只做一件事，把拼图补齐，不替你决定拼不拼");

// 02 消费的嘴与医疗的手
FIGS["02"] = fig("p1", `
  ${R(60, 120, 240, 200, { fill: PCSOFT.p1, stroke: HAIR })}
  ${T(180, 158, "消费的嘴", { size: 20, weight: 600, anchor: "middle", fill: PC.p1 })}
  ${T(180, 196, "流量 · 低价 · 标准化", { size: 14, anchor: "middle", fill: SOFT })}
  ${T(180, 226, "电商获客 · ROI 一比一", { size: 13, anchor: "middle", fill: SOFT })}
  ${T(180, 256, "拼规模 · 拼转化", { size: 13, anchor: "middle", fill: SOFT })}
  ${R(500, 120, 240, 200, { fill: PCSOFT.p1, stroke: HAIR })}
  ${T(620, 158, "医疗的手", { size: 20, weight: 600, anchor: "middle", fill: PC.p1 })}
  ${T(620, 196, "医生 · 个性化 · 手艺", { size: 14, anchor: "middle", fill: SOFT })}
  ${T(620, 226, "容错率最低 · 不可逆", { size: 13, anchor: "middle", fill: SOFT })}
  ${T(620, 256, "稀缺资源 · 不可扩容", { size: 13, anchor: "middle", fill: SOFT })}
  ${L(320, 220, 480, 220, { stroke: PC.p1, sw: 1.8, dash: "5 5" })}
  ${T(400, 200, "结构矛盾", { size: 14, weight: 600, anchor: "middle", fill: PC.p1 })}
  ${T(400, 244, "两端长在一具身体上", { size: 11.5, fill: FAINT, anchor: "middle" })}
  ${R(120, 366, 170, 44, { stroke: HAIR, fill: "#fff" })}${T(205, 393, "价值悖论", { size: 14, anchor: "middle" })}
  ${R(315, 366, 170, 44, { stroke: HAIR, fill: "#fff" })}${T(400, 393, "传播悖论", { size: 14, anchor: "middle" })}
  ${R(510, 366, 170, 44, { stroke: HAIR, fill: "#fff" })}${T(595, 393, "生态悖论", { size: 14, anchor: "middle" })}
`, "消费的嘴，医疗的手", "医美这个生意最底层的结构矛盾", "嘴可以没有手，手不依赖嘴，大厂人的岗位多在嘴端");

// 03 四层利润表
FIGS["03"] = fig("p1", `
  ${T(90, 128, "上游厂商", { size: 15, weight: 600 })}${R(220, 110, 460, 34, { fill: PC.p1, r: 6 })}${T(695, 133, "最厚", { size: 13, fill: PC.p1, weight: 600 })}
  ${T(90, 198, "三方平台", { size: 15, weight: 600 })}${R(220, 180, 320, 34, { fill: PC.p1, r: 6, op: 0.75 })}${T(555, 203, "第二层", { size: 13, fill: SOFT })}
  ${T(90, 268, "医　　生", { size: 15, weight: 600 })}${R(220, 250, 180, 34, { fill: PC.p1, r: 6, op: 0.45 })}${T(415, 273, "被商品化思潮低估", { size: 12.5, fill: SOFT })}
  ${T(90, 338, "医美机构", { size: 15, weight: 600 })}${R(220, 322, 70, 26, { fill: PC.p3, r: 6 })}${T(305, 341, "最苦 · 2 亿营收利润 600 万已是赢家", { size: 12.5, fill: PC.p3 })}
  ${T(90, 396, "你的岗位大概率在这一层", { size: 12, fill: FAINT })}
  ${L(220, 376, 220, 100, { stroke: HAIR, dash: "3 3" })}
`, "这个行业的钱是怎么分的", "四层利润实况，条形长度示意相对厚度", "过去十几年，行业赚的主要是信息差和渠道的钱");

// 04 权力同心圆
FIGS["04"] = fig("p1", `
  ${C(400, 265, 175, { stroke: HAIR, sw: 1.2 })}
  ${C(400, 265, 115, { stroke: HAIR, sw: 1.2 })}
  ${C(400, 258, 58, { fill: PCSOFT.p1 })}
  ${T(400, 252, "医　生", { size: 17, weight: 600, anchor: "middle", fill: PC.p1 })}
  ${T(400, 276, "稀缺手艺", { size: 11.5, anchor: "middle", fill: PC.p1 })}
  ${T(400, 128, "老板 / 投资人　资本与直觉，规则的真正来源", { size: 13.5, anchor: "middle", fill: SOFT })}
  ${T(400, 192, "经营院长 · 咨询师　服务层，获客变现的责任", { size: 13.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(640, 350, 470, 300, "p1", { dash: "4 4" })}
  ${T(648, 344, "冲突时的牺牲顺序", { size: 12.5, fill: PC.p1 })}
  ${T(648, 362, "由外向内，", { size: 12.5, fill: SOFT })}
  ${T(648, 380, "离开院长可以，", { size: 12.5, fill: SOFT })}
  ${T(648, 398, "离开医生不行", { size: 12.5, fill: SOFT })}
`, "谁说了算", "权力以稀缺手艺为锚，不随职级分配", "外行不能领导内行，管不了一双手");

// 05 周期时间线
FIGS["05"] = fig("p1", `
  ${L(80, 280, 720, 280, { stroke: INK, sw: 1.8 })}
  ${C(80, 280, 5, { fill: INK })}${T(80, 316, "2018 年末", { size: 12.5, anchor: "middle", fill: SOFT })}${T(80, 250, "大批机构倒闭", { size: 13, anchor: "middle" })}
  ${C(253, 280, 5, { fill: INK })}${T(253, 316, "2019", { size: 12.5, anchor: "middle", fill: SOFT })}${T(253, 250, "消费低迷担忧", { size: 13, anchor: "middle" })}
  ${C(426, 280, 5, { fill: INK })}${T(426, 316, "2021", { size: 12.5, anchor: "middle", fill: SOFT })}${T(426, 250, "咨询师取缔提案", { size: 13, anchor: "middle" })}
  ${C(600, 280, 5, { fill: PC.p1 })}${T(600, 316, "2025", { size: 12.5, anchor: "middle", fill: SOFT })}${T(600, 250, "十四部门联合整治", { size: 13, anchor: "middle", weight: 600 })}
  ${C(720, 280, 5, { fill: PC.p1, op: 0.4 })}${T(720, 316, "下一轮", { size: 12.5, anchor: "middle", fill: FAINT })}
  ${L(80, 200, 720, 200, { stroke: HAIR, dash: "4 4" })}
  ${T(400, 190, "每 10 年一次大变化 · 整治是周期性天气，不是一次性事件", { size: 13.5, anchor: "middle", fill: PC.p1 })}
  ${T(400, 392, "入场时间风险自检，赌现状的钱还是转型的钱，能承受多长逆风", { size: 12.5, anchor: "middle", fill: SOFT })}
`, "乱象是真的，机会也是真的", "行业周期与监管节奏", "不成熟既生产黑机构，也生产空白");

// 06 五条入口深度轴
FIGS["06"] = fig("p2", `
  ${L(70, 260, 730, 260, { stroke: PC.p2, sw: 2 })}
  ${T(70, 300, "隔着玻璃", { size: 12.5, fill: SOFT })}
  ${T(730, 300, "全身进场", { size: 12.5, fill: SOFT, anchor: "end" })}
  ${C(130, 260, 7, { fill: PC.p2 })}${T(130, 226, "平台方", { size: 14, anchor: "middle", weight: 600 })}${T(130, 204, "保留互联网身位", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(275, 260, 7, { fill: PC.p2 })}${T(275, 226, "上游厂商", { size: 14, anchor: "middle", weight: 600 })}${T(275, 204, "红利最厚正在消退", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(415, 260, 7, { fill: PC.p2 })}${T(415, 226, "医生 IP", { size: 14, anchor: "middle", weight: 600 })}${T(415, 204, "单点深绑·人身依附", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(560, 260, 7, { fill: PC.p2 })}${T(560, 330, "机构端", { size: 14, anchor: "middle", weight: 600 })}${T(560, 352, "获客手艺换入场券", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(690, 260, 7, { fill: PC.p2 })}${T(690, 330, "咨询师", { size: 14, anchor: "middle", weight: 600 })}${T(690, 352, "最近入口·争议最大", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${T(400, 408, "入口选择的本质，是市场采购你哪一角的选择", { size: 13, anchor: "middle", fill: PC.p2 })}
`, "五条入口的实况", "按进行业的深度排布，每条都是真实路径", "前三条保留身位，后两条全身进场");

// 07 资产与负资产天平
FIGS["07"] = fig("p2", `
  ${P("M400 118 L400 300 M310 300 L490 300", { stroke: INK, sw: 2 })}
  ${P("M330 150 L250 220", { stroke: INK, sw: 1.8 })}${P("M470 150 L550 220", { stroke: INK, sw: 1.8 })}
  ${L(180, 224, 320, 224, { stroke: INK, sw: 1.8 })}${L(480, 224, 620, 224, { stroke: INK, sw: 1.8 })}
  ${R(560, 300, 160, 14, { fill: INK, r: 4 })}
  ${R(160, 110, 190, 108, { fill: PCSOFT.p2, stroke: HAIR })}
  ${T(255, 136, "可迁移资产", { size: 14.5, weight: 600, anchor: "middle", fill: PC.p2 })}
  ${T(255, 160, "数据治理 · 内容 IP", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(255, 181, "流量实操 · 流程 SOP", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(255, 205, "有人买单", { size: 11.5, anchor: "middle", fill: PC.p2 })}
  ${R(450, 110, 190, 108, { stroke: HAIR, fill: "#fff", dash: "5 4" })}
  ${T(545, 136, "负资产", { size: 14.5, weight: 600, anchor: "middle", fill: SOFT })}
  ${T(545, 160, "流量万能 · 方法论优越感", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(545, 181, "制度信任 · 快迭代", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(545, 205, "以正确感面目出现", { size: 11.5, anchor: "middle", fill: FAINT })}
  ${T(400, 345, "支点是嘴与手的结构", { size: 13.5, anchor: "middle", fill: PC.p2 })}
  ${T(400, 372, "同一种能力，站对是资产，站错是负资产", { size: 12.5, anchor: "middle", fill: SOFT })}
`, "你的大厂能力清单", "资产与负资产常是同一种能力的一体两面", "分界不在于你有什么，在于是否接受嘴与手的结构");

// 08 四种死法与三个活法
FIGS["08"] = fig("p2", `
  ${T(46, 118, "四种死法", { size: 15, weight: 600, fill: PC.p3 })}
  ${R(46, 130, 168, 88, { stroke: HAIR, fill: "#fff" })}${T(130, 158, "用自己的套路", { size: 13.5, anchor: "middle" })}${T(130, 182, "干别人的事", { size: 12, anchor: "middle", fill: SOFT })}
  ${R(228, 130, 168, 88, { stroke: HAIR, fill: "#fff" })}${T(312, 158, "换个圈子", { size: 13.5, anchor: "middle" })}${T(312, 182, "以为照样吃香", { size: 12, anchor: "middle", fill: SOFT })}
  ${R(410, 130, 168, 88, { stroke: HAIR, fill: "#fff" })}${T(494, 158, "以为看懂了", { size: 13.5, anchor: "middle" })}${T(494, 182, "其实一窍不通", { size: 12, anchor: "middle", fill: SOFT })}
  ${R(592, 130, 168, 88, { stroke: HAIR, fill: "#fff" })}${T(676, 158, "改变别人的", { size: 13.5, anchor: "middle" })}${T(676, 182, "圈子规矩", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(46, 268, "三个活法", { size: 15, weight: 600, fill: PC.p2 })}
  ${R(46, 280, 226, 96, { stroke: PC.p2, sw: 1.6, fill: PCSOFT.p2 })}${T(159, 310, "绝对实力碾压", { size: 13.5, anchor: "middle" })}${T(159, 334, "跨界者多半不成立", { size: 12, anchor: "middle", fill: SOFT })}
  ${R(290, 280, 226, 96, { stroke: PC.p2, sw: 1.6, fill: PCSOFT.p2 })}${T(403, 310, "局部新套路", { size: 13.5, anchor: "middle" })}${T(403, 334, "窗口收窄但仍在", { size: 12, anchor: "middle", fill: SOFT })}
  ${R(534, 280, 226, 96, { stroke: PC.p2, sw: 1.6, fill: PCSOFT.p2 })}${T(647, 310, "用圈里人做事", { size: 13.5, anchor: "middle" })}${T(647, 334, "性价比最高的一条", { size: 12, anchor: "middle", fill: SOFT })}
  ${T(400, 424, "多数大厂人手里，只有半个活法二", { size: 13.5, anchor: "middle", fill: PC.p2, weight: 600 })}
`, "跨界者的四种死法与三个活法", "被验证过的跨界规律", "输的从来不是实力，是自我评估");

// 09 尽调五查流程
FIGS["09"] = fig("p2", `
  ${R(46, 150, 128, 120, { stroke: HAIR, fill: "#fff" })}${T(110, 192, "一查机构", { size: 14.5, anchor: "middle", weight: 600 })}${T(110, 218, "执业许可", { size: 11.5, anchor: "middle", fill: SOFT })}${T(110, 238, "行政处罚", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(178, 210, 198, 210, "p2")}
  ${R(200, 150, 128, 120, { stroke: HAIR, fill: "#fff" })}${T(264, 192, "二查医生", { size: 14.5, anchor: "middle", weight: 600 })}${T(264, 218, "执业信息", { size: 11.5, anchor: "middle", fill: SOFT })}${T(264, 238, "团队稳定性", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(332, 210, 352, 210, "p2")}
  ${R(354, 150, 128, 120, { stroke: HAIR, fill: "#fff" })}${T(418, 192, "三问口径", { size: 14.5, anchor: "middle", weight: 600 })}${T(418, 218, "营业额还是利润", { size: 11.5, anchor: "middle", fill: SOFT })}${T(418, 238, "收银还是划扣", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(486, 210, 506, 210, "p2")}
  ${R(508, 150, 128, 120, { stroke: HAIR, fill: "#fff" })}${T(572, 192, "四看客源", { size: 14.5, anchor: "middle", weight: 600 })}${T(572, 218, "直客 · 渠道", { size: 11.5, anchor: "middle", fill: SOFT })}${T(572, 238, "电商占比", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(640, 210, 660, 210, "p2")}
  ${R(662, 150, 128, 120, { stroke: PC.p3, sw: 1.6, fill: "#fff" })}${T(726, 192, "五识红旗", { size: 14.5, anchor: "middle", weight: 600, fill: PC.p3 })}${T(726, 218, "病态 KPI", { size: 11.5, anchor: "middle", fill: SOFT })}${T(726, 238, "五个信号", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${T(400, 330, "前四查是信息动作，第五查是判断动作", { size: 13.5, anchor: "middle", fill: PC.p2 })}
  ${T(400, 360, "杀手问题，考核口径是营业额还是利润，提成按收银还是按划扣", { size: 12.5, anchor: "middle", fill: SOFT })}
`, "谈 offer 前的尽调五查", "签约之前按顺序做完，清单可直接带走", "口头承诺的提成点位，在多本账的组织里等于不存在");

// 10 180 天五次冲击
FIGS["10"] = fig("p3", `
  ${L(80, 400, 720, 400, { stroke: HAIR })}
  ${L(80, 400, 80, 120, { stroke: HAIR })}
  ${T(64, 260, "冲击深度", { size: 12, fill: SOFT, anchor: "middle", transform: "rotate(-90 64 260)" })}
  ${P("M80 380 C170 380 185 190 265 190 C330 190 340 230 400 230 C470 230 480 150 545 150 C610 150 630 100 715 100", { stroke: PC.p3, sw: 2.2 })}
  ${C(265, 190, 5, { fill: PC.p3 })}${T(265, 168, "① 数据冲击", { size: 13.5, anchor: "middle" })}${T(265, 148, "第 2 周", { size: 11.5, fill: SOFT, anchor: "middle" })}
  ${C(400, 230, 5, { fill: PC.p3 })}${T(400, 285, "② 会议冲击", { size: 13.5, anchor: "middle" })}${T(400, 305, "第 1 个月", { size: 11.5, fill: SOFT, anchor: "middle" })}
  ${C(475, 178, 5, { fill: PC.p3 })}${T(490, 156, "③ 身份冲击", { size: 13.5 })}${T(490, 136, "第 2 个月", { size: 11.5, fill: SOFT })}
  ${C(545, 150, 5, { fill: PC.p3 })}${T(560, 128, "④ 指标冲击", { size: 13.5 })}${T(560, 108, "第 3 个月", { size: 11.5, fill: SOFT })}
  ${C(715, 100, 5, { fill: PC.p3 })}${T(715, 78, "⑤ 价值观冲击", { size: 13.5, anchor: "middle" })}${T(715, 58, "第 6 个月", { size: 11.5, fill: SOFT, anchor: "middle" })}
  ${T(80, 428, "入职日", { size: 11.5, fill: SOFT })}${T(720, 428, "第 180 天", { size: 11.5, fill: SOFT, anchor: "end" })}
`, "入职 180 天的五次冲击", "能力、语言、信用、结构、底线，一层比一层深", "预知冲击的存在，本身就是免疫力");

// 11 医生画像六格
FIGS["11"] = fig("p3", `
  ${["容错率最低，结果在脸上体表", "各种学霸，理性用在了专业上", "尊严与金钱打架，尊严赢", "胆子小，是行业淘汰出来的", "手艺人，凭技术吃饭", "活在当下，营销要快速见效"].map((s, i) => {
    const x = 60 + (i % 3) * 236, y = 120 + Math.floor(i / 3) * 118;
    const lines = s.split("，");
    return R(x, y, 216, 96, { fill: i === 0 ? PCSOFT.p3 : "#fff", stroke: HAIR }) +
      T(x + 108, y + 44, lines[0], { size: 14.5, anchor: "middle", weight: 600 }) +
      (lines[1] ? T(x + 108, y + 70, lines[1], { size: 12, anchor: "middle", fill: SOFT }) : "");
  }).join("\n  ")}
  ${T(400, 396, "行业结构塑形的结果，不是性格缺陷清单", { size: 13, anchor: "middle", fill: PC.p3 })}
`, "和医生共事，先读懂六条", "医生群体行为逻辑的结构来源", "摆正位置，快速见效，事实说话，永远不来硬的");

// 12 灰色光谱
FIGS["12"] = fig("p3", `
  <defs><linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#f8f2f0"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="1" stop-color="#edf0ea"/>
  </linearGradient></defs>
  ${R(80, 220, 640, 26, { fill: "url(#spec)", stroke: HAIR, r: 13 })}
  ${C(80, 233, 6, { fill: PC.p3 })}${T(80, 272, "销售导向", { size: 13.5, anchor: "middle", weight: 600, fill: PC.p3 })}
  ${T(80, 294, "制造信息差", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(720, 233, 6, { fill: PC.p4 })}${T(720, 272, "医疗导向", { size: 13.5, anchor: "middle", weight: 600, fill: PC.p4 })}
  ${T(720, 294, "合理价格", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${C(175, 233, 4.5, { fill: INK })}${L(175, 233, 175, 168, { stroke: HAIR })}${T(175, 156, "疗效话术", { size: 12.5, anchor: "middle" })}
  ${C(280, 233, 4.5, { fill: INK })}${L(280, 233, 280, 168, { stroke: HAIR })}${T(280, 156, "案例图授权", { size: 12.5, anchor: "middle" })}
  ${C(400, 233, 4.5, { fill: INK })}${L(400, 233, 400, 300, { stroke: HAIR })}${T(400, 318, "比价应对", { size: 12.5, anchor: "middle" })}
  ${C(520, 233, 4.5, { fill: INK })}${L(520, 233, 520, 300, { stroke: HAIR })}${T(520, 318, "引流品真相", { size: 12.5, anchor: "middle" })}
  ${C(625, 233, 4.5, { fill: INK })}${L(625, 233, 625, 168, { stroke: HAIR })}${T(625, 156, "渠道分润透明度", { size: 12.5, anchor: "middle" })}
  ${T(400, 380, "两种活法都真实存在，你的机构在光谱上的位置，比行业平均更重要", { size: 13, anchor: "middle", fill: PC.p3 })}
`, "指标与良心的光谱", "五类灰色决定的日常位置", "第一道防线，绝不清单，入职第一个月写，不是第六个月");

// 13 去留流向图
FIGS["13"] = fig("p3", `
  ${R(320, 120, 160, 52, { fill: PCSOFT.p3, stroke: HAIR })}${T(400, 152, "转行进场", { size: 16, anchor: "middle", weight: 600 })}
  ${LINE_ARROW(375, 172, 235, 216, "p4")}
  ${LINE_ARROW(425, 172, 565, 216, "p3")}
  ${R(80, 220, 300, 130, { stroke: PC.p4, sw: 1.6, fill: "#fff" })}
  ${T(230, 248, "留下的人", { size: 14.5, anchor: "middle", weight: 600, fill: PC.p4 })}
  ${T(230, 274, "观察者 · 保留身位", { size: 12.5, anchor: "middle", fill: SOFT })}
  ${T(230, 298, "走完信用积累的人", { size: 12.5, anchor: "middle", fill: SOFT })}
  ${T(230, 322, "红利边缘的分享者", { size: 12.5, anchor: "middle", fill: SOFT })}
  ${R(420, 220, 300, 130, { stroke: PC.p3, sw: 1.6, fill: "#fff" })}
  ${T(570, 248, "离开的人", { size: 14.5, anchor: "middle", weight: 600, fill: PC.p3 })}
  ${T(570, 274, "收入落差 · 方法论无处安放", { size: 12.5, anchor: "middle", fill: SOFT })}
  ${T(570, 298, "组织摩擦 · 价值观冲突", { size: 12.5, anchor: "middle", fill: SOFT })}
  ${T(570, 322, "四个触发点 · 三特征，皆为假设", { size: 11.5, anchor: "middle", fill: FAINT })}
  ${T(400, 396, "没有比例数据，只有模式——人物为合成原型，待真实采访验证", { size: 12.5, anchor: "middle", fill: SOFT })}
`, "谁留下了，谁离开了", "转行结局的模式分布", "离开不是失败，把红绿灯系统当救命系统用");

// 14 机会与代价对照
FIGS["14"] = fig("p4", `
  ${R(60, 116, 310, 250, { fill: PCSOFT.p4, stroke: HAIR })}
  ${T(215, 146, "机会四条", { size: 16, anchor: "middle", weight: 600, fill: PC.p4 })}
  ${T(80, 178, "翻译者缺口（买方稀少）", { size: 13 })}
  ${T(80, 208, "公立窗口（待核实）", { size: 13 })}
  ${T(80, 238, "表达者红利", { size: 13 })}
  ${T(80, 268, "AI 窗口（宽度待核验）", { size: 13 })}
  ${T(80, 330, "真实，但多数带但字", { size: 11.5, fill: FAINT })}
  ${R(430, 116, 310, 250, { stroke: HAIR, fill: "#fff" })}
  ${T(585, 146, "代价四条", { size: 16, anchor: "middle", weight: 600 })}
  ${T(450, 178, "职业声望折价", { size: 13 })}
  ${T(450, 208, "薪酬结构落差", { size: 13 })}
  ${T(450, 238, "以为看懂了的风险加倍", { size: 13 })}
  ${T(450, 268, "天花板是结构性的", { size: 13 })}
  ${T(585, 330, "全部成立，且互相叠加计息", { size: 11.5, anchor: "middle", fill: FAINT })}
  ${T(400, 410, "名校牌买不到行业信用，只能买到一个月的耐心", { size: 13.5, anchor: "middle", fill: PC.p4, weight: 600 })}
`, "被高估的机会与被低估的代价", "每条都标了证据强度", "最优策略，不带救世主心态来，带学生心态来");

// 15 十二个月四动作
FIGS["15"] = fig("p4", `
  ${L(80, 380, 720, 380, { stroke: HAIR })}
  ${[0, 3, 6, 9, 12].map((m) => { const x = 80 + m / 12 * 640; return L(x, 380, x, 390, { stroke: HAIR }) + T(x, 410, `${m} 月`, { size: 11.5, anchor: "middle", fill: SOFT }); }).join("")}
  ${R(80, 150, 320, 36, { fill: PCSOFT.p4, stroke: HAIR })}${T(90, 173, "① 学行业语言 · 跟诊（0-6 月）", { size: 12.5 })}
  ${R(240, 200, 320, 36, { fill: PCSOFT.p4, stroke: HAIR, op: 0.8 })}${T(250, 223, "② 选定一个杠杆点（3-9 月）", { size: 12.5 })}
  ${R(400, 250, 320, 36, { fill: PCSOFT.p4, stroke: HAIR, op: 0.6 })}${T(410, 273, "③ 站位嘴端或手端（6-12 月）", { size: 12.5 })}
  ${R(640, 300, 80, 36, { stroke: PC.p4, sw: 1.6, fill: "#fff" })}${T(680, 323, "④ 复盘", { size: 12.5, anchor: "middle" })}
  ${T(400, 452, "三个硬指标验收，听懂诊室对话 · 被医生主动咨询 · 摸清真实利润结构", { size: 12.5, anchor: "middle", fill: SOFT })}
`, "进来后的十二个月", "动作并行推进，不是严格串联", "自己搭自己的培训体系，项目对象是自己");

// 16 三区决策流程
FIGS["16"] = fig("p5", `
  ${R(230, 100, 340, 58, { fill: PCSOFT.p5, stroke: HAIR })}${T(400, 126, "事实区 · 我知道要进的是什么吗", { size: 13.5, anchor: "middle" })}${T(400, 146, "十项核对，任何一项打不了勾就回去重读", { size: 11, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(400, 158, 400, 178, "p5")}
  ${R(230, 180, 340, 58, { fill: PCSOFT.p5, stroke: HAIR })}${T(400, 206, "个人区 · 我拿什么进场", { size: 13.5, anchor: "middle" })}${T(400, 226, "资产负债 · 六个月储备 · 绝不清单", { size: 11, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(400, 238, 400, 258, "p5")}
  ${R(230, 260, 340, 58, { fill: PCSOFT.p5, stroke: HAIR })}${T(400, 286, "条件区 · 我要的和我将遇到的", { size: 13.5, anchor: "middle" })}${T(400, 306, "十条如果那么，右列读完还想进再进", { size: 11, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(330, 318, 180, 368, "p5")}
  ${LINE_ARROW(400, 318, 400, 368, "p5")}
  ${LINE_ARROW(470, 318, 620, 368, "p5")}
  ${R(80, 372, 200, 56, { stroke: HAIR, fill: "#fff" })}${T(180, 396, "进", { size: 15, anchor: "middle", weight: 600, fill: PC.p5 })}${T(180, 416, "带地图进场", { size: 11, anchor: "middle", fill: SOFT })}
  ${R(300, 372, 200, 56, { stroke: HAIR, fill: "#fff" })}${T(400, 396, "不进", { size: 15, anchor: "middle", weight: 600 })}${T(400, 416, "红绿灯也是救命系统", { size: 11, anchor: "middle", fill: SOFT })}
  ${R(520, 372, 200, 56, { stroke: HAIR, fill: "#fff" })}${T(620, 396, "再等等", { size: 15, anchor: "middle", weight: 600 })}${T(620, 416, "先完成七项核验", { size: 11, anchor: "middle", fill: SOFT })}
`, "去或不去，一页纸决策", "三种决定都成立，间隔三天填两次", "地图不替走路的人选路");

// ============ 首页导览图（可互链） ============
const PART_INFO = [
  { no: "开", name: "开篇", cls: "p0", color: PC.p0, count: 1 },
  { no: "1", name: "认识医美", cls: "p1", color: PC.p1, count: 4 },
  { no: "2", name: "怎么进", cls: "p2", color: PC.p2, count: 4 },
  { no: "3", name: "会经历什么", cls: "p3", color: PC.p3, count: 4 },
  { no: "4", name: "名校生专题", cls: "p4", color: PC.p4, count: 2 },
  { no: "5", name: "收尾", cls: "p5", color: PC.p5, count: 1 },
];
const SLUGS = [
  "01-开篇-写给正在刷招聘软件的大厂人",
  "02-医美是个什么生意-医疗的交付消费的获客",
  "03-这个行业的钱是怎么分的",
  "04-谁说了算-医生老板经营院长咨询师",
  "05-乱象是真的机会也是真的",
  "06-五条入口的实况",
  "07-大厂能力清单-可迁移资产与负资产",
  "08-跨界者的四种死法与三个活法",
  "09-谈offer之前-薪酬组织与试用期",
  "10-入职180天的五次冲击",
  "11-和医生共事是一门手艺",
  "12-指标与良心的日常拉扯",
  "13-谁留下了谁离开了",
  "14-名校生进医美-被高估的机会与被低估的代价",
  "15-名校生进来之后怎么做",
  "16-去或不去-一页纸决策清单",
];

function journeySvg() {
  const WJ = 1200, HJ = 320;
  const baseY = 170;
  // 主线：起点到终点，微波动折线
  let d = `M60 ${baseY}`;
  const seg = (WJ - 140) / 15;
  const stops = [];
  let partIdx = 0, used = 0;
  for (let i = 0; i < 16; i++) {
    const x = 60 + i * seg;
    const y = baseY + (i % 2 === 0 ? -8 : 8);
    stops.push({ i, x, y, part: PART_INFO[partIdx] });
    d += ` L${x} ${y}`;
    used++;
    if (used >= PART_INFO[partIdx].count) { partIdx++; used = 0; }
  }
  let body = P(d, { stroke: "#2f4858", sw: 2 });

  stops.forEach((s) => {
    const n = String(s.i + 1).padStart(2, "0");
    const above = s.i % 2 === 0;
    const labelY = above ? s.y - 34 : s.y + 44;
    body += `<a href="${SLUGS[s.i]}.html" class="jm-stop">
      <circle cx="${s.x}" cy="${s.y}" r="13" fill="#ffffff" stroke="${s.part.color}" stroke-width="1.8"/>
      <text x="${s.x}" y="${s.y + 4.5}" font-family="${FONT}" font-size="11" font-weight="600" fill="${s.part.color}" text-anchor="middle">${n}</text>
      <text x="${s.x}" y="${labelY}" font-family="${FONT}" font-size="10.5" fill="#6b6864" text-anchor="middle" opacity="0.85">${s.part.name}</text>
    </a>`;
  });

  // 部分徽标（首站上方标注）
  let badgeX = 60, badgeY = 96;
  PART_INFO.forEach((p) => {
    body += `<g>
      <rect x="${badgeX - 40}" y="${badgeY - 20}" width="80" height="30" rx="15" fill="${p.color}" opacity="0.12"/>
      <text x="${badgeX}" y="${badgeY}" font-family="${FONT}" font-size="12" fill="${p.color}" text-anchor="middle" font-weight="600">${p.no === "开" ? "开" : p.no} · ${p.name}</text>
    </g>`;
    badgeX += 200;
  });

  body += T(60, 262, "开篇", { size: 12.5, fill: SOFT });
  body += T(1140, 262, "决策清单 · 收尾", { size: 12.5, fill: SOFT, anchor: "end" });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WJ} ${HJ}" font-family="${FONT}" role="img" aria-label="十六篇地图导览">
  <rect width="${WJ}" height="${HJ}" fill="none"/>
  ${body}
</svg>`;
}

// ============ 翻译器可视化卡（第二波：02/05/09/12/15 的翻译器小节配图） ============
const WT = 800, WH = 430;
function translatorFig({ cls, left, right, ok, warp, err }) {
  const badge = R(46, 40, 96, 30, { fill: PC[cls], r: 15 }) + T(94, 60, "翻 译 器", { size: 13, fill: "#fff", anchor: "middle", ls: 2, weight: 600 });
  const head = badge +
    R(170, 40, 200, 30, { stroke: HAIR, fill: "#fff", r: 15 }) + T(270, 60, left, { size: 13.5, anchor: "middle", fill: SOFT }) +
    T(392, 61, "⟶", { size: 17, fill: PC[cls], anchor: "middle", weight: 700 }) +
    R(412, 40, 200, 30, { stroke: PC[cls], fill: PCSOFT[cls], r: 15 }) + T(512, 60, right, { size: 13.5, anchor: "middle", fill: PC[cls], weight: 600 });
  const band = (y, label, text, color, soft) =>
    R(46, y, 708, 84, { fill: soft, stroke: HAIR }) +
    R(46, y, 6, 84, { fill: color, r: 3 }) +
    T(74, y + 34, label, { size: 13.5, weight: 600, fill: color }) +
    T(74, y + 62, text, { size: 13.5, fill: INK });
  const body = head +
    band(104, "直译 · 成立处", ok, PC.p5, "#f5f7f0") +
    band(204, "失真处", warp, PC.p3, "#faf3f0") +
    band(304, "大厂人的典型错误", err, INK, "#ffffff");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WT} ${WH}" font-family="${FONT}">
  <rect x="0" y="0" width="${WT}" height="${WH}" fill="${PAPER}"/>
  <rect x="24" y="24" width="${WT - 48}" height="${WH - 48}" rx="12" fill="#ffffff" stroke="${HAIR}"/>
  ${body}
  ${T(46, 416 - 22, "类比在哪里成立、在哪里失效，看见边界再动手", { size: 11.5, fill: FAINT })}
</svg>`;
}

const TRANSLATORS = {
  "02": { cls: "p1", left: "流量思维", right: "医美获客", ok: "获客＝流量，投放＝买量，机构的需求真实存在", warp: "流量增长的尽头是医生的手，而医生的手不能扩容", err: "低价爆款打透市场，等于给交付端埋雷" },
  "05": { cls: "p1", left: "行业早期＝红利窗口", right: "医美的四十年", ok: "不成熟确实意味着空白与位置，机会真实存在", warp: "不成熟已持续四十年，监管整治是周期性天气", err: "把行业落后当成自己的降维打击机会" },
  "09": { cls: "p2", left: "总包 / 期权", right: "底薪 / 提成", ok: "都是固定加浮动的薪酬结构，方向可对译", warp: "期权赌未来有兑现场景，提成赌当期且基数怎么算是利益问题", err: "只谈底薪，不好意思细问提成与考核口径" },
  "12": { cls: "p3", left: "伦理审查委员会", right: "一个人当下的决定", ok: "两边都有红线思维，禁区概念可迁移", warp: "这里没有委员会，灰色决定每天当场由个人裁决，且留痕常在", err: "等公司给指引——在这里你就是全部指引" },
  "15": { cls: "p4", left: "新人培养体系", right: "没有体系", ok: "两边都有新人期的说法，导师制有外形", warp: "没有系统只有碎片，成长不被任何流程兜底", err: "等入职培训与转正答辩来证明自己" },
};
for (const [k, cfg] of Object.entries(TRANSLATORS)) {
  FIGS[k + "b"] = translatorFig(cfg);
}

// 关于页：三级标注说明图
FIGS["labels"] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" font-family="${FONT}">
  <rect x="0" y="0" width="800" height="300" fill="${PAPER}"/>
  <rect x="24" y="24" width="752" height="252" rx="12" fill="#ffffff" stroke="${HAIR}"/>
  ${T(52, 62, "每篇文末的三级标注", { size: 19, weight: 600 })}
  ${R(52, 84, 200, 64, { fill: "#f5f7f0", stroke: HAIR })}${T(152, 112, "引用来源", { size: 14.5, anchor: "middle", weight: 600, fill: PC.p5 })}${T(152, 134, "转述原文，观点归属原作者", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${R(300, 84, 200, 64, { fill: "#faf3f0", stroke: HAIR })}${T(400, 112, "编者综合", { size: 14.5, anchor: "middle", weight: 600, fill: PC.p3 })}${T(400, 134, "跨篇归纳的判断", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${R(548, 84, 200, 64, { fill: "#fff", stroke: HAIR, dash: "5 4" })}${T(648, 112, "待核实", { size: 14.5, anchor: "middle", weight: 600 })}${T(648, 134, "引用前请自行查证", { size: 11.5, anchor: "middle", fill: SOFT })}
  ${LINE_ARROW(152, 162, 152, 196, "p1")}${LINE_ARROW(400, 162, 400, 196, "p1")}${LINE_ARROW(648, 162, 648, 196, "p1")}
  ${R(52, 200, 696, 44, { fill: PCSOFT.p1, stroke: HAIR })}${T(400, 228, "十六篇正文，全部行业判断都标注来源与日期", { size: 14, anchor: "middle", fill: PC.p1 })}
</svg>`;

// ============ 写出 + 渲染校验 ============
let okCount = 0;
for (const [k, svg] of Object.entries(FIGS)) {
  fs.writeFileSync(path.join(OUT, `${k}.svg`), svg);
  try {
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 800 }, font: { loadSystemFonts: true, defaultFontFamily: "Microsoft YaHei" } }).render().asPng();
    okCount++;
  } catch (e) {
    console.error(`✗ ${k}.svg 渲染失败：${e.message}`);
    process.exitCode = 1;
  }
}
fs.writeFileSync(path.join(OUT, "journey.svg"), journeySvg());
try {
  new Resvg(journeySvg(), { fitTo: { mode: "width", value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: "Microsoft YaHei" } }).render();
  okCount++;
} catch (e) {
  console.error(`✗ journey.svg 渲染失败：${e.message}`);
  process.exitCode = 1;
}
console.log(`信息图生成完毕：${Object.keys(FIGS).length} 张文章图 + 1 张导览图，resvg 校验通过 ${okCount} 张`);
