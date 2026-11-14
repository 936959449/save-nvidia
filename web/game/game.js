/* ============================================================
   拯救英伟达 · v1.0 — 游戏主逻辑
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.PROTO_DATA;
  var MANIFEST = window.ART_SLOTS;
  if (!DATA || !MANIFEST) { console.error('数据或素材清单未加载'); return; }

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v) { return Math.max(0, Math.min(100, v)); };
  var pad = function (n) { return n < 10 ? '00' + n : n < 100 ? '0' + n : '' + n; };
  var fileNo = function (n) { return n < 10 ? '0' + n : String(n); };
  var sumFx = function (fx) { return Object.keys(fx || {}).reduce(function (s, k) { return s + fx[k]; }, 0); };

  var CHAR = {};
  var STATES = {};
  MANIFEST.characters.forEach(function (c) {
    CHAR[c.id] = c;
    STATES[c.id] = {};
    c.states.forEach(function (s) { STATES[c.id][s.state] = true; });
  });

  var ORDER = DATA.meterOrder;
  var META = DATA.meterMeta;

  var S = {
    turn: 0, day: 1, meters: {}, passives: [], flags: {}, log: [],
    current: null, currentMood: 'neutral', busy: false, dead: false,
    recent: [], assetMode: false, debug: false, coach: false, coachChoice: false,
    best: Number(localStorage.getItem('saveNvidia.best') || 0)
  };

  /* ---------------- DOM ---------------- */
  var el = {
    app: $('app'),
    screens: { title: $('screen-title'), intro: $('screen-intro'), guide: $('screen-guide'), game: $('screen-game'), death: $('screen-death') },
    meterBox: $('meters'), gaugeBox: $('gauges'), passives: $('passives'), log: $('log'),
    day: $('day-label'), quarter: $('quarter-label'), ticks: $('ticks'),
    card: $('card'), cardFile: $('card-file'), cardFac: $('card-fac'), cardFaction: $('card-faction'),
    portrait: $('card-portrait'), name: $('card-name'), role: $('card-role'), quote: $('card-quote'),
    idleLeft: $('idle-left'), idleRight: $('idle-right'),
    dragLeft: $('drag-left'), dragRight: $('drag-right'),
    toast: $('toast'), slotBanner: $('slot-banner'),
    titleBest: $('title-best'), deathBest: $('death-best'),
    deathTitle: $('death-title'), deathLine: $('death-line'), deathDays: $('death-days'),
    deathPhoto: $('death-photo'), debugCard: $('debug-card'),
    introSkip: $('intro-skip'), introStart: $('intro-start'),
    introHint: $('intro-hint'), introStep: $('intro-step'),
    introProgress: $('intro-progress'), introStage: $('intro-stage'),
    guideStart: $('guide-start'), guideSkip: $('guide-skip'), guideMode: $('guide-mode'),
    coach: $('coach')
  };
  if (!el.card) return;

  /* ---------------- 初始化 UI ---------------- */
  function buildMeters() {
    el.meterBox.innerHTML = ORDER.map(function (k) {
      var m = META[k];
      return '<div class="meter" data-meter="' + k + '" style="--c:' + m.color + '">' +
        '<div class="meter-top"><svg width="11" height="11"><use href="#' + m.icon + '"/></svg><span>' + m.name + '</span><b class="meter-val" data-val="' + k + '">50</b></div>' +
        '<div class="meter-track"><i class="meter-fill"></i></div>' +
        '</div>';
    }).join('');
  }

  function buildGauges() {
    el.gaugeBox.innerHTML = ORDER.map(function (k) {
      var m = META[k];
      return '<div class="gauge" data-gauge="' + k + '" style="--c:' + m.color + '">' +
        '<div class="gauge-head"><span>' + m.name + '</span><span class="gauge-state">稳定</span><b class="gauge-val" data-val="' + k + '">50</b></div>' +
        '<div class="gauge-track"><b></b></div>' +
        '<div class="gauge-scale"><span>0</span><span>50</span><span>100</span></div>' +
        '</div>';
    }).join('');
  }

  function buildTicks() {
    el.ticks.innerHTML = Array.from({ length: DATA.cardsPerQuarter }, function () { return '<i></i>'; }).join('');
  }

  buildMeters();
  buildGauges();
  buildTicks();

  /* ---------------- 素材 ---------------- */
  function setImg(img, base) {
    if (img && window.Asset) window.Asset.set(img, base);
  }

  function initAssets() {
    setImg($('title-bg'), 'scenes/office');
    setImg($('title-evidence'), 'evidence/jacket');
    setImg($('title-portrait'), 'characters/jones-neutral');
    setImg($('intro-bg'), 'scenes/office');
    setImg($('intro-jacket'), 'evidence/jacket');
    setImg(el.deathPhoto, 'news/photo');
  }

  /* 首屏只加载当前可见素材；全部角色/表情等开场播放时再后台预热（约 4 MB WebP） */
  var assetsWarmed = false;
  function warmAssets() {
    if (assetsWarmed || !window.Asset) return;
    assetsWarmed = true;
    window.Asset.preloadAll();
  }

  /* ---------------- 屏幕 ---------------- */
  function showScreen(name) {
    Object.keys(el.screens).forEach(function (k) {
      el.screens[k].classList.toggle('is-active', k === name);
    });
    el.app.dataset.screen = name;
    document.body.dataset.screen = name;
  }

  /* ---------------- 开场演出：交接文件 ---------------- */
  var intro = { beat: 0, timer: null, timings: [3200, 3400, 3800, 0], beats: null, bars: null };

  function initIntroEls() {
    if (intro.beats) return;
    intro.beats = Array.prototype.slice.call(document.querySelectorAll('#screen-intro .intro-beat'));
    intro.bars = el.introProgress ? Array.prototype.slice.call(el.introProgress.children) : [];
  }

  function clearIntroTimer() {
    if (intro.timer) { window.clearTimeout(intro.timer); intro.timer = null; }
  }

  function setIntroBeat(i) {
    initIntroEls();
    clearIntroTimer();
    intro.beat = i;
    intro.beats.forEach(function (b, idx) { b.classList.toggle('is-active', idx === i); });
    if (intro.bars) {
      intro.bars.forEach(function (bar, idx) {
        bar.classList.toggle('is-current', idx === i);
        bar.classList.toggle('is-done', idx < i);
      });
    }
    if (el.introStep) el.introStep.textContent = '0' + (i + 1) + ' / 0' + intro.beats.length;
    if (el.introHint) el.introHint.textContent = i === intro.beats.length - 1 ? '按 Enter 接受任命 · Esc 跳过' : '点击继续 · Esc 跳过';
    if (i < intro.beats.length - 1) {
      intro.timer = window.setTimeout(advanceIntro, intro.timings[i] || 3200);
    }
  }

  function beginIntro() {
    initIntroEls();
    clearIntroTimer();
    warmAssets();
    showScreen('intro');
    intro.beats.forEach(function (b) { b.classList.remove('is-active'); });
    if (el.introStage) void el.introStage.offsetWidth;
    setIntroBeat(0);
  }

  function advanceIntro() {
    if (document.body.dataset.screen !== 'intro') return;
    if (intro.beat >= intro.beats.length - 1) { finishIntro(); return; }
    setIntroBeat(intro.beat + 1);
  }

  function afterIntro() {
    clearIntroTimer();
    if (hasSeenGuide()) startGame();
    else openGuide('first');
  }

  function finishIntro() {
    afterIntro();
  }

  function skipIntro() {
    afterIntro();
  }

  /* ---------------- 新手引导 ---------------- */
  var GUIDE_KEY = 'saveNvidia.guideSeen';
  var guideMode = 'first';

  function hasSeenGuide() {
    try { return localStorage.getItem(GUIDE_KEY) === '1'; } catch (err) { return false; }
  }

  function markGuideSeen() {
    try { localStorage.setItem(GUIDE_KEY, '1'); } catch (err) {}
  }

  function openGuide(mode) {
    guideMode = mode || 'game';
    if (el.guideMode) el.guideMode.textContent = guideMode === 'first' ? '首次入职 · 先看三件事' : '玩法说明 · 随时可查';
    if (el.guideStart) el.guideStart.textContent = guideMode === 'first' ? '知道了，开始第一天 →' : '回到游戏 →';
    if (el.guideSkip) el.guideSkip.textContent = guideMode === 'first' ? '跳过引导' : '关闭';
    showScreen('guide');
  }

  function closeGuide() {
    markGuideSeen();
    if (guideMode === 'first') {
      startGame({ coach: true });
    } else {
      showScreen('game');
    }
  }

  /* ---------------- 首次操作提示 ---------------- */
  var coachTimer = null;
  function showCoach() {
    if (!el.coach) return;
    if (coachTimer) window.clearTimeout(coachTimer);
    el.coach.hidden = false;
    window.requestAnimationFrame(function () { el.coach.classList.add('is-on'); });
    coachTimer = window.setTimeout(hideCoach, 10000);
  }

  function hideCoach() {
    if (!el.coach) return;
    if (coachTimer) { window.clearTimeout(coachTimer); coachTimer = null; }
    el.coach.classList.remove('is-on');
    window.setTimeout(function () { if (!el.coach.classList.contains('is-on')) el.coach.hidden = true; }, 220);
  }

  /* ---------------- 渲染 ---------------- */
  function renderMeters() {
    ORDER.forEach(function (k) {
      var v = S.meters[k];
      var box = el.meterBox.querySelector('[data-meter="' + k + '"]');
      if (!box) return;
      var fill = box.querySelector('.meter-fill');
      if (fill) fill.style.width = v + '%';
      var val = box.querySelector('[data-val="' + k + '"]');
      if (val) val.textContent = v;
      box.classList.toggle('is-critical', v <= 20 || v >= 80);
      box.classList.toggle('is-hot', v >= 80);
    });
    ORDER.forEach(function (k) {
      var v = S.meters[k];
      var g = el.gaugeBox.querySelector('[data-gauge="' + k + '"]');
      if (!g) return;
      g.querySelector('.gauge-track b').style.width = v + '%';
      var val = g.querySelector('[data-val="' + k + '"]');
      if (val) val.textContent = v;
      var state = g.querySelector('.gauge-state');
      if (state) {
        state.textContent = v <= 20 ? '临界' : v >= 80 ? '过热' : '稳定';
        state.classList.toggle('warn', v <= 20);
      }
      g.querySelector('.gauge-track').classList.toggle('is-warn', v <= 20);
    });
  }

  function renderClock() {
    el.day.textContent = 'DAY ' + pad(S.day);
    var q = Math.floor((S.day - 1) / 91) + 1;
    el.quarter.textContent = '第 ' + q + ' 财季';
    var filled = Math.min(DATA.cardsPerQuarter, Math.floor(((S.day - 1) % 91) / 7) + 1);
    Array.prototype.forEach.call(el.ticks.children, function (t, i) {
      t.className = i < filled ? 'on' : '';
    });
  }

  function renderPassives() {
    var html = '';
    for (var i = 0; i < 4; i++) {
      var key = S.passives[i];
      if (key) {
        var p = DATA.passives[key];
        html += '<span class="pslot is-filled" title="' + p.name + ' · ' + p.line + '">' +
          '<svg width="14" height="14"><use href="#i-' + p.icon + '"/></svg></span>';
      } else {
        html += '<span class="pslot"></span>';
      }
    }
    el.passives.innerHTML = html;
    var cap = el.passives.parentElement && el.passives.parentElement.querySelector('.passive-count');
    if (cap) cap.textContent = S.passives.length + '/4';
  }

  function renderLog() {
    if (!S.log.length) { el.log.innerHTML = '<li class="empty">还没有决策。</li>'; return; }
    el.log.innerHTML = S.log.slice(0, 5).map(function (entry) {
      var glyphs = Object.keys(entry.fx || {}).map(function (k) {
        var v = entry.fx[k];
        var num = S.debug ? ' ' + (v > 0 ? '+' : '') + v : '';
        return '<span class="lg ' + (v > 0 ? 'up' : 'down') + '">' + META[k].name + (v > 0 ? ' ▲' : ' ▼') + num + '</span>';
      }).join('');
      return '<li><span class="lg-day">DAY ' + pad(entry.day) + '</span><span class="lg-txt">' + entry.label + '</span>' + glyphs + '</li>';
    }).join('');
  }

  function charMoodBase(char, mood) {
    if (STATES[char] && STATES[char][mood]) return 'characters/' + char + '-' + mood;
    return 'characters/' + char + '-neutral';
  }

  function renderCard() {
    var c = S.current;
    if (!c) return;
    var ch = CHAR[c.char];
    var mood = c.mood || 'neutral';
    S.currentMood = mood;
    el.cardFile.textContent = 'FILE ' + fileNo(S.turn) + ' · DAY ' + pad(S.day);
    el.cardFaction.textContent = ch.faction;
    el.cardFac.style.setProperty('--fc', ch.color);
    el.name.textContent = ch.name;
    el.role.textContent = ch.role;
    el.portrait.alt = ch.name + '，' + ch.role;
    el.quote.textContent = '“' + c.quote + '”';
    el.idleLeft.textContent = '← ' + c.left.label;
    el.idleRight.textContent = c.right.label + ' →';
    el.dragLeft.textContent = '← ' + c.left.label;
    el.dragRight.textContent = c.right.label + ' →';
    setImg(el.portrait, charMoodBase(c.char, mood));
    el.card.classList.remove('is-dragging', 'is-left', 'is-right', 'is-out-left', 'is-out-right', 'is-react');
    el.card.style.transform = '';
    el.card.style.opacity = '1';
    if (el.debugCard) el.debugCard.textContent = c.id + ' / ' + c.char + ' / ' + S.turn;
    if (el.dragLeft) el.dragLeft.style.opacity = '0';
    if (el.dragRight) el.dragRight.style.opacity = '0';
    clearAffected();
  }

  function setPortraitMood(mood) {
    var c = S.current;
    if (!c) return;
    setImg(el.portrait, charMoodBase(c.char, mood));
  }

  function highlightAffected(card) {
    var keys = {};
    [card.left.fx, card.right.fx].forEach(function (fx) {
      if (fx) Object.keys(fx).forEach(function (k) { keys[k] = true; });
    });
    Object.keys(keys).forEach(function (k) {
      var m = el.meterBox.querySelector('[data-meter="' + k + '"]');
      if (m) m.classList.add('is-affected');
    });
  }
  function clearAffected() {
    el.meterBox.querySelectorAll('.meter').forEach(function (m) { m.classList.remove('is-affected'); });
  }

  /* ---------------- 抽卡 ---------------- */
  function meets(card) {
    var r = card.requires;
    if (!r) return true;
    if (r.flagsAll && !r.flagsAll.every(function (f) { return !!S.flags[f]; })) return false;
    if (r.flagsNone && r.flagsNone.some(function (f) { return !!S.flags[f]; })) return false;
    return true;
  }

  function drawCard() {
    var scripted = DATA.cards.filter(function (c) { return c.at === S.turn; })[0];
    if (scripted && meets(scripted)) return scripted;

    var pool = DATA.cards.filter(function (c) {
      return !c.at && meets(c) && S.recent.indexOf(c.id) === -1;
    });
    if (!pool.length) {
      S.recent = [];
      pool = DATA.cards.filter(function (c) { return !c.at && meets(c); });
    }
    var crises = pool.filter(function (c) { return c.crisis; });
    var normal = pool.filter(function (c) { return !c.crisis; });
    var useCrisis = S.turn >= 14 && crises.length && Math.random() < 0.22;
    var pick = useCrisis ? crises[Math.floor(Math.random() * crises.length)] :
      (normal.length ? normal[Math.floor(Math.random() * normal.length)] : pool[0]);
    return pick;
  }

  function nextTurn() {
    S.turn += 1;
    S.day = (S.turn - 1) * DATA.dayPerCard + 1;
    S.busy = false;
    S.current = drawCard();
    if (!S.current) { S.turn = 1; S.current = drawCard(); }
    S.recent.push(S.current.id);
    if (S.recent.length > 8) S.recent.shift();
    renderCard();
    renderClock();
    renderMeters();
    renderPassives();
    renderLog();
  }

  /* ---------------- 选择 ---------------- */
  function reactMood(opt) {
    if (opt.react) return opt.react;
    if (S.current.char === 'huang') return S.currentMood;
    var net = sumFx(opt.fx);
    if (net > 0) return 'pleased';
    if (net < 0) return 'pressured';
    return 'neutral';
  }

  function grantPassive(key) {
    if (!key || !DATA.passives[key] || S.passives.indexOf(key) !== -1) return;
    S.passives.push(key);
    if (S.passives.length > 4) S.passives.shift();
    toast('底牌到手：' + DATA.passives[key].name);
  }

  function applyOption(opt) {
    Object.keys(opt.fx || {}).forEach(function (k) {
      S.meters[k] = clamp(S.meters[k] + opt.fx[k]);
    });
    if (opt.flag) S.flags[opt.flag] = true;
    grantPassive(opt.passive);
    S.log.unshift({ day: S.day, label: opt.label, fx: opt.fx || {} });
    renderMeters();
    renderPassives();
    renderLog();
  }

  function boundary() {
    for (var i = 0; i < ORDER.length; i++) {
      var k = ORDER[i];
      if (S.meters[k] <= 0) return { key: k, dir: 'low' };
      if (S.meters[k] >= 100) return { key: k, dir: 'high' };
    }
    return null;
  }

  function trySavePassive(b) {
    if (b.dir !== 'low') return false;
    for (var i = 0; i < S.passives.length; i++) {
      var key = S.passives[i];
      var p = DATA.passives[key];
      if (p.saves === b.key) {
        S.passives.splice(i, 1);
        S.meters[b.key] = 40;
        toast('底牌「' + p.name + '」救场：' + META[b.key].name + '回到 40');
        S.log.unshift({ day: S.day, label: '底牌「' + p.name + '」救场', fx: {} });
        renderMeters();
        renderPassives();
        renderLog();
        return true;
      }
    }
    return false;
  }

  function flyOut(side, cb) {
    el.card.classList.remove('is-dragging');
    el.card.style.transform = 'translateX(' + (side === 'left' ? -125 : 125) + '%) rotate(' + (side === 'left' ? -13 : 13) + 'deg)';
    el.card.style.opacity = '0';
    if (el.dragLeft) el.dragLeft.style.opacity = '0';
    if (el.dragRight) el.dragRight.style.opacity = '0';
    window.setTimeout(cb, 280);
  }

  function resetCardVisual() {
    el.card.classList.remove('is-dragging', 'is-left', 'is-right');
    el.card.style.transform = '';
    if (el.dragLeft) el.dragLeft.style.opacity = '0';
    if (el.dragRight) el.dragRight.style.opacity = '0';
    clearAffected();
  }

  function commit(side) {
    if (S.busy || S.dead || !S.current) return;
    var opt = S.current[side];
    if (!opt) return;
    hideCoach();
    S.busy = true;
    resetCardVisual();

    if (opt.ending) {
      S.busy = false;
      S.dead = true;
      window.setTimeout(function () { showEnding(opt.ending); }, 420);
      return;
    }

    applyOption(opt);
    if (S.coachChoice) {
      S.coachChoice = false;
      window.setTimeout(function () {
        toast('四条线已变化 · 任一归零或爆表，任期结束', 3400);
      }, 520);
    }
    var react = reactMood(opt);
    setPortraitMood(react);
    el.card.classList.add('is-react');

    var b = boundary();
    window.setTimeout(function () {
      if (b) {
        if (trySavePassive(b)) {
          flyOut(side, function () { nextTurn(); });
        } else {
          flyOut(side, function () {
            S.dead = true;
            showEnding(b.key + '-' + b.dir);
          });
        }
        return;
      }
      flyOut(side, function () { nextTurn(); });
    }, 430);
  }

  /* ---------------- 结局与结算 ---------------- */
  function showEnding(key) {
    hideCoach();
    var ending = DATA.endings[key] || DATA.endings['capital-low'];
    var days = Math.max(7, S.turn * DATA.dayPerCard);
    el.deathTitle.textContent = ending.title;
    el.deathLine.textContent = ending.line;
    el.deathDays.textContent = days;
    if (days > S.best) {
      S.best = days;
      localStorage.setItem('saveNvidia.best', String(days));
    }
    el.deathBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
    if (el.titleBest) el.titleBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
    setImg(el.deathPhoto, 'news/photo');
    showScreen('death');
  }

  /* ---------------- 开始 / 重开 ---------------- */
  function resetState() {
    S.turn = 0;
    S.day = 1;
    S.meters = Object.assign({}, DATA.initialMeters);
    S.passives = [];
    S.flags = {};
    S.log = [];
    S.current = null;
    S.currentMood = 'neutral';
    S.busy = false;
    S.dead = false;
    S.recent = [];
    S.coach = false;
    S.coachChoice = false;
  }

  function startGame(opts) {
    clearIntroTimer();
    hideCoach();
    resetState();
    S.coach = !!(opts && opts.coach);
    S.coachChoice = S.coach;
    warmAssets();
    showScreen('game');
    el.card.style.transition = 'none';
    el.card.style.transform = '';
    el.card.style.opacity = '1';
    window.requestAnimationFrame(function () { el.card.style.transition = ''; });
    nextTurn();
    if (S.coach) showCoach();
    if (el.titleBest) el.titleBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
  }

  function goTitle() {
    clearIntroTimer();
    hideCoach();
    showScreen('title');
    if (el.titleBest) el.titleBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
  }

  /* ---------------- 提示 ---------------- */
  var toastTimer = null;
  function toast(text, ms) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    el.toast.classList.add('is-on');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.toast.classList.remove('is-on');
      window.setTimeout(function () { el.toast.hidden = true; }, 200);
    }, ms || 1800);
  }

  /* ---------------- 拖拽 ---------------- */
  var drag = { on: false, x0: 0, dx: 0 };
  function onDown(e) {
    if (S.busy || S.dead) return;
    if (document.body.dataset.screen !== 'game') return;
    hideCoach();
    drag.on = true;
    drag.x0 = e.clientX;
    drag.dx = 0;
    el.card.classList.add('is-dragging');
    try { el.card.setPointerCapture(e.pointerId); } catch (err) {}
    highlightAffected(S.current);
  }
  function onMove(e) {
    if (!drag.on) return;
    var dx = Math.max(-160, Math.min(160, e.clientX - drag.x0));
    drag.dx = dx;
    el.card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.055) + 'deg)';
    var p = Math.min(1, Math.abs(dx) / 110);
    el.dragLeft.style.opacity = String(dx < -16 ? p : 0);
    el.dragRight.style.opacity = String(dx > 16 ? p : 0);
    el.card.classList.toggle('is-left', dx < -16);
    el.card.classList.toggle('is-right', dx > 16);
  }
  function onUp(e) {
    if (!drag.on) return;
    drag.on = false;
    var dx = (typeof e.clientX === 'number' && e.clientX !== 0) ? e.clientX - drag.x0 : drag.dx;
    el.card.classList.remove('is-dragging', 'is-left', 'is-right');
    if (dx <= -90) commit('left');
    else if (dx >= 90) commit('right');
    else resetCardVisual();
  }
  function onCancel() {
    if (!drag.on) return;
    drag.on = false;
    resetCardVisual();
  }

  /* ---------------- 事件 ---------------- */
  el.card.addEventListener('pointerdown', onDown);
  el.card.addEventListener('pointermove', onMove);
  el.card.addEventListener('pointerup', onUp);
  el.card.addEventListener('pointercancel', onCancel);

  $('start-btn').addEventListener('click', beginIntro);
  $('again-btn').addEventListener('click', startGame);
  $('restart-btn').addEventListener('click', function () { if (document.body.dataset.screen === 'game') startGame(); });
  $('home-btn').addEventListener('click', goTitle);
  $('death-home').addEventListener('click', goTitle);
  $('dash-left').addEventListener('click', function () { commit('left'); });
  $('dash-right').addEventListener('click', function () { commit('right'); });
  $('guide-btn').addEventListener('click', function () { if (!S.busy && !S.dead) openGuide('game'); });
  if (el.guideStart) el.guideStart.addEventListener('click', closeGuide);
  if (el.guideSkip) el.guideSkip.addEventListener('click', closeGuide);

  if (el.introSkip) {
    el.introSkip.addEventListener('click', function (e) { e.stopPropagation(); skipIntro(); });
  }
  if (el.introStart) {
    el.introStart.addEventListener('click', function (e) { e.stopPropagation(); finishIntro(); });
  }
  el.screens.intro.addEventListener('click', function (e) {
    if (e.target.closest('button, a')) return;
    advanceIntro();
  });

  $('asset-toggle').addEventListener('click', function () {
    document.body.classList.toggle('slots-on');
    var on = document.body.classList.contains('slots-on');
    if (el.slotBanner) {
      el.slotBanner.hidden = !on;
      el.slotBanner.textContent = '美术资源模式：' + (window.Asset ? window.Asset.countSlots() : 29) + ' 个槽位 · 虚线框内为素材区域';
    }
    toast(on ? '美术资源模式：开' : '美术资源模式：关');
  });

  window.addEventListener('keydown', function (e) {
    if (document.body.dataset.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); beginIntro(); return; }
    if (document.body.dataset.screen === 'intro') {
      if (e.key === 'Escape' || e.key === 's' || e.key === 'S') { e.preventDefault(); skipIntro(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advanceIntro(); }
      return;
    }
    if (document.body.dataset.screen === 'guide') {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeGuide(); }
      return;
    }
    if (e.key === 'a' || e.key === 'A') { $('asset-toggle').click(); return; }
    if (e.key === 'd' || e.key === 'D') {
      S.debug = !S.debug;
      document.body.classList.toggle('debug', S.debug);
      renderMeters(); renderLog();
      toast(S.debug ? '调试模式：显示数值' : '调试模式：隐藏数值');
      return;
    }
    if (document.body.dataset.screen === 'death') {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') startGame();
      return;
    }
    if (document.body.dataset.screen !== 'game') return;
    if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      if (!S.busy && !S.dead) openGuide('game');
      return;
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); commit('left'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); commit('right'); }
    else if (e.key === 'r' || e.key === 'R') { startGame(); }
    else if (e.key === 'Escape') { goTitle(); }
  });

  /* ---------------- 启动 ---------------- */
  initAssets();
  if (el.titleBest) el.titleBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
  el.deathBest.textContent = S.best > 0 ? S.best + ' 天' : '—';
  showScreen('title');
  // 从入口页一键开局：game/index.html?start=1
  if (/[?&]start=1(?:&|$)/.test(window.location.search)) beginIntro();
})();
