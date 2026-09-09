# Sensor compatibility

This revision is implemented around the **INFWIN MT22A SDI-12** measurement format documented in its [manual](https://www.infwin.com/wp-content/uploads/UM-MT22-SDI-12-Soil-Moisture-EC-and-Temperature-Sensor-V6.01.pdf): RAW dielectric response, temperature and bulk EC. Raw conversion and units are sensor-specific.

| Sensor / interface | Status in this repository |
|---|---|
| INFWIN MT22A SDI-12 | Implemented target; each installation still needs electrical checks and substrate calibration |
| MT22B | Omits EC; requires a reviewed two-field configuration, not the stock three-field package |
| Genuine METER TEROS 12 | Related protocol/formulas do not prove identical scaling, EC compensation or accuracy. Verify the exact manual and adapt/test before use |
| Other SDI-12 sensor reporting VWC directly | Needs its own parser/units path; never apply the MT22 RAW polynomial to a percentage |
| RS485 / Modbus variant | Different electrical interface and protocol; does not work with this SDI-12 configuration |
| Proprietary bus or branded controller sensor | Unsupported until interface, data format and dimensions are documented and tested |

The repository name is historical. INFWIN markets the MT22 using FDR/dielectric measurement terminology. Matching a protocol does not establish the same sensing electronics, substrate-specific calibration or high-salinity performance as a reference instrument. The previous buying guide's broad drop-in compatibility, OEM and price claims have been removed because they were not adequate evidence for this firmware.

Check the actual label, connector pinout, voltage requirements and serial number before wiring. The MT22 dimensions used by the printable sheet are **88 × 26 mm contact face, 18 mm housing depth and 53 mm rods**. Published pin spacing is not dimensioned; transfer it from your own probe. See [PLACEMENT.md](PLACEMENT.md).

For medium too small to accommodate the MT22's sensing geometry, or where weighed calibration fails independent checks, use a sensor designed and validated for that substrate and size. Do not force a generic curve to match a desired reading. See [SOURCES.md](SOURCES.md) for primary references and what they establish.
