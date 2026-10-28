/* Shared order rules: one supplier trip, one customer delivery and installation per mirror. */
(function(root){
'use strict';
function bounded(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function deliveryPrice(count,installedCount,requested){return !requested?0:installedCount>0?500:count>5?2000:1000;}
function refreshServices(data){
 if(root.MirrorSupplierPricing)data=root.MirrorSupplierPricing.refreshComponentCalculation(data);
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 var m=data.mirror,w=Number(m.width),h=m.shape==='circle'?w:Number(m.height);
 if(m.shape==='double'||m.shape==='semidouble')h+=Number(m.height2)||0;
 if(!(w>0&&h>0))return data;
 var area=w*h/1000000,installation=m.install?(m.light?2500:2000)+Math.max(0,area-1)*700:0;
 var trip=Math.max(w,h)<=2000?350:700;
 var delivery=deliveryPrice(1,m.install?1:0,(m.install||m.delivery)&&(m.region||'murino')==='murino');
 var total=data.total,hasTrip=false,hasDelivery=false;
 var rows=data.rows.map(function(row){
  var sale=row.sale,cost=row.cost;
  if(row.key==='installation')sale=installation;
  if(row.key==='purchase-trip'){sale=trip;cost=trip;hasTrip=true;}
  if(row.key==='customer-delivery'){sale=delivery;hasDelivery=true;}
  total+=sale-row.sale;
  return Object.assign({},row,{sale:sale,cost:cost});
 });
 if(!hasTrip){rows.push({key:'purchase-trip',name:'Поездка с зеркалами',sale:trip,cost:trip});total+=trip;}
 if(!hasDelivery&&delivery){rows.push({key:'customer-delivery',name:'Доставка клиенту',sale:delivery,cost:null,expense:'delivery'});total+=delivery;}
 return Object.assign({},data,{rows:rows,total:total});
}
function calculate(items,settings){
 settings=settings||{};
 var goods=0,trip=0,delivery=0,install=0,count=0,installedCount=0,needsQuote=false,regions={},known=0,missing={};
 items.forEach(function(item){
  var qty=Math.floor(bounded(item.qty,1,999,1)),data=refreshServices(item.data);
  if(!data||!data.mirror||!Number.isFinite(data.total))throw Error('Некорректная позиция заказа');
  count+=qty;goods+=data.total*qty;
  var mirror=data.mirror;
  if(mirror.install)installedCount+=qty;
  if(mirror.shape==='curved'&&mirror.supplierCategory!=='simple-template'&&!(Number(mirror.supplierCost)>0))needsQuote=true;
  if(mirror.install||mirror.delivery)regions[mirror.region||'murino']=true;
  data.rows.forEach(function(row){
   if(row.key==='purchase-trip'){goods-=row.sale*qty;trip=Math.max(trip,row.sale);return;}
   if(row.key==='customer-delivery'){goods-=row.sale*qty;return;}
   if(row.key==='installation')install+=row.sale*qty;
   if(row.cost===null)missing[row.expense||row.name]=true;else known+=row.cost*qty;
  });
 });
 delivery=deliveryPrice(count,installedCount,!!regions.murino);
 var mixedRegions=Object.keys(regions).length>1;
 if(settings.trip!==''&&settings.trip!==null&&settings.trip!==undefined)trip=bounded(settings.trip,0,1000000,trip);
 if(settings.delivery!==''&&settings.delivery!==null&&settings.delivery!==undefined)delivery=bounded(settings.delivery,0,1000000,delivery);
 var discountRate=installedCount>2?20:0,discount=install*discountRate/100;
 var total=Math.round(goods+trip+delivery-discount);
 var taxRate=bounded(settings.tax===undefined?8:settings.tax,0,100,8),tax=total*taxRate/100;
 known+=trip;
 if(delivery>0)missing.delivery=true;
 var expenses=settings.expenses||{};
 Object.keys(missing).forEach(function(key){
  if(expenses[key]!==''&&expenses[key]!==null&&expenses[key]!==undefined){known+=bounded(expenses[key],0,100000000,0);delete missing[key];}
 });
 known+=bounded(settings.other||0,0,100000000,0);
 return {count:count,installedCount:installedCount,needsQuote:needsQuote,total:total,goods:goods,trip:trip,delivery:delivery,installation:install,discount:discount,discountRate:discountRate,installationAfterDiscount:install-discount,known:known,tax:tax,profit:total-known-tax,missing:Object.keys(missing),mixedRegions:mixedRegions,externalDelivery:!!(regions.spb||regions.other)};
}
function selection(data,quantity){
 var qty=Math.floor(bounded(quantity,1,999,1));data=refreshServices(data);
 if(!data||!data.mirror)return data;
 var totals=calculate([{qty:qty,data:data}],{});
 var rows=data.rows.map(function(row){
  var once=row.key==='purchase-trip'||row.key==='customer-delivery';
  var sale=row.key==='customer-delivery'?totals.delivery:row.sale*(once?1:qty);
  return Object.assign({},row,{sale:sale,cost:row.cost===null?null:row.cost*(once?1:qty)});
 });
 if(totals.discount)rows.push({key:'installation-discount',name:'Скидка 20% на установку',sale:-totals.discount,cost:0,note:'При установке от трёх зеркал'});
 return {rows:rows,total:rows.reduce(function(sum,row){return sum+row.sale;},0),mirror:data.mirror,quantity:qty};
}
var api={deliveryPrice:deliveryPrice,refreshServices:refreshServices,calculate:calculate,selection:selection};if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorOrderPricing=api;
})(typeof window==='object'?window:globalThis);
