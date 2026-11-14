/* splash.js - كل شي في ملف واحد: splash الآيفون + شاشة تحميل مَسَار تتلاشى */
(function () {
  // ===== عدّل هنا =====
  var BG_COLOR = "#0b1e3f";   // كحلي غامق
  var TEXT = "مَسَار";
  var TEXT_COLOR = "#ffffff";
  var FONT_SIZE = 0.16;       // حجم الخط من عرض الشاشة
  var SHOW_MS = 600;          // مدة بقاء الشاشة بعد التحميل
  // ====================

  // لون شريط الحالة
  var meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = BG_COLOR;
  document.head.appendChild(meta);

  // ستايل الـ loader
  var style = document.createElement("style");
  style.textContent =
    "html,body{background:" + BG_COLOR + ";margin:0}" +
    "#masar-loader{position:fixed;inset:0;z-index:99999;background:" + BG_COLOR + ";" +
    "color:" + TEXT_COLOR + ";display:flex;align-items:center;justify-content:center;" +
    "font:bold " + (FONT_SIZE * 100) + "vw Tahoma,Arial,sans-serif;transition:opacity .8s ease}" +
    "#masar-loader.hide{opacity:0;pointer-events:none}";
  document.head.appendChild(style);

  // الـ loader نفسه
  var loader = document.createElement("div");
  loader.id = "masar-loader";
  loader.textContent = TEXT;
  document.documentElement.appendChild(loader);

  // التلاشي بعد التحميل
  window.addEventListener("load", function () {
    setTimeout(function () {
      loader.classList.add("hide");
      setTimeout(function () { loader.remove(); }, 900);
    }, SHOW_MS);
  });

  // splash الآيفون (صورة ثابتة)
  var w = screen.width, h = screen.height, r = window.devicePixelRatio || 1;
  var canvas = document.createElement("canvas");
  canvas.width = w * r;
  canvas.height = h * r;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = TEXT_COLOR;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold " + Math.round(canvas.width * FONT_SIZE) + "px Tahoma, Arial, sans-serif";
  ctx.fillText(TEXT, canvas.width / 2, canvas.height / 2);

  var link = document.createElement("link");
  link.rel = "apple-touch-startup-image";
  link.media =
    "screen and (device-width: " + w + "px) and (device-height: " + h + "px)" +
    " and (-webkit-device-pixel-ratio: " + r + ") and (orientation: portrait)";
  link.href = canvas.toDataURL("image/png");
  document.head.appendChild(link);
})();
