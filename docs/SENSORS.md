# Sensor buying guide

Which probes work with this project, what they cost, where to buy them, and who actually makes them. Prices are 2026 street prices in USD and they move around, so treat them as a guide not a quote.

This node is an SDI-12 reader. It applies the METER TEROS 12 calibration maths to the raw counts coming off the probe. A sensor is a drop-in only if two things are true: it talks SDI-12, and it returns TEROS-12-style raw counts. Anything else either needs its own calibration or will not connect at all. The table in the compatibility section tells you which is which.

## Quick answer: what to buy

- Most people should buy an **Infiwin MT22A**. It is the cheap TEROS 12 clone this whole project is built around. It speaks SDI-12, returns the same raw counts as a TEROS 12, so the calibration just works. Budget around 60 to 150 USD depending on where you buy.
- If you want the reference instrument and do not care about the price, buy a **genuine METER TEROS 12**. It is what everything else gets checked against.
- If you steer at high EC and want readings that hold up when the salts stack, buy an **Acclima TDR-310W**. It is real time-domain reflectometry, not capacitance, so it stays honest under high EC. It does not use the TEROS raw-counts path, it outputs its own calibrated VWC, which is fine, you just skip the polynomial.
- Skip the cheap 7-in-1 NPK probes. The NPK numbers are guesses and the EC is bulk EC only.

## What "TDR" actually means here

Real TDR sends a step pulse down the rods and times the reflection. Acclima does this. It is the accurate way to measure water content and it does not drift much with salinity.

Everything else in this guide, including the TEROS 12 and every clone, is **capacitance / FDR** (frequency domain). It measures the dielectric of the substrate at a fixed frequency and converts that to water content. It is good enough for crop steering and it is far cheaper, but it drifts with EC and temperature, which is exactly why this firmware does temperature normalisation and a Hilhorst pore-EC correction. Do not let the "TDR" in a product name fool you, most of these are capacitance probes.

## Compatibility list

| Sensor | Interface | Measures | Real TDR | Works with the polynomial | Rough price |
|---|---|---|---|---|---|
| METER TEROS 12 | SDI-12 / DDI | VWC, temp, bulk EC | No (capacitance) | Yes, it is the reference | 200 to 370 |
| METER TEROS ONE | SDI-12 | VWC, temp, bulk EC | No (capacitance) | Needs its own path, newer protocol | 250+ |
| Acclima TDR-310W | SDI-12 | VWC, temp, bulk EC | Yes | No, outputs its own VWC | 349 |
| Acclima TDR-315H | SDI-12 | VWC, temp, bulk EC | Yes | No, outputs its own VWC | 300+ |
| Infiwin MT22A | SDI-12 | VWC, temp, bulk EC | No (capacitance) | Yes, TEROS 12 protocol | 60 to 150 |
| Infiwin MT22B | SDI-12 | VWC, temp | No (capacitance) | Yes for VWC, no EC, TEROS 11 protocol | 60 to 130 |
| Infiwin MT20A | SDI-12 | VWC, temp, bulk EC | No (capacitance) | Partly, Decagon 5TE protocol | 50 to 120 |
| Infiwin SlabSense | SDI-12 / RS485 | VWC, temp, bulk EC | No (capacitance) | Yes, built for slabs | 90 to 160 |
| Growlink TerraLink | SDI-12 | VWC, temp, bulk EC | No (capacitance) | Yes, its own sensor | 299 |
| THC-S / JXCT / Renke | RS485 Modbus | VWC, temp, bulk EC | No (capacitance) | No, RS485 not SDI-12 | 20 to 40 |
| Sentek Drill and Drop | SDI-12 | VWC, temp, EC (multi-depth) | No (capacitance) | No, profile probe, own scaling | 400+ |
| Delta-T GS3 / TEROS clone lineage | SDI-12 | VWC, temp, bulk EC | No (capacitance) | Varies by model | 200+ |

Notes on the ones that need explaining:

