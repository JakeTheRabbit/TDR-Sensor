"use strict";
const $ = id => document.getElementById(id);
const W = TDRWizard, U = TDRUnits, D = TDRDiagrams;
const STORAGE = 'tdr-setup-v4';
const escapeHtml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fmt = (value, digits=3) => Number.isFinite(value) ? value.toLocaleString('en',{maximumFractionDigits:digits}) : '—';
const fields = [...document.querySelectorAll('input[id]:not([type="file"]),select[id]')];
const numeric = fields.filter(el => el.dataset.measure);
for (const [key, board] of Object.entries(W.BOARDS)) $('board').add(new Option(board.label,key));
function pinOptions(board, selected) {
  $('pin').replaceChildren();
  for(const pin of (W.BOARDS[board] || W.BOARDS['atom-lite']).pins) $('pin').add(new Option('GPIO'+pin,String(pin),false,pin===Number(selected)));
}
pinOptions('atom-lite',26);
function presetOptions(id, entries, selected, units='metric', gallon='US') {
  $(id).replaceChildren();
  for(const [key,label,l,w,h] of entries) {
    let name=label.split(':')[0];
    if(id==='slab-preset' && key.startsWith('s100'))name='Slab';
    name=name.replace(/\s*\([^)]*nominal\)/,'');
    const dimensions=[l,w,h].map(n=>fmt(U.fromSI(n,'length',units,gallon),3)).join(' × ');
    $(id).add(new Option(key==='custom'?label:`${name} · ${dimensions} ${U.definition('length',units,gallon).label}`,key,false,key===selected));
  }
}
presetOptions('block-preset',SUBSTRATES.blocks,'hugo');
presetOptions('slab-preset',SUBSTRATES.slabs,'s1001575');
const defaults = {
  version:4,units:'metric',gallon:'US',step:0,tab:'settings',positionAuto:true,paperAuto:true,sampleAuto:true,
  n:Object.fromEntries(numeric.map(el=>[el.id,el.value===''?null:Number(el.value)])),
  v:Object.fromEntries(fields.filter(el=>!el.dataset.measure).map(el=>[el.id,el.type==='checkbox'?el.checked:el.value])),
  records:{},
};
let state=structuredClone(defaults), result=null, blockL=NaN, baseL=NaN, configError='', placementError='', yamlText='', reportText='', geometry=null;
let toastTimer;
function val(id) { const x=state.n[id]; return typeof x==='number' && Number.isFinite(x)?x:NaN; }
function unit(value, kind, digits=3) { return U.format(value,kind,state.units,state.gallon,digits); }
function toast(message) { $('toast').textContent=message;$('toast').dataset.open='true';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').dataset.open='false',5000); }
function save() {
  try { localStorage.setItem(STORAGE,JSON.stringify(state));$('save-status').textContent='Saved on this browser'; }
  catch { $('save-status').textContent='Use Save setup to keep a copy'; }
}
function sanitise(data) {
  if(!data || data.version!==4)throw new Error('Choose a TDR setup file created by this version of the calculator.');
  const fresh=structuredClone(defaults);
  if(['metric','imperial'].includes(data.units))fresh.units=data.units;
  if(['US','UK'].includes(data.gallon))fresh.gallon=data.gallon;
  if(Number.isInteger(data.step)&&data.step>=0&&data.step<=3)fresh.step=data.step;
  if(['settings','yaml'].includes(data.tab))fresh.tab=data.tab;
  for(const key of Object.keys(fresh.n))if(data.n && (data.n[key]===null || typeof data.n[key]==='number'&&Number.isFinite(data.n[key])))fresh.n[key]=data.n[key];
  for(const key of Object.keys(fresh.v))if(data.v && typeof data.v[key]===typeof fresh.v[key])fresh.v[key]=typeof data.v[key]==='string'?data.v[key].slice(0,200):data.v[key];
  for(const key of ['wet','a','b','c'])if(data.records?.[key] && typeof data.records[key].signature==='string' && data.records[key].signature.length<5000 && typeof data.records[key].time==='string')fresh.records[key]={signature:data.records[key].signature,time:data.records[key].time.slice(0,40)};
  fresh.positionAuto=data.positionAuto===true;fresh.paperAuto=data.paperAuto!==false;fresh.sampleAuto=data.sampleAuto!==false;
  return fresh;
}
try { const cached=localStorage.getItem(STORAGE);if(cached)state=sanitise(JSON.parse(cached)); } catch { /* A blocked or old store does not prevent calculation. */ }
function inputNumber(id) {
  const el=$(id), n=val(id);
  el.value=Number.isFinite(n)?String(Number(U.fromSI(n,el.dataset.measure,state.units,state.gallon).toFixed(el.dataset.measure==='density'?9:7))):'';
}
function putNumber(id,n) {state.n[id]=Number.isFinite(n)?n:null;inputNumber(id);}
function applyDisplay() {
  pinOptions(state.v.board,state.v.pin);
  presetOptions('block-preset',SUBSTRATES.blocks,state.v['block-preset'],state.units,state.gallon);
  presetOptions('slab-preset',SUBSTRATES.slabs,state.v['slab-preset'],state.units,state.gallon);
  for(const el of fields.filter(el=>!el.dataset.measure)) {
    if(el.type==='checkbox')el.checked=state.v[el.id];else el.value=state.v[el.id];
  }
  $('gallon').value=state.gallon;
  for(const el of numeric)inputNumber(el.id);
  for(const el of document.querySelectorAll('[data-unit]'))el.textContent=U.definition(el.dataset.unit,state.units,state.gallon).label;
  const preset=$('pot-preset'), selected=state.v['pot-preset'];
  const volumes=state.units==='metric'?[1,2,3,5,7.5,10,15,20,30,40]:[1,2,3,5,7,10,15,20].map(v=>U.toSI(v,'volume',state.units,state.gallon));
  if(selected!=='custom' && !volumes.some(v=>Math.abs(v-Number(selected))<1e-8))volumes.push(Number(selected));
  preset.replaceChildren(new Option('Custom','custom'));
  for(const v of volumes.filter(Number.isFinite).sort((a,b)=>a-b))preset.add(new Option(unit(v,'volume'),String(v),false,String(v)===selected));
  preset.value=selected;
  $('density-default').textContent='Default water density: '+unit(1,'density',6)+'.';
  $('metric').setAttribute('aria-pressed',String(state.units==='metric'));
  $('imperial').setAttribute('aria-pressed',String(state.units==='imperial'));
  $('gallon-wrap').hidden=state.units!=='imperial';
}
function config() {
  const mode=state.v.system;
  return W.config({board:state.v.board,pin:Number(state.v.pin),address:state.v.address,name:state.v['device-name'],friendly:state.v['friendly-name'],profile:W.PROFILES[mode==='coco'?state.v.medium:mode],interval:Number(state.v.interval),spread:val('spread'),tolerance:val('tolerance')});
}
function allocation() {
  const mode=state.v.system, pot=state.v['pot-method'];
  if(!['cube','stack','slab','coco'].includes(mode))throw new Error('Choose a growing system.');
  blockL=['cube','stack'].includes(mode)?TDR.box(val('bl'),val('bw'),val('bh')):0;
  baseL=['slab','stack'].includes(mode)?TDR.box(val('sl'),val('sw'),val('sh')):0;
  if(mode==='coco') {
    if(!['known','box','tapered'].includes(pot))throw new Error('Choose a container volume method.');
    baseL=pot==='known'?TDR.litres(val('pv'),'L'):pot==='box'?TDR.box(val('pa'),val('pb'),val('ph')):TDR.taperedPot(val('pa'),val('pb'),val('ph'));
  }
  if(mode==='cube'&&val('plants')!==1)throw new Error('Use one plant per cube; enter the total number of cubes as units.');
  return TDR.allocation(blockL,baseL,val('plants'),val('units'));
}
function dimensions() {
  const mode=state.v.system;
  const dims=mode==='cube'?[val('bl')*10,val('bw')*10,val('bh')*10]:['stack','slab'].includes(mode)?[val('sl')*10,val('sw')*10,val('sh')*10]:[val('pa')*10,(state.v['pot-method']==='box'?val('pb'):val('pa'))*10,val('ph')*10];
  return {system:mode,l:dims[0],w:dims[1],h:dims[2],center:val('position'),plants:val('plants'),blockLength:val('bl')*10,bottom:val('pb')*10,shape:state.v['pot-method'],units:state.units,gallon:state.gallon};
}
function validatePlacement(g) {
  if(![g.l,g.w,g.h,g.center].every(Number.isFinite)||Math.min(g.l,g.w,g.h)<=0)throw new Error('Enter the actual substrate dimensions and rod height.');
  if(g.system==='coco'&&g.shape!=='box'&&(!Number.isFinite(g.bottom)||g.bottom<=0))throw new Error('Enter a positive filled bottom diameter.');
  if(g.l<88 || g.w<=53 || g.h<26)throw new Error(`This orientation cannot contain the ${unit(88,'height')} face and ${unit(53,'height')} rods. Use a suitable smaller probe or validate a different arrangement.`);
  if(g.center<13||g.center>g.h-13)throw new Error(`Rod height must be between ${unit(13,'height')} and ${unit(g.h-13,'height')} so the full face remains within the substrate.`);
}
function primaryVolume() {return state.v.system==='cube'?blockL:baseL;}
function contextSignature() {
  const g=dimensions();
  return JSON.stringify([state.v.system,state.v.medium,g.l,g.w,g.h,g.bottom,g.shape,g.center,state.v.system==='stack'?[val('bl'),val('bw'),val('bh')]:null,state.v.system==='coco'&&state.v['pot-method']==='known'?val('pv'):null,state.v['sensor-reference'],state.v.board,state.v.pin,state.v['device-name'],val('sample-volume'),val('dry'),val('density')]);
}
function recordSignature(key) {
  return JSON.stringify([contextSignature(),key,key==='wet'?val('wet-raw'):val('raw-'+key),key==='wet'?null:val('mass-'+key)]);
}
function getPoint(key) {return W.point(val('raw-'+key),val('mass-'+key),val('dry'),val('sample-volume'),val('density'));}
function isRecorded(key) {return state.records[key]?.signature===recordSignature(key);}
function recordedCalibration() {
  if(placementError || !state.v.placed || configError)return null;
  if(state.v['cal-method']==='wet'&&isRecorded('wet'))return {method:'wet',wet:W.wetReference(val('wet-raw'))};
  if(state.v['cal-method']==='weighed'&&['a','b','c'].every(isRecorded)) {
    const a=getPoint('a'),b=getPoint('b'),c=getPoint('c'),check=W.check(a,b,c,val('tolerance'));
    if(check.passed)return {method:'weighed',a,b,c,check};
  }
  return null;
}
function clearRecords(message=true) {
  const had=Object.keys(state.records).length>0;state.records={};
  if(had&&message)toast('Setup changed. Re-record calibration for the new sample or position.');
}
function resetPosition() {
  if(state.positionAuto)putNumber('position',dimensions().h/2);
}
function showStep(step,focus=true) {
  state.step=step;
  for(const panel of document.querySelectorAll('[data-panel]'))panel.hidden=Number(panel.dataset.panel)!==step;
  for(const button of document.querySelectorAll('[data-step]')) {
    if(Number(button.dataset.step)===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  }
  $('previous').hidden=step===0;$('next').hidden=step===3;$('setup-only').hidden=step===3;
  $('next').textContent=['Continue to sensor position','Continue to calibration','Review & export',''][step];
  $('navigation-error').textContent='';
  const hash=['volume','place','weigh','export'][step];
  try {history.replaceState(null,'','#'+hash);}catch{}
  if(focus)$(['configure-heading','place-heading','calibration-heading','export-heading'][step]).focus({preventScroll:true});
  if(focus)document.querySelector('.steps').scrollIntoView({behavior:'instant',block:'start'});
  save();
}
function renderVolume() {
  const mode=state.v.system,pot=state.v['pot-method'];
  $('block-fields').hidden=!['cube','stack'].includes(mode);$('slab-fields').hidden=!['slab','stack'].includes(mode);$('coco-fields').hidden=mode!=='coco';$('known-pot').hidden=pot!=='known';
  $('pot-a-label').textContent=pot==='box'?'Inside length':'Top diameter';$('pot-b-label').textContent=pot==='box'?'Inside width':'Bottom diameter';
  $('pot-help').textContent=pot==='known'?'Filled volume controls the calculation. Measure the dimensions too: they are used for sensor placement.':'Measure the inside dimensions at the settled fill level, excluding unfilled space.';
  $('plants-label').textContent=mode==='cube'?'Plants per cube':mode==='coco'?'Plants per container':'Plants per slab';
  $('units-label').textContent=mode==='cube'?'Cubes in irrigation zone':mode==='coco'?'Containers in irrigation zone':'Slabs in irrigation zone';
  $('plants').disabled=mode==='cube';
  $('summary-system').textContent={cube:'Cubes',stack:'Cubes + slab',slab:'Slab',coco:state.v.medium==='peat'?'Peat':'Coco'}[mode]||'';
  $('per-unit-label').textContent={cube:'One cube',stack:'Slab + all cubes',slab:'One slab',coco:'One container'}[mode]||'One unit';
  result=null;$('volume-error').textContent='';
  for(const id of ['per-plant','per-unit','per-zone','plant-total'])$(id).textContent='—';
  $('volume-detail').textContent='';$('shot-result').textContent='Enter valid substrate dimensions.';
  try {
    result=allocation();
    $('per-plant').textContent=unit(result.plant,'volume');$('per-unit').textContent=unit(result.unit,'volume');$('per-zone').textContent=unit(result.zone,'volume');$('plant-total').textContent=fmt(result.plants,0);
    $('volume-detail').textContent=mode==='stack'?`${unit(blockL,'volume')} cube + ${unit(baseL,'volume')} slab ÷ ${fmt(val('plants'),0)} plants.`:mode==='cube'?`${unit(blockL,'volume')} per measured cube.`:`${unit(baseL,'volume')} per container, shared by ${fmt(val('plants'),0)} plant(s).`;
    try {const shot=TDR.shot(result.plant,val('shot-pct'),val('emitters'),val('flow'));$('shot-result').textContent=`${unit(shot.ml,'smallVolume',2)} per plant · ${fmt(shot.seconds,1)} seconds.`;}catch(e){$('shot-result').textContent=e.message;}
  } catch(e) {$('volume-error').textContent=e.message;}
  const location=mode==='cube'?'Cube':mode==='coco'?'Container':'Slab';
  $('monitor-location').textContent=location;$('position-medium').textContent=location;
  $('monitor-note').textContent=mode==='stack'?'Use the slab once roots have established there. Cube readings remain a separate location.':'One probe measures a local region. Check it against representative samples.';
  try {const dryback=TDR.dryback(val('peak'),val('current'));$('dryback-result').textContent=`${fmt(dryback.points,2)} percentage points = ${fmt(dryback.relative,2)}% of peak VWC.`;}catch(e){$('dryback-result').textContent=e.message;}
  configError='';try{config();}catch(e){configError=e.message;}$('config-error').textContent=configError;
}
function renderPlacement() {
  geometry=dimensions();placementError='';
  try {validatePlacement(geometry);}catch(e){placementError=e.message;}
  $('placement-error').textContent=placementError;
  try {const drawing=D.views(geometry);$('placement-diagram').innerHTML=drawing.top+drawing.section;}catch{$('placement-diagram').textContent='Enter valid dimensions to show the placement diagram.';}
  const mode=state.v.system;
  $('placement-intro').textContent=mode==='stack'?'After roots have entered the slab, measure the slab as the main root zone. Keep a cube probe only for a separate upper-block reading.':mode==='cube'?'Enter through the side of a sufficiently large cube. Keep the row of three rods level and the position fixed.':mode==='coco'?'Measure within the packed medium at a recorded depth. A curved pot wall is not a flat contact surface for the probe.':'Enter through a long side of the slab with the long sensor face level along its length.';
  const common=`Insert all ${unit(53,'height')} of each rod. The contact face is ${unit(88,'height')} × ${unit(26,'height')}. The dimensions alone do not establish the full sensing footprint.`;
  const notes=mode==='coco'?[common,'During filling, pack hydrated medium consistently around the rods without cavities. In a planted container, use a minimal side opening only where the container permits it.','Keep the sensing region away from the stem, direct emitter stream, drainage layer and container boundary. Support the housing and cable; check for air gaps as coco dries.']:mode==='cube'?[common,'Keep the long face horizontal. A small block may not contain the face or sensing region. Do not leave rods in air or pre-drill oversized holes.','Avoid the direct feed path and stem. Keep the selected depth fixed during calibration and normal readings.']:[common,mode==='stack'?'On a three-plant slab, start beside the middle block, outside its footprint. Record the actual position from a slab end.':'Choose a representative position away from slab ends, drain cuts and the direct feed path.','The three rods go across the slab width at the same height. Do not rotate the long sensor face vertically. Support the cable so it cannot move the probe.'];
  $('placement-notes').innerHTML=notes.map(n=>'<p>'+escapeHtml(n)+'</p>').join('');
  $('template-description').textContent=geometry.h>150?`For this taller substrate, the template locates the sensor face. Mark ${unit(geometry.center,'height')} from the medium's base with a ruler first; align the printed centreline to that mark.`:'Align the template base datum with the bottom of the growing medium, not the tray lip. Transfer the actual pin positions from your probe.';
  for(const id of ['print-button','download-template','download-diagram'])$(id).disabled=Boolean(placementError);
}
function renderCalibration() {
  const method=state.v['cal-method'], interval=Number(state.v.interval), minutes=interval*10/60;
  $('wet-cal').hidden=method!=='wet';$('weighed-cal').hidden=method!=='weighed';$('cal-options').hidden=method==='none';$('prepare-note').hidden=method==='none';
  const profile=W.PROFILES[state.v.system==='coco'?state.v.medium:state.v.system];
  const ready=!placementError&&state.v.placed&&!configError;
  $('prepare-note').textContent=ready?`Set Substrate Profile to “${profile}” before capturing. Changing this selection clears the device's old references.`:'Complete sensor positioning in step 2 before recording calibration. You can export starter YAML first if your device needs the v3 controls.';
  const common=[`On the sensor, select <strong>${escapeHtml(profile)}</strong> and turn <strong>Calibration mode</strong> on.`,`Wait for <strong>Capture ready</strong>: ten fresh readings with a RAW spread no greater than <strong>${fmt(val('spread'),0)} counts</strong>. At ${interval}-second sampling, allow about ${fmt(minutes,1)} minutes.`];
  const extra=method==='wet'?['At the settled wet condition, copy <strong>Capture RAW average</strong> below. Press <strong>Save wet reference</strong> on an existing v3 device and verify its saved value.']:['At each moisture level, weigh the same assembly and copy its <strong>Capture RAW average</strong>. Record A and B with enough separation, then measure an independent C.','The point instructions show the exact <strong>Weighed reference VWC</strong> to enter on the device while it is still at that moisture level. Restart the capture window after changing moisture and wait for it to settle.'];
  $('cal-instructions').innerHTML=method==='none'?'<p>The export will contain controller settings and the calibration controls. It will contain no invented wet reference or VWC calibration.</p>':'<ol>'+[...common,...extra].map(s=>'<li>'+s+'</li>').join('')+'</ol>';
  $('record-wet').disabled=!ready;
  $('wet-status').textContent=isRecorded('wet')?`Recorded RAW ${fmt(val('wet-raw'),3)}. Wet-reference index at this condition: 100.`:'';
  $('sample-note').textContent=`The monitored ${state.v.system==='cube'?'cube':state.v.system==='coco'?'container':'slab'} is ${unit(primaryVolume(),'volume')}. Use the actual specimen on the scale; do not use the allocated volume per plant.`;
  for(const key of ['a','b','c']) {
    $(key+'-badge').textContent=isRecorded(key)?'Recorded':'Not recorded';$(key+'-badge').classList.toggle('recorded',isRecorded(key));
    $('vwc-'+key).textContent='—';$('action-'+key).textContent=key==='c'?'Use a separate measured moisture level between A and B.':'Enter the mass and RAW average from the same stable moisture level.';
    try {
      const measured=TDR.weighed(val('dry'),val('mass-'+key),val('sample-volume'),val('density'));
      const v=Math.round(measured.vwc*10)/10;
      $('vwc-'+key).textContent=fmt(v,1)+'%';
      $('action-'+key).textContent=`At this moisture level: set Weighed reference VWC to ${fmt(v,1)}%, then press ${key==='c'?'Check independent weighed point C':'Capture weighed point '+key.toUpperCase()}. Verify the saved RAW and VWC.`;
    }catch{}
    $('record-'+key).disabled=!ready||(key==='c'&&(!isRecorded('a')||!isRecorded('b')));
  }
  const checkBox=$('fit-result');checkBox.classList.remove('pass','fail');
  checkBox.textContent='Record A and B, then check a separate intermediate moisture level C.';
  try {
    if(isRecorded('a')&&isRecorded('b')) {
      const a=getPoint('a'),b=getPoint('b');W.fit((a.raw+b.raw)/2,a,b);
      checkBox.textContent=`A–B interval: ${fmt(Math.min(a.raw,b.raw))}–${fmt(Math.max(a.raw,b.raw))} RAW. Record an independent point C to check the fit.`;
      if(isRecorded('c')) {
        const check=W.check(a,b,getPoint('c'),val('tolerance'));
        checkBox.classList.add(check.passed?'pass':'fail');checkBox.textContent=`Entered-reference check ${check.passed?'passes':'fails'}: ${fmt(check.error,2)} pp error; tolerance ±${fmt(val('tolerance'),1)} pp. ${check.passed?'Verify these saved values and live readiness on the sensor.':'Check the measurements and geometry before repeating calibration.'}`;
      }
    }
  }catch(e){checkBox.classList.add('fail');checkBox.textContent=e.message;}
  let cal=null;try{cal=recordedCalibration();}catch{}
  $('cal-summary').textContent=cal?.method==='wet'?'Wet reference recorded':cal?.method==='weighed'?'Entered A / B / C check passes':method==='none'?'Calibration deferred':'No complete reference set';
  $('cal-summary-note').textContent=cal?.method==='wet'?'A repeatable index; not absolute VWC.':cal?.method==='weighed'?'Physical sensor verification is still required.':'The export includes no calibration until valid records are present.';
}
function renderExport() {
  let c,cal;yamlText='';reportText='';$('export-error').textContent='';
  try {c=config();cal=recordedCalibration();}catch(e){$('export-error').textContent=e.message;}
  if(!c){for(const id of ['download-yaml','copy-yaml','download-secrets','download-report','download-record'])$(id).disabled=true;$('yaml-preview').textContent='Correct the controller parameters in step 1.';return;}
  $('export-tag').textContent=cal?.method==='wet'?'Wet reference':cal?.method==='weighed'?'Checked entered references':'Setup only';
  $('export-intro').textContent=cal?`For ${state.v['sensor-reference']||c.friendly}. Review the saved references on the physical sensor after applying them.`:'The configuration is ready to export. Calibration references are omitted until the required measurements are recorded and checked.';
  const rows=[['Substrate Profile',c.profile],['Controller',W.BOARDS[c.board].label],['SDI-12 data / address',`GPIO${c.pin} / ${c.address}`],['Sample interval / stale timeout',`${c.interval} s / ${c.interval*3} s`],['Capture maximum RAW spread',`${c.spread} counts`],['Third-point tolerance',`${fmt(c.tolerance,1)} pp`],['Primary measurement',state.v.system==='cube'?'Cube':state.v.system==='coco'?'Container':'Slab'],['Rod centreline above substrate base',unit(val('position'),'height')],['Allocated substrate per plant',unit(result?.plant,'volume')],['Total substrate per unit',unit(result?.unit,'volume')],['Whole irrigation zone',unit(result?.zone,'volume')]];
  if(cal?.method==='wet')rows.push(['Saved Wet RAW',fmt(cal.wet.raw,3)],['Meaning of wet reference','Index 100 at this reference; absolute VWC not calibrated']);
  if(cal?.method==='weighed') {
    for(const key of ['a','b','c'])rows.push([`Saved ${key.toUpperCase()} RAW / VWC`,`${fmt(cal[key].raw,3)} / ${fmt(cal[key].vwc,1)}%`]);
    rows.push(['Entered C error',`${fmt(cal.check.error,2)} pp`],['Sample actually weighed',unit(val('sample-volume'),'volume')]);
  }
  const actions=[`Set Substrate Profile to “${c.profile}” before collecting references. Changing this value clears old references.`,`Set Capture maximum RAW spread to ${c.spread} counts and Third-point tolerance to ${fmt(c.tolerance,1)} pp.`];
  if(cal?.method==='wet')actions.push(`If you pressed Save wet reference at the recorded plateau, verify Saved Wet RAW is ${fmt(cal.wet.raw,3)}. Otherwise use the generated YAML's explicit Import wizard references button for this same sensor and placement.`);
  else if(cal?.method==='weighed')actions.push('If you captured A, B and C on the device while following the wizard, verify its saved values against the table. Do not recapture old points at the current moisture level. To transfer this recorded set to the same sensor, use the generated YAML’s Import wizard references button.');
  else actions.push('Install the generated starter YAML if your device does not have the v3 capture controls, then return to the calibration step.');
  actions.push('Turn Calibration mode OFF when finished. Wait ten seconds before disconnecting power.');
  if(cal?.method==='weighed')actions.push('Check Sensor data fresh, Calibration status and VWC ready. VWC remains unavailable outside the measured A–B range. A passed browser calculation is not a live sensor readback.');
  actions.push('Enter the per-plant, per-unit or whole-zone volume in your steering app according to that app’s field definition. Geometry is a setup record; it is not an absolute VWC calibration coefficient.');
  $('settings-rows').innerHTML=rows.map(([label,value])=>`<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
  $('apply-instructions').innerHTML=actions.map(a=>'<li>'+escapeHtml(a)+'</li>').join('');
  try {yamlText=W.generateYaml(c,cal||{method:'none'});}catch(e){$('export-error').textContent=e.message;}
  $('yaml-preview').textContent=yamlText;
  $('yaml-note').textContent=`Pinned v3 packages for ${W.BOARDS[c.board].label}. ${cal?'Includes an explicit button to import this recorded reference set.':'Includes setup controls; calibration references are not included.'} Existing saved settings are applied only when you press Apply wizard setup.`;
  $('import-instruction').textContent=cal?'For this same probe, medium and placement, wait for Capture ready, then press Import wizard references once. Compare all saved values with the table.':'Complete calibration on the device using the wizard, then verify its saved references.';
  reportText=`TDR Sensor setup report\n${new Date().toISOString()}\nSensor / location: ${state.v['sensor-reference']||c.friendly}\nDisplay units: ${state.units}${state.units==='imperial'?' / '+state.gallon+' gallons':''}\nPackage revision: ${W.REF}\n\n${rows.map(([k,v])=>k+': '+v).join('\n')}\n\nApply on the sensor\n${actions.map((a,i)=>(i+1)+'. '+a).join('\n')}\n\nPlacement\n${$('placement-intro').textContent}\n${$('placement-notes').innerText}\n\nThe browser does not read or write a physical sensor.\n`;
  for(const id of ['download-yaml','copy-yaml','download-secrets'])$(id).disabled=!yamlText;
  $('download-report').disabled=!result;$('download-record').disabled=!cal;
  $('settings-output').hidden=state.tab!=='settings';$('yaml-output').hidden=state.tab!=='yaml';
  $('settings-tab').setAttribute('aria-selected',String(state.tab==='settings'));$('yaml-tab').setAttribute('aria-selected',String(state.tab==='yaml'));
}
function refresh() {renderVolume();renderPlacement();renderCalibration();renderExport();}
function onField(el) {
  const before=contextSignature();
  if(el.dataset.measure)state.n[el.id]=el.value.trim()===''?null:U.toSI(Number(el.value),el.dataset.measure,state.units,state.gallon);
  else state.v[el.id]=el.type==='checkbox'?el.checked:el.value;
  if(el.id==='gallon'){state.gallon=el.value;applyDisplay();refresh();save();return;}
  const geometryFields=['system','medium','block-preset','slab-preset','bl','bw','bh','sl','sw','sh','pv','pa','pb','ph','pot-method','pot-preset','position','sensor-reference','board','pin','device-name'];
  if(['block-preset','slab-preset'].includes(el.id)) {
    const entries=el.id==='block-preset'?SUBSTRATES.blocks:SUBSTRATES.slabs,prefix=el.id==='block-preset'?'b':'s',entry=entries.find(p=>p[0]===el.value);
    if(entry&&entry[0]!=='custom')['l','w','h'].forEach((axis,i)=>putNumber(prefix+axis,entry[i+2]));
  }
  for(const prefix of ['b','s'])if(['l','w','h'].some(axis=>el.id===prefix+axis)) {const id=prefix==='b'?'block-preset':'slab-preset';state.v[id]='custom';$(id).value='custom';}
  if(el.id==='pv'){state.v['pot-preset']='custom';$('pot-preset').value='custom';}
  if(el.id==='pot-preset'&&el.value!=='custom')putNumber('pv',Number(el.value));
  if(el.id==='board') {state.v.pin=String(W.BOARDS[state.v.board]?.pin||26);pinOptions(state.v.board,state.v.pin);}
  if(el.id==='system') {putNumber('plants',['cube','coco'].includes(el.value)?1:3);state.positionAuto=true;}
  if(el.id==='position')state.positionAuto=false;
  if(el.id==='paper')state.paperAuto=false;
  if(el.id==='sample-volume')state.sampleAuto=false;
  if(geometryFields.includes(el.id)) {
    if(el.id!=='position')resetPosition();
    state.v.placed=false;$('placed').checked=false;
  }
  if(geometryFields.includes(el.id)&&state.sampleAuto) {try{allocation();putNumber('sample-volume',primaryVolume());}catch{}}
  if(before!==contextSignature())clearRecords();
  if(el.id==='wet-raw')delete state.records.wet;
  for(const key of ['a','b','c'])if(['raw-'+key,'mass-'+key].includes(el.id)){delete state.records[key];if(key!=='c')delete state.records.c;}
  $('cal-error').textContent='';$('navigation-error').textContent='';
  refresh();save();
}
for(const el of fields)el.addEventListener(el.tagName==='SELECT'||el.type==='checkbox'?'change':'input',()=>onField(el));
for(const system of ['metric','imperial'])$(system).addEventListener('click',()=>{
  state.units=system;if(state.paperAuto)state.v.paper=system==='metric'?'A4':'Letter';
  applyDisplay();refresh();save();
});
for(const button of document.querySelectorAll('[data-step]'))button.addEventListener('click',()=>{refresh();showStep(Number(button.dataset.step));});
$('previous').addEventListener('click',()=>showStep(Math.max(0,state.step-1)));
$('next').addEventListener('click',()=>{
  refresh();let error='';
  if(!result)error=$('volume-error').textContent;
  else if(configError)error=configError;
  else if(state.step===1&&(placementError||!state.v.placed))error=placementError||'Confirm the installed probe position before continuing.';
  else if(state.step===2&&state.v['cal-method']!=='none') {try{if(!recordedCalibration())error='Complete the selected reference measurements, or choose Configure now, calibrate later.';}catch(e){error=e.message;}}
  if(error){$('navigation-error').textContent=error;return;}showStep(Math.min(3,state.step+1));
});
$('setup-only').addEventListener('click',()=>{state.v['cal-method']='none';$('cal-method').value='none';refresh();showStep(3);});
$('midpoint').addEventListener('click',()=>{const before=contextSignature();state.positionAuto=true;resetPosition();state.v.placed=false;$('placed').checked=false;if(before!==contextSignature())clearRecords();refresh();save();});
$('use-sample-volume').addEventListener('click',()=>{if(!result)return;const before=contextSignature();state.sampleAuto=true;putNumber('sample-volume',primaryVolume());if(before!==contextSignature())clearRecords();refresh();save();});
function record(key) {
  $('cal-error').textContent='';
  try {
    config();validatePlacement(dimensions());if(!state.v.placed)throw new Error('Confirm the physical probe position in step 2.');
    if(key==='wet')W.wetReference(val('wet-raw'));
    else {
      const point=getPoint(key);
      if(key==='b'&&isRecorded('a'))W.fit((point.raw+getPoint('a').raw)/2,getPoint('a'),point);
      if(key==='a'&&isRecorded('b'))W.fit((point.raw+getPoint('b').raw)/2,point,getPoint('b'));
      if(key==='c') {if(!isRecorded('a')||!isRecorded('b'))throw new Error('Record A and B before C.');W.check(getPoint('a'),getPoint('b'),point,val('tolerance'));}
    }
    if(['a','b'].includes(key))delete state.records.c;
    state.records[key]={signature:recordSignature(key),time:new Date().toISOString()};
    refresh();save();toast(key==='wet'?'Wet reference recorded.':`Point ${key.toUpperCase()} recorded.`);
  }catch(e){$('cal-error').textContent=e.message;}
}
$('record-wet').addEventListener('click',()=>record('wet'));
for(const key of ['a','b','c'])$('record-'+key).addEventListener('click',()=>record(key));
for(const tab of ['settings','yaml'])$(tab+'-tab').addEventListener('click',()=>{state.tab=tab;renderExport();save();});
function download(content,name,type='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('save-project').addEventListener('click',()=>download(JSON.stringify(state,null,2),'tdr-setup.json','application/json'));
$('load-project').addEventListener('change',async event=>{
  try {const file=event.target.files[0];if(!file)return;if(file.size>128000)throw new Error('Setup file is too large. Choose an exported TDR setup JSON.');state=sanitise(JSON.parse(await file.text()));applyDisplay();refresh();showStep(state.step);toast('Setup loaded. Verify the sensor identity and physical placement before use.');}catch(e){toast(e.message);}finally{event.target.value='';}
});
$('reset').addEventListener('click',()=>{
  if(!window.confirm('Clear this saved setup and its calibration records? Save a setup file first if you need to keep them.'))return;
  state=structuredClone(defaults);applyDisplay();refresh();showStep(0);toast('Setup reset.');
});
$('download-yaml').addEventListener('click',()=>{renderExport();if(yamlText)download(yamlText,config().name+'.yaml','text/yaml;charset=utf-8');});
$('download-secrets').addEventListener('click',()=>download(W.secretsExample(config()),'secrets.yaml.example','text/yaml;charset=utf-8'));
$('copy-yaml').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(yamlText);toast('YAML copied.');}catch{toast('Clipboard access is unavailable. Use Download device YAML.');}});
$('download-report').addEventListener('click',()=>{renderExport();download(reportText,'tdr-sensor-setup.txt');});
$('download-record').addEventListener('click',()=>{
  let cal;try{cal=recordedCalibration();}catch{return;}if(!cal)return;
  const header=['timestamp_utc','sensor_reference','method','point','raw_average','sample_volume_L','dry_mass_g','current_mass_g','density_g_mL','reference_vwc_percent','exact_weighed_vwc_percent','solution_temperature_C','substrate_profile'];
  const keys=cal.method==='wet'?['wet']:['a','b','c'];
  const rows=keys.map(key=>[state.records[key].time,state.v['sensor-reference'],cal.method,key.toUpperCase(),key==='wet'?cal.wet.raw:cal[key].raw,...(key==='wet'?['','','','','','']:[cal[key].volume,cal[key].dry,cal[key].mass,cal[key].density,cal[key].vwc,cal[key].exactVwc]),Number.isFinite(val('solution-temp'))?val('solution-temp'):'',config().profile]);
  download([header,...rows].map(row=>row.map(TDR.escapeCsv).join(',')).join('\r\n'),'tdr-calibration-record.csv','text/csv;charset=utf-8');
});
function printTemplate() {
  $('print-error').textContent='';
  try {
    validatePlacement(dimensions());
    $('print-sheet').innerHTML=D.template(dimensions(),state.v.paper);
    let pageStyle=$('print-page-style');if(!pageStyle){pageStyle=document.createElement('style');pageStyle.id='print-page-style';document.head.append(pageStyle);}
    pageStyle.textContent=`@page { size: ${state.v.paper==='Letter'?'letter':'A4'} portrait; margin: 0; }`;
    return true;
  }catch(e){$('print-error').textContent=e.message;return false;}
}
$('print-button').addEventListener('click',()=>{if(printTemplate())window.print();});
$('download-template').addEventListener('click',()=>{if(printTemplate())download(D.template(dimensions(),state.v.paper),'mt22-placement-'+state.v.paper.toLowerCase()+'.svg','image/svg+xml');});
$('download-diagram').addEventListener('click',()=>download(D.combined(dimensions()),'mt22-'+state.v.system+'-placement.svg','image/svg+xml'));
window.addEventListener('beforeprint',printTemplate);
window.addEventListener('hashchange',()=>{const step=['#volume','#place','#weigh','#export'].indexOf(location.hash);if(step>=0)showStep(step);});
applyDisplay();refresh();
const hashStep=['#volume','#place','#weigh','#export'].indexOf(location.hash);
showStep(hashStep>=0?hashStep:state.step,false);
