// 极简静态文件服务器 —— 双击运行或 node serve.js 启动
// 用途:预览本皮肤科普站点(首页用 fetch 读 JSON,file:// 无法工作)
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

const server = http.createServer((req, res) => {
  const rawPath = req.url.split("?")[0];
  let urlPath;
  try {
    urlPath = decodeURIComponent(rawPath);
  } catch (e) {
    // 非法编码的请求路径不应击垮服务器
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>400</h1><p>请求路径编码无效</p>");
    return;
  }
  if (urlPath === "/") urlPath = "/index.html";
  // 目录路径自动落到 index.html（如 /consultant/ → /consultant/index.html）
  if (urlPath.endsWith("/")) {
    const indexFile = path.join(ROOT, urlPath, "index.html");
    if (fs.existsSync(indexFile)) urlPath = urlPath + "index.html";
  }

  // 安全:阻止路径穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("403 Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1><p>未找到:" + urlPath + "</p>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("医美科普站点已启动:");
  console.log("  科普门户   http://127.0.0.1:" + PORT + "/");
  console.log("  一路绿灯   http://127.0.0.1:" + PORT + "/consultant/");
  console.log("  示例文章   http://127.0.0.1:" + PORT + "/skin/00-acne.html");
  console.log("按 Ctrl+C 停止。");
});
