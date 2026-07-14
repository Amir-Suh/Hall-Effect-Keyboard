import { describe, expect, it } from 'vitest';
import type { DeviceConfig, DeviceKeyActuation } from '../types/device';
import {
  Cmd,
  HEADER_SIZE,
  KC_TRANS,
  NUM_KEYS,
  NUM_LAYERS,
  PAYLOAD_PER_PACKET,
  REPORT_SIZE,
  Reassembler,
  SIZE_ACTUATION,
  SIZE_CALIB,
  SIZE_KEYMAP,
  SIZE_STATUS,
  buildPackets,
  decodeActuation,
  decodeCalib,
  decodeKeymap,
  decodeStatus,
  encodeActuation,
  encodeFlags,
  encodeKeymap,
  getResponseLength,
  kcToUsage,
  mmToUnits,
  packetCount,
  unitsToMm,
  usageToKc,
} from './protocol';

/** Round-trips a payload through buildPackets -> Reassembler for a GET-style response. */
function roundTripPackets(cmd: Cmd, payload: Uint8Array): Uint8Array {
  // Emulate the device replying with the same payload split into IN reports.
  const packets = buildPackets(cmd, payload);
  const re = new Reassembler(cmd, payload.length);
  let done = false;
  for (const p of packets) done = re.push(p);
  expect(done).toBe(true);
  return re.payload;
}

const FULL_TRAVEL_STEP = 3.5 / 255 + 1e-9;

describe('unit conversion', () => {
  it('maps 0 mm to 0 and full travel to 255', () => {
    expect(mmToUnits(0)).toBe(0);
    expect(mmToUnits(3.5)).toBe(255);
  });

  it('clamps out-of-range mm', () => {
    expect(mmToUnits(-1)).toBe(0);
    expect(mmToUnits(10)).toBe(255);
  });

  it('round-trips within one unit of quantisation', () => {
    for (const mm of [0.1, 0.5, 1.5, 1.75, 2.0, 3.4]) {
      const back = unitsToMm(mmToUnits(mm));
      expect(Math.abs(back - mm)).toBeLessThanOrEqual(FULL_TRAVEL_STEP);
    }
  });
});

describe('keycode mapping', () => {
  it('maps letters to HID usage page 0x07', () => {
    expect(kcToUsage('KC_A')).toBe(0x04);
    expect(kcToUsage('KC_Z')).toBe(0x1d);
    expect(kcToUsage('KC_1')).toBe(0x1e);
    expect(kcToUsage('KC_0')).toBe(0x27);
    expect(kcToUsage('KC_SPACE')).toBe(0x2c);
    expect(kcToUsage('KC_LSHIFT')).toBe(0xe1);
  });

  it('maps layer + unsupported keys sensibly', () => {
    expect(kcToUsage('KC_FN')).toBe(0x5001);
    expect(kcToUsage('TG_1')).toBe(0x5101);
    expect(kcToUsage('KC_MPLY')).toBe(0); // consumer page, unsupported -> KC_NONE
    expect(kcToUsage('NONEXISTENT')).toBe(0);
  });

  it('reverse-maps usages, preferring KC_FN over its alias', () => {
    expect(usageToKc(0x04)).toBe('KC_A');
    expect(usageToKc(0x2c)).toBe('KC_SPACE');
    expect(usageToKc(0x5001)).toBe('KC_FN');
    expect(usageToKc(KC_TRANS)).toBe('KC_NO');
    expect(usageToKc(0)).toBe('KC_NO');
  });

  it('round-trips every basic keycode through usage and back', () => {
    for (const id of ['KC_A', 'KC_5', 'KC_F7', 'KC_ENTER', 'KC_LEFT', 'KC_RALT']) {
      expect(usageToKc(kcToUsage(id))).toBe(id);
    }
  });
});

describe('payload sizes', () => {
  it('matches the firmware struct sizes', () => {
    expect(SIZE_KEYMAP).toBe(NUM_LAYERS * NUM_KEYS * 2);
    expect(SIZE_ACTUATION).toBe(NUM_KEYS * 4);
    expect(SIZE_STATUS).toBe(NUM_KEYS + 8);
    expect(SIZE_CALIB).toBe(NUM_KEYS * 4);
    expect(getResponseLength(Cmd.GetKeymap)).toBe(488);
    expect(getResponseLength(Cmd.GetActuation)).toBe(244);
  });
});

describe('actuation encode/decode', () => {
  it('round-trips a full actuation map', () => {
    const actuation: DeviceKeyActuation[] = Array.from({ length: NUM_KEYS }, (_, i) => ({
      actuationPoint: (i * 3) & 0xff,
      rtDown: i & 0xff,
      rtUp: (255 - i) & 0xff,
      flags: i % 2,
    }));
    const bytes = encodeActuation(actuation);
    expect(bytes.length).toBe(SIZE_ACTUATION);
    const back = decodeActuation(roundTripPackets(Cmd.GetActuation, bytes));
    expect(back).toEqual(actuation);
  });
});

