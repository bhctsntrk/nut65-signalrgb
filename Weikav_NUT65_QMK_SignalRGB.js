export function Name() { return "Weikav NUT65 QMK SignalRGB"; }
export function VendorId() { return 0x342D; }
export function ProductId() { return 0xE51A; }
export function Publisher() { return "Community"; }
export function Type() { return "Hid"; }
export function DeviceType() { return "keyboard"; }
export function Size() { return [15, 7]; }
export function DefaultPosition() { return [10, 100]; }
export function DefaultScale() { return Math.floor(85 / Size()[1]); }
export function ConflictingProcesses() { return ["via", "vial"]; }

/* global
shutdownMode:readonly
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/

export function ControllableParameters() {
	return [
		{"property":"shutdownMode", "group":"lighting", "label":"Shutdown Mode", "description":"What the keyboard does when SignalRGB stops", "type":"combobox", "values":["Hardware Mode", "Shutdown Color"], "default":"Hardware Mode"},
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "description":"Color used when Shutdown Color is selected", "min":"0", "max":"360", "type":"color", "default":"#000000"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "description":"Canvas uses the active effect, Forced uses one color", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "description":"Color used when Forced mode is enabled", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const RAW_SIZE = 32;
const REPORT_SIZE = RAW_SIZE + 1;
const LEDS_PER_PACKET = 9;
const MIN_RENDER_INTERVAL_MS = 33;

const GET_QMK_VERSION = 0x21;
const GET_PROTOCOL_VERSION = 0x22;
const GET_UNIQUE_IDENTIFIER = 0x23;
const STREAM_RGB_DATA = 0x24;
const SET_SIGNALRGB_MODE_ENABLE = 0x25;
const SET_SIGNALRGB_MODE_DISABLE = 0x26;
const GET_TOTAL_LEDS = 0x27;
const GET_FIRMWARE_TYPE = 0x28;

const vKeyNames = [
	"Esc","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Delete",
	"Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Page Up",
	"CapsLock","A","S","D","F","G","H","J","K","L",";","'","Enter","Page Down",
	"Left Shift","Z","X","C","V","B","N","M",",",".","/","Right Shift","Up","End",
	"Left Ctrl","Left Win","Left Alt","Space","Right Alt","Fn","Left Arrow","Down Arrow","Right Arrow",
	"Light Bar 1","Light Bar 2","Light Bar 3","Light Bar 4","Light Bar 5",
	"Light Bar 6","Light Bar 7","Light Bar 8","Light Bar 9","Light Bar 10",
	"Light Bar 11","Light Bar 12","Light Bar 13","Light Bar 14","Light Bar 15",
];

const vKeyPositions = [
	[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],
	[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],
	[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[13,2],[14,2],
	[0,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],
	[0,4],[1,4],[2,4],[5,4],[10,4],[11,4],[12,4],[13,4],[14,4],
	[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
];

export function LedNames() { return vKeyNames; }
export function LedPositions() { return vKeyPositions; }

const LED_COUNT = vKeyNames.length;
const CHUNK_COUNT = Math.ceil(LED_COUNT / LEDS_PER_PACKET);
const packet = new Array(REPORT_SIZE).fill(0);
const frameRgb = new Uint8Array(LED_COUNT * 3);
let activeLedCount = LED_COUNT;
let lastRenderMs = 0;
let forceNextFrame = true;
let lastChunkKeys = new Array(CHUNK_COUNT).fill("");

export function Initialize() {
	activeLedCount = LED_COUNT;
	lastRenderMs = 0;
	forceNextFrame = true;
	lastChunkKeys.fill("");

	requestCommand(GET_FIRMWARE_TYPE);
	requestCommand(GET_QMK_VERSION);
	requestCommand(GET_PROTOCOL_VERSION);
	requestCommand(GET_UNIQUE_IDENTIFIER);
	readTotalLeds();
	writeCommand(SET_SIGNALRGB_MODE_ENABLE);
	device.pause(30);
}

export function Render() {
	const nowMs = Date.now();
	if (!forceNextFrame && nowMs - lastRenderMs < MIN_RENDER_INTERVAL_MS) {
		return;
	}

	lastRenderMs = nowMs;
	captureFrame();
	sendFrame(forceNextFrame);
	forceNextFrame = false;
}

export function Shutdown(SystemSuspending) {
	if (shutdownMode === "Shutdown Color" && !SystemSuspending) {
		const rgb = hexToRgb(shutdownColor);
		fillFrame(rgb[0], rgb[1], rgb[2]);
		sendFrame(true);
		return;
	}

	writeCommand(SET_SIGNALRGB_MODE_DISABLE);
}

export function Validate(endpoint) {
	const iface = endpoint.interface !== undefined ? endpoint.interface : endpoint.interface_number;
	return (iface === undefined || iface === 1) && endpoint.usage === 0x61 && endpoint.usage_page === 0xFF60;
}

function captureFrame() {
	const forcedRgb = LightingMode === "Forced" ? hexToRgb(forcedColor) : null;

	for (let i = 0; i < activeLedCount; i++) {
		const pos = vKeyPositions[i];
		const color = forcedRgb || device.color(pos[0], pos[1]);
		const base = i * 3;
		frameRgb[base] = byte(color[0]);
		frameRgb[base + 1] = byte(color[1]);
		frameRgb[base + 2] = byte(color[2]);
	}
}

function fillFrame(red, green, blue) {
	for (let i = 0; i < activeLedCount; i++) {
		const base = i * 3;
		frameRgb[base] = byte(red);
		frameRgb[base + 1] = byte(green);
		frameRgb[base + 2] = byte(blue);
	}
}

function sendFrame(force) {
	let writes = 0;

	for (let start = 0; start < activeLedCount; start += LEDS_PER_PACKET) {
		const count = Math.min(LEDS_PER_PACKET, activeLedCount - start);
		const chunkIndex = start / LEDS_PER_PACKET;
		const key = chunkKey(start, count);

		if (!force && key === lastChunkKeys[chunkIndex]) {
			continue;
		}

		sendColorChunk(start, count);
		lastChunkKeys[chunkIndex] = key;
		writes++;

		if (writes % 4 === 0) {
			device.pause(1);
		}
	}
}

function sendColorChunk(start, count) {
	resetPacket(STREAM_RGB_DATA);
	packet[2] = start;
	packet[3] = count;

	let offset = 4;
	for (let i = 0; i < count; i++) {
		const base = (start + i) * 3;
		packet[offset++] = frameRgb[base];
		packet[offset++] = frameRgb[base + 1];
		packet[offset++] = frameRgb[base + 2];
	}

	device.write(packet, REPORT_SIZE);
}

function requestCommand(command) {
	writeCommand(command);
	device.pause(15);
	readResponse(command);
}

function readTotalLeds() {
	writeCommand(GET_TOTAL_LEDS);
	device.pause(15);
	const response = readResponse(GET_TOTAL_LEDS);
	if (!response) {
		return;
	}

	const reportedCount = Number(response[1]);
	if (reportedCount > 0 && reportedCount <= LED_COUNT) {
		activeLedCount = reportedCount;
	}
}

function readResponse(expectedCommand) {
	for (let i = 0; i < 3; i++) {
		const response = device.read([0x00], RAW_SIZE, 10);
		if (!response || response.length === 0) {
			continue;
		}

		if (response[0] === expectedCommand) {
			return response;
		}

		if (response[1] === expectedCommand) {
			return response.slice(1);
		}
	}

	return undefined;
}

function writeCommand(command) {
	resetPacket(command);
	device.write(packet, REPORT_SIZE);
}

function resetPacket(command) {
	for (let i = 0; i < REPORT_SIZE; i++) {
		packet[i] = 0;
	}

	packet[1] = command;
}

function chunkKey(start, count) {
	let key = "";
	for (let i = 0; i < count; i++) {
		const base = (start + i) * 3;
		key += String.fromCharCode(frameRgb[base], frameRgb[base + 1], frameRgb[base + 2]);
	}

	return key;
}

function byte(value) {
	const numeric = Number(value) || 0;
	return Math.max(0, Math.min(255, Math.round(numeric)));
}

function hexToRgb(hex) {
	const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
	if (!match) {
		return [0, 0, 0];
	}

	return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}
