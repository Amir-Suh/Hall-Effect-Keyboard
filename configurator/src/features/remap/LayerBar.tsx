import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useConfigStore } from '../../store/useConfigStore';

export function LayerBar() {
  const layers = useConfigStore((s) => s.layers);
  const pid = useConfigStore((s) => s.activeProfileId);
  const activeLayerId = useConfigStore((s) => s.activeLayerId);
  const setActiveLayer = useConfigStore((s) => s.setActiveLayer);
  const addLayer = useConfigStore((s) => s.addLayer);
  const removeLayer = useConfigStore((s) => s.removeLayer);

  const list = layers[pid] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="caption mr-1">Layers</span>
      {list.map((l) => (
        <button
          key={l.id}
          onClick={() => setActiveLayer(l.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
            l.id === activeLayerId
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border bg-panel text-muted hover:text-text',
          )}
        >
          {l.name}
          {l.id !== 'main' && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Remove ${l.name}`}
              onClick={(e) => {
                e.stopPropagation();
                removeLayer(l.id);
              }}
              className="opacity-50 transition-opacity hover:opacity-100"
            >
              <X size={12} />
            </span>
          )}
        </button>
      ))}
      <button
        onClick={addLayer}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-text"
      >
        <Plus size={12} /> Add Layer
      </button>
    </div>
  );
}
