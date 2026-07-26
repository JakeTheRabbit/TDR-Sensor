# Troubleshooting

Work top to bottom. Most problems are the probe never talking to the board, and that has a short list of causes.

## The device works but every reading is unknown or NaN

This is the common one. The board is fine, the probe is not answering.

- Wrong framework or wrong chip. The SDI-12 half-duplex UART only works on an ESP32 with the esp-idf framework. On an ESP8266, or with the Arduino framework, the build succeeds and the probe stays silent. Use the board files in this repo and do not change the framework.
- Data on the wrong pin. Check sdi12_data_pin matches the pin you actually wired to. G26 on Atom Lite and PoE, G1 on AtomS3, G2 on the Dial, GPIO16 on generic.
- Red wire in the wrong hole. On the MT22 the red wire is data, not power. If red went to 5V, move it to the data pin. See the wiring guide.
- Not enough voltage. The MT22 needs at least 3.6V. Power it from 5V, not the 3.3V rail.
- Wrong SDI-12 address. Factory default on the MT22 is 0, which is what the config uses. If someone changed the probe address, set sdi12_address to match.
- Bad joint. Reflow or re-crimp the three wires. A cold joint on the data line looks exactly like a dead probe.

Check the logs. Open the device web page, or run the ESPHome logs, and watch for SDI-12 timeouts. A timeout every cycle means the board is asking and nothing is answering, which points at wiring or power. No SDI-12 activity at all points at the framework or pin.

## Readings are jumpy or noisy

- The probe is not fully inserted, or it is sitting in an air gap. Push the rods all the way in, into solid representative media.
- The rods are near the dripper. A reading taken under the emitter jumps every time water lands. Move it into the root zone, away from the drip point.
- Long unshielded cable near a light ballast or a pump. SDI-12 handles interference fairly well, but a metre of cable draped over an EC ballast will still pick up noise. Route it away from mains and drivers.
- The median and EMA filters already smooth a lot. If it is still jumpy after placement is fixed, the probe itself may be marginal.

## VWC looks wrong

- It reads high everywhere. Water is tracking down the rods and pooling. Angle the rods slightly downward or go in horizontally so water does not run along them.
- It reads low everywhere. Rods not fully in, or an air gap around them. Reinsert.
- It is believable but off by a fixed amount. That is what calibration is for. Do the two point VWC calibration in the calibration guide.
- You changed substrate profile and your tuning vanished. Changing the profile reloads that substrate's defaults on purpose. Set the profile first, then calibrate.

## Pore EC looks wrong

- Pore EC needs a good VWC number to work. If VWC is off, fix that first, then look at EC again.
- Spikes in dry media. Raise Pore EC Blend Low and High so the model leans on mass balance while dry. The blend already handles this, but very dry media can still spike.
- Bulk EC itself is off. Calibrate it against a known solution, see the calibration guide.
- The MT22 already normalises EC to 25C inside the probe, so the EC Temp Coefficient defaults to 0. Only raise it if your probe outputs raw, uncompensated EC.

## The Sensor Fault flag is on

It turns on for one of two reasons.

- The reading is NaN, meaning the probe is not answering. Same causes as the unknown-readings section above.
- The raw counts have not changed for a while. A probe that answers but returns the exact same number every cycle is usually stuck or unplugged mid-cable. The window is set by Fault Freeze Minutes, default 15. If your substrate genuinely does not move for long stretches, raise that number.

## Steering mode just says Learning

It needs a few full irrigation cycles before it will classify anything, at least three. Give it a day of normal irrigation. If it never leaves Learning after that, the irrigation detector is not seeing your shots. Lower Rise Threshold so smaller shots register, or check that VWC is actually moving when you irrigate.

## Irrigation events are miscounted

- Too many counted. Rise Threshold is too low and it is triggering on noise. Raise it.
- Shots missed. Rise Threshold is too high for your shot size, or the shots are so slow they fall outside the Irrigation Rise Window. Lower the threshold, or widen the window.
- Peaks confirmed too early or too late. Plateau Confirm Drop and Plateau Confirm Time control how it decides a shot has peaked. Longer time and larger drop make it wait for a clearer plateau.

## Cannot flash from the browser

- Use Chrome, Edge or Opera on a desktop. Web Serial does not exist in Safari, Firefox, or on phones.
- Plug the board in before clicking Install, and pick the right serial port.
- If no port shows up, you are missing the USB serial driver for that board, or the cable is charge-only. Try a known data cable first, then the driver.

## Cannot reach the web page after flashing

- Try http://tdr-sensor.local first. If mDNS does not resolve on your network, find the device IP from your router and use that.
- If it never joined WiFi, it falls back to its own hotspot called tdr-sensor. Join that from a phone and open http://192.168.4.1 to enter your network details.
- On the PoE board there is no WiFi. It comes up on ethernet over DHCP, so find its IP on the router.

## OTA update fails

- The device has to be on the network and reachable. Confirm you can load its web page first.
- If it dropped off mid-update, power cycle it. It keeps the old firmware until a new one is fully written, so a failed update does not brick it.
- Persistent OTA trouble on a weak WiFi signal usually means signal. Check the WiFi Signal reading and move the board or add an access point.
