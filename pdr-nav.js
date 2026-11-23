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
    stepThresh: 1.2,      // حساسية كشف الخطوة (م/ث²)
    joinTol: 14,          // مسافة ربط الخطوط ببعض
    arriveR: 18,          // مسافة الوصول (بكسل)
    buildingNorth: { A: 0, B: 0 }, // اتجاه "أعلى الخريطة" بالنسبة للشمال (درجات) لكل مبنى
    // ---- ضبط الدقة والسرعة (جديد) ----
    autoStride: true,     // طول الخطوة يتكيّف مع سرعة المشي (strideM هو الطول عند ~1.8 خطوة/ث)
    lpTau: 0.035,         // ث — تنعيم إشارة التسارع قبل كشف الذروة (يزيل الضجيج بدون تأخير ملحوظ)
    maxRotRate: 400,      // °/ث — تجاهل "خطوات" ناتجة عن تدوير الجوال بقوة باليد
    headWinMs: 300,       // نافذة متوسط الاتجاه عند كل خطوة (تلغي اهتزاز اليد)
    glideFrac: 0.6,       // مدة انزلاق النقطة نحو الخطوة الجديدة كنسبة من زمن الخطوة (أقل = أسرع استجابة، أعلى = أنعم)
    predictFrac: 0.8,     // تنبّؤ: تستمر النقطة بالتحرك بسرعتك المقدّرة بين الخطوات حتى هذه النسبة من زمن الخطوة (0 = بدون تنبّؤ)
    detectLagMs: 50,      // مللي ث — تأخر اكتشاف الخطوة (تنعيم + انتظار الذروة) يُعوَّض في العرض
    catchTauMs: 100,      // مللي ث — سرعة تصحيح النقطة المعروضة عند وصول الخطوة الحقيقية
    arrowSnap: true,      // أثناء المشي في ممر: السهم يميل لاتجاه الممر إذا قرب منه اتجاه الجوال (يلغي اهتزاز اليد)
    arrowTau: 0.05        // ث — تنعيم دوران السهم
  }, window.PDR_CONFIG || {});
  const FLOOR_ALIAS = { Ground: 'الدور الأرضي', First: 'الدور الأول', Second: 'الدور الثاني' };

  let pos = null, posCtx = null, dest = null;
  let tracking = false, devHeading = null, pendingH = null, steps = 0;
  let relHeading = null;   // اتجاه الجايرو (لا يتأثر بالمغناطيس) — مرجعه عشوائي لكنه ثابت أثناء التتبع
  const gyroOff = {};      // بعد المعايرة: فرق الجايرو عن اتجاه الخريطة لكل مبنى (في الذاكرة فقط، لا يُحفظ)
  let lastHint = 0;
  let markerEl, arrowEl, stepsEl, trackBtn;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- كاشف الخطوات (يعتمد على الزمن الفعلي لا على عدد العينات) ---------- */
  const SD = {};
  function resetStepDetector() {
    Object.assign(SD, {
      t: 0, g: null, s: 0, s1: 0, s2: 0, env: CFG.stepThresh, armed: true, vmin: 0,
      lastStepT: 0, avgInt: 520, ampRef: null, kStride: 1
    });
  }
  resetStepDetector();

  /* ---------- العرض اللحظي: الموقع الفعلي pos منفصل عن الموقع المرسوم dpos ---------- */
  let dpos = null, glide = null, dH = null, raf = 0, lastFrame = 0;
  const hBuf = [];                       // آخر قراءات اتجاه الخريطة (لمتوسط الاتجاه عند الخطوة)

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
    ? ((relHeading - gyroOff[b]) % 360 + 360) % 360
    : (((devHeading == null ? offsetFor(b) : devHeading) - offsetFor(b)) + 360) % 360;
  // تثبيت الاتجاه: h = اتجاه المستخدم الحقيقي على الخريطة الآن
  function lockHeading(b, h) {
    if (devHeading != null) setOffset(b, devHeading - h);          // احتياط إذا الجايرو غير متوفر
    if (relHeading != null) gyroOff[b] = (((relHeading - h) % 360) + 360) % 360;
    hBuf.length = 0; dH = null;                                    // الاتجاه تغيّر مرجعه → نبدأ المتوسط من جديد
  }
  function resetGyro() { relHeading = null; for (const k in gyroOff) delete gyroOff[k]; }
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
  let lastEdge = null, lastSg = 0;     // آخر ممر وجهة مشينا عليه (لتثبيت الخط المستقيم)
  function move(stride, g, b, hdg) {
    const th = (hdg == null ? mapHeadingFor(b) : hdg) * Math.PI / 180, h = { x: Math.sin(th), y: -Math.cos(th) };
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
        const score = gain + (e === lastEdge && sg === lastSg ? stride * 0.25 : 0); // استمرار المشي بنفس الممر أرجح
        if (!best || score > best.score) best = { gain, score, pt: c.pt, e, sg };
      }
    }
    if (!best || best.gain < stride * 0.15) return false; // جدار أو نهاية ممر
    pos = best.pt; lastEdge = best.e; lastSg = best.sg;
    return true;
  }

  function hint(msg) {
    const t = Date.now();
    if (t - lastHint > 8000) { lastHint = t; toast(msg); }
  }

  // متوسط اتجاه الخريطة خلال نافذة قصيرة حول الخطوة؛ عند الانعطاف (تشتت كبير) نأخذ الأحدث فوراً
  function stepHeading(b) {
    const now = performance.now(), cur = mapHeadingFor(b);
    const w = hBuf.filter(q => now - q.t <= CFG.headWinMs);
    if (w.length < 3) return cur;
    let sx = 0, sy = 0;
    w.forEach(q => { const r = q.h * Math.PI / 180; sx += Math.sin(r); sy += Math.cos(r); });
    if (Math.hypot(sx, sy) / w.length < 0.9) return cur;
    return (Math.atan2(sx, sy) * 180 / Math.PI + 360) % 360;
  }
  // عرض تنبّؤي: الموقع المعروض = آخر موقع مؤكد + سرعة المشي × الزمن المنقضي منذ الخطوة (بدل الانتظار الثابت ثم القفز)
  // وعند وصول الخطوة التالية يُصحَّح الفرق تدريجياً (catchTauMs) فلا تظهر قفزات.
  function startGlide(prev) {
    if (!pos) return;
    const now = performance.now();
    if (!dpos) dpos = { x: pos.x, y: pos.y };
    const I = SD.avgInt, pf = CFG.predictFrac;
    const vx = prev && pf > 0 ? (pos.x - prev.x) / I : 0, vy = prev && pf > 0 ? (pos.y - prev.y) / I : 0; // بكسل/مللي ث
    const lag = Math.min(CFG.detectLagMs, I * 0.2);
    glide = {
      base: { x: pos.x, y: pos.y }, vx, vy, t0: now - lag, te: now, cap: I * pf,
      ex: dpos.x - (pos.x + vx * lag), ey: dpos.y - (pos.y + vy * lag)       // فرق الاستمرارية عند لحظة التحديث
    };
    kick();
  }

  function onStep(strideM) {
    if (!pos || !posCtx) { hint('امسح QR (📷) لتحديد موقعك أولاً'); return; }
    if (devHeading == null && relHeading == null) { hint('بانتظار قراءة البوصلة… حرّك الجوال حركة رقم 8'); return; }
    steps++;
    // التتبع يستمر على دور/مبنى المستخدم حتى لو كان يتصفح خريطة غيره
    const before = { x: pos.x, y: pos.y };
    const moved = move((strideM || CFG.strideM) * CFG.pxPerM, graphFor(posCtx.b, posCtx.f), posCtx.b, stepHeading(posCtx.b));
    if (moved) startGlide(before);
    else if (dpos && dist(dpos, pos) > 1) startGlide(null);     // جدار/نهاية ممر: أعد النقطة المعروضة للموقع الفعلي بنعومة
    if (matchesFloor()) {
      render();                       // ارسم النقطة أولاً ...
      if (moved) scheduleRoute();     // ... ثم حدّث المسار بعد الرسم حتى لا يؤخر الإطار
    } else {
      hint('موقعك مسجّل في مبنى ' + posCtx.b + ' — ' + posCtx.f + '. إذا انتقلت لدور أو مبنى آخر امسح QR هناك لتحديث موقعك');
    }
    if (stepsEl) stepsEl.textContent = String(steps);
  }

  let routeQueued = false;
  function scheduleRoute() {
    if (routeQueued) return; routeQueued = true;
    requestAnimationFrame(() => setTimeout(() => { routeQueued = false; updateRoute(); }, 0));
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

  function draw() {
    if (!markerEl) return;
    if (!matchesFloor()) { markerEl.setAttribute('display', 'none'); return; }
    const p = dpos || pos;
    markerEl.setAttribute('display', 'block');
    markerEl.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
    arrowEl.setAttribute('transform', 'rotate(' + (dH == null ? mapHeading() : dH) + ')');
  }
  // حلقة رسم واحدة: تنزلق النقطة نحو الموقع الجديد وتدور الإبرة بنعومة، وتتوقف حين لا حاجة لها
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000)); lastFrame = now;
    let busy = false;
    if (glide && dpos) {
      const el = Math.min(now - glide.t0, glide.cap), dec = Math.exp(-(now - glide.te) / CFG.catchTauMs);
      dpos.x = glide.base.x + glide.vx * el + glide.ex * dec;
      dpos.y = glide.base.y + glide.vy * el + glide.ey * dec;
      if (now - glide.t0 >= glide.cap && dec < 0.02) glide = null; else busy = true;
    }
    if (pos && posCtx) {
      let ht = mapHeading();
      // أثناء المشي بخط مستقيم: اتجاه السهم يقترب من اتجاه الممر (لا يغيّر الاتجاه المستخدم في حساب الحركة)
      if (CFG.arrowSnap && lastEdge && performance.now() - SD.lastStepT < 1200) {
        const ea = (Math.atan2(lastSg * (lastEdge.b.x - lastEdge.a.x), -lastSg * (lastEdge.b.y - lastEdge.a.y)) * 180 / Math.PI + 360) % 360;
        const dd = angDiff(ht, ea);
        if (Math.abs(dd) < 30) ht = (ea + dd * 0.35 + 360) % 360;
      }
      if (dH == null) dH = ht;
      else {
        const d = angDiff(ht, dH);
        if (Math.abs(d) > 0.3) { dH = (dH + d * (1 - Math.exp(-dt / CFG.arrowTau)) + 360) % 360; busy = true; } else dH = ht;
      }
    }
    draw();
    if (busy) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); } }
  function render() { draw(); kick(); }

  function setPos(x, y, b, f) {
    const s = snap({ x, y }, graphFor(b, f));
    pos = s ? s.pt : { x, y };
    posCtx = { b, f };
    dpos = { x: pos.x, y: pos.y }; glide = null; lastEdge = null; hBuf.length = 0;
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
    if (pendingH != null) { setOffset(pendingH.b, h - pendingH.h); pendingH = null; hBuf.length = 0; }
  }
  // طول الخطوة: تردد الخطوات (الأساس) + سعة الاهتزاز نسبةً لمعدّل المستخدم نفسه
  function strideFor(amp) {
    if (!CFG.autoStride) return CFG.strideM;
    const f = 1000 / SD.avgInt;                                   // خطوة/ث
    const kf = clamp(1 + 0.5 * (f - 1.8), 0.75, 1.3);             // أسرع = أطول
    SD.ampRef = SD.ampRef == null ? amp : SD.ampRef * 0.9 + amp * 0.1;
    const ka = clamp(Math.pow(amp / Math.max(SD.ampRef, 0.3), 0.25), 0.88, 1.15);
    SD.kStride = SD.kStride * 0.6 + (0.7 * kf + 0.3 * ka * kf) * 0.4;
    return CFG.strideM * clamp(SD.kStride, 0.7, 1.3);
  }
  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    const t = performance.now(), m = Math.hypot(a.x, a.y, a.z);
    const dt = SD.t ? clamp((t - SD.t) / 1000, 0.004, 0.1) : 0.016; SD.t = t;
    if (SD.g == null) SD.g = m;
    SD.g += (m - SD.g) * (dt / (0.7 + dt));                       // الجاذبية/المستوى الثابت (فلتر بطيء)
    SD.s2 = SD.s1; SD.s1 = SD.s;
    SD.s += ((m - SD.g) - SD.s) * (dt / (CFG.lpTau + dt));        // تنعيم الضجيج
    const s = SD.s;
    SD.env = Math.max(Math.abs(s), SD.env * Math.exp(-dt / 2));   // غلاف السعة (يتكيف مع المشي السريع/البطيء)
    const thr = Math.max(CFG.stepThresh * 0.55, SD.env * 0.45);
    if (s < SD.vmin) SD.vmin = s;
    if (!SD.armed && s < thr * 0.2) SD.armed = true;              // لازم ينزل الإشارة قبل ذروة جديدة (يمنع الذروة المزدوجة)
    const iv = t - SD.lastStepT, minInt = clamp(SD.avgInt * 0.6, 230, CFG.stepMinMs);
    if (SD.armed && SD.s1 > thr && SD.s1 >= SD.s2 && SD.s1 > s && iv > minInt) {
      const rr = e.rotationRate, rot = rr ? Math.hypot(rr.alpha || 0, rr.beta || 0, rr.gamma || 0) : 0;
      if (rot > CFG.maxRotRate) return;                           // تدوير الجوال باليد وليس مشياً
      const amp = SD.s1 - SD.vmin;
      if (SD.lastStepT && iv < 2000) SD.avgInt = clamp(SD.avgInt * 0.7 + clamp(iv, SD.avgInt * 0.6, SD.avgInt * 1.6) * 0.3, 250, 1000); // خطوة فائتة أو وقفة لا تشوّه المعدل
      SD.lastStepT = t; SD.armed = false; SD.vmin = s;
      onStep(strideFor(amp));
    }
  }
  function onOri(e) {
    const isAbs = e.type === 'deviceorientationabsolute' || e.absolute === true;
    // (أ) الجايرو: قراءة نسبية غير مغناطيسية → للتثبيت بعد المعايرة
    if (!isAbs && e.alpha != null && e.beta != null && e.gamma != null) {
      const g = gyroHeading(e.alpha, e.beta, e.gamma);
      if (g != null) {
        if (relHeading == null) relHeading = g;
        else { const d = angDiff(g, relHeading); relHeading = (relHeading + d * (Math.abs(d) > 20 ? 0.85 : 0.4) + 360) % 360; } // انعطاف سريع = استجابة فورية
      }
    }
    // (ب) البوصلة: كما كانت (تُستخدم قبل المعايرة أو إذا الجايرو غير متوفر)
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;
    if (h != null) {
      if (devHeading == null) gotHeading(h);
      else { const d = angDiff(h, devHeading); gotHeading((devHeading + d * (Math.abs(d) > 30 ? 0.7 : 0.25) + 360) % 360); }
    }
    if (pos && posCtx) {                                          // سجل اتجاه الخريطة لحساب متوسطه عند كل خطوة
      const now = performance.now();
      hBuf.push({ t: now, h: mapHeadingFor(posCtx.b) });
      while (hBuf.length && now - hBuf[0].t > 1000) hBuf.shift();
    }
    kick(); // الرسم يتم مرة واحدة لكل إطار داخل frame() بدل كتابة DOM عند كل حدث مستشعر (60 مرة/ث × حدثين في أندرويد)
  }
  async function toggleTracking() {
    if (tracking) {
      removeEventListener('devicemotion', onMotion);
      removeEventListener('deviceorientation', onOri, true);
      removeEventListener('deviceorientationabsolute', onOri, true);
      tracking = false; resetGyro(); trackBtn.classList.remove('on'); trackBtn.textContent = '📍'; trackBtn.title = 'تفعيل التتبع';
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
    resetStepDetector(); hBuf.length = 0; dH = null;
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
    state: () => ({ pos, posCtx, dest, devHeading, relHeading, locked: relHeading != null && gyroOff[selectedBldg] != null, steps,
      shown: dpos, strideM: CFG.strideM * SD.kStride, cadence: 1000 / SD.avgInt }),
    // مضافة لوضع التنقل (nav-mode.js)
    heading: mapHeading, matches: matchesFloor, routeDirection,
    isTracking: () => tracking, toggleTracking
  };
})();
