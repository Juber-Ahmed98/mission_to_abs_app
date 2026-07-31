// The medium-register panels in precedence order (DESIGN.md): re-entry first
// in flow, then streak break (mutually exclusive by the boundary rule), then
// perfect day, then the halfway note. The perfect-day panel never renders
// under a heavy overlay — it waits in flow until the takeover is dismissed.

import { Link } from 'react-router-dom';
import { Flag, Milestone, Mountain, Tent } from 'lucide-react';
import MomentPanel from '../../components/MomentPanel';
import { XP } from '../../lib/xp';

type Props = {
  reentryOpen: boolean;
  campDayNum: number;
  stageName: string | undefined;
  daysToSummit: number;
  streakBreakOpen: boolean;
  canUseShelter: boolean;
  priorStreak: number;
  onPitchShelter: () => void;
  onWalkOn: () => void;
  perfectDayOpen: boolean;
  streak: number;
  halfway: boolean;
  /** Day 104 — the eve of the summit (DESIGN.md · moment 8). */
  summitEve: boolean;
  heavyShowing: boolean;
};

const PERFECT_DAY_XP = XP.diet + XP.exercise + XP.perfectDayBonus;

export default function MomentStack(p: Props) {
  const showPerfect = p.perfectDayOpen && !p.heavyShowing;
  if (
    !p.reentryOpen &&
    !p.streakBreakOpen &&
    !showPerfect &&
    !p.halfway &&
    !p.summitEve
  )
    return null;

  return (
    <div className="mx-5 mb-5 space-y-3">
      {p.reentryOpen && (
        <MomentPanel
          icon={<Tent size={18} strokeWidth={2} />}
          title="Back on the trail."
        >
          <p>
            Camp was Day {p.campDayNum} — the dotted stretch is behind you now.
            You're standing in {p.stageName ?? 'the walk'} with {p.daysToSummit}{' '}
            days to the summit.
          </p>
          <p className="mt-2 font-medium text-text">
            Today's log puts you back on the map.
          </p>
          <Link
            to="/journey"
            className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-stage underline-offset-4 hover:underline"
          >
            Mark the missed stretch
          </Link>
        </MomentPanel>
      )}

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

      {p.summitEve && (
        <MomentPanel
          icon={<Mountain size={18} strokeWidth={2} />}
          title="The summit is tomorrow."
        >
          One camp left. Walk in like you walked the rest.
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
