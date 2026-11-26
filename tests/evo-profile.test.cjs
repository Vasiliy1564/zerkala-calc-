const test = require('node:test');
const assert = require('node:assert/strict');
const evo = require('../js/evo-profile.js');
const fs = require('node:fs');
const path = require('node:path');

test('EVO applies only with lighting to nonrectangular shapes', () => {
  for (const shape of ['rounded','circle','oval','capsule','semicircle','semidouble']) {
    assert.ok(evo.charge(shape,1000,2000,560,true)>0,shape);
    assert.equal(evo.charge(shape,1000,2000,560,false),0,shape);
  }
  for (const shape of ['rect','double']) assert.equal(evo.charge(shape,1000,2000,560,true),0);
});

test('EVO metres follow the physical outer contour', () => {
  assert.ok(Math.abs(evo.charge('circle',1000,1000,0,true)-Math.PI*100)<1e-8);
  const half=(Math.PI+2)*100;
  assert.ok(Math.abs(evo.charge('semicircle',1000,2000,0,true)-half)<1e-8);
  assert.ok(Math.abs(evo.charge('semidouble',1000,1440,560,true)-half)<1e-8);
  assert.ok(evo.charge('oval',900,1800,0,true)<evo.charge('capsule',900,1800,0,true));
});

test('the final price receives the exact EVO charge after all price multipliers', () => {
  const source=fs.readFileSync(path.join(__dirname,'../js/main.js'),'utf8');
  const surcharge=source.indexOf('price += roundedSurcharge;');
  const evoCharge=source.indexOf('price += window.MirrorEvoProfile.charge(');
  const delivery=source.indexOf('price += clientDelivery;',surcharge);
  assert.ok(surcharge>=0 && evoCharge>surcharge && delivery>evoCharge);
});
