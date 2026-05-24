import hid


VID = 0x342D
PID = 0xE51A
RAW_USAGE_PAGE = 0xFF60
RAW_USAGE = 0x61
RAW_SIZE = 32


COMMANDS = {
    "protocol": 0x22,
    "unique": 0x23,
    "total_leds": 0x27,
    "firmware_type": 0x28,
    "enable": 0x25,
    "disable": 0x26,
}


def find_raw_hid_path():
    for device in hid.enumerate(VID, PID):
        if device.get("usage_page") == RAW_USAGE_PAGE and device.get("usage") == RAW_USAGE:
            return device["path"]
    raise RuntimeError("NUT65 Raw HID endpoint was not found")


def send_command(keyboard, command):
    packet = [0x00, command] + [0x00] * (RAW_SIZE - 1)
    keyboard.write(packet)
    return keyboard.read(RAW_SIZE, 500)


def main():
    keyboard = hid.device()
    keyboard.open_path(find_raw_hid_path())
    keyboard.set_nonblocking(False)

    for name, command in COMMANDS.items():
        response = send_command(keyboard, command)
        if not response:
            print(f"{name}: no response")
            continue
        print(f"{name}: {list(response[:8])}")

    keyboard.close()


if __name__ == "__main__":
    main()
