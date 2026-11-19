/* pdr-nav.js — إضافة PDR + QR + تثبيت الموقع على الممرات (Map Matching)
   تُضاف قبل </body> وبعد السكربت الأساسي:  <script src="pdr-nav.js"></script>
   لا تعدّل بيانات الخريطة؛ تغلّف الدوال الحالية فقط. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const CFG = window.PDR_CONFIG = Object.assign({
    pxPerM: 14,           // بكسل لكل متر (تقدير من أبعاد القاعات والممرات — يُضبط بالقياس الفعلي)
    strideM: 0.7,         // طول الخطوة بالمتر
    snapR: 12,            // نصف قطر البحث عن الممر
    minAlign: 0.35,       // أقل توافق بين اتجاه المشي واتجاه الممر
    stepMinMs: 320,       // أقل زمن بين خطوتين
    stepThresh: 0.9,      // حساسية كشف الخطوة (م/ث²) — أقل = يلتقط المشي البطيء أيضاً
    joinTol: 14,          // مسافة ربط الخطوط ببعض
    arriveR: 18,          // مسافة الوصول (بكسل)
    stepWarmup: 2,        // عدد الخطوات المتتالية المنتظمة اللازمة قبل اعتبارها مشياً حقيقياً (يمنع حركة اليد العشوائية)
    stepMaxGapMs: 1500,   // أكبر زمن بين خطوتين قبل اعتبار المشي متوقفاً
    stepMaxAcc: 12,       // أي هزّة أقوى من هذا (م/ث²) تُعتبر رجّة وليست خطوة
    stepMaxThr: 3.5,      // سقف عتبة كشف الخطوة (م/ث²): يمنع رجّة قوية واحدة (مثل الضغط على الشاشة) من رفع العتبة فوق قوة المشي الطبيعي
    stepAmpRatio: 3,      // أقصى نسبة بين قوة قمتين متتاليتين قبل اعتبارها حركة عشوائية أو رجّة
    maxRotRate: 320,      // دوران أسرع من هذا (°/ث) = تدوير الجوال باليد، لا تُحسب خطوات أثناءه
    adaptiveStride: true, // طول الخطوة يتكيف مع سرعة المشي
    refCadence: 1.8,      // الإيقاع المرجعي (خطوة/ث) الذي ينطبق عليه strideM
    cadenceGain: 0.4,     // مقدار تأثير الإيقاع على طول الخطوة
    stepResumeMs: 6000,   // إذا توقفت أقل من هذا الزمن ثم أكملت المشي، يُستأنف التتبع بعد خطوتين فقط (بدل ثلاث)
    glideRatio: 0.8,      // مدة انزلاق المؤشر كنسبة من زمن الخطوة (<1 = يصل قبل الخطوة التالية فلا يتأخر)
    warmRotRate: 150,     // قبل تأكيد المشي: أي دوران أسرع من هذا (°/ث) = حركة يد، لا تُحسب خطوات
    maxLatRatio: 2,       // قبل تأكيد المشي: إذا كانت الحركة الجانبية أكبر بكثير من العمودية فهي تحريك يد لا مشي
    buildingNorth: { A: 0, B: 0 } // اتجاه "أعلى الخريطة" بالنسبة للشمال (درجات) لكل مبنى
  }, window.PDR_CONFIG || {});
  const FLOOR_ALIAS = { Ground: 'الدور الأرضي', First: 'الدور الأول', Second: 'الدور الثاني' };

  let pos = null, posCtx = null, dest = null;
  let tracking = false, devHeading = null, pendingH = null, steps = 0;
  let relHeading = null;   // اتجاه الجايرو (لا يتأثر بالمغناطيس) — مرجعه عشوائي لكنه ثابت أثناء التتبع
  const gyroOff = {};      // بعد المعايرة: فرق الجايرو عن اتجاه الخريطة لكل مبنى (في الذاكرة فقط، لا يُحفظ)
  let lastHint = 0;
  /* حالة كاشف الخطوات */
  let gx = 0, gy = 0, gz = 9.8, gInit = false, lastMotionT = 0;      // تقدير الجاذبية
  let sv = 0, d1 = 0, d2 = 0, t1 = 0, rotBlockUntil = 0;             // إشارة التسارع العمودي
  let lastPeakT = 0, prevInt = 0, avgInt = 0, ampAvg = 0, streak = 0, walking = false;
  let lastWalkT = 0, lastAvgInt = 0, resumeInt = 0, rotSm = 0, latSm = 0;   // استئناف سريع بعد توقف قصير + مؤشرات رفض حركة اليد
  /* اتجاه الخطوة بعد المعايرة: يُلتقط لحظة الخطوة فقط ولا يتبع تدوير الجوال باليد */
  let stepRel = null, hBuf = [];
  /* الحركة السلسة: pos = الموقع المنطقي، dispPos = موضع رسم المؤشر أثناء الانزلاق */
  let dispPos = null, anim = null, rafId = 0;
  let markerEl, arrowEl, stepsEl, trackBtn;

  /* معايرة الاتجاه لكل مبنى (تُحفظ في الجهاز حتى لا تُعاد كل مرة) */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('pdr_offsets') || '{}') || {}; } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem('pdr_offsets', JSON.stringify(o)); } catch (e) { /* سفاري الخاص */ } }
  };
  const offsets = store.get();
  const setOffset = (b, v) => { offsets[b] = ((v % 360) + 360) % 360; store.set(offsets); };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
  const offsetFor = b => offsets[b] != null ? offsets[b] : (CFG.buildingNorth[b] || 0);
  // بعد المعايرة: الاتجاه يعتمد على الجايرو فقط (مثبّت)، وقبلها يعتمد على البوصلة كما كان
  const mapHeadingFor = b => (relHeading != null && gyroOff[b] != null)
    ? (((stepRel != null ? stepRel : relHeading) - gyroOff[b]) % 360 + 360) % 360
    : (((devHeading == null ? offsetFor(b) : devHeading) - offsetFor(b)) + 360) % 360;
  // تثبيت الاتجاه: h = اتجاه المستخدم الحقيقي على الخريطة الآن
  function lockHeading(b, h) {
    if (devHeading != null) setOffset(b, devHeading - h);          // احتياط إذا الجايرو غير متوفر
    if (relHeading != null) { gyroOff[b] = (((relHeading - h) % 360) + 360) % 360; stepRel = relHeading; }
  }
  function resetGyro() { relHeading = null; stepRel = null; hBuf = []; for (const k in gyroOff) delete gyroOff[k]; }
  const isLocked = b => relHeading != null && gyroOff[b] != null;
  // متوسط دائري لقراءات الجايرو في آخر ~400ms (يخفّف اهتزاز اليد لحظة الخطوة)
  function latchHeading() {
    const now = performance.now();
    let sx = 0, sy = 0, n = 0;
    for (const o of hBuf) if (now - o.t <= 400) { sx += Math.sin(o.h * Math.PI / 180); sy += Math.cos(o.h * Math.PI / 180); n++; }
    stepRel = n ? (Math.atan2(sx, sy) * 180 / Math.PI + 360) % 360 : relHeading;
  }
  // اتجاه الجهاز الأمامي من alpha/beta/gamma (يعمل سواء الجوال مسطّح أو شبه عمودي)
  function gyroHeading(alpha, beta, gamma) {
    const r = Math.PI / 180, ca = Math.cos(alpha * r), sa = Math.sin(alpha * r);
    const cb = Math.cos(beta * r), sb = Math.sin(beta * r), cg = Math.cos(gamma * r), sg = Math.sin(gamma * r);
    const fx = (-sa * cb) + (-ca * sg - sa * sb * cg);   // أعلى الجهاز + ظهر الجهاز
    const fy = (ca * cb) + (-sa * sg + ca * sb * cg);
    if (Math.hypot(fx, fy) < 1e-6) return null;
    return (Math.atan2(fx, fy) * 180 / Math.PI + 360) % 360;
  }
  const mapHeading = () => mapHeadingFor(selectedBldg);
  const matchesFloor = () => pos && posCtx && posCtx.b === selectedBldg && posCtx.f === selectedFloor;

  function proj(P, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
    let t = L2 ? ((P.x - a.x) * dx + (P.y - a.y) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const pt = { x: a.x + t * dx, y: a.y + t * dy };
    return { pt, t, d: dist(P, pt) };
  }

  /* ---------- بناء الرسم البياني للممرات (لكل مبنى/دور، ويُحفظ) ---------- */
  function collectSegments(b, f) {
    const fl = campusData[b][f];
    const segs = [];
    const parse = s => s.trim().split(/\s+/).map(p => { const [x, y] = p.split(',').map(Number); return { x, y }; });
    const add = pts => { for (let i = 0; i < pts.length - 1; i++) segs.push({ a: pts[i], b: pts[i + 1] }); };
    const tmp = document.createElement('div');
    tmp.innerHTML = '<svg xmlns="' + NS + '">' + fl.corridorsSvg + '</svg>';
    tmp.querySelectorAll('polyline').forEach(pl => add(parse(pl.getAttribute('points'))));
    fl.rooms.forEach(r => add(parse(r.routePoints)));
    return segs.filter(s => dist(s.a, s.b) > 0.5);
  }

  function computeGraph(b, f) {
    const segs = collectSegments(b, f);
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
    const nodes = [], adj = [], edges = [];
    const nid = p => {
      let k = nodes.findIndex(n => dist(n, p) < 4);
      if (k < 0) { nodes.push({ x: p.x, y: p.y }); adj.push([]); k = nodes.length - 1; }
      return k;
    };
    const seen = new Set();
    all.forEach(e => {
      const u = nid(e.a), v = nid(e.b);
      if (u === v) return;
      const key = u < v ? u + '-' + v : v + '-' + u;
      if (seen.has(key)) return; // نفس الممر مكرر من أكثر من قاعة
      seen.add(key);
      const w = dist(nodes[u], nodes[v]);
      edges.push({ u, v, a: nodes[u], b: nodes[v], w });
      adj[u].push({ to: v, w }); adj[v].push({ to: u, w });
    });
    return { nodes, edges, adj };
  }

  const graphCache = {};
  const graphFor = (b, f) => graphCache[b + '|' + f] || (graphCache[b + '|' + f] = computeGraph(b, f));
  const cur = () => graphFor(selectedBldg, selectedFloor);

  function snap(P, g) {
    let best = null;
    for (const e of g.edges) { const q = proj(P, e.a, e.b); if (!best || q.d < best.d) best = { pt: q.pt, e, d: q.d }; }
    return best;
  }
  const nearestNode = (P, g) => g.nodes.reduce((b, n, i) => (b < 0 || dist(n, P) < dist(g.nodes[b], P)) ? i : b, -1);

  function shortestPath(from, to, g) {
    const nodes = g.nodes, adj = g.adj;
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
  function move(stride, g, b) {
    const th = mapHeadingFor(b) * Math.PI / 180, h = { x: Math.sin(th), y: -Math.cos(th) };
    let best = null;
    for (const e of g.edges) {
      const q = proj(pos, e.a, e.b);
      if (q.d > CFG.snapR) continue;
      const ux = (e.b.x - e.a.x) / e.w, uy = (e.b.y - e.a.y) / e.w;
      for (const sg of [1, -1]) {
        if (sg * (ux * h.x + uy * h.y) < CFG.minAlign) continue;
        const c = proj({ x: q.pt.x + sg * ux * stride, y: q.pt.y + sg * uy * stride }, e.a, e.b);
        if (dist(c.pt, pos) > stride * 1.5) continue; // لا نقفز أكثر من خطوة واحدة
        const gain = (c.pt.x - pos.x) * h.x + (c.pt.y - pos.y) * h.y;
        if (!best || gain > best.gain) best = { gain, pt: c.pt };
      }
    }
    if (!best || best.gain < stride * 0.15) return false; // جدار أو نهاية ممر
    pos = best.pt;
    return true;
  }

  function hint(msg) {
    const t = Date.now();
    if (t - lastHint > 8000) { lastHint = t; toast(msg); }
  }

  /* انزلاق سلس للمؤشر نحو الموقع الجديد: مدة الانزلاق = زمن الخطوة، فيتكيف مع سرعة المشي */
  function glideTo(target, dur) {
    if (!dispPos) { dispPos = { x: target.x, y: target.y }; render(); return; }
    anim = { from: { x: dispPos.x, y: dispPos.y }, to: { x: target.x, y: target.y }, t0: performance.now(), dur: Math.max(150, Math.min(3000, dur)) };
    if (!rafId) rafId = requestAnimationFrame(tickAnim);
  }
  function tickAnim(now) {
    rafId = 0;
    if (!anim) return;
    const k = Math.max(0, Math.min(1, (now - anim.t0) / anim.dur));
    dispPos = { x: anim.from.x + (anim.to.x - anim.from.x) * k, y: anim.from.y + (anim.to.y - anim.from.y) * k };
    render();
    if (k < 1) rafId = requestAnimationFrame(tickAnim); else anim = null;
  }

  // opts.n = عدد الخطوات المؤكدة، opts.interval = متوسط زمن الخطوة (ms) — بدونها (لوحة المفاتيح) خطوة واحدة عادية
  function onStep(opts) {
    opts = opts || {};
    if (!pos || !posCtx) { hint('امسح QR (📷) لتحديد موقعك أولاً'); return; }
    if (devHeading == null && relHeading == null) { hint('بانتظار قراءة البوصلة… حرّك الجوال حركة رقم 8'); return; }
    const n = opts.n || 1, interval = opts.interval || 0;
    // بعد المعايرة: اتجاه الخطوة يُلتقط الآن فقط
    if (isLocked(posCtx.b)) latchHeading();
    // طول الخطوة يتكيف مع الإيقاع: بطيء = خطوة أقصر، سريع = خطوة أطول
    let k = 1;
    if (CFG.adaptiveStride && interval > 0) k = Math.max(0.75, Math.min(1.25, 1 + CFG.cadenceGain * (1000 / interval - CFG.refCadence)));
    const stride = CFG.strideM * CFG.pxPerM * k;
    // التتبع يستمر على دور/مبنى المستخدم حتى لو كان يتصفح خريطة غيره
    const g = graphFor(posCtx.b, posCtx.f);
    let moved = false;
    for (let i = 0; i < n; i++) { steps++; if (move(stride, g, posCtx.b)) moved = true; }
    if (matchesFloor()) {
      if (moved) {
        // انزلاق بمدة أقصر من زمن الخطوة → يصل المؤشر قبل الخطوة التالية ويتوقف فور توقفك
        const dur = interval ? interval * Math.min(n, 2) * CFG.glideRatio : 300;
        glideTo(pos, dur); updateRoute();
      }
      render();
    } else {
      dispPos = { x: pos.x, y: pos.y }; anim = null;
      hint('موقعك مسجّل في مبنى ' + posCtx.b + ' — ' + posCtx.f + '. إذا انتقلت لدور أو مبنى آخر امسح QR هناك لتحديث موقعك');
    }
    if (stepsEl) stepsEl.textContent = String(steps);
  }

  /* ---------- المسار من الموقع الحالي ---------- */
  function updateRoute() {
    if (!matchesFloor() || !dest) return;
    const g = cur(), s = snap(pos, g), t = nearestNode(dest, g);
    if (!s || t < 0) return;
    const path = shortestPath(s, t, g);
    if (!path) return;
    document.getElementById('routePath').setAttribute('d', 'M ' + path.map(p => p.x + ' ' + p.y).join(' L '));
    let len = 0;
    for (let i = 1; i < path.length; i++) len += dist(path[i - 1], path[i]);
    const info = document.getElementById('infoText');
    info.innerText = dist(pos, dest) <= CFG.arriveR
      ? 'وصلت إلى ' + dest.label
      : dest.label + ' — المتبقي تقريباً ' + Math.round(len / CFG.pxPerM) + ' م';
  }

  // اتجاه أول مقطع من المسار الأخضر (بدرجات الخريطة: 0 = أعلى، 90 = يمين)
  function routeDirection() {
    if (!dest || !matchesFloor()) return null;
    const g = cur(), s = snap(pos, g), t = nearestNode(dest, g);
    if (!s || t < 0) return null;
    const path = shortestPath(s, t, g);
    if (!path) return null;
    for (let i = 1; i < path.length; i++) {
      if (dist(path[0], path[i]) > 4) {
        return (Math.atan2(path[i].x - path[0].x, -(path[i].y - path[0].y)) * 180 / Math.PI + 360) % 360;
      }
    }
    return null;
  }

  function render() {
    if (!markerEl) return;
    if (!matchesFloor()) { markerEl.setAttribute('display', 'none'); return; }
    markerEl.setAttribute('display', 'block');
    const dp = dispPos || pos;
    markerEl.setAttribute('transform', 'translate(' + dp.x + ',' + dp.y + ')');
    arrowEl.setAttribute('transform', 'rotate(' + mapHeading() + ')');
  }

  function setPos(x, y, b, f) {
    const s = snap({ x, y }, graphFor(b, f));
    pos = s ? s.pt : { x, y };
    posCtx = { b, f };
    dispPos = { x: pos.x, y: pos.y }; anim = null;
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

  // صيغ الرابط: ?from=A-G-5 (موقعك عند باب القاعة)  أو  ?bldg=A&floor=Ground&x=232&y=495&h=0 (موقعك بإحداثيات)
  // وأي منهما مع  &room=A-G-9  لاختيار الوجهة.  ?bldg=B&floor=Ground&room=B-G-11 وحدها تفتح الوجهة فقط.
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
      if (!isNaN(h)) { lockHeading(b, h); if (devHeading == null) pendingH = { b, h }; }
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
  const JSQR_SRC = [
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'
  ];
  async function ensureJsQR() {
    if (window.jsQR) return true;
    for (const src of JSQR_SRC) { try { await loadScript(src); if (window.jsQR) return true; } catch (e) { /* التالي */ } }
    return false;
  }

  async function scanQr() {
    if (typeof closeQrModal === 'function') closeQrModal();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('المتصفح لا يدعم الكاميرا (يلزم HTTPS)'); return; }
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px';
    ov.innerHTML = '<video playsinline muted autoplay style="max-width:100%;max-height:75%"></video><button class="close-btn">إلغاء</button>';
    document.body.appendChild(ov);
    const video = ov.querySelector('video');
    video.setAttribute('playsinline', ''); video.muted = true;
    let stream, stop = false;
    const close = () => { stop = true; if (stream) stream.getTracks().forEach(t => t.stop()); ov.remove(); };
    ov.querySelector('button').onclick = close;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = stream; await video.play();
    } catch (e) { close(); toast('تعذر فتح الكاميرا (يلزم HTTPS وإذن الكاميرا)'); return; }
    let det = null;
    if ('BarcodeDetector' in window) { try { det = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { det = null; } }
    if (!det && !(await ensureJsQR())) { close(); toast('تعذر تحميل قارئ QR'); return; }
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const tick = async () => {
      if (stop) return;
      try {
        let text = null;
        if (det) { const r = await det.detect(video); if (r[0]) text = r[0].rawValue; }
        if (!text && !det && video.videoWidth) {
          const k = Math.min(1, 640 / video.videoWidth);
          cv.width = Math.round(video.videoWidth * k); cv.height = Math.round(video.videoHeight * k);
          cx.drawImage(video, 0, 0, cv.width, cv.height);
          const im = cx.getImageData(0, 0, cv.width, cv.height), r = window.jsQR(im.data, im.width, im.height, { inversionAttempts: 'dontInvert' });
          if (r) text = r.data;
        }
        if (text) {
          if (handleQrText(text)) { close(); return; }
          hint('هذا الباركود ليس تابعاً لخريطة الكلية');
        }
      } catch (e) { /* نكمل */ }
      setTimeout(tick, 150);
    };
    tick();
  }

  /* ---------- المستشعرات ---------- */
  function gotHeading(h) {
    devHeading = h;
    if (pendingH != null) { setOffset(pendingH.b, h - pendingH.h); pendingH = null; }
  }
  /* كشف الخطوات: التسارع العمودي (بعد طرح الجاذبية) + قمم منتظمة الإيقاع.
     حركة اليد العشوائية أو تدوير الجوال لا تُحسب خطوات: تُرفض القمم أثناء الدوران السريع،
     ولا يُعتمد المشي إلا بعد عدة قمم متتالية بإيقاع متقارب. */
  function resetStepper() {
    gInit = false; lastMotionT = 0; sv = d1 = d2 = t1 = 0; rotBlockUntil = 0;
    lastPeakT = 0; prevInt = 0; avgInt = 0; ampAvg = 0; streak = 0; walking = false;
    lastWalkT = 0; lastAvgInt = 0; resumeInt = 0; rotSm = 0; latSm = 0;
  }
  function onPeak(t, amp) {
    const gap = lastPeakT ? t - lastPeakT : Infinity;
    if (gap > CFG.stepMaxGapMs) {                       // بداية مشي جديد (أو توقف طويل)
      // توقف قصير بعد مشي مؤكد → نتذكر الإيقاع السابق لنستأنف بسرعة
      resumeInt = (lastAvgInt && t - lastWalkT < CFG.stepResumeMs) ? lastAvgInt : 0;
      lastPeakT = t; prevInt = 0; avgInt = 0; ampAvg = amp; streak = 1; walking = false;
      if (CFG.stepWarmup <= 1) { walking = true; lastWalkT = t; onStep({ n: 1, interval: 0 }); }
      return;
    }
    // أقل زمن بين خطوتين يتكيف مع الإيقاع الحالي (يمنع احتساب ارتداد الخطوة كخطوة ثانية)
    // لكن إذا كانت القمة القصيرة قوية (≥75% من قوة المشي الحالية) فهي خطوة حقيقية أسرع (تسريع) لا ارتداد، فتُقبل
    if (gap < CFG.stepMinMs) return;
    if (walking && avgInt && gap < avgInt * 0.6 && !(ampAvg && amp >= ampAvg * 0.75)) return;
    // رجّة مفاجئة أقوى بكثير من قوة المشي الحالية (ضغطة شاشة/ارتطام) → تُتجاهل ولا تُحسب خطوة
    if (walking && ampAvg && amp > ampAvg * CFG.stepAmpRatio) return;
    lastPeakT = t;
    // قبل تأكيد المشي: قوة القمة يجب أن تتناسب مع سابقتها، وإلا نبدأ العدّ من جديد (حركة عشوائية)
    if (!walking && ampAvg && (amp > ampAvg * CFG.stepAmpRatio || amp * CFG.stepAmpRatio < ampAvg)) {
      ampAvg = amp; streak = 1; prevInt = 0; resumeInt = 0; return;
    }
    ampAvg = ampAvg ? ampAvg * 0.7 + amp * 0.3 : amp;    // يتكيف أسرع مع تغيّر قوة المشي (تسريع/تبطيء)
    if (walking) {
      // الإيقاع يتبع آخر خطوة بسرعة: إذا أسرعت تقصر المدة فوراً، وإذا أبطأت تطول
      const gc = Math.max(avgInt * 0.5, Math.min(avgInt * 2, gap));
      avgInt = avgInt * 0.4 + gc * 0.6;
      lastWalkT = t; lastAvgInt = avgInt;
      onStep({ n: 1, interval: avgInt });
      return;
    }
    // استئناف سريع: مشيت قبل لحظات وتوقفت قليلاً، والفاصل الآن قريب من إيقاعك السابق → خطوتان تكفيان
    if (resumeInt && streak === 1 && gap >= resumeInt * 0.55 && gap <= resumeInt * 1.8) {
      walking = true; streak = 2; avgInt = (gap + resumeInt) / 2;
      lastWalkT = t; lastAvgInt = avgInt;
      onStep({ n: 2, interval: avgInt });
      return;
    }
    if (prevInt && Math.abs(gap - prevInt) > 0.45 * prevInt) {   // إيقاع غير منتظم → نبدأ العدّ من جديد
      streak = 1; prevInt = 0; resumeInt = 0; return;
    }
    streak++;
    if (streak >= CFG.stepWarmup) {                      // مشي مؤكد: نحتسب الخطوات المؤجلة دفعة واحدة
      walking = true;
      avgInt = prevInt ? (prevInt + gap) / 2 : gap;
      lastWalkT = t; lastAvgInt = avgInt;
      onStep({ n: streak, interval: avgInt });
    } else prevInt = gap;
  }
  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const t = performance.now();
    const rr = e.rotationRate;
    if (rr && rr.alpha != null) {
      const rot = Math.hypot(rr.alpha || 0, rr.beta || 0, rr.gamma || 0);
      if (rot > CFG.maxRotRate) rotBlockUntil = t + 350;
      rotSm = rotSm * 0.7 + rot * 0.3;
    }
    // تقدير الجاذبية بمرشّح بطيء، ثم نأخذ مركّبة التسارع على اتجاه الجاذبية (يعمل بأي وضعية للجوال)
    const dt = lastMotionT ? Math.min(0.2, (t - lastMotionT) / 1000) : 0.016;
    lastMotionT = t;
    if (!gInit) { gx = a.x; gy = a.y; gz = a.z; gInit = true; }
    const kg = Math.exp(-dt / 0.8);
    gx = gx * kg + a.x * (1 - kg); gy = gy * kg + a.y * (1 - kg); gz = gz * kg + a.z * (1 - kg);
    const gm = Math.hypot(gx, gy, gz) || 1;
    const v = ((a.x - gx) * gx + (a.y - gy) * gy + (a.z - gz) * gz) / gm;
    sv = sv * 0.5 + v * 0.5;
    // الحركة الجانبية (غير العمودية): تحريك الجوال باليد غالباً جانبي، أما المشي فعمودي الغالب
    const dx = a.x - gx, dy = a.y - gy, dz = a.z - gz;
    latSm = latSm * 0.8 + Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - v * v)) * 0.2;
    const d = sv;
    // d1 = القيمة السابقة: قمة محلية فوق العتبة (تتكيف مع قوة المشي)
    // العتبة تعود للحد الأدنى بعد أي توقف (لا تبقى عالية بسبب رجّة قديمة)، ولها سقف
    const fresh = !lastPeakT || t - lastPeakT > CFG.stepMaxGapMs;
    const thr = fresh ? CFG.stepThresh : Math.min(CFG.stepMaxThr, Math.max(CFG.stepThresh, ampAvg * 0.5));
    if (d1 > thr && d1 >= d2 && d1 > d) {
      // قبل تأكيد المشي نكون أشد صرامة مع حركة اليد (دوران متوسط أو حركة جانبية طاغية)
      const handMove = !walking && (rotSm > CFG.warmRotRate || latSm > CFG.maxLatRatio * d1);
      if (d1 <= CFG.stepMaxAcc && t1 >= rotBlockUntil && !handMove) onPeak(t1, d1);
    }
    d2 = d1; d1 = d; t1 = t;
  }
  function onOri(e) {
    const isAbs = e.type === 'deviceorientationabsolute' || e.absolute === true;
    // (أ) الجايرو: قراءة نسبية غير مغناطيسية → للتثبيت بعد المعايرة
    if (!isAbs && e.alpha != null && e.beta != null && e.gamma != null) {
      const g = gyroHeading(e.alpha, e.beta, e.gamma);
      if (g != null) {
        relHeading = relHeading == null ? g : (relHeading + angDiff(g, relHeading) * 0.35 + 360) % 360;
        const now = performance.now();
        hBuf.push({ t: now, h: relHeading });
        while (hBuf.length && now - hBuf[0].t > 1000) hBuf.shift();
      }
    }
    // (ب) البوصلة: كما كانت (تُستخدم قبل المعايرة أو إذا الجايرو غير متوفر)
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;
    if (h != null) gotHeading(devHeading == null ? h : (devHeading + angDiff(h, devHeading) * 0.25 + 360) % 360);
    render();
  }
  async function toggleTracking() {
    if (tracking) {
      removeEventListener('devicemotion', onMotion);
      removeEventListener('deviceorientation', onOri, true);
      removeEventListener('deviceorientationabsolute', onOri, true);
      tracking = false; resetGyro(); resetStepper(); trackBtn.classList.remove('on'); trackBtn.textContent = '📍'; trackBtn.title = 'تفعيل التتبع';
      return;
    }
    try {
      // آيفون/سفاري: نطلب الإذنين معاً وبشكل مباشر من ضغطة الزر (قبل أي await) وإلا يُرفض الطلب
      const reqs = [];
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') reqs.push(DeviceMotionEvent.requestPermission());
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') reqs.push(DeviceOrientationEvent.requestPermission());
      if (reqs.length) {
        const res = await Promise.all(reqs.map(r => Promise.resolve(r).catch(() => 'denied')));
        if (res.some(r => r !== 'granted')) { toast('تم رفض إذن الحركة والاتجاه — فعّله من إعدادات سفاري للموقع ثم أعد المحاولة'); return; }
      }
    } catch (e) { toast('تعذر طلب إذن المستشعرات (يلزم HTTPS)'); return; }
    resetGyro(); // مرجع الجايرو يبدأ من جديد مع كل تشغيل للتتبع → لازم معايرة جديدة
    resetStepper();
    addEventListener('devicemotion', onMotion);
    addEventListener('deviceorientation', onOri, true);
    addEventListener('deviceorientationabsolute', onOri, true);
    tracking = true; trackBtn.classList.add('on'); trackBtn.textContent = '⏹'; trackBtn.title = 'إيقاف التتبع';
    toast(pos ? 'ابدأ المشي' : 'امسح QR (📷) لتحديد موقعك أولاً');
    setTimeout(() => { if (tracking && devHeading == null) toast('لا تصل قراءة البوصلة — تأكد من السماح بالحركة والاتجاه للمتصفح'); }, 3000);
  }
  // المعايرة: قف وواجه اتجاه المسار الأخضر (أو أعلى الخريطة إن لم يكن هناك مسار) ثم اضغط
  // بعدها يتثبّت الاتجاه على الجايرو ولا تؤثر عليه البوصلة المغناطيسية حتى تعاير من جديد
  function calibrate() {
    if (devHeading == null && relHeading == null) { toast('فعّل التتبع أولاً'); return; }
    const dir = routeDirection();
    lockHeading(selectedBldg, dir == null ? 0 : dir);
    render(); updateRoute();
    const locked = relHeading != null;
    toast(dir == null
      ? 'تمت المعايرة على أن وجهك نحو أعلى الخريطة. للأفضل: حدّد قاعة وواجه اتجاه الخط الأخضر ثم أعد المعايرة'
      : (locked ? 'تمت المعايرة وتثبيت الاتجاه ✓' : 'تمت معايرة مبنى ' + selectedBldg + ' (جهازك لا يدعم التثبيت بالجايرو، تعمل بالبوصلة)'));
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
      '.pdr-bar{position:fixed;left:calc(6px + env(safe-area-inset-left,0px));top:50%;transform:translateY(-50%);z-index:115;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}' +
      '.pdr-bar>*{pointer-events:auto}' +
      '.pdr-bar button{width:42px;height:42px;padding:0;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;background:var(--panel-bg,#1e293b);border:1px solid var(--border-color,#334155);color:var(--text-main,#f1f5f9);border-radius:50%;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);opacity:.92;-webkit-tap-highlight-color:transparent}' +
      '.pdr-bar button.on{background:var(--primary-green,#10b981);opacity:1}' +
      '.pdr-bar span{font-size:10px;color:var(--text-sub,#94a3b8);background:var(--panel-bg,#1e293b);border-radius:8px;padding:2px 6px;opacity:.92}' +
      '.pdr-toast{position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:400;background:var(--panel-bg,#1e293b);color:var(--text-main,#f1f5f9);border:1px solid var(--primary-green,#10b981);padding:8px 16px;border-radius:10px;font-size:12px;max-width:90vw;text-align:center}';
    document.head.appendChild(st);
    const bar = document.createElement('div');
    bar.className = 'pdr-bar';
    bar.innerHTML = '<button id="pdrTrack" title="تفعيل التتبع" aria-label="تفعيل التتبع">📍</button><button id="pdrScan" title="مسح QR" aria-label="مسح QR">📷</button><button id="pdrCal" title="معايرة الاتجاه" aria-label="معايرة الاتجاه">🧭</button>';
    document.body.appendChild(bar);
    trackBtn = bar.querySelector('#pdrTrack'); stepsEl = bar.querySelector('#pdrSteps');
    trackBtn.onclick = toggleTracking;
    bar.querySelector('#pdrScan').onclick = scanQr;
    bar.querySelector('#pdrCal').onclick = calibrate;

    markerEl = document.createElementNS(NS, 'g');
    markerEl.setAttribute('display', 'none');
    markerEl.id = 'pdrMarker'; // يستخدمه nav-mode.js لإخفاء المؤشر القديم أثناء التنقل
    markerEl.innerHTML = '<circle r="22" fill="rgba(37,99,235,.35)" class="ping-ring"/><g id="pdrArrow"><polygon points="0,-22 9,-8 -9,-8" fill="#60a5fa"/></g><circle r="9" fill="#2563eb" stroke="#fff" stroke-width="3"/>';
    document.getElementById('navigationSvg').appendChild(markerEl);
    arrowEl = markerEl.querySelector('#pdrArrow');
  }

  /* ---------- ربط بدون تعديل الكود الأصلي ---------- */
  const _render = window.renderBlueprint;
  window.renderBlueprint = function () { _render.apply(this, arguments); render(); };

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

  // محاكاة بالكيبورد للتجربة على الكمبيوتر: ↑ خطوة، ←/→ تدوير 15°
  addEventListener('keydown', e => {
    if (!pos || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (devHeading == null) gotHeading(offsetFor(posCtx.b));
    if (e.key === 'ArrowUp') { onStep(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      devHeading = (devHeading + (e.key === 'ArrowLeft' ? -15 : 15) + 360) % 360; render(); e.preventDefault();
    }
  });

  addEventListener('load', () => {
    const p = new URLSearchParams(location.search);
    if ([...p.keys()].length) applyParams(p);
  });

  window.PDR = {
    cfg: CFG, setPos, calibrate, applyParams, scan: scanQr, graph: () => cur(),
    state: () => ({ pos, posCtx, dest, devHeading, relHeading, locked: relHeading != null && gyroOff[selectedBldg] != null, steps }),
    // مضافة لوضع التنقل (nav-mode.js)
    heading: mapHeading, matches: matchesFloor, routeDirection,
    isTracking: () => tracking, toggleTracking
  };
})();
