import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { InfoTooltip } from './InfoTooltip';

interface ConfigCardProps {
  title: string;
  info?: ReactNode;
  /** Control rendered on the right of the card header (e.g. a Toggle). */
  headerControl?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ConfigCard({
  title,
  info,
  headerControl,
  footer,
  children,
  disabled,
  className,
}: ConfigCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-border bg-panel p-5 transition-opacity',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {info && <InfoTooltip>{info}</InfoTooltip>}
        </div>
        {headerControl}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
