/* All stored calculations use cm, mm, L, mL and g. Display conversion is reversible. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TDRUnits = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const GALLON = { US: 3.785411784, UK: 4.54609 };
  const OUNCE = { US: 29.5735295625, UK: 28.4130625 };
  function definition(kind, system = 'metric', gallon = 'US') {
    if (!['metric', 'imperial'].includes(system) || !(gallon in GALLON)) throw new Error('Unknown display units.');
    const metric = {
      length: [1, 'cm'], height: [1, 'mm'], volume: [1, 'L'],
      smallVolume: [1, 'mL'], mass: [1, 'g'], flow: [1, 'L/h'],
      density: [1, 'g/mL'], temperature: [1, '°C'], count: [1, ''],
    };
    const imperial = {
      length: [2.54, 'in'], height: [25.4, 'in'], volume: [GALLON[gallon], `${gallon} gal`],
      smallVolume: [OUNCE[gallon], `${gallon} fl oz`], mass: [453.59237, 'lb'],
      flow: [GALLON[gallon], `${gallon} gal/h`], density: [453.59237 / OUNCE[gallon], `lb/${gallon} fl oz`],
      temperature: [5 / 9, '°F'], count: [1, ''],
    };
    const pair = (system === 'metric' ? metric : imperial)[kind];
    if (!pair) throw new Error('Unknown measurement type.');
    return { factor: pair[0], label: pair[1], offset: kind === 'temperature' && system === 'imperial' ? 32 : 0 };
  }
  function fromSI(value, kind, system, gallon) {
    const unit = definition(kind, system, gallon);
    return value / unit.factor + unit.offset;
  }
  function toSI(value, kind, system, gallon) {
    const unit = definition(kind, system, gallon);
    return (value - unit.offset) * unit.factor;
  }
  function format(value, kind, system = 'metric', gallon = 'US', digits = 3) {
    if (!Number.isFinite(value)) return '—';
    const label = definition(kind, system, gallon).label;
    return `${fromSI(value, kind, system, gallon).toLocaleString('en', {maximumFractionDigits: digits})}${label ? ' ' + label : ''}`;
  }
  return { definition, fromSI, toSI, format };
});
