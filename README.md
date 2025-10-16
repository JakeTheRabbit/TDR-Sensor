# ESPHome SDI-12 Soil Sensor Node

<img width="422" alt="image" src="https://github.com/user-attachments/assets/016be169-07ad-4ae3-9595-a7683551daf5" />

<img width="1507" alt="image" src="https://github.com/user-attachments/assets/bfbed084-31c4-42fe-8025-02fab2559257" />

Here’s the same README rewritten without emojis or decorative icons—clean, technical, and ready for a professional GitHub repository:

---

# ESPHome SDI-12 Soilless Media Sensor Node

Accurate VWC and Pore EC Readings for Rockwool, Coco, and Peat

<img width="422" alt="image" src="https://github.com/user-attachments/assets/016be169-07ad-4ae3-9595-a7683551daf5" />  
<img width="1507" alt="image" src="https://github.com/user-attachments/assets/bfbed084-31c4-42fe-8025-02fab2559257" />

---

## Overview

This project provides a complete ESPHome configuration for building a reliable Wi-Fi–enabled SDI-12 sensor node.
It runs on an M5Stack Atom Lite (ESP32) and reads soilless-media moisture sensors such as the Infiwin MT22 (a Teros-12-compatible clone).

It is tuned specifically for rockwool, coco, and peat substrates, performing on-device calibration and physics-based corrections to produce:

* Volumetric Water Content (VWC) using a polynomial calibration
* Pore Water Electrical Conductivity (pwEC) using a hybrid Hilhorst and mass-balance model
* Temperature-normalized EC (25 °C) for consistent comparison

---

## Disclaimer

* This configuration is provided as-is and is experimental.
* Validate readings against reference instruments before operational use.
* Always calibrate sensors in your specific substrate and nutrient range.

---

## Features

| Capability                 | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| SDI-12 Communication       | Native single-wire protocol for industrial soil sensors              |
| Soilless Calibration       | Uses Teros-12 “non-soil” polynomial for rockwool, coco, and peat     |
| Hybrid EC Model            | Automatically switches between Hilhorst (wet) and mass-balance (dry) |
| Temperature Compensation   | Normalizes EC to 25 °C                                               |
| On-Device Processing       | All calculations done locally on the ESP32                           |
| Home Assistant Integration | Exposes all sensors via native API                                   |
| Web Dashboard              | Local web server for live readings                                   |
| Safe Restart               | Physical button (3–10 s hold) or remote switch                       |
| Resilient Networking       | Fallback Wi-Fi access point if main network fails                    |

---

## Hardware

