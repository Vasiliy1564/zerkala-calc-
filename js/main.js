(function () {
  'use strict';
  var files = {black:'black-frame-full-height.jpg',white:'bathroom-white-frame.jpg',gold:'gold-frame-portrait.jpg'};
  var names = {black:'чёрной',white:'белой',gold:'золотой'};
  var box, returnTarget, returnButton;
  function move(target) {
    requestAnimationFrame(function () {
      target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });
  }
  function hideReturn() { if (returnButton) returnButton.hidden = true; }
  function placeReturn() {
    if (!returnButton) return;
    var bar = document.querySelector('.action-bar');
    var height = bar ? bar.getBoundingClientRect().height : 0;
    returnButton.style.bottom = 'calc(' + (height + 12) + 'px + env(safe-area-inset-bottom, 0px))';
  }
  window.showPreviewReturn = function (origin) {
    if (document.body.classList.contains('personal-mode')) return;
    returnTarget = origin;
    if (!returnButton) {
      returnButton = document.createElement('button');
      returnButton.id = 'example-return'; returnButton.type = 'button';
      returnButton.textContent = '← Вернуться к калькулятору';
      returnButton.style.cssText = 'position:fixed;z-index:110;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:15px 20px;border:1px solid #fff;border-radius:10px;background:#173d34;color:#fff;box-shadow:0 4px 18px #0003;font:600 16px/1.3 sans-serif;cursor:pointer';
      returnButton.onclick = function () {
        hideReturn(); if (box) box.hidden = true;
        var viewer = document.getElementById('lightbox');
        if (viewer) viewer.classList.remove('open');
        document.body.classList.remove('no-scroll');
        var target = document.getElementById('quote-form') || (returnTarget && returnTarget.closest('.field'));
        if (returnTarget) returnTarget.focus({preventScroll:true});
        if (target) move(target);
      };
      document.body.appendChild(returnButton);
    }
    returnButton.hidden = false; placeReturn();
  };
  window.addEventListener('resize', placeReturn);
  document.addEventListener('click', function (event) {
    if (event.target.closest('a[href="#quote-form"],a[href="#calculator"]')) {
      hideReturn(); if (box) box.hidden = true;
    }
  });
  window.hideFrameExample = function () { if (box) box.hidden = true; hideReturn(); };
  window.showFrameExample = function (color, origin) {
    if (!files[color] || document.body.classList.contains('personal-mode')) return;
    if (!box) {
      box = document.createElement('section');
      box.id = 'frame-example'; box.hidden = true; box.tabIndex = -1;
      box.style.cssText = 'max-width:760px;margin:24px auto;padding:20px 20px 110px;scroll-margin-top:90px;text-align:center';
      box.innerHTML = '<h2 style="margin:0 0 20px;font-size:clamp(24px,5vw,36px);line-height:1.2"></h2><div class="frame-photo-pair"></div><p>Примеры исполнения. Варианты с подсветкой — визуализации на основе фотографий. Форма и размеры зависят от вашей комплектации.</p>';
      var gallery = document.querySelector('.project-grid') || document.querySelector('.projects-grid');
      var anchor = gallery ? gallery.closest('section') : document.getElementById('calculator');
      anchor.parentNode.insertBefore(box, anchor);
    }
    var light = document.querySelector('input[name="light"]:checked');
    var isLit = !light || light.value === 'on';
    var base = document.getElementById('faceFrame') ? '../assets/projects/' : 'assets/projects/';
    var pair = box.querySelector('.frame-photo-pair');
    pair.replaceChildren();
    [isLit, !isLit].forEach(function (lit) {
      var figure = document.createElement('figure'); figure.style.cssText = 'margin:0 0 24px';
      var photo = document.createElement('img');
      photo.src = base + (lit ? color + '-frame-led-20261015.webp' : files[color]);
      photo.alt = 'Зеркало в ' + names[color] + ' раме ' + (lit ? 'с подсветкой' : 'без подсветки');
      photo.style.cssText = 'display:block;max-width:100%;width:auto;height:auto;max-height:52svh;margin:0 auto;object-fit:contain';
      var caption = document.createElement('figcaption'); caption.textContent = lit ? 'С подсветкой · визуализация' : 'Без подсветки';
      caption.style.cssText = 'padding:10px;font-size:17px;font-weight:600';
      figure.append(photo,caption); pair.appendChild(figure);
    });
    box.querySelector('h2').textContent = 'Зеркало в ' + names[color] + ' раме';
    box.hidden = false; window.showPreviewReturn(origin); move(box);
  };
})();

