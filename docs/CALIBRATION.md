# Calibration

The sensor gives useful numbers out of the box, but a probe reading is only as good as its calibration in your exact substrate and feed. This guide walks through it step by step. Do the VWC calibration first, then field capacity, then EC. You do all of it from the web page or Home Assistant, nothing gets reflashed.

If you have never done this before, read the whole page once before you start. None of it is hard, but the order matters.

This page is the procedure. For why any of it works, and what the numbers can and cannot tell you, read [Root zone state estimation with the TEROS-12](https://jaketherabbit.github.io/cannabis-white-papers/root-zone-teros12.html). It goes through the measurement physics, the accuracy you can actually expect, and why a single probe needs a second witness before you act on it.

## What you are calibrating and why

- VWC (volumetric water content) is the percent of the substrate volume that is water. The raw probe reading is a capacitance number, and the firmware converts it with a polynomial. That polynomial is close for rockwool and coco, but every probe and every block is slightly different, so you correct it with a two point calibration.
- Field capacity is the VWC right after the block has been saturated and allowed to drain. It is your reference line for dryback. Everything in crop steering is measured against it.
- Pore EC is the salt concentration in the water the roots actually drink. The firmware derives it from bulk EC and water content. You calibrate the bulk EC against a known solution so the derived pore EC is trustworthy.

## Before you start

Set your substrate first. On the web page, under Calibration, set Substrate Profile to Rockwool, Coco, Peat, or Mineral Soil. This loads sensible starting points for field capacity, the pore EC blend, and the Hilhorst offset. Do this before anything else, because changing it later reloads those defaults and undoes your tuning.

You will need:

- A kitchen scale that reads grams
- An oven or a known dry block
- A bucket
- Your normal feed solution
- A known EC calibration solution (a 1.413 dS/m or a 2.76 dS/m standard is common and cheap)
- A handheld EC pen if you have one, for a sanity check

## VWC two point calibration

The idea is simple. You show the probe what bone dry looks like, you show it what fully saturated looks like, and it works out the straight line between them. The dry point is true zero water. The saturated point is a value you measure.

### Step 1: capture the dry point

You want the probe reading a completely dry sample of your substrate.

For rockwool: take a piece of the same rockwool, dry it fully. An hour in an oven at 105C, or a few days somewhere warm and dry. It has to be properly dry, not just surface dry.

For coco: same thing, oven dry a scoop of your coco until it stops losing weight.

Push the probe fully into the dry sample. Let the reading settle for a minute. Then press Capture Dry Point.

### Step 2: work out your saturated reference

This is the real VWC of a saturated, drained block, and you get it with a scale.

1. Take a block or a pot of your substrate. Weigh it dry, note the grams. Call this the dry weight.
2. Saturate it fully with water or feed. Let it drain until it stops dripping. This is field capacity saturation, not dripping wet.
3. Weigh it again. Call this the wet weight.
4. Work out the water volume. Water weighs 1 gram per millilitre, so the grams of water is wet weight minus dry weight, and that number in grams is also the millilitres of water.
5. You need the total volume of the block in millilitres. For a rockwool block, length times width times height in centimetres gives millilitres. For a pot, use the pot volume.
6. Saturated VWC percent is water millilitres divided by block volume millilitres, times 100.

Example: a 10 by 10 by 6.5 cm rockwool cube is 650 ml of volume. Dry it weighs 40 g. Saturated and drained it weighs 460 g. That is 420 g of water, so 420 ml. 420 divided by 650 is 0.646, times 100 is 64.6 percent. Your saturated reference is about 65.

Set Saturated Reference on the web page to that number.

### Step 3: capture the saturated point and apply

Put the probe into that same saturated, drained block. Let it settle for a minute. Press Capture Saturated Point. Then press Apply VWC Calibration.

The firmware now has both points and sets the gain and offset so dry reads zero and saturated reads your reference. Your VWC is calibrated.

If you only have one good point, capture just the saturated point and press Apply. It will shift the offset so saturated reads correct, keeping the existing gain. Two points is better.

## Field capacity

Field capacity is the anchor for every dryback number, so set it properly.

The manual way, which is the accurate way: saturate the block, let it drain fully, and read the calibrated VWC once it stabilises. Whatever the probe reads at that point is your field capacity. Set the Field Capacity number to it.

The automatic way: the firmware also learns field capacity on its own. The Field Capacity (learned) sensor tracks the highest peak VWC over the last seven days, which after a few normal irrigation cycles converges on your true field capacity. Watch it for a week and compare it to your manual figure. If they agree, you are set. It is there as a cross-check, it does not overwrite your manual value.

Field capacity is not fixed forever. As roots fill the block the media holds water differently, so re-check it every couple of weeks through a grow.

## Pore EC calibration

Two parts here. First you make sure bulk EC is accurate against a known solution. Then you sanity check the derived pore EC against your runoff.

### Step 1: calibrate bulk EC to a reference solution

1. Get a bottle of EC calibration standard, for example 1.413 dS/m.
2. Set EC Reference Solution on the web page to that value.
3. Rinse the probe rods and sit them fully in the solution so all the rods are submerged. When the rods are surrounded by solution, the bulk EC the probe reads is basically the solution EC.
4. Let it settle for a minute, then press Calibrate EC to Reference.

The firmware sets the EC gain so the reading matches the standard. Rinse the probe with clean water afterwards.

### Step 2: check pore EC against runoff

Bulk EC calibration gets the raw measurement right. Pore EC is derived from it, and the derivation depends on water content, so it is worth a real world check.

1. Run a normal irrigation until you get runoff.
2. Catch the runoff and measure its EC with your handheld pen.
3. Compare it to the Pore EC reading on the device at the same time.

Runoff EC and pore EC are not identical, runoff is a mix and pore EC is the root zone, but they should be in the same ballpark and they should move together. If pore EC reads wildly higher or lower than runoff, adjust:

- If pore EC reads too high in dry media, raise Pore EC Blend Low and Blend High a little so the mass balance model gives way to Hilhorst sooner.
- If pore EC never settles, check that your VWC calibration is right first. Pore EC leans on water content, so a bad VWC number throws the EC off.

## Sanity check against a handheld meter

Whatever you calibrate, cross-check it once against a trusted instrument.

- VWC: squeeze test aside, the honest check is another calibrated probe or the gravimetric method from the VWC section. If your saturated block maths said 65 and the probe reads 65, you are good.
- Temperature: compare against any thermometer stuck in the block. It should be within half a degree.
- EC: the runoff comparison above, plus checking the probe in the calibration standard reads the standard.

If a reading is out and will not come right with calibration, suspect the probe before the maths. Budget probes vary unit to unit. Check a second probe if you have one.

## Coco vs rockwool, the short version

The procedure is the same. The numbers differ.

- Rockwool holds less bound water, so field capacity sits higher, often 60 to 70 percent, and drybacks are crisp and fast.
- Coco holds more bound water, so field capacity is lower, often 50 to 60 percent, and it dries back more slowly. The Coco profile sets a lower default field capacity and blend window to match.
- Do the two point VWC calibration separately for each. A calibration done in rockwool is not valid in coco.
