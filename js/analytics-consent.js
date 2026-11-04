(function () {
  'use strict';
  var script = document.currentScript;
  if (!script || window.ZerkaloAnalyticsConsent) return;
  var cfg = script.dataset;
  var version = cfg.version || '2026-11-04.2';
  var key = 'zerkalo-analytics-consent';
  var days = 180;
  var loaded = false;
  var panel;
  var ready = cfg.enabled === 'true' && /^\d+$/.test(cfg.counter || '') &&
    cfg.operatorName && cfg.operatorAddress && cfg.operatorContact &&
    cfg.policyUrl && cfg.consentUrl;

  function read() {
    try {
      var record = JSON.parse(localStorage.getItem(key));
      if (!record || record.version !== version ||
          !['accepted', 'rejected'].includes(record.choice) ||
          !Number.isFinite(record.at) || record.at > Date.now() ||
          Date.now() - record.at >= days * 86400000) return null;
      return record;
    } catch (_) { return null; }
  }
  function write(choice) {
    var record = {choice: choice, version: version, at: Date.now()};
    try { localStorage.setItem(key, JSON.stringify(record)); } catch (_) {}
    return record;
  }
  function clearCookies() {
    var domains = location.hostname.split('.');
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!/^_ym_/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
      for (var i = 0; i < domains.length - 1; i++) {
        var domain = domains.slice(i).join('.');
        document.cookie = name + '=; Max-Age=0; Path=/; Domain=' + domain + '; SameSite=Lax';
        document.cookie = name + '=; Max-Age=0; Path=/; Domain=.' + domain + '; SameSite=Lax';
      }
    });
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var name = localStorage.key(i);
        if (/^_ym_/.test(name)) localStorage.removeItem(name);
      }
    } catch (_) {}
  }
  function start(record) {
    if (!ready || loaded || !record || record.choice !== 'accepted') return;
    loaded = true;
    // Forms, addresses and contact details must never be recorded.
    document.querySelectorAll('form, input, textarea, [contenteditable]').forEach(function (el) {
      el.classList.add('ym-disable-keys', 'ym-hide-content');
    });
    (function (m,e,t,r,i,k,a) {
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
    })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id='+cfg.counter,'ym');
    window.ym(Number(cfg.counter), 'init', {
      webvisor: false, clickmap: false, trackLinks: true,
      accurateTrackBounce: true,
      // Keep free-form query parameters and fragments out of analytics URLs.
      url: location.origin + location.pathname,
      referrer: '',
      params: {analytics_consent: {version: version, accepted_at: new Date(record.at).toISOString()}}
    });
  }
  function reject() {
    write('rejected');
    clearCookies();
    if (loaded && window.ym) {
      window.ym(Number(cfg.counter), 'destruct');
      // Reload removes the already-loaded third-party runtime.
      location.reload();
      return;
    }
    if (panel) panel.remove();
    panel = null;
  }
  function button(text, action) {
    var el = document.createElement('button');
    el.type = 'button'; el.textContent = text;
    el.addEventListener('click', action);
    return el;
  }
  function open() {
    if (panel) { panel.querySelector('button').focus(); return; }
    panel = document.createElement('section');
    panel.id = 'analytics-consent-panel';
    panel.setAttribute('aria-label', 'Настройки аналитики');
    panel.setAttribute('role', 'region');
    var title = document.createElement('strong');
    title.textContent = 'Настройки аналитики'; panel.appendChild(title);
    var text = document.createElement('p');
    text.textContent = ready
      ? 'Разрешить Яндекс Метрике собирать статистику посещений? Аналитика необязательна: отказ не мешает пользоваться сайтом. Вебвизор и запись полей форм отключены.'
      : 'Аналитика отключена. Сайт не запускает Яндекс Метрику и Вебвизор.';
    panel.appendChild(text);
    if (ready) {
      var links = document.createElement('p');
      [['Политика обработки данных', cfg.policyUrl], ['Отдельное согласие на аналитику', cfg.consentUrl]].forEach(function (item) {
        var a = document.createElement('a'); a.textContent = item[0]; a.href = item[1];
        a.target = '_blank'; a.rel = 'noopener'; links.appendChild(a); links.appendChild(document.createTextNode(' '));
      });
      panel.appendChild(links);
      panel.appendChild(button('Разрешить аналитику', function () {
        var record = write('accepted'); start(record); panel.remove(); panel = null;
      }));
      panel.appendChild(button(loaded ? 'Отозвать согласие' : 'Отказаться', reject));
    } else {
      panel.appendChild(button('Закрыть', function () { panel.remove(); panel = null; }));
    }
    document.body.appendChild(panel);
  }
  function mount() {
    var style = document.createElement('style');
    style.textContent = '#analytics-consent-panel{position:fixed;z-index:2147483647;bottom:16px;left:16px;right:16px;max-width:680px;margin:auto;padding:20px;border:1px solid #bbb;border-radius:12px;background:#fff;color:#202020;box-shadow:0 4px 24px #0003;font:16px/1.5 system-ui;max-height:80vh;overflow:auto}#analytics-consent-panel p{margin:10px 0}#analytics-consent-panel button{font:inherit;padding:10px 14px;margin:4px;border:1px solid #505050;background:#fff;color:#202020;border-radius:6px;cursor:pointer}#analytics-consent-panel a{color:#164da6;text-decoration:underline}.analytics-settings-button{display:block;margin:12px auto;padding:8px 12px;font:14px/1.4 system-ui;border:1px solid #888;border-radius:5px;background:#fff;color:#222;cursor:pointer}';
    document.head.appendChild(style);
    var settings = button('Настройки аналитики', open);
    settings.className = 'analytics-settings-button';
    (document.querySelector('footer') || document.body).appendChild(settings);
    var record = read();
    if (!ready || !record || record.choice !== 'accepted') clearCookies();
    if (!ready) return;
    if (record && record.choice === 'accepted') start(record);
    else if (!record) open();
  }
  window.ZerkaloAnalyticsConsent = {open: open};
  window.addEventListener('storage', function (event) {
    if (event.key !== key) return;
    var record = read();
    if (loaded && (!record || record.choice !== 'accepted')) location.reload();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
