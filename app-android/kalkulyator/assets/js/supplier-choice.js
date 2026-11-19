(()=>{'use strict';
 const form=document.getElementById('quote-form');if(!form)return;
 const field=document.createElement('fieldset');field.id='supplier-choice';field.className='field supplier-choice';
 field.innerHTML='<legend>Срок изготовления зеркала</legend><div class="supplier-choice-options"><label><input type="radio" name="supplier" value="rial" checked><span><b>До 12 дней</b></span></label><label><input type="radio" name="supplier" value="arsenal"><span><b>До 8 дней</b></span></label></div>';
 form.prepend(field);
 field.addEventListener('change',()=>{if(document.getElementById('calc-result')?.classList.contains('show'))window.calculateMirrorInPlace?.();});
})();
