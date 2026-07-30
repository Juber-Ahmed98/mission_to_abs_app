// Ember fork of WeightInput — warm field, big tabular numerals (≥16px).

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
    <label
      className="flex min-h-[52px] items-center rounded-card border px-4"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--em-shadow)',
      }}
    >
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="—"
        aria-label={`Weight in ${unit}`}
        className="tabular flex-1 bg-transparent text-lg outline-none"
        style={{ color: 'var(--text)' }}
      />
      <span className="ml-2 select-none text-sm" style={{ color: 'var(--text-muted)' }}>
        {unit}
      </span>
    </label>
  );
}
