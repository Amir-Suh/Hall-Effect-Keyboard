import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';

export function ProfileSwitcher() {
  const profiles = useConfigStore((s) => s.profiles);
  const activeId = useConfigStore((s) => s.activeProfileId);
  const setActive = useConfigStore((s) => s.setActiveProfile);
  const addProfile = useConfigStore((s) => s.addProfile);
  const active = profiles.find((p) => p.id === activeId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-1.5 transition-colors hover:bg-panel-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-accent text-[10px] font-bold text-accent-fg">
            {active?.name?.[0]?.toUpperCase() ?? 'P'}
          </span>
          <span className="text-sm font-medium">{active?.name ?? 'Profile'}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="center"
          sideOffset={6}
          className="z-50 w-56 rounded-lg border border-border bg-panel p-1 shadow-xl"
        >
          {profiles.map((p) => (
            <DropdownMenu.Item
              key={p.id}
              onSelect={() => setActive(p.id)}
              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-panel-2"
            >
              <span>{p.name}</span>
              {p.id === activeId && <Check size={14} className="text-accent" />}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => addProfile(`Profile ${profiles.length + 1}`)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted outline-none data-[highlighted]:bg-panel-2"
          >
            <Plus size={14} /> Add profile
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
