export interface DeviceInfo {
  id: string;
  name: string;
  /** Physical layout descriptor, e.g. "60%". */
  layout: string;
  /** True for the simulated demo device (no real hardware). */
  isDemo: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/** keyId -> live travel depth in millimetres (0..MAX_TRAVEL). */
export type KeyStateMap = Record<string, number>;

/* -------------------------------------------------------------------------
 * Raw device model — mirrors the writable parts of the firmware `eeconfig_t`.
 * These use the firmware's own units (0..255 distance, HID usage codes) and a
 * single flat layout indexed by firmware key index [0..NUM_KEYS). The mapping
 * to/from the UI's mm + KC_* + profiles/layers model lives in the sync layer;
 * `protocol.ts` serialises these types straight to/from 64-byte HID reports.
 * ------------------------------------------------------------------------- */

/** Per-key actuation config in raw distance units. Mirrors `key_actuation_t`. */
export interface DeviceKeyActuation {
  /** Threshold for a standard press, 0..255 (128 ≈ 1.75 mm). */
  actuationPoint: number;
  /** Rapid-trigger down sensitivity, 0..255. 0 = RT disabled for this key. */
  rtDown: number;
  /** Rapid-trigger up sensitivity, 0..255. 0 = same as rtDown. */
  rtUp: number;
  /** bit0 = continuous mode (must return to rest to reset RT). */
  flags: number;
}

/** The device's full writable configuration (mirrors `eeconfig_t` writable fields). */
export interface DeviceConfig {
  /** Per-key actuation, length NUM_KEYS, firmware key-index order. */
  actuation: DeviceKeyActuation[];
  /** [NUM_LAYERS][NUM_KEYS] HID usage codes (page 0x07); 0xFFFF = transparent. */
  keymap: number[][];
  /** Global rapid-trigger enable. */
  rtEnabled: boolean;
  /** Global SOCD resolution enable. */
  socdEnabled: boolean;
}

/** Live per-key state from GET status (0x05), firmware key-index order. */
export interface DeviceStatus {
  /** Travel depth 0..255 per key. */
  distance: number[];
  /** Actuated state per key. */
  pressed: boolean[];
}

/** Calibration snapshot from GET calib (0x06), firmware key-index order. */
export interface DeviceCalib {
  /** ADC at rest per key (12-bit). */
  rest: number[];
  /** ADC at full press per key (12-bit). */
  bottomOut: number[];
}
