/* ============================================================
   拯救英伟达 · 原型 v0.1 — 美术素材加载器
   - 读取 assets/manifest.js（无需 fetch，file:// 可直接打开）
   - 同名文件按 webp → png → jpg → jpeg → svg 依次解析
   - 自动识别占位（svg）并给槽位打标
   ============================================================ */
(function () {
  'use strict';

  var MANIFEST = window.ART_SLOTS;
  if (!MANIFEST) { console.warn('ART_SLOTS manifest 未加载'); return; }

  var EXTS = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
  var SIZE = {
    characters: { w: 1200, h: 840, safe: 80 },
    scenes: { w: 1600, h: 900, safe: 80 },
    evidence: { w: 1200, h: 800, safe: 60 },
    news: { w: 800, h: 600, safe: 40 }
  };

  var cache = new Map();       // base -> Promise<{src, placeholder}>
  var info = new Map();        // base -> slot info

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

  function probe(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(true); };
      im.onerror = function () { resolve(false); };
      im.src = src;
    });
  }

  function fallbackSvg(base) {
    var label = base.split('/').pop();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="840" viewBox="0 0 1200 840">' +
      '<rect width="1200" height="840" fill="#20261F"/>' +
      '<rect x="24" y="24" width="1152" height="792" fill="none" stroke="#A6E04C" stroke-width="3" stroke-dasharray="14 12"/>' +
      '<text x="600" y="380" text-anchor="middle" font-family="Consolas,monospace" font-size="52" fill="#A6E04C">MISSING ASSET</text>' +
      '<text x="600" y="450" text-anchor="middle" font-family="Consolas,monospace" font-size="30" fill="#F2ECDF">' + label + '</text>' +
      '<text x="600" y="500" text-anchor="middle" font-family="Consolas,monospace" font-size="22" fill="#8B958A">assets/' + base + '.png</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function resolve(base) {
    if (cache.has(base)) return cache.get(base);
    var p = (async function () {
      for (var i = 0; i < EXTS.length; i++) {
        var src = 'assets/' + base + '.' + EXTS[i];
        if (await probe(src)) return { base: base, src: src, placeholder: EXTS[i] === 'svg' };
      }
      return { base: base, src: fallbackSvg(base), placeholder: true, missing: true };
    })();
    cache.set(base, p);
    return p;
  }

  function badgeFor(img) {
    var wrap = img.closest('[data-asset-wrap]');
    return wrap ? wrap.querySelector('[data-slot-badge]') : null;
  }

  function set(img, base) {
    if (!img) return Promise.resolve();
    img.dataset.slot = base;
    return resolve(base).then(function (r) {
      img.src = r.src;
      img.dataset.placeholder = r.placeholder ? '1' : '0';
      img.classList.toggle('is-placeholder', !!r.placeholder);
      var badge = badgeFor(img);
      if (badge) {
        var meta = info.get(base);
        badge.textContent = base + (meta ? ' · ' + meta.size.w + '×' + meta.size.h : '');
        badge.classList.toggle('is-placeholder', !!r.placeholder);
      }
    });
  }

  function preloadAll() {
    var list = [];
    MANIFEST.characters.forEach(function (c) {
      c.states.forEach(function (s) { list.push(s.file); });
    });
    MANIFEST.misc.forEach(function (m) { list.push(m.file); });
    return Promise.all(list.map(resolve));
  }

  function countSlots() { return info.size; }

  window.Asset = {
    manifest: MANIFEST,
    info: info,
    resolve: resolve,
    set: set,
    preloadAll: preloadAll,
    countSlots: countSlots,
    EXTS: EXTS
  };
})();
