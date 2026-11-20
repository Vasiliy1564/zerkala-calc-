/* MAX personal contact: copy quote locally, then let the customer send it. */
(function () {
  'use strict';
  var personal = 'https://max.ru/u/f9LHodD0cOLbb_I_NfS4ans5ICo43Baa1UqtWuFJuR82JHYzk0Y3OhzIpvI';
  function notice(text) {
    var el = document.getElementById('max-bot-notice');
    if (!el) { el = document.createElement('div'); el.id = 'max-bot-notice'; el.setAttribute('role','status'); el.style.cssText='position:fixed;left:16px;right:16px;bottom:90px;z-index:9999;max-width:520px;margin:auto;padding:14px 18px;background:#171b1e;color:#fff;border-radius:14px;box-shadow:0 6px 24px #0003;font:15px/1.4 system-ui'; document.body.appendChild(el); }
    el.textContent = text; el.hidden = false;
    clearTimeout(notice.timer); notice.timer = setTimeout(function () { el.hidden = true; }, 6500);
  }
  document.addEventListener('click', function (event) {
    if (event.button && event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var target = event.target.closest && event.target.closest('a,button');
    if (!target) return;
    var text = '';
    if (target.id === 'order-send') {
      if (target.disabled || !window.getMirrorOrderText) return;
      text = window.getMirrorOrderText();
      if (!text) return;
    } else if (target.tagName === 'A') {
      var url; try { url = new URL(target.href,location.href); } catch (_) { return; }
      if (url.hostname !== 'max.ru' || (url.pathname !== new URL(personal).pathname)) return;
      text = url.searchParams.get('text') || '';
      if (!text) return;
    } else return;
    event.preventDefault(); event.stopImmediatePropagation();
    window.open(personal,'_blank','noopener,noreferrer');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { notice('Расчёт скопирован. Вставьте его в чат MAX и отправьте.'); }, function () { notice('Открылся MAX. Используйте «Скопировать расчёт» на сайте, затем вставьте текст в чат.'); });
    } else notice('Открылся MAX. Используйте «Скопировать расчёт» на сайте, затем вставьте текст в чат.');
  }, true);
})();
