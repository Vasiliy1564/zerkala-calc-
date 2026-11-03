/* Client-only quote export and explicit sharing. No prices or personal details are stored. */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[src*="js/client-tools.js"]');
  var bundle = new URL('../assets/client-tools/export.js', script.src).href;
  var isSpb = document.querySelector('link[rel="canonical"]').href.indexOf('spb') !== -1;
  var meta = { city: isSpb ? 'Санкт-Петербург' : 'Ставрополь', site: isSpb ? 'zerkalo-pro-spb.ru' : 'www.zerkalo-pro.ru' };
  var form = document.getElementById('contact-form');
  var files = [], objectUrls = [], draft = '', modulePromise;
  function byId(id) { return document.getElementById(id); }
  function loadExport() { return modulePromise || (modulePromise = import(bundle).catch(function (error) { modulePromise = null; throw error; })); }
  function save(blob, name) {
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function publicQuote(value) {
    return String(value || '').split('\n').map(function (line) {
      if (/^(?:Итоговая стоимость|Предварительная стоимость|Итого без несогласованного подъёма):/.test(line)) return line;
      if (/^(?:Стоимость (?:зеркал|зеркала|позиции)|Итого по позиции|Скидка|Наценка|Себестоимость|Прибыль|Заработок|Расходы)/.test(line)) return '';
      if (/^Установка/.test(line) && /₽/.test(line)) return 'Установка: включена.';
      if (/^Подъём/.test(line) && /₽/.test(line)) return 'Подъём: включён в указанную стоимость.';
      if (/^(?:Доплата за доставку|Доставка):/.test(line) && /₽/.test(line)) return 'Доставка: включена в указанную стоимость.';
      if (/^Адрес доставки:/.test(line)) return line.replace(/(?:Доплата за доставку|Доставка):.*₽\.?/, 'Доставка включена в указанную стоимость.');
      // No unknown monetary breakdown may enter a client export.
      if (/₽/.test(line)) return '';
      return line;
    }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function quote(order) {
    if (!order && window.calculateMirrorInPlace) window.calculateMirrorInPlace();
    return publicQuote(order && window.getMirrorOrderText ? window.getMirrorOrderText() : window.getMirrorSelectionText ? window.getMirrorSelectionText() : '');
  }
  function action(label, id) {
    var button = document.createElement('button'); button.type = 'button'; button.id = id; button.className = 'button button--light'; button.textContent = label; return button;
  }
  async function pdf(value, button, notice) {
    if (!value) { notice.textContent = 'Сначала укажите размеры и рассчитайте стоимость.'; return; }
    button.disabled = true; notice.textContent = 'Готовим PDF…';
    try { var exporter = await loadExport(); save(await exporter.createPdf(value, meta), 'Zerkalo-Pro-raschet.pdf'); notice.textContent = 'PDF подготовлен. Проверьте загрузки браузера.'; }
    catch (error) { notice.textContent = 'Не удалось подготовить PDF. Попробуйте ещё раз или скопируйте расчёт.'; }
    finally { button.disabled = false; }
  }
  function addPdf(anchor, order) {
    if (!anchor) return;
    var button = action('Скачать расчёт PDF', order ? 'pdf-order' : 'pdf-calculation');
    var notice = document.createElement('p'); notice.className = 'client-tools-note'; notice.setAttribute('role', 'status');
    anchor.after(button, notice); button.addEventListener('click', function () { pdf(quote(order), button, notice); });
  }
  addPdf(byId('copy-calculation'), false); addPdf(byId('copy-order'), true);
  // Capture only a bounded source label, never referrer URLs or personal query parameters.
  var source = '';
  try {
    var requested = new URL(location.href).searchParams.get('utm_source');
    var allowed = { instagram: 'Instagram', '2gis': '2ГИС', yandex_maps: 'Яндекс Карты', avito: 'Авито' };
    if (allowed[requested]) sessionStorage.setItem('mirror-request-source', requested);
    source = allowed[sessionStorage.getItem('mirror-request-source')] || '';
  } catch (error) {}
  if (!form) return;
  var message = byId('quick-message');
  var extra = document.createElement('div'); extra.className = 'client-request-extra';
  extra.innerHTML = '<div class="field"><label for="request-address">Район или адрес замера (необязательно)</label><input id="request-address" type="text" maxlength="300" autocomplete="street-address"></div>' +
    '<div class="field"><label for="request-photos">Фото стены или пример зеркала</label><input id="request-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><p class="client-tools-note">До 5 фото JPG, PNG или WebP, по 10 МБ, всего до 25 МБ. Фото остаются на устройстве до передачи через выбранный вами мессенджер.</p><div id="request-preview" class="request-preview"></div><button type="button" id="request-clear-photos" class="request-text-button" hidden>Убрать фотографии</button></div>' +
    '<label class="request-check"><input id="request-with-quote" type="checkbox"> Приложить расчёт из калькулятора</label>' +
    '<div id="request-quote-kind" hidden><label for="request-quote-select">Какой расчёт приложить</label><select id="request-quote-select"><option value="single">Выбранное зеркало</option><option value="order">Весь заказ из корзины</option></select></div>';
  message.closest('.field').after(extra);
  ['quick-name', 'quick-phone', 'quick-city', 'quick-message'].forEach(function (id) { byId(id).maxLength = id === 'quick-message' ? 2000 : 120; });
  var submit = form.querySelector('button[type="submit"]'); submit.textContent = 'Подготовить заявку';
  var review = document.createElement('section'); review.id = 'request-review'; review.hidden = true; review.className = 'request-review';
  review.innerHTML = '<h4>Проверьте заявку</h4><textarea id="request-text" readonly aria-label="Текст заявки для отправки" rows="10"></textarea><p class="client-tools-note">Заявка ещё не отправлена. Выберите способ передачи ниже.</p><div class="request-actions"><button type="button" class="button" id="request-share">Поделиться заявкой и фото</button><button type="button" class="button button--light" id="request-copy-max">Скопировать текст и открыть MAX</button><button type="button" class="button button--light" id="request-archive">Скачать заявку с фото</button></div>';
  form.appendChild(review);
  var status = document.createElement('p'); status.id = 'request-status'; status.className = 'client-tools-note'; status.setAttribute('role', 'status'); form.appendChild(status);
  var maxLink = document.querySelector('.contact-meta a[href^="https://max.ru/"]');
  var maxUrl = maxLink && maxLink.href.split('?')[0];
  byId('request-with-quote').addEventListener('change', function () { byId('request-quote-kind').hidden = !this.checked; invalidate(); });
  function invalidate() { if (draft) status.textContent = 'Данные изменены. Подготовьте заявку ещё раз.'; draft = ''; review.hidden = true; }
  function clearPhotos() { objectUrls.forEach(function (url) { URL.revokeObjectURL(url); }); objectUrls = []; files = []; byId('request-preview').replaceChildren(); byId('request-clear-photos').hidden = true; }
  byId('request-photos').addEventListener('change', function () {
    invalidate(); clearPhotos(); status.textContent = '';
    var selected = Array.from(this.files || []), sum = selected.reduce(function (total, file) { return total + file.size; }, 0);
    if (selected.length > 5 || sum > 25 * 1024 * 1024 || selected.some(function (file) { return file.size > 10 * 1024 * 1024 || ['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) < 0; })) {
      this.value = ''; status.textContent = 'Выберите до 5 фото JPG, PNG или WebP: до 10 МБ на фото и до 25 МБ всего.'; return;
    }
    files = selected;
    files.forEach(function (file) { var image = document.createElement('img'); image.alt = file.name; image.src = URL.createObjectURL(file); objectUrls.push(image.src); byId('request-preview').appendChild(image); });
    byId('request-clear-photos').hidden = !files.length;
  });
  byId('request-clear-photos').addEventListener('click', function () { clearPhotos(); byId('request-photos').value = ''; invalidate(); });
  form.addEventListener('input', function (event) { if (event.target.id !== 'request-text') invalidate(); });
  byId('request-quote-select').addEventListener('change', invalidate);
  form.addEventListener('submit', function (event) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    var selectedQuote = '';
    if (byId('request-with-quote').checked) {
      selectedQuote = quote(byId('request-quote-select').value === 'order');
      if (!selectedQuote) { status.textContent = 'Сначала рассчитайте зеркало или добавьте позиции в корзину. Можно снять галочку «Приложить расчёт».'; return; }
    }
    var lines = ['Заявка «Зеркало Pro» · ' + meta.city, 'Имя: ' + byId('quick-name').value.trim(), 'Контакт: ' + byId('quick-phone').value.trim(), 'Город: ' + byId('quick-city').value.trim()];
    var address = byId('request-address').value.trim(); if (address) lines.push('Район / адрес: ' + address);
    if (message.value.trim()) lines.push('Пожелания: ' + message.value.trim());
    if (source) lines.push('Источник обращения: ' + source);
    if (selectedQuote) lines.push('', selectedQuote);
    if (files.length) lines.push('', 'Фотографий: ' + files.length + '.');
    draft = lines.join('\n'); byId('request-text').value = draft; review.hidden = false;
    byId('request-share').hidden = !(navigator.share && navigator.canShare);
    status.textContent = 'Заявка подготовлена, но ещё не отправлена.';
  }, true);
  byId('request-share').addEventListener('click', async function () {
    if (!draft) return;
    var payload = { title: 'Заявка «Зеркало Pro»', text: draft };
    if (files.length) payload.files = [new File(['\uFEFF' + draft], 'Zayavka.txt', { type: 'text/plain' })].concat(files);
    if (!navigator.canShare || !navigator.canShare(payload)) { status.textContent = 'Передача этих файлов недоступна в браузере. Скачайте заявку с фото и прикрепите архив в MAX.'; return; }
    try { await navigator.share(payload); status.textContent = 'Заявка передана выбранному приложению. Проверьте и подтвердите отправку в нём.'; }
    catch (error) { status.textContent = error.name === 'AbortError' ? 'Передача отменена. Заявка не отправлена.' : 'Передать заявку не удалось. Скачайте архив или скопируйте текст.'; }
  });
  byId('request-copy-max').addEventListener('click', function () {
    if (!draft || !maxUrl) return;
    // Open only the contact URL. Contact data is copied locally, not placed in a URL.
    window.open(maxUrl, '_blank', 'noopener,noreferrer');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(draft).then(function () { status.textContent = 'Текст скопирован. Вставьте его в MAX' + (files.length ? ' и прикрепите фото или скачанный архив' : '') + ', затем отправьте сообщение.'; }).catch(manualCopy);
    else manualCopy();
  });
  function manualCopy() { byId('request-text').focus(); byId('request-text').select(); status.textContent = 'Скопируйте выделенный текст и вставьте в MAX. Фотографии прикрепите отдельно.'; }
  byId('request-archive').addEventListener('click', async function () {
    if (!draft) return;
    var button = this, value = draft, selectedFiles = files.slice(); button.disabled = true; status.textContent = 'Готовим архив…';
    try { var exporter = await loadExport(); save(await exporter.createArchive(value, selectedFiles), 'Zerkalo-Pro-zayavka.zip'); status.textContent = 'Архив подготовлен. Прикрепите его в MAX и отправьте сообщение.'; }
    catch (error) { status.textContent = 'Не удалось подготовить архив. Скопируйте текст и прикрепите фото вручную.'; }
    finally { button.disabled = false; }
  });
  window.MirrorClientTools = { publicQuote: publicQuote };
})();
