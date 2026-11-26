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
      returnButton.style.cssText = 'position:fixed;z-index:90;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:15px 20px;border:1px solid #fff;border-radius:10px;background:#173d34;color:#fff;box-shadow:0 4px 18px #0003;font:600 16px/1.3 sans-serif;cursor:pointer';
      returnButton.onclick = function () {
        hideReturn(); if (box) box.hidden = true;
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
    box.hidden = false;
  };
})();

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

  var MAX_URL = 'https://max.ru/u/f9LHodD0cOLbb_I_NfS4ans5ICo43Baa1UqtWuFJuR82JHYzk0Y3OhzIpvI';

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
    faceFrame: 'none',
    aluFrame: false,
    ledProfile: false,
    install: false
  };

  var FACE_FRAME_LABELS = { white: 'белая', black: 'чёрная', gold: 'золотая' };
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
  var barLength = 2700, billedLength = 3, bars;
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

  /* Уголок продаётся цельными трёхметровыми хлыстами. */
  var ANGLE_FRAME = { barLength: 3000, pricePerMetre: 80, purchaseTrip: 500 };
  function angleFrameBars(shape, w, h, h2, perimeter) {
    if (shape !== 'rect' && shape !== 'rounded' && shape !== 'double') {
      // Для фигурных зеркал сохраняем прежний расчётный периметр.
      return Math.ceil(perimeter * 1000 / ANGLE_FRAME.barLength);
    }
    var sides = shape === 'double' ? [w,w,w,w,h,h,h2,h2] : [w,w,h,h];
    var pieces = [];
    sides.forEach(function (side) {
      var remaining = Math.max(0, Math.round(side));
      while (remaining > 0) {
        var piece = Math.min(ANGLE_FRAME.barLength, remaining);
        pieces.push(piece);
        remaining -= piece;
      }
    });
    pieces.sort(function (a,b) { return b-a; });
    var bins = [], best = pieces.length;
    function pack(i) {
      if (i === pieces.length) { best = Math.min(best, bins.length); return; }
      if (bins.length >= best) return;
      var seen = {};
      for (var j = 0; j < bins.length; j++) {
        if (seen[bins[j]] || bins[j] + pieces[i] > ANGLE_FRAME.barLength) continue;
        seen[bins[j]] = true;
        bins[j] += pieces[i]; pack(i+1); bins[j] -= pieces[i];
      }
      bins.push(pieces[i]); pack(i+1); bins.pop();
    }
    pack(0);
    return best;
  }

  var SHAPE_NAMES = {
    rect: 'Прямоугольник',
    rounded: 'Прямоугольник с закруглёнными углами',
    circle: 'Круг',
    oval: 'Овал',
    capsule: 'Овал с прямыми боками',
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
    return (shape === 'circle' || shape === 'oval' || shape === 'capsule' || shape === 'semicircle' || shape === 'semidouble') ? 95 : 0;
  }

  /* Доплата за большую сторону: до 2000 мм включительно — 0 ₽,
     свыше 2000 до 2500 мм включительно — 1200 ₽, выше 2500 мм — 3000 ₽.
     Перестановка высоты и ширины не меняет доплату. */
  function sizeSurcharge(width, height) {
    var maxDimension = Math.max(width, height);
    if (maxDimension <= 2000) return 0;
    if (maxDimension <= 2500) return 1200;
    return 3000;
  }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }

  function updateDeliveryAvailability() {
    var cb=$('input[name="option"][value="delivery"]'),install=$('input[name="option"][value="install"]');
    if(cb){if(install&&install.checked)cb.checked=true;cb.disabled=!!(install&&install.checked);}
    var label=$('#deliveryOpt span');if(label)label.textContent='Доставка по адресу';
    var field=document.getElementById('deliveryRegionField');if(field)field.hidden=true;
    if(window.MirrorDelivery)window.MirrorDelivery.updateVisibility();
  }

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

  function updateFacetAvailability() {
    var allowed = state.shape === 'rect' || state.shape === 'double';
    var reset = false;
    $all('input[name="facet"]').forEach(function (radio) {
      var isFacet = radio.value !== 'none' && radio.value !== 'grind';
      if (!isFacet) return;
      radio.disabled = !allowed;
      if (radio.parentElement) radio.parentElement.classList.toggle('hidden', !allowed);
      if (!allowed && radio.checked) { radio.checked = false; reset = true; }
    });
    if (reset) {
      var none = $('input[name="facet"][value="none"]');
      if (none) none.checked = true;
      state.facet = 'none';
      var info = document.getElementById('edgeInfo');
      if (info) {
        info.textContent = 'Обработка кромки от пореза включена';
        info.classList.remove('gold');
      }
    }
  }

  function updateFacetFrameCompatibility() {
    var hasFacet = state.facet !== 'none' && state.facet !== 'grind';
    // A restored incompatible selection keeps the bevel and removes the frame.
    if (hasFacet && state.faceFrame !== 'none') {
      $all('input[name="face-frame"]').forEach(function (radio) {
        radio.checked = radio.value === 'none';
      });
      state.faceFrame = 'none';
    }
    var rectangular = state.shape === 'rect' || state.shape === 'double';
    var hasFrame = state.faceFrame !== 'none';
    $all('input[name="face-frame"]').forEach(function (radio) {
      radio.disabled = !rectangular || (hasFacet && radio.value !== 'none');
      if (radio.parentElement) {
        radio.parentElement.style.opacity = radio.disabled ? '0.45' : '';
        radio.parentElement.style.cursor = radio.disabled ? 'not-allowed' : '';
      }
    });
    $all('input[name="facet"]').forEach(function (radio) {
      var isFacet = radio.value !== 'none' && radio.value !== 'grind';
      if (!isFacet) return;
      radio.disabled = !rectangular || hasFrame;
      if (radio.parentElement) {
        radio.parentElement.style.opacity = radio.disabled ? '0.45' : '';
        radio.parentElement.style.cursor = radio.disabled ? 'not-allowed' : '';
      }
    });
  }

  function scrollToMirrorPreview() {
    var preview = document.querySelector('.calculator .calc-preview');
    if (!preview) return;
    // Wait for hidden controls and the mirror preview to finish updating.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        preview.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  }

  /* Каркас обязателен от 200 см высоты или при ширине свыше 100 см.
     Для составных зеркал учитывается общая высота, для круга — диаметр. */
  function updateRequiredAngleFrame() {
    var cb = $('input[name="option"][value="alu-frame"]');
    if (!cb) return;
    var w = window.MirrorSize.read(document.getElementById('width')) || 0;
    var h = state.shape === 'circle'
      ? w
      : (window.MirrorSize.read(document.getElementById('height')) || 0);
    if (state.shape === 'double' || state.shape === 'semidouble')
      h += window.MirrorSize.read(document.getElementById('height2')) || 0;
    var required = h >= 2000 || w > 1000;
    if (required) {
      if (cb.dataset.autoRequired !== '1')
        cb.dataset.manualChecked = cb.checked ? '1' : '0';
      cb.checked = true;
      cb.disabled = true;
      cb.dataset.autoRequired = '1';
    } else {
      if (cb.dataset.autoRequired === '1') {
        cb.checked = cb.dataset.manualChecked === '1';
        delete cb.dataset.autoRequired;
        delete cb.dataset.manualChecked;
      }
      cb.disabled = false;
    }
    var label = document.querySelector('#aluFrameOpt span');
    if (label) label.textContent = required
      ? 'Каркас из алюминиевого уголка 1,5 мм (обязателен: высота от 200 см или ширина более 100 см, включён в цену)'
      : 'Каркас из алюминиевого уголка 1,5 мм';
  }

  function readState() {
    updateDeliveryAvailability();
    var s = $('input[name="shape"]:checked');
    if (s) state.shape = s.value;
    var l = $('input[name="light"]:checked');
    if (l) state.light = l.value === 'on';
    var c = $('input[name="ctrl"]:checked');
    if (c) state.ctrl = c.value;
    var cl = $('input[name="clr"]:checked');
    if (cl) state.clr = cl.value;
    updateFacetAvailability();
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
    updateFaceFrameAvailability();
    var frame = $('input[name="face-frame"]:checked');
    state.faceFrame = frame ? frame.value : 'none';
    updateFacetFrameCompatibility();
    updateRequiredAngleFrame();
    state.aluFrame = opt('alu-frame');
    state.ledProfile = state.light && opt('led-profile');
  }

  function adj(id, delta) {
    if ((state.shape === 'semicircle' || state.shape === 'semidouble') && id === 'width') return;
    var el = document.getElementById(id);
    if (!el) return;
    var v = window.MirrorSize.read(el) || 0;
    v = Math.max(state.shape === 'semicircle' && id === 'height' ? 800 : 400, v + delta);
    if (id === 'width') v = Math.min(v, 32100);
    if (id === 'height' || id === 'height2') v = Math.min(v, 22500);
    window.MirrorSize.write(el, v);
    if (state.shape === 'circle') {
      var hEl = document.getElementById('height');
      if (hEl) window.MirrorSize.write(hEl, v);
    }
    onSizeInput();
  }

  function syncSemicircleSize() {
    if (state.shape !== 'semicircle' && state.shape !== 'semidouble') return;
    var hEl = document.getElementById('height');
    var wEl = document.getElementById('width');
    var h2El = document.getElementById('height2');
    if (hEl && wEl) {
      var totalHeight = window.MirrorSize.read(hEl) || 0;
      if (state.shape === 'semidouble') totalHeight += h2El ? (window.MirrorSize.read(h2El) || 0) : 0;
      window.MirrorSize.write(wEl, totalHeight / 2);
    }
  }

  function arrangeSizeFields() {
    var top = document.getElementById('fieldH');
    var width = document.getElementById('fieldW');
    var lower = document.getElementById('rowH2');
    var row = top && top.parentElement;
    var split = state.shape === 'double' || state.shape === 'semidouble';
    if (!row || !width || !lower) return;
    // Keep all dimensions together; lead time is mounted after this row.
    if (lower.parentElement !== row || lower.nextElementSibling !== width) row.insertBefore(lower, width);
    lower.classList.toggle('hidden', !split);
    row.style.gridTemplateColumns = split ? 'minmax(0, 1fr)' : '';
    row.style.flexDirection = split ? 'column' : '';
    var label = document.getElementById('labelW');
    if (state.shape === 'semidouble' && label) label.textContent = 'Ширина автоматически (½ общей высоты), см';
    var hint = document.getElementById('w2hint');
    if (hint) hint.hidden = state.shape === 'semidouble';
    $all('.stepper-btn[data-adj="width"]').forEach(function (button) {
      button.style.visibility = state.shape === 'semidouble' ? 'hidden' : '';
    });
  }

  function onSizeInput() {
    readState();
    var hEl = document.getElementById('height');
    var wEl = document.getElementById('width');
    if (!hEl || !wEl) return;
    if (state.shape === 'circle') hEl.value = wEl.value;
    syncSemicircleSize();
    arrangeSizeFields();
    updPreview();
    // Обновляем уже показанную цену при вводе размеров и нажатии +/−.
    var res = document.getElementById('calc-result');
    setSizeError('');
    if (res && res.classList.contains('show')) calc(false);
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
    var w = window.MirrorSize.read(wEl) || 1500;
    var h = window.MirrorSize.read(hEl) || 700;

    var lblW = document.getElementById('lblW');
    var lblH = document.getElementById('lblH');

    if (state.shape === 'circle') {
      if (lblW) lblW.textContent = window.MirrorSize.dimensions('Ø ' + w + ' мм');
      if (lblH) lblH.textContent = window.MirrorSize.dimensions('');
    } else if (state.shape === 'double') {
      var h2 = window.MirrorSize.read(document.getElementById('height2')) || 600;
      if (lblW) lblW.textContent = window.MirrorSize.dimensions(w + ' мм');
      if (lblH) lblH.textContent = window.MirrorSize.dimensions(h + ' + ' + h2 + ' мм');
    } else if (state.shape === 'semidouble') {
      var h2Semi = window.MirrorSize.read(document.getElementById('height2')) || 800;
      var totalSemiH = h + h2Semi;
      if (lblW) lblW.textContent = window.MirrorSize.dimensions(w + ' мм');
      if (lblH) lblH.textContent = window.MirrorSize.dimensions(h + ' + ' + h2Semi + ' = ' + totalSemiH + ' мм');
    } else {
      if (lblW) lblW.textContent = window.MirrorSize.dimensions(w + ' мм');
      if (lblH) lblH.textContent = window.MirrorSize.dimensions(h + ' мм');
    }

    var wrap = document.getElementById('mirrorWrap');
    if (!wrap) return;
    var maxWrapW = 260, minWrapW = 100, maxWrapH = 320, minWrapH = 100;

    var aspect;
    if (state.shape === 'circle') {
      aspect = 1;
    } else if (state.shape === 'semidouble') {
      var h2Aspect = window.MirrorSize.read(document.getElementById('height2')) || 800;
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
    readState();
    var svg = document.getElementById('mirrorSvg');
    if (!svg) return;
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    if (!wEl || !hEl) return;
    var w = window.MirrorSize.read(wEl) || 1500;
    var h = window.MirrorSize.read(hEl) || 700;
    var shape = state.shape;
    svg.setAttribute('aria-label', SHAPE_NAMES[shape] + (state.light ? ' с подсветкой' : ' без подсветки'));
    svg.setAttribute('data-shape', shape);
    $all('input[name="shape"]').forEach(function (r) {
      r.parentElement.classList.toggle('is-selected', r.checked);
    });
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

    if (shape === 'rect' || shape === 'rounded') {
      var aspect = w / h;
      var fit = fitBox(aspect);
      var rw = fit.w, rh = fit.h;
      var rx = shape === 'rounded' ? Math.min(rw, rh) * 0.12 : 0;
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
    } else if (shape === 'capsule') {
      var fitCapsule = fitBox(w / h);
      var capsuleRadius = Math.min(fitCapsule.w, fitCapsule.h) / 2;
      content = '<rect class="mirror-body" x="' + (cx - fitCapsule.w / 2) + '" y="' + (cy - fitCapsule.h / 2) + '" width="' + fitCapsule.w + '" height="' + fitCapsule.h + '" rx="' + capsuleRadius + '" ry="' + capsuleRadius + '" fill="url(#glassGrad)" stroke="#2a3a4e" stroke-width="1" />';
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
      var h2SD = window.MirrorSize.read(document.getElementById('height2')) || 800;
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
      var h2v = window.MirrorSize.read(document.getElementById('height2')) || 600;
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
        // Reflective bevel band over the photographic mirror preview.
        outline.setAttribute('stroke', 'url(#realMirrorBevel)');
        outline.setAttribute('stroke-width', String(facetW * 2));
        outline.setAttribute('opacity', '0.88');
        outline.setAttribute('clip-path', 'url(#realMirrorClip)');
        outline.setAttribute('class', 'mirror-facet-band');
        edges += outline.outerHTML;
        if (body.tagName.toLowerCase() === 'rect') {
          var bevelX = parseFloat(body.getAttribute('x')) + facetW;
          var bevelY = parseFloat(body.getAttribute('y')) + facetW;
          var bevelW = Math.max(0, parseFloat(body.getAttribute('width')) - 2 * facetW);
          var bevelH = Math.max(0, parseFloat(body.getAttribute('height')) - 2 * facetW);
          edges += '<rect class="mirror-facet-inner-edge" x="' + bevelX + '" y="' + bevelY +
            '" width="' + bevelW + '" height="' + bevelH +
            '" fill="none" stroke="#ffffff" stroke-width="0.75" opacity="0.9"/>';
        }
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
      '<linearGradient id="realMirrorBevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#c2d4d6"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".64" stop-color="#728b91"/><stop offset=".82" stop-color="#dbe9ec"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
      '<linearGradient id="realMirrorSheen" x2="1" y2="1"><stop stop-color="#f5fbff" stop-opacity=".22"/><stop offset=".38" stop-color="#fff" stop-opacity=".03"/><stop offset=".52" stop-color="#fff" stop-opacity=".13"/><stop offset=".68" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#78958a" stop-opacity=".16"/></linearGradient></defs>' +
      halos + '<g clip-path="url(#realMirrorClip)">' +
      '<rect width="170" height="240" fill="#d7dbd3"/>' +
      '<image href="assets/mirror-reflection.svg" width="170" height="240" preserveAspectRatio="xMidYMid slice" transform="translate(170 0) scale(-1 1)" opacity="1"/>' +
      '<rect width="170" height="240" fill="url(#realMirrorSheen)"/></g>' + edges + splitOverlay);
  }

  var enteredDimensions=null;
  function dependentShape(shape){return ['circle','semicircle','semidouble'].indexOf(shape)!==-1;}
  function pickShape(shape) {
    var previousShape=state.shape;
    if(!dependentShape(previousShape))enteredDimensions={width:document.getElementById('width').value,height:document.getElementById('height').value};
    state.shape = shape;
    var fieldH = document.getElementById('fieldH');
    var labelW = document.getElementById('labelW');
    var labelH = document.getElementById('labelH');
    var inputW = document.getElementById('width');
    var inputH = document.getElementById('height');

    inputH.disabled = false;
    inputH.style.opacity = '1';
    inputH.min = shape === 'semicircle' ? '80' : '40';
    inputW.disabled = shape === 'semicircle' || shape === 'semidouble';
    $all('.stepper-btn[data-adj="width"]').forEach(function (button) {
      button.disabled = shape === 'semicircle' || shape === 'semidouble';
    });

    if (shape === 'circle') {
      fieldH.classList.add('hidden');
      labelW.textContent = 'Диаметр, см';


    } else if (shape === 'semicircle') {
      fieldH.classList.remove('hidden');
      labelH.textContent = 'Высота (диаметр круга), см';
      labelW.textContent = 'Ширина = ½ высоты, см';


    } else if (shape === 'double') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, см';
      labelH.textContent = 'Высота верхней, см';

    } else if (shape === 'semidouble') {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина = ½ общей высоты, см';
      labelH.textContent = 'Высота верхней части, см';

    } else {
      fieldH.classList.remove('hidden');
      labelW.textContent = 'Ширина, см';
      labelH.textContent = 'Высота, см';


    }

    if(!dependentShape(shape)&&dependentShape(previousShape)&&enteredDimensions){
      inputW.value=enteredDimensions.width;inputH.value=enteredDimensions.height;
    }
    updateProfileAvailability();
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
    var available = state.light && !window.MirrorEvoProfile.needed(state.shape, true);
    if (profileOpt) profileOpt.classList.toggle('hidden', !available);
    if (profileCb) {
      profileCb.disabled = !available;
      if (!available) profileCb.checked = false;
    }
    if (!available) state.ledProfile = false;
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
    syncSemicircleSize();
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = window.MirrorSize.read(wEl) || 0;
    var h = window.MirrorSize.read(hEl) || 0;
    var shape = state.shape;

    var area, per, maxD;
    var edgePer;
    var ledPer;

    if (shape === 'rect' || shape === 'rounded') {
      area = (w * h) / 1000000;
      per = 2 * (w + h) / 1000;
      maxD = Math.max(w, h);
    } else if (shape === 'circle') {
      /* Круг вырезается из квадрата: S = d×d, P = 4d */
      var d = w;
      area = (d * d) / 1000000;
      per = (4 * d) / 1000;
      maxD = d;
    } else if (shape === 'oval' || shape === 'capsule') {
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
      var h2v = window.MirrorSize.read(document.getElementById('height2')) || 0;
      area = (w * h + w * h2v) / 1000000;
      per = (2 * (w + h) + 2 * (w + h2v)) / 1000;
      maxD = Math.max(w, h, h2v);
    } else if (shape === 'semidouble') {
      /* Базовая стоимость совпадает с обычным полукругом тех же общих
         габаритов. Надбавка 20% за изготовление из двух частей применяется
         к окончательной цене ниже. */
      var h2SemiCalc = window.MirrorSize.read(document.getElementById('height2')) || 800;
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

  function setSizeError(message) {
    var error = document.getElementById('mirror-size-error');
    if (!error && message) {
      var form = document.getElementById('quote-form');
      var submit = form && form.querySelector('button[type="submit"]');
      if (!submit) return;
      error = document.createElement('p');
      error.id = 'mirror-size-error';
      error.setAttribute('role', 'alert');
      error.style.cssText = 'margin:12px 0;color:#b94d36;font-weight:600;line-height:1.45;';
      submit.insertAdjacentElement('afterend', error);
    }
    if (error) {
      error.textContent = message || '';
      error.hidden = !message;
    }
  }

  function sizeValidationMessage(w, h) {
    var split = state.shape === 'double' || state.shape === 'semidouble';
    var h2 = split ? window.MirrorSize.read(document.getElementById('height2')) : 0;
    if (split && (!Number.isFinite(h) || h < 400 || !Number.isFinite(h2) || h2 < 400)) {
      return 'Недопустимый размер. Минимальная высота каждой части — 40 см.';
    }
    if (state.shape === 'semicircle' && (!Number.isFinite(h) || h < 800)) {
      return 'Недопустимый размер. Минимальная высота полукруга — 80 см (ширина 40 см).';
    }
    if (!Number.isFinite(w) || w < 400 || (state.shape !== 'circle' && (!Number.isFinite(h) || h < 400))) {
      return 'Недопустимый размер. Минимальный размер — 40 см.';
    }
    return '';
  }

  function rejectSize(message, explicit) {
    var result = document.getElementById('calc-result');
    if (result) result.classList.remove('show');
    if (window.onPersonalCalculation) window.onPersonalCalculation(null);
    if (explicit) setSizeError(message);
  }

  function calc(scrollResult) {
    readState();
    syncSemicircleSize();
    var wEl = document.getElementById('width');
    var hEl = document.getElementById('height');
    var w = window.MirrorSize.read(wEl) || 0;
    var h = window.MirrorSize.read(hEl) || 0;

    var sizeError = sizeValidationMessage(w, h);
    if (sizeError) { rejectSize(sizeError, scrollResult !== false); return; }
    // Do not quote a sheet that cannot be supplied by either Stavropol tariff.
    if (window.MirrorLeadTime && window.MirrorLeadTime.isStandardEligible() === false) {
      rejectSize('Недопустимый размер. Максимальный размер одного полотна — 300 × 200 см. Необходим индивидуальный расчёт.', scrollResult !== false);
      return;
    }
    setSizeError('');
    var geo = calcGeometry();
    var area = geo.area;
    var per = geo.per;
    var edgePer = geo.edgePer;
    var ledPer = geo.ledPer;
    // База для двух частей — цельный прямоугольник тех же общих размеров.
    if (state.shape === 'double') {
      var combinedHeight = h + (window.MirrorSize.read(document.getElementById('height2')) || 0);
      area = w * combinedHeight / 1000000;
      per = 2 * (w + combinedHeight) / 1000;
      edgePer = per;
      ledPer = per;
    }

    // Only the raw glass purchase tariff depends on production time.
    var unitMirrorPrice = window.MirrorLeadTime ? window.MirrorLeadTime.purchaseRate() : PRICE.mirror;
    var price;

    if (!state.light) {
      /* Зеркало БЕЗ подсветки:
         без фацета — (S×1500 + P×150) × 1,8
         с фацетом — (S×1500 + P×фацет) × 1,8 + 1000 (доставка) */
      var meterExtra = shapeMeterSurcharge(state.shape);
      var basePlain = area * unitMirrorPrice + edgePer * (PRICE.edge + meterExtra);
      if (state.facet === 'none' || state.facet === 'grind') {
        if (state.facet === 'grind') basePlain = area * unitMirrorPrice + edgePer * (FACET_RATES.grind + meterExtra);
        price = basePlain * 1.8;
      } else {
        var facetRate = FACET_RATES[state.facet] || 0;
        price = (area * unitMirrorPrice + edgePer * (facetRate + meterExtra)) * 1.8 + PRICE.facetDelivery;
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
      var costMirrorLight = area * unitMirrorPrice;

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

    /* Сравниваем ширину с высотой; у составных форм — с общей высотой. */
    var totalH = h;
    if (state.shape === 'double' || state.shape === 'semidouble') {
      totalH += window.MirrorSize.read(document.getElementById('height2')) || 0;
    }
    price += sizeSurcharge(w, totalH);

    /* Бронеплёнка: 200 ₽/м² по площади прямоугольника */
    if (state.film) {
      price += geo.area * 200;
    }
    /* Подогрев: фиксированная доплата */
    if (state.heat) {
      price += 2500;
    }

    /* Алюминиевые опции; уголок оплачивается целыми хлыстами по 3 м. */

    if (state.ledProfile && state.light) price += geo.per * 250;
    price += window.MirrorEvoProfile.charge(state.shape,w,h,
      window.MirrorSize.read(document.getElementById('height2'))||0,state.light);



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

    /* Доставка по маршруту: базовая стоимость и километры сверх первых пяти. */
    var deliveryRoute=window.MirrorDelivery?window.MirrorDelivery.getRoute():null;
    var clientDelivery=window.MirrorOrderPricing.deliveryPrice(Math.max(w,totalH),deliveryRoute?deliveryRoute.km:null,state.delivery,state.install);
    // Final frame charges include the agreed work margin and purchasing trip.
    if (state.faceFrame !== 'none') {
      var frameBars = faceFrameStock(state.shape, w, h, window.MirrorSize.read(document.getElementById('height2')) || 0).bars;
      var framePurchase = frameBars * 500;
      price += framePurchase + Math.max(1500, framePurchase) + 400;
    }
    if (state.aluFrame) {
      var angleBars = angleFrameBars(state.shape, w, h,
        window.MirrorSize.read(document.getElementById('height2')) || 0, geo.per);
      price += angleBars * (ANGLE_FRAME.barLength / 1000) * ANGLE_FRAME.pricePerMetre
        + ANGLE_FRAME.purchaseTrip;
    }


    // Rounded corners: the rectangular calculation plus 15%, before rounding.
    var roundedSurcharge = state.shape === 'rounded' ? price * 0.15 : 0;
    price += roundedSurcharge;
    price += clientDelivery;

    var sizeText = '';
    if (state.shape === 'circle') {
      sizeText = 'Ø ' + w + ' мм · ' + SHAPE_NAMES[state.shape];
    } else if (state.shape === 'double' || state.shape === 'semidouble') {
      var h2r = window.MirrorSize.read(document.getElementById('height2')) || 0;
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
    var FACET_LABELS = { none: 'без фацета', grind: 'шлифовка', '10': 'фацет 10 мм', '20': 'фацет 20 мм', '25': 'фацет 25 мм' };

    // Expose the existing unit calculation as service components. No new tariffs.
    // Installation and procurement are already included before the existing
    // percentage adjustments; customer delivery and frame trips are included after.
    var serviceFactor=1.06*1.02;
    if(state.shape==='double')serviceFactor*=1+2000/16469.75;
    if(state.shape==='semidouble')serviceFactor*=1.2;
    var roundingFactor=state.shape==='rounded'?1.15:1;
    var procurementBase=state.light?costDeliveryLight:
      (state.facet!=='none'&&state.facet!=='grind'?PRICE.facetDelivery:0);
    var procurement=(procurementBase*serviceFactor+(state.faceFrame!=='none'?400:0)+(state.aluFrame?ANGLE_FRAME.purchaseTrip:0))*roundingFactor;
    var installBase=state.install?(state.light?costInstallLight:((area<=2)?Math.max(2000,area*1300):area*1500)):0;
    var installCharge=installBase*serviceFactor*roundingFactor;
    var deliveryCharge=clientDelivery;
    if(window.onPersonalCalculation)window.onPersonalCalculation({total:price,rows:[
      {key:'mirror',sale:price-procurement-deliveryCharge-installCharge,cost:null,expense:'mirror'},
      {key:'purchase-trip',sale:procurement,cost:null,expense:'trip'},
      {key:'customer-delivery',sale:deliveryCharge,cost:null,expense:'delivery'},
      {key:'installation',sale:installCharge,cost:null,expense:'install'}
    ],mirror:{carry:window.MirrorCarry?window.MirrorCarry.read():null,ledProfileTariffVersion:1,evoProfileTariffVersion:1,shape:state.shape,name:SHAPE_NAMES[state.shape],width:w,height:h,
      height2:window.MirrorSize.read(document.getElementById('height2'))||0,
      size:window.MirrorSize.dimensions(sizeText.split(' · ')[0]),materialLabel:'Зеркало, 4 мм',leadTimeLabel:window.MirrorLeadTime?window.MirrorLeadTime.currentLabel():'до 10 дней',
      edge:state.facet,edgeLabel:state.facet==='none'?'обработка от порезов':FACET_LABELS[state.facet],
      light:state.light,ctrl:state.ctrl,clr:state.clr,film:state.film,heat:state.heat,
      ledProfile:state.ledProfile,aluFrame:state.aluFrame,faceFrame:state.faceFrame,
      install:state.install,delivery:state.delivery,region:'stavropol',estimate:false}});

    document.getElementById('r-size').textContent = window.MirrorSize.dimensions(sizeText);

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
      inc += row('Бронеплёнка', 'да');
    }
    if (state.heat) {
      inc += row('Подогрев 400×600 мм', 'да');
    }

    inc += row('Доставка', window.MirrorDelivery?window.MirrorDelivery.describe():'не выбрана');
    if (state.faceFrame !== 'none') inc += row('Алюминиевая рама', FACE_FRAME_LABELS[state.faceFrame]);
    if (state.aluFrame) inc += row('Каркас из алюминиевого уголка 1,5 мм', 'да');
    if (state.ledProfile) inc += row('Светодиодная лента в профиле', 'да');
    if (window.MirrorLeadTime) inc += row('Срок изготовления', window.MirrorLeadTime.currentLabel());
    document.getElementById('r-inc').innerHTML = inc;

    var details = [];
    if (window.MirrorLeadTime) details.push('изготовление ' + window.MirrorLeadTime.currentLabel());
    if (state.light) {
      details.push('с LED-подсветкой (' + CLR_LABELS[state.clr] + ', управление: ' + CTRL_LABELS[state.ctrl] + ')');
    } else {
      details.push('без подсветки');
    }
    if (state.facet !== 'none') details.push(FACET_LABELS[state.facet]);
    if (state.install) details.push('с установкой');
    if (state.film) details.push('с бронеплёнкой');
    if (state.faceFrame !== 'none') details.push('алюминиевая рама — ' + FACE_FRAME_LABELS[state.faceFrame]);
    if (state.aluFrame) details.push('с каркасом из алюминиевого уголка 1,5 мм');
    if (state.ledProfile) details.push('со светодиодной лентой в алюминиевом профиле');
    if (state.delivery) details.push('доставка по адресу клиента');

    var ctaText = '';
    if (state.shape === 'double') {
      var h2c = window.MirrorSize.read(document.getElementById('height2')) || 0;
      ctaText = 'Здравствуйте! Хочу заказать зеркало из двух частей ' + window.MirrorSize.cm(h) + '+' + window.MirrorSize.cm(h2c) + '×' + window.MirrorSize.cm(w) + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    } else if (state.shape === 'semidouble') {
      var h2SemiCta = window.MirrorSize.read(document.getElementById('height2')) || 0;
      ctaText = 'Здравствуйте! Хочу заказать полукруг из двух частей ' + window.MirrorSize.cm(h) + '+' + window.MirrorSize.cm(h2SemiCta) + '×' + window.MirrorSize.cm(w) + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    } else {
      ctaText = 'Здравствуйте! Хочу заказать ' + SHAPE_NAMES[state.shape].toLowerCase() + ' зеркало ' + (state.shape === 'circle' ? 'Ø' + window.MirrorSize.cm(w) : window.MirrorSize.cm(h) + '×' + window.MirrorSize.cm(w)) + ' см' + (details.length ? ' — ' + details.join(', ') : '') + '. Стоимость по калькулятору: ' + fmt(Math.round(price)) + ' ₽.';
    }
    document.getElementById('r-cta').href = MAX_URL + '?text=' + encodeURIComponent(ctaText);
    if(window.updateSelectedMirrorTotal)window.updateSelectedMirrorTotal();

    var res = document.getElementById('calc-result');
    res.classList.add('show');
    if (scrollResult !== false) res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- События калькулятора ---------- */
  $all('input[name="face-frame"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState(); renderMirrorSvg();
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
      if (res && res.classList.contains('show')) calc(false);
    });
  });
  $all('input[name="option"][value="film"], input[name="option"][value="heat"], input[name="option"][value="delivery"], input[name="option"][value="alu-frame"], input[name="option"][value="led-profile"]').forEach(function (r) {
    r.addEventListener('change', function () {
      readState();
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc(false);
    });
  });
  $all('.stepper-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      adj(b.dataset.adj, (Number(b.dataset.delta) < 0 ? -1 : 1) * 10); // MirrorSize uses millimetres: 10 mm = 1 cm
    });
  });
  var sizeInputs = ['width', 'height', 'height2'];
  sizeInputs.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.removeAttribute('pattern'); // Validate dimensions only when calculating, not through native form popups.
      el.addEventListener('input', onSizeInput);
    }
  });

  var quoteForm = $('#quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('change', function (event) {
      if (!event.target.matches('input')) return;
      readState();
      renderMirrorSvg();
      var res = document.getElementById('calc-result');
      if (res && res.classList.contains('show')) calc(false);
    });
    quoteForm.addEventListener('click', function (event) {
      if (event.target.name === 'face-frame') {
        if (event.target.value === 'none') window.hideFrameExample();
        else window.showFrameExample(event.target.value, event.target);
        return;
      }
      if (event.target.name === 'clr' ||
          (event.target.name === 'facet' && ['10', '20', '25'].includes(event.target.value))) {
        // Keep option changes in place; the preview remains available above.
      }
    });
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      calc();
    });
  }

  window.calculateMirrorInPlace=function(){calc(false);};

  window.addEventListener('pageshow', function () {
    readState(); updateFilmAvailability(); updateProfileAvailability(); onSizeInput();
  });
  /* ---------- Инициализация превью ---------- */
  if (document.getElementById('mirrorSvg')) {
    setTimeout(renderMirrorSvg, 100);
    updPreview();
    onSizeInput();
    updateProfileAvailability();
  }
})();

