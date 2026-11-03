(function(){
'use strict';
var form=document.getElementById('quote-form'),label=document.createElement('label');label.id='carry-option';
label.innerHTML='<input type="checkbox" name="carry-enabled" id="carry-enabled"><span>Подъём до квартиры</span>';
document.getElementById('deliveryOpt').before(label);
var panel=document.createElement('div');panel.id='carry-fields';panel.hidden=true;
panel.innerHTML='<label for="carry-floor">Этаж</label><input id="carry-floor" type="number" inputmode="numeric" min="1" max="999" step="1" value="1"><label for="carry-method">Способ подъёма</label><select id="carry-method"><option value="lift">На лифте — зеркало помещается</option><option value="stairs">Пешком</option></select><p id="carry-status" role="status"></p>';
label.after(panel);
var enabled=document.getElementById('carry-enabled'),floor=document.getElementById('carry-floor'),method=document.getElementById('carry-method'),status=document.getElementById('carry-status');
function read(){return {enabled:enabled.checked,floor:floor.value,method:method.value};}
function view(){panel.hidden=!enabled.checked;var n=Number(floor.value);status.textContent=!Number.isInteger(n)||n<1||n>999?'Укажите этаж от 1 до 999.':n===1?'Первый этаж — без доплаты.':method.value==='stairs'&&n>20?'Выше 20-го этажа пешком — по согласованию.':'Если зеркало не помещается в лифт, выберите «Пешком».';}
function change(){view();if(window.calculateMirrorInPlace)window.calculateMirrorInPlace();}
enabled.addEventListener('change',change);floor.addEventListener('input',change);method.addEventListener('change',change);
window.MirrorCarry={read:read,restore:function(value){var o=value||{};enabled.checked=!!o.enabled;floor.value=o.floor===undefined?'1':o.floor;method.value=o.method==='stairs'?'stairs':'lift';view();}};
view();
})();
