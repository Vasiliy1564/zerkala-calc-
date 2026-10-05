/* ============================================================
   ЗЕРКАЛА ПРО — дизайн ARCO
   Интерактив + калькулятор (прайс: зеркало 1500 ₽/м², обработка
   150 ₽/пог.м, наценка 150% при подсветке)
   ============================================================ */
(function () {
  'use strict';

  var PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">' +
    '<rect width="100%" height="100%" fill="#f3f2ef"/>' +
    '<rect x="50%" y="42%" width="120" height="60" transform="translate(-60,-30)" fill="none" stroke="#c4c0b8" stroke-width="2"/>' +
    '<text x="50%" y="60%" font-family="Georgia,serif" font-size="20" letter-spacing="5" fill="#8f8d88" text-anchor="middle">ЗЕРКАЛА ПРО</text>' +
    '</svg>'
  );

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var MAX_URL = 'https://max.ru/u/f9LHodD0cOJCsHfbfog1RuUGjeMCEw_wI5D3w-uzWYe4wj6KqPXR9YOSHA8';

  /* ---------- Fallback для битых картинок ---------- */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && !t.dataset.fallback) {
      t.dataset.fallback = '1';
      t.src = PLACEHOLDER;
    }
  }, true);

  /* ---------- Год в подвале ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Мобильное меню ---------- */
  var menuButton = $('.menu-button'),
      menu = $('#site-menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $all('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Фильтры галереи ---------- */
  var filters = $all('.filter'),
      projects = $all('.project');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.dataset.filter;
      projects.forEach(function (card) {
        var categories = (card.dataset.category || '').split(/\s+/);
        card.hidden = f !== 'all' && categories.indexOf(f) === -1;
      });
    });
  });

  /* ---------- Лайтбокс ---------- */
  var lightbox = $('#lightbox');
  if (lightbox) {
    var lightboxImage = $('img', lightbox),
        lightboxCaption = $('.lightbox-caption', lightbox);
    projects.forEach(function (card) {
      card.addEventListener('click', function () {
        var image = $('img', card);
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent = card.dataset.caption || '';
        lightbox.classList.add('open');
        document.body.classList.add('no-scroll');
      });
    });
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.classList.remove('no-scroll');
    }
    $('.lightbox-close', lightbox).addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- Маска телефона ---------- */
  function maskPhone(input) {
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '').replace(/^[78]/, '');
      d = d.slice(0, 10);
      var out = '+7';
      if (d.length > 0) out += ' (' + d.slice(0, 3);
      if (d.length >= 3) out += ') ' + d.slice(3, 6);
      if (d.length >= 6) out += '-' + d.slice(6, 8);
      if (d.length >= 8) out += '-' + d.slice(8, 10);
      input.value = out;
    });
  }
  $all('input[type="tel"]').forEach(maskPhone);

  /* ---------- Форма в контактах ---------- */
  var contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#quick-name', contactForm).value.trim();
      var phone = $('#quick-phone', contactForm).value.trim();
      var city = $('#quick-city', contactForm).value.trim();
      var msg = $('#quick-message', contactForm).value.trim();
      if (!name || !phone || !city) {
        if (!name) $('#quick-name', contactForm).focus();
        else if (!phone) $('#quick-phone', contactForm).focus();
        else $('#quick-city', contactForm).focus();
        return;
      }
      var text = 'Здравствуйте! Меня зовут ' + name + '. Телефон: ' + phone + '. Город: ' + city + '.';
      if (msg) text += ' Пожелания: ' + msg;
      text += ' Хочу заказать зеркало.';
      window.open(MAX_URL + '?text=' + encodeURIComponent(text), '_blank');
      var button = $('button', contactForm);
      button.textContent = 'Спасибо, заявка открыта в MAX';
      button.disabled = true;
    });
  }

  /* ============================================================
     КАЛЬКУЛЯТОР — актуальный прайс (см. PRICE выше)
     ============================================================ */
  var state = {
    shape: 'rect',
    light: true,
    ctrl: 'wave',
    clr: 'warm',
    facet: 'none',
    film: false,
    heat: false,
    delivery: false,
    install: false
  };

  var SHAPE_NAMES = {
    rect: 'Прямоугольник',
    circle: 'Круг',
    oval: 'Овал',
    semicircle: 'Полукруг',
    double: 'Из двух частей',
    semidouble: 'Полукруг из двух частей'
  };

  var VB_W = 170, VB_H = 240, PAD = 10;
  var AVAIL_W = VB_W - PAD * 2;
  var AVAIL_H = VB_H - PAD * 2;

  var PRICE = {
    mirror: 1500,
    edge: 150,
    markup: 1.5,
    ledRoll: 700,
    ledRollLen: 5,
    block: 500,
    switch: 500,
    mount: 50,
    mountStep: 2,
    delivery: 300,
    facetDelivery: 1000
  };

  var FACET_RATES = { grind: 200, '10': 200, '20': 250, '25': 300 };

  /* Надбавка за фигурную форму к погонному метру обработки кромки */
  function shapeMeterSurcharge(shape) {
    return (shape === 'circle' || shape === 'oval' || shape === 'semicircle' || shape === 'semidouble') ? 95 : 0;
  }

  /* Доплата за высоту свыше 200 см — 1350 ₽ для всех зеркал.
     Для составных форм учитывается суммарная высота двух частей. */
  function heightSurcharge(totalH) {
    return totalH > 200 ? 1350 : 0;
  }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }

  function readState() {
    var s = $('input[name="shape"]:checked');
    if (s) state.shape = s.value;
    var l = $('input[name="light"]:checked');
    if (l) state.light = l.value === 'on';
    var c = $('input[name="ctrl"]:checked');
    if (c) state.ctrl = c.value;
    var cl = $('input[name="clr"]:checked');
    if (cl) state.clr = cl.value;
    var f = $('input[name="facet"]:checked');
    if (f) state.facet = f.value;
    function opt(v) {
      var o = $('input[name="option"][value="' + v + '"]');
      return !!(o && o.checked);
    }
    state.film = opt('film');
    state.heat = opt('heat');
    state.install = opt('install');
    state.delivery = opt('delivery');
  }

  function adj(id, delta) {
    var el = document.getElementById(id);
    if (!el) return;
    var v = parseInt(el.value, 10) || 0;
    v = Math.max(40, v + delta);
    if (id === 'width') v = Math.min(v, 3210);
    if (id === 'height' || id === 'height2') v = Math.min(v, 2250);
    el.value = v;
    if (state.shape === 'circle') {
      var hEl = document.getElementById('height');
      if (hEl) hEl.value = v;
    }
    onSizeInput();
  }

  function onSizeInput() {
    readState();
    var hEl = document.getElementById('height');
    var wEl = document.getElementById('width');
    if (!hEl || !wEl) return;
    if (state.shape === 'circle') hEl.value = wEl.value;
    var rowH2 = document.getElementById('rowH2');
    if (rowH2) rowH2.classList.toggle('hidden', state.shape !== 'double' && state.shape !== 'semidouble');
    updPreview();
  }

  function fitBox(aspect) {
    var bw, bh;
    if (aspect >= 1) {
      bw = AVAIL_W;
      bh = AVAIL_W / aspect;
      if (bh > AVAIL_H) { bh = AVAIL_H; bw = AVAIL_H * aspect; }
    } else {
      bh = AVAIL_H;
      bw = AVAIL_H * aspect;
      if (bw > AVAIL_W) { bw = AVAIL_W; bh = AVAIL_W / aspect; }
    }
    return { w: bw, h: bh };
  }

  function updPreview() {
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    if (!wEl || !hEl) return;
    var w = parseFloat(wEl.value) || 150;
    var h = parseFloat(hEl.value) || 70;

    var lblW = document.getElementById('lblW');
    var lblH = document.getElementById('lblH');

    if (state.shape === 'circle') {
      if (lblW) lblW.textContent = 'Ø ' + w + ' см';
      if (lblH) lblH.textContent = '';
    } else if (state.shape === 'double') {
      var h2 = parseFloat(document.getElementById('height2').value) || 60;
      if (lblW) lblW.textContent = w + ' см';
      if (lblH) lblH.textContent = h + ' + ' + h2 + ' см';
    } else if (state.shape === 'semidouble') {
      var h2Semi = parseFloat(document.getElementById('height2').value) || 80;
      var totalSemiH = h + h2Semi;
      if (lblW) lblW.textContent = w + ' см';
      if (lblH) lblH.textContent = h + ' + ' + h2Semi + ' = ' + totalSemiH + ' см';
    } else {
      if (lblW) lblW.textContent = w + ' см';
      if (lblH) lblH.textContent = h + ' см';
    }

    var wrap = document.getElementById('mirrorWrap');
    if (!wrap) return;
    var maxWrapW = 260, minWrapW = 100, maxWrapH = 320, minWrapH = 100;

    var aspect;
    if (state.shape === 'circle') {
      aspect = 1;
    } else if (state.shape === 'semidouble') {
      var h2Aspect = parseFloat(document.getElementById('height2').value) || 80;
      aspect = w / (h + h2Aspect);
    } else {
      aspect = w / h;
    }

    var newW, newH;
    if (aspect >= 1) {
      newW = Math.min(maxWrapW, Math.max(minWrapW, 200 * Math.min(aspect, 1.8)));
      newH = Math.min(maxWrapH, Math.max(minWrapH, newW / aspect));
    } else {
      newH = Math.min(maxWrapH, Math.max(minWrapH, 200 * Math.min(1 / aspect, 1.8)));
      newW = Math.min(maxWrapW, Math.max(minWrapW, newH * aspect));
    }

    wrap.style.width = newW + 'px';
    wrap.style.height = newH + 'px';

    renderMirrorSvg();
  }

  function renderMirrorSvg() {
    var svg = document.getElementById('mirrorSvg');
    if (!svg) return;
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    if (!wEl || !hEl) return;
    var w = parseFloat(wEl.value) || 150;
    var h = parseFloat(hEl.value) || 70;
    var shape = state.shape;
    var hasLight = state.light;
    var clr = state.clr;
    var facet = state.facet;

    var colors = { warm: '#ffd28a', cold: '#bbddff', neutral: '#ffffff' };
    var glowColor = colors[clr] || colors.neutral;
    var facetW = { none: 0, grind: 0, 10: 3, 20: 6, 25: 8 }[facet] || 0;

    var cx = VB_W / 2;
    var cy = VB_H / 2;
    var content = '';
    var splitOverlay = '';

    function logoText(bx, by, bw, bh) {
      var fs = Math.max(3.5, Math.min(6.5, bh * 0.05));
      return '<text x="' + (bx + bw - 6) + '" y="' + (by + bh - 7) + '" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="' + fs.toFixed(1) + '" font-weight="600" letter-spacing="0.12em" fill="rgba(255,255,255,0.72)" style="font-family:Arial, Helvetica, sans-serif">Mirror&nbsp;Pro</text>';
    }

    if (shape === 'rect') {
      var aspect = w / h;
      var fit = fitBox(aspect);
      var rw = fit.w, rh = fit.h;
      var rx = 10 * (rw / 150);
      var x = (VB_W - rw) / 2;
      var y = (VB_H - rh) / 2;
      content = '<rect class="mirror-glow" x="' + (x - facetW) + '" y="' + (y - facetW) + '" width="' + (rw + facetW * 2) + '" height="' + (rh + facetW * 2) + '" rx="' + (rx + facetW) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<rect class="mirror-frame" x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" rx="' + rx + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + facetW + '" />' +
        '<rect class="mirror-body" x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" rx="' + rx + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />' +
        '<rect x="' + (x + 10) + '" y="' + (y + 10) + '" width="' + (rw * 0.3) + '" height="' + (rh * 0.3) + '" rx="4" fill="url(#windowGrad)" opacity="0.6" />' +
        '<rect x="' + (x + rw * 0.55) + '" y="' + (y + 15) + '" width="' + (rw * 0.25) + '" height="' + (rh * 0.25) + '" rx="3" fill="url(#windowGrad)" opacity="0.4" />' +
        '<polygon points="' + x + ',' + y + ' ' + (x + rw) + ',' + (y + rh) + ' ' + (x + rw) + ',' + (y + rh * 0.7) + ' ' + x + ',' + y + '" fill="url(#glareGrad)" />' +
        '<rect x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" rx="' + rx + '" fill="url(#cornerGlow)" />' +
        '<rect x="' + x + '" y="' + (y + rh * 0.6) + '" width="' + rw + '" height="' + (rh * 0.4) + '" rx="' + rx + '" fill="url(#floorGrad)" />' +
        logoText(x, y, rw, rh);
    } else if (shape === 'circle') {
      var fitC = fitBox(1);
      var r = Math.min(fitC.w, fitC.h) / 2;
      content = '<circle class="mirror-glow" cx="' + cx + '" cy="' + cy + '" r="' + (r + 4 + facetW) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<circle class="mirror-frame" cx="' + cx + '" cy="' + cy + '" r="' + (r + facetW) + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + facetW + '" />' +
        '<circle class="mirror-body" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />' +
        '<circle cx="' + (cx - r * 0.2) + '" cy="' + (cy - r * 0.25) + '" r="' + (r * 0.3) + '" fill="url(#windowGrad)" opacity="0.5" />' +
        '<circle cx="' + (cx + r * 0.3) + '" cy="' + (cy - r * 0.15) + '" r="' + (r * 0.22) + '" fill="url(#windowGrad)" opacity="0.3" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="url(#glareGrad)" opacity="0.8" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="url(#cornerGlow)" />' +
        '<ellipse cx="' + cx + '" cy="' + (cy + r * 0.25) + '" rx="' + (r * 0.7) + '" ry="' + (r * 0.5) + '" fill="url(#floorGrad)" opacity="0.6" />' +
        logoText(cx - r, cy - r, r * 2, r * 2);
    } else if (shape === 'oval') {
      var fitO = fitBox(w / h);
      var rxo = fitO.w / 2;
      var ryo = fitO.h / 2;
      content = '<ellipse class="mirror-glow" cx="' + cx + '" cy="' + cy + '" rx="' + (rxo + 4 + facetW) + '" ry="' + (ryo + 4 + facetW) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<ellipse class="mirror-frame" cx="' + cx + '" cy="' + cy + '" rx="' + (rxo + facetW) + '" ry="' + (ryo + facetW) + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + facetW + '" />' +
        '<ellipse class="mirror-body" cx="' + cx + '" cy="' + cy + '" rx="' + rxo + '" ry="' + ryo + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />' +
        '<ellipse cx="' + (cx - rxo * 0.2) + '" cy="' + (cy - ryo * 0.3) + '" rx="' + (rxo * 0.35) + '" ry="' + (ryo * 0.3) + '" fill="url(#windowGrad)" opacity="0.5" />' +
        '<ellipse cx="' + (cx + rxo * 0.3) + '" cy="' + (cy - ryo * 0.15) + '" rx="' + (rxo * 0.25) + '" ry="' + (ryo * 0.22) + '" fill="url(#windowGrad)" opacity="0.3" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rxo + '" ry="' + ryo + '" fill="url(#glareGrad)" opacity="0.8" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rxo + '" ry="' + ryo + '" fill="url(#cornerGlow)" />' +
        '<ellipse cx="' + cx + '" cy="' + (cy + ryo * 0.35) + '" rx="' + (rxo * 0.7) + '" ry="' + (ryo * 0.5) + '" fill="url(#floorGrad)" opacity="0.6" />' +
        logoText(cx - rxo, cy - ryo, rxo * 2, ryo * 2);
    } else if (shape === 'semicircle') {
      var fitS = fitBox(w / h);
      var boxW = fitS.w;
      var boxH = fitS.h;
      var boxX = (VB_W - boxW) / 2;
      var boxY = (VB_H - boxH) / 2;
      var rr = boxH / 2;
      var rectW = boxW - rr;
      if (rectW < 0) {
        rr = boxW;
        boxH = 2 * rr;
        boxY = (VB_H - boxH) / 2;
        rectW = 0;
      }
      var pathMain = 'M ' + (boxX + rr) + ' ' + boxY + ' A ' + rr + ' ' + rr + ' 0 0 0 ' + boxX + ' ' + (boxY + rr) + ' A ' + rr + ' ' + rr + ' 0 0 0 ' + (boxX + rr) + ' ' + (boxY + boxH) + ' L ' + (boxX + boxW) + ' ' + (boxY + boxH) + ' L ' + (boxX + boxW) + ' ' + boxY + ' Z';
      var pathGlow = 'M ' + (boxX + rr) + ' ' + (boxY - facetW) + ' A ' + (rr + facetW) + ' ' + (rr + facetW) + ' 0 0 0 ' + (boxX - facetW) + ' ' + (boxY + rr) + ' A ' + (rr + facetW) + ' ' + (rr + facetW) + ' 0 0 0 ' + (boxX + rr) + ' ' + (boxY + boxH + facetW) + ' L ' + (boxX + boxW + facetW) + ' ' + (boxY + boxH + facetW) + ' L ' + (boxX + boxW + facetW) + ' ' + (boxY - facetW) + ' Z';
      content = '<path class="mirror-glow" d="' + pathGlow + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<path class="mirror-frame" d="' + pathMain + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + facetW + '" />' +
        '<path class="mirror-body" d="' + pathMain + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />' +
        '<ellipse cx="' + (boxX + boxW - rectW * 0.5) + '" cy="' + (boxY + boxH * 0.3) + '" rx="' + Math.max(1, rectW * 0.3) + '" ry="' + (boxH * 0.22) + '" fill="url(#windowGrad)" opacity="0.5" />' +
        '<ellipse cx="' + (boxX + boxW - rectW * 0.2) + '" cy="' + (boxY + boxH * 0.55) + '" rx="' + Math.max(1, rectW * 0.15) + '" ry="' + (boxH * 0.18) + '" fill="url(#windowGrad)" opacity="0.3" />' +
        '<path d="M ' + boxX + ' ' + boxY + ' L ' + (boxX + boxW) + ' ' + (boxY + boxH) + ' L ' + (boxX + boxW) + ' ' + (boxY + boxH * 0.6) + ' L ' + boxX + ' ' + boxY + ' Z" fill="url(#glareGrad)" opacity="0.8" />' +
        '<path d="' + pathMain + '" fill="url(#cornerGlow)" />' +
        '<path d="M ' + (boxX + rr) + ' ' + (boxY + boxH * 0.6) + ' L ' + (boxX + rr) + ' ' + (boxY + boxH) + ' A ' + rr + ' ' + rr + ' 0 0 0 ' + boxX + ' ' + (boxY + rr) + ' A ' + rr + ' ' + rr + ' 0 0 0 ' + (boxX + rr * 0.5) + ' ' + (boxY + boxH * 0.75) + ' Z" fill="url(#floorGrad)" opacity="0.5" />' +
        '<rect x="' + (boxX + rr) + '" y="' + (boxY + boxH * 0.6) + '" width="' + Math.max(0, rectW) + '" height="' + (boxH * 0.4) + '" fill="url(#floorGrad)" opacity="0.5" />' +
        logoText(boxX, boxY, boxW, boxH);
    } else if (shape === 'semidouble') {
      /* Один цельный полукруг, разделённый горизонтальным монтажным стыком.
         Подсветка проходит только по внешнему контуру всей композиции. */
      var h2SD = parseFloat(document.getElementById('height2').value) || 80;
      var totalHSD = h + h2SD;
      var fitSD = fitBox(w / totalHSD);
      var bwSD = fitSD.w;
      var bhSD = fitSD.h;
      var xSD = (VB_W - bwSD) / 2;
      var ySD = (VB_H - bhSD) / 2;
      var rightSD = xSD + bwSD;
      var bottomSD = ySD + bhSD;
      var splitYSD = ySD + bhSD * (h / totalHSD);
      var ellipseCenterYSD = ySD + bhSD / 2;
      var normalizedYSD = (splitYSD - ellipseCenterYSD) / (bhSD / 2);
      var splitLeftXSD = rightSD - bwSD * Math.sqrt(Math.max(0, 1 - normalizedYSD * normalizedYSD));
      // Половина эллипса: дуга слева, ровная вертикальная грань справа.
      var pathSD = 'M ' + rightSD + ' ' + ySD +
        ' A ' + bwSD + ' ' + (bhSD / 2) + ' 0 0 0 ' + rightSD + ' ' + bottomSD +
        ' L ' + rightSD + ' ' + ySD + ' Z';
      content = '<path class="mirror-body" d="' + pathSD + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />';
      splitOverlay = '<line class="mirror-split-gap" x1="' + splitLeftXSD + '" y1="' + splitYSD + '" x2="' + rightSD + '" y2="' + splitYSD + '" stroke="#eeeae2" stroke-width="3.2" />' +
        '<line class="mirror-split-edge" x1="' + splitLeftXSD + '" y1="' + splitYSD + '" x2="' + rightSD + '" y2="' + splitYSD + '" stroke="#68736d" stroke-width="0.75" opacity="0.9" />';
    } else if (shape === 'double') {
      var h2v = parseFloat(document.getElementById('height2').value) || 60;
      var totalH = parseFloat(h) + parseFloat(h2v);
      var aspectD = parseFloat(w) / totalH;
      var bw, bh;
      if (aspectD >= 1) {
        bw = AVAIL_W; bh = AVAIL_W / aspectD;
        if (bh > AVAIL_H) { bh = AVAIL_H; bw = AVAIL_H * aspectD; }
      } else {
        bh = AVAIL_H; bw = AVAIL_H * aspectD;
        if (bw > AVAIL_W) { bw = AVAIL_W; bh = AVAIL_W / aspectD; }
      }
      var boxXD = (VB_W - bw) / 2;
      var boxYD = (VB_H - bh) / 2;
      var ratio = h / totalH;
      var topH = bh * ratio;
      var botH = bh - topH;
      var gap = 4;
      var topY = boxYD;
      var botY = boxYD + topH + gap;
      content = '';
      if (hasLight) {
        content += '<rect x="' + (boxXD - 8) + '" y="' + (topY - 8) + '" width="' + (bw + 16) + '" height="' + (topH + 8) + '" rx="9" fill="none" stroke="' + glowColor + '" stroke-width="6" opacity="0.8" filter="url(#ledGlow)" />';
        content += '<rect x="' + (boxXD - 8) + '" y="' + (botY - 8) + '" width="' + (bw + 16) + '" height="' + (botH + 8) + '" rx="9" fill="none" stroke="' + glowColor + '" stroke-width="6" opacity="0.8" filter="url(#ledGlow)" />';
      }
      content += '<rect x="' + boxXD + '" y="' + topY + '" width="' + bw + '" height="' + topH + '" rx="4" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />';
      content += '<rect x="' + boxXD + '" y="' + botY + '" width="' + bw + '" height="' + botH + '" rx="4" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />';
      content += logoText(boxXD, botY, bw, botH);
    }

    var defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);
    // Keep the calculated outlines, replacing decorative shapes with a shared
    // photographic reflection. Split mirrors reflect the same continuous room.
    var draft = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    draft.innerHTML = content;
    var bodies = draft.querySelectorAll('[fill="url(#glassGrad)"]');
    var clipShapes = '';
    var edges = '';
    var halos = '';
    bodies.forEach(function (body) {
      var outline = body.cloneNode(true);
      outline.removeAttribute('class');
      outline.removeAttribute('fill');
      outline.removeAttribute('stroke');
      outline.removeAttribute('stroke-width');
      clipShapes += outline.outerHTML;
      outline.setAttribute('fill', 'none');
      if (hasLight) {
        outline.setAttribute('stroke', glowColor);
        outline.setAttribute('stroke-width', '8');
        outline.setAttribute('filter', 'url(#realMirrorHalo)');
        halos += outline.outerHTML;
        outline.removeAttribute('filter');
      }
      outline.setAttribute('stroke', '#707a74');
      outline.setAttribute('stroke-width', '1.2');
      edges += outline.outerHTML;
      outline.setAttribute('stroke', '#edf0e9');
      outline.setAttribute('stroke-width', '0.45');
      edges += outline.outerHTML;
      if (facetW) {
        outline.setAttribute('stroke', '#f5f6ef');
        outline.setAttribute('stroke-width', String(facetW));
        outline.setAttribute('opacity', '0.35');
        outline.setAttribute('clip-path', 'url(#realMirrorClip)');
        edges += outline.outerHTML;
      }
      if (hasLight) {
        // A crisp LED band remains visible over the reflection; its halo alone
        // is insufficient on a pale wall. Both follow the selected temperature.
        outline.removeAttribute('opacity');
        outline.setAttribute('clip-path', 'url(#realMirrorClip)');
        outline.setAttribute('stroke', glowColor);
        outline.setAttribute('stroke-width', '4');
        outline.setAttribute('class', 'mirror-led-band');
        edges += outline.outerHTML;
      }
    });
    svg.insertAdjacentHTML('beforeend',
      '<defs><clipPath id="realMirrorClip">' + clipShapes + '</clipPath>' +
      '<filter id="realMirrorHalo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<linearGradient id="realMirrorSheen" x2="1" y2="1"><stop stop-color="#f5fbff" stop-opacity=".22"/><stop offset=".38" stop-color="#fff" stop-opacity=".03"/><stop offset=".52" stop-color="#fff" stop-opacity=".13"/><stop offset=".68" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#78958a" stop-opacity=".16"/></linearGradient></defs>' +
      halos + '<g clip-path="url(#realMirrorClip)">' +
      '<rect width="170" height="240" fill="#d7dbd3"/>' +
      '<image href="assets/mirror-reflection.png" width="170" height="240" preserveAspectRatio="xMidYMid slice" opacity=".88"/>' +
      '<rect width="170" height="240" fill="url(#realMirrorSheen)"/></g>' + edges + splitOverlay);
  }

  function pickShape(shape) {
    state.shape = shape;
    var fieldH = document.getElementById('fieldH');
    var labelW = document.getElementById('labelW');
    var labelH = document.getElementById('labelH');
    var inputW = document.getElementById('width');
    var inputH = document.getElementById('height');

    inputH.disabled = false;
    inputH.style.opacity = '1';

    if (shape === 'circle') {
      fieldH.classList.add('hidden');
      labelW.textContent = 'Диаметр, см';
      inputW.value = 90;
      inputH.value = 90;
    } else if (shape === 'double') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, см';
      labelH.textContent = 'Высота верхней, см';
      inputW.value = 80;
      inputH.value = 160;
      document.getElementById('height2').value = 60;
    } else if (shape === 'semidouble') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, см';
      labelH.textContent = 'Высота верхней части, см';
      inputW.value = 80;
      inputH.value = 100;
      document.getElementById('height2').value = 80;
    } else {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, см';
      labelH.textContent = 'Высота, см';
      inputW.value = 80;
      inputH.value = 180;
    }

    onSizeInput();
    updPreview();
  }

  function setLight(on) {
    state.light = on;
    var wrap = document.getElementById('mirrorWrap');
    if (wrap) wrap.classList.toggle('has-light', on);
    renderMirrorSvg();

    var blockLight = document.getElementById('blockLight');
    var blockColor = document.getElementById('blockColor');
    if (blockLight) blockLight.classList.toggle('hidden', !on);
    if (blockColor) blockColor.classList.toggle('hidden', !on);
    updateFilmAvailability();
  }

  function updateFilmAvailability() {
    var filmOpt = document.getElementById('filmOpt');
    var filmCb = $('input[name="option"][value="film"]');
    var installCb = $('input[name="option"][value="install"]');
    var installInfo = document.getElementById('installInfo');
    var canFilm = installCb && installCb.checked;
    if (filmOpt) filmOpt.classList.toggle('hidden', !canFilm);
    if (filmCb && !canFilm) {
      filmCb.checked = false;
      state.film = false;
    }
    if (installInfo) installInfo.classList.toggle('hidden', !(installCb && installCb.checked));
  }

  function onFacetChange() {
    readState();
    var info = document.getElementById('edgeInfo');
    if (info) {
      if (state.facet === 'none') {
        info.textContent = 'Обработка кромки от пореза включена';
        info.classList.remove('gold');
      } else if (state.facet === 'grind') {
        info.textContent = 'Шлифовка';
        info.classList.remove('gold');
      } else {
        info.textContent = 'Фацет ' + state.facet + ' мм';
        info.classList.add('gold');
      }
    }
    renderMirrorSvg();
  }

  function calcGeometry() {
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = parseFloat(wEl.value) || 0;
    var h = parseFloat(hEl.value) || 0;
    var shape = state.shape;

    var area, per, maxD;
    var edgePer;
    var ledPer;

    if (shape === 'rect') {
      area = (w * h) / 10000;
      per = 2 * (w + h) / 100;
      maxD = Math.max(w, h);
    } else if (shape === 'circle') {
      /* Круг вырезается из квадрата: S = d×d, P = 4d */
      var d = w;
      area = (d * d) / 10000;
      per = (4 * d) / 100;
      maxD = d;
    } else if (shape === 'oval') {
      /* Овал вырезается из прямоугольника: S = w×h, P = 2(w+h) */
      area = (w * h) / 10000;
      per = (2 * (w + h)) / 100;
      maxD = Math.max(w, h);
    } else if (shape === 'semicircle') {
      /* Полукруг вырезается из прямоугольника: S = w×h, P = 2(w+h) */
      area = (w * h) / 10000;
      per = (2 * (w + h)) / 100;
      maxD = Math.max(w, h);
    } else if (shape === 'double') {
      var h2v = parseFloat(document.getElementById('height2').value) || 0;
      area = (w * h + w * h2v) / 10000;
      per = (2 * (w + h) + 2 * (w + h2v)) / 100;
      maxD = Math.max(w, h, h2v);
    } else if (shape === 'semidouble') {
      /* Базовая стоимость совпадает с обычным полукругом тех же общих
         габаритов. Надбавка 20% за изготовление из двух частей применяется
         к окончательной цене ниже. */
      var h2SemiCalc = parseFloat(document.getElementById('height2').value) || 80;
      var totalSemiCalc = h + h2SemiCalc;
      area = (w * totalSemiCalc) / 10000;
      per = (2 * (w + totalSemiCalc)) / 100;
      maxD = Math.max(w, totalSemiCalc);
    }

    return {
      area: area,
      per: per,
      edgePer: edgePer || per,
      ledPer: ledPer || per,
      maxD: maxD
    };
  }

  function calc() {
    readState();
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = parseFloat(wEl.value) || 0;
    var h = parseFloat(hEl.value) || 0;

    if (w < 40 || (state.shape !== 'circle' && h < 40)) { alert('Минимальный размер — 40 см'); return; }
    if ((state.shape === 'double' || state.shape === 'semidouble') && (parseFloat(document.getElementById('height2').value) || 0) < 40) {
      alert('Минимальная высота каждой части — 40 см');
      return;
    }

    var geo = calcGeometry();
    var area = geo.area;
    var per = geo.per;
    var edgePer = geo.edgePer;
    var ledPer = geo.ledPer;
    // База для двух частей — цельный прямоугольник тех же общих размеров.
    if (state.shape === 'double') {
      var combinedHeight = h + (parseFloat(document.getElementById('height2').value) || 0);
      area = w * combinedHeight / 10000;
      per = 2 * (w + combinedHeight) / 100;
      edgePer = per;
      ledPer = per;
    }

    var price;

    if (!state.light) {
      /* Зеркало БЕЗ подсветки:
         без фацета — (S×1500 + P×150) × 1,8
         с фацетом — (S×1500 + P×фацет) × 1,8 + 1000 (доставка) */
      var meterExtra = shapeMeterSurcharge(state.shape);
      var basePlain = area * PRICE.mirror + edgePer * (PRICE.edge + meterExtra);
      if (state.facet === 'none' || state.facet === 'grind') {
        if (state.facet === 'grind') basePlain = area * PRICE.mirror + edgePer * (FACET_RATES.grind + meterExtra);
        price = basePlain * 1.8;
      } else {
        var facetRate = FACET_RATES[state.facet] || 0;
        price = (area * PRICE.mirror + edgePer * (facetRate + meterExtra)) * 1.8 + PRICE.facetDelivery;
      }
      if (state.install) {
        price += (area <= 2) ? Math.max(2000, area * 1300) : area * 1500;
      }
    } else {
      /* Зеркало С ПОДСВЕТКОЙ — единый расчёт для фацета и без него.
         При выборе фацета ставка обработки кромки заменяется ставкой
         фацета (200/250/300 ₽/пог.м), а доставка растёт до 1000 ₽.
         LED-комплектация (лента, блок, сенсор, крепёж) считается всегда. */

      var meterExtraLight = shapeMeterSurcharge(state.shape);
      var facetRateLight = (state.facet === 'none')
        ? PRICE.edge
        : (FACET_RATES[state.facet] || 0);

      /* Себестоимость зеркала */
      var costMirrorLight = area * PRICE.mirror;

      /* Обработка кромки: шлифовка или фацет */
      var costEdgeLight = edgePer * (facetRateLight + meterExtraLight);

      var baseCostLight = costMirrorLight + costEdgeLight;

      /* Наценка 150% на зеркало + обработку */
      var markupLight = baseCostLight * PRICE.markup;

      /* Дополнительные расходы — без наценки */
      var ledRollsLight = Math.ceil(ledPer / PRICE.ledRollLen);
      var costLEDLight = ledRollsLight * PRICE.ledRoll;
      var mountsLight = Math.ceil(ledPer / PRICE.mountStep);
      var costMountsLight = mountsLight * PRICE.mount;
      var costBlockLight = PRICE.block;
      var costSwitchLight = PRICE.switch;
      var costDeliveryLight = (state.facet === 'none' || state.facet === 'grind') ? PRICE.delivery : PRICE.facetDelivery;

      var costInstallLight = 0;
      if (state.install) {
        var instBaseLight = (area <= 2) ? Math.max(2000, area * 1300) : area * 1500;
        costInstallLight = Math.max(2500, instBaseLight + 500);
      }

      var extrasLight = costLEDLight + costBlockLight + costSwitchLight
        + costMountsLight + costDeliveryLight + costInstallLight;

      price = baseCostLight + markupLight + extrasLight;
    }

    /* Для составных форм доплата определяется по общей высоте двух частей. */
    var totalH = h;
    if (state.shape === 'double' || state.shape === 'semidouble') {
      totalH += parseFloat(document.getElementById('height2').value) || 0;
    }
    price += heightSurcharge(totalH);

    /* Бронеплёнка: 120 ₽/м² по площади прямоугольника */
    if (state.film) {
      price += geo.area * 120;
    }
    /* Подогрев: фиксированная доплата */
    if (state.heat) {
      price += 2500;
    }

    /* Налог +6% — применяется последним, ко всем расчётам */
    price *= 1.06;
    // Процент к цене цельного зеркала тех же размеров и комплектации.
    // Контроль: 270×70 с LED без опций = 16469.75 ₽ до округления;
    // 200×70 + 70×70 дороже на 2000 ₽. Для других размеров процент тот же.
    if (state.shape === 'double') {
      price *= 1 + 2000 / 16469.75;
    }
    /* Полукруг из двух частей всегда на 20% дороже цельного полукруга
       тех же общих размеров и в той же комплектации. */
    if (state.shape === 'semidouble') {
      price *= 1.2;
    }

    /* Дополнительные 2% ко всем итоговым расчётам, до округления. */
    price *= 1.02;

    /* Доставка клиенту по Ставрополю: фиксированные 700 ₽. */
    if (state.delivery) price += 700;

    var sizeText = '';
    if (state.shape === 'circle') {
      sizeText = 'Ø ' + w + ' см · ' + SHAPE_NAMES[state.shape];
    } else if (state.shape === 'double' || state.shape === 'semidouble') {
      var h2r = parseFloat(document.getElementById('height2').value) || 0;
      sizeText = h + '+' + h2r + ' × ' + w + ' см · ' + SHAPE_NAMES[state.shape];
    } else {
      sizeText = h + ' × ' + w + ' см · ' + SHAPE_NAMES[state.shape];
    }
    /* ---------- Клиентский результат ----------
       Показываем только размер, форму, подсветку и опции.
       Себестоимость, наценка, комплектующие, доставка,
       доплаты и прибыль — только во внутреннем расчёте выше. */
    var CLR_LABELS = { warm: 'тёплый', cold: 'холодный', neutral: 'нейтральный' };
    var CTRL_LABELS = { wave: 'взмах рукой', touch: 'сенсор на зеркале', remote: 'пульт ДУ', smart: 'Wi-Fi / умный дом' };
    var FACET_LABELS = { none: 'без фацета', grind: 'шлифовка', '10': 'фацет 10 мм', '20': 'фацет 20 мм', '25': 'фацет 25 мм' };

    document.getElementById('r-size').textContent = sizeText;

    document.getElementById('r-sum').textContent = fmt(price) + ' ₽';

    function row(label, value) {
      return '<div class="row"><span>' + label + '</span><i class="dash"></i><span>' + value + '</span></div>';
    }

    var inc = '';
    if (state.light) {
      inc += row('Подсветка', 'LED COB, ' + CLR_LABELS[state.clr] + ' свет');
      inc += row('Управление', CTRL_LABELS[state.ctrl]);
    } else {
      inc += row('Подсветка', 'нет');
    }
    inc += row('Кромка', state.facet === 'none' ? 'обработка от порезов' : FACET_LABELS[state.facet]);
    if (state.install) {
      inc += row('Установка', state.film ? 'на крепёж, с бронеплёнкой' : 'на крепёж');
    }
    if (state.film) {
      inc += row('Бронеплёнка', geo.area.toFixed(2) + ' м² × 120 ₽');
    }
    if (state.heat) {
      inc += row('Подогрев 40×60 см', 'да');
    }

    inc += row('Доставка', state.delivery ? 'по городу Ставрополю — 700 ₽' : 'не выбрана');
    document.getElementById('r-inc').innerHTML = inc;

    var details = [];
    if (state.light) {
      details.push('с LED-подсветкой (' + CLR_LABELS[state.clr] + ', управление: ' + CTRL_LABELS[state.ctrl] + ')');
    } else {
      details.push('без подсветки');
    }
    if (state.facet !== 'none') details.push(FACET_LABELS[state.facet]);
    if (state.install) details.push('с установкой');
    if (state.delivery) details.push('с доставкой по городу Ставрополю за 700 ₽');

    var ctaText = '';
    if (state.shape === 'double') {
      var h2c = parseFloat(document.getElementById('height2').value) || 0;
      ctaText = 'Здравствуйте! Хочу заказать зеркало из двух частей ' + h + '+' + h2c + '×' + w + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    } else if (state.shape === 'semidouble') {
      var h2SemiCta = parseFloat(document.getElementById('height2').value) || 0;
      ctaText = 'Здравствуйте! Хочу заказать полукруг из двух частей ' + h + '+' + h2SemiCta + '×' + w + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    } else {
      ctaText = 'Здравствуйте! Хочу заказать ' + SHAPE_NAMES[state.shape].toLowerCase() + ' зеркало ' + (state.shape === 'circle' ? 'Ø' + w : h + '×' + w) + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    }
    document.getElementById('r-cta').href = MAX_URL + '?text=' + encodeURIComponent(ctaText);

    var res = document.getElementById('calc-result');
    res.classList.add('show');
    res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- События калькулятора ---------- */
  $all('input[name="shape"]').forEach(function (r) {
    r.addEventListener('change', function () { pickShape(r.value); });
  });
  $all('input[name="light"]').forEach(function (r) {
    r.addEventListener('change', function () { setLight(r.value === 'on'); });
  });
  $all('input[name="clr"]').forEach(function (r) {
    r.addEventListener('change', function () { readState(); renderMirrorSvg(); });
    r.addEventListener('click', function () {
      var preview = document.querySelector('.calculator .calc-preview');
      if (preview) preview.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center'
      });
    });
  });
  $all('input[name="facet"]').forEach(function (r) {
    r.addEventListener('change', onFacetChange);
  });
  $all('input[name="option"][value="install"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState();
      updateFilmAvailability();
      /* Мгновенный пересчёт итоговой цены, если результат уже показан */
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc();
    });
  });
  $all('input[name="option"][value="film"], input[name="option"][value="heat"], input[name="option"][value="delivery"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState();
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc();
    });
  });
  $all('.stepper-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      adj(b.dataset.adj, parseInt(b.dataset.delta, 10));
    });
  });
  var sizeInputs = ['width', 'height', 'height2'];
  sizeInputs.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', onSizeInput);
  });

  var quoteForm = $('#quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      calc();
    });
  }

  /* ---------- Инициализация превью ---------- */
  if (document.getElementById('mirrorSvg')) {
    setTimeout(renderMirrorSvg, 100);
    updPreview();
    onSizeInput();
  }
})();
