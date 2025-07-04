# ESPHome SDI-12 Soil Sensor Node

This project provides a complete ESPHome configuration for creating a robust, WiFi-enabled sensor node that reads data from an SDI-12 soil moisture sensor. It is designed to run on an M5Stack Atom and integrates seamlessly with Home Assistant.

The configuration not only reads raw data but also performs on-device calculations to derive calibrated Volumetric Water Content (VWC) and temperature-compensated Pore Water Electrical Conductivity (EC), providing more accurate and actionable data for agricultural or horticultural applications.

## Features

* **SDI-12 Communication**: Directly interfaces with any standard SDI-12 sensor.
* **On-Device Calibration**: Applies a polynomial formula to raw VWC readings for improved accuracy.
* **Pore Water EC Calculation**: Converts Bulk EC to Pore Water EC using the Hilhorst model, providing a more accurate measure of the salinity experienced by plant roots.
* **Temperature Compensation**: Normalizes EC readings to a standard 25°C.
* **Home Assistant Integration**: Exposes all relevant sensors to Home Assistant via the native API.
* **Web Interface**: A local web server provides sensor readings and basic controls.
* **Robust Networking**: Includes a fallback WiFi Access Point for easy configuration if the primary network connection fails.
* **Remote Restart**: A physical button press (3-10 seconds) or a software switch can safely restart the device.

## Hardware Requirements

* **Microcontroller**: [M5Stack Atom Lite](https://shop.m5stack.com/products/atom-lite-esp32-development-kit) or similar ESP32 board.
* **SDI-12 Sensor**: Any SDI-12 compatible soil sensor (e.g., a BGT-1, Acclima TDR-315, or METER TEROS 12).
* **Power Supply**: A stable 3.3V or 5V power supply, depending on your board and sensor requirements.
* **Wiring**: Jumper wires for connecting the sensor to the ESP32.

### Wiring

Connect the SDI-12 sensor to the M5Stack Atom as follows:

| SDI-12 Sensor | M5Stack Atom Pin |
| :------------ | :--------------- |
| Data          | `G26`            |
| Ground        | `GND`            |
| Power (VCC)   | `5V` or `3.3V`   |

**Note**: The Data line is connected to `G26` for this configuration, which is used as a half-duplex UART pin. The RX pin (`G32`) is also defined in the UART configuration but is internally connected to the same physical wire in a half-duplex setup.

## Configuration

### 1. ESPHome Setup

Ensure you have an ESPHome instance running. This can be as a Home Assistant Add-on or a standalone installation.

### 2. Secrets File

Create a `secrets.yaml` file in your ESPHome configuration directory and add your network credentials and API key. This keeps sensitive information out of your main configuration file.

```yaml
# secrets.yaml
wifi_ssid: "YourWiFi_SSID"
wifi_password: "YourWiFi_Password"
```

### 3. Flashing the Device

1.  Copy the provided `f1-row1-back-sdi12.yaml` file into your ESPHome configuration directory.
2.  Update the `api.encryption.key` and `ota.password` fields in the YAML with secure, unique values.
3.  Connect the M5Stack Atom to your computer via USB.
4.  In the ESPHome dashboard, create a new device and install the configuration. For the first flash, you will need to do this over USB. Subsequent updates can be performed Over-The-Air (OTA).

## Sensor Logic and Calculations

This configuration uses a multi-step process to convert raw sensor readings into meaningful data.

### 1. Volumetric Water Content (VWC)

The raw VWC value from the sensor is processed by a lambda filter:

```cpp
float RAW = x;
float vwc = 6.771e-10 * RAW * RAW * RAW - 5.105e-6 * RAW * RAW + 1.302e-2 * RAW - 10.848;
vwc = vwc * 0.7;  
return vwc * 100;
```

* **Polynomial Formula**: The first line is a sensor-specific calibration formula that converts the raw permittivity reading into a more accurate decimal VWC (e.g., 0.35).
* **Scaling Factor**: The `* 0.7` is an additional adjustment factor. This can be used to align the sensor's readings with a trusted reference sensor (like a TEROS 12) in the same medium.
* **Percentage Conversion**: The final value is multiplied by 100 to be displayed as a percentage (e.g., 35%).

### 2. Pore Water EC (PWEC)

Standard sensors measure **Bulk EC**, which is the conductivity of the entire soil/substrate medium (soil, water, and air). **Pore Water EC** is the conductivity of just the water within the substrate, which is what plants actually experience.

This calculation is performed in a template sensor:

```cpp
// Get raw values
float bulk_ec = id(raw_ec).state;
float vwc_decimal = id(vwc).state / 100.0;

// Calculate Pore Water EC
float pore_ec = (bulk_ec / vwc_decimal) * 1.05;

// Apply Temperature Compensation
float temp = id(temperature).state;
if (!isnan(temp)) {
  pore_ec = pore_ec / (1.0 + 0.02 * (temp - 25.0));
}

// Convert to dS/m
return pore_ec / 1000.0;
```

* **Hilhorst Model**: The core of the calculation (`bulk_ec / vwc_decimal`) is based on the Hilhorst model, which provides a good approximation of PWEC.
* **Adjustment Factor**: The `* 1.05` is another fine-tuning factor to align the calculated value with a reference sensor.
* **Temperature Compensation**: The result is normalized to 25°C using the current temperature reading, as EC is highly dependent on temperature.
* **Unit Conversion**: The final value, which is in µS/cm, is divided by 1000 to be reported in the standard agricultural unit of dS/m.

## Contributing

Contributions, issues, and feature requests are welcome. Please feel free to open an issue to discuss your ideas.
