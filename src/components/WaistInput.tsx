import { useEffect, useRef, useState } from 'react';

type Props = {
  valueCm: number | undefined;
  unit: 'cm' | 'in';
  onChangeCm: (v: number | undefined) => void;
};

const CM_PER_INCH = 2.54;

function toDisplay(valueCm: number | undefined, unit: 'cm' | 'in'): string {
  if (valueCm === undefined) return '';
  if (unit === 'cm') return String(Math.round(valueCm * 10) / 10);
  return String(Math.round((valueCm / CM_PER_INCH) * 10) / 10);
}

function fromDisplay(raw: string, unit: 'cm' | 'in'): number | undefined {
  if (raw === '') return undefined;
  const n = parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return unit === 'cm' ? n : Math.round(n * CM_PER_INCH * 10) / 10;
}

export default function WaistInput({ valueCm, unit, onChangeCm }: Props) {
  const [local, setLocal] = useState(toDisplay(valueCm, unit));
  const onChangeRef = useRef(onChangeCm);
  onChangeRef.current = onChangeCm;

  useEffect(() => {
    setLocal(toDisplay(valueCm, unit));
  }, [valueCm, unit]);

  useEffect(() => {
    const id = setTimeout(() => {
      const next = fromDisplay(local, unit);
      if (next === undefined) {
        if (valueCm !== undefined) onChangeRef.current(undefined);
        return;
      }
      if (next !== valueCm) onChangeRef.current(next);
    }, 350);
    return () => clearTimeout(id);
  }, [local, unit, valueCm]);

  return (
    <label className="flex min-h-[52px] items-center rounded-card border border-border bg-surface px-4 shadow-panel">
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="—"
        className="min-w-0 flex-1 bg-transparent text-lg tabular text-text outline-none placeholder:text-text-subtle"
      />
      <span className="ml-2 select-none text-sm text-text-muted">{unit}</span>
    </label>
  );
}
