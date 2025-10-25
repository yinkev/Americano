import { StatCard } from './stat-card';
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';

export function StatsGrid({ summary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <StatCard
        title="Current Streak"
        value={summary.streak.current}
        unit="days"
        icon={<Flame className="size-6" />}
        color="energy"
        secondaryValue={`${summary.streak.longest} days`}
        secondaryLabel="Best"
      />
      <StatCard
        title="Completion Rate"
        value={(summary.completionRate * 100).toFixed(1)}
        unit="%"
        icon={<Target className="size-6" />}
        color="info"
        secondaryValue="80%"
        secondaryLabel="Target"
        footer={`${summary.missions.completed}/${summary.missions.total} missions`}
      />
      <StatCard
        title="Success Score"
        value={summary.successScore.toFixed(2)}
        icon={<Trophy className="size-6" />}
        color="success"
        secondaryValue="1.00"
        secondaryLabel="Max"
        footer="Average across all missions"
      />
      <StatCard
        title="Missions Completed"
        value={summary.missions.completed}
        icon={<TrendingUp className="size-6" />}
        color="clinical"
        secondaryValue={summary.missions.skipped}
        secondaryLabel="Skipped"
        footer="Last 7 days"
      />
    </div>
  );
}
