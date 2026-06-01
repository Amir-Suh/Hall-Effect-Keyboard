import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KeyboardVisualizer } from '../../components/shared/KeyboardVisualizer';
import { ConfigCard } from '../../components/shared/ConfigCard';
import { useConfigStore } from '../../store/useConfigStore';
import { KEYCODE_BY_ID, defaultKeycodeId } from '../../data/keycodes';
import type { KeyDef } from '../../data/layout60';
import { LayerBar } from './LayerBar';
import { KeycodePicker } from './KeycodePicker';
import { PresetList } from './PresetList';

export function RemapTab() {
  const keymap = useConfigStore((s) => s.keymap);
  const pid = useConfigStore((s) => s.activeProfileId);
  const lid = useConfigStore((s) => s.activeLayerId);
  const assignKeycode = useConfigStore((s) => s.assignKeycode);
  const resetKey = useConfigStore((s) => s.resetKey);

  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const layerMap = keymap[pid]?.[lid] ?? {};

  const getKeyLabel = (k: KeyDef) =>
    KEYCODE_BY_ID[layerMap[k.id] ?? defaultKeycodeId(k.label, k.code)]?.label || k.label;
  // Evoke the reference's colorful per-key lighting with a hue spread.
  const getKeyColor = (k: KeyDef) =>
    `hsl(${Math.round(k.row * 52 + k.x * 16) % 360} 65% 55%)`;

  const onDragStart = (e: DragStartEvent) => setActiveDrag(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over) assignKeycode(String(e.over.id), String(e.active.id));
    setActiveDrag(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="space-y-5">
        <LayerBar />

        <div className="rounded-card border border-border bg-panel p-6">
          <KeyboardVisualizer
            selectable={false}
            droppable
            getKeyLabel={getKeyLabel}
            getKeyColor={getKeyColor}
            activeKeyId={editTarget}
            onKeyClick={(k) => setEditTarget(k.id === editTarget ? null : k.id)}
          />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Remap</h2>
          {editTarget && (
            <button
              onClick={() => resetKey(editTarget)}
              className="text-xs font-medium text-muted transition-colors hover:text-text"
            >
              Reset selected key
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigCard
            title="Remap keys"
            info="Drag a keycode from the right onto any key, click a key then a keycode, or apply a preset."
          >
            <p className="mb-2 text-sm leading-relaxed text-muted">
              Changes made here will affect this profile and others that are linked.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Remap keys by dragging and dropping keys from the right onto your keyboard. Or pick a
              preset below.
            </p>
            <PresetList />
          </ConfigCard>

          <ConfigCard
            title="Keycodes"
            info="Drag a keycode onto a key. Tip: click a key to select it, then click a keycode to assign it."
          >
            <KeycodePicker
              onPick={(id) => {
                if (editTarget) assignKeycode(editTarget, id);
              }}
            />
          </ConfigCard>
        </div>
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div className="flex h-9 min-w-[40px] items-center justify-center rounded-md border border-accent bg-panel px-2 text-[11px] font-semibold text-text shadow-lg">
            {KEYCODE_BY_ID[activeDrag]?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
