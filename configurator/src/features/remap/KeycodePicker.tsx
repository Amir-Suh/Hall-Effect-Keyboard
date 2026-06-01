import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CATEGORY_ORDER, KEYCODES } from '../../data/keycodes';
import type { Keycode } from '../../types/keymap';

function KeycodeChip({ keycode, onPick }: { keycode: Keycode; onPick?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: keycode.id,
    disabled: keycode.disabled,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={keycode.disabled}
      title={keycode.name}
      onClick={() => onPick?.(keycode.id)}
      className={cn(
        'flex h-9 items-center justify-center rounded-md border border-border bg-panel-2 px-1 text-[11px] font-medium text-text transition-colors hover:border-accent',
        keycode.disabled && 'cursor-not-allowed opacity-40',
        isDragging && 'opacity-30',
      )}
    >
      <span className="truncate px-0.5">{keycode.label}</span>
    </button>
  );
}

/** Searchable, categorized catalog of draggable keycodes. */
export function KeycodePicker({ onPick }: { onPick?: (id: string) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = query
    ? KEYCODES.filter(
        (k) => k.name.toLowerCase().includes(query) || k.label.toLowerCase().includes(query),
      )
    : KEYCODES;

  return (
    <div className="flex h-full min-h-[260px] flex-col">
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a keycode"
          className="w-full rounded-lg border border-border bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {CATEGORY_ORDER.map((cat) => {
          const items = filtered.filter((k) => k.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="caption mb-2">{cat}</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-1.5">
                {items.map((k) => (
                  <KeycodeChip key={k.id} keycode={k} onPick={onPick} />
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted">No keycodes match “{q}”.</p>
        )}
      </div>
    </div>
  );
}
