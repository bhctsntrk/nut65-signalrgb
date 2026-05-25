# Technical Notes

## Why Two Plugins Exist

The original plugin works on stock firmware by reverse-engineering the vendor/VIA HID commands. It is useful because it does not require firmware flashing.

The downside is that it has to keep poking the firmware with per-key commands. Under video effects that can become a lot of HID traffic. It is like updating a spreadsheet by calling someone on the phone for every cell.

The QMK firmware path adds a small SignalRGB Raw HID command handler inside the keyboard firmware. SignalRGB can then send RGB packets directly.

The QMK SignalRGB plugin defaults to a stable 10 FPS profile with high noise filtering and a small per-frame write limit. That trades a little animation smoothness for lower USB traffic during video and screen-capture effects, which is usually the better deal for an actual keyboard you type on.

## USB IDs

| Mode | VID/PID |
| --- | --- |
| Normal keyboard | `342D:E51A` |
| WB32 DFU bootloader | `342D:DFA0` |

Normal-mode Raw HID endpoint:

| Property | Value |
| --- | --- |
| Interface | `1` |
| Usage page | `0xFF60` |
| Usage | `0x61` |
| Raw report size | `32` bytes plus report ID on Windows |

## SignalRGB QMK Commands

| Command | Value |
| --- | --- |
| Get QMK version | `0x21` |
| Get SignalRGB protocol version | `0x22` |
| Get unique identifier | `0x23` |
| Stream RGB data | `0x24` |
| Enable SignalRGB mode | `0x25` |
| Disable SignalRGB mode | `0x26` |
| Get total LEDs | `0x27` |
| Get firmware type | `0x28` |

Firmware reports:

```text
protocol: 1.0.6
total_leds: 82
firmware_type: 2
```

`firmware_type = 2` means VIA-style firmware.

## RGB Packet Layout

On Windows the plugin writes a 33-byte HID report because byte `0` is the report ID. The firmware receives the 32-byte Raw HID payload:

```text
plugin write: [report_id, command, start_led, led_count, r0, g0, b0, r1, g1, b1, ...]
firmware rx:  [command,   start_led, led_count, r0, g0, b0, r1, g1, b1, ...]
```

For RGB streaming:

```text
command = 0x24
led_count <= 9
```

The plugin samples SignalRGB's canvas for each logical LED, groups them into 9-LED chunks, and writes only changed chunks. The default profile is intentionally conservative: 10 FPS, high noise filtering, and at most 3 changed chunks per normal frame. Forced full frames are still sent when SignalRGB starts or when shutdown color is used.

## LED Mapping

The OEM QMK source has 151 physical RGB matrix entries. The SignalRGB-facing map exposes 82 logical LEDs:

- 67 key/control LEDs.
- 15 front lightbar anchor LEDs.

The firmware skips mirrored physical LEDs `10`, `11`, `13`, and `14`, and maps the lightbar to physical anchors:

```text
71, 77, 83, 89, 95, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146
```

That is why the QMK method can drive the lower lightbar segments that the legacy path often missed.

The logical key order follows the OEM `hs_rgb_buff_index` visual order, not the raw physical LED number order. This matters because the physical left Ctrl LED is also used by the stock firmware as the battery/charging prompt. If the SignalRGB map is off by that much, SignalRGB thinks it is painting one key while the firmware is fighting over another. Very tiny bug, very theatrical symptoms.

## Firmware Indicators

The stock NUT65 firmware can paint status colors after the RGB matrix frame has already been rendered:

- left Ctrl red/green battery and charging prompts
- wireless and pairing indicators
- blink/query helper effects
- startup and lock-state overlays

SignalRGB mode now exits those indicator paths early. It keeps only the mirror step needed for duplicated physical LEDs and the lower lightbar clusters.

This is especially important for dark screen-capture effects. When most of the canvas is black, the plugin correctly sends fewer changed chunks. Without the firmware guard, the keyboard's own indicator layer could become the loudest thing on the LEDs, like a phone alarm going off during a movie.

The tradeoff is intentional: while SignalRGB owns the LEDs, left Ctrl no longer shows the stock red/green battery prompt. SignalRGB stops getting photobombed by the firmware, but you lose that tiny status light during active control.

## Bootloader Entry

The reliable bootloader shortcut on the default keymap is:

```text
Fn + Right Shift + Esc
```

The helper script sends VIA bootloader command `0x0B`, but NUT65 firmware builds are inconsistent about honoring it. It can work on some stock/VIA states and do nothing on others. The key combo is boring, which in bootloader land is praise.

## Brightness

The legacy path is HSV-oriented and does not get clean per-key brightness from the stock vendor protocol.

The QMK path receives RGB values from SignalRGB directly. SignalRGB can apply its brightness slider before sending the packet, and the firmware writes those RGB values with `rgb_matrix_set_color()`.

In plain terms: the legacy method asks the keyboard to interpret a weird recipe. The QMK method sends the cooked color.
