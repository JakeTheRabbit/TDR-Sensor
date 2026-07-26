# Home Assistant

You do not need Home Assistant to use this sensor. The device serves its own web page and can log to CSV or push to MQTT on its own. But if you already run Home Assistant, the node drops straight in, and this is how.

## What HACS does and does not do

Worth being straight about this, because a lot of guides are vague.

HACS installs custom integrations, dashboard cards, themes, python scripts, templates, and AppDaemon apps. That is the full list of what it handles.

HACS does not install ESPHome firmware. Firmware for an ESP32 is built and flashed by ESPHome or from the browser installer, not by HACS. There is nothing to add to HACS for the sensor itself.

HACS does not have a blueprint category either. Blueprints are imported through Home Assistant's own blueprint import, which is a genuine one-click link and is covered below. That is why this repo ships blueprints and dashboards but no hacs.json. There is nothing here that installs through HACS, and pretending otherwise would just send you in circles.

So the real one-click paths are: ESPHome auto-discovery for the device, and the native blueprint import for the automations.

## Adding the device

The device speaks the native ESPHome API, so Home Assistant finds it by itself.

1. Flash the board (browser installer or ESPHome, see the main README).
2. Once it is on your network, Home Assistant shows a discovered device notification for it. Settings, Devices and Services, and it appears under Discovered.
3. Click Configure, confirm, and every sensor, number, button and the steering text sensor come in as entities.

If you set an API encryption key in your config, Home Assistant asks for it here. If you left the API open, it just connects.

That is the whole integration. No custom component, no HACS, no YAML.

## Adopting a pre-built device into the ESPHome Dashboard

Separate from the step above, which brings readings into Home Assistant, you can also take over the firmware itself so you can change and update it.

A board flashed with the pre-built firmware carries a pointer back to this repo. If you run the **ESPHome Dashboard**, either the Home Assistant add-on called ESPHome Device Builder or a standalone install, the device turns up there as discovered with an option to adopt or take control. Adopting creates a config for it that pulls the packages from this repo, compiles it, and pushes it over the air. From then on it is a normal device in your dashboard and you can edit the substitutions, add MQTT, or pin a version.

This only happens in the full ESPHome Dashboard, not on web.esphome.io. Adopting means compiling a config, and the web flasher has no compiler in it. If you do not run a dashboard you are not missing anything, the pre-built firmware is already complete.

## Keeping your config short

If you want to build the firmware yourself rather than use the pre-built image, you do not need to copy the whole config. Point a short device file at the packages in this repo and let it pull them from GitHub. Every board, plus the self-contained version, is in [CONFIG.md](CONFIG.md).

```yaml
substitutions:
  name: tdr-sensor
  sdi12_data_pin: GPIO26

packages:
  tdr:
    url: https://github.com/JakeTheRabbit/TDR-Sensor
    ref: main
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

Swap the board file for your board. Your substitutions override the package defaults, so this is where you set the data pin, the name, the timezone, anything else.

## Automation blueprints

Two blueprints ship with this repo. Import them with these links. They open your Home Assistant and ask you to confirm the import.

Dryback-triggered irrigation. Fires a shot when the substrate dries back past your target, inside the lights-on window, with a minimum gap between shots.

[Import the dryback irrigation blueprint](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FJakeTheRabbit%2FTDR-Sensor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Ftdr_dryback_irrigation.yaml)

Pore EC alert. Notifies you when pore EC climbs above or drops below your limits.

[Import the EC alert blueprint](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FJakeTheRabbit%2FTDR-Sensor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Ftdr_ec_alert.yaml)

If a link does not work, in Home Assistant go to Settings, Automations and Scenes, Blueprints, Import Blueprint, and paste the raw URL of the blueprint file from this repo.

After importing, create an automation from the blueprint and fill in your entities. The dryback one needs your Dryback Percent sensor and your irrigation switch. The EC one needs your Pore EC sensor and a notify action.

A word on the irrigation blueprint: it turns a valve on for a set time based on a sensor reading. Test it with the pump off and watch it fire before you let it run water. A stuck sensor or a bad threshold can over-irrigate. Start with a conservative dryback target and a short shot.

## Dashboard

There is a ready-made dashboard at [lovelace/dashboard.yaml](../lovelace/dashboard.yaml). It has gauges for VWC, pore EC and saturation, the steering panel, the irrigation stats, and history graphs.

To use it: Settings, Dashboards, Add Dashboard, then open it, Edit, the three-dot menu, Raw configuration editor, and paste the file in. The entity ids assume the device is named tdr-sensor. If you named it something else, find and replace tdr_sensor with your name.

## MQTT instead of the native API

If you run something other than Home Assistant, or you want MQTT anyway, enable the MQTT package. Uncomment the mqtt line in your device file, add the broker details to secrets.yaml, and the node publishes every sensor with Home Assistant discovery. It works alongside the native API, you can run both.
