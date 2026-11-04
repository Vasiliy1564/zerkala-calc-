const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),nodes={};
function element(){return {value:'',checked:true,children:[],events:{},textContent:'',addEventListener(k,cb){this.events[k]=cb},replaceChildren(){this.children=[]},appendChild(n){this.children.push(n)},append(n){this.children.push(n)},after(){},closest(){return this}}}
for(const id of ['quote-form','deliveryOpt','delivery-address','delivery-route-status','delivery-candidates','delivery-search'])nodes[id]=element();
let external=0,chunks=0;const store=new Map(),window={dispatchEvent(){}};
const context={window,document:{getElementById:id=>nodes[id],querySelector:()=>nodes.deliveryOpt,createElement:()=>element()},Map,Set,Blob,Response,DecompressionStream,AbortController,setTimeout,clearTimeout,Event,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},fetch:async(url)=>{
 if(url.startsWith('/put-peterburg/')){chunks++;return new Response(fs.readFileSync(path.join(root,url.slice(1))))}
 external++;throw new TypeError('Simulated unreachable external search server');
}};
vm.createContext(context);for(const file of ['delivery-local.js','delivery-route.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
(async()=>{
 for(const [q,expected] of [['Гражданский проспект 29','Санкт-Петербург, Гражданский проспект, 29'],['Шувалова 16/9','Мурино, улица Шувалова, 16/9'],['Бугры, Гаражный 5','Бугры, Гаражный проезд, 5']]){
  const result=await window.MirrorAddressFallback.search(q);assert(result.features.some(x=>x.properties.label===expected),q);for(const f of result.features)assert(f.geometry.coordinates.every(Number.isFinite));
 }
 assert.equal(chunks,8,'load the same-origin database only once');
 assert.equal((await window.MirrorAddressFallback.search('Несуществующая улица 987654')).features.length,0);
 assert.equal((await window.MirrorAddressFallback.search('Малая Гражданский проспект 29')).features.length,0,'do not ignore extra street words');
 nodes['delivery-address'].value='Гражданский проспект 29';await nodes['delivery-search'].events.click();assert.equal(external,1);assert.equal(nodes['delivery-route-status'].textContent,'Выберите адрес:');assert(nodes['delivery-candidates'].children.some(x=>x.textContent==='Санкт-Петербург, Гражданский проспект, 29'));
 console.log('PASS: full regional database + blocked external search -> exact-house candidates, no invented coordinates, cached database');
})().catch(e=>{console.error(e);process.exitCode=1});
