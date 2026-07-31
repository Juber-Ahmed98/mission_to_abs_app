import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  onChange: (n: number) => void;
};

export default function WeeksInput({ value, onChange }: Props) {
  const [local, setLocal] = useState(String(value));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (local === '') return;
      const n = parseInt(local, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 52 && n !== value) {
        onChangeRef.current(n);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [local, value]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={52}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = parseInt(local, 10);
          if (!Number.isFinite(n) || n < 1 || n > 52) {
            setLocal(String(value));
          }
        }}
        className="h-11 w-20 rounded-card border border-border bg-surface-2 px-3 text-right text-lg tabular text-text outline-none"
      />
      <span className="text-sm text-text-muted">weeks</span>
    </div>
  );
}
