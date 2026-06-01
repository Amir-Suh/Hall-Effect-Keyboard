import * as Popover from '@radix-ui/react-popover';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** The (i) help affordance seen next to titles in the references. */
export function InfoTooltip({ children }: { children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="text-muted transition-colors hover:text-text"
        >
          <Info size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-border bg-panel p-3 text-xs leading-relaxed text-muted shadow-xl"
        >
          {children}
          <Popover.Arrow className="fill-[var(--panel)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
