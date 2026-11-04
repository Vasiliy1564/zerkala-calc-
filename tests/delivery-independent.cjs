const {JSDOM,VirtualConsole}=require(process.env.CLIENT_JSDOM||'jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(process.env.DELIVERY_APP_ROOT||path.join(__dirname,'..')),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://zerkalo-pro-spb.ru/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
w.scrollBy=w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.matchMedia=()=>({matches:false,addEventListener(){}});w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};w.confirm=()=>true;w.alert=()=>{};
for(const s of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,s.getAttribute('src').split('?')[0]),'utf8'));
w.MirrorDelivery.getRoute=()=>({km:11.2,address:'Санкт-Петербург, Гражданский проспект, 29'});
let current;const original=w.onPersonalCalculation;w.onPersonalCalculation=data=>{current=data;if(original)original(data)};
function set(selector,value,type='input'){const el=d.querySelector(selector);if(el.type==='checkbox'||el.type==='radio')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event(type,{bubbles:true}));}
function quote(installed,height){set('#height',height);set('#width','80');set('[name=option][value=install]',installed,'change');set('[name=option][value=delivery]',true,'change');w.calculateMirrorInPlace();const t=w.MirrorOrderPricing.calculate([{qty:1,data:current}],{});return {t,p:w.MirrorOrderView.breakdown(t),text:w.MirrorOrderView.quote([{qty:1,data:current}],t)}}
for(const [height,delivery] of [['180',336],['200',504],['230',616]]){
 const without=quote(false,height),withInstall=quote(true,height);assert.equal(without.p.delivery,delivery);assert.equal(withInstall.p.delivery,delivery);assert.equal(without.p.mirror,withInstall.p.mirror);assert.equal(withInstall.t.deliveryBase,0);assert.equal(withInstall.p.total-without.p.total,withInstall.p.installation);assert(withInstall.text.includes('Доставка: '+delivery+' ₽'));assert(without.text.includes('Доставка: '+delivery+' ₽'));
}
assert.equal(errors.length,0,errors.join(';'));dom.window.close();console.log('PASS: same mirror/delivery with installation toggled, all size rates, quote totals and copied text');
