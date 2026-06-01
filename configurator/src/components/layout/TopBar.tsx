import { Redo2, Undo2 } from 'lucide-react';
import { ProfileSwitcher } from './ProfileSwitcher';
import { DemoModeButton } from './DemoModeButton';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-panel px-6">
      {/* spacer to keep the profile switcher visually centered */}
      <div className="hidden w-40 md:block" />

      <ProfileSwitcher />

      <div className="flex items-center justify-end gap-2 md:w-40">
        <button
          disabled
          title="Undo (coming soon)"
          className="rounded-md p-1.5 text-muted opacity-40"
        >
          <Undo2 size={16} />
        </button>
        <button
          disabled
          title="Redo (coming soon)"
          className="rounded-md p-1.5 text-muted opacity-40"
        >
          <Redo2 size={16} />
        </button>
        <ThemeToggle />
        <DemoModeButton />
      </div>
    </header>
  );
}
