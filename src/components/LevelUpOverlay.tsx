// Level-up — "Higher ground" (DESIGN.md · moment 3): thin heavy-register config.
import { Flag } from 'lucide-react';
import CelebrationOverlay from './CelebrationOverlay';

type Props = { open: boolean; level: number; tier: string; onDismiss: () => void };

export default function LevelUpOverlay({ open, level, tier, onDismiss }: Props) {
  return (
    <CelebrationOverlay
      open={open}
      onDismiss={onDismiss}
      icon={<Flag size={26} strokeWidth={2.5} />}
      kicker="Higher ground"
      headline={level}
      context={tier}
    />
  );
}
