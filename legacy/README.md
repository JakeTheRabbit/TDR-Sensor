# Legacy files

These are the original files, kept for reference. Nothing here is used by the current build.

- `sdi-12-tdr.yaml` is the first single-file ESPHome config. The current config is in [../esphome](../esphome), split into packages and with the full calibration and analytics suite. See the "What changed from the original config" section of the main README for what moved and why.
- `tdr_soil_sensor.ino` is an older Arduino sketch for an ESP8266 reading an RS485 THC-S probe and publishing to MQTT. It is a different sensor and a different protocol to the SDI-12 node this repo is now built around. Left here in case anyone is running that hardware.

If you are setting up a sensor, start at the main [README](../README.md), not here.
