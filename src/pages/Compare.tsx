import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useMission } from '../store/mission';
import { getPhoto } from '../storage/photos';

export default function Compare() {
  const params = useParams<{ a: string; b: string }>();
  const navigate = useNavigate();
  const photos = useMission((s) => s.photos);
  const [urlA, setUrlA] = useState<string | undefined>();
  const [urlB, setUrlB] = useState<string | undefined>();
  const [splitPct, setSplitPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const aWeek = Number(params.a);
  const bWeek = Number(params.b);

  useEffect(() => {
    const aPhoto = photos.find((p) => p.weekNumber === aWeek);
    const bPhoto = photos.find((p) => p.weekNumber === bWeek);
    const created: string[] = [];
    let cancelled = false;
    (async () => {
      let a: string | undefined;
      let b: string | undefined;
      if (aPhoto) {
        const blob = await getPhoto(aPhoto.photoKey);
        if (blob) {
          a = URL.createObjectURL(blob);
          created.push(a);
        }
      }
      if (bPhoto) {
        const blob = await getPhoto(bPhoto.photoKey);
        if (blob) {
          b = URL.createObjectURL(blob);
          created.push(b);
        }
      }
      if (cancelled) {
        created.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setUrlA(a);
      setUrlB(b);
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [aWeek, bWeek, photos]);

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
        <div>Week {aWeek}</div>
        <div>Week {bWeek}</div>
      </div>
    </div>
  );
}
