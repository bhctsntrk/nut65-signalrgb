# Flashing the QMK SignalRGB Firmware

This guide is for the Weikav/LEKU NUT65 only.

Flashing firmware always has some risk. The NUT65 uses a WB32 DFU bootloader, so recovery is usually possible as long as the bootloader still appears as `342D:DFA0`.

## Before You Start

- Use wired USB-C mode.
- Close SignalRGB, VIA, and Vial.
- Have a second keyboard available, or open Windows On-Screen Keyboard first.
- Do not unplug the keyboard while the flasher is writing.

The second keyboard warning matters because once the NUT65 enters DFU mode, it stops acting like a keyboard. Windows may still ask for an admin password while installing the driver. Great timing, Windows. Truly theatrical.

## Switch To Wired USB Mode

SignalRGB and flashing both expect the keyboard to be on USB, not Bluetooth or 2.4 GHz.

Default mode shortcuts:

| Action | Shortcut |
| --- | --- |
| Wired USB mode | `Fn + T` |
| Bluetooth slot 1 | `Fn + Q` |
| Bluetooth slot 2 | `Fn + W` |
| Bluetooth slot 3 | `Fn + E` |
| 2.4 GHz mode | `Fn + R` |

Before flashing or testing SignalRGB, press `Fn + T` with the USB cable connected.

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

Preferred method for the QMK SignalRGB firmware:

1. Keep the keyboard plugged in.
2. Hold `Fn`.
3. Hold `Right Shift`.
4. Tap `Esc`.

Use the right Shift key, not left Shift. The default keymap puts `QK_BOOT` behind that second layer, which is a very keyboard-firmware way of hiding the emergency exit behind a bookcase.

Alternative methods:

- Hold `Esc` while plugging the USB cable in. On some firmware builds this clears persistent settings instead of entering DFU.
- Use VIA/Vial if your current keymap has a bootloader/reset key.
- Try the helper script only as a best-effort path for stock/VIA firmware builds:

  ```powershell
  uv run --with hidapi python tools\jump_to_bootloader.py
  ```

  The helper sends VIA command `0x0B`. Some NUT65 firmware builds ignore that command, so the key combo above is more reliable.

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
