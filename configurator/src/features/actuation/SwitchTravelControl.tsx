import { ValueSlider } from '../../components/shared/ValueSlider';
import { ACTUATION, MAX_TRAVEL } from '../../types/config';

interface Props {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

/**
 * The distinctive Actuation Point control: a keyswitch illustration whose
 * keycap depresses with the value, paired with a vertical mm slider + scale.
 */
export function SwitchTravelControl({ value, onChange, disabled }: Props) {
  const travelPx = 64; // vertical travel range of the keycap illustration
  const depress = (value / MAX_TRAVEL) * travelPx;

  return (
    <div className="flex flex-1 items-center justify-center gap-8 py-2">
      {/* Keyswitch illustration */}
      <svg width="104" height="160" viewBox="0 0 104 160" aria-hidden className="overflow-visible">
        {/* housing */}
        <rect
          x="22"
          y="86"
          width="60"
          height="60"
          rx="7"
          className="fill-[var(--panel-2)] stroke-[var(--border)]"
          strokeWidth="2"
        />
        <rect x="33" y="100" width="38" height="44" rx="4" className="fill-[var(--bg)]" />
        {/* stem (compresses) */}
        <rect
          x="45"
          y={48 + depress}
          width="14"
          height="50"
          rx="2"
          className="fill-[var(--accent)]"
          opacity="0.45"
        />
        {/* keycap (moves down with value) */}
        <g style={{ transform: `translateY(${depress}px)` }}>
          <rect x="16" y="24" width="72" height="28" rx="6" className="fill-[var(--accent)]" />
          <rect x="16" y="24" width="72" height="11" rx="6" className="fill-white" opacity="0.18" />
        </g>
        {/* actuation depth marker */}
        <line
          x1="8"
          x2="96"
          y1={56 + depress}
          y2={56 + depress}
          className="stroke-[var(--accent)]"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>

      {/* Vertical slider + scale */}
      <div className="flex items-stretch gap-3">
        <ValueSlider
          orientation="vertical"
          min={ACTUATION.min}
          max={ACTUATION.max}
          step={ACTUATION.step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          unit="mm"
          ariaLabel="Actuation point in millimetres"
        />
        <div className="flex flex-col justify-between py-7 text-[10px] tabular-nums text-muted">
          <span>{ACTUATION.max.toFixed(1)} mm</span>
          <span>{(MAX_TRAVEL / 2).toFixed(1)} mm</span>
          <span>{ACTUATION.min.toFixed(1)} mm</span>
        </div>
      </div>
    </div>
  );
}
