import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number | undefined;
  unit: 'kg' | 'lb';
  onChange: (v: number | undefined) => void;
};

export default function WeightInput({ value, unit, onChange }: Props) {
  const [local, setLocal] = useState(value !== undefined ? String(value) : '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(value !== undefined ? String(value) : '');
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (local === '') {
        if (value !== undefined) onChangeRef.current(undefined);
        return;
      }
      const n = parseFloat(local.replace(',', '.'));
      if (Number.isFinite(n) && n !== value) onChangeRef.current(n);
    }, 350);
    return () => clearTimeout(id);
  }, [local, value]);

  return (
    <label className="flex min-h-[52px] items-center rounded-card border border-border bg-surface px-4 shadow-panel">
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="—"
        className="flex-1 bg-transparent text-lg tabular text-text outline-none placeholder:text-text-subtle"
      />
      <span className="ml-2 select-none text-sm text-text-muted">{unit}</span>
    </label>
  );
}
