/**
 * fix-punctuation.js — 清洗全站 HTML 正文标点
 *
 * 规则：
 * 1. 标题（title/h1/h2/h3）里的全角冒号「：」→ 删除或替换
 * 2. 破折号「——」→ 按语境替换为逗号或句号
 * 3. 双引号确保全角配对（已是全角的跳过）
 *
 * 只处理 > 和 < 之间的文本节点，不碰标签属性
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// 收集所有要处理的 HTML 文件
function collectHtml() {
  const dirs = ["", "skin", "surgery", "injection", "aesthetics", "types"];
  const files = [];
  for (const d of dirs) {
    const dirPath = d ? path.join(ROOT, d) : ROOT;
    if (!fs.existsSync(dirPath)) continue;
    for (const f of fs.readdirSync(dirPath)) {
      if (f.endsWith(".html")) files.push(path.join(dirPath, f));
    }
  }
  return files;
}

// 清洗文本节点里的标点
function cleanText(text, isTitle = false) {
  let result = text;

  if (isTitle) {
    // 标题里的全角冒号：全部去掉
    // 中间的冒号 → 用逗号或直接去掉（看语境）
    // "削下颌角是四级手术：风险和决策一次说清" → "削下颌角是四级手术，风险和决策一次说清"
    result = result.replace(/：/g, "，");
    // 但如果逗号在标题末尾，去掉
    result = result.replace(/，\s*$/g, "");
    // 连续逗号清理
    result = result.replace(/，，/g, "，");
  }

  // 破折号 —— 替换
  // 语境1：句中解释 "X——Y" → "X，Y" 或 "X。Y"
  // 语境2：句末补充 "X——Y。" → "X，Y。"
  // 统一策略：—— → ，（逗号），因为大多数破折号在句中起补充说明作用
  result = result.replace(/——/g, "，");

  // 修正可能产生的连续逗号
  result = result.replace(/，，/g, "，");

  return result;
}

// 处理单个 HTML 文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // 策略：用正则匹配 > 和 < 之间的文本节点，逐个清洗
  // 匹配模式：>([^<]+)<  —— 标签之间的文本
  content = content.replace(/>([^<]+)</g, (match, text) => {
    // 判断是否在标题标签内（通过前文判断）
    // 这里用简单方法：如果文本包含标题特征就按标题处理
    // 更精确：在外层循环里按标签处理

    const cleaned = cleanText(text);
    return ">" + cleaned + "<";
  });

  // 单独处理 <title> 标签内容
  content = content.replace(/<title([^>]*)>([^<]*)<\/title>/g, (match, attrs, text) => {
    return "<title" + attrs + ">" + cleanText(text, true) + "</title>";
  });

  // 单独处理 <h1> 标签内容
  content = content.replace(/<h1([^>]*)>([^<]*)<\/h1>/g, (match, attrs, text) => {
    return "<h1" + attrs + ">" + cleanText(text, true) + "</h1>";
  });

  // 处理 <h2> 标签
  content = content.replace(/<h2([^>]*)>([^<]*)<\/h2>/g, (match, attrs, text) => {
    return "<h2" + attrs + ">" + cleanText(text, true) + "</h2>";
  });

  // 处理 <h3> 标签
  content = content.replace(/<h3([^>]*)>([^<]*)<\/h3>/g, (match, attrs, text) => {
    return "<h3" + attrs + ">" + cleanText(text, true) + "</h3>";
  });

  // 处理 <p class="article__lead"> 里的冒号（副标题/导语，类似标题）
  content = content.replace(/<p class="article__lead">([^<]*)<\/p>/g, (match, text) => {
    return '<p class="article__lead">' + cleanText(text, false) + "</p>";
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

// 主流程
const files = collectHtml();
let changed = 0;
for (const f of files) {
  if (processFile(f)) changed++;
}
console.log("处理了 " + files.length + " 个 HTML 文件，" + changed + " 个有修改");
