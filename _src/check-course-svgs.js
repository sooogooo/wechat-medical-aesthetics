// 轻量 SVG 良构校验：标签配对、自闭合、重复属性
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '医美咨询师成长教程', 'images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
let fail = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const errors = [];
  const tagRe = /<(\/?)([a-zA-Z][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const closing = m[1] === '/';
    const name = m[2];
    const attrsRaw = m[3];
    const selfClose = m[4] === '/';
    if (!closing && !selfClose) {
      const attrs = attrsRaw.match(/([\w.:-]+)\s*=\s*(?:"[^"]*"|'[^']*')/g) || [];
      const names = attrs.map(a => a.split('=')[0].trim());
      const dup = names.filter((n, i) => names.indexOf(n) !== i);
      if (dup.length) errors.push(`重复属性 ${dup.join(',')} 于 <${name}>`);
      stack.push({ name, pos: m.index });
    } else if (closing) {
      const top = stack.pop();
      if (!top || top.name !== name) {
        errors.push(`闭合错配 </${name}>（栈顶为 ${top ? top.name : '空'}，偏移 ${m.index}）`);
      }
    }
  }
  if (stack.length) errors.push(`未闭合标签 ${stack.map(t => t.name).join(',')}`);
  // 裸 & 检查
  const badAmp = src.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g);
  if (badAmp) errors.push(`未转义 & × ${badAmp.length}`);
  if (errors.length) {
    fail++;
    console.log(`FAIL ${f}`);
    errors.forEach(e => console.log(`   ${e}`));
  } else {
    console.log(`OK   ${f}`);
  }
}
console.log(fail ? `\n${fail} 个文件有问题` : `\n全部 ${files.length} 个 SVG 通过校验`);
process.exit(fail ? 1 : 0);
