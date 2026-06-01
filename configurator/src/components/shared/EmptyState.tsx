import type { ReactNode } from 'react';

export function EmptyState({ icon, message }: { icon?: ReactNode; message: string }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 text-center text-muted">
      {icon}
      <p className="max-w-[240px] text-sm">{message}</p>
    </div>
  );
}
