(()=>{'use strict';
 function due(days){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  const date=new Date(Date.UTC(parts.year,parts.month-1,parts.day+days));
  return {iso:date.toISOString().slice(0,10),label:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date)};
 }
 window.MirrorProductionDate={due:due,text:function(days){return 'Изготовление до '+days+' дней · ориентировочно до '+due(days).label;}};
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
  document.getElementById('supplier-status').textContent=window.MirrorProductionDate.text(supplier==='arsenal'?10:13);
 }
 form.addEventListener('input',sync);form.addEventListener('change',sync);sync();
})();
