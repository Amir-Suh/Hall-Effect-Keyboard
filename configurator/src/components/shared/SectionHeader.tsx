import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

interface SectionHeaderProps {
  title: string;
  info?: ReactNode;
  /** Helper caption shown when nothing is selected. */
  caption?: string;
  selectionCount: number;
  onSelectAll: () => void;
  onDiscard: () => void;
}

export function SectionHeader({
  title,
  info,
  caption,
  selectionCount,
  onSelectAll,
  onDiscard,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {info && <InfoTooltip>{info}</InfoTooltip>}
      </div>
      <div className="flex items-center gap-3">
        {selectionCount === 0 && caption ? (
          <span className="caption">{caption}</span>
        ) : (
          <span className="caption text-accent">
            {selectionCount} key{selectionCount === 1 ? '' : 's'} selected
          </span>
        )}
        <button
          onClick={onSelectAll}
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-panel-2"
        >
          Select all keys
        </button>
        <button
          onClick={onDiscard}
          disabled={selectionCount === 0}
          className="text-xs font-medium text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          Discard selection
        </button>
      </div>
    </div>
  );
}
