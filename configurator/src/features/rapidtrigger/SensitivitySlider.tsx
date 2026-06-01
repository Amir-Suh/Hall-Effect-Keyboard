import { ValueSlider } from '../../components/shared/ValueSlider';
import { RT_SENS } from '../../types/config';

interface Props {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

/** Rapid-trigger sensitivity slider with HIGH ↔ LOW axis labels (mm). */
export function SensitivitySlider({ label, value, onChange, disabled }: Props) {
  return (
    <div>
      {label && <div className="caption mb-1.5">{label}</div>}
      <ValueSlider
        min={RT_SENS.min}
        max={RT_SENS.max}
        step={RT_SENS.step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        unit="mm"
        leftLabel="HIGH"
        rightLabel="LOW"
        ariaLabel={`${label ?? 'Sensitivity'} in millimetres`}
      />
    </div>
  );
}
