// The Dashboard container: composition only. Derivations live in
// useDashboardData, celebration triggers in useCelebrations, sections in
// ./dashboard/*; the XP toast is fired by the app-level XpToastHost watcher.

import { useState } from 'react';
import { encouragement } from '../lib/encouragement';
import MissionRing from '../components/MissionRing';
import MissionCompleted from '../components/MissionCompleted';
import LevelUpOverlay from '../components/LevelUpOverlay';
import StageOverlay from '../components/StageOverlay';
import Greeting from './dashboard/Greeting';
import MomentStack from './dashboard/MomentStack';
import BannerStack from './dashboard/BannerStack';
import TodayCard from './dashboard/TodayCard';
import StatsStrip from './dashboard/StatsStrip';
import ShelterSheet from './dashboard/ShelterSheet';
import { useDashboardData } from './dashboard/useDashboardData';
import { useCelebrations } from './dashboard/useCelebrations';

export default function Dashboard() {
  const d = useDashboardData();
  const cele = useCelebrations({
    canLogToday: d.canLogToday,
    today: d.today,
    dayNum: d.dayNum,
    total: d.total,
    level: d.info.level,
    todayStatus: d.todayStatus,
    yesterday: d.yesterday,
    isLapse: d.isLapse,
    isBreak: d.isBreak,
    lastLogged: d.lastLogged,
  });
  const [shelterOpen, setShelterOpen] = useState(false);

  if (d.isPostMission) return <MissionCompleted />;

  return (
    <div className="pb-32" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Greeting
        today={d.today}
        dayNum={d.dayNum}
        stage={d.stage}
        streak={d.streak}
        isPreMission={d.isPreMission}
        daysUntilStart={d.isPreMission ? 1 - d.rawDay : 0}
        startDate={d.settings.startDate}
        nothingLoggedYet={d.canLogToday && d.todayStatus === 'missed'}
        showShield={d.canLogToday && d.streak >= 2 && d.shieldsAvailable}
        shieldCount={d.settings.streakShieldsRemaining}
        onShield={() => setShelterOpen(true)}
      />

      <section className="mx-5 mb-5 mt-1 rounded-card border border-border bg-surface px-4 pb-3 pt-2 shadow-panel">
        <MissionRing
          day={d.dayNum}
          totalDays={d.total}
          days={d.days}
          startDate={d.settings.startDate}
          todayStatus={d.todayStatus === 'missed' ? 'empty' : 'logged'}
        />
      </section>

      <MomentStack
        reentryOpen={cele.reentryOpen}
        campDayNum={d.campDayNum}
        stageName={d.stage?.name}
        daysToSummit={d.total - d.dayNum}
        streakBreakOpen={cele.streakBreakOpen}
        canUseShelter={d.canUseShelter}
        priorStreak={d.priorStreak}
        onPitchShelter={() => setShelterOpen(true)}
        onWalkOn={cele.closeStreakBreak}
        perfectDayOpen={cele.perfectDayOpen}
        streak={d.streak}
        halfway={d.isHalfwayDay}
        heavyShowing={cele.heavy !== null}
      />

      <BannerStack suppressed={cele.reentryOpen || cele.streakBreakOpen} />

      <TodayCard
        today={d.today}
        yesterday={d.yesterday}
        isPreMission={d.isPreMission}
        canLogToday={d.canLogToday}
        showQuickLogYesterday={d.showQuickLogYesterday}
      />

      <StatsStrip
        today={d.today}
        canLogToday={d.canLogToday}
        level={d.info.level}
        tier={d.tier}
        xpInLevel={d.info.xpInLevel}
        xpToNext={d.info.xpToNext}
      />

      <div className="px-5 pt-6 text-center text-sm text-text-muted">
        {encouragement({
          dayNumber: d.rawDay,
          totalDays: d.total,
          streak: d.streak,
          yesterdayStatus: d.yesterdayStatus,
          todayHasBoth: d.todayStatus === 'perfect',
          todayHasAny: d.todayHasAny,
        })}
      </div>

      <LevelUpOverlay
        open={cele.heavy === 'levelUp'}
        level={d.info.level}
        tier={d.tier}
        onDismiss={cele.dismissHeavy}
      />
      <StageOverlay
        open={cele.heavy === 'stage'}
        stage={cele.stage}
        onDismiss={cele.dismissHeavy}
      />

      <ShelterSheet
        open={shelterOpen}
        onClose={() => setShelterOpen(false)}
        yesterday={d.yesterday}
        priorStreak={d.priorStreak}
        canSpend={d.canUseShelter}
        onSpent={cele.closeStreakBreak}
      />
    </div>
  );
}
