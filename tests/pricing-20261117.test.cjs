const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function engine(base=''){
 const ctx=vm.createContext({});
 for(const file of ['supplier-pricing','order-pricing','quote-details'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',base,'js',file+'.js'),'utf8').replace('(function(){','(function(){'),ctx.window?ctx:Object.assign(ctx,{window:ctx}));
 return ctx;
}
const ctx=engine();ctx.MirrorSize={dimensions:s=>s};
const P=ctx.MirrorSupplierPricing,O=ctx.MirrorOrderPricing;
function close(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
function oldSelection(m={}){
 return {total:11654.4,mirror:Object.assign({shape:'rect',name:'Прямоугольник',width:1200,height:1400,height2:0,size:'140 × 120 см',material:'silver',materialLabel:'Серебро',edge:'polish',edgeLabel:'полировка',mirrorOptions:{machine:'auto'},light:true,lightSurcharge:400,reinf:'none',faceFrame:'none',install:false,delivery:false,supplierTariffVersion:2},m),rows:[{key:'mirror',sale:11154.4,cost:null,expense:'mirror'},{key:'purchase-trip',sale:500,cost:500},{key:'customer-delivery',sale:0,cost:null,expense:'delivery'},{key:'installation',sale:0,cost:null,expense:'install'}]};
}
test('mandatory rear frame: small mirror and 250 cm boundary',()=>{
 close(P.rearProfile('none','rect',1200,1400).cost,884);
 close(P.rearProfile('tube','rect',1000,2500).cost,1190);
 close(P.rearProfile('angle','rect',1000,2501).cost,2590.74);
 assert.equal(P.reinforcementKind('angle','rect',2501,1000),'tube');
 assert.equal(P.reinforcementKind('none','circle',600,0),'angle');
});
test('mandatory mounts: 2 through 170 cm, 4 above; circle and two parts',()=>{
 assert.equal(P.rearMounts('rect',600,1699).cost,260);
 assert.equal(P.rearMounts('rect',600,1700).count,2);
 assert.equal(P.rearMounts('rect',600,1701).cost,520);
 assert.equal(P.rearMounts('circle',1800,600).count,4);
 assert.equal(P.rearMounts('double',600,900,900).count,4);
});
test('frame sale uses actual metres; procurement keeps whole 2.7 m bars',()=>{
 for(const color of ['black','white'])close(P.faceFrame('rect',1200,1400,0,color).cost,1560);
 const gold=P.faceFrame('rect',1200,1400,0,'gold');close(gold.cost,2080);assert.equal(gold.stock.bars,2);close(gold.stock.metres,5.4);
 close(P.faceFrame('double',1200,1400,600,'black').cost,2640);
 assert.equal(P.faceFrame('rect',1200,1400,0,'none').cost,0);
});
test('delivery: both owner quotes, no old cap, no install or size dependence',()=>{
 for(const side of [600,1800,2600])for(const installed of [false,true]){
 assert.equal(O.deliveryPrice(side,35,true,installed),3000);assert.equal(O.deliveryPrice(side,60,true,installed),4000);
 }
 assert.equal(O.deliveryPrice(1000,null,true,false),0);assert.equal(O.deliveryPrice(1000,35,false,false),0);
 assert.equal(O.deliveryPrice(1000,0,true,false),1600);
});
test('saved cart migration adds hardware once and removes old frame charge',()=>{
 let data=O.refreshServices(oldSelection());close(data.total,13298.4);
 for(let i=0;i<5;i++)data=O.refreshServices(JSON.parse(JSON.stringify(data)));
 close(data.total,13298.4);assert.equal(data.rows.filter(r=>r.key==='profile-trip').length,1);
 const old=oldSelection({faceFrame:'black'});old.total+=1346;old.rows[0].sale+=1346;
 close(O.refreshServices(old).total,14858.4);
 const large=oldSelection({height:2000,reinf:'angle'}),oldRear=Math.round(6.4*141+300);
 large.total+=oldRear;large.rows[0].sale+=oldRear;
 close(O.refreshServices(large).total,11654.4+6.4*170+520+500+900); // supplier trip rises 500 -> 1400
});
test('multiple mirrors: both procurement trips and delivery once, hardware per mirror',()=>{
 ctx.MirrorDelivery={getRoute:()=>({km:35,address:'Тестовый адрес'})};
 const items=[{qty:2,data:oldSelection({delivery:true})},{qty:1,data:oldSelection({delivery:true})}];
 const total=O.calculate(items,{});assert.equal(total.trip,500);assert.equal(total.profileTrip,500);assert.equal(total.delivery,3000);assert.equal(total.total,40895);
 const entries=ctx.MirrorOrderView.entries(items,total);assert.equal(entries.reduce((s,e)=>s+e.display,0),total.total);
 const selected=O.selection(items[0].data,2);assert.equal(Math.round(selected.total),O.calculate([items[0]],{}).total);
 assert.match(ctx.MirrorOrderView.quote(items,total),/Ориентировочная доставка/);
 ctx.MirrorDelivery={getRoute:()=>null};
 const pending=O.calculate(items,{});assert.equal(pending.deliveryPending,true);assert.equal(pending.delivery,0);
});
test('website, app web page and Android fallback have identical pricing scripts',()=>{
 for(const name of ['supplier-pricing','order-pricing','main','quote-details','order','delivery-route']){
 const source=fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8');
 for(const base of ['app-kalk','app-android/kalkulyator/assets'])assert.equal(fs.readFileSync(path.join(__dirname,'..',base,'js',name+'.js'),'utf8'),source);
 }
});
