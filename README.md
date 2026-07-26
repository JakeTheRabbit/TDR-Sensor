# TDR Sensor

A WiFi substrate sensor for crop steering. It reads an SDI-12 moisture probe, works out water content, pore EC and temperature, and runs a full set of dryback and steering analytics on the device itself. No cloud, no subscription. Flash it from your browser, open its web page, and read your root zone.

Built for rockwool and coco, tuned against the METER TEROS 12 calibration, runs on cheap M5Stack hardware and a clone probe that costs a fraction of a branded system.

## What it does

- Reads VWC, pore water EC, bulk EC and substrate temperature over SDI-12
- Full calibration suite you set from the web page, no reflashing: substrate profiles, two point VWC calibration, single point EC calibration, and every coefficient exposed
- On-device crop steering analytics: peak, trough, dryback in points and percent, dryback rate, shot detection, EC stacking, saturation, and more
- Steering detection that reads whether the plant is being driven vegetative or generative from how the substrate behaves
- Its own web page with live readings and history, so you need nothing else
- MQTT for Mycodo, Node-RED, Grafana or anything else that speaks it
- Native Home Assistant integration with auto-discovery, blueprints and a dashboard
- CSV logging straight off the device with a small Python script

## Which board and probe

Boards, any one of these:

- M5Stack Atom Lite, the cheap and common pick
- M5Stack AtomS3 Lite
- M5Stack Atom PoE, for wired ethernet with power down the same cable
- M5Stack Dial, which has a round screen that shows the readings
- Any generic ESP32 dev board

Probe: an Infiwin MT22A is the value pick and what this is built around. A genuine METER TEROS 12 if you want the reference. Full buying guide, including who actually makes what, is in [docs/SENSORS.md](docs/SENSORS.md).

## Install the easy way, no software

Pre-built firmware flashes straight from your browser using ESPHome's own web flasher. Nothing to install, no ESPHome, no command line.

