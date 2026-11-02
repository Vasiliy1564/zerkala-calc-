const {JSDOM,VirtualConsole}=require(process.env.SPB_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://zerkalo-pro-spb.ru/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;w.scrollBy=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.matchMedia=()=>({matches:false,addEventListener:()=>{}});w.confirm=()=>true;w.alert=s=>{throw Error(s)};w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
for(const s of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync(root+'/'+s.getAttribute('src').split('?')[0],'utf8'));
let current;const prior=w.onPersonalCalculation;w.onPersonalCalculation=data=>{current=data;if(prior)prior(data)};
function set(sel,value,type='input'){const el=d.querySelector(sel);assert(el,sel);if(el.type==='radio'||el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event(type,{bubbles:true}));}
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
set('[name=shape][value=rect]',true,'change');set('[name=light][value=off]',true,'change');set('[name=edge][value=grind]',true,'change');set('#width','80');set('#height','75');w.calculateMirrorInPlace();
const baseline=current.total;near(baseline,2871.6);assert.equal(d.querySelectorAll('[name=material]').length,9);
assert(!d.querySelector('#rial-services'));assert(d.getElementById('mirror-decor-field').hidden);
for(const material of Object.keys(w.MirrorSupplierPricing.materials)){
 set('[name=material][value='+material+']',true,'change');w.calculateMirrorInPlace();const q=w.MirrorSupplierPricing.lookup('rect',material,800,750,'grind');near(current.total,q.cost*2+350);
}
set('[name=material][value=decorative]',true,'change');assert(!d.getElementById('mirror-decor-field').hidden);set('#mirror-decor','ОМУТ','change');assert.match(current.mirror.materialLabel,/ОМУТ/);
set('[name=material][value=silver]',true,'change');set('[name=mirror-facet][value="15"]',true,'change');near(current.total,baseline+4*200*2);assert.match(w.getMirrorSelectionText(),/фацет 15 мм/);
set('[name=mirror-facet][value="0"]',true,'change');set('#mirror-edge-method','cnc','change');near(current.total,baseline+(270-80)*4*2);assert.match(current.mirror.edgeLabel,/ЧПУ/);
set('[name=shape][value=circle]',true,'change');set('#width','90');w.calculateMirrorInPlace();const q=w.MirrorSupplierPricing.lookup('circle','silver',900,900,'curved-grind',0,{machine:'cnc'});near(current.total,q.cost*2+350);
set('[name=mirror-facet][value="20"]',true,'change');near(current.total,(q.cost+4*220*1.5)*2+350);
set('[name=light][value=on]',true,'change');w.calculateMirrorInPlace();near(current.total,(q.cost+4*220*1.5)*2.5+600+650+500+q.perimeter*119+350);
set('[name=material][value=decorative]',true,'change');set('#mirror-decor','ТЕАРА','change');d.getElementById('order-add').click();const stored=JSON.parse(w.localStorage.getItem('zerkalo-spb-public-order-v1')||'null');
set('[name=mirror-facet][value="0"]',true,'change');set('#mirror-decor','ОМУТ','change');set('#mirror-edge-method','standard','change');d.querySelector('[data-edit="0"]').click();assert.equal(d.querySelector('[name=mirror-facet]:checked').value,'20');assert.equal(d.getElementById('mirror-edge-method').value,'cnc');assert.equal(d.getElementById('mirror-decor').value,'ТЕАРА');
d.getElementById('order-add').click();assert.match(w.getMirrorOrderText(),/ТЕАРА/);assert.match(w.getMirrorOrderText(),/фацет 20 мм/);assert(!w.getMirrorOrderText().includes('Наценка'));
// Sandblasting appears only when selected, prices include the existing retail margin.
set('[name=material][value=silver]',true,'change');set('[name=shape][value=rect]',true,'change');set('[name=light][value=off]',true,'change');set('[name=mirror-facet][value="0"]',true,'change');set('#mirror-edge-method','auto','change');set('#width','80');set('#height','75');w.calculateMirrorInPlace();
const sandBase=current.total;assert.equal(d.querySelectorAll('[name=mirror-facet]').length,4);assert.match(d.querySelector('#mirror-facet-field legend').textContent,/Выберите фацет/);assert(d.getElementById('mirror-sand-details').hidden);
set('[name=mirror-sand][value=pattern]',true,'change');assert(!current.mirror);assert(!d.getElementById('mirror-sand-details').hidden);assert(!d.getElementById('mirror-sand-complexity-field').hidden);
set('#mirror-sand-area','0,3');near(current.total,sandBase+570*2);set('#mirror-sand-complexity','1.5','change');near(current.total,sandBase+855*2);assert.match(w.getMirrorSelectionText(),/Пескоструйный рисунок/);
d.getElementById('order-add').click();set('[name=mirror-sand][value=none]',true,'change');near(current.total,sandBase);d.querySelector('[data-edit="1"]').click();assert.equal(d.querySelector('[name=mirror-sand]:checked').value,'pattern');assert.equal(d.getElementById('mirror-sand-area').value,'0,3');assert.equal(d.getElementById('mirror-sand-complexity').value,'1.5');near(current.total,sandBase+1710);
set('[name=mirror-sand][value=matte]',true,'change');assert(d.getElementById('mirror-sand-complexity-field').hidden);near(current.total,sandBase+500*2);set('#mirror-sand-area','2');assert(!current.mirror);set('#mirror-sand-area',',');assert(!current.mirror);set('[name=mirror-sand][value=none]',true,'change');near(current.total,sandBase);
assert.deepEqual(errors,[]);dom.window.close();console.log('PASS website: all 4mm materials, decorative pattern visibility, edge/CNC rates, shaped50%, facet100/150% markup, cart edit/copy, visible facet choices, sandblasting options and validation, no JS errors.');
