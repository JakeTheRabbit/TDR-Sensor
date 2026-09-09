# Calibrate the MT22

There are two different tasks: saving a repeatable wet reference, and estimating actual volumetric water content from independent weights. Version 3 keeps them separate. All captures are available on the node's web page and in Home Assistant; calibration does not require reflashing.

The MT22 reports raw dielectric response, temperature and bulk EC. Its manufacturer's generic soilless equation is not a validated calibration for every rockwool slab or coco mix. A substrate selection records the setup; it does not install a universal water-content target. See [sources and limits](SOURCES.md).

## Quick start: save a wet reference in the current slab

1. Put the probe in its final, recorded location. For established cubes-on-slabs, use the slab for the main reading. Follow [PLACEMENT.md](PLACEMENT.md).
2. Turn **Calibration mode** on. This pauses headline VWC and dryback tracking. It starts a fresh ten-reading capture window.
3. Wet the substrate uniformly using the normal delivery path, then allow free drainage to settle. Record solution EC, temperature, drain configuration and elapsed time after watering. On an established crop, use a normal wet irrigation plateau; do not block drains or repeatedly flood the crop to force a number.
4. Wait for **Capture ready**. At default settings, ten fresh replies take about five minutes. The RAW range across the window must be at most 10 counts. If it does not settle, investigate distribution, movement, contact or continuing drainage. Do not simply increase the spread limit until an unstable reading passes.
5. Press **Save wet reference**. Check **Saved Wet RAW** and **Last calibration action**. Keep power on for at least ten seconds after saving so the setting is written to flash.
6. Turn Calibration mode off. Watch **Wet reference index** across subsequent irrigation and drainage cycles, alongside delivered volume and plant condition.

At capture the index is about 100: `100 × generic_response(current RAW) / generic_response(saved wet RAW)`. It is an instrument-relative index, **not 100% VWC, not percentage of water remaining and not a calibrated dryback percentage**. Readings above 100 and a negative drop are allowed; these help expose a wetter condition or a changed setup. A low/invalid generic response can make the index unavailable; do not fix that by forcing saturation to 100.

One wet point cannot establish the curve's slope or shape. It also cannot establish an independent true wet VWC without a reference measurement. There is no fixed cube-to-slab offset.

## Actual VWC: weighed A and B, then independent C

Use a spare, unplanted sample matching the production medium, density, geometry, support, drainage and sensor placement. Do not dry a flowering plant to create a calibration endpoint. Calibrate each probe and repeat the check when the substrate or placement changes.

### 1. Define the sample and tare

