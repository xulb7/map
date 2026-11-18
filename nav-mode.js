/* nav-mode.js — وضع التنقل (مثل خرائط Google)
   يعتمد على pdr-nav.js (الموقع/الاتجاه/الوجهة) ولا يغيّر الخريطة أو المسارات أو الباركود.
   الفكرة: "كاميرا" واحدة تتحكم بتحويل لوحة الخريطة (translate · rotate · scale)
   وتتحرك بسلاسة (تنعيم أسّي) نحو الهدف في كل إطار، فلا قفزات ولا اهتزاز. */
(function () {
  'use strict';
  if (!window.PDR) return;

  /* ---------- إعدادات الضبط ---------- */
  const NAV = window.NAV_CONFIG = Object.assign({
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

  /* ---------- الحالة ---------- */
  let mode = 'off';                    // off | nav | exit
  let raf = 0, last = 0, enteredAt = 0, exitAt = 0;
  let zoomMul = 1, following = false, arrived = false, inSince = 0;
  let hf = 0;                          // الاتجاه بعد التنعيم
  let routeDir = null, routeTimer = 0;
  let fit = { s: 1, x: 0, y: 0 }, exitC = { x: 0, y: 0 };
  const cam = { ax: 0, ay: 0, cx: 0, cy: 0, th: 0, s: 1 };
  const tgt = { ax: 0, ay: 0, cx: 0, cy: 0, th: 0, s: 1 };

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'pdr-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
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
    '<div class="na-icon"><svg viewBox="0 0 52 52">' +
    '<circle class="na-circle" cx="26" cy="26" r="24" fill="rgba(16,185,129,.18)" stroke="#10b981" stroke-width="3"/>' +
    '<path class="na-check" d="M14 27 l8 8 l16 -17" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg></div>' +
    '<h3 dir="ltr">You have arrived at your destination!</h3>' +
    '<p id="naPlace"></p>' +
    '<button type="button" class="test-btn" id="naOk">تم</button></div>';
  document.body.appendChild(arrive);
  $('naOk').onclick = () => { hideArrive(); if (mode === 'nav') stop(); };

  function showArrive() {
    const d = PDR.state().dest;
    $('naPlace').textContent = (d ? d.label + ' — ' : '') + 'لقد وصلت إلى وجهتك';
    arrive.classList.remove('show'); void arrive.offsetWidth; // لإعادة تشغيل الحركة
    arrive.classList.add('show');
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
  function start() {
    const st = PDR.state();
    if (!st.pos || !PDR.matches()) { toast('امسح QR (📷) لتحديد موقعك على هذا الدور أولاً'); return; }
    if (!st.dest) { toast('اختر القاعة التي تريد الذهاب إليها أولاً'); return; }
    // يجب أن يُطلب إذن الحركة/الاتجاه مباشرة من ضغطة الزر
    if (!PDR.isTracking()) PDR.toggleTracking();

    hideArrive(); arrived = false; inSince = 0; zoomMul = 1; following = true;
    if (mode === 'off') {
      // نبدأ من العرض الحالي نفسه ثم تنزلق الكاميرا إلى وضع التنقل
      cam.s = scale; cam.th = 0;
      cam.cx = st.pos.x; cam.cy = st.pos.y;
      cam.ax = pointX + st.pos.x * scale; cam.ay = pointY + st.pos.y * scale;
    }
    mode = 'nav'; enteredAt = performance.now(); last = 0;
    routeDir = PDR.routeDirection();
    hf = st.devHeading == null ? (routeDir != null ? routeDir : 0) : PDR.heading();
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
    document.body.classList.remove('nav-active');
    board.style.removeProperty('--ctr');
    board.querySelectorAll('.room-node').forEach(n => n.removeAttribute('data-label'));
    fitToScreen();
    refreshBtn();
  }

  function refreshBtn() {
    const st = PDR.state();
    const ready = mode === 'nav' || (mode === 'off' && st.pos && PDR.matches());
    btn.classList.toggle('show', !!ready);
    btn.classList.toggle('stop', mode === 'nav');
    btn.innerHTML = mode === 'nav'
      ? '<i class="fas fa-xmark"></i><span>إنهاء التنقل</span>'
      : '<i class="fas fa-location-arrow"></i><span>ابدأ التنقل</span>';
  }
  btn.onclick = () => { if (mode === 'nav') stop(); else start(); };
  setInterval(refreshBtn, 400);

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
