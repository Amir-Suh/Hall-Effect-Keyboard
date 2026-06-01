import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** Blue informational callout box (as in the Continuous Rapid Trigger card). */
export function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border border-callout-border bg-callout-bg p-3 text-xs text-text">
      <Info size={16} className="mt-0.5 shrink-0 text-accent" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
