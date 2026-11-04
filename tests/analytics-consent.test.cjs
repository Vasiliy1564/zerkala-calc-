const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/../js/analytics-consent.js', 'utf8');
function page(config = {}, saved = null) {
  const all = [], network = [], storage = new Map(saved ? [['zerkalo-analytics-consent', JSON.stringify(saved)]] : []);
  const make = tag => {
    const el = {tag, children: [], listeners: {}, classList: {add() {}},
      appendChild(child) {this.children.push(child); all.push(child); return child;},
      setAttribute() {}, addEventListener(k, f) {this.listeners[k] = f;}, focus() {},
      remove() {this.removed = true;},
      querySelector() {return this.children.find(x => x.tag === 'button');}};
    return el;
  };
  const script = make('script'); script.dataset = config;
  script.parentNode = {insertBefore(el) {network.push(el.src);}};
  const document = {currentScript: script, scripts: [script], readyState: 'complete', cookie: '',
    head: make('head'), body: make('body'),
    createElement: make, createTextNode: text => ({textContent:text}),
    querySelector() {return null;}, querySelectorAll() {return [];},
    getElementsByTagName() {return [script];}};
  const location = {hostname:'example.test', origin:'https://example.test', pathname:'/', reloads:0, reload() {this.reloads++;}};
  const localStorage = {getItem(k) {return storage.get(k) || null;},setItem(k,v) {storage.set(k,v);},
    get length() {return storage.size;},key(i) {return Array.from(storage.keys())[i];},removeItem(k) {storage.delete(k);}};
  const window = {addEventListener() {}};
  vm.runInNewContext(source, {window,document,location,localStorage,Date,Number,JSON});
  return {all,network,location,window,storage, click(text) {
    const el = all.findLast(x => x.tag === 'button' && x.textContent === text);
    assert.ok(el, 'button exists: '+text); el.listeners.click();
  }};
}
const enabled = {enabled:'true',counter:'123',operatorName:'Test operator',operatorAddress:'Test address',operatorContact:'test@example.test',policyUrl:'/policy',consentUrl:'/consent'};
const accepted = {choice:'accepted',version:'2026-11-04.2',at:Date.now()};
let p = page(enabled);
assert.equal(p.network.length,0,'no analytics before consent');
p.click('Отказаться');
assert.equal(p.network.length,0,'refusal sends nothing');
p = page(enabled);
p.click('Разрешить аналитику');
assert.equal(p.network.length,1,'explicit acceptance loads one script');
const init = p.window.ym.a[0];
assert.equal(init[1], 'init');
assert.equal(init[2].webvisor, false, 'Webvisor remains disabled after consent');
assert.equal(init[2].clickmap, false, 'clickmap remains disabled');
assert.equal(init[2].params.analytics_consent.version, '2026-11-04.2');
assert.ok(init[2].params.analytics_consent.accepted_at, 'consent metadata is attached to the first visit');
p.window.ZerkaloAnalyticsConsent.open();
p.click('Отозвать согласие');
assert.equal(p.location.reloads,1,'revocation stops runtime with reload');
assert.equal(JSON.parse(p.storage.get('zerkalo-analytics-consent')).choice,'rejected');
p = page({...enabled,enabled:'false'},accepted);
assert.equal(p.network.length,0,'disabled configuration overrides saved acceptance');
p = page({...enabled,operatorName:''},accepted);
assert.equal(p.network.length,0,'missing operator fails closed');
p = page(enabled,accepted);
assert.equal(p.network.length,1,'valid existing acceptance restored');
p = page({...enabled,version:'new'},accepted);
assert.equal(p.network.length,0,'document change invalidates consent');
p = page(enabled,{...accepted,at:Date.now()-181*86400000});
assert.equal(p.network.length,0,'expired consent is not reused');
p = page(enabled,{...accepted,at:Date.now()+100000});
assert.equal(p.network.length,0,'future timestamp rejected');
assert.ok(!/noscript|watch\/\d/.test(source),'no ungated image fallback');
console.log('PASS: default blocking, refusal, acceptance, revocation, disabled mode, missing operator, version and expiry');
