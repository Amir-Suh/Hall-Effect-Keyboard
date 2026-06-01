import { KeyboardVisualizer } from '../../components/shared/KeyboardVisualizer';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { ConfigCard } from '../../components/shared/ConfigCard';
import { Toggle } from '../../components/shared/Toggle';
import { InfoCallout } from '../../components/shared/InfoCallout';
import { useConfigStore } from '../../store/useConfigStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { DEFAULT_RAPID_TRIGGER } from '../../types/config';
import { SensitivitySlider } from './SensitivitySlider';

export function RapidTriggerTab() {
  const selection = useConfigStore((s) => s.selection);
  const config = useConfigStore((s) => s.config);
  const activeProfileId = useConfigStore((s) => s.activeProfileId);
  const setRT = useConfigStore((s) => s.setRapidTriggerForSelection);
  const selectAll = useConfigStore((s) => s.selectAll);
  const clearSelection = useConfigStore((s) => s.clearSelection);
  const liveDepth = useConnectionStore((s) => s.keyStates);

  const hasSel = selection.length > 0;
  const profileCfg = config[activeProfileId] ?? {};
  const enabledCount = Object.values(profileCfg).filter((c) => c.rapidTrigger.enabled).length;
  const rt = hasSel
    ? (profileCfg[selection[0]]?.rapidTrigger ?? DEFAULT_RAPID_TRIGGER)
    : DEFAULT_RAPID_TRIGGER;

  const tunablesDisabled = !hasSel || !rt.enabled;

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-panel p-6">
        <KeyboardVisualizer liveDepth={liveDepth} />
      </div>

      <SectionHeader
        title="Rapid Trigger"
        info="Dynamically actuates and resets a key based on travel direction — ideal for fast re-presses."
        caption="To adjust rapid trigger, please select one or more keys first"
        selectionCount={selection.length}
        onSelectAll={selectAll}
        onDiscard={clearSelection}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Enable Rapid Trigger */}
        <ConfigCard
          title="Enable Rapid Trigger"
          disabled={!hasSel}
          headerControl={
            <Toggle
              checked={rt.enabled}
              onCheckedChange={(v) => setRT({ enabled: v })}
              disabled={!hasSel}
              label="Enable Rapid Trigger"
            />
          }
          footer={<div className="caption">Enabled on {enabledCount} keys</div>}
        >
          <p className="text-sm leading-relaxed text-muted">
            Rapid Trigger dynamically actuates and resets your key based on your intention to press
            or release the key. Rapid Trigger starts and ends after the actuation point.
          </p>
        </ConfigCard>

        {/* Rapid Trigger Sensitivity */}
        <ConfigCard
          title="Rapid Trigger Sensitivity"
          disabled={tunablesDisabled}
          headerControl={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Split</span>
              <Toggle
                checked={rt.split}
                onCheckedChange={(v) => setRT({ split: v })}
                disabled={tunablesDisabled}
                label="Split sensitivity"
              />
            </div>
          }
        >
          {rt.split ? (
            <div className="space-y-4">
              <SensitivitySlider
                label="Press sensitivity"
                value={rt.pressSensitivity}
                onChange={(v) => setRT({ pressSensitivity: v })}
                disabled={tunablesDisabled}
              />
              <SensitivitySlider
                label="Release sensitivity"
                value={rt.releaseSensitivity}
                onChange={(v) => setRT({ releaseSensitivity: v })}
                disabled={tunablesDisabled}
              />
            </div>
          ) : (
            <SensitivitySlider
              label="Sensitivity"
              value={rt.sensitivity}
              onChange={(v) => setRT({ sensitivity: v })}
              disabled={tunablesDisabled}
            />
          )}
        </ConfigCard>

        {/* Continuous Rapid Trigger */}
        <ConfigCard
          title="Continuous Rapid Trigger"
          disabled={tunablesDisabled}
          headerControl={
            <Toggle
              checked={rt.continuous}
              onCheckedChange={(v) => setRT({ continuous: v })}
              disabled={tunablesDisabled}
              label="Continuous Rapid Trigger"
            />
          }
        >
          <p className="mb-4 text-sm leading-relaxed text-muted">
            When enabled, Rapid Trigger ends when the entire key is released. When disabled, Rapid
            Trigger ends at the actuation point.
          </p>
          <InfoCallout>
            Enable this feature if you wish to continuously spam a key without worrying about the
            actuation point.
          </InfoCallout>
        </ConfigCard>
      </div>
    </div>
  );
}
