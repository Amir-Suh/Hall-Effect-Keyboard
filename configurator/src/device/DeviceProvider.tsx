import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { MockDeviceService } from './MockDeviceService';
import type { DeviceService } from './DeviceService';
import { useConnectionStore } from '../store/useConnectionStore';

interface DeviceContextValue {
  service: DeviceService;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

/**
 * Provides the active DeviceService and orchestrates connect/disconnect +
 * the live key-state subscription. Swap `MockDeviceService` here for a real
 * implementation later; nothing else in the UI changes.
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef<DeviceService>(new MockDeviceService());
  const unsubRef = useRef<null | (() => void)>(null);

  const value = useMemo<DeviceContextValue>(() => {
    const service = serviceRef.current;
    return {
      service,
      connect: async () => {
        const { setStatus, setDevice, setKeyStates } = useConnectionStore.getState();
        setStatus('connecting');
        try {
          const device = await service.connect('wooting-60he-demo');
          setDevice(device);
          setStatus('connected');
          unsubRef.current?.();
          unsubRef.current = service.subscribeKeyState((s) => setKeyStates(s));
        } catch {
          setStatus('disconnected');
        }
      },
      disconnect: async () => {
        const { setStatus, setDevice, setKeyStates } = useConnectionStore.getState();
        unsubRef.current?.();
        unsubRef.current = null;
        await service.disconnect();
        setDevice(null);
        setKeyStates({});
        setStatus('disconnected');
      },
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
