/* Keeps Gemini's 3D view in sync with the existing Zerkalo Pro price calculator. */
(() => {
  'use strict';
  const form = document.getElementById('quote-form');
  const preview = document.querySelector('.calculator .calc-preview');
  if (!form || !preview) return;

  const shell = document.createElement('div');
  shell.className = 'zp3d-shell';
  shell.innerHTML = '<iframe title="Интерактивная 3D-визуализация зеркала" loading="lazy" allow="fullscreen"></iframe>' +
    '<button class="zp3d-expand" type="button" aria-label="Открыть 3D-конфигуратор">Открыть 3D на весь экран</button>' +
    '<button class="zp3d-close" type="button" aria-label="Закрыть 3D-конфигуратор">×</button>';
  preview.prepend(shell);
  preview.classList.add('zp3d-enabled');
  const frame = shell.querySelector('iframe');
  const knownShapes = {rect:'rect',rounded:'rounded',circle:'circle',oval:'capsule',arch:'arch',curved:'wave',semicircle:'arch',semidouble:'split_semi',double:'rect'};
  const from3D = {rect:'rect',rounded:'rounded',circle:'circle',capsule:'oval',arch:'arch',wave:'curved',cloud:'curved',sail:'curved',split_semi:'semidouble'};
  let ready = false;
  let syncing = false;
  let timer = 0;

  const checked = name => form.querySelector('input[name="' + name + '"]:checked')?.value;
  const millimetres = id => Math.round(Number(String(document.getElementById(id)?.value || '').replace(',', '.')) * 10);
  const select = (name, value) => {
    const el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el && !el.checked) {el.checked = true; el.dispatchEvent(new Event('change', {bubbles:true}));}
  };
  const config = () => {
    const shape = checked('shape') || 'rect';
    const tint = checked('material') || 'silver';
    const sand = checked('mirror-sand') || 'none';
    return {
      shape: knownShapes[shape] || 'rect',
      widthMm: millimetres('width'),
      heightMm: shape === 'circle' ? millimetres('width') : millimetres('height'),
      tint: ['silver','bronze','graphite'].includes(tint) ? tint : 'silver',
      frame: checked('face-frame') || 'none',
      ledMode: checked('light') === 'off' ? 'off' : sand === 'none' ? 'ambient' : 'both',
      ledTemp: ({warm:'warm',neutral:'neutral',cold:'cool'})[checked('clr')] || 'warm',
      sandblast: sand === 'none' ? 'none' : 'perimeter'
    };
  };
  const post = message => {if (ready && frame.contentWindow) frame.contentWindow.postMessage(message, location.origin);};
  const sync = () => {
    if (syncing) return;
    clearTimeout(timer);
    timer = setTimeout(() => post({type:'zp3d:sync', config:config()}), 50);
  };
  const price = () => {
    const total = document.getElementById('r-sum')?.textContent?.trim();
    if (total && total !== '—') post({type:'zp3d:price',title:total,subtitle:document.getElementById('supplier-status')?.textContent || 'Расчёт Зеркало Pro'});
  };
  frame.addEventListener('load', () => {ready = true; post({type:'zp3d:mode',preview:!shell.classList.contains('zp3d-expanded')}); sync(); price();});
  frame.src = 'atelier/?embed=1';
  form.addEventListener('change', sync);
  form.addEventListener('input', sync);
  form.addEventListener('submit', () => setTimeout(price, 100));
  document.addEventListener('click', event => {if (event.target.closest('#quote-form button[type="submit"]')) setTimeout(price, 100);});

  const expand = shell.querySelector('.zp3d-expand');
  const close = shell.querySelector('.zp3d-close');
  expand.addEventListener('click', () => {shell.classList.add('zp3d-expanded');document.body.classList.add('zp3d-open');post({type:'zp3d:mode',preview:false});});
  close.addEventListener('click', () => {shell.classList.remove('zp3d-expanded');document.body.classList.remove('zp3d-open');post({type:'zp3d:mode',preview:true});sync();});
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && shell.classList.contains('zp3d-expanded')) close.click();});

  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'zp3d:error') {
      preview.classList.add('zp3d-failed');
      preview.classList.remove('zp3d-enabled');
      shell.classList.remove('zp3d-expanded');
      document.body.classList.remove('zp3d-open');
      return;
    }
    if (event.origin !== location.origin || event.source !== frame.contentWindow || !ready || event.data?.type !== 'zp3d:changed') return;
    const c = event.data.config;
    if (!c || !from3D[c.shape]) return;
    syncing = true;
    try {
      select('shape',from3D[c.shape]);
      if (['cloud','sail'].includes(c.shape)) {
        const category = document.getElementById('supplier-category');
        if (category) category.value = 'quoted'; // Complex forms have no agreed supplier rate.
      }
      const dimensions = [['width',c.widthMm],['height',c.heightMm]];
      for (const [id,mm] of dimensions) {
        const el = document.getElementById(id);
        if (el && Number.isFinite(mm)) {el.value = String(mm / 10).replace('.',',');el.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      if (['silver','bronze','graphite'].includes(c.tint)) select('material',c.tint);
      if (['none','black','white','gold'].includes(c.frame)) select('face-frame',c.frame);
      select('light',c.ledMode === 'off' ? 'off' : 'on');
      select('clr',c.ledTemp === 'cool' ? 'cold' : c.ledTemp);
      if (c.sandblast === 'none') select('mirror-sand','none');
      // Etched bands need a measured area before they can be priced; the existing form handles that input.
      if (c.sandblast !== 'none') select('mirror-sand','pattern');
      window.calculateMirrorInPlace?.();
      setTimeout(price, 100);
    } finally {syncing = false;}
  });
})();
