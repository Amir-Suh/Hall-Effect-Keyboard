export type KeyId = string;

export type KeycodeCategory =
  | 'Basic Characters'
  | 'Modifiers'
  | 'Navigation'
  | 'Media'
  | 'Function'
  | 'Layer Keys'
  | 'Macros';

export interface Keycode {
  /** Stable identifier, e.g. "KC_A", "KC_SPACE". */
  id: string;
  /** Short glyph shown on a keycap, e.g. "A", "↑", "Space". */
  label: string;
  /** Full human-readable name, e.g. "Left Control". */
  name: string;
  category: KeycodeCategory;
  /** Present-but-unavailable (e.g. Macros placeholder). */
  disabled?: boolean;
}
