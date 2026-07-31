// The medium-register panels in precedence order (DESIGN.md): streak break,
// then perfect day, then the halfway note. The perfect-day panel never renders
// under a heavy overlay — it waits in flow until the takeover is dismissed.

import { Flag, Milestone, Tent } from 'lucide-react';
import MomentPanel from '../../components/MomentPanel';
import { XP } from '../../lib/xp';

type Props = {
  streakBreakOpen: boolean;
  canUseShelter: boolean;
  priorStreak: number;
  onPitchShelter: () => void;
  onWalkOn: () => void;
  perfectDayOpen: boolean;
  streak: number;
  halfway: boolean;
  heavyShowing: boolean;
};

const PERFECT_DAY_XP = XP.diet + XP.exercise + XP.perfectDayBonus;

export default function MomentStack(p: Props) {
  const showPerfect = p.perfectDayOpen && !p.heavyShowing;
  if (!p.streakBreakOpen && !showPerfect && !p.halfway) return null;

  return (
    <div className="mx-5 mb-5 space-y-3">
      {p.streakBreakOpen && (
        <MomentPanel
          icon={<Tent size={18} strokeWidth={2} />}
          title="A gap in yesterday's tracks."
          actions={[
            ...(p.canUseShelter
              ? [
                  {
                    label: 'Pitch the shelter',
                    onClick: p.onPitchShelter,
                    primary: true,
                  },
                ]
              : []),
            { label: 'Walk on', onClick: p.onWalkOn },
          ]}
        >
          {p.priorStreak} days walked without a break.{' '}
          {p.canUseShelter
            ? 'One shelter left in the pack — pitched, it covers yesterday.'
            : 'No shelters left in the pack.'}
        </MomentPanel>
      )}

      {showPerfect && (
        <MomentPanel
          icon={<Flag size={18} strokeWidth={2.25} />}
          iconTone="solid"
          title="Flag planted — a perfect day."
        >
          Both pillars · +{PERFECT_DAY_XP} XP
          {p.streak >= 2 ? ` · ${p.streak}-day walk behind it` : ''}
        </MomentPanel>
      )}

      {p.halfway && (
        <MomentPanel icon={<Milestone size={18} strokeWidth={2} />} title="Halfway.">
          Keep walking.
        </MomentPanel>
      )}
    </div>
  );
}
