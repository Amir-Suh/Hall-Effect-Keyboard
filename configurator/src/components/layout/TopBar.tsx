import { Loader2, Redo2, Undo2 } from 'lucide-react';
import { ProfileSwitcher } from './ProfileSwitcher';
import { DemoModeButton } from './DemoModeButton';
import { ThemeToggle } from './ThemeToggle';
import { useConnectionStore } from '../../store/useConnectionStore';

/** Shows while a writeConfig round-trip (device eeconfig_save) is in flight. */
function SaveIndicator() {
  const saving = useConnectionStore((s) => s.saving);
  if (!saving) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted" title="Saving to device…">
      <Loader2 size={14} className="animate-spin" />
      Saving…
    </span>
  );
}

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-panel px-6">
      {/* left group: spacer keeps the profile switcher centered; save state sits here */}
      <div className="flex w-40 items-center">
        <SaveIndicator />
      </div>

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