/* ============================================================
   ЗЕРКАЛА ПРО — дизайн ARCO
   Интерактив + калькулятор СПб: прайс от 12.10.2026.
   Наценка только на полотно и обработку: 100% / 150% с LED.
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
        window.showPreviewReturn(card);
        var image = $('img', card);
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt;
        lightboxCaption.textContent = card.dataset.caption || '';
        lightbox.classList.add('open');
        document.body.classList.add('no-scroll');
      });
    });
    function closeLightbox() {
      window.hideFrameExample();
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
    material: 'silver',
    light: true,
    ctrl: 'wave',
    clr: 'warm',
    edge: 'polish',
    film: false,
    heat: false,
    delivery: false,
    faceFrame: 'none',
    aluFrame: false,
    ledProfile: false,
    install: false
  };

  var FACE_FRAME_LABELS = { white: 'белая', black: 'чёрная', gold: 'золотая' };
  var FACE_FRAME_PRICES = {white:396, black:373, gold:315};
  var FACE_FRAME_DELIVERY = {white:600, black:600, gold:990};
  function faceFramePerimeter(shape, w, h, h2) {
  var totalH = h + (shape.indexOf('double') !== -1 ? h2 : 0);
  if (shape === 'circle') return Math.PI * w / 1000;
  if (shape === 'capsule') {
    var shortSide = Math.min(w, h), longSide = Math.max(w, h);
    return (Math.PI * shortSide + 2 * (longSide - shortSide)) / 1000;
  }
  if (shape === 'oval') {
    var a = w / 2, b = h / 2, q = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    return Math.PI * (a + b) * (1 + 3 * q / (10 + Math.sqrt(4 - 3 * q))) / 1000;
  }
  if (shape === 'semicircle' || shape === 'semidouble') {
    var r = totalH / 2;
    var perimeter = Math.PI * r + totalH;
    if (shape === 'semidouble') perimeter += 2 * (r + Math.sqrt(Math.max(0, r * r - Math.pow(h - r, 2))));
    return perimeter / 1000;
  }
  return 2 * (w + totalH + (shape === 'double' ? w : 0)) / 1000;
}

  function faceFrameStock(shape, w, h, h2) {
  var barLength = 2700, billedLength = 2.7, bars;
  if (shape === 'rect' || shape === 'double') {
    var sides = shape === 'double' ? [w,w,h,h,w,w,h2,h2] : [w,w,h,h];
    var pieces = [];
    sides.forEach(function (side) {
      while (side > barLength) { pieces.push(barLength); side -= barLength; }
      if (side > 0) pieces.push(side);
    });
    pieces.sort(function (a,b) { return b-a; });
    var best = pieces.length, bins = [];
    function pack(i) {
      if (i === pieces.length) { best = Math.min(best,bins.length); return; }
      if (bins.length >= best) return;
      var seen = {};
      for (var j=0;j<bins.length;j++) {
        if (seen[bins[j]] || bins[j]+pieces[i]>barLength) continue;
        seen[bins[j]]=true; bins[j]+=pieces[i]; pack(i+1); bins[j]-=pieces[i];
      }
      bins.push(pieces[i]); pack(i+1); bins.pop();
    }
    pack(0); bars=best;
  } else {
    bars = Math.ceil((faceFramePerimeter(shape,w,h,h2)*1000-0.000001)/barLength);
  }
  return { bars:bars, metres:bars*billedLength };
}

  var SHAPE_NAMES = {
    rect: 'Прямоугольник',
    rounded: 'Прямоугольник с закруглёнными углами',
    curved: 'Фигурное — волна',
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
    mirror: 1750,
    specialMirror: 4950,
    packaging: 100,
    plainMarkup: 1.00,
    markup: 1.50,
    ledRoll: 700,
    ledRollLen: 5,
    block: 700,
    switch: 600,
    mount: 50,
    mountStep: 2,
    purchaseTrip: 700
  };

  function installationPrice(area, light) {
    return Math.max(light ? 3500 : 3000, area * 2355);
  }
  function deliveryRegion() {
    var select = document.getElementById('delivery-region');
    return select ? select.value : 'murino';
  }
  function mirrorDeliverySides() {
    var shape = $('input[name="shape"]:checked');
    var w = Number(document.getElementById('width').value) || 0;
    var h = Number(document.getElementById('height').value) || 0;
    if (shape && shape.value === 'circle') h = w;
    if (shape && /double/.test(shape.value)) h += Number(document.getElementById('height2').value) || 0;
    return {longer:Math.max(w, h), shorter:Math.min(w, h)};
  }
  function purchaseTripPrice() {
    var sides = mirrorDeliverySides();
    return window.MirrorSupplierPricing.purchasingTrip(sides.longer, sides.shorter);
  }
  function murinoDeliveryPrice() {
    var sides = mirrorDeliverySides();
    if (sides.longer > 2500 || sides.shorter > 1500) return 1500;
    if (sides.longer > 2000 || sides.shorter > 1000) return 1000;
    return 500;
  }
  function clientDeliveryPrice() {
    return (state.delivery || state.install) && deliveryRegion() === 'murino' ? murinoDeliveryPrice() : 0;
  }
  function deliveryDescription() {
    if (!state.delivery && !state.install) return 'не выбрана';
    return deliveryRegion() === 'murino' ? 'по Мурино — ' + fmt(murinoDeliveryPrice()) + ' ₽' :
      (deliveryRegion() === 'spb' ? 'по Санкт-Петербургу — отдельно, не включена в итог' : 'по адресу — отдельно, не включена в итог');
  }
  function updateDeliveryAvailability() {
    var cb = $('input[name="option"][value="delivery"]');
    var install = $('input[name="option"][value="install"]');
    var included = !!(install && install.checked);
    var field = document.getElementById('deliveryRegionField');
    if (cb) cb.disabled = included;
    if (field) field.hidden = !(included || (cb && cb.checked));
    var option = document.querySelector('#delivery-region option[value="murino"]');
    if (option) option.textContent = 'Мурино — ' + fmt(murinoDeliveryPrice()) + ' ₽';
    var label = document.querySelector('#deliveryOpt span');
    if (label) label.textContent = included ? 'Доставка добавляется к установке' : 'Доставка';
  }

  var EDGE_LABELS = { grind: 'шлифовка', polish: 'полировка', 'curved-grind': 'криволинейная шлифовка', 'curved-polish': 'криволинейная полировка' };

  function euroEdgeRate(sideMm) {
    if (sideMm < 120 || sideMm >= 2400) return 270;
    if (sideMm >= 1900) return 216;
    if (sideMm >= 1400) return 176;
    return 135;
  }

  function euroEdgeCost(shape, w, h, h2) {
    // Сохраняем расчёт криволинейных форм по габаритному прямоугольнику.
    // У составного прямоугольника обрабатываются все стороны обеих деталей.
    var sides = shape === 'double' ? [w, w, h, h, w, w, h2, h2]
      : [w, w, h + (shape === 'semidouble' ? h2 : 0), h + (shape === 'semidouble' ? h2 : 0)];
    return sides.reduce(function (cost, side) {
      return cost + side / 1000 * euroEdgeRate(side);
    }, 0);
  }

  /* Надбавка за фигурную форму к погонному метру обработки кромки */
  function shapeMeterSurcharge(shape) {
    return (shape === 'circle' || shape === 'oval' || shape === 'semicircle' || shape === 'semidouble') ? 95 : 0;
  }

  /* Доплата за высоту свыше 2000 мм — 1350 ₽ для всех зеркал.
     Для составных форм учитывается суммарная высота двух частей. */
  function heightSurcharge(totalH) {
    return totalH > 2000 ? 1350 : 0;
  }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }

  function updateFaceFrameAvailability() {
    var allowed = state.shape === 'rect' || state.shape === 'double';
    var block = document.getElementById('faceFrameOpt');
    if (block) block.classList.toggle('hidden', !allowed);
    $all('input[name="face-frame"]').forEach(function (radio) {
      radio.disabled = !allowed;
      if (!allowed) radio.checked = radio.value === 'none';
    });
    if (!allowed) state.faceFrame = 'none';
  }

  function updateEdgeAvailability() {
    var curved = state.shape !== 'rect' && state.shape !== 'double';
    var selected = $('input[name="edge"]:checked');
    var treatment = selected && selected.value === 'grind' ? 'grind' : 'polish';
    state.edge = (curved ? 'curved-' : '') + treatment;
    $all('input[name="edge"]').forEach(function (radio) {
      radio.disabled = false;
      if (radio.parentElement) radio.parentElement.style.opacity = '';
    });
    var info = document.getElementById('edgeInfo');
    if (info) info.textContent = 'Выбрана ' + (treatment === 'grind' ? 'шлифовка' : 'полировка');
  }

  function readState() {
    updateDeliveryAvailability();
    var s = $('input[name="shape"]:checked');
    if (s) state.shape = s.value;
    var curvedNote = document.getElementById('curved-note');
    if (curvedNote) curvedNote.hidden = state.shape !== 'curved';
    var material = $('input[name="material"]:checked');
    state.material = material ? material.value : 'silver';
    var l = $('input[name="light"]:checked');
    if (l) state.light = l.value === 'on';
    var c = $('input[name="ctrl"]:checked');
    if (c) state.ctrl = c.value;
    var cl = $('input[name="clr"]:checked');
    if (cl) state.clr = cl.value;
    var f = $('input[name="edge"]:checked');
    if (f) state.edge = f.value;
    function opt(v) {
      var o = $('input[name="option"][value="' + v + '"]');
      return !!(o && o.checked);
    }
    state.film = opt('film');
    state.heat = opt('heat');
    state.install = opt('install');
    state.delivery = opt('delivery');
    updateFaceFrameAvailability();
    var frame = $('input[name="face-frame"]:checked');
    state.faceFrame = frame ? frame.value : 'none';
    updateEdgeAvailability();
    state.aluFrame = opt('alu-frame');
    state.ledProfile = state.light && opt('led-profile');
  }

  function adj(id, delta) {
    if ((state.shape === 'curved' || state.shape === 'semicircle' || state.shape === 'semidouble') && id === 'width') return;
    var el = document.getElementById(id);
    if (!el) return;
    var v = parseInt(el.value, 10) || 0;
    v = Math.max(state.shape === 'semicircle' && id === 'height' ? 800 : 400, v + delta);
    v = Math.min(v, state.shape === 'curved' && id === 'height' ? 1800 : 3210);
    el.value = v;
    if (state.shape === 'circle') {
      var hEl = document.getElementById('height');
      if (hEl) hEl.value = v;
    }
    onSizeInput();
  }

  function syncSemicircleSize() {
    if (state.shape === 'curved') {
      var figureHeight = document.getElementById('height');
      var figureWidth = document.getElementById('width');
      if (figureHeight && figureWidth) figureWidth.value = Math.round((parseFloat(figureHeight.value) || 0) * 8 / 9);
      return;
    }
    if (state.shape !== 'semicircle' && state.shape !== 'semidouble') return;
    var hEl = document.getElementById('height');
    var wEl = document.getElementById('width');
    var h2El = document.getElementById('height2');
    if (hEl && wEl) {
      var totalHeight = parseFloat(hEl.value) || 0;
      if (state.shape === 'semidouble') totalHeight += h2El ? (parseFloat(h2El.value) || 0) : 0;
      wEl.value = totalHeight / 2;
    }
  }

  function onSizeInput() {
    readState();
    var hEl = document.getElementById('height');
    var wEl = document.getElementById('width');
    if (!hEl || !wEl) return;
    if (state.shape === 'circle') hEl.value = wEl.value;
    syncSemicircleSize();
    var rowH2 = document.getElementById('rowH2');
    if (rowH2) rowH2.classList.toggle('hidden', state.shape !== 'double' && state.shape !== 'semidouble');
    updPreview();
    var result = document.getElementById('calc-result');
    if (result && result.classList.contains('show')) calc(false);
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
    var w = parseFloat(wEl.value) || 1500;
    var h = parseFloat(hEl.value) || 700;

    var lblW = document.getElementById('lblW');
    var lblH = document.getElementById('lblH');

    if (state.shape === 'circle') {
      if (lblW) lblW.textContent = 'Ø ' + w + ' мм';
      if (lblH) lblH.textContent = '';
    } else if (state.shape === 'double') {
      var h2 = parseFloat(document.getElementById('height2').value) || 600;
      if (lblW) lblW.textContent = w + ' мм';
      if (lblH) lblH.textContent = h + ' + ' + h2 + ' мм';
    } else if (state.shape === 'semidouble') {
      var h2Semi = parseFloat(document.getElementById('height2').value) || 800;
      var totalSemiH = h + h2Semi;
      if (lblW) lblW.textContent = w + ' мм';
      if (lblH) lblH.textContent = h + ' + ' + h2Semi + ' = ' + totalSemiH + ' мм';
    } else {
      if (lblW) lblW.textContent = w + ' мм';
      if (lblH) lblH.textContent = h + ' мм';
    }

    var wrap = document.getElementById('mirrorWrap');
    if (!wrap) return;
    var maxWrapW = 260, minWrapW = 100, maxWrapH = 320, minWrapH = 100;

    var aspect;
    if (state.shape === 'circle') {
      aspect = 1;
    } else if (state.shape === 'semidouble') {
      var h2Aspect = parseFloat(document.getElementById('height2').value) || 800;
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
    var w = parseFloat(wEl.value) || 1500;
    var h = parseFloat(hEl.value) || 700;
    var shape = state.shape;
    var hasLight = state.light;
    var clr = state.clr;

    var colors = { warm: '#ffd28a', cold: '#bbddff', neutral: '#ffffff' };
    var glowColor = colors[clr] || colors.neutral;

    var cx = VB_W / 2;
    var cy = VB_H / 2;
    var content = '';
    var splitOverlay = '';

    function logoText(bx, by, bw, bh) {
      var fs = Math.max(3.5, Math.min(6.5, bh * 0.05));
      return '<text x="' + (bx + bw - 6) + '" y="' + (by + bh - 7) + '" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="' + fs.toFixed(1) + '" font-weight="600" letter-spacing="0.12em" fill="rgba(255,255,255,0.72)" style="font-family:Arial, Helvetica, sans-serif">Mirror&nbsp;Pro</text>';
    }

    if (shape === 'rect' || shape === 'rounded') {
      var aspect = w / h;
      var fit = fitBox(aspect);
      var rw = fit.w, rh = fit.h;
      var rx = shape === 'rounded' ? Math.min(rw, rh) * 0.12 : 10 * (rw / 150);
      var x = (VB_W - rw) / 2;
      var y = (VB_H - rh) / 2;
      content = '<rect class="mirror-glow" x="' + (x - 0) + '" y="' + (y - 0) + '" width="' + (rw + 0 * 2) + '" height="' + (rh + 0 * 2) + '" rx="' + (rx + 0) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<rect class="mirror-frame" x="' + x + '" y="' + y + '" width="' + rw + '" height="' + rh + '" rx="' + rx + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + 0 + '" />' +
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
      content = '<circle class="mirror-glow" cx="' + cx + '" cy="' + cy + '" r="' + (r + 4 + 0) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<circle class="mirror-frame" cx="' + cx + '" cy="' + cy + '" r="' + (r + 0) + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + 0 + '" />' +
        '<circle class="mirror-body" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />' +
        '<circle cx="' + (cx - r * 0.2) + '" cy="' + (cy - r * 0.25) + '" r="' + (r * 0.3) + '" fill="url(#windowGrad)" opacity="0.5" />' +
        '<circle cx="' + (cx + r * 0.3) + '" cy="' + (cy - r * 0.15) + '" r="' + (r * 0.22) + '" fill="url(#windowGrad)" opacity="0.3" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="url(#glareGrad)" opacity="0.8" />' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="url(#cornerGlow)" />' +
        '<ellipse cx="' + cx + '" cy="' + (cy + r * 0.25) + '" rx="' + (r * 0.7) + '" ry="' + (r * 0.5) + '" fill="url(#floorGrad)" opacity="0.6" />' +
        logoText(cx - r, cy - r, r * 2, r * 2);
    } else if (shape === 'curved') {
      var customBox = fitBox(w / h);
      var customX = cx - customBox.w / 2, customY = cy - customBox.h / 2;
      content = '<path transform="translate(' + customX + ' ' + customY + ') scale(' + customBox.w / 100 + ' ' + customBox.h / 100 + ')" d="M 50 0 C 37 0 31 9 25 13 C 14 19 0 22 0 32 C 0 40 17 44 16 50 C 15 56 2 60 3 68 C 4 76 20 79 26 87 C 32 95 35 100 49 100 C 64 100 68 93 78 89 C 88 84 100 80 99 71 C 98 63 85 60 87 53 C 89 46 100 41 100 32 C 100 22 84 16 76 12 C 67 8 64 0 50 0 Z" fill="url(#glassGrad)" />';
    } else if (shape === 'oval') {
      var fitO = fitBox(w / h);
      var rxo = fitO.w / 2;
      var ryo = fitO.h / 2;
      content = '<ellipse class="mirror-glow" cx="' + cx + '" cy="' + cy + '" rx="' + (rxo + 4 + 0) + '" ry="' + (ryo + 4 + 0) + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<ellipse class="mirror-frame" cx="' + cx + '" cy="' + cy + '" rx="' + (rxo + 0) + '" ry="' + (ryo + 0) + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + 0 + '" />' +
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
      var pathGlow = 'M ' + (boxX + rr) + ' ' + (boxY - 0) + ' A ' + (rr + 0) + ' ' + (rr + 0) + ' 0 0 0 ' + (boxX - 0) + ' ' + (boxY + rr) + ' A ' + (rr + 0) + ' ' + (rr + 0) + ' 0 0 0 ' + (boxX + rr) + ' ' + (boxY + boxH + 0) + ' L ' + (boxX + boxW + 0) + ' ' + (boxY + boxH + 0) + ' L ' + (boxX + boxW + 0) + ' ' + (boxY - 0) + ' Z';
      content = '<path class="mirror-glow" d="' + pathGlow + '" fill="none" stroke="' + glowColor + '" stroke-width="' + (hasLight ? 6 : 0) + '" opacity="' + (hasLight ? 0.7 : 0) + '" filter="url(#ledGlow)" />' +
        '<path class="mirror-frame" d="' + pathMain + '" fill="none" stroke="url(#bevelGrad)" stroke-width="' + 0 + '" />' +
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
      var h2SD = parseFloat(document.getElementById('height2').value) || 800;
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
      var h2v = parseFloat(document.getElementById('height2').value) || 600;
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
    if (state.faceFrame !== 'none') {
      bodies.forEach(function (body) {
        var frame = body.cloneNode(true);
        frame.setAttribute('fill', 'none');
        frame.setAttribute('stroke', {white:'#f7f7f4',black:'#171717',gold:'#c5a34d'}[state.faceFrame]);
        frame.setAttribute('stroke-width', '5');
        frame.setAttribute('clip-path', 'url(#realMirrorClip)');
        frame.setAttribute('class', 'mirror-face-frame');
        edges += frame.outerHTML;
      });
    }
    svg.insertAdjacentHTML('beforeend',
      '<defs><clipPath id="realMirrorClip">' + clipShapes + '</clipPath>' +
      '<filter id="realMirrorHalo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<linearGradient id="realMirrorSheen" x2="1" y2="1"><stop stop-color="#f5fbff" stop-opacity=".22"/><stop offset=".38" stop-color="#fff" stop-opacity=".03"/><stop offset=".52" stop-color="#fff" stop-opacity=".13"/><stop offset=".68" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#78958a" stop-opacity=".16"/></linearGradient></defs>' +
      halos + '<g clip-path="url(#realMirrorClip)">' +
      '<rect width="170" height="240" fill="#d7dbd3"/>' +
      '<image href="assets/mirror-reflection.png" width="170" height="240" preserveAspectRatio="xMidYMid slice" opacity=".88"/>' +
      (state.material === 'bronze' ? '<rect width="170" height="240" fill="#9d693b" opacity=".38"/>' : state.material === 'graphite' ? '<rect width="170" height="240" fill="#333943" opacity=".38"/>' : '') +
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
    inputH.min = shape === 'semicircle' ? '800' : '400';
    inputH.max = shape === 'curved' ? '1800' : '3210';
    inputW.disabled = shape === 'curved' || shape === 'semicircle' || shape === 'semidouble';
    $all('.stepper-btn[data-adj="width"]').forEach(function (button) {
      button.disabled = shape === 'curved' || shape === 'semicircle' || shape === 'semidouble';
    });

    if (shape === 'circle') {
      fieldH.classList.add('hidden');
      labelW.textContent = 'Диаметр, мм';
      inputW.value = 900;
      inputH.value = 900;
    } else if (shape === 'semicircle') {
      fieldH.classList.remove('hidden');
      labelH.textContent = 'Высота (диаметр круга), мм';
      labelW.textContent = 'Ширина = ½ высоты, мм';
      inputH.value = 1800;
      inputW.value = 900;
    } else if (shape === 'double') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, мм';
      labelH.textContent = 'Высота верхней, мм';
      inputW.value = 800;
      inputH.value = 1600;
      document.getElementById('height2').value = 600;
    } else if (shape === 'semidouble') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина = ½ общей высоты, мм';
      labelH.textContent = 'Высота верхней части, мм';
      inputW.value = 800;
      inputH.value = 1000;
      document.getElementById('height2').value = 800;
    } else {
      fieldH.classList.remove('hidden');
      labelW.textContent = shape === 'curved' ? 'Ширина автоматически, мм' : 'Ширина, мм';
      labelH.textContent = shape === 'curved' ? 'Высота, мм (до 1800)' : 'Высота, мм';
      inputW.value = 800;
      inputH.value = shape === 'curved' ? 900 : 1800;
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
    updateProfileAvailability();
    var res = document.getElementById('calc-result');
    if (res && res.classList.contains('show')) calc(false);
  }

  function updateProfileAvailability() {
    var profileOpt = document.getElementById('ledProfileOpt');
    var profileCb = $('input[name="option"][value="led-profile"]');
    if (profileOpt) profileOpt.classList.toggle('hidden', !state.light);
    if (profileCb) {
      profileCb.disabled = !state.light;
      if (!state.light) profileCb.checked = false;
    }
    if (!state.light) state.ledProfile = false;
  }

  function updateFilmAvailability() {
    var filmOpt = document.getElementById('filmOpt');
    var filmCb = $('input[name="option"][value="film"]');
    var installCb = $('input[name="option"][value="install"]');
    var installInfo = document.getElementById('installInfo');
    if (filmOpt) filmOpt.classList.remove('hidden');
    if (filmCb) filmCb.disabled = false;
    if (installInfo) installInfo.classList.toggle('hidden', !(installCb && installCb.checked));
  }

  function onEdgeChange() {
    readState();
    renderMirrorSvg();
    var result = document.getElementById('calc-result');
    if (result && result.classList.contains('show')) calc();
  }

  function calcGeometry() {
    syncSemicircleSize();
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = parseFloat(wEl.value) || 0;
    var h = parseFloat(hEl.value) || 0;
    var shape = state.shape;

    var area, per, maxD;
    var edgePer;
    var ledPer;

    if (shape === 'rect' || shape === 'rounded' || shape === 'curved') {
      area = (w * h) / 1000000;
      per = 2 * (w + h) / 1000;
      maxD = Math.max(w, h);
    } else if (shape === 'circle') {
      /* Круг вырезается из квадрата: S = d×d, P = 4d */
      var d = w;
      area = (d * d) / 1000000;
      per = (4 * d) / 1000;
      maxD = d;
    } else if (shape === 'oval') {
      /* Овал вырезается из прямоугольника: S = w×h, P = 2(w+h) */
      area = (w * h) / 1000000;
      per = (2 * (w + h)) / 1000;
      maxD = Math.max(w, h);
    } else if (shape === 'semicircle') {
      /* Полукруг вырезается из прямоугольника: S = w×h, P = 2(w+h) */
      area = (w * h) / 1000000;
      per = (2 * (w + h)) / 1000;
      maxD = Math.max(w, h);
    } else if (shape === 'double') {
      var h2v = parseFloat(document.getElementById('height2').value) || 0;
      area = (w * h + w * h2v) / 1000000;
      per = (2 * (w + h) + 2 * (w + h2v)) / 1000;
      maxD = Math.max(w, h, h2v);
    } else if (shape === 'semidouble') {
      /* Базовая стоимость совпадает с обычным полукругом тех же общих
         габаритов. Надбавка 20% за изготовление из двух частей применяется
         к окончательной цене ниже. */
      var h2SemiCalc = parseFloat(document.getElementById('height2').value) || 800;
      var totalSemiCalc = h + h2SemiCalc;
      area = (w * totalSemiCalc) / 1000000;
      per = (2 * (w + totalSemiCalc)) / 1000;
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

  function calc(scrollResult) {
    readState();
    syncSemicircleSize();
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = parseFloat(wEl.value) || 0;
    var h = parseFloat(hEl.value) || 0;

    function requestQuote(message) {
      document.getElementById('r-size').textContent = h + ' × ' + w + ' мм · ' + SHAPE_NAMES[state.shape];
      document.getElementById('r-sum').textContent = 'Индивидуальный расчёт';
      document.getElementById('r-inc').textContent = message;
      var link = document.getElementById('r-cta');
      link.textContent = 'Уточнить стоимость в MAX';
      link.href = MAX_URL + '?text=' + encodeURIComponent('Хочу уточнить стоимость: ' + SHAPE_NAMES[state.shape] + ', ' + h + '×' + w + ' мм, ' + ({silver:'серебро',graphite:'графит',bronze:'бронза'}[state.material]) + ', ' + (state.light ? 'с подсветкой' : 'без подсветки') + '. ' + message);
      var result = document.getElementById('calc-result');
      result.classList.add('show');
      if (scrollResult !== false) result.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || (state.shape !== 'curved' && w < 400) || (state.shape !== 'circle' && h < 400)) {
      requestQuote('Укажите корректные размеры от 400 мм.'); return;
    }
    if (state.shape === 'curved' && (h < 400 || h > 1800)) {
      requestQuote('Для фигурного зеркала выберите высоту от 400 до 1800 мм. Ширина определяется автоматически.'); return;
    }
    if (state.material !== 'silver' && (Math.max(w,h)>2550 || Math.min(w,h)>1605)) {
      requestQuote('Размер превышает лист зеркала бронза/графит 2550 × 1605 мм. Согласуем изготовление из частей.'); return;
    }
    if (Math.max(w, h) > 3210 || Math.min(w, h) > 2250) {
      requestQuote('Размер превышает формат одного листа 3210 × 2250 мм. Согласуем изготовление из частей.'); return;
    }
    if ((state.shape === 'double' || state.shape === 'semidouble') && (parseFloat(document.getElementById('height2').value) || 0) < 400) {
      alert('Минимальная высота каждой части — 400 мм');
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
      area = w * combinedHeight / 1000000;
      per = 2 * (w + combinedHeight) / 1000;
      edgePer = per;
      ledPer = per;
    }

    var h2 = parseFloat(document.getElementById('height2').value) || 0;

    var supplierQuote = window.MirrorSupplierPricing.lookup(state.shape, state.material, w, state.shape === 'circle' ? w : h, state.edge, h2);
    if (supplierQuote.needsQuote) {
      requestQuote('Для этой формы, материала или обработки стоимость согласуем по эскизу и прайсу поставщика.'); return;
    }
    var mirrorCost = supplierQuote.materialCost;
    var edgeCost = supplierQuote.edgeCost + supplierQuote.shapeCost;
    area = supplierQuote.area;
    ledPer = supplierQuote.perimeter;
    var markedBase = supplierQuote.cost * (1 + window.MirrorSupplierPricing.markup(state.light, state.shape));
    var price = markedBase + supplierQuote.packagingCost + supplierQuote.sizeSurcharge;

    // Упаковка, комплектующие, доставка и монтаж — без торговой наценки.
    if (state.light) {
      price += Math.ceil(ledPer / PRICE.ledRollLen) * PRICE.ledRoll
        + PRICE.block + PRICE.switch
        + Math.ceil(ledPer / PRICE.mountStep) * PRICE.mount;
    }


    /* Для составных форм доплата определяется по общей высоте двух частей. */
    var totalH = h;
    if (state.shape === 'double' || state.shape === 'semidouble') {
      totalH += parseFloat(document.getElementById('height2').value) || 0;
    }
    // Size coefficients are already included in supplier edge work.

    /* Бронеплёнка: 500 ₽/м² по площади прямоугольника */
    if (state.film) {
      price += geo.area * (supplierQuote.pricingMode === 'stavropol' ? 200 : 500);
    }
    /* Подогрев: фиксированная доплата */
    if (state.heat) {
      price += 2500;
    }

    /* Дополнительные алюминиевые опции — по расчётному периметру,
       без минимальной покупки 6 м. Ставки скрыты в клиентском интерфейсе. */
    if (state.aluFrame) price += geo.per * 200;
    if (state.ledProfile && state.light) price += geo.per * 600;

    /* Налог +6% — применяется последним, ко всем расчётам */
    price *= 1.06;
    price *= supplierQuote.splitFactor;
    /* Дополнительные 2% ко всем итоговым расчётам, до округления. */
    price *= 1.02;
    var roundedSurcharge = price * (supplierQuote.roundedFactor - 1);
    price += roundedSurcharge;

    // Поездка за полотном, установка и доставка — без наценки и надбавок.
    price += purchaseTripPrice();
    if (state.install) price += installationPrice(area, state.light);
    price += clientDeliveryPrice();

    if (state.faceFrame !== 'none') {
      var frameBars = faceFrameStock(state.shape, w, h, parseFloat((document.getElementById('height2') || {}).value) || 0).bars;
      var frameUnitPrice = FACE_FRAME_PRICES[state.faceFrame];
      var framePurchase = frameBars * frameUnitPrice;
      var frameDelivery = FACE_FRAME_DELIVERY[state.faceFrame];
      price += framePurchase + frameDelivery;
    }

    // Rounded corners: the rectangular calculation plus 15%, before rounding.


    var sizeText = '';
    if (state.shape === 'circle') {
      sizeText = 'Ø ' + w + ' мм · ' + SHAPE_NAMES[state.shape];
    } else if (state.shape === 'double' || state.shape === 'semidouble') {
      var h2r = parseFloat(document.getElementById('height2').value) || 0;
      sizeText = h + '+' + h2r + ' × ' + w + ' мм · ' + SHAPE_NAMES[state.shape];
    } else {
      sizeText = h + ' × ' + w + ' мм · ' + SHAPE_NAMES[state.shape];
    }
    /* ---------- Клиентский результат ----------
       Показываем только размер, форму, подсветку и опции.
       Себестоимость, наценка, комплектующие, доставка,
       доплаты и прибыль — только во внутреннем расчёте выше. */
    var CLR_LABELS = { warm: 'тёплый', cold: 'холодный', neutral: 'нейтральный' };
    var CTRL_LABELS = { wave: 'взмах рукой', touch: 'сенсор на зеркале', remote: 'пульт ДУ', smart: 'Wi-Fi / умный дом' };

    document.getElementById('r-size').textContent = sizeText;

    document.getElementById('r-sum').textContent = fmt(price) + ' ₽';
    var priceLabel = document.querySelector('.calc-result-label');
    if (priceLabel) priceLabel.textContent = supplierQuote.estimate ? 'Ориентировочная стоимость' : 'Итоговая цена зеркала';
    document.getElementById('r-sum').dataset.estimate = String(supplierQuote.estimate);
    document.getElementById('r-cta').textContent = 'Заказать в MAX';

    function row(label, value) {
      return '<div class="row"><span>' + label + '</span><i class="dash"></i><span>' + value + '</span></div>';
    }

    var materialLabels = {silver:'Серебро, 4 мм', graphite:'Графит, 4 мм', bronze:'Бронза, 4 мм'};
    var inc = row('Полотно', materialLabels[state.material]);
    if (state.light) {
      inc += row('Подсветка', 'LED COB, ' + CLR_LABELS[state.clr] + ' свет');
      inc += row('Управление', CTRL_LABELS[state.ctrl]);
    } else {
      inc += row('Подсветка', 'нет');
    }
    inc += row('Кромка', EDGE_LABELS[state.edge]);
    if (state.install) {
      inc += row('Установка', state.film ? 'на крепёж, с бронеплёнкой' : 'на крепёж');
    }
    if (state.film) {
      inc += row('Бронеплёнка', 'да');
    }
    if (state.heat) {
      inc += row('Подогрев 400×600 мм', 'да');
    }

    inc += row('Доставка', deliveryDescription());
    if (state.aluFrame) inc += row('Каркас из алюминиевого уголка 1,5 мм', 'да');
    if (state.ledProfile) inc += row('Светодиодная лента в алюминиевом профиле', 'да');
    if (state.faceFrame !== 'none') inc += row('Алюминиевая рама', FACE_FRAME_LABELS[state.faceFrame]);
    if (supplierQuote.estimate) inc += '<p class="figure-price-note">Точная стоимость после согласования контура и заготовки. Установка и доставка — по выбранным условиям.</p>';
    document.getElementById('r-inc').innerHTML = inc;

    var details = [materialLabels[state.material]];
    if (state.light) {
      details.push('с LED-подсветкой (' + CLR_LABELS[state.clr] + ', управление: ' + CTRL_LABELS[state.ctrl] + ')');
    } else {
      details.push('без подсветки');
    }
    details.push(EDGE_LABELS[state.edge]);
    if (state.install) details.push('с установкой');
    if (state.film) details.push('с бронеплёнкой');
    if (state.aluFrame) details.push('с каркасом из алюминиевого уголка 1,5 мм');
    if (state.ledProfile) details.push('со светодиодной лентой в алюминиевом профиле');
    if (state.delivery || state.install) details.push('доставка: ' + deliveryDescription());

    if (state.faceFrame !== 'none') details.push('алюминиевая рама — ' + FACE_FRAME_LABELS[state.faceFrame]);
    var ctaText = '';
    if (state.shape === 'double') {
      var h2c = parseFloat(document.getElementById('height2').value) || 0;
      ctaText = 'Здравствуйте! Хочу заказать зеркало из двух частей ' + h + '+' + h2c + '×' + w + ' мм' + (details.length ? ' — ' + details.join(', ') : '') + (supplierQuote.estimate ? '. Ориентировочная стоимость по калькулятору: ' : '. Стоимость по калькулятору: ') + fmt(Math.round(price)) + ' ₽.';
    } else if (state.shape === 'semidouble') {
      var h2SemiCta = parseFloat(document.getElementById('height2').value) || 0;
      ctaText = 'Здравствуйте! Хочу заказать полукруг из двух частей ' + h + '+' + h2SemiCta + '×' + w + ' мм' + (details.length ? ' — ' + details.join(', ') : '') + (supplierQuote.estimate ? '. Ориентировочная стоимость по калькулятору: ' : '. Стоимость по калькулятору: ') + fmt(Math.round(price)) + ' ₽.';
    } else {
      ctaText = 'Здравствуйте! Хочу заказать ' + SHAPE_NAMES[state.shape].toLowerCase() + ' зеркало ' + (state.shape === 'circle' ? 'Ø' + w : h + '×' + w) + ' мм' + (details.length ? ' — ' + details.join(', ') : '') + (supplierQuote.estimate ? '. Ориентировочная стоимость по калькулятору: ' : '. Стоимость по калькулятору: ') + fmt(Math.round(price)) + ' ₽.';
    }
    document.getElementById('r-cta').href = MAX_URL + '?text=' + encodeURIComponent(ctaText);

    var res = document.getElementById('calc-result');
    res.classList.add('show');
    if (scrollResult !== false) res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  var deliveryRegionSelect = document.getElementById('delivery-region');
  if (deliveryRegionSelect) deliveryRegionSelect.addEventListener('change', function () {
    readState();
    var result = document.getElementById('calc-result');
    if (result && result.classList.contains('show')) calc(false);
  });

  /* ---------- События калькулятора ---------- */
  $all('input[name="face-frame"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState(); renderMirrorSvg();
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc(false);
    });
    r.addEventListener('click', function () {
      if (r.disabled) return;
      if (r.value === 'none') window.hideFrameExample();
      else window.showFrameExample(r.value, r);
    });
  });

  $all('input[name="material"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState();
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc(false);
    });
  });
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
      if (preview) window.showPreviewReturn(r);
      if (preview) preview.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center'
      });
    });
  });
  $all('input[name="edge"]').forEach(function (r) {
    r.addEventListener('change', onEdgeChange);
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
  $all('input[name="option"][value="film"], input[name="option"][value="heat"], input[name="option"][value="delivery"], input[name="option"][value="alu-frame"], input[name="option"][value="led-profile"]').forEach(function (r) {
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
    updateProfileAvailability();
  }
})();






