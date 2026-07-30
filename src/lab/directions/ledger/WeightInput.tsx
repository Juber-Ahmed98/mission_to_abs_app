// Ledger fork of WeightInput — a ruled entry line, not a boxed field.
// Serif numerals sit on the baseline; the unit reads as a column heading.

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
      className="flex min-h-[48px] items-baseline gap-2 border-b pb-1.5"
      style={{ borderColor: 'var(--border-strong)' }}
    >
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="—"
        aria-label={`Weight in ${unit}`}
        className="ld-serif tabular w-full flex-1 bg-transparent text-xl outline-none"
        style={{ color: 'var(--text)' }}
      />
      <span className="ld-caps select-none" style={{ color: 'var(--text-subtle)' }}>
        {unit}
      </span>
    </label>
  );
}
