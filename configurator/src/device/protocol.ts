/**
 * Wire protocol for the TUNA60 HE vendor-HID config interface (Interface 1).
 *
 * Pure, I/O-free encode/decode. The transport (`WebHidDeviceService`) owns the
 * `navigator.hid` calls and packet reassembly; this module defines the byte
 * layouts, unit/keycode conversions, and the firmware key-index order.
 *
 * Contract (see tuna_firmware/Core/Inc/hid_config.h and the plan):
 *   - Interface 1 uses TUD_HID_REPORT_DESC_GENERIC_INOUT(64), so there is NO
 *     USB report ID — WebHID reportId is always 0.
 *   - Every transfer is a fixed 64-byte report:
 *       byte 0     command (Cmd)
 *       byte 1     sequence (0..N-1 for multi-packet; 0xFF = ACK/terminal)
 *       byte 2..63 payload (62 bytes/packet)
 *   - Multi-byte fields are little-endian (STM32F4), matching eeconfig_t memory.
 */

import type {
  DeviceConfig,
  DeviceKeyActuation,
  DeviceStatus,
  DeviceCalib,
  KeyStateMap,
} from '../types/device';
import type { KeyId } from '../types/keymap';
import { ALL_KEY_IDS } from '../data/layout60';

/* ---- firmware constants (must match tuna_firmware/Core/Inc/common.h) ---- */
export const NUM_KEYS = 61;
export const NUM_LAYERS = 4;
export const DISTANCE_MAX = 255;
/** Full travel in mm for 255 distance units (distance.h: "255 = 3.5mm full press"). */
export const FULL_TRAVEL_MM = 3.5;

export const REPORT_SIZE = 64;
export const HEADER_SIZE = 2;
export const PAYLOAD_PER_PACKET = REPORT_SIZE - HEADER_SIZE; // 62
/** WebHID reportId — 0 because the report descriptor declares no report ID. */
export const REPORT_ID = 0;

/** Firmware keycode sentinels (keymap.h). */
export const KC_NONE = 0x0000;
export const KC_TRANS = 0xffff;

export enum Cmd {
  GetKeymap = 0x01,
  SetKeymap = 0x02,
  GetActuation = 0x03,
  SetActuation = 0x04,
  GetStatus = 0x05,
  GetCalib = 0x06,
  SetFlags = 0x07,
  Reset = 0x08,
  Recalibrate = 0x09,
}

/** Sequence byte marking a device→host ACK / terminal response. */
export const SEQ_ACK = 0xff;

/* ---- payload sizes (bytes) ---- */
export const SIZE_KEYMAP = NUM_LAYERS * NUM_KEYS * 2; // 488
export const SIZE_ACTUATION = NUM_KEYS * 4; // 244
export const SIZE_STATUS = NUM_KEYS + Math.ceil(NUM_KEYS / 8); // 61 + 8 = 69
export const SIZE_CALIB = NUM_KEYS * 2 * 2; // 244

/** Number of 64-byte packets a payload of the given size spans. */
export function packetCount(payloadBytes: number): number {
  return Math.max(1, Math.ceil(payloadBytes / PAYLOAD_PER_PACKET));
}

/* -------------------------------------------------------------------------
 * Unit conversion — UI millimetres <-> firmware 0..255 distance units.
 * ------------------------------------------------------------------------- */
export function mmToUnits(mm: number): number {
  const u = Math.round((mm / FULL_TRAVEL_MM) * DISTANCE_MAX);
  return Math.max(0, Math.min(DISTANCE_MAX, u));
}

export function unitsToMm(units: number): number {
  return (Math.max(0, Math.min(DISTANCE_MAX, units)) / DISTANCE_MAX) * FULL_TRAVEL_MM;
}

/* -------------------------------------------------------------------------
 * Keycode mapping — configurator KC_* ids <-> firmware HID usage (page 0x07).
 *
 * Media/macro keycodes have no page-0x07 equivalent and map to KC_NONE.
 * Layer keys use the firmware pseudo-keycodes KC_MO(n)=0x5000|n, KC_TG(n)=0x5100|n.
 * ------------------------------------------------------------------------- */
export const KC_MO = (n: number) => 0x5000 | (n & 0x0f);
export const KC_TG = (n: number) => 0x5100 | (n & 0x0f);

