/* One supplier trip and one customer delivery per order, at one address. */
(function(root){
'use strict';
function bounded(value,min,max,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function maxSide(m){var w=Number(m.width)||0,h=m.shape==='circle'?w:Number(m.height)||0;if(m.shape==='double'||m.shape==='semidouble')h+=Number(m.height2)||0;return Math.max(w,h);}
function deliveryRate(mm){return mm<=1800?20:mm<=2000?25:30;}
function route(){return root.MirrorDelivery?root.MirrorDelivery.getRoute():null;}
function deliveryBase(requested,installed){return requested?(installed?400:700):0;}
function deliveryPrice(mm,km,requested,installed){var base=deliveryBase(requested,installed);return !requested?0:!Number.isFinite(km)||km<0?base:Math.round(base+Math.max(0,km-5)*deliveryRate(mm));}

function carryPrice(mm,options){
 var o=options||{};if(!o.enabled)return {requested:false,amount:0,pending:false};
 var floor=Number(o.floor),band=mm<=1800?0:mm<=2000?1:2;
 if(!Number.isInteger(floor)||floor<1||floor>999||['lift','stairs'].indexOf(o.method)<0)return {requested:true,amount:0,pending:true,invalid:true};
 if(floor===1)return {requested:true,amount:0,pending:false};
 if(o.method==='lift')return {requested:true,amount:[200,300,400][band],pending:false};
 if(floor>20)return {requested:true,amount:0,pending:true};
 return {requested:true,amount:floor<=10?(floor-1)*[100,150,200][band]:floor<=15?[1500,2000,3000][band]:[2000,3000,4000][band],pending:false};
}

function refreshProfileCalculation(data){
 if(!data||!data.mirror||!Array.isArray(data.rows)||data.mirror.ledProfileTariffVersion===1)return data;
 var m=data.mirror,w=Number(m.width),h=m.shape==='circle'?w:Number(m.height),h2=Number(m.height2)||0,delta=0;
 if(m.ledProfile&&m.light&&w>0&&h>0){
  var per=m.shape==='double'?2*(2*w+h+h2)/1000:2*(w+h+(m.shape==='semidouble'?h2:0))/1000;
  var factor=1.06*1.02*(m.shape==='double'?1+2000/16469.75:m.shape==='semidouble'?1.2:1)*(m.shape==='rounded'?1.15:1);
  delta=per*(250-600)*factor;
 }
 var rows=data.rows.map(function(row){return row.key==='mirror'?Object.assign({},row,{sale:row.sale+delta}):Object.assign({},row);});
 return Object.assign({},data,{rows:rows,total:data.total+delta,mirror:Object.assign({},m,{ledProfileTariffVersion:1})});
}
function refreshServices(data){
 data=refreshProfileCalculation(data);
 if(!data||!data.mirror||!Array.isArray(data.rows))return data;
 var m=data.mirror,r=route(),delivery=deliveryPrice(maxSide(m),r?r.km:null,m.delivery||m.install,m.install),carry=carryPrice(maxSide(m),m.carry),total=data.total,hasDelivery=false,hasCarry=false;
 var rows=data.rows.map(function(row){
  var sale=row.sale;
  if(row.key==='customer-delivery'){sale=delivery;hasDelivery=true;}
  if(row.key==='carry'){sale=carry.amount;hasCarry=true;}
  total+=sale-row.sale;return Object.assign({},row,{sale:sale});
 });
 if(!hasDelivery&&m.delivery){rows.push({key:'customer-delivery',name:'Доставка клиенту',sale:delivery,cost:null,expense:'delivery'});total+=delivery;}
 if(!hasCarry&&carry.requested){rows.push({key:'carry',name:'Подъём до квартиры',sale:carry.amount,cost:null,expense:'carry'});total+=carry.amount;}
 return Object.assign({},data,{rows:rows,total:total});
}
function calculate(items,settings){
 settings=settings||{};
 var goods=0,trip=0,delivery=0,install=0,count=0,regions={},known=0,missing={},longest=0,requested=false,installedCount=0,carry=0,carryRequested=false,carryPending=false;
 items.forEach(function(item){
  var qty=Math.floor(bounded(item.qty,1,999,1)),data=refreshServices(item.data);
  if(!data||!data.mirror||!Number.isFinite(data.total))throw Error('Некорректная позиция заказа');
  count+=qty;goods+=data.total*qty;
  var mirror=data.mirror,carrying=carryPrice(maxSide(mirror),mirror.carry);
  carryRequested=carryRequested||carrying.requested;carryPending=carryPending||carrying.pending;
  longest=Math.max(longest,maxSide(mirror));requested=requested||!!(mirror.delivery||mirror.install);
  if(mirror.install)installedCount+=qty;
  if(mirror.install||mirror.delivery)regions[mirror.region]=true;
  data.rows.forEach(function(row){
   if(row.key==='purchase-trip'){
    goods-=row.sale*qty;trip=Math.max(trip,row.sale);return;
   }
   if(row.key==='customer-delivery'){
    goods-=row.sale*qty;return;
   }
   if(row.key==='installation')install+=row.sale*qty;
   if(row.key==='carry')carry+=row.sale*qty;
   if(row.cost===null){missing[row.expense||row.name]=true;}else known+=row.cost*qty;
  });
 });
 var r=route();delivery=deliveryPrice(longest,r?r.km:null,requested,count>0&&installedCount===count);
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
 return {deliveryBase:deliveryBase(requested,count>0&&installedCount===count),deliveryExtra:Math.max(0,delivery-deliveryBase(requested,count>0&&installedCount===count)),carry:carry,carryRequested:carryRequested,carryPending:carryPending,installedCount:installedCount,deliveryRequested:requested,deliveryPending:requested&&!r,deliveryKm:r?r.km:null,deliveryAddress:r?r.address:'',count:count,total:total,goods:goods,trip:trip,delivery:delivery,installation:install,discount:discount,discountRate:discountRate,installationAfterDiscount:install-discount,known:known,tax:tax,profit:total-known-tax,missing:Object.keys(missing),mixedRegions:mixedRegions,externalDelivery:requested&&!r};
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
 if(totals.discount)rows.push({key:'installation-discount',name:'Скидка 20% на установку',sale:-totals.discount,cost:0,note:'При заказе от двух зеркал'});
 return {rows:rows,total:rows.reduce(function(sum,row){return sum+row.sale;},0),mirror:data.mirror,quantity:qty};
}
var api={selection:selection,deliveryBase:deliveryBase,calculate:calculate,refreshServices:refreshServices,maxSide:maxSide,deliveryPrice:deliveryPrice,deliveryRate:deliveryRate,carryPrice:carryPrice};if(typeof module==='object'&&module.exports)module.exports=api;else root.MirrorOrderPricing=api;
})(typeof window==='object'?window:globalThis);