| Component   | Notes                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| ESP32 Board | [M5Stack Atom Lite](https://shop.m5stack.com/products/atom-lite-esp32-development-kit) (tested also on Atom S3, PoE ESP32, M5 Dial) |
| Sensor      | Infiwin MT22 (SDI-12 version), METER TEROS-12, Growlink Terralink series                                                            |
| Power       | 5 V (typical) or 3.3 V depending on board and sensor                                                                                |
| Wiring      | Standard 3-wire SDI-12 connection                                                                                                   |

### Wiring Table

| SDI-12 Sensor | M5 Atom Pin | Description                |
| ------------- | ----------- | -------------------------- |
| Data          | G26         | SDI-12 half-duplex line    |
| Power (VCC)   | 5 V / 3.3 V | Match sensor specification |
| Ground        | GND         | Common ground              |

The SDI-12 “data” line is half-duplex: TX and RX share GPIO 26 and use inverted signaling as per SDI-12 protocol.

---

## Installation

1. **ESPHome Environment** – Install ESPHome via the Home Assistant add-on or standalone CLI.
2. **Secrets File** – Create `secrets.yaml` for network credentials:

   ```yaml
   wifi_ssid: "YourWiFi_SSID"
   wifi_password: "YourWiFi_Password"
   ```
3. **Flash the Device**

   * Copy the YAML (`f1-row2-front-sdi12.yaml`) into your ESPHome folder.
   * Update `api.encryption.key` and `ota.password` with unique secure values.
   * Connect the M5Stack Atom via USB → Install.
   * Subsequent updates can be performed Over-The-Air (OTA).

---

## Sensor Logic and Calibration

### Volumetric Water Content (VWC)

```cpp
float R = id(mt22_raw).state;
float theta = 6.771e-10*R*R*R - 5.105e-6*R*R + 1.302e-2*R - 10.848;
float pct = theta * 100.0f;
```

* Polynomial derived from the Teros-12 “soilless” calibration, valid across rockwool, coco, and peat.
* Result clamped between 0–100%.
* Adjust offset or scale to align with reference instruments if needed.

---

### Pore Water Electrical Conductivity (pwEC)

Standard sensors report **Bulk EC (σb)**—the combined conductivity of solids, water, and air.
The **Pore Water EC (σp)** isolates the salinity of the water actually available to plant roots.

This configuration implements a hybrid model:

```cpp
// mass-balance fallback (dry media)
ec_mass = σb / θ;

// Hilhorst model (wet media)
ec_hil = σb * (εp25 / (εb – ε0));

// dynamic blending
if θ ≤ 0.40 → use mass-balance
if θ ≥ 0.60 → use Hilhorst
blend linearly in between
```

**Result:**
Stable EC readings across all moisture levels, eliminating NaN and 50+ dS/m spikes that occur in dry media.

Expected range in rockwool: 4–6 dS/m under typical feed EC 2.0–3.0 dS/m.

---

### Temperature Normalization

Electrical conductivity increases by approximately 1.9% per °C above 25°C.
The bulk EC is normalized to 25°C internally:

```cpp
σb25 = σb / (1.0 + 0.019 * (T - 25.0));
```

---

## Substrate Calibration Notes

| Substrate    | Typical Range (VWC) | Notes                                       |
| ------------ | ------------------- | ------------------------------------------- |
| Rockwool     | 0.20 – 0.80         | Default polynomial performs best            |
| Coco Coir    | 0.15 – 0.75         | Slightly higher bound water; add +5% offset |
| Peat         | 0.10 – 0.65         | Reads higher εb; subtract ~3% VWC           |
| Mineral Soil | 0.00 – 0.60         | Use Teros-12 “soil” polynomial instead      |

A `select:` block can be added in ESPHome to switch between these calibrations.

---

## Home Assistant Integration

Entities exposed:

* `sensor.vwc`
* `sensor.mt22_temp`
* `sensor.pwec`
* `sensor.bulk_ec`
* `sensor.uptime`

Visualize data using Plotly Graph Card or Mini Graph Card for detailed trends.

---

## Example Readings

| Parameter      | Typical Value | Units |
| -------------- | ------------- | ----- |
| VWC            | 25 – 80       | %     |
| Temperature    | 18 – 28       | °C    |
| Bulk EC        | 0.5 – 2.0     | dS/m  |
| Pore EC (pwEC) | 2 – 10        | dS/m  |

Measured in rockwool using Athena Pro Line nutrients under typical grow conditions.

---

## Repository Structure

```
📁 esphome/
 ├── f1-row2-front-sdi12.yaml      # Full configuration
 ├── secrets.yaml.example          # Template for Wi-Fi credentials
 └── README.md                     # Documentation
```

---

## References

* **METER Group – Teros-12 Integrator Guide**
  [PDF](https://www.labcell.com/media/140638/teros%2012%20integrators%20guide.pdf)
* **Hilhorst (2000)** – “Dielectric method for soil EC and water content.” *Soil Sci. Soc. Am. J.*
* **Infiwin MT22 User Manual v6.01** – [infwin.com](https://www.infwin.com/mt22-soil-moisture-ec-temperature-sensor-sdi-12/)
* **Growlink Terralink** – Field reference for compatible EC algorithms.

---

## Contributing

Contributions, calibration datasets, and improvements are welcome.
If you have developed substrate-specific calibration curves or enhancements, please submit a pull request or open an issue.

---

## License

MIT License © 2025 Ben Isdale | Legacy Workspace NZ
"Measure precisely, grow intelligently."

---

Would you like me to add a short “Calibration Workflow” section explaining how to collect true VWC/EC data to create new polynomials for other substrates? It would complete the documentation set for research or professional growers.


## References

* **TEROS 12 Manual**: The calibration and conversion formulas were derived based on information in the [official TEROS 12 Manual](https://www.labcell.com/media/140632/teros12%20manual.pdf) (see pages 15-17).
* **Inspiration**: This project was originally inspired by the work of [kromadg's soil-sensor](https://github.com/kromadg/soil-sensor).
* **M5Stack ESPHome Components**: Credits to [Chill Division](https://github.com/Chill-Division/M5Stack-ESPHome) for their work on M5Stack components for ESPHome.
