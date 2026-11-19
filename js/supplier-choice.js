(()=>{'use strict';
 const form=document.getElementById('quote-form');
 if(!form||!window.MirrorSupplierPricing||!window.MirrorSize)return;
 const field=document.createElement('div');
 field.id='supplier-choice';field.className='field supplier-choice';
 field.innerHTML='<div class="supplier-choice-options"><div><b id="supplier-status" aria-live="polite">Срок изготовления рассчитывается по размеру</b></div></div>';
 form.prepend(field);
 function sync(){
  const shape=form.querySelector('input[name="shape"]:checked')?.value||'rect';
  const width=window.MirrorSize.read(document.getElementById('width'));
  const height=window.MirrorSize.read(document.getElementById('height'));
  const height2=window.MirrorSize.read(document.getElementById('height2'))||0;
  const supplier=window.MirrorSupplierPricing.selectSupplier(shape,width,height,height2);
  document.getElementById('supplier-status').textContent=(supplier==='arsenal'?'Арсенал Стекло · изготовление до 10 дней':'Риал Стекло · изготовление до 12 дней');
 }
 form.addEventListener('input',sync);form.addEventListener('change',sync);sync();
})();
