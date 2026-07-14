import type { DeviceService } from './DeviceService';
import type { DeviceCalib, DeviceConfig, DeviceInfo, DeviceStatus, KeyStateMap } from '../types/device';
import {
  Cmd,
  NUM_KEYS,
  Reassembler,
  buildPackets,
  decodeActuation,
  decodeKeymap,
  decodeStatus,
  defaultDeviceConfig,
  encodeActuation,
  encodeKeymap,
  encodeStatus,
  mmToUnits,
  statusToKeyStateMap,
  SIZE_ACTUATION,
  SIZE_KEYMAP,
  SIZE_STATUS,
} from './protocol';

const LOOPBACK_DEVICE: DeviceInfo = {
  id: 'tuna60he-loopback',
  name: 'TUNA60 HE (loopback)',
  layout: '60%',
  isDemo: true,
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Firmware-less end-to-end harness. Unlike MockDeviceService (which fakes at the
 * method level), this drives the REAL `protocol.ts` byte path: every read/write
 * is serialised to 64-byte HID packets, "transmitted", and reassembled/decoded
 * exactly as `WebHidDeviceService` + firmware would. It lets you exercise the
 * full wire protocol (framing, reassembly, endianness, unit conversion, the
 * status-poll path) with no hardware — the plan's "testing without a completed
 * physical keyboard" step 1.
 */
export class ProtocolLoopbackDeviceService implements DeviceService {
  /** The simulated on-device persistent config (post-decode ground truth). */
  private device: DeviceConfig = defaultDeviceConfig();
  private calib: DeviceCalib = {
    rest: Array.from({ length: NUM_KEYS }, () => 1800),
    bottomOut: Array.from({ length: NUM_KEYS }, () => 3600),
  };
  private connected = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private subscribers = new Set<(s: KeyStateMap) => void>();
  private active = new Map<number, { start: number; dur: number }>();

  async listDevices(): Promise<DeviceInfo[]> {
    await delay(50);
    return [LOOPBACK_DEVICE];
  }

  async connect(): Promise<DeviceInfo> {
    await delay(100);
    this.connected = true;
    this.startStream();
    return LOOPBACK_DEVICE;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopStream();
    this.emit({});
  }

  /** GET actuation + keymap, round-tripped through the packet path. */
  async readConfig(): Promise<DeviceConfig> {
    await delay(30);
    const actBytes = this.transfer(Cmd.GetActuation, encodeActuation(this.device.actuation), SIZE_ACTUATION);
    const kmBytes = this.transfer(Cmd.GetKeymap, encodeKeymap(this.device.keymap), SIZE_KEYMAP);
    return {
      actuation: decodeActuation(actBytes),
      keymap: decodeKeymap(kmBytes),
      rtEnabled: this.device.rtEnabled,
      socdEnabled: this.device.socdEnabled,
    };
  }

  /** SET each provided field via the packet path, then "save" into device state. */
  async writeConfig(patch: Partial<DeviceConfig>): Promise<void> {
    await delay(30);
    if (patch.actuation) {
      const bytes = this.transfer(Cmd.SetActuation, encodeActuation(patch.actuation), SIZE_ACTUATION);
      this.device.actuation = decodeActuation(bytes);
      await delay(30); // one eeconfig_save() per SET transaction
    }
    if (patch.keymap) {
      const bytes = this.transfer(Cmd.SetKeymap, encodeKeymap(patch.keymap), SIZE_KEYMAP);
      this.device.keymap = decodeKeymap(bytes);
      await delay(30);
    }
    if (patch.rtEnabled !== undefined || patch.socdEnabled !== undefined) {
      if (patch.rtEnabled !== undefined) this.device.rtEnabled = patch.rtEnabled;
      if (patch.socdEnabled !== undefined) this.device.socdEnabled = patch.socdEnabled;
      await delay(30);
    }
  }

  async resetConfig(): Promise<void> {
    await delay(60);
    this.device = defaultDeviceConfig();
  }

  async recalibrate(): Promise<void> {
    await delay(60);
    this.calib = {
      rest: this.calib.rest.map((v) => v + 1),
      bottomOut: this.calib.bottomOut.map((v) => v - 1),
    };
  }

  subscribeKeyState(cb: (s: KeyStateMap) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  /* ---- internals ---- */

  /**
   * Simulates one command's full byte round-trip: host builds OUT packets, the
   * "device" reassembles them, then streams the (unchanged) payload back as IN
   * packets which the host reassembles. Returns the reassembled payload.
   */
  private transfer(cmd: Cmd, payload: Uint8Array, totalLen: number): Uint8Array {
    // Host -> device (also validates SET reassembly on the device side).
    const out = buildPackets(cmd, payload);
    const rxOnDevice = new Reassembler(cmd, totalLen);
    for (const p of out) rxOnDevice.push(p);
    // Device -> host (GET response uses the same framing).
    const inPackets = buildPackets(cmd, rxOnDevice.payload);
    const rxOnHost = new Reassembler(cmd, totalLen);
    for (const p of inPackets) rxOnHost.push(p);
    return rxOnHost.payload;
  }

  private emit(states: KeyStateMap) {
    this.subscribers.forEach((cb) => cb(states));
  }

  private startStream() {
    if (this.timer != null) return;
    this.timer = setInterval(() => {
      if (!this.connected) return;
      const now = Date.now();
      if (Math.random() < 0.2) {
        const idx = Math.floor(Math.random() * NUM_KEYS);
        this.active.set(idx, { start: now, dur: 180 + Math.random() * 300 });
      }
      // Build a firmware-style status snapshot, then run it through the 0x05
      // encode -> packetise -> decode path so the live view exercises real bytes.
      const status: DeviceStatus = {
        distance: new Array(NUM_KEYS).fill(0),
        pressed: new Array(NUM_KEYS).fill(false),
      };
      for (const [idx, p] of this.active) {
        const elapsed = now - p.start;
        if (elapsed > p.dur) {
          this.active.delete(idx);
          continue;
        }
        const mm = Math.sin((elapsed / p.dur) * Math.PI) * 3.5;
        status.distance[idx] = mmToUnits(mm);
        status.pressed[idx] = status.distance[idx] >= this.device.actuation[idx].actuationPoint;
      }
      const bytes = this.transfer(Cmd.GetStatus, encodeStatus(status), SIZE_STATUS);
      this.emit(statusToKeyStateMap(decodeStatus(bytes)));
    }, 33); // ~30 Hz
  }

  private stopStream() {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.active.clear();
  }
}
