import type { DeviceInfo, KeyStateMap } from '../types/device';

/**
 * The single seam between the UI and the keyboard transport.
 *
 * `MockDeviceService` implements this today. A real `WebHidDeviceService`
 * or Tauri-native `NativeHidDeviceService` will implement the same interface
 * once firmware exists — no UI changes required (see DESIGN.md → Phase 8).
 *
 * In this UI-first milestone the Zustand stores are the source of truth for
 * configuration, so `read/writeConfig` are intentionally omitted until the
 * firmware protocol is defined (DESIGN.md → Open Questions).
 */
export interface DeviceService {
  listDevices(): Promise<DeviceInfo[]>;
  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  /** Subscribe to live per-key travel depth. Returns an unsubscribe function. */
  subscribeKeyState(cb: (states: KeyStateMap) => void): () => void;
}
