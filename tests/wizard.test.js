const test = require('node:test'), assert = require('node:assert/strict');
const U = require('../tools/setup/units.js'), W = require('../tools/setup/wizard.js'), D = require('../tools/setup/diagrams.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
const config = {board:'atom-lite',pin:26,address:'0',name:'bench-probe',friendly:'Bench probe',profile:'Coco',interval:30,spread:10,tolerance:3};
const a={raw:2500,vwc:30},b={raw:3200,vwc:70},c={raw:2850,vwc:40.5};
test('display units preserve volume, water mass and emitter runtime across all systems',()=>{
  for(const system of ['metric','imperial'])for(const gallon of ['US','UK'])for(const kind of ['length','height','volume','smallVolume','mass','flow','density','temperature'])for(const value of [0,.998,15,142,7500])near(U.toSI(U.fromSI(value,kind,system,gallon),kind,system,gallon),value);
  near(U.toSI(1,'volume','imperial','US'),3.785411784);
  near(U.toSI(1,'volume','imperial','UK'),4.54609);
  near(U.toSI(32,'temperature','imperial','US'),0);
  near(U.toSI(1,'mass','imperial','UK'),453.59237);
  near(U.toSI(1,'smallVolume','imperial','UK'),28.4130625);
  assert.throws(()=>U.definition('volume','imperial','ambiguous'));
});
test('weighed reference uses sensor input resolution without losing the original measurement',()=>{
  const p=W.point(2850,4553.7,500,10,1);
  near(p.exactVwc,40.537);near(p.vwc,40.5);
  const imperialMass=U.fromSI(4553.7,'mass','imperial','US');
  near(W.point(2850,U.toSI(imperialMass,'mass','imperial','US'),500,10).vwc,p.vwc);
  assert.throws(()=>W.point(2500,500,500,10));
  assert.throws(()=>W.point(2500,10499.99,500,10)); // would round to a forbidden 100%
});
test('nonlinear response fit matches the firmware, works in either A/B order and checks C independently',()=>{
  near(W.generic(2500),37.54375);
  near(W.fit(2850,a,b),40.491096511865386);
  near(W.fit(2850,b,a),W.fit(2850,a,b));
  assert.ok(W.check(a,b,c).passed);
  assert.ok(!W.check(a,b,{raw:2850,vwc:50}).passed);
  assert.throws(()=>W.check(a,b,{raw:2570,vwc:35})); // C at the exact 10% boundary
  assert.throws(()=>W.check(a,b,{raw:3130,vwc:65}));
  assert.throws(()=>W.fit(2499,a,b));
  assert.throws(()=>W.fit(2800,a,{raw:3200,vwc:20}));
  assert.throws(()=>W.fit(2530,a,{raw:2599,vwc:70}));
  assert.throws(()=>W.fit(2800,a,{raw:3200,vwc:39.9}));
});
test('saturation cannot silently become VWC and insufficient raw response cannot define the index',()=>{
  assert.deepEqual(W.wetReference(3000),{raw:3000});
  assert.throws(()=>W.wetReference(100));
  assert.throws(()=>W.wetReference(4096));
  const yaml=W.generateYaml(config,{method:'wet',wet:{raw:3000}});
  assert.match(yaml,/id\(wet_raw\)=3000\.0f/);
  assert.match(yaml,/id\(a_raw\)=NAN/);
  assert.doesNotMatch(yaml,/vwc\).*100\.0f/);
});
test('YAML rejects bad hardware, addresses, names, capture parameters and failed calibration',()=>{
  for(const change of [{name:'bad\non_boot'},{friendly:'Name\nscript:'},{board:'invented'},{pin:39},{address:'00'},{interval:15},{spread:0},{tolerance:100},{profile:'Custom injected profile'}])assert.throws(()=>W.generateYaml({...config,...change}));
  assert.throws(()=>W.generateYaml(config,{method:'weighed',a,b,c:{raw:2850,vwc:50}}));
  assert.throws(()=>W.generateYaml(config,{method:'weighed',a,b,c:{raw:2500,vwc:30}}));
});
test('export provides an explicit import action with fresh-data gates, never a boot-time override',()=>{
  const yaml=W.generateYaml(config,{method:'weighed',a,b,c});
  assert.match(yaml,/ref: [a-f0-9]{40}/);
  assert.match(yaml,/name: "Import wizard references"/);
  assert.match(yaml,/!id\(calibration_mode\)\.state/);
  assert.match(yaml,/id\(raw_count\) < 10/);
  assert.match(yaml,/hi-lo > id\(capture_spread_limit\)\.state/);
  assert.match(yaml,/id\(c_vwc\)=40\.5f/);
  assert.doesNotMatch(yaml,/^\s*on_boot:/m);
  assert.doesNotMatch(yaml,/restore_value: false/);
  assert.doesNotMatch(W.generateYaml(config),/Import wizard references/);
  assert.match(yaml,/key: !secret api_encryption_key/);
});
test('all board configurations use their actual package and PoE excludes Wi-Fi',()=>{
  for(const [id,board] of Object.entries(W.BOARDS)) {
    const cfg={...config,board:id,pin:board.pin};
    const yaml=W.generateYaml(cfg);
    assert.ok(yaml.includes(`boards/${id}.yaml`));
    assert.equal(yaml.includes('\nwifi:'),!board.ethernet);
    assert.equal(W.secretsExample(cfg).includes('wifi_ssid:'),!board.ethernet);
    assert.match(yaml,/sample_timeout: 90s/);assert.match(yaml,/sample_timeout_ms: "90000"/);
  }
});
test('all diagrams change physical labels with units and templates preserve physical page dimensions',()=>{
  for(const system of ['cube','slab','stack','coco']) {
    const g={system,l:150,w:150,h:142,center:71,units:'metric',gallon:'US',plants:3};
    assert.match(D.combined(g),/53 mm/);
    assert.match(D.combined({...g,units:'imperial'}),/2\.087 in/);
    assert.match(D.template(g),/width="210mm" height="297mm"/);
    assert.match(D.template({...g,units:'imperial'},'Letter'),/width="215\.9mm" height="279\.4mm"/);
    assert.match(D.template({...g,h:300,center:150}),/no base datum/);
    assert.throws(()=>D.template({...g,center:2}));
  }
});

test('SDI-12 letters map to the pinned driver numeric indices, lowercase first',()=>{
  for(const [address,index] of [['0',0],['9',9],['a',10],['z',35],['A',36],['Z',61]]) {
    assert.ok(W.generateYaml({...config,address}).includes('sdi12_address: "'+index+'"'));
  }
});
