# Configuration

Use ESPHome **2026.8.2** for this revision. The two external UART/SDI-12 components are pinned to reviewed commit IDs in the core package. The board configurations use ESP-IDF; do not switch them to Arduino or ESP8266 and assume equivalent behaviour.

## Local files

1. Clone or download the repository.
2. Copy `esphome/secrets.yaml.example` to `esphome/secrets.yaml` and enter your network credentials. The secrets file is ignored by Git.
3. Choose a file below; change the name, address, pin and timezone where appropriate.
4. Validate with `esphome config <file>`, compile with `esphome compile <file>`, then explicitly install it on the intended node using your normal flashing workflow.

| Board | Device YAML | SDI-12 GPIO |
|---|---|---|
| Atom Lite | [tdr-sensor-atom-lite.yaml](../esphome/tdr-sensor-atom-lite.yaml) | 26 |
| AtomS3 Lite | [tdr-sensor-atom-s3.yaml](../esphome/tdr-sensor-atom-s3.yaml) | 1 |
| Atom PoE | [tdr-sensor-atom-poe.yaml](../esphome/tdr-sensor-atom-poe.yaml) | 26 |
| M5 Dial | [tdr-sensor-m5-dial.yaml](../esphome/tdr-sensor-m5-dial.yaml) | 2 |
| Generic ESP32 | [tdr-sensor-esp32-generic.yaml](../esphome/tdr-sensor-esp32-generic.yaml) | 16 |

These files include local packages; they are not single-file standalone configurations. `esphome config` expands them for inspection, but may include resolved secrets. Do not publish that output or treat it as a sanitised configuration export.

The [README remote-package example](../README.md#esphome-installation) is another option. Pin its `ref` to a reviewed commit SHA for reproducibility. Following `main` changes what you build next time; a package refresh does not automatically install firmware. No v3 tag is assumed to exist until a release is actually published.

## Packages

| Package | Purpose |
|---|---|
| `packages/tdr_sdi12_core.yaml` | MT22 measurements, freshness, weighted-reference calibration, web controls |
| `packages/tdr_analytics.yaml` | Optional checked-VWC trends and detected wettings |
| `packages/boards/*.yaml` | Board-specific hardware; the Atom status LEDs and Dial display also use analytics |
| `packages/wifi_extras.yaml` | Wi-Fi diagnostics and fallback portal; omit on PoE |
| `packages/tdr_mqtt.yaml` | Optional MQTT discovery |

For a bare core-only custom board configuration, omit the analytics-dependent LED/display code. The standard board files include both packages.

## Sampling

Defaults are `sample_interval: 30s`, `sample_timeout: 90s` and `sample_timeout_ms: "90000"`. If changing the timeout, change both forms to the same duration. Keep timeout longer than the sampling interval and allow for missed replies. The ten-reading capture window takes about five minutes at default cadence; a gap longer than timeout resets it. A successful unchanged reply refreshes data age.

## Runtime calibration

Select the medium/geometry, enable Calibration mode and use the capture buttons. See [CALIBRATION.md](CALIBRATION.md). There is no need to edit polynomial coefficients or copy a different YAML for each pot size. Geometry belongs in the calibration record and volume calculation; adding litres to a YAML does not turn a local dielectric reading into an average of a whole root zone.

Calibration globals are saved with a five-second flash-write interval. Wait ten seconds after a capture before disconnecting power. Runtime trend history is not stored in flash. On Atom boards: violet = checked VWC unavailable, blue = wetting detected, green = tracking below the chosen dryback observation threshold, amber = threshold reached. This is not a plant-health indicator.

## Network credentials

For a private deployment, add these sections to your device config and define unique values in `secrets.yaml`:

```yaml
api:
  encryption:
    key: !secret api_encryption_key

ota:
  - platform: esphome
    password: !secret ota_password

web_server:
  auth:
    username: !secret web_username
    password: !secret web_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    password: !secret fallback_ap_password
```

ESPHome requires a valid 32-byte base64 API key. Generate one locally or through ESPHome's documented key generator; do not copy somebody else's key. The PoE node excludes Wi-Fi settings. Factory configs intentionally omit deployment credentials to support provisioning; an uncredentialed web page exposes calibration controls on the local network. Add credentials when adopting it.

For MQTT, uncomment the `tdr_mqtt.yaml` package and fill in `mqtt_broker`, `mqtt_username` and `mqtt_password` in secrets. The existing CSV logger currently supports an unauthenticated local web event stream; use Home Assistant/MQTT logging if you enable web authentication, unless you extend the logger's authentication support.


CSV logging: wide format now records each field's observation age, blanks readings after `--max-age` (default 120 seconds) or a disconnected stream, and refuses to append a mismatched header. Start a new CSV after upgrading. Use long format for entities that appear after the initial snapshot; wide mode warns rather than silently dropping new columns. Adjust maximum age to the actual reporting cadence, not the desired irrigation interval.
