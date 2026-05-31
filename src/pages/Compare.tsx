import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMission } from '../store/mission';
import { getPhoto } from '../storage/photos';
import { formatNice } from '../lib/date';
import type { WeekPhoto } from '../types';

type Resolved = {
  photo: WeekPhoto;
  weight?: number;
  weightUnit: 'kg' | 'lb';
};

export default function Compare() {
  const params = useParams<{ a: string; b: string }>();
  const navigate = useNavigate();
  const photos = useMission((s) => s.photos);
  const days = useMission((s) => s.days);
  const weightUnit = useMission((s) => s.settings.weightUnit);
  const history = useMission((s) => s.history);
  const [urlA, setUrlA] = useState<string | undefined>();
  const [urlB, setUrlB] = useState<string | undefined>();
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // A param may be a photo key (cross-mission: searches current + archived
  // missions) or, for backwards-compatible callers, a current-mission week
  // number. Keys look like `week-N-<timestamp>` so they never collide.
  const resolve = useMemo(() => {
    return (param: string | undefined): Resolved | undefined => {
      if (!param) return undefined;
      const inCurrent = photos.find((p) => p.photoKey === param);
      if (inCurrent) {
        return { photo: inCurrent, weight: days[inCurrent.date]?.weight, weightUnit };
      }
      for (const m of history) {
        const ph = m.photos.find((p) => p.photoKey === param);
        if (ph) {
          return {
            photo: ph,
            weight: m.days[ph.date]?.weight,
            weightUnit: m.settings.weightUnit,
          };
        }
      }
      const wk = Number(param);
      if (!Number.isNaN(wk)) {
        const ph = photos.find((p) => p.weekNumber === wk);
        if (ph) return { photo: ph, weight: days[ph.date]?.weight, weightUnit };
      }
      return undefined;
    };
  }, [photos, days, weightUnit, history]);

  const a = useMemo(() => resolve(params.a), [resolve, params.a]);
  const b = useMemo(() => resolve(params.b), [resolve, params.b]);

  useEffect(() => {
    const created: string[] = [];
    let cancelled = false;
    (async () => {
      let ua: string | undefined;
      let ub: string | undefined;
      if (a) {
        const blob = await getPhoto(a.photo.photoKey);
        if (blob) {
          ua = URL.createObjectURL(blob);
          created.push(ua);
        }
      }
      if (b) {
        const blob = await getPhoto(b.photo.photoKey);
        if (blob) {
          ub = URL.createObjectURL(blob);
          created.push(ub);
        }
      }
      if (cancelled) {
        created.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setUrlA(ua);
      setUrlB(ub);
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [a?.photo.photoKey, b?.photo.photoKey]);

  const formatWeight = (n: number, unit: string) =>
    `${n.toFixed(1).replace(/\.0$/, '')} ${unit}`;

  const caption = (r: Resolved | undefined) => {
    if (!r) return null;
    const date = formatNice(r.photo.date);
    return (
      <span className="text-2xs tabular text-text-subtle">
        {date}
        {r.weight !== undefined ? ` · ${formatWeight(r.weight, r.weightUnit)}` : ''}
      </span>
    );
  };

  const handleMove = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-text">
      <div
        className="absolute left-2 z-20"
        style={{ top: 'calc(env(safe-area-inset-top) + 6px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="rounded-full bg-black/40 p-2.5 backdrop-blur"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 select-none touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          handleMove(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1 || (e.pointerType === 'touch' && e.isPrimary)) {
            handleMove(e.clientX);
          }
        }}
      >
        {urlB && (
          <img
            src={urlB}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        )}
        {urlA && (
          <img
            src={urlA}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
            style={{ clipPath: `polygon(0 0, ${splitPct}% 0, ${splitPct}% 100%, 0 100%)` }}
          />
        )}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/80"
          style={{ left: `${splitPct}%` }}
        />
        <div
          className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90"
          style={{ left: `${splitPct}%` }}
        >
          <div className="mx-0.5 h-4 w-0.5 rounded bg-black/40" />
          <div className="mx-0.5 h-4 w-0.5 rounded bg-black/40" />
        </div>
      </div>

      <div
        className="flex justify-between px-5 py-3 text-sm text-text-muted"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <div className="flex flex-col">
          <span>Week {a?.photo.weekNumber ?? '—'}</span>
          {caption(a)}
        </div>
        <div className="flex flex-col items-end">
          <span>Week {b?.photo.weekNumber ?? '—'}</span>
          {caption(b)}
        </div>
      </div>
    </div>
  );
}