1. Download the `.factory.bin` for your board from the [Releases page](https://github.com/JakeTheRabbit/TDR-Sensor/releases).
2. Plug your board in over USB.
3. Go to [web.esphome.io](https://web.esphome.io) in Chrome, Edge or Opera on a desktop, and click **CONNECT**.
4. Click **Install**, not "Prepare for first use". Choose the file you downloaded and let it flash.
5. Enter your WiFi when it offers, then open `http://tdr-sensor.local` to see your readings.

Full step by step, driver notes, and a fallback flasher if that page will not talk to your board: [docs/FLASHING.md](docs/FLASHING.md).

## Install with ESPHome

If you want to change the config or update over WiFi, run it through ESPHome instead. Your config is about ten lines that pull the packages from this repo, so fixes and new features come down when you rebuild:

```yaml
substitutions:
  name: tdr-sensor
  sdi12_data_pin: GPIO26

packages:
  tdr:
    url: https://github.com/JakeTheRabbit/TDR-Sensor
    ref: main
    refresh: 1d
    files:
      - esphome/packages/boards/atom-lite.yaml
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

The full config for every board, the self-contained version, MQTT, and how to pin a version are all in [docs/CONFIG.md](docs/CONFIG.md).

## Wiring

Read [docs/WIRING.md](docs/WIRING.md) before you connect anything. The short version: the probe has three wires, data goes to the pin your board uses, power to 5V, ground to ground. The catch is that wire colours are not the same between sensor brands. On the Infiwin MT22 the red wire is data, not power, so wiring it by habit puts 5V on the data line. Check it against the colour table.

## Calibration

The sensor reads usefully out of the box, but for real work you calibrate it in your own substrate. It is a ten minute job with a scale and a bucket, done entirely from the web page. Step by step for rockwool and coco in [docs/CALIBRATION.md](docs/CALIBRATION.md).

## The analytics, and what they tell you

Everything below runs on the device, updates live, and shows on the web page and in Home Assistant.

- Peak and trough VWC, with the time each happened
- Dryback since the last peak, both in points and as a percent of the peak
- Dryback rate in percent per hour, over a rolling hour
- Max dryback today and overnight dryback
- Rolling 24 hour min, max and average for VWC and pore EC
- Shots today, time since the last irrigation, and an irrigating flag, all from a shot detector that watches for the substrate rising then plateauing
- Pore EC captured at field capacity, and EC stacking, the rise in root zone EC since that point
- Saturation against field capacity
- Field capacity learned automatically from the seven day peak, as a cross-check on your manual figure
- A sensor fault flag that trips if the probe stops answering or freezes

### Steering detection

The device works out whether your watering is pushing the plant vegetative or generative, from four signals: how big the drybacks are, how many shots a day, how much EC stacks through the day, and how much headroom there is between average VWC and field capacity. It combines them into a steering index from -1 to +1 and a plain label, Vegetative, Balanced or Generative, with a confidence. The thresholds are all settings you can move. It needs a few irrigation cycles before it will call anything, so it says Learning at first.

This is a read on what the substrate behaviour implies, not a controller. It tells you what your irrigation is doing so you can decide what to change.

## Data logging without Home Assistant

There is a small Python script at [tools/tdr_logger.py](tools/tdr_logger.py) that subscribes to the device and writes CSV. Standard library only, nothing to install.

```
python tools/tdr_logger.py 192.168.1.50 --wide --interval 60 --out grow.csv
```

That writes a row a minute with a column per sensor. Drop the flags for a row per reading as they arrive.

## Home Assistant

The node is a native ESPHome device, so Home Assistant discovers it on its own, no custom component and no HACS. Two automation blueprints ship with it, dryback-triggered irrigation and an EC alert, plus a ready dashboard. Full guide, and an honest note on what HACS does and does not do, in [docs/HOMEASSISTANT.md](docs/HOMEASSISTANT.md).

## Troubleshooting

If the device runs but every reading is unknown, the probe is not talking to the board, and that has a short list of causes. Start with [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Repository layout

```
esphome/
  tdr-sensor-*.yaml            device files, one per board
  packages/
    tdr_sdi12_core.yaml        SDI-12 read plus the whole calibration pipeline
    tdr_analytics.yaml         dryback, irrigation and steering analytics
    tdr_mqtt.yaml              optional MQTT
    wifi_extras.yaml           fallback hotspot and diagnostics
    boards/                    one file per board with its pins and LED
  import/                      minimal configs for adopting pre-built firmware
  factory/                     what CI builds into the browser-flashable firmware
tools/
  tdr_logger.py                CSV logger over the device event stream
blueprints/automation/         Home Assistant blueprints
lovelace/dashboard.yaml        Home Assistant dashboard
docs/                          flashing, config, wiring, calibration, sensors, HA
.github/workflows/             builds firmware for every board, attaches it to releases
```

## What changed from the original config

This is a rebuild of the earlier single-file config. What moved and why:

- Restructured into packages so a device config is a handful of lines and updates pull from GitHub.
- Bulk EC at 25C is now actually temperature-normalised. The old config had a sensor named for it that only divided the raw number, so it did nothing. It defaults to off because the MT22 already normalises internally, and there is a coefficient to turn it on for probes that do not.
- The Hilhorst pore EC model now includes the pore water permittivity temperature term from the METER manual, instead of a fixed constant. More accurate as substrate temperature moves.
- The pore EC blend between the Hilhorst and mass balance models is now a pair of settings you can move, rather than hardcoded at 40 and 60 percent.
- The VWC polynomial was checked against the TEROS 12 manual and is correct. Added the mineral soil curve and a custom polynomial option alongside the soilless one.
- Added a median filter on the raw counts and a light smoothing filter on VWC, which kills the single-sample SDI-12 glitches that used to show as spikes.
- The device no longer reboots itself every fifteen minutes when no Home Assistant is connected, so it runs happily standalone on just the web page or MQTT.
- Web page upgraded to the sorted, grouped layout and bundled so it works with no internet.

## Credits

Calibration maths from the METER TEROS 11/12 manual. SDI-12 and half-duplex UART components by ssieb. Original inspiration from kromadg's soil-sensor project and the science-in-hydroponics writeups. Built by Legacy Ag.

## License

MIT. Use it, change it, sell what you grow with it.
