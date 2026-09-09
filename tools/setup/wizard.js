/* Shared browser / node model. Generated YAML targets the pinned, tested v3 packages. */
(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./calculator.js') : root.TDR);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TDRWizard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(T) {
  'use strict';
  const REF = '7668f6adf7e95c90d9b21230810079e952a6fb2f';
  const BOARDS = {
    'atom-lite': { label: 'M5Stack Atom Lite', pin: 26, pins: [26, 32] },
    'atom-s3': { label: 'M5Stack AtomS3 Lite', pin: 1, pins: [1, 2] },
    'atom-poe': { label: 'M5Stack Atom PoE', pin: 26, pins: [26, 32], ethernet: true },
    'm5-dial': { label: 'M5Stack Dial', pin: 2, pins: [1, 2] },
    'esp32-generic': { label: 'Generic ESP32', pin: 16, pins: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33] },
  };
  const PROFILES = { cube: 'Rockwool cube', stack: 'Rockwool cube on slab', slab: 'Rockwool slab', coco: 'Coco', peat: 'Peat mix' };
  function raw(value) {
    if (!Number.isFinite(value) || value <= 0 || value > 4095) throw new Error('RAW average must be above 0 and at most 4095.');
    return value;
  }
  function generic(r) {
    raw(r);
    return 100 * (((6.771e-10 * r - 5.105e-6) * r + 1.302e-2) * r - 10.848);
  }
  function point(rawAverage, mass, dry, volume, density = 1) {
    raw(rawAverage);
    const weighed = T.weighed(dry, mass, volume, density);
    // The sensor's input number steps in 0.1 percentage points. Use that same value in its fit.
    const vwc = Math.round(weighed.vwc * 10) / 10;
    if (vwc <= 0 || vwc >= 100) throw new Error('Measured VWC must round to a value strictly between 0% and 100%.');
    return {raw: rawAverage, mass, dry, volume, density, vwc, exactVwc: weighed.vwc};
  }
  function fit(r, a, b) {
    raw(r); raw(a.raw); raw(b.raw);
    if (![a.vwc, b.vwc].every(v => Number.isFinite(v) && v > 0 && v < 100)) throw new Error('A and B need measured VWC between 0% and 100%.');
    if (Math.abs(a.raw - b.raw) < 100) throw new Error('A and B need at least 100 RAW counts separation.');
    if (Math.abs(a.vwc - b.vwc) < 10) throw new Error('A and B need at least 10 VWC percentage points separation.');
    if ((a.raw - b.raw) * (a.vwc - b.vwc) <= 0) throw new Error('The wetter point must have the higher RAW response. Check the labels and measurements.');
    if (r < Math.min(a.raw, b.raw) || r > Math.max(a.raw, b.raw)) throw new Error('The reading is outside the measured A–B range.');
    const ga = generic(a.raw), gb = generic(b.raw);
    if (Math.abs(gb - ga) < 0.1) throw new Error('The measured response span is too small for a fit.');
    const v = a.vwc + (generic(r) - ga) * (b.vwc - a.vwc) / (gb - ga);
    if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error('The fitted VWC is outside 0–100%.');
    return v;
  }
  function check(a, b, c, tolerance = 3) {
    if (!Number.isFinite(tolerance) || tolerance < 0.5 || tolerance > 10) throw new Error('Third-point tolerance must be 0.5–10 percentage points.');
    if (!c || !Number.isFinite(c.vwc) || c.vwc <= 0 || c.vwc >= 100) throw new Error('Record an independent point C.');
    raw(c.raw);
    const margin = 0.1 * Math.abs(a.raw - b.raw);
    if (c.raw <= Math.min(a.raw, b.raw) + margin || c.raw >= Math.max(a.raw, b.raw) - margin) throw new Error('C must be inside the middle 80% of the A–B RAW interval.');
    const predicted = fit(c.raw, a, b), error = predicted - c.vwc;
    return { predicted, error, passed: Math.abs(error) <= tolerance };
  }
  function wetReference(r) {
    if (generic(r) <= 5) throw new Error('This RAW response is too low to establish a usable wet-reference index. Check the reading and contact.');
    return {raw: r};
  }
  function config(c) {
    if (!(c.board in BOARDS)) throw new Error('Select a supported controller board.');
    if (!BOARDS[c.board].pins.includes(c.pin)) throw new Error('Select an available data pin for this board.');
    if (!/^[0-9A-Za-z]$/.test(c.address)) throw new Error('SDI-12 address must be one character: 0–9, A–Z or a–z.');
    if (!/^[a-z0-9][a-z0-9-]{0,29}$/.test(c.name)) throw new Error('Device name must be 1–30 lowercase letters, numbers or hyphens, starting with a letter or number.');
    if (typeof c.friendly !== 'string' || !c.friendly.trim() || c.friendly.length > 80 || /[\r\n\x00-\x1f]/.test(c.friendly)) throw new Error('Enter a display name of 1–80 characters on one line.');
    if (!Object.values(PROFILES).includes(c.profile)) throw new Error('Select the substrate profile.');
    if (![10, 30, 60, 120].includes(c.interval)) throw new Error('Select a supported sampling interval.');
    if (!Number.isInteger(c.spread) || c.spread < 1 || c.spread > 100) throw new Error('Capture spread must be a whole number from 1 to 100.');
    if (!Number.isFinite(c.tolerance) || c.tolerance < 0.5 || c.tolerance > 10) throw new Error('Third-point tolerance must be 0.5–10 percentage points.');
    return c;
  }
  function calibrationValid(cal, tolerance) {
    if (!cal || cal.method === 'none') return false;
    if (cal.method === 'wet') { wetReference(cal.wet.raw); return true; }
    if (cal.method !== 'weighed') throw new Error('Unknown calibration method.');
    if (!check(cal.a, cal.b, cal.c, tolerance).passed) throw new Error('Independent point C fails the selected tolerance. No calibration import can be generated.');
    return true;
  }
  function generateYaml(c, cal = {method: 'none'}) {
    config(c);
    const hasCalibration = calibrationValid(cal, c.tolerance);
    const q = JSON.stringify, n = v => Number(v.toFixed(8)).toString();
    const files = [`esphome/packages/boards/${c.board}.yaml`, 'esphome/packages/tdr_sdi12_core.yaml', 'esphome/packages/tdr_analytics.yaml'];
    if (!BOARDS[c.board].ethernet) files.push('esphome/packages/wifi_extras.yaml');
    let yaml = `# Generated by TDR Sensor setup. Build with ESPHome 2026.8.2.\n# Add your own secrets.yaml. Settings apply only when you press Apply wizard setup.\n# Existing saved preferences take precedence over initial defaults.\n# Calibration belongs to this individual probe, medium and placement.\n# SDI-12 address character: ${c.address}; the driver uses its numeric index below.\nsubstitutions:\n  name: ${q(c.name)}\n  friendly_name: ${q(c.friendly)}\n  sdi12_data_pin: GPIO${c.pin}\n  sdi12_address: ${q(String("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c.address)))}\n  sample_interval: ${c.interval}s\n  sample_timeout: ${c.interval * 3}s\n  sample_timeout_ms: ${q(String(c.interval * 3000))}\n  timezone: UTC\n\npackages:\n  tdr:\n    url: https://github.com/JakeTheRabbit/TDR-Sensor\n    ref: ${REF}\n    files:\n${files.map(f => '      - ' + f).join('\n')}\n\napi:\n  encryption:\n    key: !secret api_encryption_key\nota:\n  - platform: esphome\n    password: !secret ota_password\nweb_server:\n  auth:\n    username: !secret web_username\n    password: !secret web_password\n`;
    if (!BOARDS[c.board].ethernet) yaml += `wifi:\n  ssid: !secret wifi_ssid\n  password: !secret wifi_password\n  ap:\n    password: !secret fallback_ap_password\n`;
    yaml += `\nselect:\n  - id: !extend substrate_profile\n    initial_option: ${q(c.profile)}\nnumber:\n  - id: !extend capture_spread_limit\n    initial_value: ${c.spread}\n  - id: !extend validation_tolerance\n    initial_value: ${n(c.tolerance)}\n\nbutton:\n  - platform: template\n    name: "Apply wizard setup"\n    entity_category: config\n    on_press:\n      - switch.turn_on: calibration_mode\n      - if:\n          condition:\n            lambda: 'return id(substrate_profile).current_option() != ${q(c.profile)};'\n          then:\n            - select.set:\n                id: substrate_profile\n                option: ${q(c.profile)}\n      - number.set:\n          id: capture_spread_limit\n          value: ${c.spread}\n      - number.set:\n          id: validation_tolerance\n          value: ${n(c.tolerance)}\n      - script.execute: restart_capture\n`;
    if (hasCalibration) {
      let assignments = 'id(wet_raw)=NAN; id(a_raw)=NAN; id(a_vwc)=NAN;\n            id(b_raw)=NAN; id(b_vwc)=NAN; id(c_raw)=NAN; id(c_vwc)=NAN;';
      if (cal.method === 'wet') assignments += `\n            id(wet_raw)=${n(cal.wet.raw)}f;`;
      else for (const key of ['a', 'b', 'c']) assignments += `\n            id(${key}_raw)=${n(cal[key].raw)}f; id(${key}_vwc)=${n(cal[key].vwc)}f;`;
      // C++ float literals need a decimal or exponent even for integer-valued records.
      assignments = assignments.replace(/=(\d+)f/g, '=$1.0f');
      yaml += `\n  # Optional manual import. There is no on_boot reference write.\n  - platform: template\n    name: "Import wizard references"\n    entity_category: config\n    on_press:\n      - lambda: |-\n          if (!id(calibration_mode).state || id(substrate_profile).current_option() != ${q(c.profile)}) {\n            id(last_action).publish_state("Press Apply wizard setup first."); return;\n          }\n          if (!id(raw_seen) || (uint32_t)(millis()-id(last_raw_ms)) > \${sample_timeout_ms}U || id(raw_count) < 10) {\n            id(last_action).publish_state("Not imported: wait for ten fresh readings."); return;\n          }\n          float lo=id(raw_window)[0], hi=lo;\n          for (float r:id(raw_window)) {lo=std::min(lo,r); hi=std::max(hi,r);}\n          if (!std::isfinite(id(capture_spread_limit).state) || hi-lo > id(capture_spread_limit).state) {\n            id(last_action).publish_state("Not imported: RAW is still changing."); return;\n          }\n          ${assignments}\n          id(cal_revision)++;\n          id(vwc_ready).publish_state(false); id(vwc).publish_state(NAN);\n          id(last_action).publish_state("Wizard references imported. Check saved values; wait 10s before power off. Turn Calibration mode OFF when finished.");\n      - script.execute: publish_readings\n`;
    }
    return yaml;
  }
  function secretsExample(c) {
    config(c);
    let s = '# Fill these values locally. Do not commit secrets.yaml.\napi_encryption_key: "REPLACE_WITH_A_32_BYTE_BASE64_KEY"\nota_password: "REPLACE_WITH_A_UNIQUE_PASSWORD"\nweb_username: "admin"\nweb_password: "REPLACE_WITH_A_UNIQUE_PASSWORD"\n';
    if (!BOARDS[c.board].ethernet) s += 'wifi_ssid: "YOUR_WIFI_NETWORK"\nwifi_password: "YOUR_WIFI_PASSWORD"\nfallback_ap_password: "REPLACE_WITH_AT_LEAST_8_CHARACTERS"\n';
    return s;
  }
  return { REF, BOARDS, PROFILES, generic, point, fit, check, wetReference, config, generateYaml, secretsExample };
});
