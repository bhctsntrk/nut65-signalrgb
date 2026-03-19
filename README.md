# Weikav NUT65 — SignalRGB Plugin

Community-made [SignalRGB](https://signalrgb.com/) plugin for the **Weikav NUT65** mechanical keyboard. Enables per-key RGB control, screen capture ambient lighting, and all SignalRGB effects.

The NUT65 is not officially supported by SignalRGB. This plugin was built by reverse-engineering the VIA HID protocol from Weikav's web-based configurator.

## Features

- **Per-key RGB** — 67 keys individually controllable
- **Light bar** — 15-segment front light bar support
- **Screen capture** — Ambient lighting that reflects your screen
- **All SignalRGB effects** — Gradients, reactive, audio-responsive, etc.
- **No firmware modification** — Works with stock NUT65 firmware
- **Safe** — Only writes to RAM, never touches EEPROM

## Installation

1. Download [`Weikav_NUT65.js`](Weikav_NUT65.js)
2. Copy to `C:\Users\<YourName>\Documents\WhirlwindFX\Plugins\`
3. Restart SignalRGB
4. NUT65 should appear in the Devices list

> **Important:** Close VIA or Vial before using SignalRGB — they share the same HID endpoint and cannot run simultaneously.

## Requirements

- Weikav NUT65 connected via **USB-C** (wired mode only)
- [SignalRGB](https://signalrgb.com/) installed
- Windows 10/11

Bluetooth and 2.4G wireless modes are unaffected — the plugin only activates over USB.

## How It Works

The plugin communicates with the NUT65 over the VIA RAW HID endpoint (`usagePage: 0xFF60, usage: 0x61`).

| Step | Command |
|------|---------|
| Set direct control mode | `[0x07, 0x03, 0x02, 45]` |
| Set per-key color (HSV) | `[0x07, 0x00, 0x03, 0x00, row, col, sat, hue]` |
| Flush colors to display | `[0x07, 0x00, 0x02, 0x00]` |

SignalRGB provides RGB colors → the plugin converts to HSV → sends per-key commands → flushes once per frame.

### Performance

~12 fps with 82 LEDs (67 keys + 15 light bar segments). Delta optimization skips unchanged keys, improving effective frame rate for typical content.

### Limitations

- **No per-key brightness** — Only hue and saturation are controllable per key. Brightness is global.
- **Light bar sync** — The front light bar has a separate firmware controller. It responds to per-key commands only in certain keyboard modes. You may need to manually cycle the light bar mode (Fn + light bar shortcut) to a static mode for full control.
- **HSV only** — Dark screen areas may appear white since the keyboard cannot display low brightness per key.

## Technical Details

| Property | Value |
|----------|-------|
| Vendor ID | `0x342D` |
| Product ID | `0xE51A` |
| HID Interface | 1 |
| Report Size | 65 bytes |
| Matrix | 6 rows × 15 cols |
| Color Format | HSV (hue 0-255, saturation 0-255) |
| Direct Control Mode | 45 ("Close All") |

## Troubleshooting

**Keyboard not detected:**
- Make sure it's connected via USB-C, not Bluetooth/2.4G
- Close VIA and Vial completely
- Restart SignalRGB

**Keys stay white:**
- The plugin needs mode 45 to work. If mode was changed externally, restart SignalRGB.

**Light bar not responding:**
- Cycle the light bar mode using Fn + shortcut until it syncs with the keys.

## License

MIT

---

# Weikav NUT65 — SignalRGB Eklentisi

Weikav NUT65 mekanik klavye için topluluk tarafından yapılmış [SignalRGB](https://signalrgb.com/) eklentisi. Tuş başına RGB kontrolü, ekran yakalama ortam aydınlatması ve tüm SignalRGB efektlerini kullanmanızı sağlar.

NUT65 resmi olarak SignalRGB tarafından desteklenmemektedir. Bu eklenti, Weikav'ın web tabanlı yapılandırıcısından VIA HID protokolü tersine mühendislik yapılarak oluşturulmuştur.

## Özellikler

- **Tuş başına RGB** — 67 tuş ayrı ayrı kontrol edilebilir
- **Işık çubuğu** — 15 segmentli ön ışık çubuğu desteği
- **Ekran yakalama** — Ekranınızı yansıtan ortam aydınlatması
- **Tüm SignalRGB efektleri** — Gradyanlar, reaktif, ses duyarlı vb.
- **Firmware değişikliği yok** — Orijinal NUT65 firmware'i ile çalışır
- **Güvenli** — Yalnızca RAM'e yazar, EEPROM'a dokunmaz

## Kurulum

1. [`Weikav_NUT65.js`](Weikav_NUT65.js) dosyasını indirin
2. `C:\Users\<KullanıcıAdınız>\Documents\WhirlwindFX\Plugins\` klasörüne kopyalayın
3. SignalRGB'yi yeniden başlatın
4. NUT65 cihaz listesinde görünmelidir

> **Önemli:** SignalRGB kullanırken VIA veya Vial'ı kapatın — aynı HID uç noktasını paylaşırlar.

## Gereksinimler

- Weikav NUT65 **USB-C** ile bağlı (sadece kablolu mod)
- [SignalRGB](https://signalrgb.com/) yüklü
- Windows 10/11

Bluetooth ve 2.4G kablosuz modlar etkilenmez — eklenti yalnızca USB üzerinden çalışır.

## Nasıl Çalışır

Eklenti, NUT65 ile VIA RAW HID uç noktası üzerinden iletişim kurar (`usagePage: 0xFF60, usage: 0x61`).

SignalRGB RGB renkleri sağlar → eklenti HSV'ye dönüştürür → tuş başına komut gönderir → çerçeve başına bir kez uygular.

### Performans

82 LED ile (67 tuş + 15 ışık çubuğu segmenti) ~12 fps. Delta optimizasyonu değişmeyen tuşları atlar.

### Sınırlamalar

- **Tuş başına parlaklık yok** — Yalnızca ton ve doygunluk kontrol edilebilir. Parlaklık globaldir.
- **Işık çubuğu senkronizasyonu** — Ön ışık çubuğunun ayrı bir firmware denetleyicisi vardır. Tam kontrol için ışık çubuğu modunu (Fn + kısayol) manuel olarak statik moda almanız gerekebilir.
- **Yalnızca HSV** — Koyu ekran alanları, klavye tuş başına düşük parlaklık gösteremediği için beyaz görünebilir.

## Sorun Giderme

**Klavye algılanmıyor:**
- USB-C ile bağlı olduğundan emin olun (Bluetooth/2.4G değil)
- VIA ve Vial'ı tamamen kapatın
- SignalRGB'yi yeniden başlatın

**Tuşlar beyaz kalıyor:**
- Eklenti çalışması için mod 45 gereklidir. Mod harici olarak değiştirildiyse SignalRGB'yi yeniden başlatın.

**Işık çubuğu yanıt vermiyor:**
- Fn + kısayol ile ışık çubuğu modunu tuşlarla senkronize olana kadar değiştirin.

## Lisans

MIT
