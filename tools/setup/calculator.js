/* Offline calculations. The browser and node tests run this same code. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TDR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function positive(n, label) {
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) throw new Error(`${label} must be greater than zero.`);
    return n;
  }
  function nonnegative(n, label) {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) throw new Error(`${label} must be zero or greater.`);
    return n;
  }
  function whole(n, label) {
    positive(n, label);
    if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
    return n;
  }
  function box(l, w, h) { return positive(l, 'Length') * positive(w, 'Width') * positive(h, 'Height') / 1000; }
  function taperedPot(top, bottom, height) {
    positive(top, 'Top diameter'); positive(bottom, 'Bottom diameter'); positive(height, 'Fill height');
    return Math.PI * height * (top * top + top * bottom + bottom * bottom) / 12000;
  }
  function litres(value, unit) {
    positive(value, 'Volume');
    const factors = { L: 1, USgal: 3.785411784, Impgal: 4.54609 };
    if (!(unit in factors)) throw new Error('Choose litres, US gallons or Imperial gallons.');
    return value * factors[unit];
  }
  function allocation(cubeL, baseL, plants, units) {
    nonnegative(cubeL, 'Block volume'); nonnegative(baseL, 'Shared base volume');
    whole(plants, 'Plants per unit'); whole(units, 'Number of units');
    const unit = baseL + plants * cubeL;
    positive(unit, 'Total substrate');
    return { plant: unit / plants, unit, zone: unit * units, plants: plants * units };
  }
  function weighed(dry, wet, volumeL, density = 1) {
    nonnegative(dry, 'Dry assembly mass'); positive(wet, 'Wet assembly mass');
    positive(volumeL, 'Sample volume'); positive(density, 'Water density');
    if (wet < dry) throw new Error('Wet mass cannot be below dry mass.');
    const waterMl = (wet - dry) / density;
    const vwc = 100 * waterMl / (volumeL * 1000);
    if (vwc > 100) throw new Error('Calculated VWC exceeds 100%. Check volume, tare and units.');
    return { waterMl, vwc };
  }
  function shot(volumeL, percent, emitters, flowLh) {
    positive(volumeL, 'Allocated substrate volume'); positive(percent, 'Shot percent');
    if (percent > 100) throw new Error('Shot percent cannot exceed 100.');
    whole(emitters, 'Emitters per plant'); positive(flowLh, 'Measured emitter flow');
    const ml = volumeL * 1000 * percent / 100;
    return { ml, seconds: ml / (emitters * flowLh * 1000 / 3600) };
  }
  function dryback(peak, current) {
    positive(peak, 'Peak VWC'); nonnegative(current, 'Current VWC');
    if (peak > 100 || current > 100) throw new Error('VWC cannot exceed 100%.');
    return { points: peak - current, relative: 100 * (peak - current) / peak };
  }
  function escapeCsv(value) {
    // Block spreadsheet formula execution in user-entered record labels.
    let s = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return { box, taperedPot, litres, allocation, weighed, shot, dryback, escapeCsv };
});
