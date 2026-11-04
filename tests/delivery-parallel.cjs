const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const nodes={};function element(){return {value:'',checked:false,children:[],events:{},textContent:'',addEventListener(k,f){this.events[k]=f},appendChild(n){this.children.push(n)},append(n){this.children.push(n)},replaceChildren(){this.children=[]},after(){},closest(){return this}}}
for(const id of ['quote-form','deliveryOpt','delivery-address','delivery-route-status','delivery-candidates','delivery-search','width','height'])nodes[id]=element();
nodes['quote-form'].querySelector=s=>s.includes('install')?{checked:false}:{value:'rect'};
let release,remoteStarted=false;const data={features:[{properties:{label:'Санкт-Петербург, Гражданский проспект, 29'},geometry:{coordinates:[30.393006,60.007219]}}]};
const window={dispatchEvent(){},MirrorAddressFallback:{search:async()=>data},MirrorOrderPricing:require('../js/order-pricing.js'),MirrorSize:{read:()=>1800}},memory=new Map();
const context={window,document:{getElementById:id=>nodes[id],createElement:element,querySelector:()=>nodes.deliveryOpt},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},AbortController,setTimeout,clearTimeout,Event,fetch:()=>{remoteStarted=true;return new Promise(r=>release=r)}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/delivery-route.js'),'utf8'),context);
(async()=>{
 nodes['delivery-address'].value='Гражданский проспект 29';const work=nodes['delivery-search'].events.click();
 let timer;try{await Promise.race([work,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Address lookup waited for the stalled provider')),150))]);}finally{clearTimeout(timer)}
 assert(remoteStarted);assert.equal(nodes['delivery-candidates'].children.length,1);assert.equal(nodes['delivery-route-status'].textContent,'Выберите адрес:');
 release({ok:true,json:async()=>({features:[]})});await new Promise(setImmediate);
 assert.equal(nodes['delivery-route-status'].textContent,'Выберите адрес:','late provider response must not replace selected candidates');
 const engine=window.MirrorOrderPricing;assert.equal(engine.deliveryPrice(1800,11.2,true,false),336);assert.equal(engine.deliveryPrice(1800,11.2,true,true),336);assert.equal(engine.deliveryBase(true,true),0);
 console.log('PASS: immediate local answer despite stalled provider; no late UI overwrite; delivery pricing matches 336 with and without installation');
})().catch(e=>{if(release)release({ok:true,json:async()=>({features:[]})});console.error(e);process.exitCode=1});
