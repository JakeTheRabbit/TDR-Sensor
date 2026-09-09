# Home Assistant

Add the node through the standard ESPHome integration. It does not require HACS. After upgrading, inspect actual entity IDs: renamed readings and units may leave old entities unavailable. Use [MIGRATION-v3.md](MIGRATION-v3.md).

## Dashboard

Copy [lovelace/dashboard.yaml](../lovelace/dashboard.yaml) into a dashboard and replace `tdr_sensor` with the actual entity prefix. It separates checked VWC, wet-reference index, bulk EC, diagnostics and calibration. There are no generic “healthy” red/green VWC bands because a universal substrate target is not established.

## Requesting irrigation

[The dryback blueprint](../blueprints/automation/tdr_dryback_irrigation.yaml) now requests a **bounded shot from a separate controller button**. It no longer opens a switch and relies on an in-memory delay to close it. Before enabling it, the chosen controller must enforce its own maximum runtime and provide delivery/fault handling independent of Home Assistant staying online.

The blueprint requires an explicit enable helper, the node's `VWC ready` binary sensor, its `Sensor data fresh` binary sensor, a recent numeric `Dryback Percent` reading, an allowed time window and a minimum gap. It polls once a minute, so an above-threshold condition can be re-evaluated after the gap. A request is not evidence of a delivered shot. It does not implement a complete irrigation strategy, daily volume ceiling or multi-sensor voting.

Default enable helper state should be off. Commission against an inert/test controller before connecting a production request button. Do not select a button whose action merely leaves a valve switched on. The old valve selector is a breaking change: existing automation instances must be recreated/reconfigured.

An installation should also check controller health, actual flow/drainage, emitter uniformity and independent maximum volume/runtime limits. Treat a single local VWC trace as one input, not proof that the whole zone needs water.

## EC alerts

[The EC alert blueprint](../blueprints/automation/tdr_ec_alert.yaml) accepts an EC sensor and user-defined bounds. Pick **Bulk EC 25C** for the default measurement; do not paste nutrient-solution targets into it. Choose limits from comparable checked measurements in that installation. Modelled pore EC and bulk EC are different quantities. The blueprint uses local persistent notifications unless you supply another notification action.

The ESP32 itself has no valve/pump outputs in these packages. Nothing here changes an existing irrigation schedule automatically.
