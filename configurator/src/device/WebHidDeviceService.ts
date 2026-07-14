import type { DeviceService } from './DeviceService';
import type { DeviceConfig, DeviceInfo, KeyStateMap } from '../types/device';
import {
  Cmd,
  REPORT_ID,
  Reassembler,
  SEQ_ACK,
  buildPackets,
  decodeActuation,
  decodeKeymap,
  decodeStatus,
  encodeActuation,
  encodeFlags,
  encodeKeymap,
  getResponseLength,
  statusToKeyStateMap,
} from './protocol';

const VENDOR_ID = 0xcafe;
const PRODUCT_ID = 0x6060;
/** Generous enough to cover the ~1–2 s blocking eeconfig_save() on SET/RESET. */
const REQUEST_TIMEOUT_MS = 6000;
const STATUS_POLL_MS = 33; // ~30 Hz live feedback

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isTuna(d: HIDDevice): boolean {
  return d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID;
}

function toInfo(d: HIDDevice): DeviceInfo {
  return {
    id: `${d.vendorId.toString(16)}:${d.productId.toString(16)}`,
    name: d.productName || 'TUNA60 HE',
    layout: '60%',
    isDemo: false,
  };
}

interface Inflight {
  cmd: Cmd;
  kind: 'get' | 'ack';
  reassembler?: Reassembler;
  resolve: (payload: Uint8Array) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Real hardware transport over WebHID (Interface 1 vendor HID, protocol.ts).
 *
 * Commands are serialised through a promise chain so only one request is in
 * flight at a time; incoming reports are matched to it by command byte. GET
 * requests reassemble a multi-packet payload; SET/RESET/RECALIBRATE await a
 * single `[cmd, 0xFF, status]` ACK.
 */
export class WebHidDeviceService implements DeviceService {
  private device: HIDDevice | null = null;
  private inflight: Inflight | null = null;
  private chain: Promise<unknown> = Promise.resolve();
  private subscribers = new Set<(s: KeyStateMap) => void>();
  private polling = false;
  private readonly onReport = (e: HIDInputReportEvent) => this.handleReport(e);

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'hid' in navigator;
  }

  async listDevices(): Promise<DeviceInfo[]> {
    if (!WebHidDeviceService.isSupported()) return [];
    const devices = await navigator.hid.getDevices();
    return devices.filter(isTuna).map(toInfo);
  }

