# Weikav NUT65 SignalRGB

Community SignalRGB support for the Weikav/LEKU NUT65 keyboard.

This repo provides two ways to use the NUT65 with SignalRGB:

| Method | Firmware flash | Best for |
| --- | --- | --- |
| Legacy no-flash plugin | No | Stock firmware users who want the safest path |
| QMK SignalRGB firmware | Yes | Best RGB sync, lightbar support, and brightness behavior |

The legacy plugin talks to the stock firmware from the outside. The QMK firmware adds a small Raw HID protocol inside the keyboard, so SignalRGB can send RGB packets directly. One is a polite workaround; the other teaches the keyboard the language.

<p align="center">
  <a href="https://github.com/bhctsntrk/nut65-pipboy">
    <img src="demo.gif" alt="NUT65 Pip-Boy demo" width="300">
  </a>
</p>

<p align="center">
  <b>Also check out <a href="https://github.com/bhctsntrk/nut65-pipboy">NUT65 Pip-Boy</a></b>: a Fallout-themed desktop app that runs Snake, Pong, and marquee effects directly on the keyboard LEDs. It does not need SignalRGB.
</p>

## Supported Device

| Property | Value |
| --- | --- |
| Keyboard | Weikav NUT65 / LEKU NUT65 |
| Normal USB VID/PID | `342D:E51A` |
| Bootloader VID/PID | `342D:DFA0` |
| MCU | `WB32FQ95` |
| Bootloader | `wb32-dfu` |
| SignalRGB endpoint | Raw HID, usage page `0xFF60`, usage `0x61` |

This firmware is for the NUT65 only. Do not flash it to another keyboard just because the case looks similar. That is how keyboards become expensive desk ornaments.

## Keyboard Shortcuts

SignalRGB needs the keyboard in wired USB mode.

| Action | Shortcut |
| --- | --- |
| Wired USB mode | `Fn + T` |
| Bluetooth slot 1 | `Fn + Q` |
| Bluetooth slot 2 | `Fn + W` |
| Bluetooth slot 3 | `Fn + E` |
| 2.4 GHz mode | `Fn + R` |
| WB32 DFU bootloader | `Fn + Right Shift + Esc` |

Use the right Shift key for bootloader mode. `Fn + Esc` is not the same shortcut; on this keymap it can clear/reset settings instead of entering DFU. It looks dramatic, but it is the wrong drama.

## Recommended Setup

Use the QMK SignalRGB firmware if you are comfortable flashing firmware.

Files:

- Firmware: [`firmware/leku_nut65_signalrgb_default.bin`](firmware/leku_nut65_signalrgb_default.bin)
- SignalRGB plugin: [`Weikav_NUT65_QMK_SignalRGB.js`](Weikav_NUT65_QMK_SignalRGB.js)
- Source patch: [`patches/nut65-signalrgb-qmk.patch`](patches/nut65-signalrgb-qmk.patch)

What the QMK path adds:

- Direct SignalRGB Raw HID RGB streaming.
- 82 logical LEDs:
  - 67 key/control LEDs.
  - 15 front lightbar segments.
- Correct OEM visual LED order, including the physical left Ctrl LED.
- Lower lightbar mirror support.
- Direct RGB brightness behavior from SignalRGB.
- Conservative default performance profile:
  - `Safe 10 FPS`
  - high noise filtering
  - per-frame write limiting
- Firmware indicator guard so the keyboard's own battery/wireless/startup effects do not fight SignalRGB.

Important tradeoff: while SignalRGB is controlling the LEDs, the stock left Ctrl battery/charging prompt is hidden. The NUT65 normally uses left Ctrl for red/green battery status, but that overlay was the thing fighting dark screen-capture effects. SignalRGB gets priority while active.

## Quick Install: QMK SignalRGB Firmware

1. Put the keyboard in wired USB mode:

   ```text
   Fn + T
   ```

2. Close SignalRGB, VIA, and Vial.

