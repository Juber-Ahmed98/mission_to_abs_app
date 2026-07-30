// Waypoint fork of WeightInput — a map-panel reading. Same debounce logic.

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
    <label className="wp-panel flex min-h-[52px] items-center px-4">
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
