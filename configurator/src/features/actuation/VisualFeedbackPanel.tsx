import { Keyboard } from 'lucide-react';
import { cn } from '../../lib/cn';
import { EmptyState } from '../../components/shared/EmptyState';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useConfigStore } from '../../store/useConfigStore';
import { KEY_BY_ID } from '../../data/layout60';
import { MAX_TRAVEL } from '../../types/config';

/** Live per-key travel bars, fed by the (mock) device stream. */
export function VisualFeedbackPanel() {
  const status = useConnectionStore((s) => s.status);
  const keyStates = useConnectionStore((s) => s.keyStates);
  const getKeyConfig = useConfigStore((s) => s.getKeyConfig);

  if (status !== 'connected') {
    return (
      <EmptyState
        icon={<Keyboard size={28} />}
        message="Connect a keyboard to see the visual feedback."
      />
    );
  }

  const active = Object.entries(keyStates)
    .filter(([, d]) => d > 0.02)
    .slice(0, 12);

  return (
    <div className="flex h-full min-h-[180px] flex-col">
      <p className="mb-3 text-xs text-muted">
        Press keys on your keyboard — live travel is shown below. Bars turn green past their
        actuation point.
      </p>
      {active.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted">
          Waiting for key presses…
        </div>
      ) : (
        <div className="flex flex-1 items-end justify-center gap-2">
          {active.map(([id, depth]) => {
            const pct = Math.min(100, (depth / MAX_TRAVEL) * 100);
            const act = getKeyConfig(id).actuationPoint;
            const actPct = (act / MAX_TRAVEL) * 100;
            const triggered = depth >= act;
            return (
              <div key={id} className="flex w-7 flex-col items-center gap-1">
                <div className="relative h-28 w-3 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className={cn(
                      'absolute bottom-0 w-full rounded-full transition-[height] duration-75',
                      triggered ? 'bg-success' : 'bg-accent',
                    )}
                    style={{ height: `${pct}%` }}
                  />
                  <div
                    className="absolute w-full border-t border-dashed border-muted"
                    style={{ bottom: `${actPct}%` }}
                  />
                </div>
                <span className="max-w-[28px] truncate text-[9px] text-muted">
                  {KEY_BY_ID[id]?.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
