// 本地站点验证：目录索引 + 全部页面资源 200
const http = require("http");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const files = ["consultant/", "consultant/index.html", "skin/", "injection/"];
for (const f of fs.readdirSync(path.join(ROOT, "consultant"))) {
  if (f.endsWith(".html") && f !== "index.html") files.push("consultant/" + f);
}
files.push("assets/css/consultant.css", "assets/data/consultant.json");

let bad = 0;
const chain = files.map(f => () => new Promise(res => {
  http.get({ host: "127.0.0.1", port: 8000, path: "/" + encodeURIComponent(f).replace(/%2F/g, "/") }, r => {
    if (r.statusCode !== 200) { bad++; console.log(r.statusCode, f); }
    r.resume(); r.on("end", res);
  }).on("error", e => { bad++; console.log("ERR", f, e.code); res(); });
})).reduce((p, fn) => p.then(fn), Promise.resolve());

chain.then(() => console.log(bad ? "异常 " + bad + " 个" : "目录索引 + " + files.length + " 个资源全部 200 OK"));
