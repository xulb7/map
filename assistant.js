/*!
 * assistant.js — مساعد مسار الذكي (Masar Smart Assistant)
 * ---------------------------------------------------------------
 * - ملف مستقل بالكامل: بدون API، بدون مفاتيح، بدون اشتراكات، بدون خوادم.
 * - يقرأ بيانات الكلية من المتغير campusData الموجود في المشروع (قراءة فقط).
 * - الربط: أضيفي السطر التالي قبل </body> في index.html (بعد script.js):
 *       <script src="assistant.js" defer></script>
 * - لا يعدّل أي ملف أو عنصر في الصفحة؛ يضيف فقط زر محادثة عائم.
 *
 * خيارات اختيارية (ضعيها قبل تحميل الملف إن احتجتِ):
 *   window.MASAR_ASSISTANT_CONFIG = { brandColor: '#0f766e', position: 'left' };
 */
(function () {
  'use strict';

  if (window.__masarAssistantLoaded) return;
  window.__masarAssistantLoaded = true;

  /* ============================== الإعدادات ============================== */
  var CONFIG = {
    brandColor: null,        // لون الهوية؛ إذا تُرك فارغاً يلتقط اللون من متغيرات CSS في الصفحة
    position: 'left',        // 'left' أو 'right' — موضع الزر العائم
    lang: 'ar-SA',           // لغة التعرف على الصوت
    maxList: 25,             // أقصى عدد عناصر في القوائم
    acceptScore: 0.78,       // حد قبول المطابقة
    suggestScore: 0.62       // حد اقتراح "تقصدين ...؟"
  };
  if (window.MASAR_ASSISTANT_CONFIG && typeof window.MASAR_ASSISTANT_CONFIG === 'object') {
    for (var ck in window.MASAR_ASSISTANT_CONFIG) CONFIG[ck] = window.MASAR_ASSISTANT_CONFIG[ck];
  }

  /* ============================ أدوات النصوص ============================ */
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, '');                       // التشكيل والتطويل
    s = s.replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
    s = s.replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); });
    s = s.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
         .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/گ/g, 'ك').replace(/پ/g, 'ب');
    s = s.replace(/[^\u0600-\u06FFa-z0-9\s\-]/g, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  function collapse(s) { return String(s).replace(/[^a-z0-9]/g, ''); }

  function stem(t) {
    var r = t.replace(/^(وال|بال|كال|فال|ال)/, '');
    return r.length >= 2 ? r : t;
  }

  function tokens(s) {
    return s.split(/[\s\-]+/).filter(Boolean);
  }

  function lev(a, b) {
    if (a === b) return 0;
    var al = a.length, bl = b.length, i, j;
    if (!al) return bl;
    if (!bl) return al;
    var prev = [], cur = [];
    for (j = 0; j <= bl; j++) prev[j] = j;
    for (i = 1; i <= al; i++) {
      cur[0] = i;
      for (j = 1; j <= bl; j++) {
        var c = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
      }
      var t = prev; prev = cur; cur = t;
    }
    return prev[bl];
  }

  // تشابه كلمتين (يتسامح مع أخطاء إملائية بسيطة)
  function tokSim(a, b, loose) {
    if (a === b) return 1;
    if (/^\d+$/.test(a) || /^\d+$/.test(b)) return 0;
    var m = Math.max(a.length, b.length);
    if (Math.min(a.length, b.length) < 3) return 0;
    var d = lev(a, b);
    var allowed = loose ? (m >= 5 ? 2 : 1) : (m >= 8 ? 2 : (m >= 4 ? 1 : 0));
    return d <= allowed ? 1 - d / m : 0;
  }

  var GENERIC = {};
  ['مبني', 'مبان', 'مباني', 'قاعه', 'قاعات', 'غرفه', 'معمل', 'مختبر', 'مكتب', 'كليه',
   'دور', 'طابق', 'مرافق', 'مرفق', 'قسم', 'building', 'room', 'hall', 'lab', 'floor']
    .forEach(function (w) { GENERIC[stem(w)] = true; GENERIC[w] = true; });

  // تحويل الحروف المنطوقة (ايه/بي/جي/اف/اس) إلى رموز قاعات: "ايه اف 11" → "a-f-11"
  function expandCodes(q) {
    var L = { 'ايه': 'a', 'بي': 'b', 'سي': 'c', 'دي': 'd', 'جي': 'g', 'اف': 'f', 'اس': 's' };
    var re = /(^|\s)(ايه|بي|سي|دي|a|b|c|d)\s*-?\s*(جي|اف|اس|g|f|s)\s*-?\s*(\d{1,3})(?=\s|$)/g;
    q = q.replace(re, function (m, pre, x, y, n) {
      return pre + (L[x] || x) + '-' + (L[y] || y) + '-' + n;
    });
    q = q.replace(/(مبني|مبنا)\s+(ايه|بي|سي|دي)(?=\s|$)/g, function (m, w, x) {
      return 'مبني ' + L[x];
    });
    return q;
  }

  /* ============================ قراءة campusData ============================ */
  function getData() {
    var d = null;
    try { if (typeof campusData !== 'undefined') d = campusData; } catch (e) {}
    if (!d && window.campusData) d = window.campusData;
    return d;
  }

  var NAME_KEYS = ['name', 'nameAr', 'name_ar', 'arabicName', 'title', 'titleAr', 'label', 'labelAr',
                   'ar', 'nameEn', 'name_en', 'en', 'title_en'];
  var DISPLAY_PREF = ['nameAr', 'name_ar', 'name', 'arabicName', 'title', 'titleAr', 'label', 'labelAr', 'ar'];
  var CODE_KEYS = ['id', 'code', 'number', 'roomNumber', 'room', 'roomId', 'room_id'];
  var HINT_KEYS = ['floor', 'level', 'building', 'type', 'category', 'description', 'desc', 'department'];
  var SKIP_KEYS = /^(nodes?|edges?|graph|paths?|routes?|walkways?|coordinates?|coords?|polyline|polygon|geometry|bounds|latlng|center|position|style)$/i;

  var FIELD_LABELS = [
    ['type', 'النوع'], ['category', 'التصنيف'], ['department', 'القسم'], ['dept', 'القسم'],
    ['description', 'وصف'], ['descriptionAr', 'وصف'], ['desc', 'وصف'], ['details', 'تفاصيل'],
    ['note', 'ملاحظة'], ['notes', 'ملاحظة'],
    ['hours', 'الدوام'], ['workingHours', 'الدوام'], ['openHours', 'الدوام'],
    ['capacity', 'السعة'], ['phone', 'الهاتف'], ['email', 'الإيميل'],
    ['location', 'الموقع'], ['directions', 'طريق الوصول'], ['landmark', 'أقرب معلم']
  ];

  function hasKey(o, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (typeof v === 'string' ? v.trim() : (typeof v === 'number')) return true;
    }
    return false;
  }

  function isEntity(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
    if (hasKey(o, NAME_KEYS)) return true;
    return hasKey(o, CODE_KEYS) && hasKey(o, HINT_KEYS);
  }

  function pushName(list, v) {
    if (v == null || typeof v === 'object') return;
    var n = norm(v);
    if (n && list.indexOf(n) < 0) list.push(n);
  }

  function makeEntity(node, kindKey, idKey, parent) {
    var e = { raw: node, kindKey: kindKey || '', idKey: idKey || '', parent: parent || null,
              children: [], names: [], display: '', kindText: '' };
    var i, v;
    for (i = 0; i < NAME_KEYS.length; i++) pushName(e.names, node[NAME_KEYS[i]]);
    for (i = 0; i < CODE_KEYS.length; i++) pushName(e.names, node[CODE_KEYS[i]]);
    ['aliases', 'alias', 'keywords', 'tags', 'synonyms'].forEach(function (k) {
      if (Array.isArray(node[k])) node[k].forEach(function (x) { pushName(e.names, x); });
    });
    if (idKey && /\d/.test(idKey)) pushName(e.names, idKey);
    for (i = 0; i < DISPLAY_PREF.length; i++) {
      v = node[DISPLAY_PREF[i]];
      if (typeof v === 'string' && v.trim()) { e.display = v.trim(); break; }
    }
    if (!e.display) {
      for (i = 0; i < NAME_KEYS.length && !e.display; i++) {
        v = node[NAME_KEYS[i]];
        if (typeof v === 'string' && v.trim()) e.display = v.trim();
      }
    }
    if (!e.display) {
      for (i = 0; i < CODE_KEYS.length && !e.display; i++) {
        v = node[CODE_KEYS[i]];
        if (v != null && typeof v !== 'object') e.display = String(v);
      }
    }
    if (!e.display) e.display = idKey || '';
    e.kindText = norm([node.type, node.kind, node.category, kindKey].join(' '));
    if (parent) parent.children.push(e);
    return e;
  }

  var indexCache = { ref: null, list: [] };

  function getIndex() {
    var data = getData();
    if (!data || typeof data !== 'object') return null;
    if (indexCache.ref === data) return indexCache.list;
    var list = [];

    function walk(node, kindKey, parent, idKey, depth) {
      if (depth > 12 || node == null) return;
      if (Array.isArray(node)) {
        node.forEach(function (it) {
          if (typeof it === 'string') {
            if (parent && /room|hall|lab|class|facilit|place|office|قاع|غرف|مراف|معمل|مكتب/i.test(kindKey || '')) {
              list.push(makeEntity({ name: it }, kindKey, '', parent));
            }
          } else {
            walk(it, kindKey, parent, '', depth + 1);
          }
        });
        return;
      }
      if (typeof node !== 'object') return;
      var ent = null;
      if (isEntity(node)) {
        ent = makeEntity(node, kindKey, idKey, parent);
        list.push(ent);
        Object.keys(node).forEach(function (k) {
          var v = node[k];
          if (v && typeof v === 'object' && !SKIP_KEYS.test(k)) walk(v, k, ent, k, depth + 1);
        });
      } else {
        Object.keys(node).forEach(function (k) {
          var v = node[k];
          if (!v || typeof v !== 'object' || SKIP_KEYS.test(k)) return;
          if (Array.isArray(v)) walk(v, k, parent, k, depth + 1);
          else walk(v, isEntity(v) ? kindKey : k, parent, k, depth + 1);
        });
      }
    }

    try { walk(data, '', null, '', 0); } catch (e) { list = []; }
    list = list.filter(function (e) { return e.display; });
    indexCache = { ref: data, list: list };
    return list;
  }

  function ancestors(e) {
    var out = [], p = e.parent, guard = 0;
    while (p && guard++ < 20) { out.push(p); p = p.parent; }
    return out;
  }

  function descendants(e, out) {
    out = out || [];
    e.children.forEach(function (c) { out.push(c); descendants(c, out); });
    return out;
  }

  function isKind(e, re) { return re.test(e.kindText); }
  var RE_BUILDING = /build|مبني|مبان/;
  var RE_FLOOR = /floor|level|دور|طابق/;

  /* ============================== الأدوار ============================== */
  var FLOOR_NAMES = { g: 'الأرضي', f: 'الأول', s: 'الثاني', t: 'الثالث' };

  function floorCode(v) {
    if (v == null || typeof v === 'object') return null;
    var s = norm(String(v)).replace(/\s+/g, '').replace(/^ال/, '');
    if (/^(g|gf|ground|0|ارضي|ارضيه)$/.test(s)) return 'g';
    if (/^(f|ff|1|1st|first|اول|اولي)$/.test(s)) return 'f';
    if (/^(s|2|2nd|second|ثاني|ثانيه)$/.test(s)) return 's';
    if (/^(t|3|3rd|third|ثالث|ثالثه)$/.test(s)) return 't';
    return s || null;
  }

  function floorLabel(code) {
    return FLOOR_NAMES[code] ? 'الدور ' + FLOOR_NAMES[code] : 'الدور ' + code;
  }

  function floorOf(e) {
    var keys = ['floor', 'level', 'floorName', 'floorNumber'], i, c;
    for (i = 0; i < keys.length; i++) {
      c = floorCode(e.raw[keys[i]]);
      if (c) return c;
    }
    var anc = ancestors(e);
    for (i = 0; i < anc.length; i++) {
      if (isKind(anc[i], RE_FLOOR)) {
        var r = anc[i].raw;
        c = floorCode(r.floor) || floorCode(r.level) || floorCode(r.number) || floorCode(r.name) || floorCode(r.id) || floorCode(anc[i].idKey);
        if (c) return c;
      }
    }
    for (i = 0; i < e.names.length; i++) {
      var m = e.names[i].match(/^[a-z]{1,2}[-\s]?([gfs])[-\s]?\d+$/);
      if (m) return m[1];
    }
    return null;
  }

  /* ============================== المطابقة ============================== */
  function isCodeLike(n) {
    if (/^\d+$/.test(n)) return true;
    return /\d/.test(n) && /[a-z]/.test(n) && !/[\u0600-\u06FF]/.test(n) && collapse(n).length <= 10;
  }

  function codeFound(cq, cn) {
    if (cn.length < 3) return false;
    var from = 0, idx;
    while ((idx = cq.indexOf(cn, from)) >= 0) {
      var after = cq.charAt(idx + cn.length);
      var before = idx > 0 ? cq.charAt(idx - 1) : '';
      var okAfter = !(/\d/.test(cn.charAt(cn.length - 1)) && /\d/.test(after));
      var okBefore = !(/\d/.test(cn.charAt(0)) && /\d/.test(before));
      if (okAfter && okBefore) return true;
      from = idx + 1;
    }
    return false;
  }

  function scoreEntity(e, ctx) {
    var best = 0, loose = 0, i;
    for (i = 0; i < e.names.length; i++) {
      var n = e.names[i];
      if (!n) continue;

      // 1) رموز القاعات (A-G-1) والأرقام
      if (isCodeLike(n)) {
        if (codeFound(ctx.collapsed, collapse(n))) best = Math.max(best, 0.97 + Math.min(collapse(n).length, 10) / 1000);
        continue;
      }

      var nt = tokens(n).map(stem);
      var sn = nt.join(' ');
      if (!sn) continue;
      var nonGeneric = nt.filter(function (t) { return !GENERIC[t]; });
      if (!nonGeneric.length) continue;

      // 2) احتواء العبارة كاملة
      if ((' ' + ctx.stemmed + ' ').indexOf(' ' + sn + ' ') >= 0) {
        best = Math.max(best, 0.9 + Math.min(sn.length, 40) / 400);
        continue;
      }

      // 3) مطابقة كلمة بكلمة مع تسامح إملائي
      var sum = 0, lsum = 0, minBest = 1, anyHit = false;
      nonGeneric.forEach(function (t) {
        var b = 0, lb = 0;
        ctx.qtokens.forEach(function (q) {
          var s1 = tokSim(t, q, false), s2 = tokSim(t, q, true);
          if (s1 > b) b = s1;
          if (s2 > lb) lb = s2;
        });
        sum += b; lsum += lb;
        if (b < minBest) minBest = b;
        if (b > 0) anyHit = true;
      });
      var avg = sum / nonGeneric.length, lavg = lsum / nonGeneric.length;
      if (avg >= 0.74 && minBest >= 0.66) best = Math.max(best, 0.5 + 0.38 * avg);
      else if (anyHit || lavg > 0) loose = Math.max(loose, 0.5 + 0.38 * lavg);
    }
    return { score: best, loose: loose };
  }

  function matchEntities(rawQuery) {
    var list = getIndex();
    if (!list || !list.length) return { accepted: [], suggestion: null };
    var qn = expandCodes(norm(rawQuery));
    var qt = tokens(qn).map(stem);
    var ctx = { collapsed: collapse(qn), stemmed: qt.join(' '), qtokens: qt.filter(function (t) { return t.length > 0; }) };

    var scored = [];
    list.forEach(function (e) {
      var r = scoreEntity(e, ctx);
      if (r.score > 0 || r.loose > 0) scored.push({ e: e, score: r.score, loose: r.loose });
    });

    var accepted = scored.filter(function (x) { return x.score >= CONFIG.acceptScore; });

    // أفضلية الأماكن داخل المبنى/الدور المذكور في السؤال
    var accSet = accepted.map(function (x) { return x.e; });
    accepted.forEach(function (x) {
      if (!x.e.children.length && ancestors(x.e).some(function (a) { return accSet.indexOf(a) >= 0; })) x.score += 0.06;
    });
    // إذا ذُكر مكان وداخله مكان آخر (مبنى + دور/قاعة) نأخذ الأعمق ونعتبر الأب سياقاً
    var dropSet = [];
    accepted.forEach(function (x) { ancestors(x.e).forEach(function (a) { dropSet.push(a); }); });
    accepted = accepted.filter(function (x) { return dropSet.indexOf(x.e) < 0; });

    accepted.sort(function (a, b) {
      return (b.score - a.score) || (b.e.display.length - a.e.display.length);
    });
    var top = accepted.length ? accepted[0].score : 0;
    accepted = accepted.filter(function (x) { return x.score >= top - 0.03; }).slice(0, 4);

    var suggestion = null;
    if (!accepted.length) {
      var cand = scored.filter(function (x) { return x.loose >= CONFIG.suggestScore; })
                       .sort(function (a, b) { return b.loose - a.loose; });
      if (cand.length) suggestion = cand[0].e;
    }
    return { accepted: accepted.map(function (x) { return x.e; }), suggestion: suggestion };
  }

  /* ============================== بناء الردود ============================== */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function firstField(raw, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = raw[keys[i]];
      if (v != null && v !== '' && typeof v !== 'object') return String(v);
    }
    return null;
  }

  function detailLines(e) {
    var lines = ['📍 ' + e.display];
    var anc = ancestors(e), i, bld = null, other = [];

    for (i = 0; i < anc.length; i++) {
      if (!bld && isKind(anc[i], RE_BUILDING)) bld = anc[i].display;
      else if (!isKind(anc[i], RE_FLOOR)) other.push(anc[i].display);
    }
    var rb = firstField(e.raw, ['building', 'buildingName', 'buildingAr']);
    if (rb) bld = rb;
    if (bld && bld !== e.display) lines.push('🏢 المبنى: ' + bld);
    else if (other.length) lines.push('🏢 ضمن: ' + other[0]);

    var fc = floorOf(e);
    if (fc) lines.push('🧭 ' + floorLabel(fc));

    var used = {};
    FIELD_LABELS.forEach(function (p) {
      var v = e.raw[p[0]], txt = null;
      if (v == null || used[p[1]]) return;
      if (Array.isArray(v)) {
        var arr = v.filter(function (x) { return typeof x === 'string' || typeof x === 'number'; });
        if (arr.length) txt = arr.join('، ');
      } else if (typeof v === 'string' || typeof v === 'number') {
        txt = String(v).trim();
      }
      if (txt && txt !== e.display) { used[p[1]] = true; lines.push('• ' + p[1] + ': ' + txt); }
    });

    if (e.children.length) {
      var leaves = descendants(e).filter(function (c) { return !c.children.length; });
      if (leaves.length) lines.push('• يحتوي على ' + leaves.length + ' موقع (اسأليني: وش في ' + e.display + '؟)');
    }
    return lines;
  }

  function parseFloorFilter(qn) {
    var t = tokens(qn).map(stem);
    if (t.indexOf('ارضي') >= 0 || t.indexOf('ارضيه') >= 0 || t.indexOf('ground') >= 0) return 'g';
    if (t.indexOf('اول') >= 0 || t.indexOf('اولي') >= 0 || t.indexOf('first') >= 0) return 'f';
    if (t.indexOf('ثاني') >= 0 || t.indexOf('ثانيه') >= 0 || t.indexOf('second') >= 0) return 's';
    if (t.indexOf('ثالث') >= 0 || t.indexOf('ثالثه') >= 0) return 't';
    return null;
  }

  function listContents(e, floor) {
    var leaves = descendants(e).filter(function (c) { return !c.children.length; });
    if (floor) leaves = leaves.filter(function (c) { return floorOf(c) === floor; });
    if (!leaves.length) {
      return ['ما عندي في بيانات الكلية تفاصيل عن محتويات ' + e.display + (floor ? ' في ' + floorLabel(floor) : '') + ' 🤷‍♀️'];
    }
    var groups = {}, order = [];
    leaves.forEach(function (c) {
      var f = floorOf(c) || '_';
      if (!groups[f]) { groups[f] = []; order.push(f); }
      groups[f].push(c.display);
    });
    var rank = { g: 0, f: 1, s: 2, t: 3, _: 99 };
    order.sort(function (a, b) {
      var ra = rank[a] != null ? rank[a] : 50, rb = rank[b] != null ? rank[b] : 50;
      return ra - rb || (a < b ? -1 : 1);
    });

    var showFloorInHead = floor && !isKind(e, RE_FLOOR);
    var lines = ['🏢 ' + e.display + (showFloorInHead ? ' — ' + floorLabel(floor) : '') + ' (' + leaves.length + ' موقع):'];
    var shown = 0, max = CONFIG.maxList;
    order.forEach(function (f) {
      if (shown >= max) return;
      var names = groups[f].slice(0, max - shown);
      shown += names.length;
      var showLabel = f !== '_' && order.length > 1;
      lines.push((showLabel ? floorLabel(f) + ': ' : '') + names.join('، '));
    });
    if (leaves.length > shown) lines.push('… وغيرها ' + (leaves.length - shown) + '. حددي الدور أو اسم القاعة وأعطيك تفاصيلها.');
    return lines;
  }

  function listBuildings(wantCount) {
    var list = getIndex() || [];
    var b = list.filter(function (e) { return isKind(e, RE_BUILDING); });
    if (!b.length) b = list.filter(function (e) { return !e.parent && e.children.length; });
    if (!b.length) return null;
    var names = b.slice(0, CONFIG.maxList).map(function (e) { return e.display; });
    return [(wantCount ? 'عندنا ' + (b.length === 1 ? 'مبنى واحد' : b.length === 2 ? 'مبنيين' : b.length + ' مباني') + ': ' : 'المباني الموجودة في بيانات الكلية: ') + names.join('، ')];
  }

  /* ============================== فهم النية ============================== */
  var RE = {
    greet: /^(مرحبا|مرحبتين|هلا|هلا والله|اهلا|اهلين|السلام|سلام|الو|هاي|هلو|hi|hello|hey|صباح|مساء|يا هلا|حياك|حياكم)/,
    thanks: /(شكرا|مشكور|مشكوره|يعطيك العافيه|يعطيكم العافيه|تسلم|تسلمين|جزاك|الله يعافيك|thanks|thank)/,
    bye: /(مع السلامه|الى اللقاء|باي|bye|تصبح على خير)/,
    help: /(وش تقدر|ايش تقدر|شنو تقدر|كيف تساعد|ايش تسوي|وش تسوي|وش فايدتك|مين انت|من انت|وش انت|ايش انت|عرفني|ساعدني|مساعده|help)/,
    listWords: /(قاعات|القاعات|غرف|الغرف|معامل|المعامل|مكاتب|المكاتب|مرافق|المرافق|فيه|يحتوي|محتويات|محتوي|ايش في|وش في|اللي في|الي في|اي قاعات|كم قاعه|كم غرفه|كم معمل|كم موقع|كم مكتب|اقسام)/,
    buildingsWord: /(مباني|المباني|مبان|المبان|مبنيين)/,
    buildingsQ: /(وش|ايش|شنو|كم|اي|ما هي|عدد|قائمه|اسماء|عندكم|عندنا|فيه|موجوده|اعرض|ورني|وريني)/,
    count: /(كم|عدد)/,
    nav: /(كيف اوصل|كيف اروح|كيف اجي|اوصل|اروح|طريق|الطريق|المسار|توصلني|دلني|دليني|اتجاه|اقرب طريق)/,
    campus: /(قاعه|قاعات|مبني|مبان|كليه|دور|معمل|مكتب|وين|فين|اوصل|اروح|موقع|مكان|محاضره|مدرج|مكتبه|مصلي|كافتيريا|مطعم|دورات|مخرج|مدخل|بوابه|طابق|ممر)/
  };

  var lastEntity = null;

  function answer(rawQuery) {
    var original = String(rawQuery || '').trim();
    var qn = expandCodes(norm(original));
    var qtok = tokens(qn);
    var res = { lines: [], chips: [], entity: null };

    if (!qn) { res.lines = ['اكتبي سؤالك وأنا أساعدك 😊']; return res; }

    var data = getData();
    if (!data) {
      res.lines = ['بيانات الكلية ما تحمّلت عندي للحين 😕 حدّثي الصفحة وجربي مرة ثانية.'];
      return res;
    }

    var m = matchEntities(original);

    // 1) تحية/شكر/وداع/تعريف — فقط إذا ما فيه مكان مذكور
    if (!m.accepted.length) {
      if (RE.thanks.test(qn)) { res.lines = [pick(['العفو، أي وقت! 🌷', 'حياك الله، أبشري بأي شي ثاني 🌸'])]; return res; }
      if (RE.bye.test(qn)) { res.lines = ['الله يحفظك، بالتوفيق! 🌟']; return res; }
      if (RE.help.test(qn)) {
        res.lines = ['أنا مساعد مسار 🧭 أساعدك تعرفين وين المباني والقاعات في الكلية وش فيها، وأجاوب من بيانات الكلية بس.',
                     'جربي تسألين عن قاعة أو مبنى، أو اطلبي قائمة المباني.'];
        res.chips = sampleChips();
        return res;
      }
      if (qtok.length <= 4 && RE.greet.test(qn)) {
        res.lines = [pick(['هلا والله! 👋', 'يا هلا فيك! 🌷', 'أهلين! 👋']) + ' كيف أقدر أساعدك؟ اسأليني عن أي قاعة أو مبنى.'];
        res.chips = sampleChips();
        return res;
      }
    }

    // 2) مكان/أماكن محددة
    if (m.accepted.length) {
      var floor = parseFloorFilter(qn);
      var first = m.accepted[0];

      if (m.accepted.length === 1 && first.children.length && (RE.listWords.test(qn) || floor)) {
        res.lines = listContents(first, floor);
        res.entity = first;
        lastEntity = first;
        return res;
      }

      var out = [];
      out.push(pick(['أبشري، هذا اللي لقيته 👇', 'حياك، هذي المعلومات 👇', 'تمام، تفضلي 👇']));
      if (m.accepted.length > 1) out.push('لقيت أكثر من نتيجة قريبة من سؤالك:');
      m.accepted.forEach(function (e, i) {
        if (i > 0) out.push('');
        out = out.concat(detailLines(e));
      });
      if (RE.nav.test(qn)) out.push('', 'ولو تبغين المسار، اختاريه من البحث في الخريطة وبيطلع لك الطريق 🧭');
      res.lines = out;
      res.entity = first;
      lastEntity = first;
      return res;
    }

    // 3) سؤال متابعة عن آخر مكان ("وش فيه؟")
    if (lastEntity && qtok.length <= 4 && /(فيه|يحتوي|محتويات|وش فيه|ايش فيه)/.test(qn) && lastEntity.children.length) {
      res.lines = listContents(lastEntity, parseFloorFilter(qn));
      res.entity = lastEntity;
      return res;
    }

    // 4) قائمة/عدد المباني
    if (RE.buildingsWord.test(qn) && (RE.buildingsQ.test(qn) || qtok.length <= 3)) {
      var lb = listBuildings(RE.count.test(qn));
      res.lines = lb || ['ما لقيت قائمة مباني في بيانات الكلية 🤔'];
      return res;
    }

    // 5) اقتراح تصحيح
    if (m.suggestion) {
      res.lines = ['ما لقيت نتيجة مطابقة تماماً 🤔 تقصدين «' + m.suggestion.display + '»؟'];
      res.chips = ['وين ' + m.suggestion.display + '؟'];
      return res;
    }

    // 6) داخل الاختصاص لكن غير موجود في البيانات
    if (RE.campus.test(qn)) {
      res.lines = ['ما لقيت هذي المعلومة في بيانات الكلية 🤔 تأكدي من اسم المكان أو رقم القاعة، أو اكتبيها بصيغة ثانية.'];
      res.chips = sampleChips();
      return res;
    }

    // 7) خارج الاختصاص
    res.lines = ['أنا مخصص أساعدك في الكلية والتنقل بس 🙏 اسأليني عن المباني والقاعات وأبشري.'];
    res.chips = sampleChips();
    return res;
  }

  function sampleChips() {
    var chips = ['وش المباني الموجودة؟'];
    var list = getIndex() || [];
    var leaf = null, bld = null, i;
    for (i = 0; i < list.length; i++) {
      if (!bld && list[i].children.length && isKind(list[i], RE_BUILDING)) bld = list[i];
      if (!leaf && !list[i].children.length && list[i].display.length <= 24) leaf = list[i];
      if (bld && leaf) break;
    }
    if (bld) chips.push('وش في ' + bld.display + '؟');
    if (leaf) chips.push('وين ' + leaf.display + '؟');
    return chips.slice(0, 3);
  }

  /* ================================ الواجهة ================================ */
  var CSS = [
    '#masar-ai{--mai-primary:#0f766e;--mai-on:#fff;--mai-bg:#fff;--mai-surface:#f1f5f4;--mai-text:#1b2a28;--mai-muted:#62726f;--mai-border:rgba(15,40,35,.12);',
    'direction:rtl;font-family:inherit;line-height:1.55;position:fixed;bottom:0;z-index:99999;-webkit-tap-highlight-color:transparent}',
    '#masar-ai *{box-sizing:border-box;font-family:inherit}',
    '#masar-ai.mai-dark{--mai-bg:#1b2321;--mai-surface:#26302d;--mai-text:#e8f0ee;--mai-muted:#9db0ab;--mai-border:rgba(255,255,255,.14)}',
    '#masar-ai .mai-fab{position:fixed;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;',
    'background:var(--mai-primary);color:var(--mai-on);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .18s ease}',
    '#masar-ai .mai-fab:active{transform:scale(.94)}',
    '#masar-ai .mai-fab svg{width:28px;height:28px}',
    '#masar-ai.mai-left .mai-fab,#masar-ai.mai-left .mai-panel{left:16px}',
    '#masar-ai.mai-right .mai-fab,#masar-ai.mai-right .mai-panel{right:16px}',
    '#masar-ai .mai-panel{position:fixed;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:min(380px,calc(100vw - 24px));',
    'height:min(560px,calc(100vh - 120px));height:min(560px,calc(100dvh - 120px));display:flex;flex-direction:column;background:var(--mai-bg);color:var(--mai-text);',
    'border:1px solid var(--mai-border);border-radius:18px;overflow:hidden;box-shadow:0 14px 40px rgba(0,0,0,.28);',
    'opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transform-origin:bottom;transition:opacity .2s ease,transform .2s ease,visibility .2s}',
    '#masar-ai .mai-panel.mai-open{opacity:1;visibility:visible;transform:none}',
    '#masar-ai .mai-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--mai-primary);color:var(--mai-on)}',
    '#masar-ai .mai-head-ico{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex:none}',
    '#masar-ai .mai-head-ico svg{width:20px;height:20px}',
    '#masar-ai .mai-title{font-weight:700;font-size:16px;margin:0}',
    '#masar-ai .mai-sub{font-size:12px;opacity:.85;margin:0}',
    '#masar-ai .mai-head-txt{flex:1;min-width:0}',
    '#masar-ai .mai-close{background:transparent;border:0;color:inherit;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}',
    '#masar-ai .mai-close:hover{background:rgba(255,255,255,.16)}',
    '#masar-ai .mai-close svg{width:20px;height:20px}',
    '#masar-ai .mai-msgs{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px 12px;display:flex;flex-direction:column;gap:8px;background:var(--mai-bg)}',
    '#masar-ai .mai-b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:15px;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}',
    '#masar-ai .mai-bot{align-self:flex-start;background:var(--mai-surface);color:var(--mai-text);border-end-start-radius:4px}',
    '#masar-ai .mai-user{align-self:flex-end;background:var(--mai-primary);color:var(--mai-on);border-end-end-radius:4px}',
    '#masar-ai .mai-chips{align-self:flex-start;display:flex;flex-wrap:wrap;gap:6px;max-width:92%}',
    '#masar-ai .mai-chip{border:1px solid var(--mai-primary);background:transparent;color:var(--mai-primary);border-radius:999px;padding:6px 12px;font-size:13.5px;cursor:pointer}',
    '#masar-ai.mai-dark .mai-chip{color:var(--mai-text);border-color:var(--mai-border)}',
    '#masar-ai .mai-chip:hover{background:var(--mai-primary);color:var(--mai-on)}',
    '#masar-ai .mai-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:var(--mai-surface);border-radius:14px}',
    '#masar-ai .mai-typing i{width:7px;height:7px;border-radius:50%;background:var(--mai-muted);animation:mai-blink 1.1s infinite ease-in-out}',
    '#masar-ai .mai-typing i:nth-child(2){animation-delay:.18s}#masar-ai .mai-typing i:nth-child(3){animation-delay:.36s}',
    '@keyframes mai-blink{0%,80%,100%{opacity:.25}40%{opacity:1}}',
    '#masar-ai .mai-form{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid var(--mai-border);background:var(--mai-bg);padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}',
    '#masar-ai .mai-input{flex:1;min-width:0;height:42px;border:1px solid var(--mai-border);border-radius:21px;padding:0 14px;background:var(--mai-surface);color:var(--mai-text);font-size:16px;outline:none}',
    '#masar-ai .mai-input:focus{border-color:var(--mai-primary)}',
    '#masar-ai .mai-input::placeholder{color:var(--mai-muted)}',
    '#masar-ai .mai-btn{flex:none;width:42px;height:42px;border-radius:50%;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '#masar-ai .mai-btn svg{width:21px;height:21px}',
    '#masar-ai .mai-mic{background:var(--mai-surface);color:var(--mai-text);border:1px solid var(--mai-border)}',
    '#masar-ai .mai-mic.mai-live{background:#d92d20;color:#fff;border-color:#d92d20;animation:mai-pulse 1.2s infinite}',
    '@keyframes mai-pulse{0%{box-shadow:0 0 0 0 rgba(217,45,32,.5)}70%{box-shadow:0 0 0 10px rgba(217,45,32,0)}100%{box-shadow:0 0 0 0 rgba(217,45,32,0)}}',
    '#masar-ai .mai-send{background:var(--mai-primary);color:var(--mai-on)}',
    '#masar-ai .mai-send svg{transform:scaleX(-1)}',
    '#masar-ai button:focus-visible,#masar-ai .mai-input:focus-visible{outline:2px solid var(--mai-primary);outline-offset:2px}',
    '@media (max-width:480px){#masar-ai .mai-panel{width:calc(100vw - 16px);bottom:calc(80px + env(safe-area-inset-bottom,0px))}',
    '#masar-ai.mai-left .mai-panel{left:8px}#masar-ai.mai-right .mai-panel{right:8px}}',
    '@media (prefers-reduced-motion:reduce){#masar-ai *{animation:none!important;transition:none!important}}'
  ].join('');

  var ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>'
  };

  var ui = {};
  var rec = null, listening = false, opened = false, welcomed = false;

  function pickBrandColor() {
    if (CONFIG.brandColor) return CONFIG.brandColor;
    try {
      var cs = getComputedStyle(document.documentElement);
      var names = ['--primary', '--primary-color', '--main-color', '--brand', '--brand-color',
                   '--accent', '--accent-color', '--color-primary', '--theme-color', '--main', '--theme'];
      for (var i = 0; i < names.length; i++) {
        var v = cs.getPropertyValue(names[i]).trim();
        if (v) return v;
      }
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && meta.content) return meta.content;
    } catch (e) {}
    return '#0f766e';
  }

  function isPageDark() {
    var els = [document.documentElement, document.body];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el) continue;
      var cls = (el.className && el.className.toString ? el.className.toString() : '').toLowerCase();
      if (/(^|[\s_-])(dark|night)([\s_-]|$)/.test(cls)) return true;
      var attrs = [el.getAttribute('data-theme'), el.getAttribute('data-bs-theme'), el.getAttribute('data-mode')];
      for (var j = 0; j < attrs.length; j++) if (attrs[j] && /dark|night/i.test(attrs[j])) return true;
    }
    return false;
  }

  function syncTheme() {
    if (!ui.root) return;
    ui.root.classList.toggle('mai-dark', isPageDark());
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function scrollDown() { ui.msgs.scrollTop = ui.msgs.scrollHeight; }

  function addBubble(text, who) {
    var b = el('div', 'mai-b ' + (who === 'user' ? 'mai-user' : 'mai-bot'));
    b.textContent = text;
    ui.msgs.appendChild(b);
    scrollDown();
    return b;
  }

  function clearChips() {
    var old = ui.msgs.querySelectorAll('.mai-chips');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
  }

  function addChips(list) {
    if (!list || !list.length) return;
    var box = el('div', 'mai-chips');
    list.forEach(function (t) {
      var c = el('button', 'mai-chip');
      c.type = 'button';
      c.textContent = t;
      c.addEventListener('click', function () { send(t); });
      box.appendChild(c);
    });
    ui.msgs.appendChild(box);
    scrollDown();
  }

  function showTyping() {
    var t = el('div', 'mai-typing', '<i></i><i></i><i></i>');
    ui.msgs.appendChild(t);
    scrollDown();
    return t;
  }

  var busy = false;

  function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true;
    clearChips();
    addBubble(text, 'user');
    ui.input.value = '';
    var typing = showTyping();
    setTimeout(function () {
      var res;
      try { res = answer(text); }
      catch (e) { res = { lines: ['صار عندي خلل بسيط 😅 جربي تعيدين السؤال.'], chips: [], entity: null }; }
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      addBubble(res.lines.join('\n'), 'bot');
      addChips(res.chips);
      if (res.entity) {
        try {
          window.dispatchEvent(new CustomEvent('masar:assistant-place', {
            detail: { id: res.entity.idKey, name: res.entity.display, data: res.entity.raw }
          }));
        } catch (e) {}
      }
      busy = false;
    }, 280 + Math.random() * 220);
  }

  /* ----------------------------- المايك ----------------------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function setListening(on) {
    listening = on;
    ui.mic.classList.toggle('mai-live', on);
    ui.mic.setAttribute('aria-label', on ? 'إيقاف الاستماع' : 'تحدثي بالمايك');
    ui.input.placeholder = on ? 'أسمعك... تكلمي' : 'اكتبي سؤالك هنا...';
  }

  function stopMic() {
    if (rec && listening) { try { rec.stop(); } catch (e) {} }
  }

  function toggleMic() {
    if (!SR) {
      addBubble('المايك ما يشتغل في هالمتصفح 🙏 جربي كروم أو سفاري، أو اكتبي سؤالك.', 'bot');
      return;
    }
    if (listening) { stopMic(); return; }

    var gotText = false, errored = false;
    try {
      rec = new SR();
      rec.lang = CONFIG.lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
    } catch (e) {
      addBubble('ما قدرت أشغّل المايك 😕 اكتبي سؤالك وأنا حاضر.', 'bot');
      return;
    }

    rec.onstart = function () { setListening(true); };
    rec.onresult = function (ev) {
      var txt = '';
      for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      if (txt) { gotText = true; ui.input.value = txt; }
    };
    rec.onerror = function (ev) {
      errored = true;
      var err = ev && ev.error;
      var msg = 'ما قدرت أسمعك 😕 جربي مرة ثانية أو اكتبي سؤالك.';
      if (err === 'not-allowed' || err === 'service-not-allowed') msg = 'لازم تسمحين للمتصفح باستخدام المايك من إعدادات الموقع، وبعدها جربي مرة ثانية 🎙️';
      else if (err === 'no-speech') msg = 'ما سمعت صوتك 🤔 قربي من المايك وجربي مرة ثانية.';
      else if (err === 'audio-capture') msg = 'ما لقيت مايك في جهازك 🎙️';
      else if (err === 'network') msg = 'التعرف على الصوت يحتاج إنترنت. تقدرين تكتبين سؤالك مباشرة ✍️';
      else if (err === 'aborted') return;
      addBubble(msg, 'bot');
    };
    rec.onend = function () {
      setListening(false);
      var t = ui.input.value.trim();
      if (gotText && !errored && t) send(t);
    };

    try { rec.start(); }
    catch (e) { setListening(false); }
  }

  /* ----------------------------- فتح/إغلاق ----------------------------- */
  function open() {
    if (!ui.root) return;
    opened = true;
    ui.panel.classList.add('mai-open');
    ui.panel.setAttribute('aria-hidden', 'false');
    ui.fab.setAttribute('aria-expanded', 'true');
    ui.fab.innerHTML = ICONS.close;
    syncTheme();
    if (!welcomed) {
      welcomed = true;
      var hasData = !!getData();
      addBubble(hasData
        ? 'هلا والله 👋 أنا مساعد مسار. أساعدك تلقين المباني والقاعات في الكلية. اسأليني وأبشري!'
        : 'هلا والله 👋 أنا مساعد مسار، بس بيانات الكلية ما تحمّلت للحين. حدّثي الصفحة وجربي.', 'bot');
      if (hasData) addChips(sampleChips());
    }
    setTimeout(function () { try { ui.input.focus({ preventScroll: true }); } catch (e) {} }, 220);
  }

  function close() {
    if (!ui.root) return;
    opened = false;
    stopMic();
    ui.panel.classList.remove('mai-open');
    ui.panel.setAttribute('aria-hidden', 'true');
    ui.fab.setAttribute('aria-expanded', 'false');
    ui.fab.innerHTML = ICONS.chat;
  }

  function build() {
    if (document.getElementById('masar-ai')) return;

    var style = el('style');
    style.id = 'masar-ai-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var root = el('div');
    root.id = 'masar-ai';
    root.className = CONFIG.position === 'right' ? 'mai-right' : 'mai-left';
    root.style.setProperty('--mai-primary', pickBrandColor());

    var panel = el('section', 'mai-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'مساعد مسار');
    panel.setAttribute('aria-hidden', 'true');

    var head = el('div', 'mai-head');
    head.appendChild(el('div', 'mai-head-ico', ICONS.pin));
    var ht = el('div', 'mai-head-txt');
    ht.appendChild(el('p', 'mai-title', 'مساعد مسار'));
    ht.appendChild(el('p', 'mai-sub', 'أساعدك في الكلية والتنقل'));
    head.appendChild(ht);
    var closeBtn = el('button', 'mai-close', ICONS.close);
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.addEventListener('click', close);
    head.appendChild(closeBtn);

    var msgs = el('div', 'mai-msgs');
    msgs.setAttribute('aria-live', 'polite');

    var form = el('div', 'mai-form');
    var mic = el('button', 'mai-btn mai-mic', ICONS.mic);
    mic.type = 'button';
    mic.setAttribute('aria-label', 'تحدثي بالمايك');
    mic.addEventListener('click', toggleMic);

    var input = el('input', 'mai-input');
    input.type = 'text';
    input.placeholder = 'اكتبي سؤالك هنا...';
    input.setAttribute('aria-label', 'سؤالك');
    input.setAttribute('enterkeyhint', 'send');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); send(input.value); }
    });

    var sendBtn = el('button', 'mai-btn mai-send', ICONS.send);
    sendBtn.type = 'button';
    sendBtn.setAttribute('aria-label', 'إرسال');
    sendBtn.addEventListener('click', function () { send(input.value); });

    form.appendChild(mic);
    form.appendChild(input);
    form.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(msgs);
    panel.appendChild(form);

    var fab = el('button', 'mai-fab', ICONS.chat);
    fab.type = 'button';
    fab.setAttribute('aria-label', 'فتح مساعد مسار');
    fab.setAttribute('aria-expanded', 'false');
    fab.addEventListener('click', function () { opened ? close() : open(); });

    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    ui = { root: root, panel: panel, msgs: msgs, input: input, mic: mic, fab: fab };

    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && opened) close(); });

    syncTheme();
    try {
      var mo = new MutationObserver(syncTheme);
      var opts = { attributes: true, attributeFilter: ['class', 'data-theme', 'data-bs-theme', 'data-mode'] };
      mo.observe(document.documentElement, opts);
      mo.observe(document.body, opts);
    } catch (e) {}
  }

  /* ============================== واجهة برمجية صغيرة ============================== */
  window.MasarAssistant = {
    open: function () { build(); open(); },
    close: close,
    ask: function (q) { build(); if (!opened) open(); send(q); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
