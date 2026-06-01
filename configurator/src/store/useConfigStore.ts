import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KeyConfig, RapidTriggerConfig } from '../types/config';
import { ACTUATION, clamp, DEFAULT_KEY_CONFIG, RT_SENS } from '../types/config';
import { ALL_KEY_IDS, LAYOUT_60 } from '../data/layout60';
import { defaultKeycodeId } from '../data/keycodes';
import { PRESET_BY_ID } from '../data/presets';

export interface Profile {
  id: string;
  name: string;
}
export interface Layer {
  id: string;
  name: string;
}

type KeyConfigMap = Record<string, KeyConfig>;
type LayerKeymap = Record<string, string>; // keyId -> keycodeId
type ProfileKeymap = Record<string, LayerKeymap>; // layerId -> keymap

function buildDefaultKeymap(): LayerKeymap {
  const m: LayerKeymap = {};
  for (const k of LAYOUT_60) m[k.id] = defaultKeycodeId(k.label, k.code);
  return m;
}

const DEFAULT_KEYMAP = buildDefaultKeymap();

const INITIAL_PROFILE: Profile = { id: 'p1', name: 'Typing Profile' };
const INITIAL_LAYERS: Layer[] = [
  { id: 'main', name: 'Main Layer' },
  { id: 'fn1', name: 'Fn Layer 1' },
];

interface ConfigState {
  profiles: Profile[];
  activeProfileId: string;
  layers: Record<string, Layer[]>; // profileId -> layers
  activeLayerId: string;
  selection: string[]; // selected key ids (transient, not persisted)
  config: Record<string, KeyConfigMap>; // profileId -> keyId -> KeyConfig
  keymap: Record<string, ProfileKeymap>; // profileId -> layerId -> keymap

  // selection
  selectKey: (id: string, additive?: boolean) => void;
  addToSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // analog config
  getKeyConfig: (keyId: string) => KeyConfig;
  setActuationForSelection: (mm: number) => void;
  setRapidTriggerForSelection: (patch: Partial<RapidTriggerConfig>) => void;
  enabledRapidTriggerCount: () => number;

  // profiles
  setActiveProfile: (id: string) => void;
  addProfile: (name: string) => void;
  renameProfile: (id: string, name: string) => void;

  // layers
  setActiveLayer: (id: string) => void;
  addLayer: () => void;
  removeLayer: (id: string) => void;

  // keymap
  getKeycodeId: (keyId: string) => string;
  assignKeycode: (keyId: string, keycodeId: string) => void;
  applyPreset: (presetId: string) => void;
  resetKey: (keyId: string) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      profiles: [INITIAL_PROFILE],
      activeProfileId: 'p1',
      layers: { p1: INITIAL_LAYERS },
      activeLayerId: 'main',
      selection: [],
      config: { p1: {} },
      keymap: { p1: { main: buildDefaultKeymap(), fn1: buildDefaultKeymap() } },

      // ----- selection -----
      selectKey: (id, additive) =>
        set((s) => ({
          selection: additive
            ? s.selection.includes(id)
              ? s.selection.filter((x) => x !== id)
              : [...s.selection, id]
            : [id],
        })),
      addToSelection: (id) =>
        set((s) => (s.selection.includes(id) ? {} : { selection: [...s.selection, id] })),
      setSelection: (ids) => set({ selection: ids }),
      selectAll: () => set({ selection: [...ALL_KEY_IDS] }),
      clearSelection: () => set({ selection: [] }),

      // ----- analog config -----
      getKeyConfig: (keyId) => {
        const s = get();
        return s.config[s.activeProfileId]?.[keyId] ?? DEFAULT_KEY_CONFIG;
      },
      setActuationForSelection: (mm) =>
        set((s) => {
          const value = clamp(mm, ACTUATION.min, ACTUATION.max);
          const pid = s.activeProfileId;
          const cfg = { ...(s.config[pid] ?? {}) };
          for (const id of s.selection) {
            const cur = cfg[id] ?? DEFAULT_KEY_CONFIG;
            cfg[id] = { ...cur, actuationPoint: value };
          }
          return { config: { ...s.config, [pid]: cfg } };
        }),
      setRapidTriggerForSelection: (patch) =>
        set((s) => {
          const clean: Partial<RapidTriggerConfig> = { ...patch };
          if (clean.sensitivity !== undefined)
            clean.sensitivity = clamp(clean.sensitivity, RT_SENS.min, RT_SENS.max);
          if (clean.pressSensitivity !== undefined)
            clean.pressSensitivity = clamp(clean.pressSensitivity, RT_SENS.min, RT_SENS.max);
          if (clean.releaseSensitivity !== undefined)
            clean.releaseSensitivity = clamp(clean.releaseSensitivity, RT_SENS.min, RT_SENS.max);
          const pid = s.activeProfileId;
          const cfg = { ...(s.config[pid] ?? {}) };
          for (const id of s.selection) {
            const cur = cfg[id] ?? DEFAULT_KEY_CONFIG;
            cfg[id] = { ...cur, rapidTrigger: { ...cur.rapidTrigger, ...clean } };
          }
          return { config: { ...s.config, [pid]: cfg } };
        }),
      enabledRapidTriggerCount: () => {
        const s = get();
        const cfg = s.config[s.activeProfileId] ?? {};
        return Object.values(cfg).filter((c) => c.rapidTrigger.enabled).length;
      },

