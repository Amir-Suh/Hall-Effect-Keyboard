import * as Slider from '@radix-ui/react-slider';
import { cn } from '../../lib/cn';

interface ValueSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  unit?: string;
  showBubble?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  ariaLabel?: string;
}

export function ValueSlider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  leftLabel,
  rightLabel,
  unit,
  showBubble = true,
  orientation = 'horizontal',
  className,
  ariaLabel,
}: ValueSliderProps) {
  const vertical = orientation === 'vertical';

  return (
    <div className={cn(vertical ? 'flex flex-col items-center' : 'w-full', className)}>
      {showBubble && (
        <div className={cn('mb-1.5 flex', vertical ? 'justify-center' : 'justify-end')}>
          <span className="rounded-md bg-panel-2 px-2 py-0.5 text-xs font-semibold tabular-nums text-text">
            {value.toFixed(2)}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      )}
      <Slider.Root
        className={cn(
          'relative flex touch-none select-none items-center',
          vertical ? 'h-44 w-5 flex-col' : 'h-5 w-full',
        )}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        orientation={orientation}
        aria-label={ariaLabel ?? 'value'}
      >
        <Slider.Track
          className={cn(
            'relative rounded-full bg-panel-2',
            vertical ? 'h-full w-1.5' : 'h-1.5 w-full grow',
          )}
        >
          <Slider.Range className="absolute rounded-full bg-accent data-[disabled]:opacity-40" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full border-2 border-accent bg-panel shadow outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
          aria-label={ariaLabel ?? 'value'}
        />
      </Slider.Root>
      {(leftLabel || rightLabel) && !vertical && (
        <div className="caption mt-1.5 flex justify-between">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
