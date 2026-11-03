const {JSDOM, VirtualConsole}=require(process.env.CLIENT_JSDOM || 'jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),errors=[],vc=new VirtualConsole();
vc.on('jsdomError',e=>errors.push(e.message));
const html=fs.readFileSync(root+'/index.html','utf8');
const dom=new JSDOM(html,{url:'https://'+(html.includes('canonical" href="https://zerkalo-pro-spb.ru')?'zerkalo-pro-spb.ru':'www.zerkalo-pro.ru')+'/?utm_source=2gis',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;
w.scrollBy=w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
w.matchMedia=()=>({matches:false,addEventListener(){}});w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
w.confirm=()=>true;w.alert=()=>{};w.URL.createObjectURL=()=> 'blob:local-test';w.URL.revokeObjectURL=()=>{};
for(const script of d.querySelectorAll('script[src]')) w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
assert.equal(d.querySelectorAll('#pdf-calculation').length,1);
assert.equal(d.querySelectorAll('#pdf-order').length,1);
const sanitized=w.MirrorClientTools.publicQuote('Прямоугольник\nРазмеры: 80 × 75 см.\nСтоимость зеркала: 5 000 ₽.\nУстановка (со скидкой 20%): 2 000 ₽.\nСебестоимость: 1 000 ₽.\nИтого по позиции: 7 000 ₽.\nИтоговая стоимость: 7 000 ₽.');
assert.equal((sanitized.match(/₽/g)||[]).length,1);assert(sanitized.includes('Установка: включена.'));assert(!sanitized.includes('Себестоимость'));
let opened=0;w.open=()=>{opened++;return null};
for(const [id,value] of [['quick-name','Тестовый клиент'],['quick-phone','+7 (900) 000-00-00'],['quick-city','Тестовый город'],['quick-message','<b>Фото стены</b>']])d.getElementById(id).value=value;
const form=d.getElementById('contact-form');
form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(opened,0,'Preparing a request must never send/open an external service');
assert(!d.getElementById('request-review').hidden);assert(d.getElementById('request-text').value.includes('Источник обращения: 2ГИС'));
assert(d.getElementById('request-text').value.includes('<b>Фото стены</b>'));assert(!d.getElementById('request-review').querySelector('b'));
assert.equal(form.querySelector('button[type=submit]').disabled,false);
d.getElementById('quick-name').dispatchEvent(new w.Event('input',{bubbles:true}));assert(d.getElementById('request-review').hidden);
const contact=d.getElementById('quick-phone');
for(const value of ['+7','12345','+7 (900) 123-45']) {
  contact.value=value;contact.dispatchEvent(new w.Event('input',{bubbles:true}));
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert(d.getElementById('request-review').hidden,'Incomplete phone must not prepare a request');
  assert(!contact.checkValidity());
}
for(const value of ['@test_check','test_user','https://t.me/test_check','https://max.ru/u/test-check','+7 (900) 000-00-00','+44 20 7946 0958']) {
  contact.value=value;contact.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(contact.value,value,'Contact must remain exactly as entered');
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  assert(!d.getElementById('request-review').hidden);
  assert(d.getElementById('request-text').value.includes('Контакт: '+value));
}
assert.equal(opened,0,'Contact validation must never send a request');
const photos=d.getElementById('request-photos');
Object.defineProperty(photos,'files',{configurable:true,value:[new w.File(['bad'],'x.svg',{type:'image/svg+xml'})]});photos.dispatchEvent(new w.Event('change'));
assert(d.getElementById('request-status').textContent.includes('Выберите до 5 фото'));assert.equal(d.querySelectorAll('#request-preview img').length,0);
assert.deepEqual(errors,[]);dom.window.close();console.log('PASS client exports: controls, final price only, safe request preview, no auto-send, source label, invalidation and file validation');