function buildKcToHid(): Record<string, number> {
  const m: Record<string, number> = {};
  // Letters KC_A..KC_Z -> 0x04..0x1D
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => (m[`KC_${c}`] = 0x04 + i));
  // Digits 1..9,0 -> 0x1E..0x27
  '1234567890'.split('').forEach((d, i) => (m[`KC_${d}`] = 0x1e + i));
  // Function F1..F12 -> 0x3A..0x45
  for (let i = 0; i < 12; i++) m[`KC_F${i + 1}`] = 0x3a + i;

  Object.assign(m, {
    // Symbols
    KC_MINUS: 0x2d,
    KC_EQUAL: 0x2e,
    KC_LBRACKET: 0x2f,
    KC_RBRACKET: 0x30,
    KC_BSLASH: 0x31,
    KC_SCOLON: 0x33,
    KC_QUOTE: 0x34,
    KC_GRAVE: 0x35,
    KC_COMMA: 0x36,
    KC_DOT: 0x37,
    KC_SLASH: 0x38,
    // Whitespace / editing
    KC_ENTER: 0x28,
    KC_ESC: 0x29,
    KC_BSPACE: 0x2a,
    KC_TAB: 0x2b,
    KC_SPACE: 0x2c,
    KC_CAPS: 0x39,
    // Navigation
    KC_INS: 0x49,
    KC_HOME: 0x4a,
    KC_PGUP: 0x4b,
    KC_DEL: 0x4c,
    KC_END: 0x4d,
    KC_PGDN: 0x4e,
    KC_RIGHT: 0x4f,
    KC_LEFT: 0x50,
    KC_DOWN: 0x51,
    KC_UP: 0x52,
    KC_MENU: 0x65,
    // Modifiers
    KC_LCTRL: 0xe0,
    KC_LSHIFT: 0xe1,
    KC_LALT: 0xe2,
    KC_LWIN: 0xe3,
    KC_RCTRL: 0xe4,
    KC_RSHIFT: 0xe5,
    KC_RALT: 0xe6,
    // Layer keys — KC_FN is momentary layer 1
    KC_FN: KC_MO(1),
    MO_1: KC_MO(1),
    TG_1: KC_TG(1),
    // No page-0x07 equivalent (consumer page / not supported by firmware keymap):
    TO_0: KC_NONE,
    KC_MPLY: KC_NONE,
    KC_MNXT: KC_NONE,
    KC_MPRV: KC_NONE,
    KC_VOLU: KC_NONE,
    KC_VOLD: KC_NONE,
    KC_MUTE: KC_NONE,
    KC_NO: KC_NONE,
  });
  return m;
}

export const KC_TO_HID: Readonly<Record<string, number>> = buildKcToHid();

/** Reverse map for GET keymap. First insertion wins on collisions (KC_FN over MO_1). */
export const HID_TO_KC: Readonly<Record<number, string>> = (() => {
  const r: Record<number, string> = {};
  const prefer = ['KC_FN']; // ensure these win over aliases mapping to the same usage
  for (const id of prefer) r[KC_TO_HID[id]] = id;
  for (const [id, usage] of Object.entries(KC_TO_HID)) {
    if (usage === KC_NONE) continue; // many ids collapse to 0; keep 0 -> KC_NO below
    if (r[usage] === undefined) r[usage] = id;
  }
  r[KC_NONE] = 'KC_NO';
  return r;
})();

/** Map a configurator keycode id to a firmware HID usage (KC_NONE if unsupported). */
export function kcToUsage(id: string): number {
  return KC_TO_HID[id] ?? KC_NONE;
}

/** Map a firmware HID usage back to a configurator keycode id. */
export function usageToKc(usage: number): string {
  if (usage === KC_TRANS) return 'KC_NO';
  return HID_TO_KC[usage] ?? 'KC_NO';
}

/* -------------------------------------------------------------------------
 * Payload encode / decode. All operate on DataView-backed byte arrays and use
 * little-endian for u16 fields, matching the firmware struct memory layout.
 * ------------------------------------------------------------------------- */

/** actuation_map[NUM_KEYS] of key_actuation_t {u8 actuationPoint, u8 rtDown, u8 rtUp, u8 flags}. */
export function encodeActuation(actuation: DeviceKeyActuation[]): Uint8Array {
  const out = new Uint8Array(SIZE_ACTUATION);
  for (let i = 0; i < NUM_KEYS; i++) {
    const a = actuation[i] ?? { actuationPoint: 0, rtDown: 0, rtUp: 0, flags: 0 };
    const o = i * 4;
    out[o] = a.actuationPoint & 0xff;
    out[o + 1] = a.rtDown & 0xff;
    out[o + 2] = a.rtUp & 0xff;
    out[o + 3] = a.flags & 0xff;
  }
  return out;
}

