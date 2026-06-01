import { NavLink } from 'react-router-dom';
import {
  Crosshair,
  Gamepad2,
  Gauge,
  Keyboard,
  Layers,
  Palette,
  Replace,
  SlidersHorizontal,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { DeviceSelector } from './DeviceSelector';

interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { title: string; items: NavItemDef[] }[] = [
  {
    title: 'Profiles',
    items: [
      { to: '/quick-settings', label: 'Quick Settings', icon: Gauge },
      { to: '/profiles', label: 'My Profiles', icon: Layers },
    ],
  },
  {
    title: 'Keyboard Configuration',
    items: [
      { to: '/config/actuation-point', label: 'Actuation Point', icon: Crosshair },
      { to: '/config/rapid-trigger', label: 'Rapid Trigger', icon: Zap },
      { to: '/config/rgb', label: 'RGB Settings', icon: Palette },
      { to: '/config/remap', label: 'Remap', icon: Replace },
      { to: '/advanced', label: 'Advanced Keys', icon: SlidersHorizontal },
      { to: '/gamepad', label: 'Gamepad', icon: Gamepad2 },
    ],
  },
];

function NavItem({ to, label, icon: Icon }: NavItemDef) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-accent-soft font-medium text-accent'
            : 'text-muted hover:bg-panel-2 hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
          )}
          <Icon size={16} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-[230px] shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg">
          <Keyboard size={16} />
        </div>
        <span className="text-sm font-semibold">Keyboard Configuration</span>
      </div>

      <div className="px-3">
        <DeviceSelector />
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-3 py-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="caption mb-1 px-2">{group.title}</div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 text-[11px] text-muted">HE Configurator v0.1.0</div>
    </aside>
  );
}
