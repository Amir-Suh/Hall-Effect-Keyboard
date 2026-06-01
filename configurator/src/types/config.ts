/**
 * Hall-effect value ranges (millimetres). See DESIGN.md → Assumptions for sources.
 * Assumes a Lekker-class switch with ~4.0 mm total travel.
 */
export const MAX_TRAVEL = 4.0; // mm

export const ACTUATION = { min: 0.1, max: 4.0, step: 0.1, default: 1.5 } as const;
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
