import { beforeEach, describe, expect, it } from 'vitest';
import { useConfigStore } from '../store/useConfigStore';
import { ACTUATION } from '../types/config';
import { ALL_KEY_IDS } from '../data/layout60';

describe('useConfigStore', () => {
  beforeEach(() => {
    useConfigStore.setState({ selection: [], config: { p1: {} }, activeProfileId: 'p1' });
  });

  it('selects and clears keys', () => {
    useConfigStore.getState().setSelection(['k0_0', 'k0_1']);
    expect(useConfigStore.getState().selection).toHaveLength(2);
    useConfigStore.getState().clearSelection();
    expect(useConfigStore.getState().selection).toHaveLength(0);
  });

  it('select all selects every key in the layout', () => {
    useConfigStore.getState().selectAll();
    expect(useConfigStore.getState().selection).toHaveLength(ALL_KEY_IDS.length);
  });

  it('clamps the actuation point to the valid range', () => {
    useConfigStore.getState().setSelection(['k0_0']);
    useConfigStore.getState().setActuationForSelection(99);
    expect(useConfigStore.getState().getKeyConfig('k0_0').actuationPoint).toBe(ACTUATION.max);
    useConfigStore.getState().setActuationForSelection(-5);
    expect(useConfigStore.getState().getKeyConfig('k0_0').actuationPoint).toBe(ACTUATION.min);
  });

  it('applies rapid trigger across the selection and counts enabled keys', () => {
    useConfigStore.getState().setSelection(['k1_1', 'k1_2']);
    useConfigStore.getState().setRapidTriggerForSelection({ enabled: true });
    expect(useConfigStore.getState().enabledRapidTriggerCount()).toBe(2);
  });

  it('assigns a keycode to a key on the active layer', () => {
    useConfigStore.getState().assignKeycode('k1_1', 'KC_UP');
    expect(useConfigStore.getState().getKeycodeId('k1_1')).toBe('KC_UP');
  });
});
