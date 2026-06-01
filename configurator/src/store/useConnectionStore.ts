import { create } from 'zustand';
import type { ConnectionStatus, DeviceInfo, KeyStateMap } from '../types/device';

interface ConnectionState {
  status: ConnectionStatus;
  /** App boots in demo mode (no real hardware required). */
  isDemo: boolean;
  device: DeviceInfo | null;
  /** Live per-key travel depth from the (mock) device stream. */
  keyStates: KeyStateMap;
  setStatus: (s: ConnectionStatus) => void;
  setDevice: (d: DeviceInfo | null) => void;
  setDemo: (v: boolean) => void;
  setKeyStates: (k: KeyStateMap) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  isDemo: true,
  device: null,
  keyStates: {},
  setStatus: (status) => set({ status }),
  setDevice: (device) => set({ device }),
  setDemo: (isDemo) => set({ isDemo }),
  setKeyStates: (keyStates) => set({ keyStates }),
  reset: () => set({ status: 'disconnected', device: null, keyStates: {} }),
}));