export function decodeActuation(bytes: Uint8Array): DeviceKeyActuation[] {
  const out: DeviceKeyActuation[] = [];
  for (let i = 0; i < NUM_KEYS; i++) {
    const o = i * 4;
    out.push({
      actuationPoint: bytes[o],
      rtDown: bytes[o + 1],
      rtUp: bytes[o + 2],
      flags: bytes[o + 3],
    });
  }
  return out;
}

/** keymap[NUM_LAYERS][NUM_KEYS] u16 little-endian, layer-major. */
export function encodeKeymap(keymap: number[][]): Uint8Array {
  const out = new Uint8Array(SIZE_KEYMAP);
  const dv = new DataView(out.buffer);
  let o = 0;
  for (let l = 0; l < NUM_LAYERS; l++) {
    for (let k = 0; k < NUM_KEYS; k++) {
      dv.setUint16(o, (keymap[l]?.[k] ?? KC_TRANS) & 0xffff, true);
      o += 2;
    }
  }
  return out;
}

export function decodeKeymap(bytes: Uint8Array): number[][] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: number[][] = [];
  let o = 0;
  for (let l = 0; l < NUM_LAYERS; l++) {
    const layer: number[] = [];
    for (let k = 0; k < NUM_KEYS; k++) {
      layer.push(dv.getUint16(o, true));
      o += 2;
    }
    out.push(layer);
  }
  return out;
}

/** Encode a status snapshot (inverse of decodeStatus — used by the loopback sim/tests). */
export function encodeStatus(status: DeviceStatus): Uint8Array {
  const out = new Uint8Array(SIZE_STATUS);
  for (let i = 0; i < NUM_KEYS; i++) out[i] = status.distance[i] & 0xff;
  for (let i = 0; i < NUM_KEYS; i++) {
    if (status.pressed[i]) out[NUM_KEYS + (i >> 3)] |= 1 << (i & 7);
  }
  return out;
}

/** GET status payload: 61 distance bytes + ceil(61/8)=8-byte is_pressed bitmap. */
export function decodeStatus(bytes: Uint8Array): DeviceStatus {
  const distance: number[] = [];
  const pressed: boolean[] = [];
  for (let i = 0; i < NUM_KEYS; i++) distance.push(bytes[i]);
  const bitmapOffset = NUM_KEYS;
  for (let i = 0; i < NUM_KEYS; i++) {
    pressed.push(((bytes[bitmapOffset + (i >> 3)] >> (i & 7)) & 1) === 1);
  }
  return { distance, pressed };
}

/** Encode a calibration snapshot (inverse of decodeCalib — loopback sim/tests). */
export function encodeCalib(calib: DeviceCalib): Uint8Array {
  const out = new Uint8Array(SIZE_CALIB);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < NUM_KEYS; i++) dv.setUint16(i * 2, calib.rest[i] & 0xffff, true);
  const base = NUM_KEYS * 2;
  for (let i = 0; i < NUM_KEYS; i++) dv.setUint16(base + i * 2, calib.bottomOut[i] & 0xffff, true);
  return out;
}

/** GET calib payload: rest_value[61] u16 then bottom_out_value[61] u16, little-endian. */
export function decodeCalib(bytes: Uint8Array): DeviceCalib {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rest: number[] = [];
  const bottomOut: number[] = [];
  for (let i = 0; i < NUM_KEYS; i++) rest.push(dv.getUint16(i * 2, true));
  const base = NUM_KEYS * 2;
  for (let i = 0; i < NUM_KEYS; i++) bottomOut.push(dv.getUint16(base + i * 2, true));
  return { rest, bottomOut };
}

/** SET flags payload: [rt_enabled, socd_enabled]. */
export function encodeFlags(rtEnabled: boolean, socdEnabled: boolean): Uint8Array {
  return new Uint8Array([rtEnabled ? 1 : 0, socdEnabled ? 1 : 0]);
}

/* -------------------------------------------------------------------------
 * Framing — split a payload into 64-byte HID reports and reassemble them.
 * ------------------------------------------------------------------------- */

/** Build the OUT report(s) for a command. A GET request is a single [cmd, 0]. */
export function buildPackets(cmd: Cmd, payload?: Uint8Array): Uint8Array[] {
  if (!payload || payload.length === 0) {
    const pkt = new Uint8Array(REPORT_SIZE);
    pkt[0] = cmd;
    pkt[1] = 0;
    return [pkt];
  }
  const n = packetCount(payload.length);
  const packets: Uint8Array[] = [];
  for (let seq = 0; seq < n; seq++) {
    const pkt = new Uint8Array(REPORT_SIZE);
    pkt[0] = cmd;
    pkt[1] = seq;
    const start = seq * PAYLOAD_PER_PACKET;
    const chunk = payload.subarray(start, start + PAYLOAD_PER_PACKET);
    pkt.set(chunk, HEADER_SIZE);
    packets.push(pkt);
  }
  return packets;
}

