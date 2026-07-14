import { beforeEach, describe, expect, it } from 'vitest';
import { useConfigStore } from '../store/useConfigStore';
import { ProtocolLoopbackDeviceService } from './ProtocolLoopbackDeviceService';
import { applyDeviceConfigToStore, diffDeviceConfig, storeToDeviceConfig } from './deviceSync';
import { mmToUnits } from './protocol';

/**
 * Full-path integration test WITHOUT hardware: UI store -> DeviceConfig ->
 * 64-byte packets -> reassemble -> DeviceConfig -> UI store. Proves the wire
 * protocol + mapping round-trip end to end (plan: "testing without hardware").
 */
describe('store <-> loopback device round-trip', () => {
  beforeEach(() => {
    useConfigStore.setState({
      activeProfileId: 'p1',
      selection: [],
      config: { p1: {} },
      keymap: { p1: { main: {}, fn1: {} } },
      layers: { p1: [{ id: 'main', name: 'Main Layer' }, { id: 'fn1', name: 'Fn Layer 1' }] },
      activeLayerId: 'main',
    });
  });

  it('writes UI edits to the device and reads them back identically', async () => {
    const store = useConfigStore.getState();
    // Make distinctive edits.
    store.setSelection(['k0_0']);
    store.setActuationForSelection(2.0);
    store.setRapidTriggerForSelection({ enabled: true, sensitivity: 0.4, continuous: true });
    store.assignKeycode('k0_0', 'KC_ESC');

    const svc = new ProtocolLoopbackDeviceService();
    await svc.connect();

    // Push the UI config to the (simulated) device, then read it back.
    await svc.writeConfig(storeToDeviceConfig());
    const readBack = await svc.readConfig();

    // The raw device values reflect the edits (mm -> units).
    const idx0 = 0; // FW_KEY_ORDER[0] === 'k0_0' with the placeholder ordering
    expect(readBack.actuation[idx0].actuationPoint).toBe(mmToUnits(2.0));
    expect(readBack.actuation[idx0].rtDown).toBeGreaterThan(0);
    expect(readBack.actuation[idx0].flags & 0x01).toBe(1); // continuous

    // Apply the device config back to a fresh store and confirm the UI values survive.
    useConfigStore.setState({ config: { p1: {} }, keymap: { p1: { main: {}, fn1: {} } } });
    applyDeviceConfigToStore(readBack);
    const after = useConfigStore.getState();
    const cfg = after.getKeyConfig('k0_0');
    expect(cfg.actuationPoint).toBeCloseTo(2.0, 1);
    expect(cfg.rapidTrigger.enabled).toBe(true);
    expect(cfg.rapidTrigger.continuous).toBe(true);
    expect(after.keymap.p1.main['k0_0']).toBe('KC_ESC');

    await svc.disconnect();
  });

  it('diff is empty after a clean round-trip (no redundant writes / flash wear)', async () => {
    const svc = new ProtocolLoopbackDeviceService();
    await svc.connect();
    const pushed = storeToDeviceConfig();
    await svc.writeConfig(pushed);
    const readBack = await svc.readConfig();
    // Hydrate store from device, then recompute — should be a no-op diff.
    applyDeviceConfigToStore(readBack);
    const patch = diffDeviceConfig(readBack, storeToDeviceConfig());
    expect(Object.keys(patch)).toHaveLength(0);
    await svc.disconnect();
  });
});
