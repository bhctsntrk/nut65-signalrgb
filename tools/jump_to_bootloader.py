import hid


VID = 0x342D
PID = 0xE51A
RAW_USAGE_PAGE = 0xFF60
RAW_USAGE = 0x61
VIA_BOOTLOADER_COMMAND = 0x0B
RAW_SIZE = 32


def find_raw_hid_path():
    for device in hid.enumerate(VID, PID):
        if device.get("usage_page") == RAW_USAGE_PAGE and device.get("usage") == RAW_USAGE:
            return device["path"]
    raise RuntimeError("NUT65 Raw HID endpoint was not found")


def main():
    keyboard = hid.device()
    keyboard.open_path(find_raw_hid_path())
    packet = [0x00, VIA_BOOTLOADER_COMMAND] + [0x00] * (RAW_SIZE - 1)
    written = keyboard.write(packet)
    keyboard.close()
    print(f"bootloader jump command written: {written}")


if __name__ == "__main__":
    main()
