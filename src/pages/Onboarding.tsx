import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Camera,
  ClipboardList,
  Map,
  Ruler,
  Scale,
} from 'lucide-react';
import { useMission } from '../store/mission';
import { dayNumberFor, formatNice, todayISO } from '../lib/date';
import { resizeImage } from '../lib/image';
import { savePhoto } from '../storage/photos';
import { showUndo } from '../components/UndoToast';
import WeeksInput from '../components/WeeksInput';

type Screen = 0 | 1 | 2;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const settings = useMission((s) => s.settings);
  const setSettings = useMission((s) => s.setSettings);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const addPhoto = useMission((s) => s.addPhoto);
  const setMeasurement = useMission((s) => s.setMeasurement);

  const [screen, setScreen] = useState<Screen>(0);
  const [startDate, setStartDate] = useState(settings.startDate || todayISO());
  const [durationWeeks, setDurationWeeks] = useState(settings.durationWeeks || 15);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(settings.weightUnit);
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>(settings.waistUnit);
  const [goalWeight, setGoalWeight] = useState<string>(
    settings.goalWeight !== undefined ? String(settings.goalWeight) : '',
  );
  const [goalWaist, setGoalWaist] = useState<string>('');
  const [baselineWeight, setBaselineWeight] = useState<string>('');
  const [baselineWaist, setBaselineWaist] = useState<string>('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoLogged, setPhotoLogged] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = todayISO();
  const daysUntilStart =
    dayNumberFor(startDate, today) > 1
      ? dayNumberFor(startDate, today) - 1
      : 0;
  const startsInFuture = startDate > today;

  const commit = (finalize: boolean) => {
    const goalWeightNum = parseFloat(goalWeight.replace(',', '.'));
    const goalWaistNum = parseFloat(goalWaist.replace(',', '.'));
    const goalWaistCm = Number.isFinite(goalWaistNum)
      ? waistUnit === 'in'
        ? goalWaistNum * 2.54
        : goalWaistNum
      : undefined;

    setSettings({
      startDate,
      durationWeeks,
      weightUnit,
      waistUnit,
      goalWeight: Number.isFinite(goalWeightNum) ? goalWeightNum : undefined,
      goalWaistCm,
      onboarded: true,
    });

    if (finalize) {
      const baselineWeightNum = parseFloat(baselineWeight.replace(',', '.'));
      if (Number.isFinite(baselineWeightNum)) {
        setDayEntry(today, { weight: baselineWeightNum });
      }
      const baselineWaistNum = parseFloat(baselineWaist.replace(',', '.'));
      if (Number.isFinite(baselineWaistNum)) {
        const cm = waistUnit === 'in' ? baselineWaistNum * 2.54 : baselineWaistNum;
        setMeasurement({ weekNumber: 1, date: today, waistCm: cm });
      }
    }
    navigate('/', { replace: true });
  };

  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const blob = await resizeImage(file, 1600);
      const key = `week-1-${Date.now()}`;
      await savePhoto(key, blob);
      addPhoto({ weekNumber: 1, date: today, photoKey: key });
      setPhotoLogged(true);
      showUndo('Logged baseline photo', () => {
        setPhotoLogged(false);
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div
      className="min-h-dvh bg-bg text-text flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex-1 px-5 pt-10 pb-6">
        {screen === 0 && <Screen1 />}
        {screen === 1 && (
          <Screen2
            startDate={startDate}
            setStartDate={setStartDate}
            durationWeeks={durationWeeks}
            setDurationWeeks={setDurationWeeks}
            weightUnit={weightUnit}
            setWeightUnit={setWeightUnit}
            waistUnit={waistUnit}
            setWaistUnit={setWaistUnit}
            goalWeight={goalWeight}
            setGoalWeight={setGoalWeight}
            goalWaist={goalWaist}
            setGoalWaist={setGoalWaist}
          />
        )}
        {screen === 2 && (
          <Screen3
            weightUnit={weightUnit}
            waistUnit={waistUnit}
            baselineWeight={baselineWeight}
            setBaselineWeight={setBaselineWeight}
            baselineWaist={baselineWaist}
            setBaselineWaist={setBaselineWaist}
            photoBusy={photoBusy}
            photoLogged={photoLogged}
            onPickPhoto={() => fileRef.current?.click()}
            startsInFuture={startsInFuture}
            daysUntilStart={daysUntilStart}
            startDate={startDate}
          />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoFile}
        className="hidden"
      />

      <div className="px-5 pb-8">
        <div className="mb-5 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={[
                'h-1.5 w-6 rounded-pill transition-colors duration-200 ease-apple',
                i === screen ? 'bg-accent' : 'bg-border',
              ].join(' ')}
            />
          ))}
        </div>

        {screen === 0 && (
          <button
            type="button"
            onClick={() => setScreen(1)}
            className="block h-14 w-full rounded-pill bg-accent text-bg text-base font-medium"
          >
            Begin
          </button>
        )}
        {screen === 1 && (
          <>
            <button
              type="button"
              onClick={() => setScreen(2)}
              className="block h-14 w-full rounded-pill bg-accent text-bg text-base font-medium"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => commit(false)}
              className="mt-3 block w-full text-center text-sm text-text-muted"
            >
              Set goals later
            </button>
          </>
        )}
        {screen === 2 && (
          <>
            <button
              type="button"
              onClick={() => commit(true)}
              className="block h-14 w-full rounded-pill bg-accent text-bg text-base font-medium"
            >
              {startsInFuture ? `Begin in ${daysUntilStart} days` : 'Begin Day 1'}
            </button>
            <button
              type="button"
              onClick={() => commit(false)}
              className="mt-3 block w-full text-center text-sm text-text-muted"
            >
              Skip baseline
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Screen1() {
  return (
    <div>
      <h1 className="text-4xl tracking-tight">105 days.</h1>
      <h2 className="text-4xl tracking-tight text-text-muted">
        One yes/no a day.
      </h2>
      <p className="mt-8 max-w-sm text-base text-text-muted leading-relaxed">
        Mission to Abs is a witness, not a coach. Bring your own plan. The app
        holds you to it.
      </p>
      <ul className="mt-10 space-y-5">
        <FeatureRow
          icon={<ClipboardList size={22} strokeWidth={1.75} />}
          label="Daily log"
        />
        <FeatureRow
          icon={<Camera size={22} strokeWidth={1.75} />}
          label="Weekly photo + waist"
        />
        <FeatureRow
          icon={<Map size={22} strokeWidth={1.75} />}
          label="Walk your journey"
        />
      </ul>
    </div>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="text-base text-text">{label}</span>
    </li>
  );
}

type Screen2Props = {
  startDate: string;
  setStartDate: (v: string) => void;
  durationWeeks: number;
  setDurationWeeks: (v: number) => void;
  weightUnit: 'kg' | 'lb';
  setWeightUnit: (v: 'kg' | 'lb') => void;
  waistUnit: 'cm' | 'in';
  setWaistUnit: (v: 'cm' | 'in') => void;
  goalWeight: string;
  setGoalWeight: (v: string) => void;
  goalWaist: string;
  setGoalWaist: (v: string) => void;
};

function Screen2(p: Screen2Props) {
  return (
    <div>
      <h1 className="text-3xl tracking-tight">Set your mission.</h1>
      <p className="mt-2 text-sm text-text-muted">
        These can change later in Settings.
      </p>

      <div className="mt-8 space-y-3">
        <FieldRow
          icon={<Calendar size={18} strokeWidth={1.75} />}
          label="Start date"
        >
          <input
            type="date"
            value={p.startDate}
            onChange={(e) => {
              if (e.target.value) p.setStartDate(e.target.value);
            }}
            className="h-10 rounded-card border border-border bg-surface-2 px-3 text-sm text-text outline-none"
          />
        </FieldRow>

        <FieldRow icon={<Map size={18} strokeWidth={1.75} />} label="Duration">
          <WeeksInput value={p.durationWeeks} onChange={p.setDurationWeeks} />
        </FieldRow>

        <FieldRow icon={<Scale size={18} strokeWidth={1.75} />} label="Weight">
          <Segmented
            options={['kg', 'lb'] as const}
            value={p.weightUnit}
            onChange={p.setWeightUnit}
          />
        </FieldRow>

        <FieldRow icon={<Ruler size={18} strokeWidth={1.75} />} label="Waist">
          <Segmented
            options={['cm', 'in'] as const}
            value={p.waistUnit}
            onChange={p.setWaistUnit}
          />
        </FieldRow>

        <FieldRow
          icon={<Scale size={18} strokeWidth={1.75} />}
          label={`Goal weight (${p.weightUnit})`}
        >
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="—"
            value={p.goalWeight}
            onChange={(e) => p.setGoalWeight(e.target.value)}
            className="h-10 w-24 rounded-card border border-border bg-surface-2 px-3 text-right text-sm tabular-nums text-text outline-none"
          />
        </FieldRow>

        <FieldRow
          icon={<Ruler size={18} strokeWidth={1.75} />}
          label={`Goal waist (${p.waistUnit})`}
        >
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="—"
            value={p.goalWaist}
            onChange={(e) => p.setGoalWaist(e.target.value)}
            className="h-10 w-24 rounded-card border border-border bg-surface-2 px-3 text-right text-sm tabular-nums text-text outline-none"
          />
        </FieldRow>
      </div>
    </div>
  );
}

type Screen3Props = {
  weightUnit: 'kg' | 'lb';
  waistUnit: 'cm' | 'in';
  baselineWeight: string;
  setBaselineWeight: (v: string) => void;
  baselineWaist: string;
  setBaselineWaist: (v: string) => void;
  photoBusy: boolean;
  photoLogged: boolean;
  onPickPhoto: () => void;
  startsInFuture: boolean;
  daysUntilStart: number;
  startDate: string;
};

function Screen3(p: Screen3Props) {
  return (
    <div>
      <h1 className="text-3xl tracking-tight">Where you are today.</h1>
      <p className="mt-2 text-sm text-text-muted">
        Optional. Set a baseline so you can watch the change.
      </p>

      <div className="mt-8 space-y-3">
        <FieldRow icon={<Scale size={18} strokeWidth={1.75} />} label="Weight">
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
              value={p.baselineWeight}
              onChange={(e) => p.setBaselineWeight(e.target.value)}
              className="h-10 w-24 rounded-card border border-border bg-surface-2 px-3 text-right text-sm tabular-nums text-text outline-none"
            />
            <span className="text-sm text-text-muted">{p.weightUnit}</span>
          </div>
        </FieldRow>

        <FieldRow icon={<Ruler size={18} strokeWidth={1.75} />} label="Waist">
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
              value={p.baselineWaist}
              onChange={(e) => p.setBaselineWaist(e.target.value)}
              className="h-10 w-24 rounded-card border border-border bg-surface-2 px-3 text-right text-sm tabular-nums text-text outline-none"
            />
            <span className="text-sm text-text-muted">{p.waistUnit}</span>
          </div>
        </FieldRow>

        <button
          type="button"
          onClick={p.onPickPhoto}
          disabled={p.photoBusy}
          className="flex h-14 w-full items-center gap-3 rounded-card border border-border bg-surface px-4 text-text disabled:opacity-50"
        >
          <Camera size={18} strokeWidth={1.75} className="text-text-muted" />
          <span className="text-base">Today's photo</span>
          <span className="ml-auto text-sm text-text-muted">
            {p.photoBusy ? 'Saving…' : p.photoLogged ? 'Logged' : 'Optional'}
          </span>
        </button>
      </div>

      {p.startsInFuture && (
        <p className="mt-8 text-center text-sm text-text-muted">
          Starts {formatNice(p.startDate)} · {p.daysUntilStart}{' '}
          {p.daysUntilStart === 1 ? 'day' : 'days'} to go.
        </p>
      )}
    </div>
  );
}

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-card border border-border bg-surface px-4">
      <span className="text-text-muted">{icon}</span>
      <span className="flex-1 text-base text-text">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            'h-8 min-w-[44px] rounded-pill px-3 text-sm font-medium transition-colors duration-150 ease-apple',
            value === opt ? 'bg-bg text-text shadow-sm' : 'text-text-muted',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

