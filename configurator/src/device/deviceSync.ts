/**
 * Maps between the UI's config model (millimetres, KC_* ids, profiles × layers)
 * and the device's flat `DeviceConfig` (0..255 units, HID usages, one active
 * config with NUM_LAYERS layers). Only the ACTIVE profile syncs to hardware —
 * profiles are a host-side concept (see the plan's "firmware decisions win").
 */
import type { DeviceConfig, DeviceKeyActuation } from '../types/device';
import type { KeyConfig, RapidTriggerConfig } from '../types/config';
import { ACTUATION, DEFAULT_KEY_CONFIG, RT_SENS, clamp } from '../types/config';
import { useConfigStore } from '../store/useConfigStore';
import {
  FW_KEY_ORDER,
  KC_TRANS,
  NUM_LAYERS,
  kcToUsage,
  mmToUnits,
  unitsToMm,
  usageToKc,
} from './protocol';

const round2 = (v: number) => Math.round(v * 100) / 100;
/** Rapid trigger is "on" for a key only when rtDown != 0, so clamp enabled keys to >=1 unit. */
const atLeastOne = (u: number) => Math.max(1, u);

function rapidTriggerToDevice(rt: RapidTriggerConfig): Pick<DeviceKeyActuation, 'rtDown' | 'rtUp' | 'flags'> {
  if (!rt.enabled) return { rtDown: 0, rtUp: 0, flags: 0 };
  const rtDown = atLeastOne(mmToUnits(rt.split ? rt.pressSensitivity : rt.sensitivity));
  const rtUp = rt.split ? atLeastOne(mmToUnits(rt.releaseSensitivity)) : rtDown;
  return { rtDown, rtUp, flags: rt.continuous ? 0x01 : 0x00 };
}

function deviceToKeyConfig(a: DeviceKeyActuation): KeyConfig {
  const enabled = a.rtDown !== 0;
  const split = enabled && a.rtUp !== 0 && a.rtUp !== a.rtDown;
  const down = clamp(round2(unitsToMm(a.rtDown)), RT_SENS.min, RT_SENS.max);
  const up = clamp(round2(unitsToMm(a.rtUp)), RT_SENS.min, RT_SENS.max);
  const rapidTrigger: RapidTriggerConfig = {
    enabled,
    sensitivity: enabled ? down : RT_SENS.default,
    continuous: (a.flags & 0x01) !== 0,
    split,
    pressSensitivity: enabled ? down : RT_SENS.default,
    releaseSensitivity: split ? up : RT_SENS.default,
  };
  return {
    actuationPoint: clamp(round2(unitsToMm(a.actuationPoint)), ACTUATION.min, ACTUATION.max),
    rapidTrigger,
  };
}

/** Build a DeviceConfig from the active profile's store state. */
export function storeToDeviceConfig(): DeviceConfig {
  const s = useConfigStore.getState();
  const pid = s.activeProfileId;
  const keyCfgMap = s.config[pid] ?? {};

  const actuation: DeviceKeyActuation[] = FW_KEY_ORDER.map((keyId) => {
    const cfg = keyCfgMap[keyId] ?? DEFAULT_KEY_CONFIG;
    return { actuationPoint: mmToUnits(cfg.actuationPoint), ...rapidTriggerToDevice(cfg.rapidTrigger) };
  });

  const layers = s.layers[pid] ?? [];
  const keymap: number[][] = [];
  for (let l = 0; l < NUM_LAYERS; l++) {
    const layer = layers[l];
    if (!layer) {
      keymap.push(FW_KEY_ORDER.map(() => KC_TRANS)); // absent layer → transparent
      continue;
    }
    const lm = s.keymap[pid]?.[layer.id] ?? {};
    keymap.push(FW_KEY_ORDER.map((keyId) => kcToUsage(lm[keyId] ?? 'KC_NO')));
  }

  const rtEnabled = actuation.some((a) => a.rtDown !== 0);
  // SOCD has no UI surface yet; keep it off (see plan Open Items).
  return { actuation, keymap, rtEnabled, socdEnabled: false };
}

/** Overwrite the active profile's store state from a device config (device authoritative). */
export function applyDeviceConfigToStore(config: DeviceConfig): void {
  const s = useConfigStore.getState();
  const pid = s.activeProfileId;

  const keyCfg: Record<string, KeyConfig> = {};
  FW_KEY_ORDER.forEach((keyId, i) => {
    if (config.actuation[i]) keyCfg[keyId] = deviceToKeyConfig(config.actuation[i]);
  });

  const layers = s.layers[pid] ?? [];
  const profileKeymap: Record<string, Record<string, string>> = { ...(s.keymap[pid] ?? {}) };
  layers.forEach((layer, l) => {
    if (l >= NUM_LAYERS) return;
    const lm: Record<string, string> = {};
    FW_KEY_ORDER.forEach((keyId, i) => {
      lm[keyId] = usageToKc(config.keymap[l]?.[i] ?? KC_TRANS);
    });
    profileKeymap[layer.id] = lm;
  });

  useConfigStore.setState({
    config: { ...s.config, [pid]: keyCfg },
    keymap: { ...s.keymap, [pid]: profileKeymap },
  });
}

/* ---- change detection (avoid rewriting unchanged sections / flash wear) ---- */

export function sameActuation(a: DeviceKeyActuation[], b: DeviceKeyActuation[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => {
    const y = b[i];
    return x.actuationPoint === y.actuationPoint && x.rtDown === y.rtDown && x.rtUp === y.rtUp && x.flags === y.flags;
  });
}

export function sameKeymap(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((layer, l) => layer.length === b[l].length && layer.every((v, i) => v === b[l][i]));
}

/** Compute the minimal writeConfig patch between two device configs. */
export function diffDeviceConfig(prev: DeviceConfig | null, next: DeviceConfig): Partial<DeviceConfig> {
  const patch: Partial<DeviceConfig> = {};
  if (!prev || !sameActuation(prev.actuation, next.actuation)) patch.actuation = next.actuation;
  if (!prev || !sameKeymap(prev.keymap, next.keymap)) patch.keymap = next.keymap;
  if (!prev || prev.rtEnabled !== next.rtEnabled || prev.socdEnabled !== next.socdEnabled) {
    patch.rtEnabled = next.rtEnabled;
    patch.socdEnabled = next.socdEnabled;
  }
  return patch;
}
