import type { DeviceService } from './DeviceService';
import type { DeviceConfig, DeviceInfo, KeyStateMap } from '../types/device';
import { ALL_KEY_IDS } from '../data/layout60';
import { MAX_TRAVEL } from '../types/config';
import { cloneDeviceConfig, defaultDeviceConfig } from './protocol';

const DEMO_DEVICE: DeviceInfo = {
  id: 'wooting-60he-demo',
  name: 'Wooting 60HE',
  layout: '60%',
  isDemo: true,
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * In-memory fake keyboard. Simulates connection latency and emits a stream of
 * random analog key presses so the live "Visual Feedback" UI works with no
 * hardware attached.
 */
export class MockDeviceService implements DeviceService {
  private rafId: number | null = null;
  private subscribers = new Set<(s: KeyStateMap) => void>();
  private active = new Map<string, { start: number; dur: number }>();
  private connected = false;
  /** In-memory stand-in for the device's persistent config. */
  private config: DeviceConfig = defaultDeviceConfig();

  async listDevices(): Promise<DeviceInfo[]> {
    await delay(250);
    return [DEMO_DEVICE];
  }

  async connect(_deviceId: string): Promise<DeviceInfo> {
    await delay(600); // simulated connection latency
    this.connected = true;
    this.startStream();
    return DEMO_DEVICE;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopStream();
    this.emit({});
  }

  async readConfig(): Promise<DeviceConfig> {
    await delay(120);
    return cloneDeviceConfig(this.config);
  }

  async writeConfig(patch: Partial<DeviceConfig>): Promise<void> {
    await delay(200); // simulate the eeconfig_save() stall
    if (patch.actuation) this.config.actuation = patch.actuation.map((a) => ({ ...a }));
    if (patch.keymap) this.config.keymap = patch.keymap.map((l) => l.slice());
    if (patch.rtEnabled !== undefined) this.config.rtEnabled = patch.rtEnabled;
    if (patch.socdEnabled !== undefined) this.config.socdEnabled = patch.socdEnabled;
  }

  async resetConfig(): Promise<void> {
    await delay(200);
    this.config = defaultDeviceConfig();
  }

  async recalibrate(): Promise<void> {
    await delay(200);
  }

  subscribeKeyState(cb: (s: KeyStateMap) => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private emit(states: KeyStateMap) {
    this.subscribers.forEach((cb) => cb(states));
  }

  private startStream() {
    if (this.rafId != null || typeof requestAnimationFrame === 'undefined') return;
    const tick = () => {
      if (!this.connected) return;
      const now = performance.now();
      // Occasionally begin a new simulated keypress.
      if (Math.random() < 0.14) {
        const id = ALL_KEY_IDS[Math.floor(Math.random() * ALL_KEY_IDS.length)];
        this.active.set(id, { start: now, dur: 180 + Math.random() * 320 });
      }
      const states: KeyStateMap = {};
      for (const [id, p] of this.active) {
        const elapsed = now - p.start;
        if (elapsed > p.dur) {
          this.active.delete(id);
          continue;
        }
        // Press-and-release travel curve (0 → MAX → 0) as a sine arc.
        const depth = Math.sin((elapsed / p.dur) * Math.PI) * MAX_TRAVEL;
        states[id] = Math.round(depth * 100) / 100;
      }
      this.emit(states);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopStream() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.active.clear();
  }
}
