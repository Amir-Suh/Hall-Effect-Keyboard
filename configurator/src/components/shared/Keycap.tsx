import { forwardRef } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { cn } from '../../lib/cn';
import { MAX_TRAVEL } from '../../types/config';

export interface KeycapProps {
  label: string;
  selected?: boolean;
  /** Currently pressed (live feedback). */
  active?: boolean;
  /** Live travel depth in mm (drives glow intensity). */
  depth?: number;
  /** Remap rainbow tint. */
  color?: string;
  /** dnd-kit drop hover state. */
  isOver?: boolean;
  style?: CSSProperties;
  title?: string;
  onPointerDown?: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter?: (e: PointerEvent<HTMLButtonElement>) => void;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const Keycap = forwardRef<HTMLButtonElement, KeycapProps>(function Keycap(
  { label, selected, active, depth = 0, color, isOver, style, title, onPointerDown, onPointerEnter, onClick },
  ref,
) {
  const intensity = Math.max(0, Math.min(1, depth / MAX_TRAVEL));
  return (
    <div className="absolute p-[3px]" style={style}>
      <button
        ref={ref}
        type="button"
        title={title}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
        className={cn(
          'relative flex h-full w-full items-center justify-center overflow-hidden rounded-key border text-[10px] font-medium leading-none text-key-label transition-colors',
          'border-border bg-key hover:border-muted',
          selected && 'z-10 border-selected ring-2 ring-selected',
          isOver && 'z-10 ring-2 ring-accent',
        )}
      >
        {color && (
          <span
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: color, opacity: 0.9 }}
          />
        )}
        {active && (
          <span
            className="pointer-events-none absolute inset-0 bg-accent"
            style={{ opacity: 0.15 + intensity * 0.6 }}
          />
        )}
        <span
          className={cn(
            'relative z-[1] max-w-full truncate px-0.5',
            color && 'font-semibold text-black/80',
          )}
        >
          {label}
        </span>
      </button>
    </div>
  );
});
