import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { MockDeviceService } from './MockDeviceService';
import { WebHidDeviceService } from './WebHidDeviceService';
import { ProtocolLoopbackDeviceService } from './ProtocolLoopbackDeviceService';
import type { DeviceService } from './DeviceService';
import { useConnectionStore } from '../store/useConnectionStore';
import { useConfigStore } from '../store/useConfigStore';
import { applyDeviceConfigToStore, diffDeviceConfig, storeToDeviceConfig } from './deviceSync';
import type { DeviceConfig } from '../types/device';

interface DeviceContextValue {
  service: DeviceService;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  resetConfig: () => Promise<void>;
  recalibrate: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

const SYNC_DEBOUNCE_MS = 500;

/**
 * Pick the transport for the current mode:
 *   - `?device=loopback` → the firmware-less protocol loopback (no hardware).
 *   - real hardware (not demo) + WebHID available → WebHidDeviceService.
 *   - otherwise → MockDeviceService (the demo).
 */
function createService(isDemo: boolean): DeviceService {
  const override =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('device');
  if (override === 'loopback') return new ProtocolLoopbackDeviceService();
  if (override === 'webhid') return new WebHidDeviceService();
  if (!isDemo && WebHidDeviceService.isSupported()) return new WebHidDeviceService();
  return new MockDeviceService();
}

/**
 * Provides the active DeviceService and orchestrates connect/disconnect, the
 * live key-state subscription, initial config hydration, and the debounced
 * writeConfig sync (config store → device).
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<DeviceService | null>(null);
  const unsubKeyRef = useRef<null | (() => void)>(null);
  const unsubStoreRef = useRef<null | (() => void)>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedRef = useRef<DeviceConfig | null>(null);

  const value = useMemo<DeviceContextValue>(() => {
    const getService = () => {
      if (!serviceRef.current) {
        serviceRef.current = createService(useConnectionStore.getState().isDemo);
      }
      return serviceRef.current;
    };

    const startSync = () => {
      // Baseline so the first store change diffs against what's on the device.
      lastPushedRef.current = storeToDeviceConfig();
      unsubStoreRef.current?.();
      unsubStoreRef.current = useConfigStore.subscribe(() => {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(async () => {
          const service = serviceRef.current;
          if (!service || useConnectionStore.getState().status !== 'connected') return;
          const next = storeToDeviceConfig();
          const patch = diffDeviceConfig(lastPushedRef.current, next);
          if (Object.keys(patch).length === 0) return;
          const { setSaving } = useConnectionStore.getState();
          try {
            setSaving(true);
            await service.writeConfig(patch);
            lastPushedRef.current = next;
          } catch {
            /* leave lastPushed unchanged so we retry on the next edit */
          } finally {
            setSaving(false);
          }
        }, SYNC_DEBOUNCE_MS);
      });
    };

    const stopSync = () => {
      unsubStoreRef.current?.();
      unsubStoreRef.current = null;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    };

    return {
      get service() {
        return getService();
      },
      connect: async () => {
        const { setStatus, setDevice, setKeyStates, isDemo } = useConnectionStore.getState();
        // Recreate the service so a mode change (demo ↔ real) picks the right transport.
        serviceRef.current = createService(isDemo);
        const service = serviceRef.current;
        setStatus('connecting');
        try {
          const device = await service.connect(isDemo ? 'demo' : 'webhid');
          setDevice(device);
          setStatus('connected');

          if (device.isDemo) {
            // Demo/loopback has no meaningful stored config — seed it from the UI.
            await service.writeConfig(storeToDeviceConfig());
          } else {
            // Real hardware is authoritative: hydrate the UI from the device.
            const cfg = await service.readConfig();
            applyDeviceConfigToStore(cfg);
          }

          unsubKeyRef.current?.();
          unsubKeyRef.current = service.subscribeKeyState((s) => setKeyStates(s));
          startSync();
        } catch {
          setStatus('disconnected');
        }
      },
      disconnect: async () => {
        const { setStatus, setDevice, setKeyStates } = useConnectionStore.getState();
        stopSync();
        unsubKeyRef.current?.();
        unsubKeyRef.current = null;
        await serviceRef.current?.disconnect();
        setDevice(null);
        setKeyStates({});
        setStatus('disconnected');
      },
      resetConfig: async () => {
        const service = serviceRef.current;
        if (!service) return;
        const { setSaving } = useConnectionStore.getState();
        try {
          setSaving(true);
          await service.resetConfig();
          const cfg = await service.readConfig();
          applyDeviceConfigToStore(cfg);
          lastPushedRef.current = storeToDeviceConfig();
        } finally {
          setSaving(false);
        }
      },
      recalibrate: async () => {
        await serviceRef.current?.recalibrate();
      },
    };
  }, []);

  useEffect(() => {
    return () => {
      unsubKeyRef.current?.();
      unsubStoreRef.current?.();
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevice must be used within a DeviceProvider');
  return ctx;
}
