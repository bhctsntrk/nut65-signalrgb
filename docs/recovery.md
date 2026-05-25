# Recovery Notes

If something goes wrong, do not panic first. Panic is a terrible debugging tool.

## Mode Shortcuts

If SignalRGB does not see the keyboard, first make sure it is in wired USB mode:

```text
Fn + T
```

Other default mode shortcuts:

| Action | Shortcut |
| --- | --- |
| Bluetooth slot 1 | `Fn + Q` |
| Bluetooth slot 2 | `Fn + W` |
| Bluetooth slot 3 | `Fn + E` |
| 2.4 GHz mode | `Fn + R` |
| WB32 DFU bootloader | `Fn + Right Shift + Esc` |

## Keyboard Still Enters DFU

From the QMK SignalRGB firmware, enter DFU with:

```text
Fn + Right Shift + Esc
```

If Windows can see:

```text
USB\VID_342D&PID_DFA0
WB Device in DFU Mode
```

then the bootloader is alive. You can flash again with:

```powershell
wb32-dfu-updater_cli.exe -t -s 0x08000000 -D firmware\leku_nut65_signalrgb_default.bin
wb32-dfu-updater_cli.exe -R
```

If the flasher says `Not found device!`, reinstall the WB32 WinUSB driver from:

<https://github.com/WestberryTech/wb32-dfu-updater>

## Keyboard Boots But SignalRGB Does Not Detect It

Check these:

- The keyboard is in USB-C wired mode.
- VIA, Vial, and other HID tools are closed.
- The QMK plugin file is in:

  ```text
  C:\Users\<YourName>\Documents\WhirlwindFX\Plugins\
  ```

- SignalRGB was restarted after copying the plugin.
- SignalRGB logs mention:

  ```text
  Custom Plugin File Loaded
  ```

## Keyboard Works But RGB Looks Wrong

Try:

- Restart SignalRGB.
- Unplug and replug the keyboard.
- Make sure the QMK plugin is active, not the legacy plugin.
- Test with a simple solid-color effect before testing video/screen capture.

## Left Ctrl No Longer Shows Battery Color In SignalRGB

That is expected while SignalRGB is active. The stock firmware uses left Ctrl for low-battery, charging, and full-charge red/green prompts. The QMK SignalRGB firmware mutes those prompt overlays during SignalRGB control so they do not fight screen-capture effects.

## Need To Go Back To Stock

This repo does not include a stock firmware binary. The safer route is to rebuild from the OEM QMK fork:

<https://github.com/hangshengkeji/qmk_firmware>

The relevant keyboard path is:

```text
keyboards/leku/nut65
```

The QMK patch in this repo is intentionally small so you can compare or revert the SignalRGB additions.
