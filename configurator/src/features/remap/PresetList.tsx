import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { PRESETS, PRESET_BY_ID } from '../../data/presets';
import { useConfigStore } from '../../store/useConfigStore';

export function PresetList() {
  const applyPreset = useConfigStore((s) => s.applyPreset);
  const [pending, setPending] = useState<string | null>(null);
  const pendingPreset = pending ? PRESET_BY_ID[pending] : undefined;

  return (
    <>
      <div className="caption mb-2">Select a preset</div>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPending(p.id)}
            className="rounded-lg border border-border bg-panel-2 p-3 text-left transition-colors hover:border-accent"
          >
            <div className="text-sm font-medium">{p.name}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-muted">{p.description}</div>
          </button>
        ))}
      </div>

      <Dialog.Root open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-panel p-5 shadow-xl">
            <Dialog.Title className="text-base font-semibold">
              Apply “{pendingPreset?.name}” preset?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted">
              This overwrites the current layer’s key mapping.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-panel-2">
                Cancel
              </Dialog.Close>
              <button
                onClick={() => {
                  if (pending) applyPreset(pending);
                  setPending(null);
                }}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg transition-[filter] hover:brightness-110"
              >
                Apply preset
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