3. Have a second keyboard available, or open Windows On-Screen Keyboard.

4. Enter WB32 DFU bootloader:

   ```text
   Fn + Right Shift + Esc
   ```

   Windows should show:

   ```text
   WB Device in DFU Mode
   USB\VID_342D&PID_DFA0
   ```

5. If the flasher cannot see the DFU device, install the WB32 WinUSB driver from:

   <https://github.com/WestberryTech/wb32-dfu-updater>

6. Flash the `.bin` firmware:

   ```powershell
   wb32-dfu-updater_cli.exe -t -s 0x08000000 -D firmware\leku_nut65_signalrgb_default.bin
   wb32-dfu-updater_cli.exe -R
   ```

7. Copy the SignalRGB plugin:

   ```text
   Weikav_NUT65_QMK_SignalRGB.js
   ```

   to:

   ```text
   C:\Users\<YourName>\Documents\WhirlwindFX\Plugins\
   ```

8. Restart SignalRGB and select the QMK SignalRGB plugin.

Detailed guide: [docs/flashing.md](docs/flashing.md)

Recovery notes: [docs/recovery.md](docs/recovery.md)

Technical notes: [docs/technical-notes.md](docs/technical-notes.md)

## Legacy No-Flash Plugin

Use this path if you do not want to flash firmware.

File:

- [`Weikav_NUT65.js`](Weikav_NUT65.js)

Install:

1. Copy `Weikav_NUT65.js` to:

   ```text
   C:\Users\<YourName>\Documents\WhirlwindFX\Plugins\
   ```

2. Restart SignalRGB.
3. Close VIA and Vial while using SignalRGB.

Limitations:

- Uses the stock vendor/VIA HID protocol.
- Sends per-key HSV commands and flushes them to the keyboard.
- Can reduce input responsiveness during heavy video or screen-capture effects.
- Brightness behavior is limited by the stock protocol.
- The front lightbar may not fully sync.

This is the no-surgery method. Safe, useful, and not magic.

## Verify The QMK Firmware

With SignalRGB closed:

```powershell
uv run --with hidapi python tools\probe_signalrgb_qmk.py
```

Expected values:

```text
protocol: [34, 1, 0, 6, ...]
total_leds: [39, 82, ...]
firmware_type: [40, 2, ...]
```

In plain English:

- SignalRGB protocol: `1.0.6`
- LED count: `82`
- Firmware type: `2` / VIA-style

## Build And Test Status

The QMK firmware path was tested on a real NUT65:

- Entered bootloader as `342D:DFA0`.
- Flashed with `wb32-dfu-updater_cli`.
- Returned to normal mode as `342D:E51A`.
- Raw HID probe passed.
- SignalRGB loaded the QMK plugin.
- Dark/video content no longer made left Ctrl flash red/green.
- Lower lightbar segments remained controllable.

The current firmware binary was rebuilt on 2026-05-25 after the LED-map and firmware-indicator guard fixes. The build completed successfully with QMK MSYS and produced a 67,936-byte `.bin`.

SHA256:

```text
455D974D31A7A0F247DECF32DE3F3B2F8D64E5955A83DDAAA91F5AC37820F027  leku_nut65_signalrgb_default.bin
2BD599E8CEE3B8EBB527DE54F66212DD24414E23277A8200441530CE099BFEF5  leku_nut65_signalrgb_default.hex
47C3A4D5B90B01956D63ADE643194C55A8F6FC71BF6EADD5934B803794D11338  Weikav_NUT65_QMK_SignalRGB.js
D47A08ADC4AC24827D89EC3BE2AA3E064B20636AF8A40D42F799A3939DD78787  nut65-signalrgb-qmk.patch
```

## Sources

- OEM QMK fork: <https://github.com/hangshengkeji/qmk_firmware>
- WB32 DFU updater and Windows driver: <https://github.com/WestberryTech/wb32-dfu-updater>
- SignalRGB: <https://signalrgb.com/>

## License

MIT