- **THC-S / JXCT / Renke family.** This is the classic cheap Chinese RS485 probe, the one behind the old [kromadg/soil-sensor](https://github.com/kromadg/soil-sensor) project. It is RS485 Modbus, not SDI-12, so it does not talk to this node without a different interface. It reports bulk EC only, no pore EC and no raw permittivity, so you have to build the EC conversion yourself. Calibrated against a TEROS 12 it gets VWC within a few percent, but its EC is the weak point. Fine as a cheap water-content logger, not something to trust for EC steering out of the box.
- **Sentek Drill and Drop.** A multi-depth profile probe. Different job, different scaling, not a single-point substrate sensor. Great for field soil, overkill and wrong shape for a rockwool cube.
- **Acclima.** Outputs calibrated VWC directly. You do not run the TEROS polynomial on it and you do not need to. Set the VWC gain to 1 and offset to 0 and read it straight.

## Where to buy

- **Infiwin MT22A and SlabSense.** Direct from [infwin.com](https://www.infwin.com) or infwintech.com, or on AliExpress and Alibaba. Search "SDI-12 soil moisture EC sensor TEROS" or "Dalian Endeavour MT22". Retail minimum order is one. Buy in a small batch on Alibaba and the unit price drops a fair bit.
- **METER TEROS 12.** Cheapest direct from [metergroup.com](https://metergroup.com/products/teros-12/), but you also need a cable or reader. Retail bundles with the cable run 300 to 370. UK buyers use [Labcell](https://www.labcell.com).
- **Acclima.** TDR-310W through [Growlink](https://shop.growlink.com/products/tdr310w-acclima-substrate-sensor), full-rod TDR-315 direct from [acclima.com](https://acclima.com).
- **Growlink TerraLink.** From [Growlink](https://shop.growlink.com) directly.
- **THC-S / JXCT.** ComWinTop store, JXCT store, or generic AliExpress listings from about 20 USD.

## Who owns who

This matters because the same probe gets sold at very different prices depending on whose logo is on it.

**METER Group.** Decagon Devices and the German firm UMS AG merged into METER Group in 2016. In 2022 METER's environment sensor business was bought by Campbell Scientific, and the indoor-ag and food-science arms were spun out as a separate company called ADDIUM. So the TEROS sensors trace back to Decagon, and the AROYA cannabis platform is the ADDIUM side.

**AROYA.** This is METER's cannabis brand, now under ADDIUM. It is not a third-party rebrand, it is genuine METER hardware wrapped in a platform and a subscription. The **AROYA Solus** is a real TEROS 12 with a Bluetooth module bolted on so you can spot-read it with a phone. If you own an AROYA Solus you own a TEROS 12.

**Infiwin, made by Dalian Endeavour Technology.** This is the OEM behind most of the cheap "TEROS clone" probes. They build to the TEROS and Decagon protocols on purpose:
- MT22A is protocol-compatible with the TEROS 12 (VWC, temp, EC).
- MT22B is protocol-compatible with the TEROS 11 (VWC, temp, no EC).
- MT20A is protocol-compatible with the Decagon 5TE.
Because they return the same raw counts as the METER parts, the TEROS calibration maths applies directly. That is the whole reason this project uses the MT22.

**Growlink TerraLink.** Growlink's own substrate sensor, marketed as made in the USA. It is SDI-12 and its published specs sit right on top of the Infiwin MT22 class, but there is no public teardown or FCC filing proving a shared OEM, so treat "TerraLink is a rebadged MT22" as a reasonable guess, not a fact. What is confirmed: Growlink controllers also accept a genuine TEROS 12 and Acclima probes over SDI-12, so you are not locked to their sensor.

**Acclima.** Their own real-TDR technology. Not a clone of anything, and the only true TDR probe in this list.

**Grodan GroSens.** Grodan's own patented water-content sensor and Smartbox, made by the rockwool company. Own tech, closed system.

**Pulse Grow.** An integrator. They sell a retrofit kit that adapts a genuine TEROS 12 to their hub, plus their own simpler probes. Not a rebrand, they resell the real METER part.

**TrolMaster Aqua-X WCS.** A different physical design, a 5-prong capacitance probe on TrolMaster's own bus, not SDI-12 and not TEROS protocol. OEM origin is not public.

The pattern across all of it: the OEM TEROS-protocol probe from Dalian Endeavour costs 60 to 150 USD. Put a Western brand on it and it is 300. Put it inside a platform with a subscription and it is 550 plus a monthly fee. The genuine METER article sits in the middle and is the thing everyone else validates against.

## What the community actually rates

- **TEROS 12** is the trusted reference. Big measurement volume, solid epoxy, calibration backed by published papers.
- **Acclima** earns its keep when you steer at high EC, where capacitance probes start lying.
- **Infiwin MT22A** is the value pick and the reason this repo exists. Expect the unit-to-unit variation you get with any budget probe, so cross-check each one against a known-good meter when it arrives and offset-calibrate it. There is no specific bad-batch scandal to report, just normal cheap-probe variance.
- **THC-S** is a fine cheap water-content logger once calibrated. Do not trust its EC for steering without work.
- Bare resistive probes and no-name analog capacitive garden sensors are not worth your time for rockwool or coco. No real EC, poor stability.
