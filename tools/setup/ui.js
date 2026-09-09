"use strict";
const $ = (id) => document.getElementById(id);
const value = (id) => {
  const s = $(id).value.trim();
  return s === "" ? NaN : Number(s);
};
const fmt = (v, d = 3) =>
  Number(v).toLocaleString(undefined, { maximumFractionDigits: d });
let allocation = null,
  weighed = null;
const records = [];
function setPresets(id, entries, selected) {
  for (const [key, label] of entries)
    $(id).add(new Option(label, key, key === selected, key === selected));
}
setPresets("block-preset", SUBSTRATES.blocks, "hugo");
setPresets("slab-preset", SUBSTRATES.slabs, "s1001575");
function loadPreset(id, entries, prefix) {
  const entry = entries.find((x) => x[0] === $(id).value);
  if (entry && entry[0] !== "custom")
    ["l", "w", "h"].forEach((x, i) => ($(prefix + x).value = entry[i + 2]));
  calculate();
}
$("block-preset").addEventListener("change", () =>
  loadPreset("block-preset", SUBSTRATES.blocks, "b"),
);
$("slab-preset").addEventListener("change", () =>
  loadPreset("slab-preset", SUBSTRATES.slabs, "s"),
);
for (const prefix of ["b", "s"])
  for (const axis of ["l", "w", "h"])
    $(prefix + axis).addEventListener(
      "input",
      () =>
        ($(prefix === "b" ? "block-preset" : "slab-preset").value = "custom"),
    );
$("pot-preset").addEventListener("change", () => {
  if ($("pot-preset").value !== "custom") {
    $("pv").value = $("pot-preset").value;
    $("pu").value = "L";
  }
  calculate();
});
$("pv").addEventListener("input", () => ($("pot-preset").value = "custom"));
$("pu").addEventListener("change", () => ($("pot-preset").value = "custom"));
$("system").addEventListener("change", () => {
  if (["cube", "coco"].includes($("system").value)) $("plants").value = 1;
  else $("plants").value = 3;
  calculate();
});
function calculate() {
  const mode = $("system").value,
    pot = $("pot-method").value;
  $("block-fields").hidden = !["cube", "stack"].includes(mode);
  $("slab-fields").hidden = !["slab", "stack"].includes(mode);
  $("coco-fields").hidden = mode !== "coco";
  $("known-pot").hidden = pot !== "known";
  $("pot-dimensions").hidden = pot === "known";
  $("pot-a-label").textContent =
    pot === "box" ? "Inside length · cm" : "Top diameter · cm";
  $("pot-b-label").textContent =
    pot === "box" ? "Inside width · cm" : "Bottom diameter · cm";
  allocation = null;
  $("volume-error").textContent = "";
  for (const id of ["per-plant", "per-unit", "per-zone", "plant-total"])
    $(id).textContent = "—";
  $("volume-detail").textContent = "";
  $("shot-result").textContent = "";
  try {
    const block = ["cube", "stack"].includes(mode)
      ? TDR.box(value("bl"), value("bw"), value("bh"))
      : 0;
    let base = ["slab", "stack"].includes(mode)
      ? TDR.box(value("sl"), value("sw"), value("sh"))
      : 0;
    if (mode === "coco")
      base =
        pot === "known"
          ? TDR.litres(value("pv"), $("pu").value)
          : pot === "box"
            ? TDR.box(value("pa"), value("pb"), value("ph"))
            : TDR.taperedPot(value("pa"), value("pb"), value("ph"));
    if (mode === "cube" && value("plants") !== 1)
      throw new Error(
        "For cubes only use one plant per unit; enter the number of cubes as units.",
      );
    allocation = TDR.allocation(block, base, value("plants"), value("units"));
    $("per-plant").textContent = fmt(allocation.plant) + " L";
    $("per-unit").textContent = fmt(allocation.unit) + " L";
    $("per-zone").textContent = fmt(allocation.zone) + " L";
    $("plant-total").textContent = fmt(allocation.plants, 0);
    $("volume-detail").textContent =
      mode === "stack"
        ? `${fmt(block)} L cube + ${fmt(base)} L slab ÷ ${value("plants")} plants. This is an allocation, not a root boundary.`
        : mode === "cube"
          ? `${fmt(block)} L per measured block.`
          : `${fmt(base)} L filled medium per unit, shared by ${value("plants")} plant(s).`;
    try {
      const s = TDR.shot(
        allocation.plant,
        value("shot-pct"),
        value("emitters"),
        value("flow"),
      );
      $("shot-result").textContent =
        `${fmt(s.ml, 1)} mL per plant · ${fmt(s.seconds, 1)} seconds at the entered flow. Measure delivery with a catch test; drainage and redistribution change the resulting VWC.`;
    } catch (e) {
      $("shot-result").textContent = e.message;
    }
  } catch (e) {
    $("volume-error").textContent = e.message;
  }
  weighed = null;
  $("weigh-error").textContent = "";
  $("weighed-vwc").textContent = "—";
  $("water-volume").textContent = "";
  try {
    weighed = TDR.weighed(
      value("dry"),
      value("wet"),
      value("sample-volume"),
      value("density"),
    );
    $("weighed-vwc").textContent = fmt(weighed.vwc, 2) + "%";
    $("water-volume").textContent =
      fmt(weighed.waterMl, 1) + " mL of water in the weighed sample.";
  } catch (e) {
    $("weigh-error").textContent = e.message;
  }
  $("save-record").disabled = !weighed;
  $("download-record").disabled = records.length === 0;
  try {
    const d = TDR.dryback(value("peak"), value("current"));
    $("dryback-result").textContent =
      `${fmt(d.points, 2)} percentage points = ${fmt(d.relative, 2)}% of the peak VWC.`;
  } catch (e) {
    $("dryback-result").textContent = e.message;
  }
}
document
  .querySelectorAll("input,select")
  .forEach((el) => el.addEventListener("input", calculate));