/**
 * Reassembles multi-packet device→host responses of a known total length.
 * Feed each 64-byte IN report via `push`; `complete` flips true once all
 * expected packets have arrived, after which `payload` holds the joined bytes.
 */
export class Reassembler {
  readonly cmd: Cmd;
  private readonly buf: Uint8Array;
  private readonly totalLen: number;
  private readonly expectedPackets: number;
  private seen = 0;

  constructor(cmd: Cmd, totalLen: number) {
    this.cmd = cmd;
    this.totalLen = totalLen;
    this.buf = new Uint8Array(totalLen);
    this.expectedPackets = packetCount(totalLen);
  }

  /** Returns true when this packet was the final expected one. */
  push(report: Uint8Array): boolean {
    const seq = report[1];
    if (seq >= this.expectedPackets) return this.complete; // ignore stray/ACK packets
    const start = seq * PAYLOAD_PER_PACKET;
    const len = Math.min(PAYLOAD_PER_PACKET, this.totalLen - start);
    this.buf.set(report.subarray(HEADER_SIZE, HEADER_SIZE + len), start);
    this.seen++;
    return this.complete;
  }

  get complete(): boolean {
    return this.seen >= this.expectedPackets;
  }

  get payload(): Uint8Array {
    return this.buf;
  }
}

/* -------------------------------------------------------------------------
 * Whole-config helpers (convenience for readConfig/writeConfig round-trips).
 * ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
 * Key-index mapping — firmware index (0..NUM_KEYS-1) -> configurator KeyId.
 *
 * PLACEHOLDER: currently the configurator's row-major order. The real firmware
 * order is defined by the analog.c mux wiring and MUST be verified via the
 * 0x05 GET status bring-up (press keys, observe which index reacts) before
 * trusting per-key writes on hardware. See the plan's Open Items.
 * ------------------------------------------------------------------------- */
export const FW_KEY_ORDER: readonly KeyId[] = ALL_KEY_IDS;

if (FW_KEY_ORDER.length !== NUM_KEYS) {
  // Guard against layout/firmware drift; caught in tests and dev builds.
  throw new Error(`FW_KEY_ORDER has ${FW_KEY_ORDER.length} keys, expected ${NUM_KEYS}`);
}

/** Map a decoded live status to the UI's keyId -> travel-in-mm map. */
export function statusToKeyStateMap(status: DeviceStatus): KeyStateMap {
  const map: KeyStateMap = {};
  for (let i = 0; i < NUM_KEYS; i++) {
    const id = FW_KEY_ORDER[i];
    if (id) map[id] = Math.round(unitsToMm(status.distance[i]) * 100) / 100;
  }
  return map;
}

/** Firmware default actuation threshold (eeconfig.h DEFAULT_ACTUATION_POINT). */
export const DEFAULT_ACTUATION_POINT = 128;

/** A DeviceConfig matching the firmware's post-reset defaults (all keys transparent). */
export function defaultDeviceConfig(): DeviceConfig {
  return {
    actuation: Array.from({ length: NUM_KEYS }, () => ({
      actuationPoint: DEFAULT_ACTUATION_POINT,
      rtDown: 0,
      rtUp: 0,
      flags: 0,
    })),
    keymap: Array.from({ length: NUM_LAYERS }, () =>
      Array.from({ length: NUM_KEYS }, () => KC_TRANS),
    ),
    rtEnabled: false,
    socdEnabled: false,
  };
}

/** Deep clone of a DeviceConfig (structuredClone-free for older runtimes). */
export function cloneDeviceConfig(c: DeviceConfig): DeviceConfig {
  return {
    actuation: c.actuation.map((a) => ({ ...a })),
    keymap: c.keymap.map((layer) => layer.slice()),
    rtEnabled: c.rtEnabled,
    socdEnabled: c.socdEnabled,
  };
}

/** Expected device→host payload length for a GET command, or 0 if none. */
export function getResponseLength(cmd: Cmd): number {
  switch (cmd) {
    case Cmd.GetKeymap:
      return SIZE_KEYMAP;
    case Cmd.GetActuation:
      return SIZE_ACTUATION;
    case Cmd.GetStatus:
      return SIZE_STATUS;
    case Cmd.GetCalib:
      return SIZE_CALIB;
    default:
      return 0;
  }
}