describe('keymap encode/decode', () => {
  it('round-trips a full keymap as little-endian u16', () => {
    const keymap: number[][] = Array.from({ length: NUM_LAYERS }, (_, l) =>
      Array.from({ length: NUM_KEYS }, (_, k) => (l === 0 ? 0x04 + (k % 26) : KC_TRANS)),
    );
    const bytes = encodeKeymap(keymap);
    expect(bytes.length).toBe(SIZE_KEYMAP);
    // Confirm little-endian layout for a known value (0x0004 -> [04,00]).
    expect(bytes[0]).toBe(0x04);
    expect(bytes[1]).toBe(0x00);
    const back = decodeKeymap(roundTripPackets(Cmd.GetKeymap, bytes));
    expect(back).toEqual(keymap);
  });
});

describe('status decode', () => {
  it('decodes distances and the pressed bitmap', () => {
    const bytes = new Uint8Array(SIZE_STATUS);
    for (let i = 0; i < NUM_KEYS; i++) bytes[i] = i & 0xff;
    // press keys 0, 7, 8, 60
    for (const k of [0, 7, 8, 60]) bytes[NUM_KEYS + (k >> 3)] |= 1 << (k & 7);
    const status = decodeStatus(bytes);
    expect(status.distance[5]).toBe(5);
    expect(status.pressed[0]).toBe(true);
    expect(status.pressed[7]).toBe(true);
    expect(status.pressed[8]).toBe(true);
    expect(status.pressed[60]).toBe(true);
    expect(status.pressed[1]).toBe(false);
  });
});

describe('calib decode', () => {
  it('decodes rest then bottom-out as little-endian u16', () => {
    const bytes = new Uint8Array(SIZE_CALIB);
    const dv = new DataView(bytes.buffer);
    for (let i = 0; i < NUM_KEYS; i++) dv.setUint16(i * 2, 1000 + i, true);
    for (let i = 0; i < NUM_KEYS; i++) dv.setUint16(NUM_KEYS * 2 + i * 2, 3000 + i, true);
    const calib = decodeCalib(roundTripPackets(Cmd.GetCalib, bytes));
    expect(calib.rest[0]).toBe(1000);
    expect(calib.rest[60]).toBe(1060);
    expect(calib.bottomOut[0]).toBe(3000);
    expect(calib.bottomOut[60]).toBe(3060);
  });
});

describe('flags encode', () => {
  it('encodes rt/socd booleans', () => {
    expect(Array.from(encodeFlags(true, false))).toEqual([1, 0]);
    expect(Array.from(encodeFlags(false, true))).toEqual([0, 1]);
  });
});

describe('framing', () => {
  it('splits a 488-byte payload into 8 packets, last one padded', () => {
    expect(packetCount(SIZE_KEYMAP)).toBe(8);
    const payload = new Uint8Array(SIZE_KEYMAP).map((_, i) => i & 0xff);
    const packets = buildPackets(Cmd.SetKeymap, payload);
    expect(packets).toHaveLength(8);
    for (const p of packets) expect(p.length).toBe(REPORT_SIZE);
    expect(packets[0][0]).toBe(Cmd.SetKeymap);
    expect(packets[0][1]).toBe(0);
    expect(packets[7][1]).toBe(7);
    // First payload byte of packet 1 continues after 62 bytes.
    expect(packets[1][HEADER_SIZE]).toBe(PAYLOAD_PER_PACKET & 0xff);
  });

  it('builds a single request packet for a payload-less GET', () => {
    const packets = buildPackets(Cmd.GetStatus);
    expect(packets).toHaveLength(1);
    expect(packets[0][0]).toBe(Cmd.GetStatus);
    expect(packets[0][1]).toBe(0);
  });

  it('reassembler ignores stray ACK-sequence packets', () => {
    const payload = new Uint8Array(SIZE_ACTUATION).map((_, i) => i & 0xff);
    const packets = buildPackets(Cmd.GetActuation, payload);
    const re = new Reassembler(Cmd.GetActuation, payload.length);
    const ack = new Uint8Array(REPORT_SIZE);
    ack[0] = Cmd.GetActuation;
    ack[1] = 0xff;
    expect(re.push(ack)).toBe(false); // stray, not counted
    let done = false;
    for (const p of packets) done = re.push(p);
    expect(done).toBe(true);
    expect(Array.from(re.payload)).toEqual(Array.from(payload));
  });
});

/** A tiny end-to-end DeviceConfig round-trip proving the whole-config path. */
describe('whole-config round-trip', () => {
  it('encodes and decodes a DeviceConfig via actuation + keymap payloads', () => {
    const config: DeviceConfig = {
      actuation: Array.from({ length: NUM_KEYS }, (_, i) => ({
        actuationPoint: 128,
        rtDown: i === 0 ? 20 : 0,
        rtUp: 0,
        flags: 0,
      })),
      keymap: Array.from({ length: NUM_LAYERS }, () =>
        Array.from({ length: NUM_KEYS }, () => KC_TRANS),
      ),
      rtEnabled: true,
      socdEnabled: false,
    };
    config.keymap[0][0] = kcToUsage('KC_ESC');

    const act = decodeActuation(encodeActuation(config.actuation));
    const km = decodeKeymap(encodeKeymap(config.keymap));
    expect(act[0].rtDown).toBe(20);
    expect(act[1].rtDown).toBe(0);
    expect(usageToKc(km[0][0])).toBe('KC_ESC');
  });
});