$("save-record").addEventListener("click", () => {
  calculate();
  if (!weighed) return;
  const raw = value("record-raw");
  if (!Number.isFinite(raw) || raw <= 0 || raw > 4095) {
    $("record-status").textContent =
      "Enter a RAW average between 1 and 4095 before saving.";
    return;
  }
  records.push([
    new Date().toISOString(),
    $("record-label").value,
    $("point").value,
    value("sample-volume"),
    value("dry"),
    value("wet"),
    value("density"),
    raw,
    weighed.vwc,
  ]);
  $("record-status").textContent =
    `${records.length} record(s) added. Download before closing this page.`;
  calculate();
});
$("download-record").addEventListener("click", () => {
  const header = [
    "timestamp_utc",
    "sample_sensor_reference",
    "point",
    "sample_volume_L",
    "dry_assembly_g",
    "current_assembly_g",
    "density_g_ml",
    "capture_raw",
    "weighed_vwc_percent",
  ];
  const csv = [header, ...records]
    .map((row) => row.map(TDR.escapeCsv).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "tdr-calibration-record.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function printTemplate() {
  const h = value("print-height"),
    z = value("print-center");
  $("print-error").textContent = "";
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(z) ||
    h < 26 ||
    h > 160 ||
    z < 13 ||
    z > h - 13
  ) {
    $("print-error").textContent =
      "Height must be 26–160 mm; keep the full 26 mm contact face inside the substrate.";
    return false;
  }
  const base = 242,
    cy = base - z,
    top = base - h;
  // Every SVG coordinate is a physical millimetre on an A4 page.
  $("print-sheet").innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297"><style>text{font-family:Arial,sans-serif;fill:#111;font-size:3.2px}.small{font-size:2.8px}line,rect{stroke:#111;stroke-width:.25;fill:none}</style><text x="15" y="19" style="font-size:7px;font-weight:bold">MT22 placement template</text><text x="15" y="29">Substrate ${h} mm · chosen rod centreline ${z} mm above the base</text><text x="15" y="37">Print A4 / actual size / 100%. Disable Fit, Shrink and headers/footers.</text><text x="15" y="44">Measure BOTH 100 mm bars before using the sheet.</text><text x="15" y="51">User-selected position; not a manufacturer-validated depth.</text><text x="15" y="58">Transfer the actual pins to the line. Pin spacing is not specified.</text><rect x="15" y="${top}" width="170" height="${h}" stroke-dasharray="2 2"/><text x="15" y="${top - 3}">SUBSTRATE TOP</text><line x1="15" y1="${base}" x2="185" y2="${base}" style="stroke-width:.6"/><text x="15" y="${base + 6}">BASE DATUM — bottom of growing medium, not gutter lip</text><rect x="61" y="${cy - 13}" width="88" height="26"/><line x1="25" y1="${cy}" x2="175" y2="${cy}" stroke-dasharray="2 1"/><text x="66" y="${cy - 5}">88 × 26 mm contact face</text><text x="66" y="${cy + 8}">All three rod centres on this line</text><text x="15" y="260" class="small">Full rod insertion: 53 mm. Keep the long body level along the slab.</text><line x1="20" y1="279" x2="120" y2="279"/><line x1="20" y1="277" x2="20" y2="281"/><line x1="120" y1="277" x2="120" y2="281"/><text x="57" y="275">100 mm</text><line x1="196" y1="140" x2="196" y2="240"/><line x1="194" y1="140" x2="198" y2="140"/><line x1="194" y1="240" x2="198" y2="240"/><text x="199" y="185" transform="rotate(90 199 185)">100 mm</text><text x="15" y="290" class="small">INFWIN MT22 dimensions · verify your sensor revision · docs/PLACEMENT.md</text></svg>`;
  return true;
}
$("print-button").addEventListener("click", () => {
  if (printTemplate()) window.print();
});
window.addEventListener("beforeprint", printTemplate);
calculate();
