// Stage crossing (DESIGN.md · moment 4): kicker = stage + range, hero = zen line.
import { Flag } from 'lucide-react';
import { STAGE_ZEN, type Stage } from '../lib/stage';
import CelebrationOverlay from './CelebrationOverlay';

type Props = { open: boolean; stage: Stage | null; onDismiss: () => void };

export default function StageOverlay({ open, stage, onDismiss }: Props) {
  return (
    <CelebrationOverlay
      open={open && !!stage}
      onDismiss={onDismiss}
      icon={<Flag size={26} strokeWidth={2.5} />}
      kicker={stage ? `${stage.name} · ${stage.startDay}–${stage.endDay}` : ''}
      headline={stage ? (STAGE_ZEN[stage.name] ?? stage.name) : ''}
      headlineClassName="text-3xl font-bold leading-tight text-text"
    />
  );
}
