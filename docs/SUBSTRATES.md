# Substrate volume and sensor location

Open [the offline setup desk](../tools/setup/index.html) from a downloaded copy of this repository. It calculates block, slab, container, per-plant and whole-zone volumes, including custom sizes. On GitHub, download the repository ZIP first; the file viewer does not run the tool.

## Cubes alone

Use the actual block volume. For a rectangular block, **litres = length × width × height in cm ÷ 1,000**. Marketed inch sizes are often approximate. Use the product label or measure the block without compressing it.

| Grodan block | Dimensions, cm | Geometric volume, L |
|---|---:|---:|
| GR4 | 7.5 × 7.5 × 6.5 | 0.366 |
| GR5.6 | 7.5 × 7.5 × 10 | 0.563 |
| GR6.5 | 10 × 10 × 6.5 | 0.650 |
| GR7.5 | 10 × 10 × 7.5 | 0.750 |
| GR10 | 10 × 10 × 10 | 1.000 |
| Jumbo / GR22.5, nominal 6 × 6 × 4 inches | 15 × 15 × 10 | 2.250 |
| Hugo / GR32, nominal six-inch cube | 15 × 15 × 14.2 | 3.195, usually rounded to 3.2 |
| Uniblock | 20 × 20 × 10 | 4.000 |
| Big Mama | 20.3 × 20.3 × 20.3 | 8.365 |
| Uni-Slab | 24 × 19.5 × 10 | 4.680 |

Dimensions follow [Grodan's Precision Irrigation guide, pages 5–6](https://www.grodan101.com/siteassets/downloads/grow-guide/chapter-4---precision-irrigation.pdf). Geometric volumes are calculated; rounding differs from commercial labels. This is a reference list, not every regional SKU.

## Cubes on slabs

For equal allocation among plants:

**litres per plant = cube litres + slab litres ÷ plants per slab**

**litres per slab unit = slab litres + number of cubes × cube litres**

For three 3.195 L Hugo blocks on one 1 m slab:

| Slab dimensions, cm | Slab alone, L | Cube + slab share per plant, L | Whole slab + three cubes, L |
|---|---:|---:|---:|
| 100 × 15 × 7.5 | 11.25 | 6.945 | 20.835 |
| 100 × 15 × 10 | 15 | 8.195 | 24.585 |
| 100 × 20 × 7.5 | 15 | 8.195 | 24.585 |
| 100 × 20 × 10 | 20 | 9.862 | 29.585 |
| 100 × 30 × 7.5 | 22.5 | 10.695 | 32.085 |
| 100 × 30 × 10 | 30 | 13.195 | 39.585 |

These are **geometric examples** for 1 m slabs. Prestige length alone does not determine volume: verify width and height on the wrapper. Do not substitute a 90 cm US slab volume. The setup desk also includes the 90 cm slab dimensions in Grodan's guide.

If your crop-steering application asks for substrate volume **per plant**, use the third column. If it asks for the volume served by the **whole slab/zone**, use the fourth column multiplied by the relevant slab count. Do not divide a slab twice. Equal allocation is bookkeeping for irrigation calculations; roots and water are not partitioned equally by this formula.

### Why the cube can read lower

A cube in good hydraulic contact with a slab forms a taller connected substrate column. Gravity and the substrate's water-retention characteristics establish a vertical water-content gradient. Water can move from the upper block into the slab, and roots extract water from both. Capillary connection enables redistribution; it does not mean the cube must always be wetter or drier by a fixed amount. A poor contact interface changes that behaviour again.

Once roots have established into the slab, monitor the slab as the main root-zone reservoir. A separate cube reading can diagnose the upper block. Flowering week three is context, not proof that roots have established. Do not raise irrigation merely to make the upper block match a standalone cube's reading. Compare independently calibrated readings, drainage, delivered water and plant response. [Grodan's discussion of stacked volumes and irrigation](https://www.grodan101.com/siteassets/downloads/grow-guide/chapter-4---precision-irrigation.pdf) supports considering the connected growing-media system; exact gradients in your installation require measurement.

There is **no dependable fixed conversion** from cube-only targets to cube-on-slab targets. This firmware does not install universal wet VWC or dryback targets when you select a substrate.

## Coco, coco/perlite and peat containers

Use the hydrated, settled volume actually filled to the working level. Exclude unused headspace and separate drainage material. Different coco grades, perlite proportions, packing density, container heights and root development need separate checks; changing a dropdown cannot account for these.

The setup desk accepts any positive volume, with quick entries from 1 to 50 L. For measured containers it supports rectangular bags and round tapered pots:

**tapered-pot litres = π × filled height × (top diameter² + top diameter × bottom diameter + bottom diameter²) ÷ 12,000**, all dimensions in cm. Measure the top diameter at the actual fill line. A cylinder is the special case where both diameters match. Fabric bags and irregular filled pots may be better measured by fill volume than idealised geometry.

One US liquid gallon = **3.785411784 L**; one Imperial gallon = **4.54609 L**. A nominal “three-gallon” nursery pot may have a different actual fill volume; verify it. A compressed coco package is another quantity entirely: [CANNA describes its compressed cube expanding on hydration](https://www.canna.com.au/canna-coco-professional-plus-cube). Do not enter shipping volume as growing-medium volume.

## Three different volumes

1. **Irrigation allocation:** the substrate volume served per plant/slab/zone.
2. **Calibration sample:** the substrate whose retained water mass you weigh, with its actual known volume.
3. **Sensor measurement region:** the local volume influenced by the electrodes, including possible boundary effects.

These are not interchangeable. One slab probe's VWC multiplied by all cube-plus-slab litres is not a measured whole-system water content. A whole-slab weighing method also requires sufficiently representative moisture around the probe; a three-point fit cannot eliminate spatial gradients.

## Shot sizes and dryback units

If an operator selects a shot as a fraction of substrate volume: **shot mL per plant = allocated L × 1,000 × shot percent ÷ 100**. Divide by measured total emitter flow per plant to calculate runtime. For a 6.945 L allocation and an illustrative 2% shot, that is 138.9 mL; this example is arithmetic, not a crop recommendation. Two emitters at a measured 2 L/h each would take about 125 seconds.

70% VWC falling to 60% VWC is **10 percentage points** or **14.29% of the initial VWC**. The device's `Dryback` uses `pp`; `Dryback Percent` uses `%`. Neither should be computed from the wet-reference index as if it were a true water fraction. Drainage, uptake and redistribution prevent a shot-volume fraction from guaranteeing an identical VWC rise.