  async connect(): Promise<DeviceInfo> {
    if (!WebHidDeviceService.isSupported()) {
      throw new Error('WebHID is not available in this browser (use Chrome/Edge over https or localhost).');
    }
    // Reuse an already-granted device, else prompt (requires a user gesture).
    let device = (await navigator.hid.getDevices()).find(isTuna) ?? null;
    if (!device) {
      const picked = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID, productId: PRODUCT_ID }],
      });
      device = picked.find(isTuna) ?? picked[0] ?? null;
    }
    if (!device) throw new Error('No TUNA60 HE device selected.');
    if (!device.opened) await device.open();
    device.addEventListener('inputreport', this.onReport);
    this.device = device;
    return toInfo(device);
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    const d = this.device;
    this.device = null;
    this.failInflight(new Error('device disconnected'));
    if (d) {
      d.removeEventListener('inputreport', this.onReport);
      try {
        if (d.opened) await d.close();
      } catch {
        /* already gone */
      }
    }
  }

  async readConfig(): Promise<DeviceConfig> {
    const actuation = decodeActuation(await this.request(Cmd.GetActuation, undefined, 'get'));
    const keymap = decodeKeymap(await this.request(Cmd.GetKeymap, undefined, 'get'));
    // The protocol has no GET-flags command, so the global flags can't be read
    // back. Derive rtEnabled from per-key data; socdEnabled defaults false.
    const rtEnabled = actuation.some((a) => a.rtDown !== 0);
    return { actuation, keymap, rtEnabled, socdEnabled: false };
  }

  async writeConfig(patch: Partial<DeviceConfig>): Promise<void> {
    if (patch.actuation) {
      await this.request(Cmd.SetActuation, encodeActuation(patch.actuation), 'ack');
    }
    if (patch.keymap) {
      await this.request(Cmd.SetKeymap, encodeKeymap(patch.keymap), 'ack');
    }
    if (patch.rtEnabled !== undefined || patch.socdEnabled !== undefined) {
      // No GET-flags command exists, so callers must pass both to avoid clobber.
      await this.request(
        Cmd.SetFlags,
        encodeFlags(patch.rtEnabled ?? false, patch.socdEnabled ?? false),
        'ack',
      );
    }
  }

  async resetConfig(): Promise<void> {
    await this.request(Cmd.Reset, undefined, 'ack');
  }

  async recalibrate(): Promise<void> {
    await this.request(Cmd.Recalibrate, undefined, 'ack');
  }

  subscribeKeyState(cb: (s: KeyStateMap) => void): () => void {
    this.subscribers.add(cb);
    if (this.subscribers.size === 1) this.startPolling();
    return () => {
      this.subscribers.delete(cb);
      if (this.subscribers.size === 0) this.stopPolling();
    };
  }

  /* ---- request/response plumbing ---- */

  /**
   * Serialised send. GET resolves with the reassembled payload; ACK resolves
   * with the `[cmd, 0xFF, status]` report. One request is in flight at a time.
   */
  private request(cmd: Cmd, payload: Uint8Array | undefined, kind: 'get' | 'ack'): Promise<Uint8Array> {
    const run = () =>
      new Promise<Uint8Array>((resolve, reject) => {
        const device = this.device;
        if (!device) {
          reject(new Error('not connected'));
          return;
        }
        const timer = setTimeout(() => {
          if (this.inflight?.cmd === cmd) {
            this.inflight = null;
            reject(new Error(`timeout waiting for 0x${cmd.toString(16)} response`));
          }
        }, REQUEST_TIMEOUT_MS);

        this.inflight = {
          cmd,
          kind,
          reassembler: kind === 'get' ? new Reassembler(cmd, getResponseLength(cmd)) : undefined,
          resolve,
          reject,
          timer,
        };

        (async () => {
          try {
            for (const p of buildPackets(cmd, payload)) {
              await device.sendReport(REPORT_ID, p);
            }
          } catch (e) {
            clearTimeout(timer);
            if (this.inflight?.cmd === cmd) this.inflight = null;
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        })();
      });

    // Chain so requests never overlap; a failure doesn't break the chain.
    const result = this.chain.then(run, run);
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private handleReport(e: HIDInputReportEvent) {
    const inf = this.inflight;
    if (!inf) return;
    const data = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
    if (data[0] !== inf.cmd) return; // not the response we're waiting for

    if (inf.kind === 'ack') {
      if (data[1] === SEQ_ACK) {
        clearTimeout(inf.timer);
        this.inflight = null;
        inf.resolve(data);
      }
      return;
    }

    // GET: accumulate until the payload is complete.
    if (inf.reassembler!.push(data)) {
      clearTimeout(inf.timer);
      this.inflight = null;
      inf.resolve(inf.reassembler!.payload);
    }
  }

  private failInflight(err: Error) {
    const inf = this.inflight;
    if (inf) {
      clearTimeout(inf.timer);
      this.inflight = null;
      inf.reject(err);
    }
  }

  private emit(states: KeyStateMap) {
    this.subscribers.forEach((cb) => cb(states));
  }

  private startPolling() {
    if (this.polling) return;
    this.polling = true;
    void (async () => {
      while (this.polling && this.device) {
        try {
          const payload = await this.request(Cmd.GetStatus, undefined, 'get');
          this.emit(statusToKeyStateMap(decodeStatus(payload)));
        } catch {
          /* transient (e.g. mid-save) — keep polling */
        }
        await delay(STATUS_POLL_MS);
      }
    })();
  }

  private stopPolling() {
    this.polling = false;
  }
}
