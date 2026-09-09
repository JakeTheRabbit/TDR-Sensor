const test = require("node:test"),
  assert = require("node:assert/strict");
const T = require("../tools/setup/calculator.js"),
  S = require("../tools/setup/substrates.js");
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("Hugo is based on real metric dimensions, not a perfect six-inch cube", () =>
  near(T.box(15, 15, 14.2), 3.195));
test("three Hugo blocks on 1m x 15cm x 7.5cm slab", () => {
  const v = T.allocation(3.195, 11.25, 3, 4);
  near(v.plant, 6.945);
  near(v.unit, 20.835);
  near(v.zone, 83.34);
  assert.equal(v.plants, 12);
});
test("100 x 20 x 10 shared slab counts once", () =>
  near(T.allocation(3.195, T.box(100, 20, 10), 3, 1).plant, 9.861666666666666));
test("cube only and shared coco allocation", () => {
  near(T.allocation(3.195, 0, 1, 1).plant, 3.195);
  near(T.allocation(0, 10, 2, 1).plant, 5);
});
test("US and Imperial gallons stay distinct", () => {
  near(T.litres(3, "USgal"), 11.356235352);
  near(T.litres(3, "Impgal"), 13.63827);
});
test("cylinder and truncated-cone volume", () => {
  near(T.taperedPot(20, 20, 30), 3 * Math.PI);
  near(T.taperedPot(30, 20, 25), (25 * Math.PI * 1900) / 12000);
});
test("weighed water volume and tare", () => {
  const v = T.weighed(500, 8000, 11.25);
  near(v.waterMl, 7500);
  near(v.vwc, 66.66666666666667);
  near(T.weighed(600, 8100, 11.25).vwc, v.vwc);
});
test("weighed density correction", () =>
  near(T.weighed(100, 1098, 2, 0.998).vwc, 50));
test("shot uses emitter total flow per plant", () => {
  const s = T.shot(6.945, 2, 2, 2);
  near(s.ml, 138.9);
  near(s.seconds, 125.01);
});
test("dryback points differ from relative percent", () => {
  const d = T.dryback(70, 60);
  near(d.points, 10);
  near(d.relative, 100 / 7);
});
test("rising VWC produces negative dryback, not a hidden clamp", () =>
  near(T.dryback(60, 70).points, -10));
test("invalid geometry, fractions, missing values and impossible water rejected", () => {
  for (const f of [
    () => T.box(0, 10, 10),
    () => T.allocation(1, 2, 0, 1),
    () => T.allocation(1, 2, 1.5, 1),
    () => T.allocation(0, 0, 1, 1),
    () => T.box(NaN, 1, 1),
    () => T.weighed(500, 400, 1),
    () => T.weighed(10, 2010, 1),
    () => T.shot(1, 2, 0, 2),
    () => T.litres(3, "gallons"),
    () => T.weighed(-1, 500, 1),
    () => T.box("10", 10, 10),
    () => T.dryback(0, 0),
  ])
    assert.throws(f);
});
test("every preset has valid dimensions and unique key within its group", () => {
  for (const entries of Object.values(S)) {
    const ids = new Set();
    for (const [id, label, l, w, h] of entries) {
      assert.ok(!ids.has(id));
      ids.add(id);
      assert.ok(label);
      assert.ok(T.box(l, w, h) > 0);
    }
  }
});
test("CSV escapes quoted labels and neutralises formulas", () => {
  assert.equal(T.escapeCsv('a"b'), '"a""b"');
  assert.equal(T.escapeCsv("=1+1"), '"\'=1+1"');
  assert.equal(T.escapeCsv("plain"), '"plain"');
});
