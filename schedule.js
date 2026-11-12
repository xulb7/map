/* جدول الطالب + تنبيه قبل المحاضرة بـ 5 دقايق + تسجيل PWA
   الاستخدام: أضف في index.html قبل </body>:
   <link rel="stylesheet" href="schedule.css"><script src="schedule.js"></script> */
(function () {
  const KEY = 'studentSchedule_v1';
  const NOTIFIED = 'studentSchedule_notified_v1';
  const LEAD_MIN = 5;
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const save = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };

  // ---------- PWA ----------
  let swReg = null;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(r => { swReg = r; }).catch(() => {});
  }
  if (!document.querySelector('link[rel=manifest]')) {
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.json'; document.head.appendChild(l);
  }
  if (!document.querySelector('meta[name=theme-color]')) {
    const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#6a1b9a'; document.head.appendChild(m);
  }
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; render(); });

  // ---------- الواجهة ----------
  const btn = document.createElement('button');
  btn.id = 'sch-btn'; btn.textContent = '📅 جدولي';
  const modal = document.createElement('div');
  modal.id = 'sch-modal';
  modal.innerHTML = `
    <div id="sch-box">
      <h3>جدولي الدراسي</h3>
      <div id="sch-form">
        <input class="full" id="sch-name" placeholder="اسم المادة">
        <select id="sch-day">${DAYS.map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select>
        <input id="sch-time" type="time">
        <input class="full" id="sch-room" placeholder="القاعة (مثال: A-101) - اختياري">
        <button class="sch-primary full" id="sch-add">إضافة محاضرة</button>
      </div>
      <ul id="sch-list"></ul>
      <div id="sch-status"></div>
      <div id="sch-actions">
        <button class="sch-primary" id="sch-notif">تفعيل التنبيهات</button>
        <button class="sch-ghost" id="sch-install" style="display:none">تثبيت التطبيق</button>
        <button class="sch-ghost" id="sch-close">إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(btn);
  document.body.appendChild(modal);
  const $ = id => modal.querySelector('#' + id);

  function render() {
    const list = load().sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
    $('sch-list').innerHTML = list.length ? list.map(x =>
      `<li><span><b>${esc(x.name)}</b><small>${DAYS[x.day]} - ${x.time}${x.room ? ' - ' + esc(x.room) : ''}</small></span><button data-id="${x.id}" aria-label="حذف">🗑</button></li>`
    ).join('') : '<li>ما أضفتي أي محاضرة بعد</li>';
    const p = 'Notification' in window ? Notification.permission : 'unsupported';
    $('sch-status').textContent =
      p === 'granted' ? `التنبيهات مفعّلة (قبل المحاضرة بـ ${LEAD_MIN} دقايق). خلي الموقع مفتوح أو مثبّت.` :
      p === 'denied' ? 'التنبيهات محظورة من إعدادات المتصفح.' :
      p === 'unsupported' ? 'متصفحك ما يدعم التنبيهات.' : 'فعّلي التنبيهات عشان توصلك رسالة قبل المحاضرة.';
    $('sch-install').style.display = installEvt ? '' : 'none';
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  btn.onclick = () => { render(); modal.classList.add('open'); };
  $('sch-close').onclick = () => modal.classList.remove('open');
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  $('sch-add').onclick = () => {
    const name = $('sch-name').value.trim(), time = $('sch-time').value;
    if (!name || !time) { alert('اكتبي اسم المادة والوقت'); return; }
    const l = load();
    l.push({ id: Date.now().toString(36), name, day: +$('sch-day').value, time, room: $('sch-room').value.trim() });
    save(l); $('sch-name').value = ''; $('sch-room').value = ''; render();
  };
  $('sch-list').onclick = e => {
    const id = e.target.dataset && e.target.dataset.id;
    if (id) { save(load().filter(x => x.id !== id)); render(); }
  };
  $('sch-notif').onclick = async () => {
    if (!('Notification' in window)) return render();
    await Notification.requestPermission(); render(); check();
  };
  $('sch-install').onclick = async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice; installEvt = null; render();
  };

  // ---------- التنبيهات ----------
  function notified() { try { return JSON.parse(localStorage.getItem(NOTIFIED)) || {}; } catch (e) { return {}; } }
  async function notify(item) {
    const opts = {
      body: `${item.name} الساعة ${item.time}${item.room ? ' - القاعة ' + item.room : ''}`,
      icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: item.id, lang: 'ar', dir: 'rtl', vibrate: [200, 100, 200]
    };
    const title = `محاضرتك بعد ${LEAD_MIN} دقايق`;
    try {
      const reg = swReg || (await navigator.serviceWorker.getRegistration());
      if (reg) return reg.showNotification(title, opts);
    } catch (e) {}
    try { new Notification(title, opts); } catch (e) {}
  }
  function check() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date(), today = now.getDay();
    const stamp = now.toISOString().slice(0, 10);
    const done = notified();
    for (const k in done) if (!k.endsWith(stamp)) delete done[k]; // تنظيف أيام قديمة
    for (const it of load()) {
      if (it.day !== today) continue;
      const [h, m] = it.time.split(':').map(Number);
      const start = new Date(now); start.setHours(h, m, 0, 0);
      const diff = (start - now) / 60000;
      const key = it.id + '_' + stamp;
      if (diff <= LEAD_MIN && diff > 0 && !done[key]) { done[key] = 1; notify(it); }
    }
    try { localStorage.setItem(NOTIFIED, JSON.stringify(done)); } catch (e) {}
  }
  setInterval(check, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  check();
})();
