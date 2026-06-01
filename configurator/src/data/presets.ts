import { LAYOUT_60 } from './layout60';
import { defaultKeycodeId } from './keycodes';

export interface RemapPreset {
  id: string;
  name: string;
  description: string;
  /** Returns a full keyId -> keycodeId map for the active layer. */
  build: () => Record<string, string>;
}

function baseKeymap(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const k of LAYOUT_60) m[k.id] = defaultKeycodeId(k.label, k.code);
  return m;
}

function keyIdByLabel(label: string): string | undefined {
  return LAYOUT_60.find((k) => k.label === label)?.id;
}

/** Start from the default QWERTY map and apply { legend: keycodeId } overrides. */
function withOverrides(overrides: Record<string, string>): Record<string, string> {
  const m = baseKeymap();
  for (const [label, kcId] of Object.entries(overrides)) {
    const id = keyIdByLabel(label);
    if (id) m[id] = kcId;
  }
  return m;
}

export const PRESETS: RemapPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'QWERTY — restore every key to its standard output.',
    build: baseKeymap,
  },
  {
    id: 'wasd-arrows',
    name: 'WASD → Arrows',
    description: 'Map W, A, S, D to the arrow keys.',
    build: () =>
      withOverrides({ W: 'KC_UP', A: 'KC_LEFT', S: 'KC_DOWN', D: 'KC_RIGHT' }),
  },
  {
    id: 'azerty',
    name: 'AZERTY',
    description: 'Approximate AZERTY letter positions (Q↔A, W↔Z).',
    build: () => withOverrides({ Q: 'KC_A', W: 'KC_Z', A: 'KC_Q', Z: 'KC_W' }),
  },
  {
    id: 'colemak',
    name: 'Colemak',
    description: 'Colemak ergonomic letter layout.',
    build: () =>
      withOverrides({
        E: 'KC_F',
        R: 'KC_P',
        T: 'KC_G',
        Y: 'KC_J',
        U: 'KC_L',
        I: 'KC_U',
        O: 'KC_Y',
        P: 'KC_SCOLON',
        S: 'KC_R',
        D: 'KC_S',
        F: 'KC_T',
        G: 'KC_D',
        J: 'KC_N',
        K: 'KC_E',
        L: 'KC_I',
        ';': 'KC_O',
        N: 'KC_K',
      }),
  },
];

export const PRESET_BY_ID: Record<string, RemapPreset> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
);
