import { KeyboardVisualizer } from '../../components/shared/KeyboardVisualizer';
import { SectionHeader } from '../../components/shared/SectionHeader';
import { ConfigCard } from '../../components/shared/ConfigCard';
import { useConfigStore } from '../../store/useConfigStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { DEFAULT_KEY_CONFIG } from '../../types/config';
import { SwitchTravelControl } from './SwitchTravelControl';
import { VisualFeedbackPanel } from './VisualFeedbackPanel';

export function ActuationPointTab() {
  const selection = useConfigStore((s) => s.selection);
  const config = useConfigStore((s) => s.config);
  const activeProfileId = useConfigStore((s) => s.activeProfileId);
  const setActuation = useConfigStore((s) => s.setActuationForSelection);
  const selectAll = useConfigStore((s) => s.selectAll);
  const clearSelection = useConfigStore((s) => s.clearSelection);
  const liveDepth = useConnectionStore((s) => s.keyStates);

  const hasSel = selection.length > 0;
  const firstCfg = hasSel
    ? (config[activeProfileId]?.[selection[0]] ?? DEFAULT_KEY_CONFIG)
    : DEFAULT_KEY_CONFIG;

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-panel p-6">
        <KeyboardVisualizer liveDepth={liveDepth} />
      </div>

      <SectionHeader
        title="Actuation Point"
        info="The exact distance a key must travel before it registers a keypress (0.1–4.0 mm)."
        caption="To adjust actuation point, please select one or more keys first"
        selectionCount={selection.length}
        onSelectAll={selectAll}
        onDiscard={clearSelection}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ConfigCard
          title="Set Actuation Point"
          info="Drag the slider to set how deep each selected key must be pressed."
          disabled={!hasSel}
        >
          <p className="mb-4 text-sm leading-relaxed text-muted">
            Customize the actuation point by setting the exact distance a key must be pressed before
            it registers a keypress.
          </p>
          <div className="caption mb-2">
            Changing actuation point for {selection.length} key{selection.length === 1 ? '' : 's'}
          </div>
          <SwitchTravelControl
            value={firstCfg.actuationPoint}
            onChange={setActuation}
            disabled={!hasSel}
          />
        </ConfigCard>

        <ConfigCard title="Visual Feedback" info="Live key travel reported by the connected device.">
          <VisualFeedbackPanel />
        </ConfigCard>
      </div>
    </div>
  );
}
