# Upgrading from v2

Version 3 changes measurement meaning. Build and inspect it on a spare node first. Save your current YAML, sensor identity, calibration values and recent observations. This repository change does not flash an installed device.

| v2 behaviour | v3 behaviour / action |
|---|---|
| Generic curve plus gain/offset shown as VWC | `VWC generic estimate` remains diagnostic; headline `VWC` requires weighed A/B, an independent C check, fresh data and calibration mode off |
| Capture dry / saturated, assign a default saturated % | Save wet reference for an index; capture measured nonzero VWC points for an actual fit |
| Profile loads field-capacity and EC blend defaults | Profile identifies the medium/geometry; changing it clears saved references. Mineral soil selects the manual's separate curve |
| Existing gain/offset and captures | Intentionally not migrated into a claimed checked calibration. Recalibrate; v3 uses new saved A/B/C IDs |
| Pore EC blended from bulk/VWC and Hilhorst | Removed. Bulk EC at 25°C is the primary EC reading; experimental Hilhorst model is off at every boot |
| Saturation % / learned field capacity | Removed: a highest observed value cannot prove saturation or drained container capacity |
| Vegetative/generative label and confidence | Replaced by observed `Water trend`; the sensor cannot establish plant physiology |
| Frozen raw value declared a fault | Fresh, identical replies remain valid. A timeout or invalid RAW response is a communication/data fault |
| Dryback and shot rise labelled % | VWC differences use `pp`; relative dryback keeps `%`. Rise events are `Detected wettings`, not confirmed delivered shots |
| Persisted analytics | History restarts on reboot, calibration changes, unavailable VWC and relocation capture resets; no comparison across different scales |
| Unsafe direct valve on/delay/off blueprint | Blueprint requests a bounded shot from a separate controller button; explicit enable and checked/fresh measurement gates are required |

`VWC`, `Temperature`, `Bulk EC 25C`, `Peak VWC`, `Trough VWC`, `Dryback`, `Dryback Percent` and internal IDs needed by the board display are retained where practical. ESPHome/Home Assistant entity IDs can still change when units/names change. Review the actual entity registry and update dashboards and automations rather than assuming an old ID's meaning is unchanged. Old entities may remain unavailable until you remove them.

Use [CALIBRATION.md](CALIBRATION.md) and the [offline setup desk](../tools/setup/index.html). Default polling is now 30 seconds, with a 90-second data timeout and a ten-sample capture window (about five minutes). If changing poll cadence, update both timeout substitutions consistently and leave time for the SDI-12 response cycle.

Before relying on a threshold, verify stable wet/dry readings in the actual medium, check a third independently weighed point, test a disconnected sensor, inspect the calibration status and verify delivered irrigation physically. The software tests and firmware builds do not establish agronomic accuracy or electrical compatibility for your installation.


CSV logging: wide format now records each field's observation age, blanks readings after `--max-age` (default 120 seconds) or a disconnected stream, and refuses to append a mismatched header. Start a new CSV after upgrading. Use long format for entities that appear after the initial snapshot; wide mode warns rather than silently dropping new columns. Adjust maximum age to the actual reporting cadence, not the desired irrigation interval.
