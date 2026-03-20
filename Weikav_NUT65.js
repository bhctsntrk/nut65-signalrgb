export function Name() { return "Weikav NUT65"; }
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
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/

export function ControllableParameters() {
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "description":"Color applied when SignalRGB shuts down", "min":"0", "max":"360", "type":"color", "default":"#000000"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "description":"Canvas pulls from active effect, Forced overrides to a specific color", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "description":"Color used when Forced mode is enabled", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

// ── Constants ───────────────────────────────────────────────────────────────
const RS = 65;              // Report size: 1 report ID + 64 data
const CMD_SET = 0x07;
const MODE_DIRECT = 45;     // "Close All" = Direct Control mode
const WRITES_PER_FRAME = 10; // Budget per frame (lower = less input lag)
const PAUSE_EVERY = 5;       // Micro-pause every N writes (firmware breathing room)

// ── LED Mapping (82 LEDs) ───────────────────────────────────────────────────

const vKeyNames = [
	// Row 0 (15 keys)
	"Esc","1","2","3","4","5","6","7","8","9","0","-","=","Backspace","Delete",
	// Row 1 (15 keys)
	"Tab","Q","W","E","R","T","Y","U","I","O","P","[","]","\\","Page Up",
	// Row 2 (14 keys — col 12 missing)
	"CapsLock","A","S","D","F","G","H","J","K","L",";","'","Enter","Page Down",
	// Row 3 (14 keys — col 1 missing)
	"Left Shift","Z","X","C","V","B","N","M",",",".","/","Right Shift","Up","End",
	// Row 4 (9 keys)
	"Left Ctrl","Left Win","Left Alt","Space","Right Alt","Fn","Left Arrow","Down Arrow","Right Arrow",
	// Light Bar (15 segments)
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

const vKeyMatrix = [
	[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],
	[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[1,9],[1,10],[1,11],[1,12],[1,13],[1,14],
	[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],[2,13],[2,14],
	[3,0],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],[3,13],[3,14],
	[4,0],[4,1],[4,2],[4,5],[4,10],[4,11],[4,12],[4,13],[4,14],
	[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],
];

export function LedNames() { return vKeyNames; }
export function LedPositions() { return vKeyPositions; }

// ── State ───────────────────────────────────────────────────────────────────
const LED_COUNT = vKeyNames.length;
let lastH = new Array(LED_COUNT).fill(-100);
let lastS = new Array(LED_COUNT).fill(-100);
let cursor = 0;

// ── Lifecycle ───────────────────────────────────────────────────────────────

export function Initialize() {
	// Set mode to Direct Control (45 = "Close All")
	sendCmd([0x03, 0x02, MODE_DIRECT]);
	device.pause(30);
	// Set brightness to max
	sendCmd([0x03, 0x01, 0xFF]);
	device.pause(30);
	// Set speed to 0
	sendCmd([0x03, 0x03, 0x00]);
	device.pause(30);
	// Set lightstrip to static mode (Ch0 Cmd1 = 1)
	sendCmd([0x00, 0x01, 0x01]);
	device.pause(30);
	// Force full refresh
	lastH.fill(-100);
	lastS.fill(-100);
}

export function Render() {
	let writes = 0;

	for (let count = 0; count < LED_COUNT; count++) {
		if (writes >= WRITES_PER_FRAME) break;

		const i = (cursor + count) % LED_COUNT;
		const pos = vKeyPositions[i];
		const mat = vKeyMatrix[i];

		let color;
		if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.color(pos[0], pos[1]);
		}

		// Convert RGB to HSV
		let h, s;
		const brightness = Math.max(color[0], color[1], color[2]);

		if (brightness < 15) {
			// Very dark: send low saturation (appears dim/off in direct mode)
			h = 0;
			s = 0;
		} else {
			const hsv = rgbToHsv(color[0], color[1], color[2]);
			h = hsv[0];
			s = hsv[1];
		}

		// Delta check with hysteresis
		if (Math.abs(h - lastH[i]) <= 3 && Math.abs(s - lastS[i]) <= 3) continue;

		lastH[i] = h;
		lastS[i] = s;
		sendPerKeyColor(mat[0], mat[1], h, s);
		// Micro-pause: let firmware process keyboard scans between bursts
		if (writes % PAUSE_EVERY === 0) device.pause(1);
		writes++;
	}

	// Advance cursor
	cursor = (cursor + Math.max(writes, 1)) % LED_COUNT;

	// Apply once per frame (flush all per-key colors to display)
	if (writes > 0) {
		applyColors();
	}
}

export function Shutdown(SystemSuspending) {
	// Restore to Solid Color mode (1)
	sendCmd([0x03, 0x02, 0x01]);
}

// ── Protocol ────────────────────────────────────────────────────────────────

function sendCmd(args) {
	const packet = new Array(RS).fill(0);
	packet[0] = 0x00;
	packet[1] = CMD_SET;
	for (let i = 0; i < args.length; i++) packet[2 + i] = args[i];
	device.write(packet, RS);
}

function sendPerKeyColor(row, col, hue, sat) {
	if (row < 0 || row > 5 || col < 0 || col > 14) return;
	const packet = new Array(RS).fill(0);
	packet[0] = 0x00;
	packet[1] = CMD_SET;
	packet[2] = 0x00; // Channel 0 (per-key)
	packet[3] = 0x03; // Per-key color command
	packet[4] = 0x00; // Sub-channel
	packet[5] = row;
	packet[6] = col;
	packet[7] = sat;  // Saturation first
	packet[8] = hue;  // Hue second
	device.write(packet, RS);
}

function applyColors() {
	const packet = new Array(RS).fill(0);
	packet[0] = 0x00;
	packet[1] = CMD_SET;
	packet[2] = 0x00; // Channel 0
	packet[3] = 0x02; // Apply/flush per-key colors
	packet[4] = 0x00;
	device.write(packet, RS);
}

// ── Utilities ───────────────────────────────────────────────────────────────

function rgbToHsv(r, g, b) {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d !== 0) {
		if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h /= 6;
	}
	const s = max === 0 ? 0 : d / max;
	return [Math.round(h * 255), Math.round(s * 255)];
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

export function Validate(endpoint) {
	return endpoint.usage === 0x61 && endpoint.usage_page === 0xFF60;
}
