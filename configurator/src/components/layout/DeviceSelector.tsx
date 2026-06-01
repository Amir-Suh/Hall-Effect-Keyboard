import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Cpu, Loader2, Plug, Unplug } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useDevice } from '../../device/DeviceProvider';

const itemClass =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text outline-none data-[highlighted]:bg-panel-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40';

export function DeviceSelector() {
  const status = useConnectionStore((s) => s.status);
  const isDemo = useConnectionStore((s) => s.isDemo);
  const device = useConnectionStore((s) => s.device);
  const { connect, disconnect } = useDevice();

  const connected = status === 'connected';
  const connecting = status === 'connecting';

  const title = connected ? (device?.name ?? 'Device') : isDemo ? 'Wooting 60HE' : 'No device';
  const subtitle = connected
    ? `${device?.layout ?? ''} • Connected`
    : connecting
      ? 'Connecting…'
      : isDemo
        ? 'Demo device'
        : 'Enter demo mode to explore';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-left transition-colors hover:bg-panel-2">
          <div
            className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-md',
              connected ? 'bg-success/20 text-success' : 'bg-panel-2 text-muted',
            )}
          >
            {connecting ? <Loader2 size={15} className="animate-spin" /> : <Cpu size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{title}</div>
            <div className="truncate text-[10px] text-muted">{subtitle}</div>
          </div>
          <ChevronDown size={14} className="shrink-0 text-muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[206px] rounded-lg border border-border bg-panel p-1 shadow-xl"
        >
          {!connected ? (
            <DropdownMenu.Item
              className={itemClass}
              disabled={connecting}
              onSelect={(e) => {
                e.preventDefault();
                void connect();
              }}
            >
              <Plug size={14} /> {connecting ? 'Connecting…' : 'Connect demo device'}
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className={itemClass}
              onSelect={(e) => {
                e.preventDefault();
                void disconnect();
              }}
            >
              <Unplug size={14} /> Disconnect
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
