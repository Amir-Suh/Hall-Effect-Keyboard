import { create } from 'zustand';
import type { ConnectionStatus, DeviceInfo, KeyStateMap } from '../types/device';

interface ConnectionState {
  status: ConnectionStatus;
  /** App boots in demo mode (no real hardware required). */
  isDemo: boolean;
  device: DeviceInfo | null;
  /** Live per-key travel depth from the device stream. */
  keyStates: KeyStateMap;
  /** True while a writeConfig/eeconfig_save round-trip is in flight. */
  saving: boolean;
  setStatus: (s: ConnectionStatus) => void;
  setDevice: (d: DeviceInfo | null) => void;
  setDemo: (v: boolean) => void;
  setKeyStates: (k: KeyStateMap) => void;
  setSaving: (v: boolean) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  isDemo: true,
  device: null,
  keyStates: {},
  saving: false,
  setStatus: (status) => set({ status }),
  setDevice: (device) => set({ device }),
  setDemo: (isDemo) => set({ isDemo }),
  setKeyStates: (keyStates) => set({ keyStates }),
  setSaving: (saving) => set({ saving }),
  reset: () => set({ status: 'disconnected', device: null, keyStates: {}, saving: false }),
}));
