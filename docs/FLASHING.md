# Flashing the firmware

Two ways in. Pick the one that matches what you want.

**Pre-built firmware** is a file you download and flash from your browser. Nothing to install, no ESPHome, no command line. Use this if you just want a working sensor.

**Build it yourself** with ESPHome if you want to change the config, use a board that has no pre-built image, or update over WiFi later. See [CONFIG.md](CONFIG.md).

You can start with the pre-built firmware and move to building your own later. Flashing again over USB does not hurt anything.

## Before you start

- A desktop or laptop running **Chrome, Edge or Opera**. The browser flasher uses Web Serial, which does not exist in Firefox or Safari, and does not work on phones or tablets.
- A **USB data cable**. A lot of cheap cables are charge only and will look like a dead board.
- Your board plugged in over USB.

Some boards need a USB serial driver before the computer will see them. If no port shows up later, that is usually why. The M5Stack Atom family generally works with no driver on Windows 11 and macOS. Older or generic ESP32 boards often need CP210x or CH34x drivers.

## Flash the pre-built firmware

### Step 1: download the firmware file

Go to the [Releases page](https://github.com/JakeTheRabbit/TDR-Sensor/releases) and download the file for your board:

| Board | File |
|---|---|
| M5Stack Atom Lite | `tdr-sensor-atom-lite.factory.bin` |
| M5Stack AtomS3 Lite | `tdr-sensor-atom-s3.factory.bin` |
| M5Stack Atom PoE | `tdr-sensor-atom-poe.factory.bin` |
| M5Stack Dial | `tdr-sensor-m5-dial.factory.bin` |
| Generic ESP32 | `tdr-sensor-esp32-generic.factory.bin` |

Download the **factory.bin**, not the ota.bin. The factory file is the complete image including the bootloader, which is what you need for a USB flash. The ota.bin is only for updating a device that is already running this firmware, over the network.

### Step 2: open the flasher and connect

1. Plug the board into your computer over USB.
2. Go to **[web.esphome.io](https://web.esphome.io)**.
3. Click **CONNECT**.
4. A browser dialog lists the serial ports. Pick your board and click Connect.

If the list is empty, or your board is not in it, see [no serial port shows up](#no-serial-port-shows-up) below.

### Step 3: install the file

1. Click **Install**. Do not click "Prepare for first use", that installs ESPHome's own generic firmware instead of this project's.
2. A dialog appears titled **Install your existing ESPHome project**.
3. Click **choose file** and select the `.factory.bin` you downloaded.
4. Click **INSTALL**.

It takes a minute or two. Leave the cable in and the tab open until it finishes.

### Step 4: put it on your WiFi

When the flash finishes, the same page offers to configure WiFi. Enter your network name and password there.

If that prompt does not appear, or you skip it, the board makes its own hotspot called **tdr-sensor**. Join that from a phone or laptop and open `http://192.168.4.1` to enter your network details.

The Atom PoE has no WiFi at all. Plug it into your network with the ethernet cable and it picks up an address over DHCP.

### Step 5: open it

Once it is on your network, browse to **`http://tdr-sensor.local`**.

If that name does not resolve, your network does not do mDNS. Find the device IP in your router's client list and use that instead.

You should see live readings and every calibration control. That is the whole thing running, no Home Assistant required. Next step is [wiring](WIRING.md) if you have not already, then [calibration](CALIBRATION.md).

## If web.esphome.io does not work for your board

Use Espressif's own flasher at **[espressif.github.io/esptool-js](https://espressif.github.io/esptool-js/)**. It is more manual but it handles boards the ESPHome page trips over.

1. Click **Connect** and pick your serial port.
2. Set **Flash Address** to `0x0`. This matters, a factory image written to the wrong offset will not boot.
3. Choose the same `.factory.bin` file.
4. Click **Program** and wait for it to finish.

It has no WiFi setup step, so afterwards join the **tdr-sensor** hotspot and open `http://192.168.4.1` to enter your network.

## Updating later

Once a device is running this firmware and is on your network, you have a few options.

**Over the air from ESPHome.** If you build your own config, `esphome run` pushes updates over WiFi. No cable. This is the nicest way to live, and it is why the [remote package config](CONFIG.md) is worth setting up.

**From the browser again.** Download the new `.factory.bin` from Releases and repeat the steps above over USB. Your calibration settings are stored separately from the firmware and survive a normal update.

**Home Assistant adoption.** If you run the ESPHome Dashboard, either the Home Assistant add-on or standalone, a device flashed with the pre-built firmware shows up as discovered and offers to be adopted. Adopting pulls the config from this repo and lets you manage and update it from the dashboard. This only works in the full ESPHome Dashboard, not on web.esphome.io, because adopting means compiling a config. See [HOMEASSISTANT.md](HOMEASSISTANT.md).

## Troubleshooting

### No serial port shows up

- The cable is charge only. Try a different one, this is the single most common cause.
- You need a USB serial driver. Generic ESP32 boards usually want CP210x or CH34x, depending on the chip on the board.
- Something else is holding the port. Close any serial monitor, Arduino IDE, or ESPHome log window and try again.
- Try a different USB port, and avoid hubs if you can.

### The browser will not offer to connect at all

You are on Firefox or Safari, or on a phone. Web Serial only exists in Chrome, Edge and Opera on a desktop.

### Flashing starts then fails partway

- Bad or long cable. Try a short, known-good data cable.
- Some boards need to be held in bootloader mode. On most ESP32 dev boards that is holding BOOT while you plug it in, or holding BOOT and tapping RESET. The M5Stack Atom boards normally do this on their own.
- If it fails repeatedly, use the esptool-js fallback above, which reports errors more plainly.

### It flashed but nothing happens

Give it thirty seconds after the flash to boot and start the hotspot. If nothing at all appears, flash again and watch for an error. If the board is otherwise dead, check you used the factory.bin and not the ota.bin.

More problems and fixes in [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
