/* Address suggestions (OpenStreetMap / Photon) and a delivery map with a movable destination point. */
(function () {
  'use strict';
  var PHOTON = 'https://photon.komoot.io';
  var BIAS = { lat: 60.0565448, lon: 30.4290869 }; // Мурино, ул. Шувалова — the delivery origin
  var LEAFLET_JS = '/assets/vendor/leaflet/leaflet.js', LEAFLET_CSS = '/assets/vendor/leaflet/leaflet.css';

  function locality(p) { return p.city || p.town || p.village || p.hamlet || p.locality || p.district || ''; }
  function place(p) { return p.osm_key === 'place' || /^(city|town|village|hamlet|suburb|locality|isolated_dwelling|neighbourhood|quarter)$/.test(p.type || p.osm_value || ''); }
  function labelOf(p) {
    var loc = locality(p), parts;
    if (p.housenumber) parts = [loc, p.street || p.name, p.housenumber];
    else if (place(p)) parts = [p.name, p.county || p.state];
    else if (p.osm_key === 'highway') parts = [loc, p.name];
    else parts = [loc, p.street, p.name];
    var seen = {};
    // Municipal units («…сельское поселение») only add noise next to the settlement name.
    return parts.filter(function (x) { if (!x || seen[x] || /поселени/i.test(x)) return false; seen[x] = true; return true; }).join(', ');
  }
  function toFeature(f) {
    var p = f.properties || {}, c = f.geometry && f.geometry.coordinates;
    if (!c || !isFinite(c[0]) || !isFinite(c[1])) return null;
    var label = labelOf(p);
    if (!label) return null;
    return { properties: { label: label }, geometry: { coordinates: [c[0], c[1]] }, approx: !p.housenumber, source: 'photon' };
  }
  function unique(list) {
    var seen = {};
    return list.filter(function (f) { if (!f || seen[f.properties.label]) return false; seen[f.properties.label] = true; return true; });
  }
  async function getJSON(url, ms) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms || 8000);
    try { var r = await fetch(url, { signal: c.signal, credentials: 'omit' }); if (!r.ok) throw Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  async function search(query, limit) {
    var url = PHOTON + '/api/?q=' + encodeURIComponent(query) + '&limit=' + (limit || 7) + '&lat=' + BIAS.lat + '&lon=' + BIAS.lon;
    var data = await getJSON(url);
    return { features: unique((data.features || []).map(toFeature)).slice(0, 6), source: 'photon' };
  }
  async function reverse(lat, lon) {
    try {
      var data = await getJSON(PHOTON + '/reverse?lat=' + lat + '&lon=' + lon + '&limit=1', 6000);
      var f = data.features && data.features[0] && toFeature(data.features[0]);
      if (f) return f.properties.label;
    } catch (e) {}
    return '';
  }
  window.MirrorPhoton = { search: search, reverse: reverse };

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var input = document.getElementById('delivery-address'), list = document.getElementById('delivery-candidates');
    var status = document.getElementById('delivery-route-status'), slot = document.getElementById('delivery-map-slot');
    var option = document.querySelector('input[name="option"][value="delivery"]');
    if (!input || !list || !slot || !window.MirrorDelivery) return;

    /* ---------- Suggestions while typing ---------- */
    var timer = null, asked = 0;
    function pick(f) {
      list.replaceChildren();
      window.MirrorDelivery.choose(f);
    }
    function suggest(features, token) {
      if (token !== asked || !features.length) return;
      list.replaceChildren();
      features.forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'delivery-candidate' + (f.approx ? ' delivery-candidate--approx' : '');
        b.textContent = f.properties.label;
        if (f.approx) { var s = document.createElement('small'); s.textContent = 'населённый пункт или улица — посчитаем до центра'; b.appendChild(s); }
        b.addEventListener('click', function () { pick(f); });
        list.appendChild(b);
      });
      status.textContent = 'Выберите адрес из подсказок или нажмите на карте.';
    }
    input.setAttribute('placeholder', 'Начните вводить: посёлок, город, улица, дом');
    input.setAttribute('autocomplete', 'off');
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim(), token = ++asked;
      if (q.length < 3) return;
      timer = setTimeout(function () {
        search(q).then(function (r) { suggest(r.features, token); }).catch(function () {});
      }, 400);
    });

    /* ---------- Map ---------- */
    var box = document.createElement('div');
    box.className = 'delivery-map-box';
    box.innerHTML = '<div id="delivery-map" class="delivery-map" role="application" aria-label="Карта доставки"></div>' +
      '<p class="delivery-map-hint">Нет точного адреса? Нажмите на карте или перетащите точку — доставку посчитаем до неё.</p>';
    slot.appendChild(box);
    var map = null, dest = null, line = null, loading = null;

    function loadLeaflet() {
      if (window.L) return Promise.resolve();
      if (loading) return loading;
      loading = new Promise(function (resolve, reject) {
        var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = LEAFLET_CSS; document.head.appendChild(css);
        var js = document.createElement('script'); js.src = LEAFLET_JS; js.onload = resolve; js.onerror = reject; document.head.appendChild(js);
      });
      return loading;
    }
    function icon(cls) { return window.L.divIcon({ className: 'delivery-pin ' + cls, iconSize: [22, 22], iconAnchor: [11, 11] }); }
    async function setPoint(latlng) {
      status.textContent = 'Определяем адрес точки…';
      var lat = Math.round(latlng.lat * 1e6) / 1e6, lon = Math.round(latlng.lng * 1e6) / 1e6;
      var label = await reverse(lat, lon);
      window.MirrorDelivery.choose({ properties: { label: (label ? label + ' ' : 'Точка на карте ') + '(' + lat.toFixed(5) + ', ' + lon.toFixed(5) + ')' }, geometry: { coordinates: [lon, lat] }, approx: false });
    }
    function draw() {
      if (!map) return;
      var r = window.MirrorDelivery.getRoute(), L = window.L;
      if (line) { map.removeLayer(line); line = null; }
      if (!r || !r.point) return;
      var ll = [r.point[1], r.point[0]];
      if (!dest) {
        dest = L.marker(ll, { draggable: true, icon: icon('delivery-pin--dest'), title: 'Адрес доставки' }).addTo(map);
        dest.on('dragend', function () { setPoint(dest.getLatLng()); });
      } else dest.setLatLng(ll);
      if (r.geometry && r.geometry.coordinates) {
        line = L.polyline(r.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }), { color: '#174936', weight: 4, opacity: .75 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 14 });
      } else map.fitBounds(L.latLngBounds([[BIAS.lat, BIAS.lon], ll]), { padding: [24, 24], maxZoom: 14 });
    }
    function init() {
      if (map) { map.invalidateSize(); return; }
      loadLeaflet().then(function () {
        var L = window.L;
        map = L.map('delivery-map', { scrollWheelZoom: false, tap: true }).setView([BIAS.lat, BIAS.lon], 10);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
        L.marker([BIAS.lat, BIAS.lon], { icon: icon('delivery-pin--origin'), title: 'Мастерская, Мурино', keyboard: false }).addTo(map).bindTooltip('Отсюда везём');
        map.on('click', function (e) { setPoint(e.latlng); });
        draw();
      }).catch(function () { box.hidden = true; });
    }
    function visible() { var panel = document.getElementById('delivery-address-panel'); return panel && !panel.hidden; }
    if (option) option.addEventListener('change', function () { if (visible()) setTimeout(init, 50); });
    if (visible()) init();
    window.addEventListener('mirror-delivery-change', function () { if (visible()) { if (!map) init(); else draw(); } });
  });
})();
