import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
};

// Sane bounds for a body-fat percentage; values outside this range are ignored
// rather than committed (a typo, not a real reading).
const MIN = 1;
const MAX = 60;

export default function BodyFatInput({ value, onChange }: Props) {
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
      if (Number.isFinite(n) && n >= MIN && n <= MAX && n !== value) {
        onChangeRef.current(n);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [local, value]);

  return (
    <label className="flex min-h-[52px] items-center rounded-card border border-border bg-surface px-4 shadow-panel">
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        min={MIN}
        max={MAX}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="—"
        className="flex-1 bg-transparent text-lg tabular text-text outline-none placeholder:text-text-subtle"
      />
      <span className="ml-2 select-none text-sm text-text-muted">%</span>
    </label>
  );
}
