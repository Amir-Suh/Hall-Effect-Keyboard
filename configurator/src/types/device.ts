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