      // ----- profiles -----
      setActiveProfile: (id) => set({ activeProfileId: id, activeLayerId: 'main', selection: [] }),
      addProfile: (name) =>
        set((s) => {
          const id = `p_${Date.now()}`;
          return {
            profiles: [...s.profiles, { id, name }],
            layers: { ...s.layers, [id]: [{ id: 'main', name: 'Main Layer' }] },
            config: { ...s.config, [id]: {} },
            keymap: { ...s.keymap, [id]: { main: buildDefaultKeymap() } },
            activeProfileId: id,
            activeLayerId: 'main',
            selection: [],
          };
        }),
      renameProfile: (id, name) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      // ----- layers -----
      setActiveLayer: (id) => set({ activeLayerId: id }),
      addLayer: () =>
        set((s) => {
          const pid = s.activeProfileId;
          const existing = s.layers[pid] ?? [];
          const fnCount = existing.filter((l) => l.id !== 'main').length;
          const id = `fn_${Date.now()}`;
          return {
            layers: {
              ...s.layers,
              [pid]: [...existing, { id, name: `Fn Layer ${fnCount + 1}` }],
            },
            keymap: {
              ...s.keymap,
              [pid]: { ...s.keymap[pid], [id]: buildDefaultKeymap() },
            },
            activeLayerId: id,
          };
        }),
      removeLayer: (id) =>
        set((s) => {
          if (id === 'main') return {};
          const pid = s.activeProfileId;
          const layers = (s.layers[pid] ?? []).filter((l) => l.id !== id);
          const pk = { ...s.keymap[pid] };
          delete pk[id];
          return {
            layers: { ...s.layers, [pid]: layers },
            keymap: { ...s.keymap, [pid]: pk },
            activeLayerId: s.activeLayerId === id ? 'main' : s.activeLayerId,
          };
        }),

      // ----- keymap -----
      getKeycodeId: (keyId) => {
        const s = get();
        return s.keymap[s.activeProfileId]?.[s.activeLayerId]?.[keyId] ?? DEFAULT_KEYMAP[keyId] ?? 'KC_NO';
      },
      assignKeycode: (keyId, keycodeId) =>
        set((s) => {
          const pid = s.activeProfileId;
          const lid = s.activeLayerId;
          const layer = { ...(s.keymap[pid]?.[lid] ?? {}), [keyId]: keycodeId };
          return { keymap: { ...s.keymap, [pid]: { ...s.keymap[pid], [lid]: layer } } };
        }),
      applyPreset: (presetId) =>
        set((s) => {
          const preset = PRESET_BY_ID[presetId];
          if (!preset) return {};
          const pid = s.activeProfileId;
          const lid = s.activeLayerId;
          return { keymap: { ...s.keymap, [pid]: { ...s.keymap[pid], [lid]: preset.build() } } };
        }),
      resetKey: (keyId) =>
        set((s) => {
          const pid = s.activeProfileId;
          const lid = s.activeLayerId;
          const layer = { ...(s.keymap[pid]?.[lid] ?? {}), [keyId]: DEFAULT_KEYMAP[keyId] ?? 'KC_NO' };
          return { keymap: { ...s.keymap, [pid]: { ...s.keymap[pid], [lid]: layer } } };
        }),
    }),
    {
      name: 'hek-config',
      // selection is transient — never persist it
      partialize: (s) => ({
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        layers: s.layers,
        activeLayerId: s.activeLayerId,
        config: s.config,
        keymap: s.keymap,
      }),
    },
  ),
);
