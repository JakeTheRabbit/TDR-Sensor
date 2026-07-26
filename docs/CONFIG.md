# The config files

Two ways to run this. Pick one.

**The short config** pulls the packages from GitHub. Your file is about ten lines, and when the project gets a fix or a new feature you rebuild and it comes down automatically. This is what most people want.

**The full config** is everything in one file with nothing external except the SDI-12 components. Use it if you want to read the whole thing, change the maths, or keep working when GitHub is unreachable. You update it by hand.

Both need a `secrets.yaml` next to them:

```yaml
wifi_ssid: "YourNetwork"
wifi_password: "YourPassword"
```

## The short config, updates from GitHub

Copy this into the ESPHome dashboard as a new device. Change the board line to match your hardware and the data pin to match your wiring.

```yaml
substitutions:
  name: tdr-sensor
  friendly_name: TDR Sensor
  sdi12_data_pin: GPIO26        # G26 Atom Lite/PoE, G1 AtomS3, G2 Dial
  sdi12_address: "0"
  sample_interval: 10s
  timezone: Pacific/Auckland

packages:
  tdr:
    url: https://github.com/JakeTheRabbit/TDR-Sensor
    ref: main
    refresh: 1d
    files:
      - esphome/packages/boards/atom-lite.yaml    # your board file
      - esphome/packages/tdr_sdi12_core.yaml
      - esphome/packages/tdr_analytics.yaml
      - esphome/packages/wifi_extras.yaml

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap: {}

ota:
  - platform: esphome
```

Swap the board file line for your board:

| Board | Board file | Data pin |
|---|---|---|
| M5Stack Atom Lite | `esphome/packages/boards/atom-lite.yaml` | GPIO26 |
| M5Stack AtomS3 Lite | `esphome/packages/boards/atom-s3.yaml` | GPIO1 |
| M5Stack Atom PoE | `esphome/packages/boards/atom-poe.yaml` | GPIO26 |
| M5Stack Dial | `esphome/packages/boards/m5-dial.yaml` | GPIO2 |
| Generic ESP32 | `esphome/packages/boards/esp32-generic.yaml` | GPIO16 |

The Atom PoE has no WiFi, so drop the `wifi:` block and the `wifi_extras.yaml` line for that one. The generic ESP32 also takes a `board:` substitution, default `esp32dev`.

`refresh: 1d` means it re-checks GitHub for changes once a day when you build. Your substitutions always win over the package defaults, so anything you set in your own file sticks.

### Pin it to a version

`ref: main` follows the latest. If you would rather not move until you choose to, point at a tag instead:

```yaml
    ref: v2.0.0
```

Then bump the tag when you want the update.

### Add MQTT

Add the package and the broker details to `secrets.yaml`:

```yaml
packages:
  tdr:
    url: https://github.com/JakeTheRabbit/TDR-Sensor
    ref: main
    files:
      - esphome/packages/boards/atom-lite.yaml
      - esphome/packages/tdr_sdi12_core.yaml
      - esphome/packages/tdr_analytics.yaml
      - esphome/packages/wifi_extras.yaml
      - esphome/packages/tdr_mqtt.yaml
```

```yaml
# secrets.yaml
mqtt_broker: "192.168.1.10"
mqtt_username: "mqtt"
mqtt_password: "password"
```

### Lock down the Home Assistant connection

By default the API is open on your LAN. To require a key, generate one at [esphome.io/components/api](https://esphome.io/components/api) and add:

```yaml
api:
  encryption:
    key: "your-generated-key-here"
```

Home Assistant asks for it when it adopts the device.

## The full config, self-contained

If you want everything in one file, clone the repo and use the device files directly. They are the same packages, just included from disk instead of GitHub:

```
git clone https://github.com/JakeTheRabbit/TDR-Sensor.git
cd TDR-Sensor/esphome
cp secrets.yaml.example secrets.yaml
```

Edit `secrets.yaml`, then flash the file for your board:

```
esphome run tdr-sensor-atom-lite.yaml
```

The files are:

| Board | File |
|---|---|
| M5Stack Atom Lite | [tdr-sensor-atom-lite.yaml](../esphome/tdr-sensor-atom-lite.yaml) |
| M5Stack AtomS3 Lite | [tdr-sensor-atom-s3.yaml](../esphome/tdr-sensor-atom-s3.yaml) |
| M5Stack Atom PoE | [tdr-sensor-atom-poe.yaml](../esphome/tdr-sensor-atom-poe.yaml) |
| M5Stack Dial | [tdr-sensor-m5-dial.yaml](../esphome/tdr-sensor-m5-dial.yaml) |
| Generic ESP32 | [tdr-sensor-esp32-generic.yaml](../esphome/tdr-sensor-esp32-generic.yaml) |

If you want one single file with no `!include` at all, run `esphome config tdr-sensor-atom-lite.yaml`. That prints the fully resolved configuration with every package expanded, which you can save and use as a standalone file.

## What the packages are

| Package | What is in it |
|---|---|
| [tdr_sdi12_core.yaml](../esphome/packages/tdr_sdi12_core.yaml) | SDI-12 bus, the reading pipeline, the whole calibration suite, web server |
| [tdr_analytics.yaml](../esphome/packages/tdr_analytics.yaml) | Dryback tracking, irrigation detection, steering detection |
| [tdr_mqtt.yaml](../esphome/packages/tdr_mqtt.yaml) | Optional MQTT with discovery |
| [wifi_extras.yaml](../esphome/packages/wifi_extras.yaml) | Fallback hotspot and WiFi diagnostics |
| [boards/](../esphome/packages/boards) | Per board pins, LED, display, ethernet |

The core and analytics packages carry no board or network config, so they work on any of the boards.

## The SDI-12 components

Both configs pull two external components:

```yaml
external_components:
  - source: github://ssieb/esphome@uarthalf
    components: [ uart ]
  - source: github://ssieb/esphome_components@sdi12
    components: [ sdi12 ]
```

The first is a fork of the ESPHome UART with half-duplex support, which mainline still does not have. The second is the SDI-12 component. Both are needed and both only work on an ESP32 with the esp-idf framework. This is the thing that catches people out, so it is worth repeating: on the Arduino framework or an ESP8266 the build succeeds and the probe never answers.

## Settings you can change without editing YAML

Almost everything worth tuning is a control on the web page and in Home Assistant, and it survives reboots. You do not reflash to calibrate. Substrate profile, VWC gain and offset, field capacity, EC gain and offset, the Hilhorst offset, the pore EC blend window, every analytics threshold and every steering anchor. See [CALIBRATION.md](CALIBRATION.md).

The YAML substitutions are only for things that are fixed at build time: the device name, the data pin, the SDI-12 address, the sample interval and the timezone.
