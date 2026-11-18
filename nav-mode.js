/* nav-mode.js — وضع التنقل (مثل خرائط Google)
   يعتمد على pdr-nav.js (الموقع/الاتجاه/الوجهة) ولا يغيّر الخريطة أو المسارات أو الباركود.
   الفكرة: "كاميرا" واحدة تتحكم بتحويل لوحة الخريطة (translate · rotate · scale)
   وتتحرك بسلاسة (تنعيم أسّي) نحو الهدف في كل إطار، فلا قفزات ولا اهتزاز.

   الإصدار 2:
   - تنسيقات وضع التنقل تُحقن من هذا الملف (لم تكن موجودة في style.css).
   - بدء تلقائي للتنقل بعد تحديد الموقع (QR) واختيار الوجهة.
   - قناع (mask) ثابت على الشاشة: لا تظهر حواف الخريطة أبداً أثناء التنقل.
   - تنبيه الوصول: بطاقة متحركة + حلقات + اهتزاز + صوت اختياري. */
(function () {
  'use strict';
  if (!window.PDR) return;

  /* ---------- إعدادات الضبط ---------- */
  const NAV = window.NAV_CONFIG = Object.assign({
    autoStart: true,    // يبدأ التنقل تلقائياً بعد تحديد الموقع (QR) واختيار الوجهة
    sound: true,        // السماح بصوت تنبيه الوصول (يمكن كتمه من البطاقة)
    anchorY: 0.68,      // موضع المستخدم على الشاشة (من الأعلى) — أسفل المنتصف ليظهر الطريق أمامه
    deadOn: 6,          // لا تدور الخريطة قبل أن يتجاوز الفرق هذه الدرجات (يمنع الاهتزاز)
    deadOff: 1.5,       // تتوقف المتابعة عند الاقتراب من هذا الفرق
    routeSnapDeg: 18,   // إن كان اتجاهك قريباً من اتجاه المسار نثبّته عليه
    routeSnapW: 0.6,    // قوة التثبيت على اتجاه المسار
    maxTurnRate: 150,   // أقصى سرعة دوران (درجة/ثانية) أثناء التنقل
    tauHeading: 0.2,    // تنعيم قراءة البوصلة (ثانية)
    tauRotate: 0.35,    // تنعيم دوران الخريطة (ثانية)
    tauMove: 0.28,      // تنعيم حركة الموقع (ثانية)
    tauScale: 0.45,     // تنعيم التكبير (ثانية)
    arriveHoldMs: 500   // مدة البقاء قرب الوجهة لتأكيد الوصول
  }, window.NAV_CONFIG || {});

  const $ = id => document.getElementById(id);
  const norm = a => ((a % 360) + 360) % 360;
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const board = $('blueprintBoard'), wrapper = $('mapWrapper');

  /* ---------- التنسيقات (تُحقن هنا حتى لا نعدّل style.css) ---------- */
  const css = document.createElement('style');
  css.id = 'navModeStyles';
  css.textContent = `
@property --nmk { syntax: '<percentage>'; inherits: false; initial-value: 400%; }

/* قناع ثابت على الشاشة: يُظهر محيط المستخدم والمسار فقط ويُخفي بقية الخريطة وحوافها */
body.nav-active .map-wrapper {
  --nmk: 100%;
  transition: --nmk .9s ease;
  -webkit-mask-image: radial-gradient(ellipse calc(var(--nmk) * .72) calc(var(--nmk) * .62) at 50% 68%, #000 52%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(ellipse calc(var(--nmk) * .72) calc(var(--nmk) * .62) at 50% 68%, #000 52%, rgba(0,0,0,0) 100%);
  cursor: default;
}
body.nav-active.nav-exit .map-wrapper { --nmk: 400%; }

/* لا حدود ولا خلفية للوحة أثناء التنقل */
body.nav-active .blueprint-board {
  background: transparent !important;
  border-color: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  will-change: transform;
  backface-visibility: hidden;
}

/* القاعات: تُخفَّف، والوجهة تبقى واضحة. النص يُرسم بعنصر وهمي يُعاد تدويره ليبقى مستقيماً */
body.nav-active .room-node { font-size: 0; opacity: .5; transition: none; }
body.nav-active .room-node.selected { opacity: 1; }
body.nav-active .room-node::after {
  content: attr(data-label);
  display: block;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  white-space: pre-line;
  text-align: center;
  transform: rotate(var(--ctr, 0deg));
}

/* المسار: أوضح مع حركة خفيفة باتجاه المشي */
body.nav-active #routePath { stroke-width: 7; animation: navFlow 1.2s linear infinite; }
@keyframes navFlow { to { stroke-dashoffset: -16; } }

/* المؤشر القديم يُخفى أثناء التنقل ويحل محله مؤشر وضع التنقل */
body.nav-active #pdrMarker { display: none; }

/* مؤشر المستخدم (ثابت على الشاشة) */
.nav-marker {
  position: fixed; left: 0; top: 0; width: 120px; height: 120px;
  margin: -60px 0 0 -60px; z-index: 105; pointer-events: none;
  display: none; will-change: transform;
}
body.nav-active .nav-marker { display: block; }
.nav-marker .nm-ring {
  fill: rgba(37,99,235,.22); stroke: rgba(96,165,250,.6); stroke-width: 1.5;
  transform-box: fill-box; transform-origin: center;
  animation: nmPulse 2s ease-out infinite;
}
@keyframes nmPulse { 0% { transform: scale(.7); opacity: .9; } 100% { transform: scale(1.7); opacity: 0; } }

/* زر بدء/إنهاء التنقل */
.nav-start-btn {
  position: fixed; left: 50%; bottom: calc(92px + env(safe-area-inset-bottom, 0px));
  transform: translate(-50%, 16px); z-index: 112;
  display: flex; align-items: center; gap: 8px;
  padding: 11px 22px; border: none; border-radius: 999px;
  background: var(--primary-blue, #2563eb); color: #fff;
  font-size: 14px; font-weight: 800; cursor: pointer;
  box-shadow: 0 8px 22px rgba(0,0,0,.5);
  opacity: 0; pointer-events: none;
  transition: opacity .25s, transform .25s, background .2s;
  -webkit-tap-highlight-color: transparent;
}
.nav-start-btn.show { opacity: 1; pointer-events: auto; transform: translate(-50%, 0); }
.nav-start-btn.stop { background: #ef4444; }
@media (max-width: 700px) { .nav-start-btn { bottom: calc(104px + env(safe-area-inset-bottom, 0px)); } }

/* تنبيه الوصول */
.nav-arrive {
  position: fixed; inset: 0; z-index: 350;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2,6,23,.55); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
  opacity: 0; pointer-events: none; transition: opacity .25s;
}
.nav-arrive.show { opacity: 1; pointer-events: auto; }
.nav-arrive-card {
  position: relative; width: min(88vw, 340px); text-align: center;
  background: #0f172a; border: 1px solid var(--primary-green, #10b981);
  border-radius: 18px; padding: 26px 22px 20px;
  box-shadow: 0 0 40px rgba(16,185,129,.35), 0 20px 50px rgba(0,0,0,.6);
  transform: scale(.85); transition: transform .35s cubic-bezier(.2,1.4,.4,1);
}
.nav-arrive.show .nav-arrive-card { transform: scale(1); }
.nav-arrive-card h3 { font-size: 17px; margin: 14px 0 6px; color: #fff; }
.nav-arrive-card p { font-size: 13px; color: var(--text-sub, #94a3b8); margin-bottom: 16px; line-height: 1.6; }
.na-icon { position: relative; width: 72px; height: 72px; margin: 0 auto; }
.na-icon svg { position: relative; width: 72px; height: 72px; }
.na-icon::before, .na-icon::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid var(--primary-green, #10b981); opacity: 0;
}
.nav-arrive.show .na-icon::before { animation: naRipple 1.8s ease-out infinite; }
.nav-arrive.show .na-icon::after  { animation: naRipple 1.8s ease-out .6s infinite; }
@keyframes naRipple { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.2); opacity: 0; } }
.na-circle { stroke-dasharray: 151; stroke-dashoffset: 151; }
.na-check  { stroke-dasharray: 40;  stroke-dashoffset: 40; }
.nav-arrive.show .na-circle { animation: naDraw .6s ease forwards; }
.nav-arrive.show .na-check  { animation: naDraw .4s ease .45s forwards; }
@keyframes naDraw { to { stroke-dashoffset: 0; } }
.nav-snd {
  position: absolute; top: 10px; left: 10px; width: 32px; height: 32px;
  border-radius: 50%; border: 1px solid var(--border-color, #334155);
  background: #1e293b; color: #fff; font-size: 14px; cursor: pointer; padding: 0;
}
`;
  document.head.appendChild(css);

  /* ---------- الحالة ---------- */
  let mode = 'off';                    // off | nav | exit
  let raf = 0, last = 0, enteredAt = 0, exitAt = 0;
  let zoomMul = 1, following = false, arrived = false, inSince = 0;
  let hf = 0;                          // الاتجاه بعد التنعيم
  let routeDir = null, routeTimer = 0;
  let fit = { s: 1, x: 0, y: 0 }, exitC = { x: 0, y: 0 };
  let autoPos = null, autoDest = null, btnKey = '';
  const cam = { ax: 0, ay: 0, cx: 0, cy: 0, th: 0, s: 1 };
  const tgt = { ax: 0, ay: 0, cx: 0, cy: 0, th: 0, s: 1 };

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'pdr-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  /* ---------- الصوت (اختياري) ---------- */
  let actx = null, soundOn = true;
  try { soundOn = localStorage.getItem('nav_sound') !== '0'; } catch (e) { /* سفاري الخاص */ }
  function unlockAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { /* غير مدعوم */ }
  }
  // المتصفحات تسمح بالصوت فقط بعد تفاعل المستخدم، لذا نفتحه عند أول لمسة
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, unlockAudio, { passive: true }));
  function chime() {
    if (!NAV.sound || !soundOn || !actx) return;
    try {
      const now = actx.currentTime;
      [[659.25, 0], [783.99, 0.16], [1046.5, 0.32]].forEach(([f, t]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.5);
        o.connect(g); g.connect(actx.destination);
        o.start(now + t); o.stop(now + t + 0.55);
      });
    } catch (e) { /* تجاهل */ }
  }

  /* ---------- واجهة: الزر الجانبي + مؤشر المستخدم + بطاقة الوصول ---------- */
  const btn = document.createElement('button');
  btn.className = 'nav-start-btn';
  btn.type = 'button';
  document.body.appendChild(btn);

  const marker = document.createElement('div');
  marker.className = 'nav-marker';
  marker.innerHTML =
    '<svg viewBox="-60 -60 120 120" width="120" height="120">' +
    '<defs><radialGradient id="navBeamGrad" cx="0" cy="0" r="62" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#3b82f6" stop-opacity=".55"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient></defs>' +
    '<circle class="nm-ring" r="18"/>' +
    '<g id="navArrow"><path d="M0 0 L-30 -58 A66 66 0 0 1 30 -58 Z" fill="url(#navBeamGrad)"/></g>' +
    '<circle r="10" fill="#2563eb" stroke="#fff" stroke-width="3.5"/></svg>';
  document.body.appendChild(marker);
  const arrow = marker.querySelector('#navArrow');

  const arrive = document.createElement('div');
  arrive.className = 'nav-arrive';
  arrive.innerHTML =
    '<div class="nav-arrive-card" role="alertdialog" aria-live="assertive">' +
    '<button type="button" class="nav-snd" id="naSnd" title="الصوت" aria-label="الصوت"></button>' +
    '<div class="na-icon"><svg viewBox="0 0 52 52">' +
    '<circle class="na-circle" cx="26" cy="26" r="24" fill="rgba(16,185,129,.18)" stroke="#10b981" stroke-width="3"/>' +
    '<path class="na-check" d="M14 27 l8 8 l16 -17" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg></div>' +
    '<h3 dir="ltr">You have arrived at your destination!</h3>' +
    '<p id="naPlace"></p>' +
    '<button type="button" class="test-btn" id="naOk">تم</button></div>';
  document.body.appendChild(arrive);
  $('naOk').onclick = () => { hideArrive(); if (mode === 'nav') stop(); };

  const sndBtn = $('naSnd');
  function refreshSnd() { sndBtn.textContent = soundOn ? '🔊' : '🔇'; sndBtn.style.display = NAV.sound ? '' : 'none'; }
  sndBtn.onclick = () => {
    soundOn = !soundOn;
    try { localStorage.setItem('nav_sound', soundOn ? '1' : '0'); } catch (e) { /* تجاهل */ }
    refreshSnd(); if (soundOn) chime();
  };
  refreshSnd();

  function showArrive() {
    const d = PDR.state().dest;
    $('naPlace').textContent = (d ? d.label + ' — ' : '') + 'لقد وصلت إلى وجهتك';
    arrive.classList.remove('show'); void arrive.offsetWidth; // لإعادة تشغيل الحركة
    arrive.classList.add('show');
    chime();
    try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* غير مدعوم */ }
  }
  function hideArrive() { arrive.classList.remove('show'); }

  /* ---------- الكاميرا ---------- */
  const baseScale = () => clamp(Math.min(wrapper.clientWidth, wrapper.clientHeight) / 270, 1.25, 2.4);

  function applyCam() {
    board.style.transform =
      'translate(' + cam.ax.toFixed(2) + 'px,' + cam.ay.toFixed(2) + 'px) rotate(' + (-cam.th).toFixed(3) + 'deg) ' +
      'scale(' + cam.s.toFixed(4) + ') translate(' + (-cam.cx).toFixed(2) + 'px,' + (-cam.cy).toFixed(2) + 'px)';
    board.style.setProperty('--ctr', cam.th.toFixed(3) + 'deg'); // تعديل اتجاه النصوص لتبقى مستقيمة
    marker.style.transform = 'translate(' + cam.ax.toFixed(1) + 'px,' + cam.ay.toFixed(1) + 'px)';
    arrow.setAttribute('transform', 'rotate(' + angDiff(hf, cam.th).toFixed(1) + ')');
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = clamp((t - (last || t)) / 1000, 0.001, 0.05); last = t;
    const K = tau => 1 - Math.exp(-dt / tau);
    const w = wrapper.clientWidth, h = wrapper.clientHeight;
    const st = PDR.state();

    if (mode === 'nav') {
      const entering = t - enteredAt < 1000;
      if (st.pos && PDR.matches()) { tgt.cx = st.pos.x; tgt.cy = st.pos.y; }
      tgt.ax = w / 2; tgt.ay = h * NAV.anchorY; tgt.s = baseScale() * zoomMul;

      // الاتجاه: بوصلة → تنعيم → منطقة ميتة → دوران محدود السرعة
      let raw = st.devHeading == null ? (routeDir != null ? routeDir : hf) : PDR.heading();
      if (st.devHeading != null && routeDir != null) {
        const d = angDiff(routeDir, raw);
        if (Math.abs(d) < NAV.routeSnapDeg) raw = norm(raw + d * NAV.routeSnapW);
      }
      hf = norm(hf + angDiff(raw, hf) * K(NAV.tauHeading));
      const dd = angDiff(hf, cam.th);
      if (!following && Math.abs(dd) > NAV.deadOn) following = true;
      else if (following && Math.abs(dd) < NAV.deadOff) following = false;
      tgt.th = (following || entering) ? hf : cam.th;

      // الوصول
      if (!arrived && st.dest && st.pos && PDR.matches()) {
        const dist = Math.hypot(st.pos.x - st.dest.x, st.pos.y - st.dest.y);
        if (dist <= PDR.cfg.arriveR) {
          if (!inSince) inSince = t;
          if (t - inSince > NAV.arriveHoldMs) { arrived = true; showArrive(); }
        } else inSince = 0;
      }
    } else if (mode === 'exit') {
      tgt.th = 0; tgt.s = fit.s;
      tgt.cx = exitC.x; tgt.cy = exitC.y;
      tgt.ax = fit.x + exitC.x * fit.s; tgt.ay = fit.y + exitC.y * fit.s;
    }

    const entering = mode === 'nav' && t - enteredAt < 1000;
    const tm = entering ? 0.3 : NAV.tauMove;
    cam.ax += (tgt.ax - cam.ax) * K(tm);
    cam.ay += (tgt.ay - cam.ay) * K(tm);
    cam.cx += (tgt.cx - cam.cx) * K(tm);
    cam.cy += (tgt.cy - cam.cy) * K(tm);
    cam.s += (tgt.s - cam.s) * K(NAV.tauScale);
    const fast = entering || mode === 'exit';
    const maxStep = (fast ? 420 : NAV.maxTurnRate) * dt;
    cam.th = norm(cam.th + clamp(angDiff(tgt.th, cam.th) * K(NAV.tauRotate), -maxStep, maxStep));
    applyCam();

    if (mode === 'exit') {
      const done = Math.abs(angDiff(0, cam.th)) < 0.5 && Math.abs(cam.s - fit.s) < 0.004 &&
        Math.hypot(cam.ax - tgt.ax, cam.ay - tgt.ay) < 1;
      if (done || t - exitAt > 1400) finish();
    }
  }

  /* ---------- تشغيل / إيقاف ---------- */
  const needsSensorPermission = () =>
    (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') ||
    (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function');

  function start(auto) {
    const st = PDR.state();
    if (!st.pos || !PDR.matches()) { toast('امسح QR (📷) لتحديد موقعك على هذا الدور أولاً'); return; }
    if (!st.dest) { toast('اختر القاعة التي تريد الذهاب إليها أولاً'); return; }
    unlockAudio();
    if (!PDR.isTracking()) {
      // آيفون يشترط ضغطة مباشرة لطلب إذن الحركة/الاتجاه؛ البدء التلقائي ليس ضغطة
      if (auto && needsSensorPermission()) toast('اضغط 📍 لتفعيل الاتجاه ليتبع الخريطة حركتك');
      else PDR.toggleTracking();
    }

    hideArrive(); arrived = false; inSince = 0; zoomMul = 1; following = true;
    autoPos = st.posCtx; autoDest = st.dest;
    if (mode === 'off') {
      // نبدأ من العرض الحالي نفسه ثم تنزلق الكاميرا إلى وضع التنقل
      cam.s = scale; cam.th = 0;
      cam.cx = st.pos.x; cam.cy = st.pos.y;
      cam.ax = pointX + st.pos.x * scale; cam.ay = pointY + st.pos.y * scale;
    }
    mode = 'nav'; enteredAt = performance.now(); last = 0;
    routeDir = PDR.routeDirection();
    hf = st.devHeading == null ? (routeDir != null ? routeDir : 0) : PDR.heading();
    document.body.classList.remove('nav-exit');
    document.body.classList.add('nav-active');
    board.querySelectorAll('.room-node').forEach(n => n.setAttribute('data-label', n.textContent));
    clearInterval(routeTimer);
    routeTimer = setInterval(() => { if (mode === 'nav') routeDir = PDR.routeDirection(); }, 300);
    if (!raf) raf = requestAnimationFrame(frame);
    refreshBtn();
  }

  function stop() {
    if (mode !== 'nav') return;
    hideArrive();
    clearInterval(routeTimer);
    mode = 'exit'; exitAt = performance.now();
    document.body.classList.add('nav-exit');   // يوسّع القناع تدريجياً أثناء العودة للعرض الكامل
    fitToScreen();                       // يحسب العرض الكامل (المحجوب أثناء التنقل)
    fit = { s: scale, x: pointX, y: pointY };
    exitC = { x: cam.cx, y: cam.cy };
    refreshBtn();
  }

  function finish() {                    // إنهاء فوري وعودة للعرض الكامل
    if (mode === 'off') return;
    mode = 'off';
    cancelAnimationFrame(raf); raf = 0; last = 0;
    clearInterval(routeTimer);
    hideArrive();
    document.body.classList.remove('nav-active', 'nav-exit');
    board.style.removeProperty('--ctr');
    board.querySelectorAll('.room-node').forEach(n => n.removeAttribute('data-label'));
    fitToScreen();
    refreshBtn();
  }

  function refreshBtn() {
    const st = PDR.state();
    const ready = mode === 'nav' || (mode === 'off' && st.pos && PDR.matches());
    const key = (ready ? 1 : 0) + '|' + mode;
    if (key === btnKey) return;          // لا نعيد بناء الزر إلا عند تغيّر الحالة (يمنع ضياع الضغطة)
    btnKey = key;
    btn.classList.toggle('show', !!ready);
    btn.classList.toggle('stop', mode === 'nav');
    btn.innerHTML = mode === 'nav'
      ? '<i class="fas fa-xmark"></i><span>إنهاء التنقل</span>'
      : '<i class="fas fa-location-arrow"></i><span>ابدأ التنقل</span>';
  }
  btn.onclick = () => { if (mode === 'nav') stop(); else start(false); };

  // بدء تلقائي: بعد تحديد الموقع بـ QR واختيار الوجهة (مرة واحدة لكل موقع/وجهة جديدة)
  function tick() {
    refreshBtn();
    const st = PDR.state();
    if (mode !== 'off') { autoPos = st.posCtx; autoDest = st.dest; return; }
    if (!NAV.autoStart || !st.pos || !PDR.matches() || !st.dest) return;
    if (st.posCtx === autoPos && st.dest === autoDest) return;
    start(true);
  }
  setInterval(tick, 300);

  /* ---------- ربط بدون تعديل الكود الأصلي ---------- */
  // أثناء التنقل الكاميرا وحدها تتحكم بتحويل الخريطة
  const _ut = window.updateTransform;
  window.updateTransform = function () { if (mode !== 'off') return; return _ut.apply(this, arguments); };

  // القرص/الأزرار تغيّر تكبير وضع التنقل بدل العرض الكامل
  const _za = window.zoomAt;
  window.zoomAt = function (cx, cy, f) {
    if (mode !== 'off') { zoomMul = clamp(zoomMul * f, 0.55, 2.4); return; }
    return _za.apply(this, arguments);
  };
  const _rz = window.resetZoom;
  window.resetZoom = function () { if (mode !== 'off') { zoomMul = 1; return; } return _rz.apply(this, arguments); };

  // إنهاء التوجيه / تغيير القاعة → خروج سلس من وضع التنقل
  const _clear = window.clearNavigation;
  window.clearNavigation = function () { _clear.apply(this, arguments); if (mode === 'nav') stop(); hideArrive(); };

  // تغيير المبنى/الدور → خروج فوري قبل إعادة الرسم
  const _rb = window.renderBlueprint;
  window.renderBlueprint = function () { if (mode !== 'off') finish(); return _rb.apply(this, arguments); };

  // اختيار وجهة جديدة أثناء التنقل
  const _hr = window.highlightAndRoute;
  window.highlightAndRoute = function () {
    const r = _hr.apply(this, arguments);
    arrived = false; inSince = 0; hideArrive();
    return r;
  };

  window.NavMode = { start, stop, state: () => ({ mode, cam: Object.assign({}, cam), heading: hf, arrived }) };
})();
