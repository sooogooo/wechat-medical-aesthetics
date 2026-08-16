/**
 * share.js — 全站共享分享组件
 * 依赖：页面存在 <button class="share-btn" id="shareBtn">
 * 行为：navigator.share（移动端系统分享，可发微信）→ 剪贴板 + toast 兜底
 */
(function () {
  "use strict";
  var sb = document.getElementById("shareBtn");
  if (!sb) return;
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("cpToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cpToast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }
  sb.addEventListener("click", function () {
    var siteName = (document.querySelector('meta[property="og:site_name"]') || {}).content || "";
    var title = ((document.querySelector('meta[property="og:title"]') || {}).content
      || document.title.split("·")[0].trim() || siteName);
    var data = {
      title: title,
      text: title + (siteName && siteName !== title ? " · " + siteName : ""),
      url: location.href
    };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data.url).then(
        function () { toast("链接已复制，粘贴给微信好友即可分享"); },
        function () { toast("复制失败，请手动复制地址栏链接"); }
      );
    } else {
      toast("请手动复制地址栏链接分享");
    }
  });
})();
