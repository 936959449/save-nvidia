/* ============================================================
   拯救英伟达 · v1.0 — 美术素材加载器
   - 读取 assets/manifest.js（无需 fetch，file:// 可直接打开）
   - 同名文件按 webp → png → jpg → jpeg → svg 依次解析
   - preloadAll 提供真实完成进度；set 在资源未就绪时先显示 LOADING 占位
   - 任何失败都会回落到 MISSING 占位，不出现破图
   ============================================================ */
(function () {
  'use strict';

  var MANIFEST = window.ART_SLOTS;
  if (!MANIFEST) { console.warn('ART_SLOTS manifest 未加载'); return; }

  var EXTS = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
  var PROBE_TIMEOUT = 30000;
  var SIZE = {
    characters: { w: 1200, h: 840, safe: 80 },
    scenes: { w: 1600, h: 900, safe: 80 },
    evidence: { w: 1200, h: 800, safe: 60 },
    news: { w: 800, h: 600, safe: 40 }
  };

  var cache = new Map();       // base -> Promise<result>
  var results = new Map();     // base -> resolved result
  var info = new Map();        // base -> slot info
  var allBases = [];

  MANIFEST.characters.forEach(function (c) {
    c.states.forEach(function (s) {
      info.set(s.file, {
        type: 'character', base: s.file, characterId: c.id, name: c.name, role: c.role,
        faction: c.faction, color: c.color, state: s.state, stateLabel: s.label,
        usage: s.usage, size: SIZE.characters, note: c.note
      });
    });
  });
  MANIFEST.misc.forEach(function (m) {
    info.set(m.file, {
      type: m.group, base: m.file, name: m.name, role: m.usage, usage: m.usage,
      size: SIZE[m.group] || SIZE.characters, note: m.note
    });
  });
  allBases = Array.from(info.keys());

  var progress = { done: 0, total: allBases.length, current: '', ready: false, missing: 0 };
  var progressListeners = [];
  var runningPromise = null;

  function snapshot() {
    return { done: progress.done, total: progress.total, current: progress.current, ready: progress.ready, missing: progress.missing };
  }
  function emitProgress() {
    var snap = snapshot();
    progressListeners.forEach(function (cb) {
      try { cb(snap); } catch (e) { /* 不让 UI 回调打断加载 */ }
    });
  }

  function sizeFor(base) {
    var m = info.get(base);
    return (m && m.size) || SIZE.characters;
  }

  function assetSvg(base, mode) {
    var size = sizeFor(base);
    var label = base.split('/').pop();
    var isMissing = mode === 'missing';
    var color = isMissing ? '#D4574A' : '#A6E04C';
    var title = isMissing ? 'MISSING ASSET' : 'LOADING ASSET';
    var sub = isMissing ? 'assets/' + base + '.png' : '正在调取 · ' + base;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size.w + '" height="' + size.h + '" viewBox="0 0 ' + size.w + ' ' + size.h + '">' +
      '<rect width="' + size.w + '" height="' + size.h + '" fill="#20261F"/>' +
      '<rect x="24" y="24" width="' + (size.w - 48) + '" height="' + (size.h - 48) + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-dasharray="14 12" opacity=".75"/>' +
      '<text x="' + (size.w / 2) + '" y="' + (size.h * 0.43) + '" text-anchor="middle" font-family="Consolas,monospace" font-size="52" fill="' + color + '">' + title + '</text>' +
      '<text x="' + (size.w / 2) + '" y="' + (size.h * 0.53) + '" text-anchor="middle" font-family="Consolas,monospace" font-size="28" fill="#F2ECDF">' + label + '</text>' +
      '<text x="' + (size.w / 2) + '" y="' + (size.h * 0.59) + '" text-anchor="middle" font-family="Consolas,monospace" font-size="18" fill="#8B958A">' + sub + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function probe(src) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = null;
      var im = new Image();
      function finish(ok) {
        if (done) return;
        done = true;
        if (timer) window.clearTimeout(timer);
        im.onload = null;
        im.onerror = null;
        resolve(ok);
      }
      timer = window.setTimeout(function () { finish(false); }, PROBE_TIMEOUT);
      im.onload = function () { finish(true); };
      im.onerror = function () { finish(false); };
      im.src = src;
    });
  }

  function resolve(base) {
    if (results.has(base)) return Promise.resolve(results.get(base));
    if (cache.has(base)) return cache.get(base);
    var p = (async function () {
      for (var i = 0; i < EXTS.length; i++) {
        var src = 'assets/' + base + '.' + EXTS[i];
        if (await probe(src)) {
          var r = { base: base, src: src, placeholder: EXTS[i] === 'svg', missing: false };
          results.set(base, r);
          return r;
        }
      }
      var fallback = { base: base, src: assetSvg(base, 'missing'), placeholder: true, missing: true };
      results.set(base, fallback);
      return fallback;
    })();
    cache.set(base, p);
    return p;
  }

  function badgeFor(img) {
    var wrap = img.closest('[data-asset-wrap]');
    return wrap ? wrap.querySelector('[data-slot-badge]') : null;
  }

  function applyResult(img, base, r, token) {
    if (!img || img.__assetToken !== token) return;
    img.dataset.assetBase = base;
    img.dataset.placeholder = r.placeholder ? '1' : '0';
    img.classList.toggle('is-placeholder', !!r.placeholder);
    img.classList.add('is-loading');
    img.onload = function () {
      if (img.__assetToken !== token) return;
      img.dataset.assetState = 'ready';
      img.classList.remove('is-loading');
    };
    img.onerror = function () {
      if (img.__assetToken !== token) return;
      img.dataset.assetState = 'missing';
      img.dataset.placeholder = '1';
      img.classList.remove('is-loading');
      img.classList.add('is-placeholder');
      img.src = assetSvg(base, 'missing');
    };
    img.src = r.src;
    var badge = badgeFor(img);
    if (badge) {
      var meta = info.get(base);
      badge.textContent = base + (meta ? ' · ' + meta.size.w + '×' + meta.size.h : '');
      badge.classList.toggle('is-placeholder', !!r.placeholder);
    }
  }

  function set(img, base) {
    if (!img) return Promise.resolve();
    var token = (img.__assetToken || 0) + 1;
    img.__assetToken = token;
    img.dataset.slot = base;

    // 已拿到的资源直接换；同一张已加载完的图不重复闪烁
    if (results.has(base)) {
      if (img.dataset.assetBase === base && img.dataset.assetState === 'ready') {
        return Promise.resolve(results.get(base));
      }
      applyResult(img, base, results.get(base), token);
      return Promise.resolve(results.get(base));
    }

    img.dataset.assetBase = base;
    img.dataset.assetState = 'loading';
    img.dataset.placeholder = '1';
    img.classList.add('is-loading');
    img.classList.remove('is-placeholder');
    img.src = assetSvg(base, 'loading');
    var badge = badgeFor(img);
    if (badge) {
      badge.textContent = 'LOADING · ' + base;
      badge.classList.remove('is-placeholder');
    }
    return resolve(base).then(function (r) {
      if (img.__assetToken === token) applyResult(img, base, r, token);
      return r;
    });
  }

  function preloadAll(onProgress) {
    if (typeof onProgress === 'function') {
      progressListeners.push(onProgress);
      onProgress(snapshot());
    }
    if (runningPromise) return runningPromise;
    progress.done = 0;
    progress.total = allBases.length;
    progress.ready = false;
    progress.missing = 0;
    runningPromise = Promise.all(allBases.map(function (base) {
      return resolve(base).then(function (r) {
        progress.done += 1;
        progress.current = base;
        if (r.missing) progress.missing += 1;
        emitProgress();
        return r;
      });
    })).then(function () {
      progress.ready = true;
      progress.current = '';
      emitProgress();
      return snapshot();
    });
    return runningPromise;
  }

  function getProgress() { return snapshot(); }
  function isReady() { return progress.ready; }
  function countSlots() { return info.size; }

  window.Asset = {
    manifest: MANIFEST,
    info: info,
    resolve: resolve,
    set: set,
    preloadAll: preloadAll,
    getProgress: getProgress,
    isReady: isReady,
    countSlots: countSlots,
    EXTS: EXTS
  };
})();
