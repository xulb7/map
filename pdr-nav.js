/* pdr-nav.js — إضافة PDR + QR + تثبيت الموقع على الممرات (Map Matching)
   تُضاف قبل </body> وبعد السكربت الأساسي:  <script src="pdr-nav.js"></script>
   لا تعدّل أي كود موجود؛ تغلّف الدوال الحالية فقط. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const CFG = window.PDR_CONFIG = Object.assign({
    pxPerM: 9,            // بكسل لكل متر (تقدير — عدّله بعد القياس)
    strideM: 0.7,         // طول الخطوة بالمتر
    snapR: 12,            // نصف قطر البحث عن الممر
    minAlign: 0.35,       // أقل توافق بين اتجاه المشي واتجاه الممر
    stepMinMs: 320,       // أقل زمن بين خطوتين
    stepThresh: 1.2,      // حساسية كشف الخطوة (م/ث²)
    joinTol: 14,          // مسافة ربط الخطوط ببعض
    arriveR: 18,          // مسافة الوصول (بكسل)
    buildingNorth: { A: 0, B: 0 } // اتجاه "أعلى الخريطة" بالنسبة للشمال الحقيقي (درجات)
  }, window.PDR_CONFIG || {});
  const FLOOR_ALIAS = { Ground: 'الدور الأرضي', First: 'الدور الأول', Second: 'الدور الثاني' };

  let edges = [], nodes = [], adj = [];
  let pos = null, posCtx = null, dest = null;
  let tracking = false, devHeading = null, manualOffset = null, pendingH = null, steps = 0;
  let lastStepT = 0, avg = 9.8, d1 = 0, d2 = 0;
  let markerEl, arrowEl, stepsEl, trackBtn;

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
  const offset = () => manualOffset != null ? manualOffset : (CFG.buildingNorth[selectedBldg] || 0);
  const mapHeading = () => (((devHeading == null ? offset() : devHeading) - offset()) + 360) % 360;
  const matchesFloor = () => pos && posCtx && posCtx.b === selectedBldg && posCtx.f === selectedFloor;

  function proj(P, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
    let t = L2 ? ((P.x - a.x) * dx + (P.y - a.y) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const pt = { x: a.x + t * dx, y: a.y + t * dy };
    return { pt, t, d: dist(P, pt) };
  }

  /* ---------- بناء الرسم البياني للممرات من بيانات الخريطة ---------- */
  function collectSegments() {
    const fl = campusData[selectedBldg][selectedFloor];
    const segs = [];
    const parse = s => s.trim().split(/\s+/).map(p => { const [x, y] = p.split(',').map(Number); return { x, y }; });
    const add = pts => { for (let i = 0; i < pts.length - 1; i++) segs.push({ a: pts[i], b: pts[i + 1] }); };
    const tmp = document.createElement('div');
    tmp.innerHTML = '<svg xmlns="' + NS + '">' + fl.corridorsSvg + '</svg>';
    tmp.querySelectorAll('polyline').forEach(pl => add(parse(pl.getAttribute('points'))));
    fl.rooms.forEach(r => add(parse(r.routePoints)));
    return segs.filter(s => dist(s.a, s.b) > 0.5);
  }

  function buildGraph() {
    const segs = collectSegments();
    const splits = segs.map(() => []), extra = [];
    segs.forEach((s, i) => [s.a, s.b].forEach(P => segs.forEach((t, j) => {
      if (i === j) return;
      const q = proj(P, t.a, t.b);
      if (q.d <= CFG.joinTol) { splits[j].push(q.pt); if (q.d > 0.5) extra.push({ a: P, b: q.pt }); }
    })));
    const all = [];
    segs.forEach((s, i) => {
      const pts = [s.a, s.b, ...splits[i]].map(p => ({ p, t: proj(p, s.a, s.b).t })).sort((u, v) => u.t - v.t).map(o => o.p);
      for (let k = 0; k < pts.length - 1; k++) if (dist(pts[k], pts[k + 1]) > 0.5) all.push({ a: pts[k], b: pts[k + 1] });
    });
    extra.forEach(e => all.push(e));
    nodes = []; adj = []; edges = [];
    const nid = p => {
      let k = nodes.findIndex(n => dist(n, p) < 4);
      if (k < 0) { nodes.push({ x: p.x, y: p.y }); adj.push([]); k = nodes.length - 1; }
      return k;
    };
    all.forEach(e => {
      const u = nid(e.a), v = nid(e.b);
      if (u === v) return;
      const w = dist(nodes[u], nodes[v]);
      edges.push({ u, v, a: nodes[u], b: nodes[v], w });
      adj[u].push({ to: v, w }); adj[v].push({ to: u, w });
    });
  }

  function snap(P) {
    let best = null;
    for (const e of edges) { const q = proj(P, e.a, e.b); if (!best || q.d < best.d) best = { pt: q.pt, e, d: q.d }; }
    return best;
  }
  const nearestNode = P => nodes.reduce((b, n, i) => (b < 0 || dist(n, P) < dist(nodes[b], P)) ? i : b, -1);

  function shortestPath(from, to) {
    const n = nodes.length, D = Array(n).fill(Infinity), prev = Array(n).fill(-1), done = Array(n).fill(false);
    D[from.e.u] = dist(from.pt, from.e.a);
    D[from.e.v] = Math.min(D[from.e.v], dist(from.pt, from.e.b));
    for (;;) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && D[i] < Infinity && (u < 0 || D[i] < D[u])) u = i;
      if (u < 0 || u === to) break;
      done[u] = true;
      adj[u].forEach(({ to: v, w }) => { if (D[u] + w < D[v]) { D[v] = D[u] + w; prev[v] = u; } });
    }
    if (D[to] === Infinity) return null;
    const path = [];
    for (let c = to; c !== -1; c = prev[c]) path.push(nodes[c]);
    path.reverse(); path.unshift(from.pt);
    return path;
  }

  /* ---------- الحركة: تنزلق النقطة على الممرات فقط ---------- */
  function move(stride) {
    const th = mapHeading() * Math.PI / 180, h = { x: Math.sin(th), y: -Math.cos(th) };
    let best = null;
    for (const e of edges) {
      const q = proj(pos, e.a, e.b);
      if (q.d > CFG.snapR) continue;
      const ux = (e.b.x - e.a.x) / e.w, uy = (e.b.y - e.a.y) / e.w;
      for (const sg of [1, -1]) {
        if (sg * (ux * h.x + uy * h.y) < CFG.minAlign) continue;
        const c = proj({ x: q.pt.x + sg * ux * stride, y: q.pt.y + sg * uy * stride }, e.a, e.b);
        const gain = (c.pt.x - pos.x) * h.x + (c.pt.y - pos.y) * h.y;
        if (!best || gain > best.gain) best = { gain, pt: c.pt };
      }
    }
    if (!best || best.gain < stride * 0.15) return false; // جدار أو نهاية ممر
    pos = best.pt;
    return true;
  }

  function onStep() {
    if (!matchesFloor()) return;
    steps++;
    if (move(CFG.strideM * CFG.pxPerM)) updateRoute();
    render();
    if (stepsEl) stepsEl.textContent = 'الخطوات: ' + steps;
  }

  /* ---------- المسار من الموقع الحالي ---------- */
  function updateRoute() {
    if (!matchesFloor() || !dest) return;
    const s = snap(pos), t = nearestNode(dest);
    if (!s || t < 0) return;
    const path = shortestPath(s, t);
    if (!path) return;
    document.getElementById('routePath').setAttribute('d', 'M ' + path.map(p => p.x + ' ' + p.y).join(' L '));
    let len = 0;
    for (let i = 1; i < path.length; i++) len += dist(path[i - 1], path[i]);
    const info = document.getElementById('infoText');
    info.innerText = dist(pos, dest) <= CFG.arriveR
      ? 'وصلت إلى ' + dest.label
      : dest.label + ' — المتبقي تقريباً ' + Math.round(len / CFG.pxPerM) + ' م';
  }

  function render() {
    if (!markerEl) return;
    if (!matchesFloor()) { markerEl.setAttribute('display', 'none'); return; }
    markerEl.setAttribute('display', 'block');
    markerEl.setAttribute('transform', 'translate(' + pos.x + ',' + pos.y + ')');
    arrowEl.setAttribute('transform', 'rotate(' + mapHeading() + ')');
  }

  function setPos(x, y, b, f) {
    const s = snap({ x, y });
    pos = s ? s.pt : { x, y };
    posCtx = { b, f };
  }

  /* ---------- QR ---------- */
  function findRoom(id) {
    for (const b in campusData) for (const f in campusData[b]) {
      const room = campusData[b][f].rooms.find(r => r.id === id);
      if (room) return { b, f, room };
    }
    return null;
  }
  const lastPoint = room => room.routePoints.split(' ').pop().split(',').map(Number);

  // صيغ الرابط: ?bldg=A&floor=Ground&x=232&y=495&h=0  أو  ?from=A-G-5  (موقعك)  و  &room=A-G-9 (الوجهة)
  function applyParams(p) {
    let b = p.get('bldg'), f = p.get('floor');
    f = FLOOR_ALIAS[f] || f;
    let x = parseFloat(p.get('x')), y = parseFloat(p.get('y'));
    const from = p.get('from') && findRoom(p.get('from'));
    if (from) { b = from.b; f = from.f; [x, y] = lastPoint(from.room); }
    const rr = p.get('room') && findRoom(p.get('room'));
    const hasStart = campusData[b] && campusData[b][f] && !isNaN(x) && !isNaN(y);
    if (!hasStart) { if (!rr) return false; b = rr.b; f = rr.f; }
    if (b !== selectedBldg || f !== selectedFloor) {
      selectBuilding(b); selectedFloor = f; renderFloorsMenu(); renderBlueprint();
    }
    if (hasStart) {
      setPos(x, y, b, f);
      const h = parseFloat(p.get('h'));
      if (!isNaN(h)) { if (devHeading != null) manualOffset = devHeading - h; else pendingH = h; }
      toast('تم تحديد موقعك');
    }
    if (rr && rr.b === selectedBldg && rr.f === selectedFloor) {
      document.getElementById('roomDropdown').value = rr.room.id;
      highlightAndRoute();
    }
    render(); updateRoute();
    return true;
  }
  function handleQrText(text) {
    try { const u = new URL(text, location.href); return applyParams(u.searchParams); } catch (e) { return false; }
  }

  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });

  async function scanQr() {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px';
    ov.innerHTML = '<video playsinline muted style="max-width:100%;max-height:75%"></video><button class="close-btn">إلغاء</button>';
    document.body.appendChild(ov);
    const video = ov.querySelector('video');
    let stream, stop = false;
    const close = () => { stop = true; if (stream) stream.getTracks().forEach(t => t.stop()); ov.remove(); };
    ov.querySelector('button').onclick = close;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream; await video.play();
    } catch (e) { close(); toast('تعذر فتح الكاميرا (يلزم HTTPS وإذن الكاميرا)'); return; }
    let det = null;
    if ('BarcodeDetector' in window) det = new BarcodeDetector({ formats: ['qr_code'] });
    else if (!window.jsQR) { try { await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'); } catch (e) { close(); toast('تعذر تحميل قارئ QR'); return; } }
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const tick = async () => {
      if (stop) return;
      try {
        let text = null;
        if (det) { const r = await det.detect(video); if (r[0]) text = r[0].rawValue; }
        else if (video.videoWidth) {
          cv.width = video.videoWidth; cv.height = video.videoHeight; cx.drawImage(video, 0, 0);
          const im = cx.getImageData(0, 0, cv.width, cv.height), r = jsQR(im.data, im.width, im.height);
          if (r) text = r.data;
        }
        if (text && handleQrText(text)) { close(); return; }
      } catch (e) { /* نكمل */ }
      setTimeout(tick, 150);
    };
    tick();
  }

  /* ---------- المستشعرات ---------- */
  function gotHeading(h) {
    devHeading = h;
    if (pendingH != null) { manualOffset = h - pendingH; pendingH = null; }
  }
  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const m = Math.hypot(a.x, a.y, a.z);
    avg = avg * 0.9 + m * 0.1;
    const d = m - avg, t = performance.now();
    if (d1 > CFG.stepThresh && d1 >= d2 && d1 > d && t - lastStepT > CFG.stepMinMs) { lastStepT = t; onStep(); }
    d2 = d1; d1 = d;
  }
  function onOri(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;
    if (h == null) return;
    gotHeading(devHeading == null ? h : (devHeading + angDiff(h, devHeading) * 0.25 + 360) % 360);
    render();
  }
  async function toggleTracking() {
    if (tracking) {
      removeEventListener('devicemotion', onMotion);
      removeEventListener('deviceorientation', onOri, true);
      removeEventListener('deviceorientationabsolute', onOri, true);
      tracking = false; trackBtn.classList.remove('on'); trackBtn.textContent = '📍 تفعيل التتبع';
      return;
    }
    try {
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        if ((await DeviceMotionEvent.requestPermission()) !== 'granted') { toast('تم رفض إذن المستشعرات'); return; }
        try { if (typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) {}
      }
    } catch (e) { toast('تعذر طلب إذن المستشعرات (يلزم HTTPS)'); return; }
    addEventListener('devicemotion', onMotion);
    addEventListener('deviceorientation', onOri, true);
    addEventListener('deviceorientationabsolute', onOri, true);
    tracking = true; trackBtn.classList.add('on'); trackBtn.textContent = '⏹ إيقاف التتبع';
    toast(pos ? 'ابدأ المشي' : 'امسح QR لتحديد موقعك أولاً');
  }
  function calibrate() {
    if (devHeading == null) { toast('فعّل التتبع أولاً'); return; }
    manualOffset = devHeading;
    toast('تمت المعايرة. القيمة: ' + Math.round(devHeading) + '° (ضعها في buildingNorth لتثبيتها)');
  }

  /* ---------- واجهة ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'pdr-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  function buildUI() {
    const st = document.createElement('style');
    st.textContent =
      '.pdr-bar{position:fixed;left:12px;bottom:20px;z-index:115;display:flex;flex-direction:column;gap:8px;align-items:flex-start}' +
      '.pdr-bar button{background:var(--panel-bg);border:1px solid var(--border-color);color:var(--text-main);padding:9px 12px;border-radius:10px;font-size:12px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}' +
      '.pdr-bar button.on{background:var(--primary-green)}.pdr-bar span{font-size:11px;color:var(--text-sub)}' +
      '.pdr-toast{position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:400;background:var(--panel-bg);border:1px solid var(--primary-green);padding:8px 16px;border-radius:10px;font-size:12px}' +
      '@media(max-width:700px){.pdr-bar{bottom:90px}}';
    document.head.appendChild(st);
    const bar = document.createElement('div');
    bar.className = 'pdr-bar';
    bar.innerHTML = '<button id="pdrTrack">📍 تفعيل التتبع</button><button id="pdrScan">📷 مسح QR</button><button id="pdrCal">🧭 معايرة</button><span id="pdrSteps">الخطوات: 0</span>';
    document.body.appendChild(bar);
    trackBtn = bar.querySelector('#pdrTrack'); stepsEl = bar.querySelector('#pdrSteps');
    trackBtn.onclick = toggleTracking;
    bar.querySelector('#pdrScan').onclick = scanQr;
    bar.querySelector('#pdrCal').onclick = calibrate;

    markerEl = document.createElementNS(NS, 'g');
    markerEl.setAttribute('display', 'none');
    markerEl.innerHTML = '<circle r="22" fill="rgba(37,99,235,.35)" class="ping-ring"/><g id="pdrArrow"><polygon points="0,-22 9,-8 -9,-8" fill="#60a5fa"/></g><circle r="9" fill="#2563eb" stroke="#fff" stroke-width="3"/>';
    document.getElementById('navigationSvg').appendChild(markerEl);
    arrowEl = markerEl.querySelector('#pdrArrow');
  }

  /* ---------- ربط بدون تعديل الكود الأصلي ---------- */
  const _render = window.renderBlueprint;
  window.renderBlueprint = function () { _render.apply(this, arguments); buildGraph(); render(); };

  const _clear = window.clearNavigation;
  window.clearNavigation = function () { dest = null; _clear.apply(this, arguments); };

  const _hr = window.highlightAndRoute;
  window.highlightAndRoute = function () {
    _hr.apply(this, arguments);
    const id = document.getElementById('roomDropdown').value;
    const room = id && campusData[selectedBldg][selectedFloor].rooms.find(r => r.id === id);
    if (room) { const q = lastPoint(room); dest = { x: q[0], y: q[1], label: room.label.replace('\n', ' ') }; updateRoute(); }
    else dest = null;
  };

  buildUI();
  if (nodes.length === 0 && typeof campusData !== 'undefined') buildGraph();

  // محاكاة بالكيبورد للتجربة على الكمبيوتر: ↑ خطوة، ←/→ تدوير 15°
  addEventListener('keydown', e => {
    if (!matchesFloor() || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (devHeading == null) gotHeading(offset());
    if (e.key === 'ArrowUp') { onStep(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      devHeading = (devHeading + (e.key === 'ArrowLeft' ? -15 : 15) + 360) % 360; render(); e.preventDefault();
    }
  });

  addEventListener('load', () => {
    const p = new URLSearchParams(location.search);
    if ([...p.keys()].length) applyParams(p);
  });

  window.PDR = { cfg: CFG, setPos, calibrate, applyParams, graph: () => ({ nodes, edges }) };
})();
