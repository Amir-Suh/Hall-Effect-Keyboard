import * as Switch from '@radix-ui/react-switch';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onCheckedChange, disabled, label }: ToggleProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-panel-2 outline-none transition-colors data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform will-change-transform data-[state=checked]:translate-x-[18px]" />
    </Switch.Root>
  );
}
