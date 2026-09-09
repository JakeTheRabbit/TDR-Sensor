# Sources and evidence limits

Reviewed 9 September 2026. Calculations and operating choices are separated from manufacturer specifications.

| Source | Used for | Does not establish |
|---|---|---|
| [INFWIN MT22 product page](https://www.infwin.com/mt22-soil-moisture-ec-temperature-sensor-sdi-12/) and [manual v6.01](https://www.infwin.com/wp-content/uploads/UM-MT22-SDI-12-Soil-Moisture-EC-and-Temperature-Sensor-V6.01.pdf) | SDI-12 raw/temperature/EC mapping; generic soilless and mineral conversion; raw range; EC already normalised to 25°C | A validated rockwool-Prestige or coco-specific calibration, or actual pore-water EC |
| [INFWIN dimension drawing](https://www.infwin.com/wp-content/uploads/product-mt22-sdi-12-soil-moisture-ec-temperature-sensor-dimension.jpg) | 88 × 26 mm contact face, 18 mm housing depth, 53 mm rods | Pin pitch, exact electromagnetic footprint in each medium, best Prestige location |
| [Grodan Precision Irrigation guide](https://www.grodan101.com/siteassets/downloads/grow-guide/chapter-4---precision-irrigation.pdf), especially pp. 4–6 | Stacked growing volumes, block and 90 cm slab dimensions | A universal target for an independently calibrated MT22, or the dimensions of every 1 m Prestige SKU |
| [Grodan Prestige](https://www.grodan.com/solutions/product-overview/vegetable-solutions/grodan-prestige/) | Product context | User's exact slab width and height |
| [GroSens sensor placement instructions](https://www.grodan.com/nl/syssiteassets/downloads/downloads-nl/brochures-grodan-nl/downloads-multi-sensor-systeem/grodan141571-grosens-sensor-instruction.pdf) | Importance of reproducible positioning and depth | An interchangeable MT22 bracket or placement specification |
| [METER electrical conductivity guide](https://metergroup.com/education-guides/soil-electrical-conductivity-the-complete-guide-to-measurements/) | Distinction between bulk and pore EC, substrate dependence of conversion | That bulk EC divided by VWC is a validated salt mass-balance model |
| [METER TEROS 11/12 manual](https://publications.metergroup.com/Manuals/20587_TEROS11-12_Manual_Web.pdf) | Independent measurement-method background | Same accuracy, electronics or calibration merely because another sensor uses a compatible protocol |
| [CANNA compressed coco product](https://www.canna.com.au/canna-coco-professional-plus-cube) | Hydrated growing volume versus compressed shipping volume | Actual fill volume of a particular user's pot |
| [ESPHome template numbers](https://esphome.io/components/number/template/), [globals](https://esphome.io/components/globals/), [sensor filters](https://esphome.io/components/sensor/#sensor-filters) | Runtime inputs, persistent calibration and timeouts | Probe calibration accuracy |

The 100-count / 10-percentage-point A/B separation, central-80% C placement, 3-point default check tolerance, ten-sample stability window and midpoint placement guides are **project acceptance/design choices**. They are not INFWIN or Grodan guarantees. A third-point check only tests that observation under those conditions; it does not certify the whole curve, every location, temperature or EC range.

This project does not present crop steering as a guaranteed increase in flower yield or potency. Reliable measurements, representative placement and actual irrigation delivery come before crop-specific trials.
