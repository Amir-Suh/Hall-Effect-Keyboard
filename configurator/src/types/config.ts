/**
 * Hall-effect value ranges (millimetres). See DESIGN.md → Assumptions for sources.
 * The firmware maps distance 0..255 to 3.5 mm of travel (distance.h), so the UI
 * uses the same full-travel figure to keep mm↔unit conversion exact.
 */
export const MAX_TRAVEL = 3.5; // mm — matches firmware 255-unit full press

export const ACTUATION = { min: 0.1, max: 3.5, step: 0.1, default: 1.5 } as const;
export const RT_SENS = { min: 0.1, max: 2.0, step: 0.05, default: 0.5 } as const;

export interface RapidTriggerConfig {
  enabled: boolean;
  /** Single-mode sensitivity (mm of travel to re-trigger/reset). */
  sensitivity: number;
  /** End RT when the key is fully released (true) vs at the actuation point (false). */
  continuous: boolean;
  /** Use independent press/release sensitivities. */
  split: boolean;
  pressSensitivity: number; // mm (split mode)
  releaseSensitivity: number; // mm (split mode)
}

export interface KeyConfig {
  actuationPoint: number; // mm
  rapidTrigger: RapidTriggerConfig;
}

export const DEFAULT_RAPID_TRIGGER: RapidTriggerConfig = {
  enabled: false,
  sensitivity: RT_SENS.default,
  continuous: false,
  split: false,
  pressSensitivity: RT_SENS.default,
  releaseSensitivity: RT_SENS.default,
};

export const DEFAULT_KEY_CONFIG: KeyConfig = {
  actuationPoint: ACTUATION.default,
  rapidTrigger: DEFAULT_RAPID_TRIGGER,
};

export function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}
