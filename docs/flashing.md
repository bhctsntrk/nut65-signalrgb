# Flashing the QMK SignalRGB Firmware

This guide is for the Weikav/LEKU NUT65 only.

Flashing firmware always has some risk. The NUT65 uses a WB32 DFU bootloader, so recovery is usually possible as long as the bootloader still appears as `342D:DFA0`.

## Before You Start

- Use wired USB-C mode.
- Close SignalRGB, VIA, and Vial.
- Have a second keyboard available, or open Windows On-Screen Keyboard first.
- Do not unplug the keyboard while the flasher is writing.

The second keyboard warning matters because once the NUT65 enters DFU mode, it stops acting like a keyboard. Windows may still ask for an admin password while installing the driver. Great timing, Windows. Truly theatrical.

## Files

- Firmware: `firmware/leku_nut65_signalrgb_default.bin`
- Optional Intel HEX build: `firmware/leku_nut65_signalrgb_default.hex`
- SignalRGB plugin: `Weikav_NUT65_QMK_SignalRGB.js`
- QMK source patch: `patches/nut65-signalrgb-qmk.patch`

Use the `.bin` file for WB32 DFU flashing.

## Driver

If Windows shows the bootloader as `WB Device in DFU Mode` but the flasher says `Not found device!`, install the WB32 WinUSB driver from:

<https://github.com/WestberryTech/wb32-dfu-updater>

The driver matches:

```text
USB\VID_342D&PID_DFA0
```

After the driver is installed, the device should show as OK in Device Manager.

## Enter Bootloader Mode

Option A: use VIA/Vial if you already have a bootloader/reset key available.

Option B: use the helper script in this repo:

```powershell
uv run --with hidapi python tools\jump_to_bootloader.py
```

The keyboard should disappear as `342D:E51A` and reappear as:

```text
WB Device in DFU Mode
USB\VID_342D&PID_DFA0
```

## Flash

Run this from the repo root, replacing the path to `wb32-dfu-updater_cli.exe` if needed:

```powershell
wb32-dfu-updater_cli.exe -t -s 0x08000000 -D firmware\leku_nut65_signalrgb_default.bin
wb32-dfu-updater_cli.exe -R
```

Expected success output includes:

```text
Writing ...
OK
Download completed!
Reset device completed!
```

After reset, the keyboard should return as:

```text
USB\VID_342D&PID_E51A
```

## Install the SignalRGB Plugin

Copy:

```text
Weikav_NUT65_QMK_SignalRGB.js
```

to:

```text
C:\Users\<YourName>\Documents\WhirlwindFX\Plugins\
```

Restart SignalRGB. The device should load through the QMK SignalRGB plugin.

## Verify

With SignalRGB closed, you can probe the firmware:

```powershell
uv run --with hidapi python tools\probe_signalrgb_qmk.py
```

Expected values:

```text
protocol: 1.0.6
total_leds: 82
firmware_type: 2
```
