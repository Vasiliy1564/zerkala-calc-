const path=require('node:path');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function setup(city,fetch){
 const nodes={};function element(){return {value:'',checked:true,children:[],events:{},hidden:false,textContent:'',disabled:false,addEventListener(k,cb){this.events[k]=cb},replaceChildren(){this.children=[]},appendChild(n){this.children.push(n)},append(n){this.children.push(n)},after(){},closest(){return this}}}
 for(const id of ['quote-form','deliveryOpt','delivery-address','delivery-route-status','delivery-candidates','delivery-search'])nodes[id]=element();
 const memory=new Map(),window={dispatchEvent(){}};
 const context={window,document:{getElementById:id=>nodes[id],querySelector:()=>nodes.deliveryOpt,createElement:()=>element()},fetch,AbortController,setTimeout,clearTimeout,Event,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}};
 vm.runInNewContext(fs.readFileSync(city==='spb'?path.join(__dirname,'../js/delivery-route.js'):path.join(process.env.DELIVERY_STAV_ROOT,'js/delivery-route.js'),'utf8'),context);
 return {nodes,run:q=>{nodes['delivery-address'].value=q;return nodes['delivery-search'].events.click()},reset:()=>nodes['delivery-address'].events.input(),memory};
}
(async()=>{
 for(const city of process.env.DELIVERY_STAV_ROOT?['spb','stav']:['spb']){
  let calls=0;const good={features:[{properties:{label:'Мурино, улица Шувалова, 16 / Петровский бульвар, 9'},geometry:{coordinates:[30.4289,60.056339]}}]};
  const x=setup(city,async(url,options)=>{calls++;assert.equal(options.method,undefined);assert.equal(options.headers,undefined);assert.equal(new URL(url).searchParams.get('q'),'Шувалова 16/9');assert.equal(new URL(url).searchParams.get('market'),city);if(calls===1)throw new TypeError('Failed to fetch');return {ok:true,json:async()=>good}});
  await x.run('Шувалова 16/9');assert.equal(calls,2);assert.equal(x.nodes['delivery-candidates'].children.length,1);assert.equal(x.nodes['delivery-route-status'].textContent,'Выберите адрес:');
  x.reset();await new Promise(r=>setTimeout(r,1150));await x.run('Шувалова 16/9');assert.equal(calls,2,'reuse a confirmed result without contacting the service');
  let denied=0;const y=setup(city,async()=>{denied++;return {ok:false,status:403}});await y.run('Шувалова 16/9');assert.equal(denied,1);assert.match(y.nodes['delivery-route-status'].textContent,/HTTP_403/);
  console.log('PASS',city,'network retry, simple GET, cache, explicit server error');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