- Measure substrate volume, using actual metric dimensions or actual filled container volume. Use [the setup desk](../tools/setup/index.html#weigh) for the arithmetic.
- Determine a defensible dry substrate mass with a suitable constant-mass laboratory procedure for that medium. Air-dry material can retain water. Keep sensors, electronics and packaging out of drying equipment; follow the material's handling instructions. If true dry mass cannot be established, retain a wet reference and avoid claiming an absolute VWC calibration.
- Record the total dry assembly mass: dry medium plus every constant item on the scale. The sleeve, container, support and sensor mass must be treated consistently at every weighing. Remove free water from trays. Account for cable tension or keep cables supported consistently.
- Living roots, changing plant mass, water outside the medium and retained fertiliser salts can bias a simple mass difference. A spare sample with a documented procedure is easier to audit than a planted slab.

The estimate is:

**VWC (%) = (current assembly mass − dry assembly mass) ÷ water density ÷ sample volume in mL × 100**

Using water density 1 g/mL is a practical approximation; the calculator allows another measured density. Example: 500 g dry assembly, 8,000 g current assembly and 11.25 L of substrate gives about **66.67% VWC**. This volume is the sample being weighed, not each plant's allocation of a shared slab.

### 2. Capture two measured levels

1. Turn **Calibration mode** on. Choose the substrate profile before making captures. Changing it clears references; Rockwool/Coco/Peat use the generic soilless base curve and Mineral soil uses the separate manual equation.
2. Prepare a uniformly wet sample, allow free drainage and redistribution to stabilise, and weigh it. Keep the probe at the recorded depth. An apparently stable reading does not alone prove uniform water distribution.
3. Enter the calculated percentage as **Weighed reference VWC**, wait for Capture ready, then press **Capture weighed point B**. Check the saved RAW and VWC. The input resets to zero to prevent accidentally reusing a previous weight.
4. Let the same sample reach a lower moisture level without moving the probe, then repeat the weighing and capture it as **point A**. A and B can be entered in either order.
5. The two points must span at least **100 RAW counts** and **10 VWC percentage points**, and RAW must increase with VWC. Choose points that bracket the intended operating range. These are minimum project checks, not a guarantee that any such pair is scientifically sufficient. Zero and 100% entries are rejected; fully dry/fully saturated endpoints are not needed for this operating-range calibration.

The firmware applies an affine correction to the manufacturer's generic curve: `V = VA + (G(R) − G(RA)) × (VB − VA) / (G(RB) − G(RA))`. It does not extrapolate outside the RAW interval. **VWC two-point estimate** is diagnostic until an independent check passes.

### 3. Check a third independently weighed level

1. Prepare a third moisture condition between A and B, with RAW within the middle 80% of their interval. Rewetting followed by equilibration is possible; record it because wetting/drying history may matter.
2. Weigh it independently and calculate VWC. Do not use the predicted VWC as the reference value.
3. Enter the measured percentage, wait for Capture ready and press **Check independent weighed point C**.
4. Inspect **Third-point error**: fitted VWC minus measured VWC, in percentage points. Default tolerance is **3 points**, a chosen acceptance criterion rather than an accuracy specification. A failed or out-of-range check leaves headline VWC unavailable. Investigate tare, volume, gradients, poor contact, density, temperature/EC effects or inadequate curve shape before changing tolerance.
5. Return the probe to the intended installation, verify the same placement conditions and check its transfer against an independent reference. Turn Calibration mode off. After three new readings, **VWC ready** becomes true only when the current RAW is inside the checked calibration interval.

Changing A or B clears C. Rechecking one middle point does not prove the entire range: take additional independent points, including near its usable ends, and log the errors. If one corrected generic curve does not fit the data, use a properly characterised multi-point calibration/logger or a probe with a validated calibration for that substrate. Do not hide a bad fit with clipping or a large tolerance.

## Reading validity and persistence

- Headline **VWC** is unavailable until A/B/C pass, current RAW is in range, fresh replies exist and Calibration mode is off. It stays unavailable during calibration.
- **VWC generic estimate** and **VWC two-point estimate** are labelled diagnostics, not irrigation control signals.
- RAW replies are checked for finite values within the supported range. Missing RAW becomes stale after 90 seconds by default. Temperature and EC have independent timeouts. Receiving the same number again is not a fault.
- Saved reference values persist; capture-window samples and analytics history do not. Keep power on ten seconds after changing calibration. Calibration mode and experimental pwEC start off after reboot.
- Use **Restart capture window** after changing a sample's position or moisture condition; it discards old averaging samples. For a new medium, geometry or placement, clear references and recalibrate rather than assuming the old check still applies.
- Moving between a cube and a slab creates a different measurement context. Record a new calibration/session; do not join their VWC history as if only the water content changed.

## Bulk EC and temperature

The [MT22 manual](https://www.infwin.com/wp-content/uploads/UM-MT22-SDI-12-Soil-Moisture-EC-and-Temperature-Sensor-V6.01.pdf) specifies bulk EC already normalised to **25°C**. Firmware converts µS/cm to dS/m by dividing by 1,000, without a second temperature correction. 1 dS/m = 1 mS/cm. `Bulk EC gain` and `Bulk EC offset` are optional correction controls; defaults are 1 and 0.

Before adjusting them, check the probe using manufacturer-appropriate conductivity standards and immersion geometry, with adequate clearance from the vessel. Account for temperature normalisation and compare with an independent calibrated meter. Use more than one standard if changing slope and offset; retain the original and corrected results. A calibration solution tests EC response in that geometry, not the soil/wool/coir pore-EC conversion. Change temperature offset only after an independent temperature comparison.

Bulk EC changes with water content and substrate geometry. It is not interchangeable with feed EC, runoff EC or extracted pore solution EC. A runoff sample can be a useful separate observation but is not automatically the water surrounding the sensing rods.

## Experimental pore EC

The previous `bulk EC / VWC` and Hilhorst blend has been removed. The bulk/VWC division alone is not a validated salt mass-balance model. Calibrating bulk EC in a solution does not validate pore EC in a substrate.

An **Experimental pwEC estimate** switch enables only the Hilhorst-type model `EC25 × 78.45 / (apparent permittivity − offset)`. It is off at every boot, requires checked in-range VWC above the selected minimum, and withholds invalid results rather than clamping them to a plausible limit. The initial offset 4.1 is a historical model assumption, not a measured constant for your rockwool or coco. Fit and validate it against appropriate substrate-specific pore-solution measurements across the intended moisture and EC range before interpreting it quantitatively. Default minimum VWC and numerical bounds are project gates, not a validated operating envelope.

For a simpler dependable installation, leave experimental pwEC off and log **RAW, checked VWC, bulk EC, temperature, delivered irrigation and separate solution EC measurements**. A weighing reference and additional representative probes often resolve more uncertainty than adding another unvalidated conversion.
