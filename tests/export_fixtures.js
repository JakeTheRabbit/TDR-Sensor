/* Artificial bench values for configuration validation; never loaded into the UI. */
const fs=require('node:fs'), path=require('node:path');
const W=require('../tools/setup/wizard.js');
const output=process.argv[2];
if(!output)throw new Error('Pass an output directory.');
fs.mkdirSync(output,{recursive:true});
const calibrations={none:{method:'none'},wet:{method:'wet',wet:{raw:3000}},weighed:{method:'weighed',a:{raw:2500,vwc:30},b:{raw:3200,vwc:70},c:{raw:2850,vwc:40.5}}};
for(const [board,details] of Object.entries(W.BOARDS))for(const [method,calibration] of Object.entries(calibrations)) {
  const cfg={board,pin:details.pin,address:method==='none'?'a':method==='wet'?'Z':'0',name:`test-${board}`,friendly:'Validation only',profile:method==='none'?'Rockwool cube':method==='wet'?'Rockwool cube on slab':'Coco',interval:30,spread:10,tolerance:3};
  fs.writeFileSync(path.join(output,`${board}-${method}.yaml`),W.generateYaml(cfg,calibration));
}
console.log('Generated 15 board/calibration configuration fixtures.');
