/* ============================================================
   《拯救英伟达》网页视觉方案 — 交互脚本
   1) 按容器宽度缩放手机 / 桌面样机
   2) 滚动进入动画（可用 ?flat 关闭）
   3) 可交互样张：拖动卡片、键盘、四条线、报纸结局
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. fit device mockups ---------- */
  function fitAll() {
    document.querySelectorAll('.fit').forEach(function (fit) {
      var w = parseFloat(fit.getAttribute('data-w')) || 390;
      var h = parseFloat(fit.getAttribute('data-h')) || 844;
      var inner = fit.querySelector('.fit-inner');
      var host = fit.parentElement;
      if (!inner || !host) return;
      var avail = host.clientWidth;
      if (!avail) return;
      var s = Math.min(avail / w, 1);
      fit.style.width = (w * s) + 'px';
      fit.style.height = (h * s) + 'px';
      inner.style.transform = 'scale(' + s + ')';
    });
  }
  window.addEventListener('resize', fitAll, { passive: true });
  fitAll();
  window.addEventListener('load', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------- 2. reveal on scroll ---------- */
  if (/[?&]flat\b/.test(location.search)) document.documentElement.classList.add('no-reveal');
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3. interactive demo ---------- */
  var META = {
    capital: { name: '资本' },
    engineering: { name: '工程' },
    customers: { name: '客户' },
    politics: { name: '政界' }
  };
  var DEATH = {
    capital: { low: ['被自己的股价解雇', '董事会只开了十一分钟。他们甚至没让你坐下。'], high: ['泡沫破裂', '你把未来提前卖了。未来提前来了。'] },
    engineering: { low: ['最后一个工程师关灯', '他关灯前看了一眼你的办公室，然后带走了整个团队。'], high: ['最好的芯片，卖不出去', '你们做出了人类最好的芯片，客户要的是能按时到货的芯片。'] },
    customers: { low: ['他们有了备胎', '他们不是不爱你了，他们只是有了备胎。'], high: ['单点故障', '他们离不开你，所以他们决定拆了你。'] },
    politics: { low: ['两个首都都不接电话', '华盛顿和北京同时把你的号码移出了白名单。'], high: ['国家冠军', '你不再是一家公司。你是一个部门。'] }
  };
  var INITIAL = { capital: 42, engineering: 55, customers: 50, politics: 45 };
  var CARDS = [
    { file: 'FILE 00 · 2026-11-12', faction: '董事长', color: 'var(--gold)', role: '董事会主席', name: '哈维·琼斯', portrait: 'p-jones',
      quote: '董事会找到你，给了你九十天。九十天后，他们会再投一次票。',
      left: { label: '我需要时间', fx: { capital: -4, engineering: 4 } },
      right: { label: '我准备好了', fx: { capital: 4, engineering: -4 } } },
    { file: 'FILE 01 · 2026-11-12', faction: '资本', color: 'var(--gold)', role: 'CFO · 临时 CEO', name: '科莱特·克雷斯', portrait: 'p-cfo',
      quote: '账上还有 990 亿回购额度。回购，还是全砸研发？',
      left: { label: '回购', fx: { capital: 12, engineering: -10 } },
      right: { label: '研发', fx: { engineering: 12, capital: -10 } } },
    { file: 'FILE 02 · 2026-11-13', faction: '内部', color: '#9AA88F', role: '行政主管', name: '玛丽', portrait: 'p-admin',
      quote: '黄先生的皮衣还在您办公室。要收进储藏室吗？',
      left: { label: '收起来', fx: { capital: 6, engineering: -8 } },
      right: { label: '挂回去', fx: { engineering: 8, capital: -6 } } },
    { file: 'FILE 04 · 2026-11-13', faction: '中国监管', color: 'var(--red)', role: '市场监管调查组', name: '老周', portrait: 'p-reg',
      quote: '98 亿罚款。认了，还是退出中国？',
      left: { label: '认罚', fx: { politics: 10, capital: -12 } },
      right: { label: '退出', fx: { capital: 8, politics: -14 } } },
    { file: 'FILE 09 · 2026-11-12', faction: '前任', color: 'var(--green)', role: '短信', name: '老黄', portrait: 'p-coat',
      quote: 'GTC 那天，需要我上台吗？',
      left: { label: '请他上台', ending: { title: '他回来了', line: '董事会宣布他回归。你保留了头衔，和一间更小的办公室。' } },
      right: { label: '自己上', fx: { engineering: 10, capital: -6 } } }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    game: $('demo-game'), card: $('d-card'),
    file: $('d-file'), fac: $('d-fac'), facName: $('d-fac-name'),
    role: $('d-role'), name: $('d-name'), quote: $('d-quote'), portrait: $('d-portrait'),
    left: $('d-choice-left'), right: $('d-choice-right'),
    day: $('d-day'), quarter: $('d-quarter'), ticks: $('d-ticks'),
    death: $('demo-death'), deathTitle: $('d-death-title'), deathLine: $('d-death-line'), deathDays: $('d-death-days'),
    log: $('d-log'), meters: {}
  };
  if (!el.card) return;
  document.querySelectorAll('.gs--demo .meter').forEach(function (m) {
    el.meters[m.getAttribute('data-meter')] = m;
  });

  var st = { meters: {}, day: 1, idx: 0, busy: false, dead: false };
  function resetState() {
    st.meters = { capital: INITIAL.capital, engineering: INITIAL.engineering, customers: INITIAL.customers, politics: INITIAL.politics };
    st.day = 1; st.idx = 0; st.busy = false; st.dead = false;
  }
  function pad(n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; }

  function updateReadout() {
    $('r-capital').textContent = st.meters.capital;
    $('r-engineering').textContent = st.meters.engineering;
    $('r-customers').textContent = st.meters.customers;
    $('r-politics').textContent = st.meters.politics;
    $('r-day').textContent = st.day;
  }
  function updateMeters() {
    Object.keys(META).forEach(function (k) {
      var m = el.meters[k];
      if (!m) return;
      var v = st.meters[k];
      var fill = m.querySelector('.meter-fill');
      if (fill) fill.style.setProperty('--v', v + '%');
      m.classList.toggle('is-critical', v <= 20 || v >= 80);
      m.classList.remove('is-affected');
    });
    updateReadout();
  }
  function updateClock() {
    el.day.textContent = 'DAY ' + pad(st.day);
    var q = Math.floor((st.day - 1) / 91) + 1;
    el.quarter.textContent = '第 ' + q + ' 财季';
    var filled = Math.min(13, Math.floor(((st.day - 1) % 91) / 7) + 1);
    Array.prototype.forEach.call(el.ticks.children, function (t, i) {
      t.className = i < filled ? 'on' : '';
    });
  }
  function renderCard() {
    var c = CARDS[st.idx];
    if (el.file) el.file.textContent = c.file;
    if (el.facName) el.facName.textContent = c.faction;
    if (el.fac) el.fac.style.setProperty('--fc', c.color);
    el.role.textContent = c.role;
    el.name.textContent = c.name;
    el.quote.textContent = '“' + c.quote + '”';
    if (el.portrait) el.portrait.setAttribute('href', '#' + c.portrait);
    el.left.textContent = '← ' + c.left.label;
    el.right.textContent = c.right.label + ' →';
    el.left.style.opacity = '0';
    el.right.style.opacity = '0';
    el.card.classList.remove('is-dragging', 'is-left', 'is-right');
  }
  function highlightAffected(cardObj) {
    var keys = {};
    [cardObj.left.fx, cardObj.right.fx].forEach(function (fx) {
      if (fx) Object.keys(fx).forEach(function (k) { keys[k] = 1; });
    });
    Object.keys(keys).forEach(function (k) {
      if (el.meters[k]) el.meters[k].classList.add('is-affected');
    });
  }
  function clearAffected() {
    Object.keys(el.meters).forEach(function (k) { el.meters[k].classList.remove('is-affected'); });
  }
  function logChoice(day, opt) {
    var empty = el.log.querySelector('.empty');
    if (empty) empty.remove();
    var li = document.createElement('li');
    var glyphs = Object.keys(opt.fx || {}).map(function (k) {
      var v = opt.fx[k];
      return '<span class="lg ' + (v > 0 ? 'up' : 'down') + '">' + META[k].name + (v > 0 ? ' ▲' : ' ▼') + '</span>';
    }).join('');
    li.innerHTML = '<span class="lg-day">DAY ' + pad(day) + '</span><span>' + opt.label + '</span>' + glyphs;
    el.log.insertBefore(li, el.log.firstChild);
  }
  function showDeath(title, line, days) {
    el.deathTitle.textContent = title;
    el.deathLine.textContent = line;
    el.deathDays.textContent = days;
    el.death.hidden = false;
  }

  function commit(side) {
    if (st.busy || st.dead) return;
    var c = CARDS[st.idx];
    var opt = c[side];
    if (!opt) return;
    st.busy = true;
    clearAffected();
    el.card.style.transform = 'translateX(' + (side === 'left' ? -118 : 118) + '%) rotate(' + (side === 'left' ? -13 : 13) + 'deg)';
    el.card.style.opacity = '0';
    el.left.style.opacity = '0';
    el.right.style.opacity = '0';

    window.setTimeout(function () {
      if (opt.ending) {
        st.dead = true;
        showDeath(opt.ending.title, opt.ending.line, st.day);
        return;
      }
      Object.keys(opt.fx).forEach(function (k) {
        st.meters[k] = Math.max(0, Math.min(100, st.meters[k] + opt.fx[k]));
      });
      st.day += 7;
      updateMeters();
      updateClock();
      logChoice(st.day - 7, opt);

      var deadKey = Object.keys(st.meters).find(function (k) { return st.meters[k] <= 0 || st.meters[k] >= 100; });
      if (deadKey) {
        st.dead = true;
        var info = DEATH[deadKey][st.meters[deadKey] <= 0 ? 'low' : 'high'];
        window.setTimeout(function () { showDeath(info[0], info[1], st.day); }, 420);
        return;
      }

      st.idx = (st.idx + 1) % CARDS.length;
      el.card.style.transition = 'none';
      el.card.style.transform = '';
      el.card.style.opacity = '0';
      renderCard();
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          el.card.style.transition = '';
          el.card.style.opacity = '1';
          st.busy = false;
        });
      });
    }, 250);
  }

  function restart() {
    resetState();
    el.death.hidden = true;
    el.card.style.transition = 'none';
    el.card.style.transform = '';
    el.card.style.opacity = '1';
    window.requestAnimationFrame(function () { el.card.style.transition = ''; });
    el.log.innerHTML = '<li class="empty">还没有决策。</li>';
    renderCard();
    updateMeters();
    updateClock();
    clearAffected();
  }

  /* drag */
  var drag = { on: false, x0: 0, lastDx: 0 };
  function onDown(e) {
    if (st.busy || st.dead) return;
    drag.on = true; drag.x0 = e.clientX; drag.lastDx = 0;
    el.card.classList.add('is-dragging');
    try { el.card.setPointerCapture(e.pointerId); } catch (err) {}
    highlightAffected(CARDS[st.idx]);
  }
  function onMove(e) {
    if (!drag.on) return;
    var dx = Math.max(-160, Math.min(160, e.clientX - drag.x0));
    drag.lastDx = dx;
    el.card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.055) + 'deg)';
    var p = Math.min(1, Math.abs(dx) / 110);
    el.left.style.opacity = String(dx < -16 ? p : 0);
    el.right.style.opacity = String(dx > 16 ? p : 0);
    el.card.classList.toggle('is-left', dx < -16);
    el.card.classList.toggle('is-right', dx > 16);
  }
  function onUp(e) {
    if (!drag.on) return;
    drag.on = false;
    el.card.classList.remove('is-dragging', 'is-left', 'is-right');
    clearAffected();
    var dx = (typeof e.clientX === 'number' && e.clientX !== 0) ? e.clientX - drag.x0 : drag.lastDx;
    if (dx <= -96) commit('left');
    else if (dx >= 96) commit('right');
    else {
      el.card.style.transform = '';
      el.left.style.opacity = '0';
      el.right.style.opacity = '0';
    }
  }
  function onCancel() {
    if (!drag.on) return;
    drag.on = false;
    el.card.classList.remove('is-dragging', 'is-left', 'is-right');
    el.card.style.transform = '';
    el.left.style.opacity = '0';
    el.right.style.opacity = '0';
    clearAffected();
  }

  el.card.addEventListener('pointerdown', onDown);
  el.card.addEventListener('pointermove', onMove);
  el.card.addEventListener('pointerup', onUp);
  el.card.addEventListener('pointercancel', onCancel);

  $('d-left-btn').addEventListener('click', function () { commit('left'); });
  $('d-right-btn').addEventListener('click', function () { commit('right'); });
  $('d-reset').addEventListener('click', restart);
  $('d-restart2').addEventListener('click', restart);

  function demoInView() {
    var r = el.game.getBoundingClientRect();
    return r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.1;
  }
  window.addEventListener('keydown', function (e) {
    if (!demoInView()) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); commit('left'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); commit('right'); }
    else if (e.key === 'r' || e.key === 'R') { restart(); }
  });

  resetState();
  renderCard();
  updateMeters();
  updateClock();

  /* deep links: jump after layout settles */
  function jumpHash() {
    if (!location.hash) return;
    var target = document.querySelector(location.hash);
    if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  window.addEventListener('load', function () {
    window.setTimeout(function () { jumpHash(); fitAll(); }, 80);
  });
  if (location.hash) window.setTimeout(jumpHash, 60);
})();
