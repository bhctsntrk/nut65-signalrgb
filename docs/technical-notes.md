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

## LED Mapping

The OEM QMK source has 151 physical RGB matrix entries. The SignalRGB-facing map exposes 82 logical LEDs:

- 67 key/control LEDs.
- 15 front lightbar anchor LEDs.

The firmware skips mirrored physical LEDs `10`, `11`, `13`, and `14`, and maps the lightbar to physical anchors:

```text
71, 77, 83, 89, 95, 101, 106, 111, 116, 121, 126, 131, 136, 141, 146
```

That is why the QMK method can drive the lower lightbar segments that the legacy path often missed.

## Brightness

The legacy path is HSV-oriented and does not get clean per-key brightness from the stock vendor protocol.

The QMK path receives RGB values from SignalRGB directly. SignalRGB can apply its brightness slider before sending the packet, and the firmware writes those RGB values with `rgb_matrix_set_color()`.

In plain terms: the legacy method asks the keyboard to interpret a weird recipe. The QMK method sends the cooked color.
