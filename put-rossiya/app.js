(function () {
  'use strict';
  const API = (window.PUT_RU_API || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const say = t => { $('status').textContent = t || ''; };
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };

  const state = { city: null, a: null, b: null, mode: 'walking', layers: null };

  // ---------- карта ----------
  const map = L.map('map', { zoomControl: true, minZoom: 3, maxZoom: 19, attributionControl: true }).setView([61.5, 90], 3);
  map.attributionControl.setPrefix(false);
  L.tileLayer(API + '/api/tile?z={z}&x={x}&y={y}', { minZoom: 3, maxZoom: 19, attribution: '© 2ГИС' })
    .on('tileerror', () => say('Карта пока не загрузилась. Проверьте адрес сервера в config.js.'))
    .addTo(map);
  state.layers = L.layerGroup().addTo(map);

  function pin(p, label, color) {
    return L.marker([p.lat, p.lon], {
      icon: L.divIcon({ className: '', html: '<span class="pin" style="background:' + color + '">' + label + '</span>', iconSize: [30, 30], iconAnchor: [15, 15] })
    });
  }
  function redraw(route) {
    state.layers.clearLayers();
    if (state.a) pin(state.a, 'А', '#655b4c').addTo(state.layers);
    if (state.b) pin(state.b, 'Б', '#246d47').addTo(state.layers);
    if (route && route.coords.length) {
      const line = L.polyline(route.coords, { color: '#1859b5', weight: 5 }).addTo(state.layers);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
    }
    $('go').disabled = !(state.a && state.b);
    $('aName').textContent = state.a ? state.a.name : 'не выбрано';
    $('bName').textContent = state.b ? state.b.name : 'не выбрано';
  }

  // ---------- запросы ----------
  async function api(path, params) {
    const r = await fetch(API + path + '?' + new URLSearchParams(params));
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((j && j.error) || 'Ошибка ' + r.status);
    return j;
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  // ---------- выбор населённого пункта ----------
  function setCity(c) {
    state.city = c;
    $('cityNow').textContent = 'Выбрано: ' + c.full;
    $('cityList').replaceChildren();
    $('placeGo').disabled = false;
    map.setView([c.lat, c.lon], c.type === 'adm_div.settlement' ? 14 : 12);
    try { localStorage.setItem('putRuCity', JSON.stringify(c)); } catch (e) {}
    say('');
  }
  const findCity = debounce(async () => {
    const q = $('cityQ').value.trim();
    if (q.length < 2) { $('cityList').replaceChildren(); return; }
    try {
      const { items } = await api('/api/search', { kind: 'city', q });
      const box = $('cityList'); box.replaceChildren();
      if (!items.length) { say('Ничего не найдено. Попробуйте другое написание.'); return; }
      say('');
      for (const c of items) {
        const b = el('button'); b.type = 'button';
        b.append(el('strong', c.name), el('small', c.full));
        b.onclick = () => setCity(c);
        box.append(b);
      }
    } catch (e) { say('Поиск не работает: ' + e.message); }
  }, 350);
  $('cityQ').addEventListener('input', findCity);

  // ---------- поиск мест ----------
  function addPlaceButton(row, p) {
    const b = el('button'); b.type = 'button';
    b.append(el('strong', p.name), el('small', p.address || p.full));
    b.onclick = () => {
      map.setView([p.lat, p.lon], 17);
      const act = el('div', null, 'row');
      const fromB = el('button', 'Откуда'), toB = el('button', 'Куда');
      fromB.type = toB.type = 'button';
      fromB.onclick = () => { state.a = p; redraw(); say('Точка А: ' + p.name); };
      toB.onclick = () => { state.b = p; redraw(); say('Точка Б: ' + p.name); };
      act.append(fromB, toB);
      const old = row.querySelector('.row'); if (old) old.remove();
      row.append(act);
    };
    row.prepend(b);
  }
  $('placeGo').onclick = async () => {
    const q = $('placeQ').value.trim();
    if (q.length < 2) { say('Введите, что искать.'); return; }
    const c = map.getCenter();
    try {
      const { items } = await api('/api/search', { kind: 'place', q, lat: c.lat, lon: c.lng });
      const box = $('placeList'); box.replaceChildren();
      if (!items.length) { say('Рядом ничего не найдено. Сдвиньте карту или измените запрос.'); return; }
      say('');
      for (const p of items) { const row = el('div'); addPlaceButton(row, p); box.append(row); }
    } catch (e) { say('Поиск не работает: ' + e.message); }
  };

  // ---------- маршрут ----------
  $('here').onclick = () => {
    if (!navigator.geolocation) { say('Геолокация недоступна на этом устройстве.'); return; }
    say('Определяем место…');
    navigator.geolocation.getCurrentPosition(
      p => { state.a = { name: 'Моё место', lat: p.coords.latitude, lon: p.coords.longitude }; redraw(); map.setView([state.a.lat, state.a.lon], 16); say(''); },
      () => say('Не удалось определить место. Разрешите доступ к геопозиции.'),
      { enableHighAccuracy: true, timeout: 15000 });
  };
  $('swap').onclick = () => { [state.a, state.b] = [state.b, state.a]; redraw(); };
  function setMode(m) {
    state.mode = m;
    $('mWalk').setAttribute('aria-pressed', String(m === 'walking'));
    $('mDrive').setAttribute('aria-pressed', String(m === 'driving'));
  }
  $('mWalk').onclick = () => setMode('walking');
  $('mDrive').onclick = () => setMode('driving');
  $('go').onclick = async () => {
    $('go').disabled = true; say('Строим маршрут…');
    try {
      const r = await api('/api/route', { from: state.a.lat + ',' + state.a.lon, to: state.b.lat + ',' + state.b.lon, mode: state.mode });
      redraw(r); say('');
      const km = r.distance >= 1000 ? (r.distance / 1000).toFixed(1) + ' км' : Math.round(r.distance) + ' м';
      const min = Math.max(1, Math.round(r.duration / 60));
      $('routeInfo').textContent = km + ' · около ' + (min >= 60 ? Math.floor(min / 60) + ' ч ' + (min % 60) + ' мин' : min + ' мин');
      const ol = $('steps'); ol.replaceChildren();
      for (const s of r.steps) ol.append(el('li', s));
    } catch (e) { say('Маршрут не построен: ' + e.message); }
    $('go').disabled = !(state.a && state.b);
  };

  $('spb').onclick = () => { location.href = window.PUT_SPB_URL; };

  // восстановить последний выбранный пункт
  try { const c = JSON.parse(localStorage.getItem('putRuCity') || 'null'); if (c && c.lat) setCity(c); } catch (e) {}
  if (!API && location.protocol === 'file:') say('Укажите адрес сервера в config.js (PUT_RU_API).');
})();
