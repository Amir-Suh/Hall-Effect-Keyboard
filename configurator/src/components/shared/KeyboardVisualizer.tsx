import { useEffect, useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { LAYOUT_60, ROWS_TALL, UNITS_WIDE, type KeyDef } from '../../data/layout60';
import type { KeyStateMap } from '../../types/device';
import { useConfigStore } from '../../store/useConfigStore';
import { Keycap, type KeycapProps } from './Keycap';
import { cn } from '../../lib/cn';

const U = 100 / UNITS_WIDE; // % width per keycap unit
const V = 100 / ROWS_TALL; // % height per row

function cellStyle(k: KeyDef): CSSProperties {
  return {
    left: `${k.x * U}%`,
    top: `${k.row * V}%`,
    width: `${k.w * U}%`,
    height: `${V}%`,
  };
}

interface KeyboardVisualizerProps {
  /** Enable click/shift-click/drag selection (default true). */
  selectable?: boolean;
  /** Register keys as dnd-kit drop targets — must be inside a DndContext (default false). */
  droppable?: boolean;
  /** Override the legend shown on a key (e.g. remapped keycode). */
  getKeyLabel?: (k: KeyDef) => string;
  /** Per-key tint color (e.g. remap rainbow). */
  getKeyColor?: (k: KeyDef) => string | undefined;
  /** Live travel depths for press glow. */
  liveDepth?: KeyStateMap;
  /** Highlight a single edit target (remap). */
  activeKeyId?: string | null;
  /** Click handler (remap edit target). */
  onKeyClick?: (k: KeyDef) => void;
  className?: string;
}

/** Internal: a Keycap registered as a dnd-kit drop target. */
function DroppableKey({ keyDef, ...display }: { keyDef: KeyDef } & Omit<KeycapProps, 'style' | 'isOver'>) {
  const { setNodeRef, isOver } = useDroppable({ id: keyDef.id });
  return <Keycap ref={setNodeRef} isOver={isOver} style={cellStyle(keyDef)} {...display} />;
}

/**
 * Data-driven 60% keyboard. Shared by every tab. Reads/writes the shared
 * selection in the config store. Supports paint-selection and (in remap mode)
 * drag-and-drop drop targets.
 */
export function KeyboardVisualizer({
  selectable = true,
  droppable = false,
  getKeyLabel,
  getKeyColor,
  liveDepth,
  activeKeyId,
  onKeyClick,
  className,
}: KeyboardVisualizerProps) {
  const selection = useConfigStore((s) => s.selection);
  const selectKey = useConfigStore((s) => s.selectKey);
  const setSelection = useConfigStore((s) => s.setSelection);
  const addToSelection = useConfigStore((s) => s.addToSelection);
  const painting = useRef(false);

  useEffect(() => {
    const stop = () => {
      painting.current = false;
    };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  const handlePointerDown = (k: KeyDef, e: PointerEvent<HTMLButtonElement>) => {
    if (!selectable) return;
    e.preventDefault();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (additive) selectKey(k.id, true);
    else setSelection([k.id]);
    painting.current = true;
  };

  const handlePointerEnter = (k: KeyDef) => {
    if (!selectable || !painting.current) return;
    addToSelection(k.id);
  };

  return (
    <div className={cn('relative mx-auto aspect-[3/1] w-full max-w-[760px]', className)}>
      {LAYOUT_60.map((k) => {
        const depth = liveDepth?.[k.id] ?? 0;
        const display: Omit<KeycapProps, 'style' | 'isOver'> = {
          label: getKeyLabel ? getKeyLabel(k) : k.label,
          color: getKeyColor?.(k),
          depth,
          active: depth > 0.05,
          selected: selection.includes(k.id) || activeKeyId === k.id,
          title: k.label,
          onClick: onKeyClick ? () => onKeyClick(k) : undefined,
          onPointerDown: (e) => handlePointerDown(k, e),
          onPointerEnter: () => handlePointerEnter(k),
        };
        return droppable ? (
          <DroppableKey key={k.id} keyDef={k} {...display} />
        ) : (
          <Keycap key={k.id} style={cellStyle(k)} {...display} />
        );
      })}
    </div>
  );
}
