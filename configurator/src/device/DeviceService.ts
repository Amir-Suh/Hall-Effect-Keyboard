import type { DeviceConfig, DeviceInfo, KeyStateMap } from '../types/device';

/**
 * The single seam between the UI and the keyboard transport.
 *
 * `MockDeviceService` (demo) and `WebHidDeviceService` (real hardware, vendor
 * HID per protocol.ts) both implement this. `DeviceProvider` selects one; no
 * UI changes are required to swap them.
 *
 * `readConfig`/`writeConfig` exchange the device's raw model (`DeviceConfig`:
 * 0..255 units + HID usages, single flat layout). The UI's mm + KC_* +
 * profiles/layers model is mapped to/from `DeviceConfig` in the sync layer
 * (see useDeviceSync), never here.
 */
export interface DeviceService {
  listDevices(): Promise<DeviceInfo[]>;
  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  /** Read the full device configuration (GET actuation + keymap + flags). */
  readConfig(): Promise<DeviceConfig>;
  /**
   * Write configuration to the device. Only the provided fields are sent; each
   * field maps to one SET transaction (`actuation` → 0x04, `keymap` → 0x02,
   * flags → 0x07), and each triggers a blocking `eeconfig_save()` on-device.
   * Resolves once the device ACKs all writes.
   */
  writeConfig(patch: Partial<DeviceConfig>): Promise<void>;
  /** Restore firmware defaults (0x08 RESET). */
  resetConfig(): Promise<void>;
  /** Re-run boot calibration (0x09 RECALIBRATE). */
  recalibrate(): Promise<void>;
  /** Subscribe to live per-key travel depth. Returns an unsubscribe function. */
  subscribeKeyState(cb: (states: KeyStateMap) => void): () => void;
}
