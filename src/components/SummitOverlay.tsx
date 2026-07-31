// The summit (DESIGN.md · moment 8): thin heavy-register config, fired on
// completing the final day's log. Day 105 in Reveal gold — the room is
// already wearing the stage hue, so the shared wash reads as the summit.
import { Mountain } from 'lucide-react';
import CelebrationOverlay from './CelebrationOverlay';

type Props = { open: boolean; total: number; onDismiss: () => void };

export default function SummitOverlay({ open, total, onDismiss }: Props) {
  return (
    <CelebrationOverlay
      open={open}
      onDismiss={onDismiss}
      icon={<Mountain size={26} strokeWidth={2.25} />}
      kicker="The summit"
      headline={`Day ${total}`}
      headlineClassName="tabular text-5xl font-bold leading-none text-text"
      context={`${total} days from the trailhead.`}
      dismissLabel="Tap anywhere"
    />
  );
}
