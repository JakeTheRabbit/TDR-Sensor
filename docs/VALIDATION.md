# Validation

Use **ESPHome 2026.8.2**. Source checks, compiled host tests and firmware builds validate software behaviour; they do not establish physical sensor accuracy, electrical compatibility or crop targets.

## Reproduce the checks

```sh
pip install esphome==2026.8.2 PyYAML==6.0.2
node --test tests/calculator.test.js tests/wizard.test.js
python tests/test_generated_configs.py --compile
python tests/test_firmware.py
python tests/test_repository.py
python tests/check_configs.py
esphome compile esphome/factory/tdr-sensor-atom-lite-factory.yaml
```

The host firmware test needs a C++17 compiler (`g++` by default); use `--cxx /path/to/clang++` or `--cxx C:/path/to/zig.exe` when appropriate. It extracts and executes the **actual YAML lambdas**, including the capture/publish path, with small host stubs for ESPHome entities. This checks calibration arithmetic and state transitions, while the real ESPHome build checks framework/API integration.

Covered cases include A/B order, invalid/reversed/too-close points, rejected extrapolation, independent C checks, paused calibration output, endpoint recapture invalidating C, stale readings, unchanged but fresh RAW, millisecond rollover, initial missing peaks, equal-value plateau completion, and history resets after calibration changes or unavailable VWC.

The setup tests run the same JavaScript used in the page. They cover real Hugo dimensions, shared-slab allocation, coco pots, US/Imperial gallons, tapered geometry, weighed tare/density, emitter runtime, dryback units, input rejection and CSV escaping. Repository checks verify local links and important measurement/blueprint contracts.

`check_configs.py` validates the five local device configs and five factory configs, plus MQTT and private credential options, in a temporary copy with dummy values. It never reads deployment secrets. CI builds all five factory board targets and runs the measurement/setup tests on pull requests. The external UART and SDI-12 components are pinned to commit hashes in the core YAML.

## Browser and print checks

Open `tools/setup/index.html` from an extracted download and verify it without a network connection. Check cube-only, cube-on-slab, slab-only and coco calculations; invalid input must clear the previous answer. Add a weighed record and download the CSV. Check the layout at desktop and phone widths.

The supplied two-page PDF has A4 pages and a dimensioned 88 × 26 mm face. The custom template supports A4 and US Letter, with physical SVG geometry in millimetres regardless of display units. Its perpendicular check bars are 100 mm in metric mode or 4 inches in imperial mode. Tall containers use a ruler-marked centreline instead of pretending the entire height fits on one page. PDF geometry checks cannot compensate for a printer driver scaling the page: always measure both bars on the physical print.

## What remains a field check

- Actual probe serial/revision, pinout and electrical signal levels.
- Representative sensing position and contact in each block, slab or container.
- Independently weighed calibration points and fit error across the intended moisture/EC/temperature range.
- Persistence after saving, transport behaviour on the installed bus, reconnection and Home Assistant entity mapping.
- Controller maximum runtime, delivery/flow and drainage, if the optional shot-request blueprint is commissioned.

There is no automatic deployment or flashing step in these checks. A successful build is not a calibrated installation. The experimental pore-EC output has no validated MT22/Prestige or coco accuracy claim.

## Local verification record — 9 September 2026

- ESPHome 2026.8.2: Atom Lite factory firmware compiled successfully, including linking and image generation (1,010,431-byte application; 30.1% reported RAM and 55.1% reported application flash).
- All 11 configuration variants validated: five device files, five factory files and a private API/OTA/web-auth + MQTT combination using dummy credentials.
- 14 JavaScript calculation tests and five repository-contract checks passed. The host C++ harness passed all assertions against the actual calibration, capture, publication, freshness and analytics lambdas.
- Browser interaction checks passed for all four systems, preset/custom edits, gallons, tapered pots, invalid inputs, weighed calculations, CSV download, desktop/phone layout and a custom A4 print sheet.
- The custom printed PDF had one A4 page; its contact-face rectangle measured 87.999 × 26.000 mm in PDF coordinates. Physical printer scaling still requires the two ruler checks.
- No firmware was installed on a physical node and no Home Assistant or irrigation settings were changed. Consult the PR checks for the final five-board CI build result.

## Calculator and calibration wizard

The wizard checks substrate geometry, unit conversion, manual wet-reference records,
and weighed A/B/C records before generating a configuration. It uses the same
soilless response fit as the firmware, including 0.1% sensor-input rounding and
independent C bounds. Changing sample geometry, placement or tare invalidates
recorded references; changing display units preserves their canonical values.

`test_generated_configs.py` exercises 15 real exports: five boards, each with no
calibration, a wet reference, or a checked A/B/C import. It validates them against
ESPHome and their pinned remote packages using temporary dummy secrets. `--compile`
also builds the Atom Lite weighed-reference export, including the generated C++
import action. The Pages deployment waits for this check and the site build.

Browser verification covers unit round trips, US and UK container presets, sample
volume updates, undersized cubes, wet and weighed workflows, rejected C points,
YAML/report/CSV downloads, reload and project import, reference invalidation,
responsive layouts and a one-page Letter template (612 × 792 PDF points).
The browser checks entered data. It cannot verify the physical sensor's capture
window, identity, contact or live readiness.
