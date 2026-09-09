# Troubleshooting

| Symptom | Check |
|---|---|
| RAW, temperature and EC all unavailable | Power, common ground, actual sensor pinout, SDI-12 address, selected GPIO, ESP-IDF and pinned half-duplex UART component. Confirm sensor variant is SDI-12, not RS485 |
| RAW works but headline VWC unavailable | Calibration status. A/B need valid weighed references and separation, C needs an independent passing check, current RAW must lie inside A/B, Calibration mode must be off and three new samples must have arrived |
| Wet index available but VWC unavailable | Expected when only a wet reference has been saved. An index of 100 is not 100% VWC |
| Capture not ready | Turn Calibration mode on; wait for ten fresh samples. Check RAW spread, contact, cable movement, uneven wetting and continuing drainage |
| Same reading for many minutes | Check RAW sample age. Fresh unchanged replies are valid; a static value alone is not proof of failure |
| One field remains available while another is unavailable | RAW, EC and temperature have independent validity/timeout checks; inspect the failing field and its protocol mapping |
| C check fails | Verify tare, sample volume, density/packing, actual independent weight, stable moisture distribution and same probe position. Do not enter the predicted value as C |
| Cube reads much lower than slab | Check hydraulic contact, height gradient, calibration and location. A connected upper cube cannot be assigned a fixed offset to a slab |
| Wet reference exceeds 100 | A wetter response or changed context; the index is intentionally not clipped. Inspect sensor position, wetting, EC and saved reference |
| Generic VWC unavailable at some RAW values | The generic curve is outside 0–100 or RAW is invalid. It is withheld instead of clamped. Calibration is not a fix for air gaps or the wrong protocol |
| Pore EC unavailable | Experimental model starts off, requires valid checked VWC and has moisture/denominator/range gates. Use bulk EC and independent solution measurements |
| Trends vanish after restart or calibration | Expected. Trend history does not span different calibration scales or data gaps |
| Wetting counts differ from irrigation controller shots | They are inferred VWC-rise events. Small/overlapping shots, drainage and redistribution can merge or hide events; verify actual delivery separately |
| Factory node cannot be found by the generic hostname | Name adds a MAC suffix in factory firmware. Use DHCP/client discovery or the actual advertised hostname |

Use [CONFIG.md](CONFIG.md) for version and sampling settings, [CALIBRATION.md](CALIBRATION.md) for the procedure and [MIGRATION-v3.md](MIGRATION-v3.md) for changed entity meanings.
