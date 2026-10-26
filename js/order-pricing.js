/* One supplier trip and one customer delivery per order, at one address. */
(function(root){
'use strict';
function bounded(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function calculate(items,settings){
 settings=settings||{};
 var goods=0,trip=0,delivery=0,install=0,count=0,regions={},known=0,missing={};
 items.forEach(function(item){
  var qty=Math.floor(bounded(item.qty,1,999,1)),data=item.data;
  if(!data||!data.mirror||!Number.isFinite(data.total))throw Error('Некорректная позиция заказа');
  count+=qty;goods+=data.total*qty;
  var mirror=data.mirror;
  if(mirror.install||mirror.delivery)regions[mirror.region]=true;
  data.rows.forEach(function(row){
   if(row.key==='purchase-trip'){
    goods-=row.sale*qty;trip=Math.max(trip,row.sale);return;
   }
   if(row.key==='customer-delivery'){
    goods-=row.sale*qty;delivery=Math.max(delivery,row.sale);return;
   }
   if(row.key==='installation')install+=row.sale*qty;
   if(row.cost===null){missing[row.expense||row.name]=true;}else known+=row.cost*qty;
  });
 });
 var mixedRegions=Object.keys(regions).length>1;
 if(settings.trip!==''&&settings.trip!==null&&settings.trip!==undefined)trip=bounded(settings.trip,0,1000000,trip);
 if(settings.delivery!==''&&settings.delivery!==null&&settings.delivery!==undefined)delivery=bounded(settings.delivery,0,1000000,delivery);
 var discountRate=count>=2?20:0,discount=install*discountRate/100;
 var total=Math.round(goods+trip+delivery-discount);
 var taxRate=bounded(settings.tax===undefined?8:settings.tax,0,100,8),tax=total*taxRate/100;
 known+=trip;
 // Supplier trip is a known expense; customer delivery and installation
 // need actual costs, which are entered once for the entire order.
 if(delivery>0)missing.delivery=true;
 var expenses=settings.expenses||{};
 Object.keys(missing).forEach(function(key){
  if(expenses[key]!==''&&expenses[key]!==null&&expenses[key]!==undefined){known+=bounded(expenses[key],0,100000000,0);delete missing[key];}
 });
 known+=bounded(settings.other||0,0,100000000,0);
 return {count:count,total:total,goods:goods,trip:trip,delivery:delivery,installation:install,discount:discount,discountRate:discountRate,installationAfterDiscount:install-discount,known:known,tax:tax,profit:total-known-tax,missing:Object.keys(missing),mixedRegions:mixedRegions,externalDelivery:!!(regions.spb||regions.other)};
}
var api={calculate:calculate};if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorOrderPricing=api;
})(typeof window==='object'?window:globalThis);
